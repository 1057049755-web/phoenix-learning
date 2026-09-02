/* 凤凰花·智学网络服务 v3
 * 只有 D1 和经过鉴权的网络会话可以读写业务数据。
 * 没有数据库或没有会话时，服务明确返回不可用，不再回退浏览器数据或示例题库。
 */
'use strict';

import { normalizeModelsPayload, stableJson } from './model-registry.mjs';
import { MODEL_PROVIDER_DIRECTORY, providerInsertArgs } from './provider-directory.mjs';
import { acquirePublicSource, createManualSource } from './source-pipeline.mjs';
import { renderVectorSvg, validatePlotPayload, plotArtifactRecord } from './plot-service.mjs';
import { calculateReportStatistics, evaluateReport, flattenGradingRows } from './report-service.mjs';

const COLLECTIONS = new Set([
  'users', 'schools', 'campuses', 'academic_years', 'terms', 'classes', 'class_snapshots',
  'class_memberships', 'student_enrollments', 'teacher_employments', 'teacher_subject_assignments',
  'class_subject_offerings', 'promotion_batches', 'transfer_records', 'course_completions',
  'graduation_archives', 'resources', 'notices', 'papers', 'grading', 'plans', 'profiles',
  'knowledge', 'content_tags', 'goals', 'plan_tasks', 'learning_events',
  'recommendation_feedback', 'review_schedule', 'data_dictionary', 'question_manifests',
  'explanations', 'source_records', 'audit'
]);

const ROLE_WRITES = {
  admin: new Set(COLLECTIONS),
  academic: new Set(['users', 'classes', 'class_snapshots', 'class_memberships', 'student_enrollments', 'teacher_employments', 'teacher_subject_assignments', 'class_subject_offerings', 'promotion_batches', 'transfer_records', 'course_completions', 'graduation_archives', 'notices', 'audit']),
  teacher: new Set(['resources', 'papers', 'grading', 'plans', 'profiles', 'question_manifests', 'explanations', 'learning_events', 'recommendation_feedback', 'review_schedule', 'audit']),
  student: new Set(['profiles', 'learning_events', 'recommendation_feedback', 'review_schedule'])
};

const CONTENT_AUDIT_COLLECTIONS = new Set([
  'resources', 'papers', 'grading', 'knowledge', 'content_tags', 'question_manifests',
  'explanations', 'source_records'
]);

const REAL_RECORD_COLLECTIONS = new Set([
  'users', 'schools', 'campuses', 'academic_years', 'terms', 'classes', 'class_snapshots',
  'class_memberships', 'student_enrollments', 'teacher_employments', 'teacher_subject_assignments',
  'class_subject_offerings', 'promotion_batches', 'transfer_records', 'course_completions',
  'graduation_archives', 'grading', 'plans', 'profiles', 'goals', 'plan_tasks',
  'learning_events', 'recommendation_feedback', 'review_schedule', 'audit'
]);

let schemaPromise = null;
async function ensureCoreSchema(env) {
  if (!env.DB) return false;
  if (!schemaPromise) schemaPromise = env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, school_id TEXT, name_ciphertext TEXT NOT NULL, phone_ciphertext TEXT NOT NULL,
      phone_digest TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL,
      password_algorithm TEXT NOT NULL DEFAULT 'pbkdf2-sha256',
      role TEXT NOT NULL CHECK (role IN ('admin','academic','teacher','student')),
      profile_json TEXT NOT NULL DEFAULT '{}', status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL, last_login_at TEXT
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, token_digest TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL, created_at TEXT NOT NULL, revoked_at TEXT
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS records (
      id TEXT PRIMARY KEY, collection_name TEXT NOT NULL, school_id TEXT,
      owner_id TEXT, record_json TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL, deleted_at TEXT
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY, actor_id TEXT, action TEXT NOT NULL, target_type TEXT,
      target_id TEXT, detail_json TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS migration_runs (
      id TEXT PRIMARY KEY, operation TEXT NOT NULL, status TEXT NOT NULL,
      actor_id TEXT, backup_ref TEXT, candidate_count INTEGER NOT NULL DEFAULT 0,
      detail_json TEXT NOT NULL DEFAULT '{}', started_at TEXT NOT NULL,
      finished_at TEXT
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS content_audit_manifests (
      id TEXT PRIMARY KEY, migration_run_id TEXT NOT NULL, record_id TEXT NOT NULL,
      collection_name TEXT NOT NULL, school_id TEXT, owner_id TEXT, category TEXT NOT NULL,
      reason_json TEXT NOT NULL DEFAULT '[]', record_hash TEXT NOT NULL,
      source_created_at TEXT, source_updated_at TEXT, source_deleted_at TEXT,
      decision TEXT NOT NULL DEFAULT 'review_required', decided_by TEXT, decided_at TEXT,
      created_at TEXT NOT NULL,
      UNIQUE(migration_run_id, record_id)
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS model_registry_providers (
      id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
      kind TEXT NOT NULL CHECK (kind IN ('official_api','cloud_api','aggregator')),
      docs_url TEXT NOT NULL, pricing_url TEXT, data_policy_url TEXT,
      models_endpoint TEXT NOT NULL, pricing_endpoint TEXT, availability_endpoint TEXT,
      api_base TEXT, auth_env TEXT, status TEXT NOT NULL DEFAULT 'inactive',
      last_synced_at TEXT, last_error TEXT, metadata_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS model_registry_models (
      id TEXT PRIMARY KEY, provider_id TEXT NOT NULL, canonical_key TEXT NOT NULL,
      provider_model_id TEXT NOT NULL, upstream_provider TEXT, official_name TEXT NOT NULL,
      exact_version TEXT, model_type TEXT NOT NULL, capabilities_json TEXT NOT NULL DEFAULT '{}',
      limits_json TEXT NOT NULL DEFAULT '{}', pricing_json TEXT NOT NULL DEFAULT '{}',
      availability_json TEXT NOT NULL DEFAULT '{}', status TEXT NOT NULL DEFAULT 'available',
      source_url TEXT NOT NULL, source_hash TEXT NOT NULL, last_verified_at TEXT NOT NULL,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
      UNIQUE(provider_id, provider_model_id)
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS model_registry_sync_runs (
      id TEXT PRIMARY KEY, provider_id TEXT NOT NULL, status TEXT NOT NULL,
      source_url TEXT NOT NULL, requested_at TEXT NOT NULL, finished_at TEXT,
      model_count INTEGER NOT NULL DEFAULT 0, changed_count INTEGER NOT NULL DEFAULT 0,
      source_hash TEXT, error_message TEXT
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS model_registry_history (
      id TEXT PRIMARY KEY, model_id TEXT NOT NULL, provider_id TEXT NOT NULL,
      snapshot_json TEXT NOT NULL, source_hash TEXT NOT NULL, captured_at TEXT NOT NULL
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS workflow_runs (
      id TEXT PRIMARY KEY, workflow_key TEXT NOT NULL, actor_id TEXT, input_hash TEXT NOT NULL,
      model_id TEXT, status TEXT NOT NULL, quality_json TEXT NOT NULL DEFAULT '{}',
      usage_json TEXT NOT NULL DEFAULT '{}', trace_json TEXT NOT NULL DEFAULT '{}',
      started_at TEXT NOT NULL, finished_at TEXT
    )`),
    env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_model_registry_models_provider_status ON model_registry_models(provider_id,status,model_type)'),
    env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_model_registry_sync_runs_provider_time ON model_registry_sync_runs(provider_id,requested_at)'),
    env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_workflow_runs_key_status ON workflow_runs(workflow_key,status,started_at)'),
    env.DB.prepare('CREATE INDEX IF NOT EXISTS sessions_token_digest_idx ON sessions(token_digest)'),
    env.DB.prepare('CREATE INDEX IF NOT EXISTS records_collection_school_idx ON records(collection_name,school_id,updated_at)'),
    env.DB.prepare('CREATE INDEX IF NOT EXISTS content_audit_manifests_record_idx ON content_audit_manifests(collection_name,record_id,decision)')
  ]).then(() => true).catch(() => { schemaPromise = null; return false; });
  return schemaPromise;
}

let referenceSchemaPromise = null;
let providerDirectoryPromise = null;
let learningSchemaPromise = null;
async function ensureProviderDirectory(env) {
  if (!env.DB) return false;
  if (!providerDirectoryPromise) {
    const stamp = now();
    providerDirectoryPromise = env.DB.batch(MODEL_PROVIDER_DIRECTORY.map(provider => env.DB.prepare(`INSERT INTO model_registry_providers
      (id,slug,name,kind,docs_url,pricing_url,data_policy_url,models_endpoint,pricing_endpoint,availability_endpoint,api_base,auth_env,status,metadata_json,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(id) DO UPDATE SET slug=excluded.slug,name=excluded.name,kind=excluded.kind,docs_url=excluded.docs_url,pricing_url=excluded.pricing_url,
        data_policy_url=excluded.data_policy_url,models_endpoint=excluded.models_endpoint,pricing_endpoint=excluded.pricing_endpoint,
        availability_endpoint=excluded.availability_endpoint,api_base=excluded.api_base,auth_env=excluded.auth_env,metadata_json=excluded.metadata_json,updated_at=excluded.updated_at`).bind(...providerInsertArgs(provider, stamp)))).then(() => true).catch(() => { providerDirectoryPromise = null; return false; });
  }
  return providerDirectoryPromise;
}

async function ensureReferenceSchema(env) {
  if (!env.DB) return false;
  if (!referenceSchemaPromise) referenceSchemaPromise = env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS curriculum_versions (
      id TEXT PRIMARY KEY, subject_code TEXT NOT NULL, region_code TEXT NOT NULL,
      publisher TEXT NOT NULL, version_label TEXT NOT NULL, grade INTEGER NOT NULL CHECK (grade IN (7,8,9)),
      book_label TEXT, source_url TEXT NOT NULL, source_type TEXT NOT NULL, edition_year TEXT,
      verified_at TEXT, confidence REAL NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'pending',
      metadata_json TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS knowledge_nodes (
      id TEXT PRIMARY KEY, subject_code TEXT NOT NULL, curriculum_version_id TEXT, parent_id TEXT,
      grade INTEGER NOT NULL CHECK (grade IN (7,8,9)), unit_label TEXT, chapter_label TEXT,
      title TEXT NOT NULL, aliases_json TEXT NOT NULL DEFAULT '[]', competency_json TEXT NOT NULL DEFAULT '[]',
      common_errors_json TEXT NOT NULL DEFAULT '[]', source_json TEXT NOT NULL DEFAULT '{}',
      status TEXT NOT NULL DEFAULT 'pending', version INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS knowledge_relations (
      id TEXT PRIMARY KEY, from_node_id TEXT NOT NULL, to_node_id TEXT NOT NULL,
      relation_type TEXT NOT NULL CHECK (relation_type IN ('prerequisite','alias','sequence','depth_variant','cross_textbook')),
      evidence_json TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL,
      UNIQUE(from_node_id,to_node_id,relation_type)
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS question_items (
      id TEXT PRIMARY KEY, subject_code TEXT NOT NULL, grade INTEGER NOT NULL CHECK (grade IN (7,8,9)),
      region_code TEXT, curriculum_version_id TEXT, question_type TEXT NOT NULL,
      difficulty INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 5), points REAL NOT NULL,
      question_json TEXT NOT NULL, source_json TEXT NOT NULL DEFAULT '{}', generation_json TEXT NOT NULL DEFAULT '{}',
      review_json TEXT NOT NULL DEFAULT '{}', similarity_json TEXT NOT NULL DEFAULT '{}',
      status TEXT NOT NULL DEFAULT 'draft', version INTEGER NOT NULL DEFAULT 1, created_by TEXT,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS assessment_templates (
      id TEXT PRIMARY KEY, region_code TEXT NOT NULL, subject_code TEXT NOT NULL,
      grade INTEGER NOT NULL CHECK (grade IN (7,8,9)), year_label TEXT NOT NULL,
      source_url TEXT NOT NULL, verified_at TEXT, structure_json TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending', version INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS report_runs (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL,
      report_type TEXT NOT NULL CHECK (report_type IN ('subject','multi_subject')),
      period_start TEXT NOT NULL, period_end TEXT NOT NULL, subjects_json TEXT NOT NULL,
      eligibility_json TEXT NOT NULL, statistics_json TEXT NOT NULL, explanation_json TEXT,
      model_id TEXT, status TEXT NOT NULL DEFAULT 'statistics_only', created_at TEXT NOT NULL
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS source_documents (
      id TEXT PRIMARY KEY, school_id TEXT, title TEXT, source_url TEXT, source_type TEXT NOT NULL,
      acquisition_method TEXT NOT NULL, content_text TEXT, content_hash TEXT, completeness REAL, confidence REAL,
      copyright_status TEXT, failure_reason TEXT, metadata_json TEXT NOT NULL DEFAULT '{}',
      created_by TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS plot_artifacts (
      id TEXT PRIMARY KEY, skill_key TEXT NOT NULL, description_json TEXT NOT NULL,
      source_code TEXT, svg_text TEXT, png_ref TEXT, accessibility_text TEXT,
      black_white_check_json TEXT NOT NULL DEFAULT '{}', validation_json TEXT NOT NULL DEFAULT '{}',
      version INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    )`),
    env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_curriculum_versions_subject_region ON curriculum_versions(subject_code,region_code,grade,status)'),
    env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_parent ON knowledge_nodes(parent_id,subject_code,grade)'),
    env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_question_items_subject_grade ON question_items(subject_code,grade,difficulty,status)'),
    env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_assessment_templates_region_subject ON assessment_templates(region_code,subject_code,grade,year_label,status)'),
    env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_report_runs_user_period ON report_runs(user_id,period_start,period_end,status)')
  ]).then(() => true).catch(() => { referenceSchemaPromise = null; return false; });
  return referenceSchemaPromise;
}

async function ensureLearningSchema(env) {
  if (!env.DB) return false;
  if (!learningSchemaPromise) learningSchemaPromise = env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS learning_assignments (
      id TEXT PRIMARY KEY, school_id TEXT, teacher_id TEXT NOT NULL, title TEXT NOT NULL,
      subject_code TEXT NOT NULL, grade INTEGER NOT NULL CHECK (grade IN (7,8,9)),
      template_id TEXT, rubric_json TEXT NOT NULL DEFAULT '{}', due_at TEXT, status TEXT NOT NULL DEFAULT 'published',
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS learning_submissions (
      id TEXT PRIMARY KEY, assignment_id TEXT NOT NULL, school_id TEXT, student_id TEXT NOT NULL,
      attempt_no INTEGER NOT NULL DEFAULT 1, status TEXT NOT NULL DEFAULT 'draft', answers_json TEXT NOT NULL DEFAULT '{}',
      submitted_at TEXT, score REAL, total REAL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
      UNIQUE(assignment_id, student_id, attempt_no)
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS learning_feedback (
      id TEXT PRIMARY KEY, submission_id TEXT NOT NULL, teacher_id TEXT NOT NULL, score REAL NOT NULL,
      total REAL NOT NULL, comment TEXT NOT NULL DEFAULT '', reasons_json TEXT NOT NULL DEFAULT '[]',
      released_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS wrongbook_entries (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, submission_id TEXT, question_id TEXT,
      subject_code TEXT NOT NULL, knowledge_node_id TEXT, note TEXT NOT NULL DEFAULT '',
      review_status TEXT NOT NULL DEFAULT 'unreviewed', next_review_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
      UNIQUE(user_id, submission_id, question_id)
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS learning_notes (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, subject_code TEXT, knowledge_node_id TEXT,
      title TEXT NOT NULL, content TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS learning_notifications (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, kind TEXT NOT NULL, title TEXT NOT NULL,
      body TEXT NOT NULL, read_at TEXT, created_at TEXT NOT NULL
    )`),
    env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_learning_assignments_school_status ON learning_assignments(school_id,status,updated_at)'),
    env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_learning_submissions_student_status ON learning_submissions(student_id,status,updated_at)'),
    env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_learning_feedback_submission ON learning_feedback(submission_id,updated_at)'),
    env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_wrongbook_user_review ON wrongbook_entries(user_id,review_status,next_review_at)'),
    env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_learning_notifications_user ON learning_notifications(user_id,read_at,created_at)')
  ]).then(() => true).catch(() => { learningSchemaPromise = null; return false; });
  return learningSchemaPromise;
}

let runtimeProvider = null;
let runtimeProtocol = null;
let runtimeEndpoint = null;
let runtimeModel = null;

function envValue(env, key) { return String(env[key] || '').trim(); }
function now() { return new Date().toISOString(); }
function json(request, body, status = 200) {
  const headers = new Headers({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  const origin = request && request.headers.get('Origin');
  const allowed = envValue(request && request.__env ? request.__env : {}, 'FH_ALLOWED_ORIGINS').split(',').map(x => x.trim()).filter(Boolean);
  if (origin && allowed.includes(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Vary', 'Origin');
  }
  return new Response(JSON.stringify(body), { status, headers });
}
function withEnv(request, env) { request.__env = env; return request; }
function cors(request, env) {
  const headers = new Headers({
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Max-Age': '600'
  });
  const origin = request.headers.get('Origin');
  const allowed = envValue(env, 'FH_ALLOWED_ORIGINS').split(',').map(x => x.trim()).filter(Boolean);
  if (origin && allowed.includes(origin)) { headers.set('Access-Control-Allow-Origin', origin); headers.set('Vary', 'Origin'); }
  return headers;
}
function emptyResponse(request, env, status = 204) { return new Response('', { status, headers: cors(request, env) }); }

async function sha256(value) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(value)));
  return Array.from(new Uint8Array(bytes)).map(x => x.toString(16).padStart(2, '0')).join('');
}
function randomToken() { return crypto.randomUUID() + '.' + crypto.randomUUID(); }
function maskPhone(phone) { const value = String(phone || ''); return value.length >= 7 ? value.slice(0, 3) + '****' + value.slice(-4) : '已隐藏'; }

async function importKey(env) {
  const raw = envValue(env, 'FH_PII_KEY');
  if (!raw) return null;
  try { return await crypto.subtle.importKey('raw', Uint8Array.from(atob(raw), c => c.charCodeAt(0)), 'AES-GCM', false, ['encrypt', 'decrypt']); } catch { return null; }
}
async function decryptField(value, env) {
  const key = await importKey(env);
  if (!key || !value || !String(value).startsWith('v1:')) return '已加密账户';
  try {
    const [, ivText, dataText] = String(value).split(':');
    const iv = Uint8Array.from(atob(ivText), c => c.charCodeAt(0));
    const data = Uint8Array.from(atob(dataText), c => c.charCodeAt(0));
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
    return new TextDecoder().decode(plain);
  } catch { return '已加密账户'; }
}

async function getSession(request, env) {
  if (!env.DB) return null;
  const auth = request.headers.get('Authorization') || '';
  if (!auth.startsWith('Bearer ')) return null;
  const digest = await sha256(auth.slice(7));
  const row = await env.DB.prepare(
    'SELECT s.id AS session_id, s.user_id, u.school_id, u.role, u.status FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_digest=? AND s.revoked_at IS NULL AND s.expires_at>?'
  ).bind(digest, now()).first();
  return row || null;
}
function canWrite(session, collection) { return !!(session && ROLE_WRITES[session.role] && ROLE_WRITES[session.role].has(collection)); }
function requireDb(request, env) {
  return env.DB ? null : json(request, { ok: false, code: 'DATABASE_NOT_CONFIGURED', msg: '学校数据服务尚未配置数据库' }, 503);
}
function requireSession(request, env, session) {
  if (!env.DB) return requireDb(request, env);
  if (!session) return json(request, { ok: false, code: 'AUTH_REQUIRED', msg: '请先登录后再访问学校数据' }, 401);
  return null;
}

async function verifyPassword(password, stored) {
  const parts = String(stored || '').split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2-sha256') return false;
  const iterations = Number(parts[1]);
  if (!Number.isFinite(iterations) || iterations < 100000 || iterations > 600000) return false;
  try {
    const salt = Uint8Array.from(atob(parts[2]), c => c.charCodeAt(0));
    const expected = Uint8Array.from(atob(parts[3]), c => c.charCodeAt(0));
    const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
    const actual = new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, base, 256));
    return actual.length === expected.length && actual.every((x, i) => x === expected[i]);
  } catch { return false; }
}

async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iterations = 120000;
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(String(password)), 'PBKDF2', false, ['deriveBits']);
  const bits = new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, base, 256));
  const b64 = value => btoa(String.fromCharCode(...value));
  return `pbkdf2-sha256$${iterations}$${b64(salt)}$${b64(bits)}`;
}
async function encryptField(value, env) {
  const key = await importKey(env);
  if (!key) throw new Error('PII_KEY_NOT_CONFIGURED');
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plain = new TextEncoder().encode(String(value || ''));
  const encrypted = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plain));
  const b64 = value => btoa(String.fromCharCode(...value));
  return `v1:${b64(iv)}:${b64(encrypted)}`;
}

async function safeUser(row, env, phone) {
  const name = await decryptField(row.name_ciphertext, env);
  let profile = {};
  try { profile = row.profile_json ? JSON.parse(row.profile_json) : {}; } catch {}
  return { id: row.id, schoolId: row.school_id || null, name, phone: maskPhone(phone), role: row.role, grade: profile.grade || '', cls: profile.cls || '', status: row.status === 'active' ? '正常' : row.status === 'pending' ? '待激活' : '已禁用', createdAt: row.created_at, lastLoginAt: row.last_login_at || null };
}

async function handleLogin(request, env) {
  const body = await request.json().catch(() => ({}));
  const phone = String(body.phone || '').trim();
  const password = String(body.password || '');
  if (!/^1\d{10}$/.test(phone) || !password) return json(request, { ok: false, code: 'INVALID_CREDENTIALS', msg: '手机号或密码错误' }, 400);
  const row = await env.DB.prepare('SELECT * FROM users WHERE phone_digest=? LIMIT 1').bind(await sha256(phone)).first();
  if (!row || row.status === 'disabled' || !(await verifyPassword(password, row.password_hash))) return json(request, { ok: false, code: 'INVALID_CREDENTIALS', msg: '手机号或密码错误' }, 401);
  const token = randomToken();
  const expires = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
  await env.DB.batch([
    env.DB.prepare('INSERT INTO sessions (id,user_id,token_digest,expires_at,created_at) VALUES (?,?,?,?,?)').bind(crypto.randomUUID(), row.id, await sha256(token), expires, now()),
    env.DB.prepare('UPDATE users SET last_login_at=?,updated_at=? WHERE id=?').bind(now(), now(), row.id),
    env.DB.prepare('INSERT INTO audit_logs (id,actor_id,action,target_type,target_id,detail_json,created_at) VALUES (?,?,?,?,?,?,?)').bind(crypto.randomUUID(), row.id, 'login', 'user', row.id, '{}', now())
  ]);
  return json(request, { ok: true, token, expiresAt: expires, user: await safeUser(row, env, phone) });
}

async function handleActivate(request, env, session) {
  const denied = requireSession(request, env, session);
  if (denied) return denied;
  const body = await request.json().catch(() => ({}));
  const password = String(body.newPassword || '');
  if (password.length < 8) return json(request, { ok: false, code: 'WEAK_PASSWORD', msg: '新密码至少 8 位' }, 400);
  const row = await env.DB.prepare('SELECT * FROM users WHERE id=? LIMIT 1').bind(session.user_id).first();
  if (!row || row.status !== 'pending') return json(request, { ok: false, code: 'ACTIVATION_NOT_ALLOWED', msg: '当前账号不需要激活' }, 409);
  const passwordHash = await hashPassword(password);
  await env.DB.batch([
    env.DB.prepare('UPDATE users SET password_hash=?,password_algorithm=?,status=?,updated_at=? WHERE id=?').bind(passwordHash, 'pbkdf2-sha256', 'active', now(), session.user_id),
    env.DB.prepare('INSERT INTO audit_logs (id,actor_id,action,target_type,target_id,detail_json,created_at) VALUES (?,?,?,?,?,?,?)').bind(crypto.randomUUID(), session.user_id, 'activate_account', 'user', session.user_id, '{}', now())
  ]);
  return json(request, { ok: true, user: await safeUser(row, env, '') });
}

async function handleChangePassword(request, env, session) {
  const denied = requireSession(request, env, session);
  if (denied) return denied;
  const body = await request.json().catch(() => ({}));
  const oldPassword = String(body.oldPassword || '');
  const newPassword = String(body.newPassword || '');
  if (newPassword.length < 8) return json(request, { ok: false, code: 'WEAK_PASSWORD', msg: '新密码至少 8 位' }, 400);
  const row = await env.DB.prepare('SELECT * FROM users WHERE id=? LIMIT 1').bind(session.user_id).first();
  if (!row || !(await verifyPassword(oldPassword, row.password_hash))) return json(request, { ok: false, code: 'INVALID_CREDENTIALS', msg: '原密码错误' }, 401);
  await env.DB.prepare('UPDATE users SET password_hash=?,password_algorithm=?,updated_at=? WHERE id=?').bind(await hashPassword(newPassword), 'pbkdf2-sha256', now(), session.user_id).run();
  return json(request, { ok: true, msg: '密码已更新' });
}

async function handleCreateUser(request, env, session) {
  const denied = requireSession(request, env, session);
  if (denied) return denied;
  if (!['admin', 'academic'].includes(session.role)) return json(request, { ok: false, code: 'SCOPE_FORBIDDEN', msg: '当前身份不能导入账号' }, 403);
  const body = await request.json().catch(() => ({}));
  const name = String(body.name || '').trim();
  const phone = String(body.phone || '').trim();
  const role = ['teacher', 'student', 'academic'].includes(body.role) ? body.role : 'student';
  if (!name || !/^1\d{10}$/.test(phone)) return json(request, { ok: false, code: 'INVALID_USER', msg: '姓名或手机号格式不正确' }, 400);
  if (!env.FH_PII_KEY) return json(request, { ok: false, code: 'PII_KEY_NOT_CONFIGURED', msg: '站点尚未配置隐私加密密钥' }, 503);
  const phoneDigest = await sha256(phone);
  const duplicate = await env.DB.prepare('SELECT id FROM users WHERE phone_digest=? LIMIT 1').bind(phoneDigest).first();
  if (duplicate) return json(request, { ok: false, code: 'DUPLICATE_PHONE', msg: '手机号已存在' }, 409);
  const temporaryPassword = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  const created = now();
  const id = crypto.randomUUID();
  const row = { id, school_id: session.school_id || null, name_ciphertext: await encryptField(name, env), phone_ciphertext: await encryptField(phone, env), phone_digest: phoneDigest, role, profile_json: JSON.stringify({ grade: String(body.grade || '').trim(), cls: String(body.cls || '').trim() }), status: 'pending', created_at: created, updated_at: created, last_login_at: null };
  await env.DB.batch([
    env.DB.prepare('INSERT INTO users (id,school_id,name_ciphertext,phone_ciphertext,phone_digest,password_hash,password_algorithm,role,profile_json,status,created_at,updated_at,last_login_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(id, row.school_id, row.name_ciphertext, row.phone_ciphertext, row.phone_digest, await hashPassword(temporaryPassword), 'pbkdf2-sha256', role, row.profile_json, 'pending', created, created, null),
    env.DB.prepare('INSERT INTO audit_logs (id,actor_id,action,target_type,target_id,detail_json,created_at) VALUES (?,?,?,?,?,?,?)').bind(crypto.randomUUID(), session.user_id, 'create_user', 'user', id, JSON.stringify({ role }), created)
  ]);
  return json(request, { ok: true, user: await safeUser(row, env, phone), temporaryPassword });
}

function classifyRecordForAudit(collection, row) {
  let payload = {};
  try { payload = JSON.parse(row.record_json || '{}'); } catch {}
  const id = String(row.id || '');
  const source = String(payload.source || payload.sourceType || payload.origin || '').toLowerCase();
  const hint = [id, source, payload.schemaVersion, payload.ownerType, payload.mode, payload.environment].join(' ').toLowerCase();
  const reasons = [];
  let category = 'unknown_review';
  if (/(^|[_-])(test|demo|fixture|mock|sample)([_-]|$)/.test(hint) || payload.testMode === true || payload.demo === true) {
    category = 'demo_candidate';
    reasons.push('显式出现测试/演示标记');
  } else if (/(seed|fixture|mock|sample|preset|legacy|旧版|示例|演示)/.test(hint)) {
    category = 'legacy_review';
    reasons.push('来源字段或标识疑似旧资源');
  } else if (['knowledge', 'content_tags', 'question_manifests', 'explanations'].includes(collection)) {
    category = 'content_review';
    reasons.push('属于题目/知识/解析内容集合，不能据此判断是否真实用户数据');
  } else if (collection === 'resources' || collection === 'source_records') {
    category = 'resource_review';
    reasons.push('属于资料或来源集合，需核验所有者、版权和引用关系');
  } else if (collection === 'papers') {
    category = 'paper_review';
    reasons.push('属于试卷集合，可能是教师真实创建内容');
  } else if (REAL_RECORD_COLLECTIONS.has(collection)) {
    category = 'real_business';
    reasons.push('属于真实业务集合，默认保留');
  } else if (CONTENT_AUDIT_COLLECTIONS.has(collection)) {
    category = 'content_review';
    reasons.push('属于内容相关集合，需人工复核');
  }
  const hasOwner = !!String(row.owner_id || '').trim();
  const linkedToStudent = !!(payload.studentId || payload.userId || payload.submissionId || payload.assignmentId);
  const deletionCandidate = category === 'demo_candidate' && !hasOwner && !linkedToStudent;
  return {
    category,
    reasons,
    deletionCandidate,
    decision: deletionCandidate ? 'candidate_requires_confirmation' : 'review_required',
    hasOwner,
    linkedToStudent
  };
}

async function handleContentAudit(request, env, session) {
  const denied = requireSession(request, env, session);
  if (denied) return denied;
  if (session.role !== 'admin') return json(request, { ok: false, code: 'SCOPE_FORBIDDEN', msg: '只有学校管理员可以查看迁移审计清单' }, 403);
  if (request.method !== 'GET') return json(request, { ok: false, code: 'METHOD_NOT_ALLOWED', msg: '迁移审计仅支持只读查询' }, 405);
  const url = new URL(request.url);
  const requestedCollections = String(url.searchParams.get('collections') || '').split(',').map(x => x.trim()).filter(x => CONTENT_AUDIT_COLLECTIONS.has(x));
  const collections = requestedCollections.length ? requestedCollections : Array.from(CONTENT_AUDIT_COLLECTIONS);
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit') || 500), 1), 5000);
  const schoolId = String(url.searchParams.get('schoolId') || '').trim();
  const collectionMarks = collections.map(() => '?').join(',');
  const scopeArgs = collections.concat(schoolId ? [schoolId] : []);
  const where = `deleted_at IS NULL AND collection_name IN (${collectionMarks})${schoolId ? ' AND school_id=?' : ''}`;
  const counts = await env.DB.prepare(`SELECT collection_name, COUNT(*) AS count FROM records WHERE ${where} GROUP BY collection_name`).bind(...scopeArgs).all();
  const rows = await env.DB.prepare(`SELECT id,collection_name,school_id,owner_id,record_json,created_at,updated_at,deleted_at FROM records WHERE ${where} ORDER BY updated_at DESC LIMIT ${limit}`).bind(...scopeArgs).all();
  const records = [];
  const summary = {};
  for (const row of rows.results || []) {
    const classification = classifyRecordForAudit(row.collection_name, row);
    const recordHash = await sha256(row.record_json || '');
    summary[classification.category] = (summary[classification.category] || 0) + 1;
    records.push({
      id: row.id,
      collection: row.collection_name,
      schoolId: row.school_id || null,
      ownerId: row.owner_id || null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at || null,
      recordHash,
      ...classification
    });
  }
  const countMap = {};
  for (const row of counts.results || []) countMap[row.collection_name] = Number(row.count || 0);
  return json(request, {
    ok: true,
    readOnly: true,
    generatedAt: now(),
    scope: { schoolId: schoolId || 'all-accessible-schools', collections },
    counts: countMap,
    sample: { limit, returned: records.length, truncated: records.length >= limit },
    classification: summary,
    records,
    deletion: { executed: false, policy: 'never_auto_delete', note: '候选记录仍需完成备份、引用检查和人工确认后才可进入迁移批次' }
  });
}

function parseJson(value, fallback) {
  try { return value == null || value === '' ? fallback : JSON.parse(value); } catch { return fallback; }
}

async function fetchJsonWithTimeout(url, options, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.min(Math.max(Number(timeoutMs) || 15000, 3000), 30000));
  try {
    const response = await fetch(url, Object.assign({}, options || {}, { signal: controller.signal }));
    const contentLength = Number(response.headers.get('Content-Length') || 0);
    if (contentLength > 8 * 1024 * 1024) throw new Error('官方模型目录响应超过大小限制');
    const raw = await response.text();
    if (raw.length > 8 * 1024 * 1024) throw new Error('官方模型目录响应超过大小限制');
    const payload = parseJson(raw, {});
    if (!response.ok) {
      const error = new Error('上游模型目录返回 HTTP ' + response.status);
      error.status = response.status;
      throw error;
    }
    return payload;
  } finally { clearTimeout(timer); }
}

function appendQuery(url, key, value) {
  const next = new URL(url);
  next.searchParams.set(key, value);
  return next.toString();
}

function sameOriginNextUrl(base, candidate) {
  try {
    const next = new URL(candidate, base);
    return next.origin === new URL(base).origin ? next.toString() : '';
  } catch { return ''; }
}

async function fetchAllProviderModels(provider, headers) {
  const metadata = parseJson(provider.metadata_json, {});
  const mode = String(metadata.pagination || '').trim();
  const models = [];
  let nextUrl = mode === 'pageNo'
    ? appendQuery(appendQuery(provider.models_endpoint, 'page_no', '1'), 'page_size', String(Number(metadata.pageSize || 100)))
    : provider.models_endpoint;
  let page = 1;
  for (let count = 0; count < 40 && nextUrl; count++) {
    const payload = await fetchJsonWithTimeout(nextUrl, { headers });
    models.push(...normalizeModelsPayload(provider, payload));
    if (mode === 'nextPageToken') {
      const token = String(payload && payload.nextPageToken || '').trim();
      nextUrl = token ? appendQuery(provider.models_endpoint, 'pageToken', token) : '';
    } else if (mode === 'afterId') {
      const hasMore = payload && payload.has_more === true;
      const lastId = String(payload && payload.last_id || '').trim();
      nextUrl = hasMore && lastId ? appendQuery(provider.models_endpoint, 'after_id', lastId) : '';
    } else if (mode === 'next_page_token') {
      const token = String(payload && payload.next_page_token || '').trim();
      nextUrl = token ? appendQuery(provider.models_endpoint, 'page_token', token) : '';
    } else if (mode === 'pageNo') {
      const items = normalizeModelsPayload(provider, payload);
      const pageSize = Number(metadata.pageSize || 100);
      nextUrl = items.length >= pageSize ? appendQuery(appendQuery(provider.models_endpoint, 'page_no', String(page + 1)), 'page_size', String(pageSize)) : '';
      page += 1;
    } else if (mode === 'next') {
      const token = String(payload && payload.next || '').trim();
      nextUrl = token ? sameOriginNextUrl(provider.models_endpoint, token) : '';
    } else nextUrl = '';
  }
  const seen = new Set();
  return models.filter(model => {
    const key = model.providerModelId;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function batchWrite(env, statements, size = 40) {
  for (let i = 0; i < statements.length; i += size) await env.DB.batch(statements.slice(i, i + size));
}

async function syncOneModelProvider(env, provider, transientKey) {
  const startedAt = now();
  const runId = crypto.randomUUID();
  await env.DB.prepare('INSERT INTO model_registry_sync_runs (id,provider_id,status,source_url,requested_at) VALUES (?,?,?,?,?)')
    .bind(runId, provider.id, 'running', provider.models_endpoint, startedAt).run();
  try {
    const headers = { Accept: 'application/json' };
    const key = String(transientKey || '').trim() || (provider.auth_env ? envValue(env, provider.auth_env) : '');
    const metadata = parseJson(provider.metadata_json, {});
    const authHeader = String(metadata.authHeader || '').trim();
    Object.keys(metadata.extraHeaders || {}).forEach(name => {
      if (/^[A-Za-z0-9-]{1,80}$/.test(name) && typeof metadata.extraHeaders[name] === 'string') headers[name] = metadata.extraHeaders[name].slice(0, 200);
    });
    if (key) headers[authHeader || 'Authorization'] = authHeader ? key : 'Bearer ' + key;
    const models = (await fetchAllProviderModels(provider, headers)).slice(0, 5000);
    if (!models.length) throw new Error('官方接口没有返回可用模型记录');
    const sourceHash = await sha256(stableJson(models));
    const existing = await env.DB.prepare('SELECT id,provider_model_id,source_hash,created_at FROM model_registry_models WHERE provider_id=?').bind(provider.id).all();
    const existingMap = new Map((existing.results || []).map(row => [String(row.provider_model_id), row]));
    const seen = new Set(models.map(model => model.providerModelId));
    let changed = 0;
    const statements = [env.DB.prepare('UPDATE model_registry_models SET status=?,updated_at=? WHERE provider_id=?').bind('unavailable', now(), provider.id)];
    const historyStatements = [];
    for (const model of models) {
      const modelHash = await sha256(stableJson(model));
      const old = existingMap.get(model.providerModelId);
      if (!old || old.source_hash !== modelHash) changed++;
      const modelId = old ? old.id : crypto.randomUUID();
      const stamp = now();
      statements.push(env.DB.prepare(`INSERT INTO model_registry_models
        (id,provider_id,canonical_key,provider_model_id,upstream_provider,official_name,exact_version,model_type,capabilities_json,limits_json,pricing_json,availability_json,status,source_url,source_hash,last_verified_at,created_at,updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        ON CONFLICT(provider_id,provider_model_id) DO UPDATE SET
          canonical_key=excluded.canonical_key,upstream_provider=excluded.upstream_provider,official_name=excluded.official_name,
          exact_version=excluded.exact_version,model_type=excluded.model_type,capabilities_json=excluded.capabilities_json,
          limits_json=excluded.limits_json,pricing_json=excluded.pricing_json,availability_json=excluded.availability_json,
          status=excluded.status,source_url=excluded.source_url,source_hash=excluded.source_hash,last_verified_at=excluded.last_verified_at,updated_at=excluded.updated_at`)
        .bind(modelId, provider.id, model.canonicalKey, model.providerModelId, model.upstreamProvider, model.officialName,
          model.exactVersion, model.modelType, JSON.stringify(model.capabilities), JSON.stringify(model.limits), JSON.stringify(model.pricing),
          JSON.stringify(model.availability), 'available', model.sourceUrl, modelHash, stamp, old ? old.created_at || stamp : stamp, stamp));
      if (!old || old.source_hash !== modelHash) historyStatements.push(env.DB.prepare('INSERT INTO model_registry_history (id,model_id,provider_id,snapshot_json,source_hash,captured_at) VALUES (?,?,?,?,?,?)').bind(crypto.randomUUID(), modelId, provider.id, JSON.stringify(model), modelHash, stamp));
    }
    await batchWrite(env, statements.concat(historyStatements));
    const finishedAt = now();
    await env.DB.batch([
      env.DB.prepare('UPDATE model_registry_providers SET status=?,last_synced_at=?,last_error=?,updated_at=? WHERE id=?').bind('active', finishedAt, null, finishedAt, provider.id),
      env.DB.prepare('UPDATE model_registry_sync_runs SET status=?,finished_at=?,model_count=?,changed_count=?,source_hash=? WHERE id=?').bind('success', finishedAt, models.length, changed, sourceHash, runId)
    ]);
    return { providerId: provider.id, slug: provider.slug, ok: true, modelCount: models.length, changedCount: changed, syncedAt: finishedAt, sourceHash, unavailableCount: Math.max(0, (existing.results || []).filter(row => !seen.has(String(row.provider_model_id))).length) };
  } catch (error) {
    const finishedAt = now();
    const message = error && error.name === 'AbortError' ? '官方模型目录请求超时' : String(error && error.message || '官方模型目录同步失败').slice(0, 240);
    await env.DB.batch([
      env.DB.prepare('UPDATE model_registry_providers SET status=?,last_synced_at=?,last_error=?,updated_at=? WHERE id=?').bind('error', finishedAt, message, finishedAt, provider.id),
      env.DB.prepare('UPDATE model_registry_sync_runs SET status=?,finished_at=?,error_message=? WHERE id=?').bind('failed', finishedAt, message, runId)
    ]);
    return { providerId: provider.id, slug: provider.slug, ok: false, code: 'MODEL_SYNC_FAILED', message, syncedAt: finishedAt };
  }
}

async function handleModelSync(request, env, session) {
  const denied = requireSession(request, env, session);
  if (denied) return denied;
  if (session.role !== 'admin') return json(request, { ok: false, code: 'SCOPE_FORBIDDEN', msg: '只有学校管理员可以同步模型目录' }, 403);
  const body = await request.json().catch(() => ({}));
  const requested = String(body.providerId || body.provider || '').trim();
  const transientKey = requested ? String(body.apiKey || '').trim().slice(0, 1000) : '';
  const query = requested
    ? env.DB.prepare('SELECT * FROM model_registry_providers WHERE id=? OR slug=?').bind(requested, requested)
    : env.DB.prepare('SELECT * FROM model_registry_providers ORDER BY name');
  const result = await query.all();
  const providers = result.results || [];
  if (!providers.length) return json(request, { ok: false, code: 'MODEL_PROVIDER_NOT_FOUND', msg: '没有找到模型服务商目录' }, 404);
  const results = [];
  for (let i = 0; i < providers.length; i += 4) {
    const batch = await Promise.all(providers.slice(i, i + 4).map(provider => syncOneModelProvider(env, provider, transientKey)));
    results.push(...batch);
  }
  return json(request, { ok: results.every(item => item.ok), syncedAt: now(), results });
}

async function recordWorkflowRun(env, session, workflow, messages, model, status, usage, trace) {
  if (!env.DB || !workflow) return;
  try {
    await env.DB.prepare('INSERT INTO workflow_runs (id,workflow_key,actor_id,input_hash,model_id,status,quality_json,usage_json,trace_json,started_at,finished_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
      .bind(crypto.randomUUID(), String(workflow).slice(0, 180), session && session.user_id || null, await sha256(JSON.stringify(messages || [])), model || null, status, '{}', JSON.stringify(usage || {}), JSON.stringify(trace || {}), now(), now()).run();
  } catch {}
}

async function handleModelReference(request, env) {
  if (request.method !== 'GET') return json(request, { ok: false, code: 'METHOD_NOT_ALLOWED', msg: '模型目录只支持读取' }, 405);
  const dbError = requireDb(request, env);
  if (dbError) return dbError;
  const url = new URL(request.url);
  const provider = String(url.searchParams.get('provider') || '').trim();
  const type = String(url.searchParams.get('type') || '').trim();
  const providerQuery = provider
    ? env.DB.prepare('SELECT id,slug,name,kind,docs_url,pricing_url,data_policy_url,models_endpoint,api_base,metadata_json,status,last_synced_at FROM model_registry_providers WHERE slug=? OR id=?').bind(provider, provider)
    : env.DB.prepare('SELECT id,slug,name,kind,docs_url,pricing_url,data_policy_url,models_endpoint,api_base,metadata_json,status,last_synced_at FROM model_registry_providers ORDER BY name');
  const providerResult = await providerQuery.all();
  const providers = providerResult.results || [];
  const ids = providers.map(row => row.id);
  if (!ids.length) return json(request, { ok: true, providers: [], models: [], syncedAt: null });
  const marks = ids.map(() => '?').join(',');
  const args = ids.concat(type ? [type] : []);
  const modelQuery = env.DB.prepare(`SELECT provider_id,canonical_key,provider_model_id,upstream_provider,official_name,exact_version,model_type,capabilities_json,limits_json,pricing_json,availability_json,status,source_url,last_verified_at FROM model_registry_models WHERE provider_id IN (${marks}) AND status='available'${type ? ' AND model_type=?' : ''} ORDER BY official_name` ).bind(...args);
  const modelResult = await modelQuery.all();
  const providerById = new Map(providers.map(row => [row.id, row]));
  const models = (modelResult.results || []).map(row => ({
    providerId: row.provider_id, canonicalKey: row.canonical_key, providerModelId: row.provider_model_id,
    upstreamProvider: row.upstream_provider || '', officialName: row.official_name, exactVersion: row.exact_version || null,
    modelType: row.model_type, capabilities: parseJson(row.capabilities_json, {}), limits: parseJson(row.limits_json, {}),
    pricing: parseJson(row.pricing_json, {}), pricingUrl: providerById.get(row.provider_id)?.pricing_url || null, availability: parseJson(row.availability_json, {}), status: row.status,
    sourceUrl: row.source_url, lastVerifiedAt: row.last_verified_at
  }));
  return json(request, { ok: true, providers: providers.map(row => ({ id: row.id, slug: row.slug, name: row.name, kind: row.kind, docsUrl: row.docs_url, pricingUrl: row.pricing_url, dataPolicyUrl: row.data_policy_url, modelsEndpoint: row.models_endpoint, apiBase: row.api_base, metadata: parseJson(row.metadata_json, {}), status: row.status, lastSyncedAt: row.last_synced_at || null })), models });
}

async function handleCatalogReference(request, env) {
  if (request.method !== 'GET') return json(request, { ok: false, code: 'METHOD_NOT_ALLOWED', msg: '目录只支持读取' }, 405);
  const dbError = requireDb(request, env);
  if (dbError) return dbError;
  const url = new URL(request.url);
  const subject = String(url.searchParams.get('subject') || '').trim();
  const grade = Number(url.searchParams.get('grade') || 0);
  const region = String(url.searchParams.get('region') || '').trim();
  const year = String(url.searchParams.get('year') || '').trim();
  const curriculumWhere = ['status=?'];
  const curriculumArgs = ['active'];
  if (subject) { curriculumWhere.push('subject_code=?'); curriculumArgs.push(subject); }
  if (grade) { curriculumWhere.push('grade=?'); curriculumArgs.push(grade); }
  if (region) { curriculumWhere.push('region_code=?'); curriculumArgs.push(region); }
  const curriculum = await env.DB.prepare(`SELECT id,subject_code,region_code,publisher,version_label,grade,book_label,source_url,source_type,edition_year,verified_at,confidence,metadata_json FROM curriculum_versions WHERE ${curriculumWhere.join(' AND ')} ORDER BY subject_code,grade,version_label`).bind(...curriculumArgs).all();
  const versionIds = (curriculum.results || []).map(row => row.id);
  let nodes = { results: [] };
  if (versionIds.length) {
    const marks = versionIds.map(() => '?').join(',');
    nodes = await env.DB.prepare(`SELECT id,subject_code,curriculum_version_id,parent_id,grade,unit_label,chapter_label,title,aliases_json,competency_json,source_json FROM knowledge_nodes WHERE status='active' AND curriculum_version_id IN (${marks}) ORDER BY subject_code,grade,unit_label,title`).bind(...versionIds).all();
  }
  const templateWhere = ['status=?'];
  const templateArgs = ['active'];
  if (subject) { templateWhere.push('subject_code=?'); templateArgs.push(subject); }
  if (grade) { templateWhere.push('grade=?'); templateArgs.push(grade); }
  if (region) { templateWhere.push('region_code=?'); templateArgs.push(region); }
  if (year) { templateWhere.push('year_label=?'); templateArgs.push(year); }
  const templates = await env.DB.prepare(`SELECT id,region_code,subject_code,grade,year_label,source_url,verified_at,structure_json,version FROM assessment_templates WHERE ${templateWhere.join(' AND ')} ORDER BY region_code,year_label,subject_code`).bind(...templateArgs).all();
  return json(request, {
    ok: true,
    generatedAt: now(),
    curriculum: (curriculum.results || []).map(row => ({ id: row.id, subject: row.subject_code, region: row.region_code, publisher: row.publisher, version: row.version_label, grade: row.grade, book: row.book_label, source: { url: row.source_url, type: row.source_type, editionYear: row.edition_year, verifiedAt: row.verified_at }, confidence: row.confidence, metadata: parseJson(row.metadata_json, {}) })),
    knowledgeNodes: (nodes.results || []).map(row => ({ id: row.id, subject: row.subject_code, curriculumVersionId: row.curriculum_version_id, parentId: row.parent_id, grade: row.grade, unit: row.unit_label, chapter: row.chapter_label, title: row.title, aliases: parseJson(row.aliases_json, []), competencies: parseJson(row.competency_json, []), source: parseJson(row.source_json, {}) })),
    templates: (templates.results || []).map(row => ({ id: row.id, region: row.region_code, subject: row.subject_code, grade: row.grade, year: row.year_label, source: { url: row.source_url, verifiedAt: row.verified_at }, structure: parseJson(row.structure_json, {}), version: row.version }))
  });
}

function boundedText(value, limit) { return String(value == null ? '' : value).trim().slice(0, limit || 1000); }
function jsonText(value, fallback) { return JSON.stringify(value == null ? fallback : value); }

async function handleLearning(request, env, session, resource, recordId) {
  const denied = requireSession(request, env, session);
  if (denied) return denied;
  const schoolId = session.school_id || null;
  const isStaff = ['admin', 'academic', 'teacher'].includes(session.role);
  const isStudent = session.role === 'student';
  if (resource === 'assignments') {
    if (request.method === 'GET') {
      const query = isStudent
        ? env.DB.prepare("SELECT id,school_id,teacher_id,title,subject_code,grade,template_id,rubric_json,due_at,status,created_at,updated_at FROM learning_assignments WHERE school_id=? AND status<>'archived' ORDER BY due_at IS NULL,due_at,updated_at DESC").bind(schoolId)
        : env.DB.prepare('SELECT id,school_id,teacher_id,title,subject_code,grade,template_id,rubric_json,due_at,status,created_at,updated_at FROM learning_assignments WHERE school_id=? ORDER BY updated_at DESC').bind(schoolId);
      const result = await query.all();
      return json(request, { ok: true, assignments: (result.results || []).map(row => ({ id: row.id, schoolId: row.school_id, teacherId: row.teacher_id, title: row.title, subject: row.subject_code, grade: row.grade, templateId: row.template_id, rubric: parseJson(row.rubric_json, {}), dueAt: row.due_at, status: row.status, createdAt: row.created_at, updatedAt: row.updated_at })) });
    }
    if (!isStaff) return json(request, { ok: false, code: 'SCOPE_FORBIDDEN', msg: '当前身份不能创建作业' }, 403);
    if (!['POST', 'PUT'].includes(request.method)) return json(request, { ok: false, code: 'METHOD_NOT_ALLOWED', msg: '作业接口只支持读取和保存' }, 405);
    const body = await request.json().catch(() => ({}));
    const id = boundedText(body.id || crypto.randomUUID(), 80);
    const title = boundedText(body.title, 240);
    const subject = boundedText(body.subject || body.subjectCode, 40);
    const grade = Number(body.grade);
    if (!title || !subject || ![7, 8, 9].includes(grade)) return json(request, { ok: false, code: 'INVALID_ASSIGNMENT', msg: '作业标题、学科和年级不能为空' }, 400);
    const stamp = now();
    await env.DB.prepare(`INSERT INTO learning_assignments (id,school_id,teacher_id,title,subject_code,grade,template_id,rubric_json,due_at,status,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,subject_code=excluded.subject_code,grade=excluded.grade,template_id=excluded.template_id,rubric_json=excluded.rubric_json,due_at=excluded.due_at,status=excluded.status,updated_at=excluded.updated_at`)
      .bind(id, schoolId, session.user_id, title, subject, grade, boundedText(body.templateId, 100) || null, jsonText(body.rubric, {}), boundedText(body.dueAt, 80) || null, boundedText(body.status, 30) || 'published', stamp, stamp).run();
    return json(request, { ok: true, id, savedAt: stamp });
  }
  if (resource === 'submissions') {
    if (request.method === 'GET') {
      const query = isStudent
        ? env.DB.prepare('SELECT id,assignment_id,school_id,student_id,attempt_no,status,answers_json,submitted_at,score,total,created_at,updated_at FROM learning_submissions WHERE student_id=? ORDER BY updated_at DESC').bind(session.user_id)
        : env.DB.prepare('SELECT id,assignment_id,school_id,student_id,attempt_no,status,answers_json,submitted_at,score,total,created_at,updated_at FROM learning_submissions WHERE school_id=? ORDER BY updated_at DESC').bind(schoolId);
      const result = await query.all();
      return json(request, { ok: true, submissions: (result.results || []).map(row => ({ id: row.id, assignmentId: row.assignment_id, schoolId: row.school_id, studentId: row.student_id, attemptNo: row.attempt_no, status: row.status, answers: parseJson(row.answers_json, {}), submittedAt: row.submitted_at, score: row.score, total: row.total, createdAt: row.created_at, updatedAt: row.updated_at })) });
    }
    if (!isStudent) return json(request, { ok: false, code: 'SCOPE_FORBIDDEN', msg: '只有学生可以提交作业答案' }, 403);
    if (!['POST', 'PUT'].includes(request.method)) return json(request, { ok: false, code: 'METHOD_NOT_ALLOWED', msg: '提交接口只支持保存草稿和正式提交' }, 405);
    const body = await request.json().catch(() => ({}));
    const assignmentId = boundedText(body.assignmentId, 80);
    const assignment = await env.DB.prepare('SELECT id,school_id FROM learning_assignments WHERE id=? AND school_id=? LIMIT 1').bind(assignmentId, schoolId).first();
    if (!assignment) return json(request, { ok: false, code: 'ASSIGNMENT_NOT_FOUND', msg: '作业不存在或不属于当前学校' }, 404);
    const attemptNo = Math.max(1, Number(body.attemptNo || 1));
    let id = boundedText(body.id, 80);
    if (!id) {
      const existing = await env.DB.prepare('SELECT id FROM learning_submissions WHERE assignment_id=? AND student_id=? AND attempt_no=? LIMIT 1').bind(assignmentId, session.user_id, attemptNo).first();
      id = existing && existing.id ? String(existing.id) : crypto.randomUUID();
    }
    const status = body.status === 'submitted' ? 'submitted' : 'draft';
    const stamp = now();
    const submittedAt = status === 'submitted' ? (boundedText(body.submittedAt, 80) || stamp) : null;
    await env.DB.prepare(`INSERT INTO learning_submissions (id,assignment_id,school_id,student_id,attempt_no,status,answers_json,submitted_at,score,total,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET answers_json=excluded.answers_json,status=excluded.status,submitted_at=excluded.submitted_at,updated_at=excluded.updated_at`)
      .bind(id, assignmentId, schoolId, session.user_id, attemptNo, status, jsonText(body.answers, {}), submittedAt, null, Number(body.total) > 0 ? Number(body.total) : null, stamp, stamp).run();
    return json(request, { ok: true, id, status, savedAt: stamp });
  }
  if (resource === 'feedback') {
    if (request.method === 'GET') {
      const query = isStudent
        ? env.DB.prepare(`SELECT f.id,f.submission_id,f.teacher_id,f.score,f.total,f.comment,f.reasons_json,f.released_at,f.created_at,f.updated_at FROM learning_feedback f JOIN learning_submissions s ON s.id=f.submission_id WHERE s.student_id=? AND f.released_at IS NOT NULL ORDER BY f.updated_at DESC`).bind(session.user_id)
        : env.DB.prepare(`SELECT f.id,f.submission_id,f.teacher_id,f.score,f.total,f.comment,f.reasons_json,f.released_at,f.created_at,f.updated_at FROM learning_feedback f JOIN learning_submissions s ON s.id=f.submission_id WHERE s.school_id=? ORDER BY f.updated_at DESC`).bind(schoolId);
      const result = await query.all();
      return json(request, { ok: true, feedback: (result.results || []).map(row => ({ id: row.id, submissionId: row.submission_id, teacherId: row.teacher_id, score: row.score, total: row.total, comment: row.comment, reasons: parseJson(row.reasons_json, []), releasedAt: row.released_at, createdAt: row.created_at, updatedAt: row.updated_at })) });
    }
    if (!isStaff || request.method !== 'POST') return json(request, { ok: false, code: 'SCOPE_FORBIDDEN', msg: '当前身份不能保存批改反馈' }, 403);
    const body = await request.json().catch(() => ({}));
    const submissionId = boundedText(body.submissionId, 80);
    const submission = await env.DB.prepare('SELECT id,school_id FROM learning_submissions WHERE id=? AND school_id=? LIMIT 1').bind(submissionId, schoolId).first();
    if (!submission) return json(request, { ok: false, code: 'SUBMISSION_NOT_FOUND', msg: '提交记录不存在' }, 404);
    const score = Number(body.score); const total = Number(body.total);
    if (!Number.isFinite(score) || !Number.isFinite(total) || total <= 0 || score < 0 || score > total) return json(request, { ok: false, code: 'INVALID_SCORE', msg: '评分数值不正确' }, 400);
    const stamp = now(); const id = boundedText(body.id || crypto.randomUUID(), 80); const releasedAt = body.release ? (boundedText(body.releasedAt, 80) || stamp) : null;
    await env.DB.batch([
      env.DB.prepare(`INSERT INTO learning_feedback (id,submission_id,teacher_id,score,total,comment,reasons_json,released_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET score=excluded.score,total=excluded.total,comment=excluded.comment,reasons_json=excluded.reasons_json,released_at=excluded.released_at,updated_at=excluded.updated_at`).bind(id, submissionId, session.user_id, score, total, boundedText(body.comment, 5000), jsonText(body.reasons, []), releasedAt, stamp, stamp),
      env.DB.prepare('UPDATE learning_submissions SET score=?,total=?,status=?,updated_at=? WHERE id=?').bind(score, total, releasedAt ? 'returned' : 'done', stamp, submissionId)
    ]);
    return json(request, { ok: true, id, releasedAt, savedAt: stamp });
  }
  if (resource === 'wrongbook') {
    if (request.method === 'GET') {
      const result = await env.DB.prepare('SELECT id,user_id,submission_id,question_id,subject_code,knowledge_node_id,note,review_status,next_review_at,created_at,updated_at FROM wrongbook_entries WHERE user_id=? ORDER BY next_review_at IS NULL,next_review_at,updated_at DESC').bind(session.user_id).all();
      return json(request, { ok: true, entries: (result.results || []).map(row => ({ id: row.id, userId: row.user_id, submissionId: row.submission_id, questionId: row.question_id, subject: row.subject_code, knowledgeNodeId: row.knowledge_node_id, note: row.note, reviewStatus: row.review_status, nextReviewAt: row.next_review_at, createdAt: row.created_at, updatedAt: row.updated_at })) });
    }
    if (request.method !== 'POST' && request.method !== 'PUT') return json(request, { ok: false, code: 'METHOD_NOT_ALLOWED', msg: '错题本只支持保存和读取' }, 405);
    const body = await request.json().catch(() => ({})); const id = boundedText(body.id || crypto.randomUUID(), 80); const stamp = now();
    await env.DB.prepare(`INSERT INTO wrongbook_entries (id,user_id,submission_id,question_id,subject_code,knowledge_node_id,note,review_status,next_review_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET note=excluded.note,review_status=excluded.review_status,next_review_at=excluded.next_review_at,updated_at=excluded.updated_at`).bind(id, session.user_id, boundedText(body.submissionId, 80) || null, boundedText(body.questionId, 80) || null, boundedText(body.subject || body.subjectCode, 40), boundedText(body.knowledgeNodeId, 80) || null, boundedText(body.note, 3000), boundedText(body.reviewStatus, 30) || 'unreviewed', boundedText(body.nextReviewAt, 80) || null, stamp, stamp).run();
    return json(request, { ok: true, id, savedAt: stamp });
  }
  if (resource === 'notes') {
    if (request.method === 'GET') {
      const result = await env.DB.prepare('SELECT id,user_id,subject_code,knowledge_node_id,title,content,created_at,updated_at FROM learning_notes WHERE user_id=? ORDER BY updated_at DESC').bind(session.user_id).all();
      return json(request, { ok: true, notes: (result.results || []).map(row => ({ id: row.id, userId: row.user_id, subject: row.subject_code, knowledgeNodeId: row.knowledge_node_id, title: row.title, content: row.content, createdAt: row.created_at, updatedAt: row.updated_at })) });
    }
    if (request.method !== 'POST' && request.method !== 'PUT') return json(request, { ok: false, code: 'METHOD_NOT_ALLOWED', msg: '笔记只支持保存和读取' }, 405);
    const body = await request.json().catch(() => ({})); const title = boundedText(body.title, 240); const content = boundedText(body.content, 10000); if (!title || !content) return json(request, { ok: false, code: 'NOTE_REQUIRED', msg: '笔记标题和内容不能为空' }, 400);
    const id = boundedText(body.id || crypto.randomUUID(), 80); const stamp = now();
    await env.DB.prepare(`INSERT INTO learning_notes (id,user_id,subject_code,knowledge_node_id,title,content,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET subject_code=excluded.subject_code,knowledge_node_id=excluded.knowledge_node_id,title=excluded.title,content=excluded.content,updated_at=excluded.updated_at`).bind(id, session.user_id, boundedText(body.subject || body.subjectCode, 40) || null, boundedText(body.knowledgeNodeId, 80) || null, title, content, stamp, stamp).run();
    return json(request, { ok: true, id, savedAt: stamp });
  }
  if (resource === 'notifications') {
    if (request.method === 'GET') {
      const result = await env.DB.prepare('SELECT id,kind,title,body,read_at,created_at FROM learning_notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 100').bind(session.user_id).all();
      return json(request, { ok: true, notifications: (result.results || []).map(row => ({ id: row.id, kind: row.kind, title: row.title, body: row.body, readAt: row.read_at, createdAt: row.created_at })) });
    }
    if (request.method !== 'PATCH' || !recordId) return json(request, { ok: false, code: 'METHOD_NOT_ALLOWED', msg: '通知只支持标记已读' }, 405);
    await env.DB.prepare('UPDATE learning_notifications SET read_at=? WHERE id=? AND user_id=?').bind(now(), recordId, session.user_id).run();
    return json(request, { ok: true, id: recordId });
  }
  return json(request, { ok: false, code: 'UNKNOWN_LEARNING_RESOURCE', msg: '学习数据接口不存在' }, 404);
}

async function reportSourceRows(env, session) {
  const rows = await env.DB.prepare('SELECT record_json FROM records WHERE collection_name=? AND school_id=? AND deleted_at IS NULL').bind('grading', session.school_id || '').all();
  const generic = flattenGradingRows(rows.results || []);
  const structuredQuery = session.role === 'student'
    ? env.DB.prepare('SELECT id,assignment_id AS assignmentId,student_id AS userId,status,submitted_at AS submittedAt,score,total,created_at AS createdAt FROM learning_submissions WHERE school_id=? AND student_id=?').bind(session.school_id || '', session.user_id)
    : env.DB.prepare('SELECT id,assignment_id AS assignmentId,student_id AS userId,status,submitted_at AS submittedAt,score,total,created_at AS createdAt FROM learning_submissions WHERE school_id=?').bind(session.school_id || '');
  const structured = await structuredQuery.all();
  return generic.concat(structured.results || []);
}

async function handleReport(request, env, session, reportId) {
  const denied = requireSession(request, env, session);
  if (denied) return denied;
  if (request.method === 'POST' && !reportId) {
    const body = await request.json().catch(() => ({}));
    const subjects = Array.isArray(body.subjects) ? body.subjects : [];
    const period = body.period && typeof body.period === 'object' ? body.period : {};
    const records = await reportSourceRows(env, session);
    const eligibility = evaluateReport(records, subjects, period, session.role === 'student' ? session.user_id : String(body.studentId || ''));
    const statistics = calculateReportStatistics(records, eligibility);
    const id = crypto.randomUUID();
    await env.DB.prepare('INSERT INTO report_runs (id,user_id,report_type,period_start,period_end,subjects_json,eligibility_json,statistics_json,explanation_json,model_id,status,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)')
      .bind(id, session.user_id, subjects.length === 1 ? 'subject' : 'multi_subject', eligibility.period.start || '', eligibility.period.end || '', JSON.stringify(eligibility.subjects), JSON.stringify(eligibility), JSON.stringify(statistics), null, null, eligibility.canGenerate ? 'statistics_ready' : 'ineligible', now()).run();
    return json(request, { ok: true, reportId: id, eligibility, statistics, aiCalled: false });
  }
  if (reportId && request.method === 'PUT') {
    const body = await request.json().catch(() => ({}));
    const row = await env.DB.prepare('SELECT id,user_id FROM report_runs WHERE id=? AND user_id=? LIMIT 1').bind(reportId, session.user_id).first();
    if (!row) return json(request, { ok: false, code: 'REPORT_NOT_FOUND', msg: '报告记录不存在' }, 404);
    const explanation = body.explanation == null ? null : JSON.stringify(body.explanation);
    await env.DB.prepare('UPDATE report_runs SET explanation_json=?,model_id=?,status=? WHERE id=? AND user_id=?').bind(explanation, boundedText(body.modelId, 180) || null, explanation ? 'explained' : 'statistics_ready', reportId, session.user_id).run();
    return json(request, { ok: true, reportId, status: explanation ? 'explained' : 'statistics_ready' });
  }
  if (reportId && request.method === 'GET') {
    const row = await env.DB.prepare('SELECT * FROM report_runs WHERE id=? AND user_id=? LIMIT 1').bind(reportId, session.user_id).first();
    if (!row) return json(request, { ok: false, code: 'REPORT_NOT_FOUND', msg: '报告记录不存在' }, 404);
    return json(request, { ok: true, report: { id: row.id, reportType: row.report_type, period: { start: row.period_start, end: row.period_end }, subjects: parseJson(row.subjects_json, []), eligibility: parseJson(row.eligibility_json, {}), statistics: parseJson(row.statistics_json, {}), explanation: parseJson(row.explanation_json, null), modelId: row.model_id, status: row.status, createdAt: row.created_at } });
  }
  return json(request, { ok: false, code: 'METHOD_NOT_ALLOWED', msg: '报告接口只支持创建、更新和读取' }, 405);
}

async function handleSource(request, env, session) {
  const denied = requireSession(request, env, session);
  if (denied) return denied;
  if (!['admin', 'academic', 'teacher'].includes(session.role)) return json(request, { ok: false, code: 'SCOPE_FORBIDDEN', msg: '当前身份不能管理资料来源' }, 403);
  if (request.method === 'GET') {
    const result = await env.DB.prepare('SELECT id,title,source_url,source_type,acquisition_method,content_hash,completeness,confidence,copyright_status,failure_reason,metadata_json,created_by,created_at,updated_at FROM source_documents WHERE school_id=? ORDER BY updated_at DESC LIMIT 200').bind(session.school_id || '').all();
    return json(request, { ok: true, sources: (result.results || []).map(row => ({ id: row.id, title: row.title, sourceUrl: row.source_url, sourceType: row.source_type, acquisitionMethod: row.acquisition_method, contentHash: row.content_hash, completeness: row.completeness, confidence: row.confidence, copyrightStatus: row.copyright_status, failureReason: row.failure_reason, metadata: parseJson(row.metadata_json, {}), createdBy: row.created_by, createdAt: row.created_at, updatedAt: row.updated_at })) });
  }
  if (request.method !== 'POST') return json(request, { ok: false, code: 'METHOD_NOT_ALLOWED', msg: '资料入口只支持读取和提交' }, 405);
  const body = await request.json().catch(() => ({}));
  const result = body.mode === 'manual' ? createManualSource(body) : await acquirePublicSource(body.sourceUrl || body.url);
  if (!result.ok) {
    const failedAt = now();
    try {
      await env.DB.prepare(`INSERT INTO source_documents (id,school_id,title,source_url,source_type,acquisition_method,content_text,content_hash,completeness,confidence,copyright_status,failure_reason,metadata_json,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
        .bind(crypto.randomUUID(), session.school_id || null, boundedText(body.title || body.sourceUrl || body.url || '资料采集失败', 240), boundedText(body.sourceUrl || body.url, 1000) || null, body.mode === 'manual' ? 'user_supplied' : 'public_web', result.acquisitionMethod || 'direct', null, null, 0, 0, null, boundedText(result.message, 500), JSON.stringify({ code: result.code, robots: result.robots || null, ...(result.metadata || {}) }), session.user_id, failedAt, failedAt).run();
    } catch {}
    return json(request, { ok: false, code: result.code, msg: result.message, acquisitionMethod: result.acquisitionMethod || 'direct', robots: result.robots || null }, 422);
  }
  const hash = await sha256(result.content || ''); const stamp = now(); const id = crypto.randomUUID();
  await env.DB.prepare(`INSERT INTO source_documents (id,school_id,title,source_url,source_type,acquisition_method,content_text,content_hash,completeness,confidence,copyright_status,failure_reason,metadata_json,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .bind(id, session.school_id || null, result.title, result.sourceUrl || null, body.mode === 'manual' ? 'user_supplied' : 'public_web', result.acquisitionMethod, result.content, hash, result.completeness, result.ok ? 0.8 : 0, result.copyrightStatus || null, null, JSON.stringify(result.metadata || {}), session.user_id, stamp, stamp).run();
  return json(request, { ok: true, source: { id, title: result.title, sourceUrl: result.sourceUrl || '', acquisitionMethod: result.acquisitionMethod, completeness: result.completeness, confidence: 0.8, contentHash: hash, metadata: result.metadata || {} }, content: result.content });
}

async function handlePlot(request, env, session, validateOnly) {
  const denied = requireSession(request, env, session);
  if (denied) return denied;
  if (request.method !== 'POST') return json(request, { ok: false, code: 'METHOD_NOT_ALLOWED', msg: '图形接口只支持校验和保存' }, 405);
  const body = await request.json().catch(() => ({})); const validation = validatePlotPayload(body);
  if (!validation.ok) return json(request, { ok: false, code: 'PLOT_VALIDATION_FAILED', msg: '图形没有通过安全或无障碍校验', validation }, 422);
  if (validateOnly) return json(request, { ok: true, saved: false, validation });
  if (!['admin', 'academic', 'teacher'].includes(session.role)) return json(request, { ok: true, validation, saved: false });
  const artifact = plotArtifactRecord(body, validation); const stamp = now(); const id = crypto.randomUUID();
  await env.DB.prepare('INSERT INTO plot_artifacts (id,skill_key,description_json,source_code,svg_text,png_ref,accessibility_text,black_white_check_json,validation_json,version,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)')
    .bind(id, artifact.skillKey, JSON.stringify(artifact.description), artifact.sourceCode || null, artifact.svgText, artifact.pngRef || null, artifact.accessibilityText, JSON.stringify(artifact.blackWhiteCheck), JSON.stringify(artifact.validation), 1, stamp, stamp).run();
  return json(request, { ok: true, saved: true, artifactId: id, validation });
}

async function handlePlotRender(request, env, session) {
  const denied = requireSession(request, env, session);
  if (denied) return denied;
  if (request.method !== 'POST') return json(request, { ok: false, code: 'METHOD_NOT_ALLOWED', msg: '图形渲染接口只支持提交结构化描述' }, 405);
  const body = await request.json().catch(() => ({}));
  try {
    const svgText = renderVectorSvg(body.description || {}, { title: body.title, accessibilityText: body.accessibilityText });
    const validation = validatePlotPayload(Object.assign({}, body, { svgText }));
    if (!validation.ok) return json(request, { ok: false, code: 'PLOT_VALIDATION_FAILED', msg: '图形没有通过安全或无障碍校验', validation }, 422);
    return json(request, { ok: true, rendered: true, svgText, validation });
  } catch (error) {
    return json(request, { ok: false, code: 'PLOT_RENDER_FAILED', msg: error && error.message ? error.message : '图形渲染失败' }, 422);
  }
}

async function handleCollection(request, env, session, name) {
  const denied = requireSession(request, env, session);
  if (denied) return denied;
  if (!COLLECTIONS.has(name)) return json(request, { ok: false, code: 'UNKNOWN_COLLECTION', msg: '数据集合不存在' }, 404);
  if (request.method === 'GET') {
    const query = session.role === 'admin' || session.role === 'academic'
      ? env.DB.prepare('SELECT record_json FROM records WHERE collection_name=? AND deleted_at IS NULL ORDER BY updated_at DESC').bind(name)
      : env.DB.prepare('SELECT record_json FROM records WHERE collection_name=? AND school_id=? AND deleted_at IS NULL ORDER BY updated_at DESC').bind(name, session.school_id || '');
    const result = await query.all();
    const rows = (result.results || []).map(row => { try { return JSON.parse(row.record_json); } catch { return null; } }).filter(Boolean);
    return json(request, rows);
  }
  if (!canWrite(session, name)) return json(request, { ok: false, code: 'SCOPE_FORBIDDEN', msg: '当前身份没有该数据集合的写入权限' }, 403);
  if (request.method !== 'PUT') return json(request, { ok: false, code: 'METHOD_NOT_ALLOWED', msg: '只支持读取或提交集合快照' }, 405);
  const payload = await request.json().catch(() => null);
  const rows = Array.isArray(payload) ? payload : [payload];
  if (rows.some(row => !row || typeof row !== 'object')) return json(request, { ok: false, code: 'INVALID_PAYLOAD', msg: '数据格式不正确' }, 400);
  if (name === 'users') return json(request, { ok: false, code: 'USE_USER_IMPORT_API', msg: '账号必须通过受保护的成员导入接口写入' }, 409);
  const school = session.school_id || '';
  const statements = [env.DB.prepare('DELETE FROM records WHERE collection_name=? AND school_id=?').bind(name, school)];
  rows.forEach(row => {
    const id = String(row.id || crypto.randomUUID());
    const stamp = now();
    statements.push(env.DB.prepare('INSERT INTO records (id,collection_name,school_id,owner_id,record_json,version,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)').bind(id, name, school, session.user_id, JSON.stringify(Object.assign({}, row, { id })), 1, stamp, stamp));
  });
  await env.DB.batch(statements);
  return json(request, { ok: true, collection: name, count: rows.length, savedAt: now() });
}

function safeRemoteUrl(value, env) {
  try {
    const url = new URL(String(value || '').trim());
    if (url.protocol !== 'https:' && envValue(env, 'FH_ALLOW_INSECURE_AI') !== '1') return '';
    if (url.username || url.password) return '';
    return url.toString().replace(/\/$/, '');
  } catch { return ''; }
}

function connectionEndpoint(provider, connection) {
  const meta = parseJson(provider && provider.metadata_json, {});
  const base = String(connection && (connection.baseUrl || connection.endpoint) || provider && provider.api_base || '').trim().replace(/\/$/, '');
  const protocol = String(connection && connection.protocol || meta.protocol || 'openai-chat');
  if (!base) return '';
  if (protocol === 'google-generate-content' || meta.modelPath === 'google-generate-content') {
    const model = encodeURIComponent(String(connection && connection.model || '').trim());
    return model ? base + '/models/' + model + ':generateContent' : '';
  }
  const suffixes = { 'openai-chat': '/chat/completions', 'openai-responses': '/responses', 'anthropic-messages': '/messages', 'cohere-chat': '/chat', 'replicate-predictions': '/predictions' };
  const suffix = String(meta.endpointPath || suffixes[protocol] || '/chat/completions');
  return /\/(chat\/completions|responses|messages|chat|predictions)$/.test(base) ? base : base + suffix;
}

function aiHeaders(provider, connection, key) {
  const meta = parseJson(provider && provider.metadata_json, {});
  const headers = { Accept: 'application/json', 'Content-Type': 'application/json' };
  if (typeof (connection && connection.headers) === 'string') {
    try {
      const parsed = JSON.parse(connection.headers);
      Object.keys(parsed || {}).slice(0, 20).forEach(name => {
        if (/^[A-Za-z0-9-]{1,80}$/.test(name) && typeof parsed[name] === 'string' && !/^authorization$/i.test(name)) headers[name] = parsed[name].slice(0, 400);
      });
    } catch {}
  }
  const authHeader = String(meta.authHeader || '').trim();
  if (key) headers[authHeader === 'x-api-key' ? 'x-api-key' : authHeader || 'Authorization'] = authHeader === 'x-api-key' || authHeader ? key : 'Bearer ' + key;
  Object.keys(meta.extraHeaders || {}).forEach(name => {
    if (/^[A-Za-z0-9-]{1,80}$/.test(name) && typeof meta.extraHeaders[name] === 'string') headers[name] = meta.extraHeaders[name].slice(0, 200);
  });
  if (String(provider && provider.slug) === 'openrouter') { headers['HTTP-Referer'] = 'https://phoenixlearning.xyz'; headers['X-Title'] = '凤凰花·智学'; }
  return headers;
}

function aiRequestBody(protocol, model, messages, maxTokens, temperature) {
  if (protocol === 'anthropic-messages') return { model, system: messages.filter(item => item.role === 'system').map(item => item.content).join('\n'), messages: messages.filter(item => item.role !== 'system'), max_tokens: maxTokens, temperature };
  if (protocol === 'openai-responses') return { model, input: messages, max_output_tokens: maxTokens, temperature };
  if (protocol === 'google-generate-content') {
    const system = messages.filter(item => item.role === 'system').map(item => item.content).join('\n');
    const contents = messages.filter(item => item.role !== 'system').map(item => ({ role: item.role === 'assistant' ? 'model' : 'user', parts: [{ text: item.content }] }));
    return { systemInstruction: system ? { parts: [{ text: system }] } : undefined, contents, generationConfig: { temperature, maxOutputTokens: maxTokens } };
  }
  if (protocol === 'cohere-chat') return { model, messages, temperature, max_tokens: maxTokens };
  if (protocol === 'replicate-predictions') return { version: model, input: { prompt: messages.map(item => item.content).join('\n') } };
  return { model, messages, max_tokens: maxTokens, temperature };
}

function aiResponseContent(payload, protocol) {
  if (!payload) return '';
  if (protocol === 'anthropic-messages') return (payload.content || []).map(item => item && item.text || '').join('').trim();
  if (protocol === 'openai-responses') return String(payload.output_text || (payload.output || []).flatMap(item => item && item.content || []).map(item => item && (item.text || item.value) || '').join('') || '').trim();
  if (protocol === 'google-generate-content') return (payload.candidates || []).flatMap(item => item && item.content && item.content.parts || []).map(item => item && item.text || '').join('').trim();
  if (protocol === 'cohere-chat') return String(payload.text || (payload.message && payload.message.content && payload.message.content[0] && payload.message.content[0].text) || '').trim();
  if (protocol === 'replicate-predictions') return Array.isArray(payload.output) ? payload.output.join('') : String(payload.output || '').trim();
  const content = payload.choices && payload.choices[0] && payload.choices[0].message && payload.choices[0].message.content;
  return Array.isArray(content) ? content.map(item => item && (item.text || item.content) || '').join('').trim() : String(content || '').trim();
}

async function handleAi(request, env, session) {
  const denied = requireSession(request, env, session);
  if (denied) return denied;
  const body = await request.json().catch(() => ({}));
  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (!messages.length || messages.length > 80 || messages.some(x => !x || !['system', 'user', 'assistant'].includes(x.role) || typeof x.content !== 'string' || x.content.length > 120000)) return json(request, { ok: false, code: 'INVALID_MESSAGES', msg: 'AI 请求内容不完整或超过长度限制' }, 400);
  const workflow = String(body.workflow || '').trim();
  const connection = body.connection && typeof body.connection === 'object' ? body.connection : {};
  let provider = null;
  if (env.DB && connection.provider) provider = await env.DB.prepare('SELECT * FROM model_registry_providers WHERE slug=? OR id=? LIMIT 1').bind(String(connection.provider), String(connection.provider)).first();
  const meta = parseJson(provider && provider.metadata_json, {});
  const protocol = String(connection.protocol || meta.protocol || runtimeProtocol || 'openai-chat');
  const selectedEndpoint = provider ? connectionEndpoint(provider, connection) : String(connection.endpoint || runtimeEndpoint || '').trim();
  const endpoint = safeRemoteUrl(selectedEndpoint || envValue(env, 'FH_AI_ENDPOINT'), env);
  const model = String(connection.model || runtimeModel || envValue(env, 'FH_AI_MODEL')).trim().slice(0, 180);
  const key = String(connection.apiKey || (provider && provider.auth_env ? envValue(env, provider.auth_env) : '') || envValue(env, 'FH_AI_KEY')).trim().slice(0, 1000);
  if (!endpoint || !model || !key) return json(request, { ok: false, code: 'AI_NOT_CONFIGURED', msg: '当前 AI 连接缺少安全接口地址、模型或 API Key' }, 503);
  const requestedTokens = Number(body.maxTokens);
  const maxTokens = Math.min(Math.max(Number.isFinite(requestedTokens) ? requestedTokens : 1600, 64), 8000);
  const temperature = Number.isFinite(Number(body.temperature)) ? Math.min(Math.max(Number(body.temperature), 0), 2) : 0.2;
  const response = await fetch(endpoint, { method: 'POST', headers: aiHeaders(provider, connection, key), body: JSON.stringify(aiRequestBody(protocol, model, messages, maxTokens, temperature)) }).catch(() => null);
  if (!response) { await recordWorkflowRun(env, session, workflow, messages, model, 'upstream_unavailable', {}, {}); return json(request, { ok: false, code: 'UPSTREAM_UNAVAILABLE', msg: '在线 AI 服务暂时不可用' }, 502); }
  const upstream = await response.json().catch(() => ({}));
  if (!response.ok) { const retryable = response.status === 429 || response.status >= 500; await recordWorkflowRun(env, session, workflow, messages, model, response.status === 429 ? 'rate_limited' : response.status === 401 ? 'auth_expired' : 'upstream_error', upstream.usage || {}, { httpStatus: response.status, provider: provider && provider.slug || null }); return json(request, { ok: false, code: response.status === 429 ? 'RATE_LIMITED' : response.status === 401 ? 'AUTH_EXPIRED' : 'UPSTREAM_ERROR', retryable, msg: '在线 AI 服务返回错误' }, response.status); }
  const usage = upstream.usage || {};
  const content = aiResponseContent(upstream, protocol);
  if (!content) { await recordWorkflowRun(env, session, workflow, messages, model, 'empty_output', usage, { provider: provider && provider.slug || null }); return json(request, { ok: false, code: 'EMPTY_MODEL_OUTPUT', msg: '模型没有返回可渲染内容', retryable: true }, 502); }
  await recordWorkflowRun(env, session, workflow, messages, model, 'success', usage, { upstreamId: upstream.id || null, provider: provider && provider.slug || null, protocol });
  return json(request, { ok: true, model, provider: provider && provider.slug || null, protocol, workflow: workflow || null, content, usage });
}

export default {
  async scheduled(controller, env) {
    await ensureCoreSchema(env);
    await ensureProviderDirectory(env);
    await ensureReferenceSchema(env);
    await ensureLearningSchema(env);
    if (!env.DB) return;
    const providers = await env.DB.prepare('SELECT * FROM model_registry_providers ORDER BY name').all();
    const list = providers.results || [];
    for (let i = 0; i < list.length; i += 4) await Promise.all(list.slice(i, i + 4).map(provider => syncOneModelProvider(env, provider)));
  },
  async fetch(request, env) {
    request = withEnv(request, env);
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return emptyResponse(request, env);
    await ensureCoreSchema(env);
    await ensureProviderDirectory(env);
    await ensureReferenceSchema(env);
    await ensureLearningSchema(env);
    const session = await getSession(request, env);
    try {
    if (url.pathname === '/api/ping' || url.pathname === '/api/health') {
      const binding = !!env.DB;
      let schemaReady = false;
      if (binding) {
        try { schemaReady = !!(await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").first()); } catch {}
      }
      const body = { ok: schemaReady, service: schemaReady ? 'ready' : 'degraded', storage: binding ? 'd1' : 'unavailable', database: { configured: binding, schemaReady }, authentication: 'session', tokenRequired: true, ai: { configured: !!(envValue(env, 'FH_AI_ENDPOINT') && envValue(env, 'FH_AI_MODEL') && envValue(env, 'FH_AI_KEY')), source: 'server_env' }, checkedAt: now() };
      return json(request, body, schemaReady ? 200 : 503);
    }
    if (url.pathname === '/api/auth/login' && request.method === 'POST') return env.DB ? handleLogin(request, env) : requireDb(request, env);
    if (url.pathname === '/api/auth/activate' && request.method === 'POST') return handleActivate(request, env, session);
    if (url.pathname === '/api/auth/change-password' && request.method === 'POST') return handleChangePassword(request, env, session);
    if (url.pathname === '/api/auth/logout' && request.method === 'POST') {
      if (session) await env.DB.prepare('UPDATE sessions SET revoked_at=? WHERE id=?').bind(now(), session.session_id).run();
      return json(request, { ok: true });
    }
    if (url.pathname === '/api/auth/me' && request.method === 'GET') {
      const denied = requireSession(request, env, session); if (denied) return denied;
      return json(request, { ok: true, user: { id: session.user_id, schoolId: session.school_id, role: session.role } });
    }
    if (url.pathname === '/api/ai/status' && request.method === 'GET') {
      const configured = !!(envValue(env, 'FH_AI_ENDPOINT') && envValue(env, 'FH_AI_MODEL') && envValue(env, 'FH_AI_KEY'));
      return json(request, { ok: true, status: configured ? 'configured' : 'unconfigured', configured, source: 'server_env', lastVerifiedAt: envValue(env, 'FH_AI_LAST_VERIFIED_AT') || null });
    }
    if (url.pathname === '/api/ai/chat' && request.method === 'POST') return handleAi(request, env, session);
    if (url.pathname === '/api/reference/catalog' && request.method === 'GET') return handleCatalogReference(request, env);
    if (url.pathname === '/api/reference/models' && request.method === 'GET') return handleModelReference(request, env);
    const learningMatch = url.pathname.match(/^\/api\/learning\/(assignments|submissions|feedback|wrongbook|notes|notifications)(?:\/([^/]+))?$/);
    if (learningMatch) return handleLearning(request, env, session, learningMatch[1], learningMatch[2] ? decodeURIComponent(learningMatch[2]) : '');
    const reportMatch = url.pathname.match(/^\/api\/analytics\/reports(?:\/([^/]+))?$/);
    if (reportMatch) return handleReport(request, env, session, reportMatch[1] ? decodeURIComponent(reportMatch[1]) : '');
    if (url.pathname === '/api/sources') return handleSource(request, env, session);
    if (url.pathname === '/api/plots/render') return handlePlotRender(request, env, session);
    if (url.pathname === '/api/plots/validate') return handlePlot(request, env, session, true);
    if (url.pathname === '/api/plots') return handlePlot(request, env, session, false);
    if (url.pathname === '/api/admin/users' && request.method === 'POST') return handleCreateUser(request, env, session);
    if (url.pathname === '/api/admin/content-audit' && request.method === 'GET') return handleContentAudit(request, env, session);
    if (url.pathname === '/api/admin/models/sync' && request.method === 'POST') return handleModelSync(request, env, session);
    if (url.pathname === '/api/admin/ai-key' || url.pathname === '/api/super-admin/ai-config') return json(request, { ok: false, code: 'SERVER_ENV_ONLY', msg: 'AI 密钥只能由站点服务端环境变量管理' }, 410);
    const match = url.pathname.match(/^\/api\/col\/([A-Za-z0-9_]+)$/);
    if (match) return handleCollection(request, env, session, match[1]);
    if (env.ASSETS) {
      const path = url.pathname === '/' ? '/index.html' : url.pathname;
      const asset = await env.ASSETS.fetch(new Request(new URL(path, request.url), request));
      if (asset.status !== 404) return asset;
    }
    return new Response('Not Found', { status: 404, headers: cors(request, env) });
  } catch (error) {
    return json(request, { ok: false, code: 'SERVER_ERROR', msg: '服务暂时无法完成请求' }, 500);
  }
  }
};
