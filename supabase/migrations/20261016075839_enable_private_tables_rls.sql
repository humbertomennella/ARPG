-- Keep private operational tables inaccessible through the public Data API.
-- No policies are intentionally created here. Server-side access must be designed
-- separately with explicit least-privilege permissions.
alter table arpg_private.submissions enable row level security;
alter table arpg_private.audit_events enable row level security;
