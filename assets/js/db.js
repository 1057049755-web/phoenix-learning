/* ================= 凤凰花·智学 正式版 · 本地优先数据层 =================
 * 版本：v2（与旧演示数据完全隔离，命名空间 fh_v2_*）
 * 能力：
 *  1) 本地存储（localStorage）兜底，file:// 直开可用；
 *  2) 云端同步：检测到 server/ 云服务后，所有集合读写走 REST API，
 *     数据以 JSON 落盘到服务端 data/（配置文件夹）；每次打开页面自动拉取；
 *  3) 账号体系：管理员 / 教务处 / 教师 / 学生四级角色；导入账号首次登录视为正式激活；
 *  4) 成员 CSV 导入 / 导出（Excel 兼容）；
 *  5) 资料贡献 + AI 美化排版（AI 未配置时用本地排版器兜底）；
 *  6) 学习计划与配套习题、投入计划按学生账户保存。
 * 说明：密码使用带账号盐的同步哈希；账号姓名、手机号、班级等个人字段以
 *       加密快照写入浏览器缓存、同步队列与云端集合，内存中才恢复为可用字段。
 */
(function () {
  'use strict';

  const NS = 'fh_v2';

  /* ---------- 轻量同步 SHA-256（跨 file:// / WebView / http 可用） ---------- */
  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];
  function sha256(ascii) {
    const words = [];
    const bitLen = ascii.length * 8;
    let i, j;
    for (i = 0; i < ascii.length; i++) {
      const c = ascii.charCodeAt(i);
      if (c > 255) { ascii = encodeURIComponent(ascii).replace(/%([0-9A-F]{2})/g, (m, h) => String.fromCharCode(parseInt(h, 16))); return sha256(ascii); }
      words[i >> 2] = (words[i >> 2] || 0) | (c << (24 - (i % 4) * 8));
    }
    words[i >> 2] = (words[i >> 2] || 0) | (0x80 << (24 - (i % 4) * 8));
    const lenBase = ((i + 8) >> 6) << 4;
    words[lenBase + 14] = Math.floor(bitLen / 0x100000000); // 长度高 32 位
    words[lenBase + 15] = bitLen % 0x100000000;             // 长度低 32 位
    const w = new Array(64);
    let a = 0x6a09e667, b = 0xbb67ae85, c = 0x3c6ef372, d = 0xa54ff53a,
      e = 0x510e527f, f = 0x9b05688c, g = 0x1f83d9ab, h = 0x5be0cd19;
    for (i = 0; i < words.length; i += 16) {
      for (j = 0; j < 16; j++) w[j] = words[i + j] || 0;
      for (j = 16; j < 64; j++) {
        const s0 = rotr(w[j - 15], 7) ^ rotr(w[j - 15], 18) ^ (w[j - 15] >>> 3);
        const s1 = rotr(w[j - 2], 17) ^ rotr(w[j - 2], 19) ^ (w[j - 2] >>> 10);
        w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
      }
      let A = a, B = b, C = c, D = d, E = e, F = f, G = g, H = h;
      for (j = 0; j < 64; j++) {
        const S1 = rotr(E, 6) ^ rotr(E, 11) ^ rotr(E, 25);
        const ch = (E & F) ^ (~E & G);
        const t1 = (H + S1 + ch + K[j] + w[j]) | 0;
        const S0 = rotr(A, 2) ^ rotr(A, 13) ^ rotr(A, 22);
        const maj = (A & B) ^ (A & C) ^ (B & C);
        const t2 = (S0 + maj) | 0;
        H = G; G = F; F = E; E = (D + t1) | 0; D = C; C = B; B = A; A = (t1 + t2) | 0;
      }
      a = (a + A) | 0; b = (b + B) | 0; c = (c + C) | 0; d = (d + D) | 0;
      e = (e + E) | 0; f = (f + F) | 0; g = (g + G) | 0; h = (h + H) | 0;
    }
    return hex(a) + hex(b) + hex(c) + hex(d) + hex(e) + hex(f) + hex(g) + hex(h);
  }
  function rotr(x, n) { return (x >>> n) | (x << (32 - n)); }
  function hex(n) {
    let s = (n >>> 0).toString(16);
    while (s.length < 8) s = '0' + s;
    return s;
  }

  function hashPassword(pw, salt) {
    return sha256('fh_v2:' + (salt || 'fh') + ':' + pw);
  }

  /* ---------- 账号敏感字段：加密快照（存储层不落明文） ---------- */
  function utf8Bytes(text) {
    const raw = unescape(encodeURIComponent(String(text == null ? '' : text)));
    const bytes = [];
    for (let i = 0; i < raw.length; i++) bytes.push(raw.charCodeAt(i));
    return bytes;
  }
  function bytesText(bytes) {
    let raw = '';
    for (let i = 0; i < bytes.length; i++) raw += String.fromCharCode(bytes[i]);
    try { return decodeURIComponent(escape(raw)); } catch (e) { return raw; }
  }
  function base64(bytes) {
    let raw = '';
    for (let i = 0; i < bytes.length; i++) raw += String.fromCharCode(bytes[i]);
    return btoa(raw);
  }
  function unbase64(value) {
    const raw = atob(String(value || ''));
    const bytes = [];
    for (let i = 0; i < raw.length; i++) bytes.push(raw.charCodeAt(i));
    return bytes;
  }
  function cryptBytes(bytes, field, nonce) {
    const out = [];
    for (let i = 0; i < bytes.length; i++) {
      const block = sha256('fh_v2:account:' + field + ':' + nonce + ':' + Math.floor(i / 32));
      const key = parseInt(block.slice((i % 32) * 2, (i % 32) * 2 + 2), 16);
      out.push(bytes[i] ^ key);
    }
    return out;
  }
  function encryptField(value, field, nonce) {
    return 'fh1.' + base64(cryptBytes(utf8Bytes(value), field, nonce));
  }
  function decryptField(value, field, nonce) {
    if (!value || String(value).indexOf('fh1.') !== 0) return '';
    try { return bytesText(cryptBytes(unbase64(String(value).slice(4)), field, nonce)); } catch (e) { return ''; }
  }
  const ACCOUNT_FIELDS = ['phone', 'name', 'cls', 'grade', 'schoolId', 'departmentId', 'classId'];
  function secureUserSnapshot(user) {
    const copy = JSON.parse(JSON.stringify(user || {}));
    const nonce = copy.securityNonce || uid('sec');
    ACCOUNT_FIELDS.forEach(field => {
      if (copy[field] !== undefined && copy[field] !== null && copy[field] !== '') {
        copy[field + 'Enc'] = encryptField(copy[field], field, nonce);
        delete copy[field];
      }
    });
    if (Array.isArray(copy.classIds)) {
      copy.classIdsEnc = encryptField(JSON.stringify(copy.classIds), 'classIds', nonce);
      delete copy.classIds;
    }
    copy.securityNonce = nonce;
    copy.securityVersion = 1;
    return copy;
  }
  function hydrateUser(raw) {
    const user = Object.assign({}, raw || {});
    const nonce = user.securityNonce || '';
    ACCOUNT_FIELDS.forEach(field => {
      if (user[field] === undefined && user[field + 'Enc']) user[field] = decryptField(user[field + 'Enc'], field, nonce);
      delete user[field + 'Enc'];
    });
    if (!user.classIds && user.classIdsEnc) {
      try { user.classIds = JSON.parse(decryptField(user.classIdsEnc, 'classIds', nonce) || '[]'); } catch (e) { user.classIds = []; }
    }
    delete user.classIdsEnc;
    user.role = ['admin', 'academic', 'teacher', 'student'].includes(user.role) ? user.role : 'teacher';
    user.schoolId = user.schoolId || 'school_default';
    user.classIds = Array.isArray(user.classIds) ? user.classIds : (user.cls ? [user.cls] : []);
    return user;
  }
  function secureUsersSnapshot(usersList) { return (usersList || []).map(secureUserSnapshot); }

  /* ---------- 基础工具 ---------- */
  let seq = 1;
  function uid(prefix) {
    return (prefix || 'id') + '_' + Date.now().toString(36) + '_' + (seq++).toString(36) + '_' + Math.random().toString(36).slice(2, 7);
  }
  function today() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function now() {
    return new Date().toISOString();
  }

  /* ---------- 存储 ---------- */
  const LS = {
    read(key) {
      try { return JSON.parse(localStorage.getItem(NS + '_' + key)); } catch (e) { return null; }
    },
    write(key, val) {
      try { localStorage.setItem(NS + '_' + key, JSON.stringify(val)); return true; } catch (e) { return false; }
    },
    remove(key) {
      try { localStorage.removeItem(NS + '_' + key); } catch (e) {}
    }
  };

  // 本地优先的数据集合。每个集合在 server/data/ 中对应一个 JSON 文件；
  // 没有本地服务时则自动退回同名 localStorage 键，便于后续迁移到 SQLite / PostgreSQL。
  const COLLECTIONS = [
    'users', 'schools', 'classes', 'resources', 'notices', 'papers', 'grading', 'plans', 'audit',
    'profiles', 'knowledge', 'content_tags', 'goals', 'plan_tasks',
    'learning_events', 'recommendation_feedback', 'review_schedule', 'data_dictionary'
  ];
  const empty = {
    users: [],
    schools: [],
    classes: [],
    resources: [],
    notices: [],
    papers: [],
    grading: { recognized: [], grading: [], review: [], done: [] },
    plans: [],
    audit: [],
    profiles: [],
    knowledge: [],
    content_tags: [],
    goals: [],
    plan_tasks: [],
    learning_events: [],
    recommendation_feedback: [],
    review_schedule: [],
    data_dictionary: []
  };

  let data = {};
  let cloud = false;         // 本机数据服务可用？（保留变量名以兼容旧接口）
  let cloudErr = '';
  let listeners = [];
  const syncChains = {};
  let syncBusy = false;

  function resetData() {
    data = JSON.parse(JSON.stringify(empty));
  }
  resetData();

  /* ---------- 云端（server/ 提供的 REST API） ---------- */
  function networkUrl(path) {
    return window.FHNetwork && window.FHNetwork.url ? window.FHNetwork.url(path) : path;
  }
  function networkEnabled() {
    return (location.protocol === 'http:' || location.protocol === 'https:') || !!(window.FHNetwork && window.FHNetwork.configured && window.FHNetwork.configured());
  }
  function explicitNetwork() {
    return !!(window.FHNetwork && window.FHNetwork.configured && window.FHNetwork.configured());
  }
  function authToken() {
    if (window.FHNetwork && window.FHNetwork.getToken) return window.FHNetwork.getToken();
    try { return localStorage.getItem(NS + '_token') || new URLSearchParams(location.search).get('fh_token') || ''; } catch (e) { return ''; }
  }
  function readSyncQueue() {
    const queue = LS.read('sync_queue');
    return queue && typeof queue === 'object' ? queue : {};
  }
  function syncQueueCount() { return Object.keys(readSyncQueue()).length; }
  function writeSyncQueue(queue) { LS.write('sync_queue', queue); }
  function queueSnapshot(name, value, error) {
    const queue = readSyncQueue();
    queue[name] = { value: value, queuedAt: now(), lastError: String(error || '网络暂不可用') };
    writeSyncQueue(queue);
    cloudErr = '本地已保存，网络恢复后自动重试（待同步 ' + Object.keys(queue).length + ' 项）';
    if (window.FHNetwork && window.FHNetwork.report) window.FHNetwork.report(false, cloudErr, 0);
  }
  function clearQueuedSnapshot(name, value) {
    const queue = readSyncQueue();
    if (!queue[name]) return;
    if (value === undefined || JSON.stringify(queue[name].value) === JSON.stringify(value)) delete queue[name];
    writeSyncQueue(queue);
  }
  async function api(method, path, body) {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    const token = authToken();
    if (token) opts.headers['Authorization'] = 'Bearer ' + token;
    if (body !== undefined) opts.body = JSON.stringify(body);
    const res = await fetch(networkUrl(path), opts);
    if (!res.ok) { const error = new Error('HTTP ' + res.status); error.status = res.status; throw error; }
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }

  async function detectCloud() {
    // file:// 直开时没有配置 API 地址就跳过探测；显式配置后允许连接局域网服务。
    if (!networkEnabled()) {
      cloud = false;
      cloudErr = '当前为本地文件模式，数据存于浏览器；部署 server/ 后访问 http(s) 地址即可上云';
      return cloud;
    }
    try {
      const r = await fetch(networkUrl('/api/ping'), { method: 'GET', headers: window.FHNetwork && window.FHNetwork.headers ? window.FHNetwork.headers() : {} });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const j = await r.json();
      cloud = !!(j && j.ok && j.storage !== 'browser-local');
      cloudErr = j && j.storage === 'browser-local'
        ? '当前站点为静态模式，数据保存在浏览器；如需多端共享请填写 API 地址'
        : j && j.tokenRequired && !authToken() ? '服务已连接，但写入需要访问令牌；数据仍先保存在本机' : '';
      if (window.FHNetwork && window.FHNetwork.report) window.FHNetwork.report(cloud, cloud ? '服务已连接' : '服务返回异常', r.status);
    } catch (e) {
      cloud = false;
      cloudErr = '数据服务暂不可用，本地仍可使用；恢复网络后会自动重试';
      if (window.FHNetwork && window.FHNetwork.report) window.FHNetwork.report(false, cloudErr, e.status || 0);
    }
    return cloud;
  }

  async function cloudLoadAll() {
    const pending = readSyncQueue();
    for (const name of COLLECTIONS) {
      // 本地有尚未送达的更新时，先保留本地版本，避免重新打开页面把离线操作覆盖掉。
      if (pending[name]) continue;
      try {
        const j = await api('GET', '/api/col/' + name);
        if (j && Array.isArray(j)) data[name] = name === 'users' ? j.map(hydrateUser) : j;
        else if (j && typeof j === 'object' && name === 'grading') data.grading = Object.assign({ recognized: [], grading: [], review: [], done: [] }, j);
      } catch (e) { /* 单个集合失败不阻断 */ }
    }
  }

  function scheduleSync(name, value) {
    const payload = JSON.parse(JSON.stringify(value));
    syncChains[name] = (syncChains[name] || Promise.resolve()).then(async () => {
      try {
        await api('PUT', '/api/col/' + name, payload);
        clearQueuedSnapshot(name, payload);
        cloudErr = '';
        if (window.FHNetwork && window.FHNetwork.report) window.FHNetwork.report(true, '数据已同步', 200);
        return true;
      } catch (e) {
        queueSnapshot(name, payload, e && e.message);
        return false;
      }
    });
    return syncChains[name];
  }

  async function flushSync() {
    if (syncBusy || !networkEnabled()) return { ok: false, synced: 0, pending: syncQueueCount() };
    syncBusy = true;
    let synced = 0;
    try {
      if (!cloud) await detectCloud();
      if (!cloud) return { ok: false, synced: 0, pending: syncQueueCount() };
      const queue = readSyncQueue();
      for (const name of Object.keys(queue)) {
        if (!COLLECTIONS.includes(name)) { delete queue[name]; continue; }
        const item = queue[name];
        try {
          await api('PUT', '/api/col/' + name, item.value);
          clearQueuedSnapshot(name, item.value);
          synced++;
        } catch (e) {
          queueSnapshot(name, item.value, e && e.message);
        }
      }
      if (!syncQueueCount()) cloudErr = '';
      return { ok: !syncQueueCount(), synced: synced, pending: syncQueueCount() };
    } finally { syncBusy = false; }
  }

  async function reconnect() {
    await detectCloud();
    return flushSync();
  }

  function persist(name, value) {
    if (value !== undefined && COLLECTIONS.includes(name)) data[name] = value;
    const snapshot = name === 'users' ? secureUsersSnapshot(data[name]) : data[name];
    LS.write(name, snapshot);
    if (cloud) scheduleSync(name, snapshot);
    else if (networkEnabled() && explicitNetwork()) queueSnapshot(name, snapshot, cloudErr || '数据服务未连接');
    listeners.forEach(fn => { try { fn(name); } catch (e) {} });
  }

  /* ---------- 初始化与种子数据 ---------- */
  function seed() {
    data.users = (data.users || []).map(hydrateUser);
    const bootstrap = data.users.find(u => u.phone === '13800000001' && u.name === '系统管理员');
    if (bootstrap && bootstrap.role === 'superadmin') { bootstrap.role = 'admin'; persist('users'); }
    if (!data.users.length) {
      const admin = {
        id: uid('u'), name: '系统管理员', phone: '13800000001',
        passwordHash: hashPassword('admin123'),
        role: 'admin', cls: '学校管理', grade: '', schoolId: 'school_default', departmentId: '管理中心', classIds: [],
        status: '正常', createdAt: now(), activatedAt: now(), lastLoginAt: null,
        plan: null, exercises: [], schedule: null, wrongs: [], submissions: []
      };
      data.users.push(admin);
      persist('users');
    }
    // 旧版本账号可能仍以明文结构进入内存；初始化完成后立即覆盖为加密快照。
    if (data.users.length) persist('users');
  }

  async function init() {
    resetData();
    // 先读本地缓存
    for (const name of COLLECTIONS) {
      const local = LS.read(name);
      if (local) data[name] = name === 'users' && Array.isArray(local) ? local.map(hydrateUser) : local;
    }
    // 探测云端并拉取（每次打开网页都将配置文件夹中的资源调用）
    const hasCloud = await detectCloud();
    if (hasCloud) await cloudLoadAll();
    seed();
    if (hasCloud) await flushSync();
    return { cloud, cloudErr };
  }

  try { window.addEventListener('online', () => { reconnect(); }); } catch (e) {}

  /* ---------- 账号 ---------- */
  function findUser(phone) {
    return (data.users || []).find(u => u.phone === String(phone).trim());
  }
  function users(filter) {
    return data.users.slice().sort((a, b) => a.createdAt < b.createdAt ? -1 : 1);
  }

  function login(phone, password) {
    const u = findUser(phone);
    if (!u) return { ok: false, msg: '账号不存在，请联系管理员导入或注册' };
    if (u.status === '已禁用') return { ok: false, msg: '账号已被禁用，请联系管理员' };
    if (hashPassword(password, u.phone) !== u.passwordHash && hashPassword(password) !== u.passwordHash) {
      return { ok: false, msg: '手机号或密码错误' };
    }
    u.lastLoginAt = now();
    const needActivate = u.status === '待激活';
    persist('users');
    return { ok: true, user: u, needActivate };
  }

  function activate(phone, newPassword) {
    const u = findUser(phone);
    if (!u) return { ok: false, msg: '账号不存在' };
    u.passwordHash = hashPassword(newPassword, u.phone);
    u.status = '正常';
    u.activatedAt = now();
    u.lastLoginAt = now();
    persist('users');
    pushNotice('账号已激活：' + (u.name || u.phone) + ' 完成首次登录并设置密码。', '账号');
    return { ok: true, user: u };
  }

  function changePassword(phone, oldPassword, newPassword) {
    const u = findUser(phone);
    if (!u) return { ok: false, msg: '账号不存在' };
    if (hashPassword(oldPassword, u.phone) !== u.passwordHash && hashPassword(oldPassword) !== u.passwordHash) {
      return { ok: false, msg: '原密码错误' };
    }
    u.passwordHash = hashPassword(newPassword, u.phone);
    persist('users');
    return { ok: true, user: u };
  }

  const ROLE_LEVEL = { student: 0, teacher: 1, academic: 2, admin: 3 };
  function normalizeRole(role) {
    const value = String(role || '').trim().toLowerCase();
    if (['学生', 'student'].includes(value)) return 'student';
    if (['教务处', '教务', 'academic'].includes(value)) return 'academic';
    if (['管理员', '管理', 'admin'].includes(value)) return 'admin';
    return 'teacher';
  }
  function canManageRole(actor, targetRole) {
    if (!actor) return true;
    const current = ROLE_LEVEL[normalizeRole(actor.role)];
    const target = ROLE_LEVEL[normalizeRole(targetRole)];
    return current > target && target >= 0;
  }
  function teacherOwnsClass(actor, target) {
    if (!actor || actor.role !== 'teacher' || !target || target.role !== 'student') return false;
    if (actor.classId && target.classId && String(actor.classId) === String(target.classId)) return true;
    if (meaningfulClass(actor.cls) && meaningfulClass(target.cls) && String(actor.cls) === String(target.cls)) return true;
    const ids = Array.isArray(actor.classIds) ? actor.classIds.map(String) : [];
    return !!target.classId && ids.includes(String(target.classId));
  }
  function canManageUser(actor, target) {
    if (!actor || !target) return true;
    if (!canManageRole(actor, target.role)) return false;
    if (actor.role === 'admin') return true;
    if (actor.role === 'teacher') return teacherOwnsClass(actor, target);
    return String(actor.schoolId || 'school_default') === String(target.schoolId || 'school_default');
  }
  function classKey(name, schoolId) {
    return 'class_' + sha256(String(schoolId || 'school_default') + ':' + String(name || '')).slice(0, 16);
  }
  function meaningfulClass(name) {
    return name && !['未分班', '教师组', '学校管理', '管理中心', '教务处'].includes(String(name));
  }
  function ensureClass(name, grade, schoolId, teacherId) {
    const label = String(name || '').trim();
    if (!meaningfulClass(label)) return null;
    data.classes = Array.isArray(data.classes) ? data.classes : [];
    const sid = String(schoolId || 'school_default');
    const id = classKey(label, sid);
    let item = data.classes.find(x => String(x.id) === id);
    if (!item) {
      item = { id: id, name: label, grade: String(grade || ''), schoolId: sid, teacherIds: [], studentIds: [], status: '正常', createdAt: now(), updatedAt: now() };
      data.classes.push(item);
    }
    if (grade && !item.grade) item.grade = String(grade);
    if (teacherId && !item.teacherIds.includes(teacherId)) item.teacherIds.push(teacherId);
    item.updatedAt = now();
    persist('classes');
    return item;
  }
  function syncUserClass(user) {
    if (!user || !meaningfulClass(user.cls)) return;
    const item = ensureClass(user.cls, user.grade, user.schoolId, user.role === 'teacher' ? user.id : '');
    if (!item) return;
    user.classId = item.id;
    user.classIds = [item.id];
    if (user.role === 'student' && !item.studentIds.includes(user.id)) item.studentIds.push(user.id);
    persist('classes');
  }
  function classes(filter) {
    const list = Array.isArray(data.classes) ? data.classes : [];
    return list.filter(item => !filter || Object.keys(filter).every(key => String(item[key] || '') === String(filter[key] || ''))).slice().sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
  }
  function addClass(obj, actor) {
    const input = obj || {};
    const label = String(input.name || input.cls || '').trim();
    if (!label) return { ok: false, msg: '班级名称不能为空' };
    if (actor && !['admin', 'academic', 'teacher'].includes(actor.role)) return { ok: false, msg: '当前账号无权创建班级' };
    if (actor && actor.role === 'teacher' && input.schoolId && String(input.schoolId) !== String(actor.schoolId || 'school_default')) return { ok: false, msg: '不能创建其他学校的班级' };
    const item = ensureClass(label, input.grade || '', input.schoolId || (actor && actor.schoolId) || 'school_default', actor && actor.role === 'teacher' ? actor.id : '');
    if (actor && actor.role === 'teacher' && (!meaningfulClass(actor.cls) || !actor.classId)) {
      actor.cls = label;
      actor.classId = item.id;
      actor.classIds = [item.id];
      persist('users');
    }
    return { ok: true, class: item };
  }
  function updateClass(id, patch, actor) {
    const item = (data.classes || []).find(x => String(x.id) === String(id));
    if (!item) return { ok: false, msg: '班级不存在' };
    if (actor && actor.role !== 'admin' && String(item.schoolId) !== String(actor.schoolId || 'school_default')) return { ok: false, msg: '无权修改其他学校的班级' };
    Object.keys(patch || {}).forEach(key => { if (['id', 'schoolId', 'studentIds', 'teacherIds'].includes(key)) return; item[key] = String(patch[key] || '').trim(); });
    item.updatedAt = now();
    persist('classes');
    return { ok: true, class: item };
  }
  function removeClass(id, actor) {
    const index = (data.classes || []).findIndex(x => String(x.id) === String(id));
    if (index < 0) return { ok: false, msg: '班级不存在' };
    const item = data.classes[index];
    if (actor && actor.role !== 'admin' && String(item.schoolId) !== String(actor.schoolId || 'school_default')) return { ok: false, msg: '无权删除其他学校的班级' };
    if ((item.studentIds || []).length || (item.teacherIds || []).length) return { ok: false, msg: '班级仍有成员，请先调整成员归属' };
    data.classes.splice(index, 1);
    persist('classes');
    return { ok: true };
  }

  function addUser(obj, actor) {
    obj = obj || {};
    const role = normalizeRole(obj.role);
    if (!canManageRole(actor, role)) return { ok: false, msg: '当前账号只能导入更低级别的账号：' + (actor && actor.role === 'teacher' ? '学生' : '教师 / 学生') };
    const phone = String(obj.phone || '').trim();
    if (!/^1\d{10}$/.test(phone)) return { ok: false, msg: '手机号格式不正确' };
    if (findUser(phone)) return { ok: false, msg: '手机号 ' + phone + ' 已存在' };
    const schoolId = String(obj.schoolId || (actor && actor.schoolId) || 'school_default');
    if (actor && actor.role !== 'admin' && schoolId !== String(actor.schoolId || 'school_default')) return { ok: false, msg: '不能导入其他学校的账号' };
    const cls = String(obj.cls || (actor && actor.role === 'teacher' ? actor.cls : '')).trim() || (role === 'student' ? '未分班' : role === 'academic' ? '教务处' : '教师组');
    if (actor && actor.role === 'teacher' && role === 'student') {
      if (!meaningfulClass(actor.cls) && !(actor.classIds || []).length) return { ok: false, msg: '请先绑定本人任教班级，再导入学生' };
      const targetClassId = meaningfulClass(cls) ? classKey(cls, schoolId) : '';
      if (!teacherOwnsClass(actor, { role: 'student', cls: cls, classId: targetClassId })) return { ok: false, msg: '老师只能导入本人任教班级的学生' };
    }
    const u = {
      id: obj.id || uid('u'),
      name: String(obj.name || '').trim() || '未命名',
      phone: phone,
      passwordHash: hashPassword(obj.password || phone.slice(-6), phone),
      role: role,
      cls: cls,
      grade: String(obj.grade || '').trim(),
      schoolId: schoolId,
      departmentId: String(obj.departmentId || (actor && actor.role === 'academic' ? actor.departmentId || '教务处' : role === 'academic' ? '教务处' : '')).trim(),
      classIds: [],
      status: obj.status === '正常' ? '正常' : '待激活',
      createdAt: now(), activatedAt: obj.activatedAt || null, lastLoginAt: null,
      plan: null, exercises: [], schedule: null, wrongs: [], submissions: []
    };
    data.users.push(u);
    syncUserClass(u);
    persist('users');
    return { ok: true, user: u };
  }

  function updateUser(id, patch, actor) {
    const u = (data.users || []).find(x => x.id === id);
    if (!u) return { ok: false, msg: '账号不存在' };
    if (!canManageUser(actor, u) && (!actor || actor.id !== u.id)) return { ok: false, msg: '当前账号无权修改该成员' };
    Object.keys(patch || {}).forEach(k => { if (k !== 'id' && k !== 'passwordHash') u[k] = patch[k]; });
    if (patch && (patch.cls || patch.grade || patch.schoolId)) syncUserClass(u);
    persist('users');
    return { ok: true, user: u };
  }

  function removeUser(id, actor) {
    const i = (data.users || []).findIndex(x => x.id === id);
    if (i < 0) return { ok: false, msg: '账号不存在' };
    const u = data.users[i];
    if (!canManageUser(actor, u)) return { ok: false, msg: '当前账号无权删除该成员' };
    if (u.role === 'admin' && data.users.filter(x => x.role === 'admin').length <= 1) return { ok: false, msg: '至少保留一名管理员' };
    data.users.splice(i, 1);
    persist('users');
    return { ok: true };
  }

  function resetPassword(id, actor) {
    const u = (data.users || []).find(x => x.id === id);
    if (!u) return { ok: false, msg: '账号不存在' };
    if (!canManageUser(actor, u)) return { ok: false, msg: '当前账号无权重置该成员' };
    u.passwordHash = hashPassword(u.phone.slice(-6), u.phone);
    u.status = '待激活';
    u.activatedAt = null;
    persist('users');
    pushNotice('账号 ' + (u.name || u.phone) + ' 密码已重置，需重新首次登录激活。', '账号');
    return { ok: true, user: u };
  }

  /* ---------- 成员表格：CSV 导入 / 导出 ---------- */
  function csvEscape(v) {
    v = String(v == null ? '' : v);
    return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  }
  function parseCSV(text, delim) {
    const rows = [];
    let row = [], field = '', inQ = false;
    text = String(text || '').replace(/^\uFEFF/, '');
    delim = delim || ',';
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (inQ) {
        if (ch === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; }
          else inQ = false;
        } else field += ch;
      } else if (ch === '"') inQ = true;
      else if (ch === delim) { row.push(field); field = ''; }
      else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && text[i + 1] === '\n') i++;
        row.push(field); field = '';
        if (row.some(x => x.trim() !== '')) rows.push(row);
        row = [];
      } else field += ch;
    }
    row.push(field);
    if (row.some(x => x.trim() !== '')) rows.push(row);
    return rows;
  }

  function importRosterCSV(text, actor) {
    text = String(text || '').trim();
    if (!text) return { ok: false, msg: '表格内容为空，请先下载模板填写后再导入', imported: 0, skipped: [] };
    const firstLine = text.split(/\r?\n/)[0] || '';
    const delim = firstLine.indexOf('\t') >= 0 ? '\t' : firstLine.indexOf(';') >= 0 ? ';' : ',';
    const rows = parseCSV(text, delim);
    if (rows.length < 2) return { ok: false, msg: '表格内容为空，请先下载模板填写后再导入', imported: 0, skipped: [] };
    const head = rows[0].map(h => String(h).trim());
    const aliases = {
      name: ['姓名', '名字', '学生姓名', '教师姓名', 'name'],
      phone: ['手机号', '手机', '电话', '手机号码', 'phone', 'tel'],
      role: ['角色', '身份', '类型', 'role', 'type'],
      cls: ['班级/部门', '班级', '部门', '任教班级', 'class'],
      grade: ['年级', '学段', 'grade'],
      schoolId: ['学校', '学校ID', 'school', 'schoolId'],
      departmentId: ['教务处', '部门ID', 'department', 'departmentId']
    };
    const col = key => {
      const names = aliases[key] || [];
      return head.findIndex(h => names.some(n => h === n || h.indexOf(n) >= 0));
    };
    const iName = col('name'), iPhone = col('phone'), iRole = col('role'), iCls = col('cls'), iGrade = col('grade'), iSchool = col('schoolId'), iDepartment = col('departmentId');
    if (iPhone < 0 || iName < 0 || iRole < 0) {
      return { ok: false, msg: '表格缺少必要列：需包含「姓名、手机号、角色」（可加 班级/部门、年级）。当前表头：' + head.join(' / '), imported: 0, skipped: [] };
    }
    const skipped = [];
    let imported = 0;
    for (let r = 1; r < rows.length; r++) {
      const name = String(rows[r][iName] || '').trim();
      const phone = String(rows[r][iPhone] || '').trim();
      let role = String(rows[r][iRole] || '').trim();
      role = normalizeRole(role);
      if (!/^1\d{10}$/.test(phone)) { skipped.push((name || '未命名') + '(' + phone + ')：手机号不合法'); continue; }
      if (findUser(phone)) { skipped.push(name + '(' + phone + ')：账号已存在'); continue; }
      if (actor && !canManageRole(actor, role)) { skipped.push(name + '(' + phone + ')：当前账号无权导入' + role); continue; }
      const cls = iCls >= 0 ? String(rows[r][iCls] || '').trim() : '';
      const res = addUser({
        name: name,
        phone: phone,
        role: role,
        cls: cls,
        grade: iGrade >= 0 ? String(rows[r][iGrade] || '').trim() : '',
        schoolId: iSchool >= 0 ? String(rows[r][iSchool] || '').trim() : '',
        departmentId: iDepartment >= 0 ? String(rows[r][iDepartment] || '').trim() : '',
        status: '待激活'
      }, actor);
      if (res.ok) imported++;
      else skipped.push(name + '(' + phone + ')：' + res.msg);
    }
    if (imported) {
      pushNotice('已导入 ' + imported + ' 名成员（教务处 / 教师 / 学生），首次登录即正式激活；初始密码仅用于首次激活。', '成员');
    }
    return { ok: imported > 0, msg: imported + ' 名成员已导入，等待首次登录激活', imported, skipped };
  }

  function rosterTemplate() {
    return '\uFEFF姓名,手机号,角色,年级,班级/部门,学校ID,教务处ID\n' +
      '张小明,13900000001,学生,七年级,七（1）班,school_default,\n' +
      '李小红,13900000002,学生,七年级,七（1）班,school_default,\n' +
      '王老师,13900000003,教师,七年级,七（1）班,school_default,';
  }

  function rosterExport(onlyRole) {
    const rows = data.users.filter(u => !onlyRole || u.role === onlyRole);
    const head = '姓名,手机号（脱敏）,角色,年级,班级/部门,学校ID,教务处ID,状态,首次激活时间';
    const lines = rows.map(u => [
      u.name, u.phone ? (u.phone.slice(0, 3) + '****' + u.phone.slice(-4)) : '已加密',
      u.role === 'student' ? '学生' : u.role === 'academic' ? '教务处' : u.role === 'admin' ? '管理员' : '教师',
      u.grade, u.cls, u.schoolId || '', u.departmentId || '', u.status, u.activatedAt ? u.activatedAt.slice(0, 10) : ''
    ].map(csvEscape).join(','));
    return '\uFEFF' + head + '\n' + lines.join('\n');
  }

  /* ---------- 资料（贡献 + AI 美化排版） ---------- */
  function resources() {
    return data.resources.slice().sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }

  function addResource(obj) {
    const r = {
      id: obj.id || uid('r'),
      title: String(obj.title || '').trim() || '未命名资料',
      type: obj.type || '讲义',
      subject: obj.subject || '数学',
      grade: obj.grade || '通用',
      kp: String(obj.kp || '').trim(),
      tags: obj.tags || [],
      raw: String(obj.raw || ''),
      content: String(obj.content || ''),
      desc: String(obj.desc || ''),
      copyright: obj.copyright || '自编',
      cover: obj.cover || ['#2E74B5', '#55A3DC'],
      contributor: String(obj.contributor || ''),
      contributorPhone: String(obj.contributorPhone || ''),
      createdAt: now(),
      fav: false,
      version: 2,
      status: obj.status || '已发布'
    };
    data.resources.push(r);
    persist('resources');
    pushNotice('新资料入库：《' + r.title + '》由 ' + (r.contributor || '教师') + ' 贡献。', '资源');
    return { ok: true, resource: r };
  }

  function updateResource(id, patch) {
    const r = (data.resources || []).find(x => x.id === id);
    if (!r) return { ok: false, msg: '资料不存在' };
    Object.keys(patch || {}).forEach(k => { if (k !== 'id') r[k] = patch[k]; });
    persist('resources');
    return { ok: true, resource: r };
  }

  function removeResource(id) {
    const i = (data.resources || []).findIndex(x => x.id === id);
    if (i < 0) return { ok: false };
    data.resources.splice(i, 1);
    persist('resources');
    return { ok: true };
  }

  /* AI 美化排版：必须实时生成，未接入 AI 时直接报错（已删除本地排版兜底） */
  async function beautifyResource(raw, meta) {
    const w = window.AI;
    if (!w || !w.isConfigured || !w.isConfigured() || !w.beautifyResource) {
      throw new Error('请先在顶栏「AI 设置」接入模型：资料排版必须实时生成');
    }
    const out = await w.beautifyResource(raw, meta);
    if (!out || !out.content || !out.content.trim()) throw new Error('AI 未返回排版内容，请重试');
    return out;
  }

  /* ---------- 通知 ---------- */
  function notices() {
    return data.notices.slice().sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }
  function pushNotice(text, scope) {
    const stamp = now();
    data.notices.push({
      id: uid('n'), title: (scope || '系统') + '通知', text: String(text),
      scope: '全校', category: scope || '系统', priority: '普通', status: '已发布',
      publisher: '系统', createdAt: stamp, updatedAt: stamp, publishedAt: stamp,
      readBy: [], read: false
    });
    persist('notices');
  }
  function addNotice(record) {
    const input = record || {};
    const title = String(input.title || '').trim();
    const text = String(input.text || '').trim();
    if (!title || !text) return { ok: false, msg: '公告标题和正文不能为空' };
    const stamp = now();
    const status = ['草稿', '已发布', '已撤回'].includes(input.status) ? input.status : '草稿';
    const notice = {
      id: uid('n'), title: title.slice(0, 60), text: text.slice(0, 2000),
      scope: ['全校', '教师', '学生', '管理员'].includes(input.scope) ? input.scope : '全校',
      category: '公告', priority: ['普通', '重要', '紧急'].includes(input.priority) ? input.priority : '普通',
      status: status, publisher: String(input.publisher || '管理员'),
      expiresAt: String(input.expiresAt || ''), createdAt: stamp, updatedAt: stamp,
      publishedAt: status === '已发布' ? stamp : '', readBy: [], read: false
    };
    data.notices.push(notice);
    persist('notices');
    return { ok: true, notice: notice };
  }
  function updateNotice(id, patch) {
    const notice = (data.notices || []).find(x => x.id === id);
    if (!notice) return { ok: false, msg: '公告不存在' };
    const input = patch || {};
    const oldStatus = notice.status || '已发布';
    if (input.title !== undefined) notice.title = String(input.title || '').trim().slice(0, 60);
    if (input.text !== undefined) notice.text = String(input.text || '').trim().slice(0, 2000);
    if (input.scope !== undefined && ['全校', '教师', '学生', '管理员'].includes(input.scope)) notice.scope = input.scope;
    if (input.priority !== undefined && ['普通', '重要', '紧急'].includes(input.priority)) notice.priority = input.priority;
    if (input.status !== undefined && ['草稿', '已发布', '已撤回'].includes(input.status)) notice.status = input.status;
    if (input.expiresAt !== undefined) notice.expiresAt = String(input.expiresAt || '');
    if (input.publisher !== undefined) notice.publisher = String(input.publisher || '管理员');
    if (!notice.title || !notice.text) return { ok: false, msg: '公告标题和正文不能为空' };
    notice.updatedAt = now();
    if (notice.status === '已发布' && oldStatus !== '已发布') notice.publishedAt = notice.updatedAt;
    persist('notices');
    return { ok: true, notice: notice };
  }
  function removeNotice(id) {
    const index = (data.notices || []).findIndex(x => x.id === id);
    if (index < 0) return { ok: false, msg: '公告不存在' };
    data.notices.splice(index, 1);
    persist('notices');
    return { ok: true };
  }
  function markNoticeRead(id, userId) {
    const n = (data.notices || []).find(x => x.id === id);
    if (!n) return;
    if (userId) {
      n.readBy = Array.isArray(n.readBy) ? n.readBy : [];
      if (!n.readBy.includes(userId)) n.readBy.push(userId);
    } else n.read = true;
    persist('notices');
  }

  /* ---------- 批改队列 ---------- */
  function grading() {
    return data.grading;
  }
  function addGradingItem(item) {
    const g = data.grading;
    (g[item.status] = g[item.status] || []).push(Object.assign({ id: uid('g') }, item));
    persist('grading');
  }

  /* ---------- 学习计划 + 配套习题 + 投入计划 ---------- */
  function savePlan(record) {
    const r = Object.assign({ id: uid('p'), createdAt: now() }, record);
    data.plans.push(r);
    const u = (data.users || []).find(x => x.id === record.studentId);
    if (u) {
      u.plan = record.plan;
      u.exercises = record.exercises || [];
      u.schedule = record.schedule || null;
      persist('users');
    }
    persist('plans');
    pushNotice('已为 ' + (u ? u.name : '学生') + ' 生成学习计划，并同步配套习题与每日投入安排。', '计划');
    return { ok: true, plan: r };
  }

  /* ---------- 审计日志 ---------- */
  function auditLog(op, detail, by) {
    data.audit.push({ id: uid('a'), time: now(), op, detail, by: by || '' });
    persist('audit');
  }

  function collection(name) {
    return data[name];
  }

  function upsertRecord(name, record, key) {
    if (!COLLECTIONS.includes(name) || name === 'grading' || !record || typeof record !== 'object') {
      return { ok: false, msg: '不支持的集合或记录格式' };
    }
    if (!Array.isArray(data[name])) data[name] = [];
    const identity = key || 'id';
    const value = record[identity];
    const index = value == null ? -1 : data[name].findIndex(item => String(item[identity]) === String(value));
    if (index >= 0) data[name][index] = Object.assign({}, data[name][index], record);
    else data[name].push(Object.assign({}, record));
    persist(name);
    return { ok: true, record: index >= 0 ? data[name][index] : data[name][data[name].length - 1] };
  }

  function removeRecord(name, id, key) {
    if (!COLLECTIONS.includes(name) || name === 'grading') return { ok: false, msg: '不支持的集合' };
    const identity = key || 'id';
    const index = (data[name] || []).findIndex(item => String(item[identity]) === String(id));
    if (index < 0) return { ok: false, msg: '记录不存在' };
    const removed = data[name].splice(index, 1)[0];
    persist(name);
    return { ok: true, record: removed };
  }

  /* ---------- 导出/导入整包（上云迁移用） ---------- */
  function exportBundle() {
    const snapshot = Object.assign({}, data, { users: secureUsersSnapshot(data.users) });
    return JSON.stringify({ version: 4, exportedAt: now(), data: snapshot }, null, 2);
  }
  function importBundle(json) {
    try {
      const j = JSON.parse(json);
      if (!j || ![2, 3, 4].includes(j.version) || !j.data) return { ok: false, msg: '不是有效的本地数据包' };
      COLLECTIONS.forEach(name => { if (j.data[name] !== undefined) data[name] = name === 'users' && Array.isArray(j.data[name]) ? j.data[name].map(hydrateUser) : j.data[name]; });
      COLLECTIONS.forEach(name => persist(name));
      return { ok: true };
    } catch (e) {
      return { ok: false, msg: '数据包解析失败：' + e.message };
    }
  }

  /* ---------- 对外接口 ---------- */
  window.FH_DB = {
    NS: NS,
    init: init,
    setCloudToken: function (t) {
      try { localStorage.setItem(NS + '_token', t || ''); } catch (e) {}
    },
    cloudInfo: () => ({ cloud, cloudErr, pending: syncQueueCount(), network: window.FHNetwork && window.FHNetwork.summary ? window.FHNetwork.summary() : null }),
    reconnect: reconnect,
    flushSync: flushSync,
    hashPassword: hashPassword,
    uid: uid,
    today: today,
    now: now,
    collection: collection,
    collections: () => COLLECTIONS.slice(),
    upsertRecord: upsertRecord,
    removeRecord: removeRecord,
    saveCollection: persist,
    subscribe: fn => { listeners.push(fn); return () => { listeners = listeners.filter(x => x !== fn); }; },
    /* 账号 */
    login: login,
    activate: activate,
    changePassword: changePassword,
    addUser: addUser,
    updateUser: updateUser,
    removeUser: removeUser,
    resetPassword: resetPassword,
    findUser: findUser,
    users: users,
    roles: () => Object.keys(ROLE_LEVEL),
    canManageRole: canManageRole,
    canManageUser: canManageUser,
    classes: classes,
    addClass: addClass,
    updateClass: updateClass,
    removeClass: removeClass,
    /* 成员表格 */
    importRosterCSV: importRosterCSV,
    rosterExport: rosterExport,
    rosterTemplate: rosterTemplate,
    parseCSV: parseCSV,
    /* 资料 */
    resources: resources,
    addResource: addResource,
    updateResource: updateResource,
    removeResource: removeResource,
    beautifyResource: beautifyResource,
    /* 通知 / 批改 / 计划 */
    notices: notices,
    pushNotice: pushNotice,
    addNotice: addNotice,
    updateNotice: updateNotice,
    removeNotice: removeNotice,
    markNoticeRead: markNoticeRead,
    grading: grading,
    addGradingItem: addGradingItem,
    savePlan: savePlan,
    auditLog: auditLog,
    /* 备份迁移 */
    exportBundle: exportBundle,
    importBundle: importBundle
  };
})();
