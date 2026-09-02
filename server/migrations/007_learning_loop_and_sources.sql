/* 学习闭环与合规资料入口
 * 旧的通用 records 快照不删除；新增结构化表只承载新流程产生的数据。
 */

ALTER TABLE source_documents ADD COLUMN school_id TEXT;
ALTER TABLE source_documents ADD COLUMN content_text TEXT;

CREATE TABLE IF NOT EXISTS learning_assignments (
  id TEXT PRIMARY KEY, school_id TEXT, teacher_id TEXT NOT NULL, title TEXT NOT NULL,
  subject_code TEXT NOT NULL, grade INTEGER NOT NULL CHECK (grade IN (7,8,9)), template_id TEXT,
  rubric_json TEXT NOT NULL DEFAULT '{}', due_at TEXT, status TEXT NOT NULL DEFAULT 'published',
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS learning_submissions (
  id TEXT PRIMARY KEY, assignment_id TEXT NOT NULL, school_id TEXT, student_id TEXT NOT NULL,
  attempt_no INTEGER NOT NULL DEFAULT 1, status TEXT NOT NULL DEFAULT 'draft', answers_json TEXT NOT NULL DEFAULT '{}',
  submitted_at TEXT, score REAL, total REAL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
  UNIQUE(assignment_id, student_id, attempt_no)
);

CREATE TABLE IF NOT EXISTS learning_feedback (
  id TEXT PRIMARY KEY, submission_id TEXT NOT NULL, teacher_id TEXT NOT NULL, score REAL NOT NULL,
  total REAL NOT NULL, comment TEXT NOT NULL DEFAULT '', reasons_json TEXT NOT NULL DEFAULT '[]',
  released_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS wrongbook_entries (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, submission_id TEXT, question_id TEXT,
  subject_code TEXT NOT NULL, knowledge_node_id TEXT, note TEXT NOT NULL DEFAULT '',
  review_status TEXT NOT NULL DEFAULT 'unreviewed', next_review_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
  UNIQUE(user_id, submission_id, question_id)
);

CREATE TABLE IF NOT EXISTS learning_notes (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, subject_code TEXT, knowledge_node_id TEXT,
  title TEXT NOT NULL, content TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS learning_notifications (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, kind TEXT NOT NULL, title TEXT NOT NULL,
  body TEXT NOT NULL, read_at TEXT, created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_learning_assignments_school_status ON learning_assignments(school_id,status,updated_at);
CREATE INDEX IF NOT EXISTS idx_learning_submissions_student_status ON learning_submissions(student_id,status,updated_at);
CREATE INDEX IF NOT EXISTS idx_learning_feedback_submission ON learning_feedback(submission_id,updated_at);
CREATE INDEX IF NOT EXISTS idx_wrongbook_user_review ON wrongbook_entries(user_id,review_status,next_review_at);
CREATE INDEX IF NOT EXISTS idx_learning_notifications_user ON learning_notifications(user_id,read_at,created_at);

INSERT OR IGNORE INTO migration_runs
  (id,operation,status,backup_ref,candidate_count,detail_json,started_at,finished_at)
VALUES
  ('migration-learning-loop-and-sources-20260902','learning_loop_and_compliant_source_entry','completed',NULL,0,'{"legacy_records_preserved":true,"structured_tables_added":true,"direct_collection_policy":"public_https_only"}',datetime('now'),datetime('now'));
