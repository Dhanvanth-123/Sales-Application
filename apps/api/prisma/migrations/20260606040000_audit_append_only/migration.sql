-- Phase 5 hardening (plan §6.3, §13, R6): make audit_log append-only at the
-- database boundary. A BEFORE UPDATE/DELETE row trigger rejects any modification,
-- independent of the application. (TRUNCATE bypasses row triggers, which is how the
-- dev seed resets the table — see prisma/seed.ts.)

CREATE OR REPLACE FUNCTION audit_log_immutable() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only (no UPDATE/DELETE allowed)';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_log_no_modify ON "audit_log";
CREATE TRIGGER audit_log_no_modify
  BEFORE UPDATE OR DELETE ON "audit_log"
  FOR EACH ROW EXECUTE FUNCTION audit_log_immutable();
