/* ================= 凤凰花·智学 · 网络接入层 =================
 * 本地优先：没有配置地址时跟随当前页面；配置地址后可连接局域网或独立 API 服务。
 * 这里只保存 API 地址与访问令牌，不保存 AI 密钥，也不会主动把浏览器数据上传到陌生服务。
 */
(function () {
  'use strict';

  const STORE_KEY = 'fh_v2_network';
  let runtime = { state: 'idle', checkedAt: '', status: 0, message: '' };

  function readStored() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  }

  function initialConfig() {
    const injected = window.FH_CONFIG && typeof window.FH_CONFIG === 'object' ? window.FH_CONFIG : {};
    const stored = readStored();
    let queryBase = '';
    try { queryBase = new URLSearchParams(location.search).get('fh_api') || ''; } catch (e) {}
    return normalizeConfig(Object.assign({}, stored, injected, queryBase ? { apiBase: queryBase } : {}));
  }

  function normalizeBase(value) {
    const raw = String(value == null ? '' : value).trim();
    if (!raw) return '';
    if (!/^https?:\/\//i.test(raw)) throw new Error('服务地址需以 http:// 或 https:// 开头');
    const parsed = new URL(raw);
    if (!parsed.host) throw new Error('服务地址缺少主机名');
    return raw.replace(/\/+$/, '');
  }

  function normalizeConfig(input) {
    const cfg = input || {};
    return {
      apiBase: normalizeBase(cfg.apiBase || ''),
      token: String(cfg.token || '').trim()
    };
  }

  function getConfig() {
    try { return initialConfig(); }
    catch (e) { return { apiBase: '', token: '' }; }
  }

  function setConfig(patch) {
    const next = normalizeConfig(Object.assign({}, getConfig(), patch || {}));
    try { localStorage.setItem(STORE_KEY, JSON.stringify(next)); } catch (e) {}
    emit();
    return next;
  }

  function clearConfig() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    runtime = { state: 'idle', checkedAt: '', status: 0, message: '' };
    emit();
  }

  function configured() { return !!getConfig().apiBase; }

  function url(pathname) {
    const path = String(pathname || '');
    const base = getConfig().apiBase;
    return base ? base + (path.charAt(0) === '/' ? path : '/' + path) : path;
  }

  function getToken() {
    const cfg = getConfig();
    if (cfg.token) return cfg.token;
    try {
      return localStorage.getItem('fh_v2_token') || new URLSearchParams(location.search).get('fh_token') || '';
    } catch (e) { return ''; }
  }

  function headers(base) {
    return headersWithToken(base, getToken());
  }

  function headersWithToken(base, token) {
    const out = Object.assign({}, base || {});
    if (token) out.Authorization = 'Bearer ' + token;
    return out;
  }

  function emit() {
    try { window.dispatchEvent(new CustomEvent('fh-network-state', { detail: summary() })); } catch (e) {}
  }

  function report(ok, message, status) {
    runtime = {
      state: ok ? 'online' : 'offline',
      checkedAt: new Date().toISOString(),
      status: Number(status || 0),
      message: String(message || (ok ? '服务可用' : '服务暂不可用'))
    };
    emit();
    return runtime;
  }

  function summary() {
    const cfg = getConfig();
    return {
      configured: !!cfg.apiBase,
      apiBase: cfg.apiBase,
      tokenSet: !!getToken(),
      state: runtime.state,
      checkedAt: runtime.checkedAt,
      status: runtime.status,
      message: runtime.message
    };
  }

  async function check(options) {
    const opts = options || {};
    const cfg = normalizeConfig({ apiBase: opts.apiBase !== undefined ? opts.apiBase : getConfig().apiBase, token: opts.token !== undefined ? opts.token : getToken() });
    if (!cfg.apiBase && location.protocol !== 'http:' && location.protocol !== 'https:') {
      return report(false, '本地文件模式未配置服务地址', 0);
    }
    const target = cfg.apiBase ? cfg.apiBase + '/api/ping' : '/api/ping';
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), Number(opts.timeout || 8000));
    try {
      const res = await fetch(target, { method: 'GET', headers: headersWithToken({}, cfg.token), signal: ctl.signal });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || !payload.ok) throw new Error((payload && payload.msg) || ('HTTP ' + res.status));
      const writeHint = payload.tokenRequired && !cfg.token ? ' · 读取可用，写入需要访问令牌' : '';
      return report(true, '服务已连接' + writeHint + ' · ' + (payload.name || '数据服务'), res.status);
    } catch (e) {
      const message = e && e.name === 'AbortError' ? '连接超时，请检查地址或局域网状态' : String((e && e.message) || '无法连接服务');
      return report(false, message, e && e.status || 0);
    } finally { clearTimeout(timer); }
  }

  window.FHNetwork = {
    getConfig: getConfig,
    setConfig: setConfig,
    clearConfig: clearConfig,
    configured: configured,
    url: url,
    getToken: getToken,
    headers: headers,
    check: check,
    report: report,
    summary: summary
  };
})();
