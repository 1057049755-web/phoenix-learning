/* 凤凰花·智学本地原型认证
 * 仅用于当前浏览器的原型测试。未来接入后端时，可替换本文件而不改页面表单。
 */
(function () {
  'use strict';

  var DB_NAME = 'fh-local-auth-v1';
  var STORE_NAME = 'accounts';
  var DB_VERSION = 1;
  var SESSION_KEY = 'fh_local_session_v1';
  var REMEMBER_KEY = 'fh_local_remembered_account_v1';
  var LAST_ROLE_KEY = 'fh_last_role_v1';
  var ALGORITHM_VERSION = 'pbkdf2-sha256-v1';
  var ITERATIONS = 310000;
  var dbPromise;

  function now() { return new Date().toISOString(); }

  function encode(value) {
    var bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
    var text = '';
    for (var i = 0; i < bytes.length; i += 1) text += String.fromCharCode(bytes[i]);
    return window.btoa(text);
  }

  function decode(value) {
    var text = window.atob(String(value || ''));
    var bytes = new Uint8Array(text.length);
    for (var i = 0; i < text.length; i += 1) bytes[i] = text.charCodeAt(i);
    return bytes;
  }

  function normalizeAccount(value) {
    return String(value || '').trim().toLocaleLowerCase();
  }

  function publicUser(record) {
    if (!record) return null;
    return {
      id: record.id,
      account: record.account,
      phone: record.account,
      name: record.displayName,
      displayName: record.displayName,
      role: record.role,
      createdAt: record.createdAt,
      lastLoginAt: record.lastLoginAt || '',
      algorithmVersion: record.algorithmVersion,
      local: true
    };
  }

  function openDb() {
    if (dbPromise) return dbPromise;
    if (!window.indexedDB) return Promise.reject(new Error('当前浏览器不支持本地账号存储'));
    dbPromise = new Promise(function (resolve, reject) {
      var request = window.indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = function () {
        var db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          var store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('accountKey', 'accountKey', { unique: true });
        }
      };
      request.onsuccess = function () { resolve(request.result); };
      request.onerror = function () { reject(new Error('本地账号存储初始化失败')); };
    });
    return dbPromise;
  }

  function requestStore(mode, callback) {
    return openDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var transaction = db.transaction(STORE_NAME, mode);
        var store = transaction.objectStore(STORE_NAME);
        var request;
        try { request = callback(store); } catch (error) { reject(error); return; }
        request.onsuccess = function () { resolve(request.result); };
        request.onerror = function () { reject(new Error('本地账号存储操作失败')); };
      });
    });
  }

  function listRecords() { return requestStore('readonly', function (store) { return store.getAll(); }); }
  function getRecord(id) { return requestStore('readonly', function (store) { return store.get(id); }); }
  function getByAccount(accountKey) {
    return requestStore('readonly', function (store) { return store.index('accountKey').get(accountKey); });
  }
  function putRecord(record) { return requestStore('readwrite', function (store) { return store.put(record); }); }
  function deleteRecord(id) { return requestStore('readwrite', function (store) { return store.delete(id); }); }

  function ensureCrypto() {
    if (!window.crypto || !window.crypto.subtle || !window.TextEncoder) {
      throw new Error('当前浏览器不支持 Web Crypto，本地账号暂不可用');
    }
  }

  async function derive(password, salt) {
    ensureCrypto();
    var material = await window.crypto.subtle.importKey('raw', new window.TextEncoder().encode(password), { name: 'PBKDF2' }, false, ['deriveBits']);
    var bits = await window.crypto.subtle.deriveBits({ name: 'PBKDF2', salt: salt, iterations: ITERATIONS, hash: 'SHA-256' }, material, 256);
    return new Uint8Array(bits);
  }

  function equalBytes(left, right) {
    var length = Math.max(left.length, right.length);
    var diff = left.length ^ right.length;
    for (var i = 0; i < length; i += 1) diff |= (left[i % (left.length || 1)] || 0) ^ (right[i % (right.length || 1)] || 0);
    return diff === 0;
  }

  function randomId() {
    if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
    var bytes = new Uint8Array(16);
    window.crypto.getRandomValues(bytes);
    return encode(bytes).replace(/[^A-Za-z0-9]/g, '').slice(0, 22) + Date.now().toString(36);
  }

  function readJson(key, storage) {
    try {
      var raw = storage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (error) { return null; }
  }

  function writeJson(key, value, storage) {
    try { storage.setItem(key, JSON.stringify(value)); } catch (error) {}
  }

  function remember(account, role, remember) {
    try {
      if (remember) writeJson(REMEMBER_KEY, { account: account, role: role }, window.localStorage);
      else window.localStorage.removeItem(REMEMBER_KEY);
      window.localStorage.setItem(LAST_ROLE_KEY, role);
    } catch (error) {}
  }

  function saveSession(record) {
    writeJson(SESSION_KEY, { accountId: record.id, role: record.role }, window.sessionStorage);
  }

  async function createAccount(options) {
    var input = options || {};
    var displayName = String(input.displayName || '').trim();
    var account = String(input.account || '').trim();
    var accountKey = normalizeAccount(account);
    var role = String(input.role || '');
    var password = String(input.password || '');
    if (!role) return { ok: false, field: 'role', msg: '请选择身份' };
    if (!displayName) return { ok: false, field: 'displayName', msg: '请输入显示名称' };
    if (!accountKey) return { ok: false, field: 'account', msg: '请输入账号' };
    if (password.length < 8) return { ok: false, field: 'password', msg: '密码至少 8 位' };
    try {
      var existing = await getByAccount(accountKey);
      if (existing) return { ok: false, field: 'account', msg: '该账号已存在' };
      var salt = new Uint8Array(16);
      ensureCrypto();
      window.crypto.getRandomValues(salt);
      var derived = await derive(password, salt);
      var record = {
        id: randomId(),
        account: account,
        accountKey: accountKey,
        displayName: displayName,
        role: role,
        salt: encode(salt),
        derivedKey: encode(derived),
        algorithmVersion: ALGORITHM_VERSION,
        iterations: ITERATIONS,
        createdAt: now(),
        lastLoginAt: now()
      };
      await putRecord(record);
      remember(account, role, input.remember !== false);
      saveSession(record);
      return { ok: true, user: publicUser(record) };
    } catch (error) {
      return { ok: false, field: 'account', msg: error && error.message ? error.message : '本地账号创建失败' };
    }
  }

  async function login(options) {
    var input = options || {};
    var account = String(input.account || '').trim();
    var accountKey = normalizeAccount(account);
    var password = String(input.password || '');
    var role = String(input.role || '');
    if (!accountKey) return { ok: false, field: 'account', msg: '请输入账号' };
    if (!password) return { ok: false, field: 'password', msg: '请输入密码' };
    try {
      var record = await getByAccount(accountKey);
      if (!record) return { ok: false, field: 'account', msg: '账号不存在' };
      if (record.role !== role) return { ok: false, field: 'role', msg: '当前身份与账号身份不一致' };
      var derived = await derive(password, decode(record.salt));
      if (!equalBytes(derived, decode(record.derivedKey))) return { ok: false, field: 'password', msg: '密码不正确' };
      record.lastLoginAt = now();
      await putRecord(record);
      remember(record.account, record.role, input.remember !== false);
      saveSession(record);
      return { ok: true, user: publicUser(record) };
    } catch (error) {
      return { ok: false, field: 'account', msg: error && error.message ? error.message : '本地登录失败' };
    }
  }

  async function getSessionUser() {
    var session = readJson(SESSION_KEY, window.sessionStorage);
    if (!session || !session.accountId) return null;
    try {
      var record = await getRecord(session.accountId);
      if (!record || record.role !== session.role) {
        logout();
        return null;
      }
      return publicUser(record);
    } catch (error) { return null; }
  }

  async function listAccounts() {
    try {
      var records = await listRecords();
      return records.sort(function (a, b) { return String(b.lastLoginAt || b.createdAt).localeCompare(String(a.lastLoginAt || a.createdAt)); }).map(publicUser);
    } catch (error) { return []; }
  }

  async function changePassword(accountId, oldPassword, newPassword) {
    if (String(newPassword || '').length < 8) return { ok: false, field: 'newPassword', msg: '新密码至少 8 位' };
    try {
      var record = await getRecord(accountId);
      if (!record) return { ok: false, msg: '账号不存在' };
      var oldDerived = await derive(String(oldPassword || ''), decode(record.salt));
      if (!equalBytes(oldDerived, decode(record.derivedKey))) return { ok: false, field: 'oldPassword', msg: '原密码不正确' };
      var salt = new Uint8Array(16);
      window.crypto.getRandomValues(salt);
      record.salt = encode(salt);
      record.derivedKey = encode(await derive(String(newPassword), salt));
      record.algorithmVersion = ALGORITHM_VERSION;
      record.iterations = ITERATIONS;
      await putRecord(record);
      return { ok: true };
    } catch (error) { return { ok: false, msg: error && error.message ? error.message : '密码修改失败' }; }
  }

  async function deleteAccount(accountId) {
    try {
      var session = readJson(SESSION_KEY, window.sessionStorage);
      await deleteRecord(accountId);
      if (session && session.accountId === accountId) logout();
      return { ok: true };
    } catch (error) { return { ok: false, msg: '账号删除失败' }; }
  }

  function logout() {
    try { window.sessionStorage.removeItem(SESSION_KEY); } catch (error) {}
  }

  function remembered() { return readJson(REMEMBER_KEY, window.localStorage) || { account: '', role: '' }; }
  function lastRole() { try { return window.localStorage.getItem(LAST_ROLE_KEY) || ''; } catch (error) { return ''; } }
  function ready() { return openDb().then(function () { ensureCrypto(); return true; }); }

  window.FH_LOCAL_AUTH = {
    ready: ready,
    createAccount: createAccount,
    login: login,
    getSessionUser: getSessionUser,
    listAccounts: listAccounts,
    changePassword: changePassword,
    deleteAccount: deleteAccount,
    logout: logout,
    remembered: remembered,
    lastRole: lastRole,
    algorithmVersion: ALGORITHM_VERSION
  };
}());
