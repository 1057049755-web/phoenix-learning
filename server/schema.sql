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

CREATE TABLE IF NOT EXISTS model_registry_providers (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('official_api','cloud_api','aggregator')),
  docs_url TEXT NOT NULL,
  pricing_url TEXT,
  data_policy_url TEXT,
  models_endpoint TEXT NOT NULL,
  pricing_endpoint TEXT,
  availability_endpoint TEXT,
  api_base TEXT,
  auth_env TEXT,
  status TEXT NOT NULL DEFAULT 'inactive',
  last_synced_at TEXT,
  last_error TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS model_registry_models (
  id TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL,
  canonical_key TEXT NOT NULL,
  provider_model_id TEXT NOT NULL,
  upstream_provider TEXT,
  official_name TEXT NOT NULL,
  exact_version TEXT,
  model_type TEXT NOT NULL,
  capabilities_json TEXT NOT NULL DEFAULT '{}',
  limits_json TEXT NOT NULL DEFAULT '{}',
  pricing_json TEXT NOT NULL DEFAULT '{}',
  availability_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'available',
  source_url TEXT NOT NULL,
  source_hash TEXT NOT NULL,
  last_verified_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(provider_id, provider_model_id)
);

CREATE TABLE IF NOT EXISTS model_registry_sync_runs (
  id TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL,
  status TEXT NOT NULL,
  source_url TEXT NOT NULL,
  requested_at TEXT NOT NULL,
  finished_at TEXT,
  model_count INTEGER NOT NULL DEFAULT 0,
  changed_count INTEGER NOT NULL DEFAULT 0,
  source_hash TEXT,
  error_message TEXT
);

CREATE TABLE IF NOT EXISTS model_registry_history (
  id TEXT PRIMARY KEY,
  model_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  snapshot_json TEXT NOT NULL,
  source_hash TEXT NOT NULL,
  captured_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_model_registry_models_provider_status ON model_registry_models(provider_id,status,model_type);
CREATE INDEX IF NOT EXISTS idx_model_registry_sync_runs_provider_time ON model_registry_sync_runs(provider_id,requested_at);

CREATE TABLE IF NOT EXISTS workflow_runs (
  id TEXT PRIMARY KEY,
  workflow_key TEXT NOT NULL,
  actor_id TEXT,
  input_hash TEXT NOT NULL,
  model_id TEXT,
  status TEXT NOT NULL,
  quality_json TEXT NOT NULL DEFAULT '{}',
  usage_json TEXT NOT NULL DEFAULT '{}',
  trace_json TEXT NOT NULL DEFAULT '{}',
  started_at TEXT NOT NULL,
  finished_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_workflow_runs_key_status ON workflow_runs(workflow_key,status,started_at);

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

-- 学习领域与官方参考目录。只保存结构化元数据，不保存教材正文、题目或整卷内容。
CREATE TABLE IF NOT EXISTS curriculum_versions (
  id TEXT PRIMARY KEY,
  subject_code TEXT NOT NULL,
  region_code TEXT NOT NULL,
  publisher TEXT NOT NULL,
  version_label TEXT NOT NULL,
  grade INTEGER NOT NULL CHECK (grade IN (7, 8, 9)),
  book_label TEXT,
  source_url TEXT NOT NULL,
  source_type TEXT NOT NULL,
  edition_year TEXT,
  verified_at TEXT,
  confidence REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS knowledge_nodes (
  id TEXT PRIMARY KEY,
  subject_code TEXT NOT NULL,
  curriculum_version_id TEXT,
  parent_id TEXT,
  grade INTEGER NOT NULL CHECK (grade IN (7, 8, 9)),
  unit_label TEXT,
  chapter_label TEXT,
  title TEXT NOT NULL,
  aliases_json TEXT NOT NULL DEFAULT '[]',
  competency_json TEXT NOT NULL DEFAULT '[]',
  common_errors_json TEXT NOT NULL DEFAULT '[]',
  source_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS knowledge_relations (
  id TEXT PRIMARY KEY,
  from_node_id TEXT NOT NULL,
  to_node_id TEXT NOT NULL,
  relation_type TEXT NOT NULL CHECK (relation_type IN ('prerequisite', 'alias', 'sequence', 'depth_variant', 'cross_textbook')),
  evidence_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  UNIQUE(from_node_id, to_node_id, relation_type)
);

CREATE TABLE IF NOT EXISTS question_items (
  id TEXT PRIMARY KEY,
  subject_code TEXT NOT NULL,
  grade INTEGER NOT NULL CHECK (grade IN (7, 8, 9)),
  region_code TEXT,
  curriculum_version_id TEXT,
  question_type TEXT NOT NULL,
  difficulty INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
  points REAL NOT NULL,
  question_json TEXT NOT NULL,
  source_json TEXT NOT NULL DEFAULT '{}',
  generation_json TEXT NOT NULL DEFAULT '{}',
  review_json TEXT NOT NULL DEFAULT '{}',
  similarity_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft',
  version INTEGER NOT NULL DEFAULT 1,
  created_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS assessment_templates (
  id TEXT PRIMARY KEY,
  region_code TEXT NOT NULL,
  subject_code TEXT NOT NULL,
  grade INTEGER NOT NULL CHECK (grade IN (7, 8, 9)),
  year_label TEXT NOT NULL,
  source_url TEXT NOT NULL,
  verified_at TEXT,
  structure_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS report_runs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('subject', 'multi_subject')),
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  subjects_json TEXT NOT NULL,
  eligibility_json TEXT NOT NULL,
  statistics_json TEXT NOT NULL,
  explanation_json TEXT,
  model_id TEXT,
  status TEXT NOT NULL DEFAULT 'statistics_only',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS source_documents (
  id TEXT PRIMARY KEY,
  title TEXT,
  source_url TEXT,
  source_type TEXT NOT NULL,
  acquisition_method TEXT NOT NULL,
  content_hash TEXT,
  completeness REAL,
  confidence REAL,
  copyright_status TEXT,
  failure_reason TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS plot_artifacts (
  id TEXT PRIMARY KEY,
  skill_key TEXT NOT NULL,
  description_json TEXT NOT NULL,
  source_code TEXT,
  svg_text TEXT,
  png_ref TEXT,
  accessibility_text TEXT,
  black_white_check_json TEXT NOT NULL DEFAULT '{}',
  validation_json TEXT NOT NULL DEFAULT '{}',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_curriculum_versions_subject_region
  ON curriculum_versions(subject_code, region_code, grade, status);
CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_parent
  ON knowledge_nodes(parent_id, subject_code, grade);
CREATE INDEX IF NOT EXISTS idx_question_items_subject_grade
  ON question_items(subject_code, grade, difficulty, status);
CREATE INDEX IF NOT EXISTS idx_assessment_templates_region_subject
  ON assessment_templates(region_code, subject_code, grade, year_label, status);
CREATE INDEX IF NOT EXISTS idx_report_runs_user_period
  ON report_runs(user_id, period_start, period_end, status);

-- 学生学习闭环：作业、草稿/提交、教师反馈、错题、笔记和通知分表保存。
CREATE TABLE IF NOT EXISTS learning_assignments (
  id TEXT PRIMARY KEY,
  school_id TEXT,
  teacher_id TEXT NOT NULL,
  title TEXT NOT NULL,
  subject_code TEXT NOT NULL,
  grade INTEGER NOT NULL CHECK (grade IN (7,8,9)),
  template_id TEXT,
  rubric_json TEXT NOT NULL DEFAULT '{}',
  due_at TEXT,
  status TEXT NOT NULL DEFAULT 'published',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS learning_submissions (
  id TEXT PRIMARY KEY,
  assignment_id TEXT NOT NULL,
  school_id TEXT,
  student_id TEXT NOT NULL,
  attempt_no INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft',
  answers_json TEXT NOT NULL DEFAULT '{}',
  submitted_at TEXT,
  score REAL,
  total REAL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(assignment_id, student_id, attempt_no)
);

CREATE TABLE IF NOT EXISTS learning_feedback (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL,
  teacher_id TEXT NOT NULL,
  score REAL NOT NULL,
  total REAL NOT NULL,
  comment TEXT NOT NULL DEFAULT '',
  reasons_json TEXT NOT NULL DEFAULT '[]',
  released_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS wrongbook_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  submission_id TEXT,
  question_id TEXT,
  subject_code TEXT NOT NULL,
  knowledge_node_id TEXT,
  note TEXT NOT NULL DEFAULT '',
  review_status TEXT NOT NULL DEFAULT 'unreviewed',
  next_review_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(user_id, submission_id, question_id)
);

CREATE TABLE IF NOT EXISTS learning_notes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  subject_code TEXT,
  knowledge_node_id TEXT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS learning_notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  read_at TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_learning_assignments_school_status
  ON learning_assignments(school_id, status, updated_at);
CREATE INDEX IF NOT EXISTS idx_learning_submissions_student_status
  ON learning_submissions(student_id, status, updated_at);
CREATE INDEX IF NOT EXISTS idx_learning_feedback_submission
  ON learning_feedback(submission_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_wrongbook_user_review
  ON wrongbook_entries(user_id, review_status, next_review_at);
CREATE INDEX IF NOT EXISTS idx_learning_notifications_user
  ON learning_notifications(user_id, read_at, created_at);
