/* 凤凰花·智学网络数据层 v3
 * 业务数据只从网络 API 读取和写入。浏览器不再保存题目、资源、账号或待同步快照。
 */
(function () {
  'use strict';

  const NS = 'fh_v3';
  const COLLECTIONS = [
    'users', 'schools', 'campuses', 'academic_years', 'terms', 'classes', 'class_snapshots',
    'class_memberships', 'student_enrollments', 'teacher_employments', 'teacher_subject_assignments',
    'class_subject_offerings', 'promotion_batches', 'transfer_records', 'course_completions',
    'graduation_archives', 'resources', 'notices', 'papers', 'grading', 'plans', 'profiles',
    'knowledge', 'content_tags', 'goals', 'plan_tasks', 'learning_events',
    'recommendation_feedback', 'review_schedule', 'data_dictionary', 'question_manifests',
    'explanations', 'source_records', 'audit'
  ];
  const empty = { users: [], resources: [], notices: [], papers: [], grading: { recognized: [], grading: [], review: [], done: [] }, plans: [], audit: [] };
  let data = JSON.parse(JSON.stringify(empty));
  let cloud = false;
  let cloudErr = '正在检测学校数据服务';
  let health = null;
  let sessionToken = '';
  let syncQueue = {};
  let listeners = [];
  const syncChains = {};
  let seq = 1;

  function now() { return new Date().toISOString(); }
  function uid(prefix) { return (prefix || 'id') + '_' + Date.now().toString(36) + '_' + (seq++).toString(36) + '_' + Math.random().toString(36).slice(2, 7); }
  function networkUrl(path) { return window.FHNetwork && window.FHNetwork.url ? window.FHNetwork.url(path) : path; }
  function token() { return sessionToken || (window.FHNetwork && window.FHNetwork.getToken ? window.FHNetwork.getToken() : ''); }
  function headers() { const h = { 'Content-Type': 'application/json' }; if (token()) h.Authorization = 'Bearer ' + token(); return h; }
  function reset() { data = JSON.parse(JSON.stringify(empty)); }
  function emit(name) { listeners.forEach(fn => { try { fn(name); } catch (e) {} }); }

  async function request(method, path, body) {
    const opts = { method, headers: headers() };
    if (body !== undefined) opts.body = JSON.stringify(body);
    const response = await fetch(networkUrl(path), opts);
    const text = await response.text();
    let payload = null;
    try { payload = text ? JSON.parse(text) : null; } catch (e) {}
    if (!response.ok) {
      const error = new Error(payload && payload.msg ? payload.msg : '网络服务返回 HTTP ' + response.status);
      error.status = response.status;
      error.payload = payload;
      throw error;
    }
    return payload;
  }

  async function detectCloud() {
    try {
      const response = await fetch(networkUrl('/api/health'), { headers: window.FHNetwork && window.FHNetwork.headers ? window.FHNetwork.headers() : {} });
      const payload = await response.json().catch(() => ({}));
      health = payload;
      cloud = !!(response.ok && payload.storage === 'd1' && payload.database && payload.database.configured && payload.database.schemaReady);
      cloudErr = cloud ? '' : (payload.msg || (payload.database && payload.database.configured ? '学校数据服务已绑定但尚未完成数据库初始化' : '学校数据服务未就绪，业务数据不会保存'));
      if (window.FHNetwork && window.FHNetwork.report) window.FHNetwork.report(cloud, cloud ? '学校数据服务已连接' : cloudErr, response.status);
    } catch (error) {
      cloud = false;
      health = null;
      cloudErr = '无法连接学校数据服务，业务数据不会保存';
      if (window.FHNetwork && window.FHNetwork.report) window.FHNetwork.report(false, cloudErr, error.status || 0);
    }
    return cloud;
  }

  async function loadCollections() {
    if (!cloud || !token()) return;
    for (const name of COLLECTIONS) {
      try {
        const result = await request('GET', '/api/col/' + name);
        if (Array.isArray(result)) data[name] = result;
      } catch (error) {
        if (error.status === 401) { cloud = false; cloudErr = '登录会话已过期，请重新登录'; break; }
      }
    }
  }

  function queueSnapshot(name, value, error) {
    syncQueue[name] = { value: JSON.parse(JSON.stringify(value)), queuedAt: now(), lastError: String(error || '') };
    cloudErr = '服务暂不可用；本次数据只保留在当前会话，未保存到学校数据服务';
  }
  function clearQueue(name) { delete syncQueue[name]; }
  function syncCount() { return Object.keys(syncQueue).length; }

  function persist(name, value) {
    if (!COLLECTIONS.includes(name)) return false;
    if (value !== undefined) data[name] = value;
    if (!cloud || !token()) { queueSnapshot(name, data[name], cloudErr); emit(name); return false; }
    const payload = JSON.parse(JSON.stringify(data[name]));
    syncChains[name] = (syncChains[name] || Promise.resolve()).then(async () => {
      try { await request('PUT', '/api/col/' + name, payload); clearQueue(name); cloudErr = ''; return true; }
      catch (error) { queueSnapshot(name, payload, error.message); return false; }
    });
    emit(name);
    return true;
  }

  async function flushSync() {
    if (!cloud || !token()) return { ok: false, synced: 0, pending: syncCount() };
    let synced = 0;
    for (const name of Object.keys(syncQueue)) {
      try { await request('PUT', '/api/col/' + name, syncQueue[name].value); clearQueue(name); synced++; }
      catch (error) { syncQueue[name].lastError = error.message; }
    }
    return { ok: syncCount() === 0, synced, pending: syncCount() };
  }

  async function init() {
    reset();
    sessionToken = sessionStorage.getItem(NS + '_session') || '';
    await detectCloud();
    if (sessionToken && cloud) {
      try {
        const me = await request('GET', '/api/auth/me');
        if (me && me.user) data.users = [me.user];
        await loadCollections();
      } catch (error) {
        sessionStorage.removeItem(NS + '_session');
        sessionToken = '';
      }
    }
    return { cloud, cloudErr, health };
  }

  async function reconnect() { await detectCloud(); if (cloud && token()) await loadCollections(); return flushSync(); }

  async function login(phone, password) {
    if (!cloud) return { ok: false, msg: cloudErr || '学校数据服务未就绪' };
    try {
      const result = await request('POST', '/api/auth/login', { phone, password });
      sessionToken = result.token || '';
      if (sessionToken) sessionStorage.setItem(NS + '_session', sessionToken);
      data.users = result.user ? [result.user] : [];
      await loadCollections();
      return { ok: true, user: result.user, needActivate: result.user && result.user.status === '待激活' };
    } catch (error) { return { ok: false, msg: error.message }; }
  }
  async function activate(phone, newPassword) {
    try { const result = await request('POST', '/api/auth/activate', { newPassword }); if (result.user) data.users = [result.user]; return result; }
    catch (error) { return { ok: false, msg: error.message }; }
  }
  async function changePassword(phone, oldPassword, newPassword) {
    try { const result = await request('POST', '/api/auth/change-password', { phone, oldPassword, newPassword }); return result; }
    catch (error) { return { ok: false, msg: error.message }; }
  }
  async function logout() { try { if (token()) await request('POST', '/api/auth/logout'); } catch (e) {} sessionToken = ''; sessionStorage.removeItem(NS + '_session'); }

  function currentUser() { return data.users[0] || null; }
  function setLocalUser(user) { data.users = user ? [Object.assign({}, user)] : []; }
  function findUser(id) { return data.users.find(user => String(user.id) === String(id) || String(user.phone) === String(id)); }
  function users() { return data.users.slice(); }
  function collection(name) { return data[name] || []; }
  function cloudInfo() { return { cloud, cloudErr, pending: syncCount(), network: window.FHNetwork && window.FHNetwork.summary ? window.FHNetwork.summary() : null, health }; }
  function upsertRecord(name, record, key) {
    if (!COLLECTIONS.includes(name) || !record || typeof record !== 'object') return { ok: false, msg: '数据集合或记录格式不正确' };
    if (!Array.isArray(data[name])) data[name] = [];
    const identity = key || 'id';
    const index = data[name].findIndex(item => item && String(item[identity]) === String(record[identity]));
    if (index >= 0) data[name][index] = Object.assign({}, data[name][index], record);
    else data[name].push(Object.assign({ id: uid(name.slice(0, 2)) }, record));
    persist(name, data[name]);
    return { ok: true, record: data[name][index >= 0 ? index : data[name].length - 1] };
  }
  function removeRecord(name, id, key) {
    const identity = key || 'id';
    const index = (data[name] || []).findIndex(item => String(item[identity]) === String(id));
    if (index < 0) return { ok: false, msg: '记录不存在' };
    const record = data[name].splice(index, 1)[0];
    persist(name, data[name]);
    return { ok: true, record };
  }

  function addUser(obj) {
    const user = { id: obj.id || uid('u'), name: String(obj.name || '').trim(), phone: String(obj.phone || '').trim(), role: obj.role || 'teacher', cls: String(obj.cls || ''), grade: String(obj.grade || ''), status: 'pending', createdAt: now() };
    if (!user.name || !/^1\d{10}$/.test(user.phone)) return { ok: false, msg: '姓名或手机号格式不正确' };
    data.users.push(user);
    persist('users', data.users);
    return { ok: true, user };
  }
  function updateUser(id, patch) { const user = findUser(id); if (!user) return { ok: false, msg: '账号不存在' }; Object.assign(user, patch || {}); persist('users', data.users); return { ok: true, user }; }
  function removeUser(id) { return removeRecord('users', id); }
  function resetPassword() { return { ok: false, msg: '密码重置必须由服务端成员管理接口完成' }; }
  async function importRosterCSV(text) {
    if (!cloud || !token()) return { ok: false, msg: cloudErr || '请先登录学校数据服务' };
    const rows = parseCSV(text);
    if (rows.length < 2) return { ok: false, msg: '请提供至少一行账号数据' };
    const normalize = value => String(value || '').trim().toLowerCase().replace(/[\s_\-\/]/g, '');
    const header = rows.shift().map(normalize);
    const indexOf = names => names.reduce((found, name) => found >= 0 ? found : header.indexOf(normalize(name)), -1);
    const columns = { name: indexOf(['姓名', '名字']), phone: indexOf(['手机号', '手机', '电话']), role: indexOf(['角色', '身份']), grade: indexOf(['年级']), cls: indexOf(['班级/部门', '班级', '部门']) };
    if (columns.name < 0 || columns.phone < 0 || columns.role < 0) return { ok: false, msg: '表头必须包含姓名、手机号和角色' };
    const skipped = [], created = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const roleText = String(row[columns.role] || '').trim();
      const role = /教务/.test(roleText) ? 'academic' : /管理/.test(roleText) ? 'admin' : /教师|老师/.test(roleText) ? 'teacher' : /学生/.test(roleText) ? 'student' : '';
      const body = { name: row[columns.name], phone: row[columns.phone], role, grade: columns.grade >= 0 ? row[columns.grade] : '', cls: columns.cls >= 0 ? row[columns.cls] : '' };
      if (!body.name || !/^1\d{10}$/.test(String(body.phone || '').trim()) || !role || role === 'admin') { skipped.push('第 ' + (i + 2) + ' 行格式不正确'); continue; }
      try {
        const result = await request('POST', '/api/admin/users', body);
        if (result && result.user) { data.users.push(result.user); created.push(result.user); }
      } catch (error) { skipped.push('第 ' + (i + 2) + ' 行：' + error.message); }
    }
    return { ok: created.length > 0, msg: '已加密导入 ' + created.length + ' 个账号', created, skipped };
  }
  function rosterTemplate() { return '\uFEFF姓名,手机号,角色,年级,班级/部门\n'; }
  function maskPhone(phone) { const value = String(phone || ''); return value.length >= 7 ? value.slice(0, 3) + '****' + value.slice(-4) : '已隐藏'; }
  function rosterExport() { return '\uFEFF姓名,手机号,角色,年级,班级/部门,状态\n' + data.users.map(u => [u.name, maskPhone(u.phone), u.role, u.grade, u.cls, u.status].join(',')).join('\n'); }
  function parseCSV(text, delim) { return String(text || '').split(/\r?\n/).filter(Boolean).map(line => line.split(delim || ',')); }

  function resources() { return collection('resources').slice(); }
  function addResource(obj) { const result = upsertRecord('resources', Object.assign({}, obj, { createdAt: now() })); return result; }
  function updateResource(id, patch) { return upsertRecord('resources', Object.assign({ id }, patch)); }
  function removeResource(id) { return removeRecord('resources', id); }
  async function beautifyResource() { throw new Error('资料排版必须调用已配置的网络 AI 服务'); }
  function notices() { return collection('notices').slice(); }
  function pushNotice(text, scope) { return upsertRecord('notices', { id: uid('notice'), title: scope || '系统通知', text: String(text), scope: 'school', createdAt: now() }); }
  function addNotice(record) { return upsertRecord('notices', Object.assign({}, record, { createdAt: now() })); }
  function updateNotice(id, patch) { return upsertRecord('notices', Object.assign({ id }, patch)); }
  function removeNotice(id) { return removeRecord('notices', id); }
  function markNoticeRead(id, userId) { return upsertRecord('notices', { id, readBy: [userId || currentUser()?.id].filter(Boolean) }); }
  function grading() { return data.grading; }
  function addGradingItem(item) { const group = item.status || 'recognized'; data.grading[group] = data.grading[group] || []; data.grading[group].push(Object.assign({ id: uid('grading'), createdAt: now() }, item)); persist('grading', data.grading); }
  function updateGradingItem(id, patch) {
    const groups = Object.keys(data.grading || {});
    for (const group of groups) {
      const list = Array.isArray(data.grading[group]) ? data.grading[group] : [];
      const index = list.findIndex(item => String(item.id) === String(id));
      if (index < 0) continue;
      const previous = list[index];
      const next = Object.assign({}, previous, patch || {}, { updatedAt: now() });
      if (next.status && next.status !== group) {
        list.splice(index, 1);
        data.grading[next.status] = data.grading[next.status] || [];
        data.grading[next.status].push(next);
      } else list[index] = next;
      persist('grading', data.grading);
      return { ok: true, item: next };
    }
    return { ok: false, msg: '批改记录不存在' };
  }
  function savePlan(record) { return upsertRecord('plans', Object.assign({}, record, { createdAt: now() })); }
  function auditLog(op, detail, by) { return upsertRecord('audit', { id: uid('audit'), action: op, detail, by, createdAt: now() }); }
  function exportBundle() { return JSON.stringify({ version: 3, exportedAt: now(), data: data }, null, 2); }
  function importBundle() { return { ok: false, msg: '数据导入必须使用服务端鉴权和审计接口' }; }

  window.FH_DB = {
    NS, init, reconnect, flushSync, cloudInfo, currentUser, token: () => token(), collection, collections: () => COLLECTIONS.slice(), saveCollection: persist, upsertRecord, removeRecord, subscribe: fn => { listeners.push(fn); return () => { listeners = listeners.filter(x => x !== fn); }; },
    login, activate, changePassword, logout, setLocalUser, users, findUser, addUser, updateUser, removeUser, resetPassword,
    importRosterCSV, rosterTemplate, rosterExport, parseCSV,
    resources, addResource, updateResource, removeResource, beautifyResource,
    notices, pushNotice, addNotice, updateNotice, removeNotice, markNoticeRead,
    grading, addGradingItem, updateGradingItem, savePlan, auditLog, exportBundle, importBundle,
    uid, now, today: () => new Date().toISOString().slice(0, 10)
  };
})();
