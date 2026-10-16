import { useEffect, useState } from "react";
import { supabase, supabaseConfigured } from "./lib/supabase.js";

function friendlyError(error, mode) {
  const message = String(error?.message || "").toLowerCase();
  if (message.includes("invalid login credentials")) return "E-mail ou senha inválidos.";
  if (message.includes("email not confirmed")) return "Confirme seu e-mail antes de entrar.";
  if (message.includes("user already registered")) return "Já existe uma conta com esse e-mail. Entre em vez de criar outra.";
  if (message.includes("password should be at least")) return "A senha não atende ao mínimo exigido pelo serviço.";
  if (message.includes("rate limit") || message.includes("too many requests")) return "Muitas tentativas em pouco tempo. Aguarde antes de tentar novamente.";
  return mode === "signup"
    ? "Não foi possível criar a conta. Verifique os dados e tente novamente."
    : "Não foi possível entrar. Verifique os dados e tente novamente.";
}

export default function AuthPanel() {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [errorText, setErrorText] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!supabaseConfigured) return undefined;
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (alive) setUser(data.session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (alive) setUser(session?.user ?? null);
    });
    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, []);

  async function submit(event) {
    event.preventDefault();
    setNotice("");
    setErrorText("");
    if (!supabaseConfigured) return;
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin }
        });
        if (error) throw error;
        setNotice(data.session
          ? "Conta criada. Você já está autenticado."
          : "Cadastro recebido. Confira seu e-mail para confirmar a conta antes de entrar.");
        setPassword("");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        setNotice("Sessão iniciada.");
        setPassword("");
      }
    } catch (err) {
      setErrorText(friendlyError(err, mode));
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    setNotice("");
    setErrorText("");
    const { error } = await supabase.auth.signOut();
    if (error) setErrorText("Não foi possível encerrar a sessão neste momento.");
    else setNotice("Sessão encerrada.");
  }

  return <section className="page-content auth-page">
    <div className="eyebrow">IDENTIDADE / ÁREA DE INVESTIGADORES</div>
    <h1 className="page-title">Acesso <em>controlado.</em></h1>
    <p className="page-intro">A conta servirá para identificar submissões e acompanhar futuras etapas. Criar uma conta não libera respostas, áreas secretas ou privilégios especiais.</p>
    {!supabaseConfigured ? <div className="auth-panel">
      <span className="auth-status pending">CONFIGURAÇÃO PENDENTE</span>
      <h2>O serviço de autenticação ainda não está ligado à interface.</h2>
      <p>Configure <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> no ambiente de build. Use somente a chave publicável no navegador. A chave service_role e as chaves de criptografia nunca devem sair do servidor.</p>
    </div> : user ? <div className="auth-panel">
      <span className="auth-status">SESSÃO ATIVA</span>
      <h2>Investigador autenticado.</h2>
      <p className="auth-email">{user.email}</p>
      <p>O acesso autenticado ainda não habilita submissões até que as etapas públicas e o fluxo de revisão estejam prontos.</p>
      <button className="button outline auth-submit" onClick={signOut}>Encerrar sessão <span>↗</span></button>
      {notice && <p className="auth-message">{notice}</p>}
      {errorText && <p className="auth-error" role="alert">{errorText}</p>}
    </div> : <div className="auth-panel">
      <div className="auth-tabs">
        <button className={mode === "signin" ? "auth-tab selected" : "auth-tab"} onClick={() => { setMode("signin"); setNotice(""); setErrorText(""); }}>Entrar</button>
        <button className={mode === "signup" ? "auth-tab selected" : "auth-tab"} onClick={() => { setMode("signup"); setNotice(""); setErrorText(""); }}>Criar conta</button>
      </div>
      <form onSubmit={submit} className="auth-form">
        <label htmlFor="arpg-email">E-mail</label>
        <input id="arpg-email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} />
        <label htmlFor="arpg-password">Senha</label>
        <input id="arpg-password" type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} required minLength={12} maxLength={128} value={password} onChange={e => setPassword(e.target.value)} />
        {mode === "signup" && <p className="auth-help">Use uma senha longa e exclusiva, com pelo menos 12 caracteres.</p>}
        <button className="button primary auth-submit" type="submit" disabled={busy}>{busy ? "Processando..." : mode === "signin" ? "Entrar no arquivo" : "Criar conta"} <span>↗</span></button>
      </form>
      {notice && <p className="auth-message" role="status">{notice}</p>}
      {errorText && <p className="auth-error" role="alert">{errorText}</p>}
      <p className="auth-footnote">Sem login social, sem rastreamento publicitário e sem acesso automático a respostas privadas.</p>
    </div>}
  </section>;
}
