-- 凤凰花·智学 v3 / D1 schema
-- 仅保存结构与真实业务记录；不包含预置题目、教材正文或演示数据。

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS schools (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  region_code TEXT NOT NULL,
  school_system TEXT NOT NULL CHECK (school_system IN ('six_three','five_four')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS campuses (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS academic_years (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  label TEXT NOT NULL,
  starts_on TEXT NOT NULL,
  ends_on TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS terms (
  id TEXT PRIMARY KEY,
  academic_year_id TEXT NOT NULL,
  label TEXT NOT NULL,
  starts_on TEXT NOT NULL,
  ends_on TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  school_id TEXT,
  name_ciphertext TEXT NOT NULL,
  phone_ciphertext TEXT NOT NULL,
  phone_digest TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  password_algorithm TEXT NOT NULL DEFAULT 'pbkdf2-sha256',
  role TEXT NOT NULL CHECK (role IN ('admin','academic','teacher','student')),
  profile_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_login_at TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_digest TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  revoked_at TEXT
);

CREATE TABLE IF NOT EXISTS classes (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  campus_id TEXT,
  name TEXT NOT NULL,
  stage_year INTEGER NOT NULL,
  school_system TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS class_snapshots (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL,
  academic_year_id TEXT NOT NULL,
  term_id TEXT NOT NULL,
  snapshot_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS class_memberships (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  academic_year_id TEXT NOT NULL,
  term_id TEXT NOT NULL,
  starts_at TEXT NOT NULL,
  ends_at TEXT,
  status TEXT NOT NULL,
  change_reason TEXT,
  operated_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS teacher_subject_assignments (
  id TEXT PRIMARY KEY,
  teacher_id TEXT NOT NULL,
  class_id TEXT NOT NULL,
  subject_code TEXT NOT NULL,
  academic_year_id TEXT NOT NULL,
  term_id TEXT NOT NULL,
  assignment_type TEXT NOT NULL DEFAULT 'primary',
  starts_at TEXT NOT NULL,
  ends_at TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  operated_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS class_subject_offerings (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL,
  subject_code TEXT NOT NULL,
  academic_year_id TEXT NOT NULL,
  term_id TEXT NOT NULL,
  foreign_language TEXT,
  science_route TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  source_policy_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(class_id, subject_code, academic_year_id, term_id)
);

CREATE TABLE IF NOT EXISTS promotion_batches (
  id TEXT PRIMARY KEY,
  idempotency_key TEXT NOT NULL UNIQUE,
  source_term_id TEXT NOT NULL,
  target_term_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'preview',
  diff_json TEXT NOT NULL,
  operated_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  executed_at TEXT,
  rolled_back_at TEXT
);

CREATE TABLE IF NOT EXISTS transfer_records (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  from_class_id TEXT,
  to_class_id TEXT,
  from_school_id TEXT,
  to_school_id TEXT,
  type TEXT NOT NULL,
  effective_at TEXT NOT NULL,
  reason TEXT,
  operated_by TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS course_completions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  subject_code TEXT NOT NULL,
  academic_year_id TEXT NOT NULL,
  term_id TEXT NOT NULL,
  status TEXT NOT NULL,
  completed_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS graduation_archives (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  school_id TEXT NOT NULL,
  academic_year_id TEXT NOT NULL,
  archived_at TEXT NOT NULL,
  archive_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS records (
  id TEXT PRIMARY KEY,
  collection_name TEXT NOT NULL,
  school_id TEXT,
  owner_id TEXT,
  record_json TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_records_collection ON records(collection_name, deleted_at);
CREATE INDEX IF NOT EXISTS idx_memberships_user ON class_memberships(user_id, term_id, status);
CREATE INDEX IF NOT EXISTS idx_assignments_class ON teacher_subject_assignments(class_id, term_id, status);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  actor_id TEXT,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  detail_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS model_providers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('official_api','cloud_api','aggregator')),
  docs_url TEXT NOT NULL,
  pricing_url TEXT,
  data_policy_url TEXT,
  status TEXT NOT NULL DEFAULT 'unknown',
  last_verified_at TEXT
);

CREATE TABLE IF NOT EXISTS api_models (
  id TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL,
  model_id TEXT NOT NULL,
  version TEXT,
  capabilities_json TEXT NOT NULL,
  pricing_json TEXT NOT NULL,
  limits_json TEXT NOT NULL,
  data_policy_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unknown',
  last_verified_at TEXT,
  UNIQUE(provider_id, model_id, version)
);

CREATE TABLE IF NOT EXISTS model_sync_runs (
  id TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL,
  status TEXT NOT NULL,
  source_url TEXT,
  error_message TEXT,
  started_at TEXT NOT NULL,
  finished_at TEXT
);
