-- Phase 5 hardening (plan §6.3, §13). Run as the DB OWNER after migrations.
-- Makes audit_log append-only at the database boundary for the application role.
--
-- Replace :app_role with the least-privilege role the API connects as
-- (distinct from the migration/owner role). Example:
--
--   psql "$DATABASE_URL" -v app_role=caliper_app -f audit_append_only.sql
--
-- NOTE: deliberately NOT applied automatically in Phase 0 — dev uses a single
-- superuser role. Wire this in during Phase 5 once a separate app role exists.

REVOKE UPDATE, DELETE, TRUNCATE ON TABLE audit_log FROM :app_role;
GRANT INSERT, SELECT ON TABLE audit_log TO :app_role;

-- Optional: belt-and-braces trigger that blocks UPDATE/DELETE for everyone
-- except the owner (uncomment to enforce regardless of grants).
--
-- CREATE OR REPLACE FUNCTION audit_log_immutable() RETURNS trigger AS $$
-- BEGIN
--   RAISE EXCEPTION 'audit_log is append-only';
-- END;
-- $$ LANGUAGE plpgsql;
--
-- CREATE TRIGGER audit_log_no_update BEFORE UPDATE OR DELETE ON audit_log
--   FOR EACH ROW EXECUTE FUNCTION audit_log_immutable();
