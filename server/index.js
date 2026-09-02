/* 凤凰花·智学网络服务 v3
 * 只有 D1 和经过鉴权的网络会话可以读写业务数据。
 * 没有数据库或没有会话时，服务明确返回不可用，不再回退浏览器数据或示例题库。
 */
'use strict';

const COLLECTIONS = new Set([
  'users', 'schools', 'campuses', 'academic_years', 'terms', 'classes', 'class_snapshots',
  'class_memberships', 'student_enrollments', 'teacher_employments', 'teacher_subject_assignments',
  'class_subject_offerings', 'promotion_batches', 'transfer_records', 'course_completions',
  'graduation_archives', 'resources', 'notices', 'papers', 'grading', 'plans', 'profiles',
  'knowledge', 'content_tags', 'goals', 'plan_tasks', 'learning_events',
  'recommendation_feedback', 'review_schedule', 'data_dictionary', 'question_manifests',
  'explanations', 'model_providers', 'api_models', 'source_records', 'audit'
]);

const ROLE_WRITES = {
  admin: new Set(COLLECTIONS),
  academic: new Set(['users', 'classes', 'class_snapshots', 'class_memberships', 'student_enrollments', 'teacher_employments', 'teacher_subject_assignments', 'class_subject_offerings', 'promotion_batches', 'transfer_records', 'course_completions', 'graduation_archives', 'notices', 'audit']),
  teacher: new Set(['resources', 'papers', 'grading', 'plans', 'profiles', 'question_manifests', 'explanations', 'learning_events', 'recommendation_feedback', 'review_schedule', 'audit']),
  student: new Set(['profiles', 'learning_events', 'recommendation_feedback', 'review_schedule'])
};

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
    env.DB.prepare('CREATE INDEX IF NOT EXISTS sessions_token_digest_idx ON sessions(token_digest)'),
    env.DB.prepare('CREATE INDEX IF NOT EXISTS records_collection_school_idx ON records(collection_name,school_id,updated_at)')
  ]).then(() => true).catch(() => { schemaPromise = null; return false; });
  return schemaPromise;
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

async function handleAi(request, env, session) {
  const denied = requireSession(request, env, session);
  if (denied) return denied;
  const endpoint = runtimeEndpoint || envValue(env, 'FH_AI_ENDPOINT');
  const model = runtimeModel || envValue(env, 'FH_AI_MODEL');
  const key = envValue(env, 'FH_AI_KEY');
  if (!endpoint || !model || !key) return json(request, { ok: false, code: 'AI_NOT_CONFIGURED', msg: '学校尚未配置网络 AI 服务' }, 503);
  const body = await request.json().catch(() => ({}));
  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (!messages.length || messages.some(x => !x || !['system', 'user', 'assistant'].includes(x.role) || typeof x.content !== 'string')) return json(request, { ok: false, code: 'INVALID_MESSAGES', msg: 'AI 请求内容不完整' }, 400);
  const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key }, body: JSON.stringify({ model, messages, max_tokens: Math.min(Number(body.maxTokens || 1600), 8000), temperature: Number.isFinite(body.temperature) ? body.temperature : 0.2 }) }).catch(() => null);
  if (!response) return json(request, { ok: false, code: 'UPSTREAM_UNAVAILABLE', msg: '在线 AI 服务暂时不可用' }, 502);
  const upstream = await response.json().catch(() => ({}));
  if (!response.ok) return json(request, { ok: false, code: response.status === 429 ? 'RATE_LIMITED' : response.status === 401 ? 'AUTH_EXPIRED' : 'UPSTREAM_ERROR', msg: '在线 AI 服务返回错误' }, response.status);
  return json(request, { ok: true, model, content: upstream.choices?.[0]?.message?.content || '' });
}

export default { async fetch(request, env) {
  request = withEnv(request, env);
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') return emptyResponse(request, env);
  await ensureCoreSchema(env);
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
    if (url.pathname === '/api/admin/users' && request.method === 'POST') return handleCreateUser(request, env, session);
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
} };
