/* 凤凰花·智学学习领域结构
 * 只建立结构化数据表，不插入题目、教材正文、知识点正文或演示数据。
 */

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
  relation_type TEXT NOT NULL CHECK (relation_type IN ('prerequisite','alias','sequence','depth_variant','cross_textbook')),
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

CREATE TABLE IF NOT EXISTS report_runs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('subject','multi_subject')),
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

CREATE INDEX IF NOT EXISTS idx_curriculum_versions_subject_region ON curriculum_versions(subject_code, region_code, grade, status);
CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_parent ON knowledge_nodes(parent_id, subject_code, grade);
CREATE INDEX IF NOT EXISTS idx_question_items_subject_grade ON question_items(subject_code, grade, difficulty, status);
CREATE INDEX IF NOT EXISTS idx_assessment_templates_region_subject ON assessment_templates(region_code, subject_code, grade, year_label, status);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_key_status ON workflow_runs(workflow_key, status, started_at);
CREATE INDEX IF NOT EXISTS idx_report_runs_user_period ON report_runs(user_id, period_start, period_end, status);
