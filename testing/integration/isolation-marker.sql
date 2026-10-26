-- Test-only guard schema. Load only into a newly created, disposable sigmo_itest
-- database after its reviewed schema dump. Never run against development/production.
CREATE SCHEMA sigmo_itest_control;

CREATE TABLE sigmo_itest_control.run_manifest (
  run_id TEXT PRIMARY KEY,
  marker_sha256 CHAR(64) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
