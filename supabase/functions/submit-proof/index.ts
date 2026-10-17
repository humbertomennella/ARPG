import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

function decodeBase64(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function encodeBase64(value: Uint8Array): string {
  let binary = "";
  for (const byte of value) binary += String.fromCharCode(byte);
  return btoa(binary);
}

async function hmacHex(secret: Uint8Array, value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", secret, { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const signed = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)));
  return Array.from(signed, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(value: Uint8Array): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", value));
  return Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json(503, { error: "submission_service_not_configured" });
  }

  const authorization = req.headers.get("Authorization") ?? "";
  const tokenMatch = authorization.match(/^Bearer\s+(.+)$/i);
  if (!tokenMatch) return json(401, { error: "authentication_required" });

  let body: unknown;
  try {
    const declaredLength = Number(req.headers.get("content-length") ?? "0");
    if (declaredLength > 16_000) return json(413, { error: "request_too_large" });
    if (!req.body) return json(400, { error: "invalid_request" });
    const reader = req.body.getReader();
    const chunks: Uint8Array[] = [];
    let totalBytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > 16_000) {
        await reader.cancel();
        return json(413, { error: "request_too_large" });
      }
      chunks.push(value);
    }
    const combined = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.byteLength;
    }
    body = JSON.parse(new TextDecoder().decode(combined));
  } catch {
    return json(400, { error: "invalid_request" });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return json(400, { error: "invalid_request" });
  }
  const { stageSlug, proof } = body as Record<string, unknown>;
  if (typeof stageSlug !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(stageSlug) || stageSlug.length > 80) {
    return json(400, { error: "invalid_request" });
  }
  if (typeof proof !== "string" || proof.trim().length < 1 || proof.length > 5000) {
    return json(400, { error: "invalid_request" });
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${tokenMatch[1]}` } },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser(tokenMatch[1]);
  if (userError || !userData.user) return json(401, { error: "authentication_required" });

  try {
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: secretRows, error: secretError } = await admin.rpc("get_arpg_submission_secrets");
    const secretRow = Array.isArray(secretRows) ? secretRows[0] : null;
    if (secretError || !secretRow ||
        typeof secretRow.encryption_key !== "string" ||
        typeof secretRow.hmac_key !== "string") {
      console.error("ARPG submission key retrieval failed");
      return json(503, { error: "submission_service_not_configured" });
    }

    let encryptionKey: Uint8Array;
    let hmacKey: Uint8Array;
    try {
      encryptionKey = decodeBase64(secretRow.encryption_key);
      hmacKey = decodeBase64(secretRow.hmac_key);
    } catch {
      return json(503, { error: "submission_service_not_configured" });
    }
    if (encryptionKey.length !== 32 || hmacKey.length < 32) {
      return json(503, { error: "submission_service_not_configured" });
    }

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const cryptoKey = await crypto.subtle.importKey("raw", encryptionKey, { name: "AES-GCM" }, false, ["encrypt"]);
    const plaintext = new TextEncoder().encode(proof.trim());
    const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, cryptoKey, plaintext));
    const ciphertextBase64 = encodeBase64(ciphertext);
    const ivBase64 = encodeBase64(iv);
    const submitterHash = await hmacHex(hmacKey, userData.user.id);
    const proofDigest = await sha256Hex(ciphertext);

    const { data, error } = await admin.rpc("record_arpg_submission", {
      p_stage_slug: stageSlug,
      p_submitter_hash: submitterHash,
      p_proof_digest: proofDigest,
      p_proof_ciphertext: ciphertextBase64,
      p_proof_iv: ivBase64,
    });

    if (error) {
      // Do not log proof, tokens, hashes, ciphertext, or provider error details.
      console.error("ARPG submission persistence failed");
      return json(503, { error: "submission_temporarily_unavailable" });
    }
    if (data !== true) {
      // Keep unknown, unpublished, and rate-limited stages indistinguishable.
      return json(400, { error: "submission_not_accepted" });
    }
    return json(202, { status: "received", message: "Submission received for manual review." });
  } catch {
    console.error("ARPG submission processing failed");
    return json(503, { error: "submission_temporarily_unavailable" });
  }
});
