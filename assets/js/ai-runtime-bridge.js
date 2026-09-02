/* 凤凰花·智学 AI 运行时适配层 v1
 * 让连接中心保存的 provider / model / API Key 真正进入服务端中转请求。
 * API Key 仅保存在当前浏览器设备的独立存储槽中，不进入业务数据、导出包或工作流日志。
 */
(function () {
  'use strict';
  const AI = window.AI;
  if (!AI) return;
  const SECRET_KEY = 'fh_ai_connection_secrets_v1';
  const readSecrets = () => { try { const value = JSON.parse(localStorage.getItem(SECRET_KEY) || '{}'); return value && typeof value === 'object' ? value : {}; } catch (e) { return {}; } };
  const writeSecrets = value => { try { localStorage.setItem(SECRET_KEY, JSON.stringify(value)); } catch (e) {} };
  const secrets = readSecrets();
  const original = { saveProfile: AI.saveProfile, getProfile: AI.getProfile, getProfiles: AI.getProfiles, chat: AI.chat, testProfile: AI.testProfile, isConfigured: AI.isConfigured, providerLabel: AI.providerLabel };

  if (!AI.PROTOCOLS['google-generate-content']) AI.PROTOCOLS['google-generate-content'] = { label: 'Google Gemini generateContent', suffix: '', family: 'google' };

  function profile(id, withKey, seed) {
    const config = AI.getConfig ? AI.getConfig() : {};
    const target = id || config.activeProfileId;
    const value = original.getProfile && target ? original.getProfile(target, false) : null;
    const out = Object.assign({}, seed || {}, value || {});
    if (!out.id && !out.provider && !out.baseUrl && !out.model) return null;
    if (withKey) out.apiKey = secrets[out.id] || String(seed && seed.apiKey || '').trim().slice(0, 1000) || '';
    out.hasKey = !!(secrets[out.id] || (seed && seed.apiKey) || (value && value.hasKey));
    return out;
  }
  AI.getProfile = function (id, withKey) { return profile(id, !!withKey); };
  AI.getProfiles = function () { return (original.getProfiles ? original.getProfiles() : []).map(item => Object.assign({}, item, { hasKey: !!(secrets[item.id] || item.hasKey) })); };
  AI.saveProfile = function (input, options) {
    const safeInput = Object.assign({}, input || {}, { apiKey: '', clearKey: true });
    const result = original.saveProfile(safeInput, options);
    const id = result && result.id;
    const next = Object.assign({}, secrets);
    if (input && input.clearKey) delete next[id];
    else if (input && input.apiKey) next[id] = String(input.apiKey).trim().slice(0, 1000);
    writeSecrets(next);
    Object.keys(secrets).forEach(key => delete secrets[key]);
    Object.assign(secrets, next);
    return Object.assign({}, result, { hasKey: !!next[id] });
  };
  function endpoint(profileValue) {
    const base = String(profileValue && (profileValue.baseUrl || profileValue.endpoint) || '').replace(/\/$/, '');
    const model = encodeURIComponent(String(profileValue && profileValue.model || '').trim());
    if (!base || !model) return '';
    if (profileValue.protocol === 'google-generate-content') return base + '/models/' + model + ':generateContent';
    const suffix = profileValue.endpointPath || ({ 'openai-chat': '/chat/completions', 'openai-responses': '/responses', 'anthropic-messages': '/messages', 'cohere-chat': '/chat', 'replicate-predictions': '/predictions' })[profileValue.protocol] || '/chat/completions';
    return /\/(chat\/completions|responses|messages|chat|predictions)$/.test(base) ? base : base + suffix;
  }
  function networkUrl(path) { return window.FHNetwork && window.FHNetwork.url ? window.FHNetwork.url(path) : path; }
  function networkHeaders() { return window.FHNetwork && window.FHNetwork.headers ? window.FHNetwork.headers({ 'Content-Type': 'application/json' }) : { 'Content-Type': 'application/json' }; }
  async function chat(messages, options) {
    const opts = options || {};
    const seed = opts.profile && typeof opts.profile === 'object' ? opts.profile : null;
    const p = profile(seed && seed.id || (typeof opts.profile === 'string' ? opts.profile : ''), true, seed);
    const body = { messages: messages, maxTokens: Math.min(Number(opts.maxTokens || 1600), 8000), temperature: Number(opts.temperature == null ? 0.2 : opts.temperature), workflow: opts.workflow || null };
    if (p && p.provider && p.model && p.apiKey) body.connection = { provider: p.provider, protocol: p.protocol, baseUrl: p.baseUrl, model: p.model, apiKey: p.apiKey, headers: p.headers || '' };
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), Math.min(Math.max(Number(opts.timeout || 90000), 5000), 180000));
    try {
      const res = await fetch(networkUrl('/api/ai/chat'), { method: 'POST', headers: networkHeaders(), body: JSON.stringify(body), signal: ctl.signal });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) { const error = new Error(data.msg || 'AI 服务请求失败'); error.code = data.code; error.retryable = !!data.retryable; throw error; }
      return String(data.content || '').trim();
    } catch (error) {
      if (error && error.name === 'AbortError') throw new Error('AI 请求超时，请稍后重试');
      throw error;
    } finally { clearTimeout(timer); }
  }
  AI.chat = chat;
  AI.isConfigured = function () {
    const status = window.__FH_AI_STATUS__;
    const config = AI.getConfig ? AI.getConfig() : {};
    const p = profile(config.activeProfileId, true);
    return !!((p && endpoint(p) && p.apiKey) || (status && status.configured));
  };
  AI.providerLabel = function () {
    const config = AI.getConfig ? AI.getConfig() : {};
    const p = profile(config.activeProfileId, true);
    if (p && p.provider && p.model) return (p.providerName || p.provider) + ' · ' + p.model;
    return original.providerLabel ? original.providerLabel() : 'AI 服务';
  };
  AI.testProfile = async function (input) {
    const value = Object.assign({}, input || {});
    const result = await chat([{ role: 'system', content: '只回复两个字：正常' }, { role: 'user', content: '连接测试' }], { profile: value, timeout: 20000, maxTokens: 20, temperature: 0, workflow: 'model.connection_test' });
    return { ok: !!result, route: 'relay', model: value.model || '', message: '当前模型连接测试通过' };
  };
  AI.connectionEndpoint = endpoint;
  window.FH_AI_RUNTIME = Object.freeze({ version: 'runtime-bridge.v1', getActiveProfile: () => profile('', true), endpoint });
})();
