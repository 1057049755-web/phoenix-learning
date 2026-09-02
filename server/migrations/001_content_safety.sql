/* 凤凰花·智学内容迁移安全基线
 * 只建立审计与备份元数据，不删除、不重写 records，也不触碰真实业务数据。
 * 应用迁移前必须先导出 records 原始 JSON、行数和 SHA-256 校验值。
 */

CREATE TABLE IF NOT EXISTS migration_runs (
  id TEXT PRIMARY KEY,
  operation TEXT NOT NULL,
  status TEXT NOT NULL,
  actor_id TEXT,
  backup_ref TEXT,
  candidate_count INTEGER NOT NULL DEFAULT 0,
  detail_json TEXT NOT NULL DEFAULT '{}',
  started_at TEXT NOT NULL,
  finished_at TEXT
);

CREATE TABLE IF NOT EXISTS content_audit_manifests (
  id TEXT PRIMARY KEY,
  migration_run_id TEXT NOT NULL,
  record_id TEXT NOT NULL,
  collection_name TEXT NOT NULL,
  school_id TEXT,
  owner_id TEXT,
  category TEXT NOT NULL,
  reason_json TEXT NOT NULL DEFAULT '[]',
  record_hash TEXT NOT NULL,
  source_created_at TEXT,
  source_updated_at TEXT,
  source_deleted_at TEXT,
  decision TEXT NOT NULL DEFAULT 'review_required',
  decided_by TEXT,
  decided_at TEXT,
  created_at TEXT NOT NULL,
  UNIQUE(migration_run_id, record_id)
);

CREATE INDEX IF NOT EXISTS idx_content_audit_manifests_record
  ON content_audit_manifests(collection_name, record_id, decision);
