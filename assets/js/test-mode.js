(function () {
  'use strict';

  var SESSION_KEY = 'fh_test_session_v1';
  var DATA_KEY = 'fh_test_demo_data_v1';
  var PUBLIC_TEST_HOSTS = ['phoenixlearning.xyz', 'www.phoenixlearning.xyz', '1057049755-web.github.io'];
  var roleLabels = { student: '学生', teacher: '教师', academic: '教务处', admin: '系统管理员' };

  function isLocalHost() {
    return /^(localhost|127\.0\.0\.1|::1)$/i.test(location.hostname || '');
  }

  function isPreviewHost() {
    return /(^|\.)((pages|preview|staging)\.|pages\.dev$|vercel\.app$|netlify\.app$)/i.test(location.hostname || '');
  }

  function isPublicTestHost() {
    return PUBLIC_TEST_HOSTS.indexOf(String(location.hostname || '').toLowerCase()) >= 0;
  }

  function isEnabled() {
    var config = window.FH_CONFIG && typeof window.FH_CONFIG === 'object' ? window.FH_CONFIG : {};
    return config.enableTestAccess === true || window.FH_TEST_ACCESS === true || isLocalHost() || isPreviewHost() || isPublicTestHost();
  }

  function read(key, storage) {
    try {
      var raw = storage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function write(key, value, storage) {
    try { storage.setItem(key, JSON.stringify(value)); return true; } catch (error) { return false; }
  }

  function makeDemoData(role) {
    var label = roleLabels[role] || '使用者';
    return {
      version: 1,
      namespace: 'fh-test-only',
      createdAt: new Date().toISOString(),
      role: role,
      label: label,
      tasks: [
        { id: 'test-task-1', title: role === 'student' ? '完成今日学习任务' : '查看今日待处理事项', done: false },
        { id: 'test-task-2', title: role === 'teacher' ? '检查一份待批改作业' : '浏览平台入口', done: false }
      ],
      notices: [{ id: 'test-notice-1', title: '测试模式', text: '这里的状态只用于查看页面，不会写入真实账号。' }],
      stats: { pending: 2, completed: 0 }
    };
  }

  function start(role, withDemo) {
    if (!isEnabled() || !roleLabels[role]) return false;
    var session = { id: 'test_' + role, role: role, createdAt: new Date().toISOString(), demo: !!withDemo };
    write(SESSION_KEY, session, window.sessionStorage);
    if (withDemo) write(DATA_KEY, makeDemoData(role), window.localStorage);
    else {
      try { window.localStorage.removeItem(DATA_KEY); } catch (error) {}
    }
    return true;
  }

  function session() { return read(SESSION_KEY, window.sessionStorage); }
  function demoData() { return read(DATA_KEY, window.localStorage); }
  function clear() {
    try { window.sessionStorage.removeItem(SESSION_KEY); } catch (error) {}
    try { window.localStorage.removeItem(DATA_KEY); } catch (error) {}
  }

  window.FH_TEST_MODE = { isEnabled: isEnabled, start: start, session: session, demoData: demoData, clear: clear, roleLabels: roleLabels };
}());
