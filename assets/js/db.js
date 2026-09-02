/* ================= 凤凰花·智学 正式版 · 本地优先数据层 =================
 * 版本：v2（与旧演示数据完全隔离，命名空间 fh_v2_*）
 * 能力：
 *  1) 本地存储（localStorage）兜底，file:// 直开可用；
 *  2) 云端同步：检测到 server/ 云服务后，所有集合读写走 REST API，
 *     数据以 JSON 落盘到服务端 data/（配置文件夹）；每次打开页面自动拉取；
 *  3) 账号体系：手机号 + 密码；导入账号首次登录视为正式激活；
 *  4) 成员 CSV 导入 / 导出（Excel 兼容）；
 *  5) 资料贡献 + AI 美化排版（AI 未配置时用本地排版器兜底）；
 *  6) 学习计划与配套习题、投入计划按学生账户保存。
 * 说明：前端为原型实现，密码采用本地同步哈希；生产环境必须改为服务端
 *       加盐哈希（如 bcrypt/argon2）并通过 HTTPS 传输。
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
    'users', 'resources', 'notices', 'papers', 'grading', 'plans', 'audit',
    'profiles', 'knowledge', 'content_tags', 'goals', 'plan_tasks',
    'learning_events', 'recommendation_feedback', 'review_schedule', 'data_dictionary'
  ];
  const empty = {
    users: [],
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
        if (j && Array.isArray(j)) data[name] = j;
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
    LS.write(name, data[name]);
    if (cloud) scheduleSync(name, data[name]);
    else if (networkEnabled() && explicitNetwork()) queueSnapshot(name, data[name], cloudErr || '数据服务未连接');
    listeners.forEach(fn => { try { fn(name); } catch (e) {} });
  }

  /* ---------- 初始化与种子数据 ---------- */
  function seed() {
    const bootstrap = data.users.find(u => u.phone === '13800000001' && u.name === '系统管理员');
    if (bootstrap && bootstrap.role === 'superadmin') { bootstrap.role = 'admin'; persist('users'); }
    if (!data.users.length) {
      const admin = {
        id: uid('u'), name: '系统管理员', phone: '13800000001',
        passwordHash: hashPassword('admin123'),
        role: 'admin', cls: '学校管理', grade: '',
        status: '正常', createdAt: now(), activatedAt: now(), lastLoginAt: null,
        plan: null, exercises: [], schedule: null, wrongs: [], submissions: []
      };
      data.users.push(admin);
      persist('users');
    }
  }

  async function init() {
    resetData();
    // 先读本地缓存
    for (const name of COLLECTIONS) {
      const local = LS.read(name);
      if (local) data[name] = local;
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

  function addUser(obj) {
    const phone = String(obj.phone || '').trim();
    if (!/^1\d{10}$/.test(phone)) return { ok: false, msg: '手机号格式不正确' };
    if (findUser(phone)) return { ok: false, msg: '手机号 ' + phone + ' 已存在' };
    const u = {
      id: obj.id || uid('u'),
      name: String(obj.name || '').trim() || '未命名',
      phone: phone,
      passwordHash: hashPassword(obj.password || phone.slice(-6), phone),
      role: obj.role === 'student' ? 'student' : obj.role === 'admin' ? 'admin' : 'teacher',
      cls: String(obj.cls || '').trim() || '未分班',
      grade: String(obj.grade || '').trim(),
      status: obj.status === '正常' ? '正常' : '待激活',
      createdAt: now(), activatedAt: obj.activatedAt || null, lastLoginAt: null,
      plan: null, exercises: [], schedule: null, wrongs: [], submissions: []
    };
    data.users.push(u);
    persist('users');
    return { ok: true, user: u };
  }

  function updateUser(id, patch) {
    const u = (data.users || []).find(x => x.id === id);
    if (!u) return { ok: false, msg: '账号不存在' };
    Object.keys(patch || {}).forEach(k => { if (k !== 'id' && k !== 'passwordHash') u[k] = patch[k]; });
    persist('users');
    return { ok: true, user: u };
  }

  function removeUser(id) {
    const i = (data.users || []).findIndex(x => x.id === id);
    if (i < 0) return { ok: false, msg: '账号不存在' };
    const u = data.users[i];
    if (u.role === 'admin' && data.users.filter(x => x.role === 'admin').length <= 1) return { ok: false, msg: '至少保留一名管理员' };
    data.users.splice(i, 1);
    persist('users');
    return { ok: true };
  }

  function resetPassword(id) {
    const u = (data.users || []).find(x => x.id === id);
    if (!u) return { ok: false, msg: '账号不存在' };
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

  function importRosterCSV(text) {
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
      grade: ['年级', '学段', 'grade']
    };
    const col = key => {
      const names = aliases[key] || [];
      return head.findIndex(h => names.some(n => h === n || h.indexOf(n) >= 0));
    };
    const iName = col('name'), iPhone = col('phone'), iRole = col('role'), iCls = col('cls'), iGrade = col('grade');
    if (iPhone < 0 || iName < 0 || iRole < 0) {
      return { ok: false, msg: '表格缺少必要列：需包含「姓名、手机号、角色」（可加 班级/部门、年级）。当前表头：' + head.join(' / '), imported: 0, skipped: [] };
    }
    const skipped = [];
    let imported = 0;
    for (let r = 1; r < rows.length; r++) {
      const name = String(rows[r][iName] || '').trim();
      const phone = String(rows[r][iPhone] || '').trim();
      let role = String(rows[r][iRole] || '').trim();
      if (role === '学生' || role === 'student') role = 'student';
      else if (role === '教师' || role === 'teacher') role = 'teacher';
      else role = 'teacher';
      if (!/^1\d{10}$/.test(phone)) { skipped.push((name || '未命名') + '(' + phone + ')：手机号不合法'); continue; }
      if (findUser(phone)) { skipped.push(name + '(' + phone + ')：账号已存在'); continue; }
      const res = addUser({
        name: name,
        phone: phone,
        role: role,
        cls: iCls >= 0 ? String(rows[r][iCls] || '').trim() : (role === 'student' ? '未分班' : '教师组'),
        grade: iGrade >= 0 ? String(rows[r][iGrade] || '').trim() : '',
        status: '待激活'
      });
      if (res.ok) imported++;
      else skipped.push(name + '(' + phone + ')：' + res.msg);
    }
    if (imported) {
      pushNotice('已导入 ' + imported + ' 名成员（学生/教师），首次登录即正式激活；初始密码为手机号后 6 位。', '成员');
    }
    return { ok: imported > 0, msg: imported + ' 名成员已导入，等待首次登录激活', imported, skipped };
  }

  function rosterTemplate() {
    return '\uFEFF姓名,手机号,角色,年级,班级/部门\n' +
      '张小明,13900000001,学生,七年级,七（1）班\n' +
      '李小红,13900000002,学生,七年级,七（1）班\n' +
      '王老师,13900000003,教师,七年级,七（1）班';
  }

  function rosterExport(onlyRole) {
    const rows = data.users.filter(u => !onlyRole || u.role === onlyRole);
    const head = '姓名,手机号,角色,年级,班级/部门,状态,首次激活时间';
    const lines = rows.map(u => [
      u.name, u.phone,
      u.role === 'student' ? '学生' : u.role === 'admin' ? '管理员' : '教师',
      u.grade, u.cls, u.status, u.activatedAt ? u.activatedAt.slice(0, 10) : ''
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
      return JSON.stringify({ version: 3, exportedAt: now(), data: data }, null, 2);
  }
  function importBundle(json) {
    try {
      const j = JSON.parse(json);
      if (!j || ![2, 3].includes(j.version) || !j.data) return { ok: false, msg: '不是有效的本地数据包' };
      COLLECTIONS.forEach(name => { if (j.data[name] !== undefined) data[name] = j.data[name]; });
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
