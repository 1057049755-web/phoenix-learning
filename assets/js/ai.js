/* ================= 凤凰花·智学 AI 连接层 =================
 * 连接模型时采用 provider / base URL / wire protocol / model / credential
 * 五段式配置，兼容常见 AI harness 的连接方式：可保存多个 profile，选择
 * 服务端中转或浏览器直连，并支持 OpenAI Chat、OpenAI Responses、Anthropic Messages。
 */
(function () {
  'use strict';

  const STORE_KEY = 'fh_ai_config';

  const PROVIDERS = {
    zhipu: {
      name: '智谱 GLM-4-Flash（免费）',
      endpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
      model: 'glm-4-flash',
      auth: 'bearer', protocol: 'openai-chat',
      keyHint: '在 bigmodel.cn 注册后创建 API Key（GLM-4-Flash 免费）'
    },
    groq: {
      name: 'Groq（免费额度）',
      endpoint: 'https://api.groq.com/openai/v1/chat/completions',
      model: 'llama-3.3-70b-versatile',
      auth: 'bearer', protocol: 'openai-chat',
      keyHint: '在 console.groq.com 免费申请 API Key'
    },
    siliconflow: {
      name: '硅基流动（免费额度）',
      endpoint: 'https://api.siliconflow.cn/v1/chat/completions',
      model: 'Qwen/Qwen2.5-7B-Instruct',
      auth: 'bearer', protocol: 'openai-chat',
      keyHint: '在 cloud.siliconflow.cn 注册，选择免费模型额度'
    },
    pollinations: {
      name: 'Pollinations（免 Key，服务迁移中）',
      endpoint: 'https://text.pollinations.ai/',
      model: 'openai',
      auth: 'none', protocol: 'openai-chat',
      keyHint: '无需 Key；官方文本接口正在迁移（可能返回 402），仅作备选。稳定使用请选智谱 / Groq / 硅基流动，或部署 server/ 后走云端中转。'
    },
    openrouter: {
      name: 'OpenRouter 中转（免费模型）',
      endpoint: 'https://openrouter.ai/api/v1/chat/completions',
      model: 'deepseek/deepseek-chat-v3-0324:free',
      auth: 'bearer', protocol: 'openai-chat',
      keyHint: '在 openrouter.ai 免费注册并创建 API Key；模型栏填带 :free 后缀的免费模型，如 deepseek/deepseek-chat-v3-0324:free、qwen/qwen2.5-72b-instruct:free、meta-llama/llama-3.3-70b-instruct:free'
    },
    deepseek: {
      name: 'DeepSeek V4（官方直连）',
      endpoint: 'https://api.deepseek.com/chat/completions',
      model: 'deepseek-chat',
      auth: 'bearer', protocol: 'openai-chat',
      keyHint: '在 platform.deepseek.com 创建 API Key；V4 标准对话模型 deepseek-chat，接口兼容 OpenAI 格式'
    },
    deepseekFlash: {
      name: 'DeepSeek V4 Flash（官方直连）',
      endpoint: 'https://api.deepseek.com/chat/completions',
      model: 'deepseek-v4-flash',
      auth: 'bearer', protocol: 'openai-chat',
      keyHint: 'DeepSeek V4 Flash 轻量快速（目前免费），适合高频调用；Key 同样在 platform.deepseek.com 创建'
    },
    deepseekReasoner: {
      name: 'DeepSeek V4 深度推理（官方直连）',
      endpoint: 'https://api.deepseek.com/chat/completions',
      model: 'deepseek-reasoner',
      auth: 'bearer', protocol: 'openai-chat',
      keyHint: 'DeepSeek V4 深度推理模型 deepseek-reasoner，适合复杂推理任务；Key 在 platform.deepseek.com 创建'
    },
    custom: {
      name: '自定义中转（OpenAI 兼容）',
      endpoint: 'https://your-relay.example.com/v1/chat/completions',
      model: 'gpt-4o-mini',
      auth: 'optional', protocol: 'openai-chat',
      keyHint: '填写任意 OpenAI 兼容中转站的接口地址与 Key（Key 可留空）。可用于各类稳定免费/低价中转站'
    },
    paid: {
      name: '旗舰模型（付费版）',
      endpoint: '',
      model: 'gpt-5',
      auth: 'optional', protocol: 'openai-chat',
      keyHint: '旗舰模型需通过中转站调用：填写中转地址与 Key，再选择模型。仅最高会员等级可见'
    },
    openai: {
      name: 'OpenAI（Responses / Chat）',
      endpoint: 'https://api.openai.com/v1/responses',
      model: 'gpt-4.1-mini',
      auth: 'bearer', protocol: 'openai-responses',
      keyHint: '在 platform.openai.com 创建 API Key；默认使用 Responses API，可切换到 Chat Completions'
    },
    anthropic: {
      name: 'Anthropic Claude（Messages）',
      endpoint: 'https://api.anthropic.com/v1/messages',
      model: 'claude-3-5-sonnet-latest',
      auth: 'x-api-key', protocol: 'anthropic-messages',
      keyHint: '在 console.anthropic.com 创建 API Key；浏览器直连需要服务商允许跨域，建议通过自有网关中转'
    },
  };

  /* 付费旗舰模型库：覆盖近两年主流大模型（OpenAI / Anthropic / Google / 国内旗舰 / 开源旗舰），
     常规隐藏，仅对会员等级拉满的用户开放；通过用户自己的 OpenAI 兼容中转地址调用 */
  const PAID_MODELS = [
    { group: 'OpenAI', items: [
      { id: 'gpt-5', name: 'GPT-5（旗舰）' },
      { id: 'gpt-4.1', name: 'GPT-4.1' },
      { id: 'o3', name: 'o3（深度推理）' },
      { id: 'o4-mini', name: 'o4-mini（快速推理）' },
      { id: 'gpt-4o', name: 'GPT-4o' }
    ]},
    { group: 'Anthropic', items: [
      { id: 'claude-opus-4-1', name: 'Claude Opus 4.1' },
      { id: 'claude-sonnet-4-5', name: 'Claude Sonnet 4.5' },
      { id: 'claude-3-7-sonnet', name: 'Claude 3.7 Sonnet' }
    ]},
    { group: 'Google', items: [
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' }
    ]},
    { group: '国内旗舰', items: [
      { id: 'deepseek-r1', name: 'DeepSeek-R1（推理）' },
      { id: 'deepseek-v3-0324', name: 'DeepSeek-V3-0324' },
      { id: 'qwen3-max', name: '通义千问 Qwen3-Max' },
      { id: 'kimi-k2', name: '月之暗面 Kimi K2' },
      { id: 'glm-4.6', name: '智谱 GLM-4.6' },
      { id: 'doubao-seed-1.6', name: '豆包 Seed 1.6' },
      { id: 'minimax-m2', name: 'MiniMax M2' }
    ]},
    { group: '开源旗舰', items: [
      { id: 'llama-4-maverick', name: 'Llama 4 Maverick' },
      { id: 'qwen3-235b', name: 'Qwen3-235B-A22B' },
      { id: 'grok-3', name: 'xAI Grok 3' }
    ]}
  ];

  const CONFIG_VERSION = 2;
  const PROTOCOLS = {
    'openai-chat': { label: 'OpenAI Chat Completions', suffix: '/chat/completions', family: 'openai' },
    'openai-responses': { label: 'OpenAI Responses', suffix: '/responses', family: 'openai' },
    'anthropic-messages': { label: 'Anthropic Messages', suffix: '/messages', family: 'anthropic' }
  };
  const ROUTES = {
    auto: { label: '智能路由', desc: '优先服务端中转，失败时尝试浏览器直连' },
    relay: { label: '服务端中转', desc: 'Key 只在服务端配置，适合网络端和团队共用' },
    direct: { label: '浏览器直连', desc: '浏览器直接访问公网模型服务，需要服务商允许跨域' }
  };

  function nowIso() { return new Date().toISOString(); }
  function makeId(prefix) { return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function providerOf(id) { return PROVIDERS[id] || PROVIDERS.custom; }
  function inferProtocol(endpoint, fallback) {
    if (fallback && PROTOCOLS[fallback]) return fallback;
    if (/\/responses\/?$/i.test(String(endpoint || ''))) return 'openai-responses';
    if (/\/messages\/?$/i.test(String(endpoint || ''))) return 'anthropic-messages';
    return 'openai-chat';
  }
  function stripEndpoint(endpoint) {
    return String(endpoint || '').trim().replace(/\/(?:chat\/completions|responses|messages)\/?$/i, '').replace(/\/+$/, '');
  }
  function endpointFor(profile) {
    const protocol = PROTOCOLS[profile.protocol] ? profile.protocol : 'openai-chat';
    const base = stripEndpoint(profile.baseUrl || profile.endpoint);
    if (!base) return '';
    return base + PROTOCOLS[protocol].suffix;
  }
  function defaultProfile(providerId) {
    const p = providerOf(providerId);
    return normalizeProfile({
      id: makeId('profile'),
      name: p.name.replace(/（.*$/, '').trim() || p.name,
      provider: providerId || 'custom',
      baseUrl: stripEndpoint(p.endpoint),
      model: p.model || '',
      protocol: p.protocol || inferProtocol(p.endpoint),
      mode: 'auto',
      headers: '',
      apiKey: ''
    });
  }
  function normalizeProfile(input) {
    const src = input || {};
    const provider = String(src.provider || src.providerId || 'custom');
    const p = providerOf(provider);
    const protocol = PROTOCOLS[src.protocol] ? src.protocol : (p.protocol || inferProtocol(src.endpoint, src.protocol));
    const baseUrl = stripEndpoint(src.baseUrl || src.endpoint || p.endpoint);
    return {
      id: String(src.id || makeId('profile')),
      name: String(src.name || p.name || '新连接').trim().slice(0, 80),
      provider: provider,
      baseUrl: baseUrl,
      model: String(src.model || p.model || '').trim().slice(0, 180),
      protocol: protocol,
      mode: ROUTES[src.mode] ? src.mode : 'auto',
      headers: typeof src.headers === 'string' ? src.headers.slice(0, 4000) : '',
      apiKey: String(src.apiKey !== undefined ? src.apiKey : (src.key || '')).trim(),
      createdAt: src.createdAt || nowIso(),
      updatedAt: nowIso(),
      lastTest: src.lastTest && typeof src.lastTest === 'object' ? {
        ok: !!src.lastTest.ok,
        at: String(src.lastTest.at || ''),
        route: String(src.lastTest.route || ''),
        message: String(src.lastTest.message || '').slice(0, 180)
      } : null
    };
  }
  function readStore() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      const old = raw ? JSON.parse(raw) : {};
      if (old && Number(old.version) >= CONFIG_VERSION && Array.isArray(old.profiles)) {
        const profiles = old.profiles.map(normalizeProfile);
        const activeProfileId = profiles.some(p => p.id === old.activeProfileId) ? old.activeProfileId : (profiles[0] && profiles[0].id) || '';
        return Object.assign({ version: CONFIG_VERSION, activeProfileId, profiles }, old, { version: CONFIG_VERSION, activeProfileId, profiles });
      }
      const provider = String(old.provider || 'openrouter');
      const legacy = normalizeProfile({
        id: 'profile_default',
        name: providerOf(provider).name,
        provider: provider,
        endpoint: old.endpoint || providerOf(provider).endpoint,
        model: old.model || providerOf(provider).model,
        protocol: old.protocol,
        mode: old.relayBase ? 'auto' : 'direct',
        apiKey: old.key || old.apiKey || ''
      });
      return {
        version: CONFIG_VERSION,
        activeProfileId: legacy.baseUrl || legacy.model || legacy.apiKey ? legacy.id : '',
        profiles: legacy.baseUrl || legacy.model || legacy.apiKey ? [legacy] : [],
        relayBase: String(old.relayBase || '').trim(),
        style: old.style || 'warm',
        corpus: old.corpus !== false,
        corpusCats: Array.isArray(old.corpusCats) ? old.corpusCats : ['ancient', 'modern', 'foreign', 'pedagogy']
      };
    } catch (e) {
      return { version: CONFIG_VERSION, activeProfileId: '', profiles: [], relayBase: '', style: 'warm', corpus: true, corpusCats: ['ancient', 'modern', 'foreign', 'pedagogy'] };
    }
  }
  function writeStore(store) {
    const next = Object.assign({ version: CONFIG_VERSION }, store, { version: CONFIG_VERSION });
    localStorage.setItem(STORE_KEY, JSON.stringify(next));
    return next;
  }
  function publicProfile(profile) {
    const p = Object.assign({}, profile || {});
    delete p.apiKey;
    p.hasKey = !!(profile && profile.apiKey);
    p.endpoint = endpointFor(profile || {});
    p.providerName = providerOf(p.provider).name;
    p.protocolLabel = (PROTOCOLS[p.protocol] || PROTOCOLS['openai-chat']).label;
    p.modeLabel = (ROUTES[p.mode] || ROUTES.auto).label;
    return p;
  }
  function activeProfile(includeSecret) {
    const store = readStore();
    const p = store.profiles.find(item => item.id === store.activeProfileId) || store.profiles[0] || null;
    if (!p) return null;
    return includeSecret ? p : publicProfile(p);
  }
  function getConfig() {
    const store = readStore();
    const active = activeProfile(true);
    return Object.assign({}, store, {
      profiles: store.profiles.map(publicProfile),
      activeProfileId: active ? active.id : '',
      activeProfile: active ? publicProfile(active) : null,
      provider: active ? active.provider : '',
      model: active ? active.model : '',
      endpoint: active ? endpointFor(active) : '',
      relayBase: store.relayBase || ''
    });
  }
  function getProfiles() { return readStore().profiles.map(publicProfile); }
  function getProfile(id, includeSecret) {
    const p = readStore().profiles.find(item => item.id === id) || null;
    return p ? (includeSecret ? p : publicProfile(p)) : null;
  }
  function setConfig(cfg) {
    const store = readStore();
    const active = store.profiles.find(item => item.id === store.activeProfileId) || store.profiles[0];
    if (active) saveProfile(Object.assign({}, active, cfg || {}, { id: active.id }));
    else if (cfg && (cfg.endpoint || cfg.baseUrl || cfg.model || cfg.key)) saveProfile(cfg, { activate: true });
    else writeStore(Object.assign(store, cfg || {}));
  }
  function saveProfile(input, options) {
    const opts = options || {};
    const store = readStore();
    const existing = store.profiles.find(item => item.id === input.id);
    const incoming = Object.assign({}, existing || {}, input || {});
    if (existing && input && input.apiKey === '' && !input.clearKey) incoming.apiKey = existing.apiKey;
    if (input && input.clearKey) incoming.apiKey = '';
    delete incoming.clearKey;
    const next = normalizeProfile(incoming);
    const index = store.profiles.findIndex(item => item.id === next.id);
    if (index >= 0) store.profiles[index] = next; else store.profiles.push(next);
    if (opts.activate || !store.activeProfileId) store.activeProfileId = next.id;
    writeStore(store);
    emitConfigChange();
    return publicProfile(next);
  }
  function removeProfile(id) {
    const store = readStore();
    store.profiles = store.profiles.filter(item => item.id !== id);
    if (store.activeProfileId === id) store.activeProfileId = store.profiles[0] ? store.profiles[0].id : '';
    writeStore(store);
    emitConfigChange();
    return getProfiles();
  }
  function activateProfile(id) {
    const store = readStore();
    if (!store.profiles.some(item => item.id === id)) throw new Error('连接配置不存在');
    store.activeProfileId = id;
    writeStore(store);
    emitConfigChange();
    return publicProfile(store.profiles.find(item => item.id === id));
  }
  function emitConfigChange() {
    try { window.dispatchEvent(new CustomEvent('fh-ai-config-changed', { detail: getConfig() })); } catch (e) {}
  }

  function isConfigured() {
    return true; // 即使无模型也允许进入本地审核题库模式
  }

  function providerLabel() {
    const p = activeProfile(true);
    if (window.__FH_AI_STATUS__ && window.__FH_AI_STATUS__.configured) return '学校 AI 服务';
    if (p && p.model && endpointFor(p) && (p.apiKey || providerOf(p.provider).auth === 'none' || providerOf(p.provider).auth === 'optional')) {
      return (providerOf(p.provider).name || 'AI 连接') + ' · ' + p.model;
    }
    return '本地审核题库';
  }

  /* ---------- 通用对话 ---------- */
  let relayOk = null;
  let relayOkAt = 0;
  function profileWithSecret(input) {
    const src = input || {};
    const existing = src.id ? getProfile(src.id, true) : activeProfile(true);
    const merged = Object.assign({}, existing || {}, src);
    if (src.apiKey === '' && existing && existing.apiKey) merged.apiKey = existing.apiKey;
    return normalizeProfile(merged);
  }
  function canUseDirect(profile) {
    const p = providerOf(profile.provider);
    return !!(endpointFor(profile) && profile.model && (profile.apiKey || p.auth === 'none' || p.auth === 'optional'));
  }
  function parseCustomHeaders(profile) {
    if (!profile || !profile.headers) return {};
    try {
      const value = JSON.parse(profile.headers);
      if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
      return Object.keys(value).slice(0, 20).reduce((out, key) => {
        if (/^[A-Za-z0-9-]{1,80}$/.test(key) && typeof value[key] === 'string') out[key] = value[key].slice(0, 400);
        return out;
      }, {});
    } catch (e) { return {}; }
  }
  function authHeaders(profile) {
    const headers = Object.assign({ 'Content-Type': 'application/json' }, parseCustomHeaders(profile));
    const p = providerOf(profile.provider);
    if (profile.apiKey) {
      if (profile.protocol === 'anthropic-messages' || p.auth === 'x-api-key') {
        headers['x-api-key'] = profile.apiKey;
        headers['anthropic-version'] = headers['anthropic-version'] || '2023-06-01';
      } else headers.Authorization = 'Bearer ' + profile.apiKey;
    }
    if (/openrouter\.ai/i.test(endpointFor(profile))) {
      headers['HTTP-Referer'] = location.origin;
      headers['X-Title'] = '凤凰花·智学';
    }
    return headers;
  }
  function responseContent(data, protocol) {
    if (!data) return '';
    if (protocol === 'anthropic-messages') return (data.content || []).map(item => item && item.text || '').join('').trim();
    if (protocol === 'openai-responses') {
      if (data.output_text) return String(data.output_text).trim();
      return (data.output || []).flatMap(item => (item && item.content) || []).map(item => item && (item.text || item.value) || '').join('').trim();
    }
    const content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    return Array.isArray(content) ? content.map(item => item && (item.text || item.content) || '').join('').trim() : String(content || '').trim();
  }
  function relayUrl(path) {
    const cfg = getConfig() || {};
    if (cfg.relayBase) return String(cfg.relayBase).replace(/\/$/, '') + path;
    return window.FHNetwork && window.FHNetwork.url ? window.FHNetwork.url(path) : path;
  }
  function relayHeaders(extra) {
    const base = Object.assign({ 'Content-Type': 'application/json' }, extra || {});
    return window.FHNetwork && window.FHNetwork.headers ? window.FHNetwork.headers(base) : base;
  }
  async function relayAvailable(force) {
    // 带 5 秒 TTL 的缓存，避免每次 AI 请求都额外探测网络。
    if (force) relayOk = null;
    if (relayOk !== null && Date.now() - relayOkAt < 5000) return relayOk;
    try {
      const r = await fetch(relayUrl('/api/ping'), { method: 'GET' });
      relayOk = r.ok;
    } catch (e) { relayOk = false; }
    relayOkAt = Date.now();
    return relayOk;
  }

  async function relayStatus() {
    try {
      const r = await fetch(relayUrl('/api/ai/status'), { headers: relayHeaders() });
      const data = r.ok ? await r.json() : {};
      return Object.assign({ ok: r.ok, configured: false }, data, { route: 'relay' });
    } catch (e) { return { ok: false, configured: false, network: false, route: 'relay' }; }
  }

  async function serverStatus() {
    const profile = activeProfile(true);
    const direct = profile && canUseDirect(profile);
    const relay = profile && profile.mode === 'direct' ? { ok: false, configured: false } : await relayStatus();
    if (relay.ok && relay.configured) return Object.assign(relay, { model: relay.model || (profile && profile.model) || '', direct: false });
    if (direct && (!profile || profile.mode !== 'relay')) return { ok: true, configured: true, direct: true, route: 'direct', model: profile.model, endpoint: endpointFor(profile) };
    return Object.assign(relay, { model: (profile && profile.model) || relay.model || '' });
  }

  async function directRequest(profile, messages, opts) {
    const options = opts || {};
    const endpoint = endpointFor(profile);
    if (!canUseDirect(profile)) throw new Error('当前连接缺少可用的 base URL、模型名称或密钥');
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), Number(options.timeout || 45000));
    const temperature = options.temperature != null ? options.temperature : 0.7;
    const maxTokens = options.maxTokens || 1400;
    const body = profile.protocol === 'anthropic-messages'
      ? { model: profile.model, system: messages.filter(m => m.role === 'system').map(m => m.content).join('\n'), messages: messages.filter(m => m.role !== 'system'), max_tokens: maxTokens, temperature: temperature }
      : profile.protocol === 'openai-responses'
        ? { model: profile.model, input: messages, max_output_tokens: maxTokens, temperature: temperature }
        : { model: profile.model, messages: messages, temperature: temperature, max_tokens: maxTokens };
    try {
      const res = await fetch(endpoint, { method: 'POST', headers: authHeaders(profile), signal: ctl.signal, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data.error && (data.error.message || data.error.type)) || data.message || ('模型服务异常（HTTP ' + res.status + '）'));
      const content = responseContent(data, profile.protocol);
      if (!content) throw new Error('模型未返回内容');
      return content;
    } catch (e) {
      if (e && e.name === 'AbortError') throw new Error('模型连接超时，请检查地址或网络状态');
      throw e;
    } finally { clearTimeout(timer); }
  }

  /* 请求模型：优先服务端中转，自动模式可在中转未配置时回退浏览器直连。 */
  async function chat(messages, opts) {
    opts = opts || {};
    const profile = profileWithSecret(opts.profile || null);
    const timeout = opts.timeout || 45000;
    const temperature = opts.temperature != null ? opts.temperature : 0.7;
    const maxTokens = opts.maxTokens || 1400;
    const canDirect = canUseDirect(profile);
    const mode = profile.mode || 'auto';
    if (mode !== 'direct' && await relayAvailable()) {
      const rctl = new AbortController();
      const rtimer = setTimeout(() => rctl.abort(), Math.max(timeout, 90000));
      try {
        const res = await fetch(relayUrl('/api/ai/chat'), {
          method: 'POST', headers: relayHeaders(),
          // 网络端中转只使用服务端配置，避免把本机 Key 放进浏览器到站点的请求正文。
          // 连接 profile 会在 relay 不可用或用户选择“浏览器直连”时直接调用模型服务。
          body: JSON.stringify({ messages: messages, temperature: temperature, maxTokens: maxTokens }),
          signal: rctl.signal
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data || !data.ok) {
          if ((!data || data.code === 'AI_NOT_CONFIGURED') && mode === 'auto' && canDirect) return directRequest(profile, messages, { timeout, temperature, maxTokens });
          const err = new Error((data && data.msg) || ('模型服务异常（HTTP ' + res.status + '）'));
          err.code = data && data.code; err.status = res.status; err.retryable = !!(data && data.retryable); throw err;
        }
        return String(data.content || '').trim();
      } catch (e) {
        if (e && e.name === 'AbortError') throw new Error('服务端中转超时，请稍后重试或切换连接方式');
        if (mode === 'auto' && canDirect) return directRequest(profile, messages, { timeout, temperature, maxTokens });
        throw e;
      } finally { clearTimeout(rtimer); }
    }
    if (mode !== 'relay' && canDirect) return directRequest(profile, messages, { timeout, temperature, maxTokens });
    throw new Error(mode === 'relay' ? '服务端中转不可用或尚未配置模型' : '当前连接缺少可用的模型配置');
  }

  async function testProfile(input) {
    const profile = profileWithSecret(input || {});
    const probe = [{ role: 'system', content: '只回复两个字：正常' }, { role: 'user', content: '连接测试' }];
    if (profile.mode !== 'direct') {
      const relay = await relayStatus();
      if (relay.ok && relay.configured) return { ok: true, route: 'relay', model: relay.model || profile.model, message: '服务端中转已连接，模型服务可用' };
      if (profile.mode === 'relay') return { ok: false, route: 'relay', message: relay.ok ? '服务已连接，但服务端尚未配置模型' : '无法连接服务端中转' };
    }
    if (!canUseDirect(profile)) return { ok: false, route: 'direct', message: '请补充公网 base URL、模型名称和 API Key' };
    try {
      await directRequest(profile, probe, { timeout: 20000, maxTokens: 20, temperature: 0 });
      return { ok: true, route: 'direct', model: profile.model, message: '浏览器直连测试通过' };
    } catch (e) { return { ok: false, route: 'direct', model: profile.model, message: String((e && e.message) || '浏览器直连失败') }; }
  }

  async function listModels(input) {
    const profile = profileWithSecret(input || {});
    if (profile.protocol === 'anthropic-messages') return { ok: false, models: [], message: 'Anthropic Messages 不提供通用模型列表，请手动填写模型 ID' };
    if (!canUseDirect(profile)) return { ok: false, models: [], message: '请先填写可用的 base URL、模型和 Key' };
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 12000);
    try {
      const base = stripEndpoint(profile.baseUrl || profile.endpoint);
      const res = await fetch(base + '/models', { headers: authHeaders(profile), signal: ctl.signal });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data.error && data.error.message) || ('模型列表返回 HTTP ' + res.status));
      const raw = Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : (Array.isArray(data.models) ? data.models : []));
      return { ok: true, models: raw.map(item => ({ id: String(item.id || item.name || ''), name: String(item.name || item.id || '') })).filter(item => item.id).slice(0, 200), message: '模型列表已更新' };
    } catch (e) { return { ok: false, models: [], message: e && e.name === 'AbortError' ? '读取模型列表超时' : String((e && e.message) || '读取模型列表失败') }; }
    finally { clearTimeout(timer); }
  }

  /* ---------- 结构化输出解析 ---------- */
  function extractJson(text) {
    if (!text) return null;
    let t = String(text).trim();
    t = t.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
    const first = t.search(/[[{]/);
    if (first < 0) return null;
    t = t.slice(first);
    const stack = [];
    for (let i = 0; i < t.length; i++) {
      const ch = t[i];
      if (ch === '"') {
        i++;
        while (i < t.length) {
          if (t[i] === '\\') i += 2;
          else if (t[i] === '"') break;
          else i++;
        }
      } else if (ch === '[' || ch === '{') stack.push(ch);
      else if (ch === ']' || ch === '}') {
        const open = stack.pop();
        const ok = (open === '[' && ch === ']') || (open === '{' && ch === '}');
        if (!ok) return null;
        if (!stack.length) {
          try { return JSON.parse(t.slice(0, i + 1)); } catch (e) { return null; }
        }
      }
    }
    return null;
  }

  /* ---------- 结构化输出调用：统一 system 提示、解析、类型校验与错误 ---------- */
  async function askJSON(prompt, opts) {
    opts = opts || {};
    const raw = await chat([
      { role: 'system', content: opts.system || '你只输出严格合法的 JSON，不输出任何多余文字。' },
      { role: 'user', content: prompt }
    ], {
      temperature: opts.temperature != null ? opts.temperature : 0.4,
      maxTokens: opts.maxTokens || 1600,
      timeout: opts.timeout
    });
    const parsed = extractJson(raw);
    if (opts.expect === 'array') {
      if (!Array.isArray(parsed) || !parsed.length) throw new Error('模型返回格式无法解析，请重试');
      return parsed;
    }
    if (opts.expect === 'object') {
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('模型返回格式无法解析，请重试');
      return parsed;
    }
    return parsed;
  }

  /* ---------- 题型 / 难度规范化 ---------- */
  function normType(t) {
    if (/判断|对错|是非/.test(String(t))) return '判断题';
    if (/多选/.test(String(t))) return '多选题';
    if (/选择/.test(String(t))) return '选择题';
    if (/填空/.test(String(t))) return '填空题';
    if (/阅读/.test(String(t))) return '阅读题';
    return '解答题';
  }
  function normDiff(d) {
    d = String(d || '中');
    if (d === '易' || d === '难') return d;
    return '中';
  }

  /* ---------- 知识点讲解：由“知识点回顾”提炼并外延 ---------- */
  function deriveKp(explain, type) {
    const first = String(explain || '').split('\n')[0].replace(/^知识点回顾[：:]\s*/, '');
    const ext = (type === '选择题' || type === '多选题')
      ? '外延：掌握概念辨析后，可迁移到同类选项判断题与综合运算。'
      : type === '判断题'
        ? '外延：判断类考点常考概念边界与特殊情形（如 0、负数、绝对值），复习时多找反例。'
        : type === '填空题'
          ? '外延：填空常考算理与符号规则，建议把错题归入“符号”“运算顺序”“绝对值”等类别做专项训练。'
          : '外延：解答题重在“步骤完整 + 过程规范”，每一步写明依据；可换数值自练同型变式。';
    return '知识点讲解：' + first + '。' + ext;
  }

  /* ---------- 年级与难度分档（用于提示词与难度锚点） ---------- */
  const GRADE_BANDS = [
    { key: 'lo', min: 1, max: 2, label: '小学低年级', focus: '20 以内加减法、表内乘除法、认识图形与位置' },
    { key: 'mid', min: 3, max: 4, label: '小学中年级', focus: '万以内数与多位数乘除、分数初步、周长与面积、两步应用' },
    { key: 'hi', min: 5, max: 6, label: '小学高年级', focus: '小数/分数/百分数、比与比例、圆、简易方程、复杂应用' },
    { key: 'g7', min: 7, max: 7, label: '七年级', focus: '有理数、整式、一元一次方程、几何图形初步' },
    { key: 'g8', min: 8, max: 8, label: '八年级', focus: '三角形与全等、轴对称、一次函数、勾股定理、整式乘法' },
    { key: 'g9', min: 9, max: 9, label: '九年级', focus: '一元二次方程、二次函数、圆、相似、锐角三角函数、压轴综合' }
  ];
  function gradeBand(grade) {
    grade = Number(grade) || 7;
    return GRADE_BANDS.find(x => grade >= x.min && grade <= x.max) || GRADE_BANDS[3];
  }
  /* 难度锚点按学科分档：切换学科 / 年级时显示对应学科的考查重点 */
  const SUBJECT_GRADE_FOCUS = {
    math: GRADE_BANDS.map(b => ({ key: b.key, min: b.min, max: b.max, label: b.label, focus: b.focus })),
    chinese: [
      { key: 'lo', min: 1, max: 2, label: '小学低年级', focus: '识字写字、拼音拼读、词语积累、朗读与看图说话' },
      { key: 'mid', min: 3, max: 4, label: '小学中年级', focus: '段落理解与概括、词句含义、基础写作、积累运用' },
      { key: 'hi', min: 5, max: 6, label: '小学高年级', focus: '篇章阅读与表达效果、说明文/议论文初步、作文结构与素材、古诗文积累' },
      { key: 'g7', min: 7, max: 7, label: '七年级', focus: '记叙文阅读、文言文启蒙、记事写人写作、古诗鉴赏' },
      { key: 'g8', min: 8, max: 8, label: '八年级', focus: '说明文/散文阅读、文言文进阶、演讲稿与游记写作' },
      { key: 'g9', min: 9, max: 9, label: '九年级', focus: '议论文与小说阅读、中考古诗文、材料作文与综合写作' }
    ],
    english: [
      { key: 'lo', min: 1, max: 2, label: '小学低年级', focus: '字母与自然拼读、简单问候与词汇、听音辨词' },
      { key: 'mid', min: 3, max: 4, label: '小学中年级', focus: '核心词汇与句型、情景对话、简单听力理解' },
      { key: 'hi', min: 5, max: 6, label: '小学高年级', focus: '基础时态（一般现在/过去/将来）、阅读理解入门、小作文' },
      { key: 'g7', min: 7, max: 7, label: '七年级', focus: '一般现在时/现在进行时、there be、情景交际、基础阅读' },
      { key: 'g8', min: 8, max: 8, label: '八年级', focus: '比较级、过去进行时、现在完成时入门、阅读与写作' },
      { key: 'g9', min: 9, max: 9, label: '九年级', focus: '宾语从句、定语从句、被动语态、中考题型（完形/阅读/写作）' }
    ]
  };
  function gradeBandFocus(subject, grade) {
    const list = SUBJECT_GRADE_FOCUS[subject] || SUBJECT_GRADE_FOCUS.math;
    grade = Number(grade) || 7;
    return list.find(x => grade >= x.min && grade <= x.max) || list[3];
  }
  /* 各学科“难题底线”示例（注入提示词，防止语数英互相串难度口径） */
  const SUBJECT_HARD_LINE = {
    math: '九年级=二次函数与几何综合（面积最值、动点、对称转化、分类讨论）或圆+相似/三角函数综合；八年级=折叠+勾股+列方程、一次函数与面积/动点分类；七年级=数轴动点、含参方程、绝对值分类；小学高年级=工程问题、分数/百分数与圆柱体积综合；小学中年级=归一/等量代换、周长面积逆向；小学低年级=排队/间隔/移多补少等两步应用',
    chinese: '九年级=材料作文/议论文综合（观点+论据+结构）或小说/散文深度阅读（手法、主旨、结构作用）；八年级=说明文/散文阅读综合与游记写作；七年级=记叙文阅读与文言文启蒙综合；小学高年级=篇章阅读+写作片段；小学中年级=段落概括+基础作文；小学低年级=词句理解+看图写话',
    english: '九年级=语篇推理/长难句理解+话题写作；八年级=时态综合+段落阅读与写作；七年级=情景交际+基础阅读；小学高年级=时态运用+小作文；小学中年级=情景对话+简单阅读；小学低年级=听音辨词+简单问答'
  };
  const DIFF_ANCHOR = {
    '易': '基础送分题：直接套用单一概念/公式，1—2 步可解，得分率 >0.8；',
    '中': '中档题：2—4 步综合或常见变式（如去分母、折叠+勾股、二次函数综合），需算理清晰，得分率 0.5—0.8；',
    '难': '压轴题：多知识点综合、分类讨论、动点/最值、几何与函数综合（九年级对标中考压轴，得分率 <0.35）。'
  };

  /* ---------- 受众约束（注入所有面向用户的生成工作流） ---------- */
  const AUDIENCE_CONSTRAINT =
    '受众约束（最重要，必须遵守）：使用本系统的是偏远落后地区义务教育阶段的学生、教师和家长，' +
    '语言必须平实、通俗、具体，禁止只甩专业术语；若必须使用专业术语（如“最近发展区”“迁移”“元认知”），' +
    '必须紧跟一句大白话解释（例如“孩子跳一跳能够得着的地方”）。' +
    '建议必须具体到每天/每次怎么做（如“每天 10 分钟口算、每两天做 1 道变式题”），不能只给方向不给做法；' +
    '要像一位耐心、说人话的乡村教师那样讲解：先讲清概念，再用生活里的例子说明，最后给出可执行的做法。';

  /* ---------- 提示词收尾：统一注入受众约束与教学语料（各工作流复用） ---------- */
  function finalizePrompt(body, kw) {
    let out = String(body || '');
    out += '\n' + AUDIENCE_CONSTRAINT;
    const corpus = corpusPrompt({ kw: kw });
    if (corpus) out += '\n\n' + corpus;
    return out;
  }

  /* ---------- 数学分档题库（1-9 年级 × 易/中/难，每档多条按 seed 轮换，难题为真压轴） ---------- */
  function resolveFigure(fig) {
    if (!fig || !window.MathPlot) return null;
    if (typeof fig === 'string') return window.MathPlot.PRESETS[fig] || null;
    if (typeof fig === 'object' && fig.type) {
      const SUPPORTED = { numberline: 1, axis: 1, triangle: 1, circle: 1, rect: 1, cylinder: 1, pie: 1, bar: 1 };
      if (!SUPPORTED[fig.type]) return null;
      const clean = {};
      ['type', 'min', 'max', 'unit', 'points', 'curve', 'labels', 'sideLabels', 'right', 'fill',
       'r', 'diameter', 'chord', 'radius', 'w', 'h', 'fold', 'foldLabel', 'data'].forEach(k => {
        if (fig[k] !== undefined) clean[k] = fig[k];
      });
      return clean;
    }
    return null;
  }

  function guessMathFigure(stem, diff) {
    const s = String(stem || '');
    if (/抛物线|二次函数/.test(s)) return diff === '难' ? 'parabola_press' : 'parabola_xx';
    if (/一次函数/.test(s)) return 'line_xy';
    if (/圆柱/.test(s)) return 'cylinder';
    if (/折叠/.test(s)) return 'rect_fold';
    if (/垂径|弦 CD|直径 AB/.test(s)) return 'circle_8';
    if (/圆/.test(s)) return 'circle_r3';
    if (/三角形|勾股/.test(s)) return 'rt_6_8';
    if (/数轴/.test(s)) return 'numline2';
    if (/条形|柱状|统计/.test(s)) return 'bar_week';
    if (/扇形|饼图/.test(s)) return 'pie_math';
    if (/矩形|长方形/.test(s)) return 'rect_12_8';
    if (/坐标系|坐标/.test(s)) return 'line_xy';
    return null;
  }

  /* ---------- 按题干参数现生成图形（函数图像 / 几何 / 数轴 / 统计），无参数时关键词兜底 ---------- */
  function coeffOf(t) {
    let s = String(t == null ? '' : t).replace(/\s+/g, '');
    if (!s) return 1;
    if (s === '+') return 1;
    if (s === '-') return -1;
    const n = Number(s);
    return Number.isFinite(n) ? n : 1;
  }
  function fmtNum(n) {
    n = Number(n);
    if (!Number.isFinite(n)) return '';
    return Math.abs(n - Math.round(n)) < 1e-6 ? String(Math.round(n)) : String(Math.round(n * 100) / 100);
  }

  function figureFromStem(stem, diff) {
    if (!window.MathPlot) return null;
    const s = String(stem || '');
    let m;
    /* 二次函数：y = ax² + bx + c → 生成该函数真实图像（顶点/零点/截距） */
    m = s.match(/y\s*=\s*([+-]?\s*\d*)\s*x²\s*([+-]?\s*\d*)\s*x\s*([+-]?\s*\d+)/);
    if (m) {
      const a = coeffOf(m[1]), b = coeffOf(m[2]), c = coeffOf(m[3]);
      const xv = -b / (2 * a), yv = a * xv * xv + b * xv + c;
      const pts = [{ x: xv, y: yv, label: '顶点(' + fmtNum(xv) + ',' + fmtNum(yv) + ')' }];
      const d = b * b - 4 * a * c;
      if (d >= 0) {
        const x1 = (-b - Math.sqrt(d)) / (2 * a), x2 = (-b + Math.sqrt(d)) / (2 * a);
        if (Math.abs(x1) <= 8 && Math.abs(x2) <= 8) {
          pts.push({ x: x1, y: 0, label: 'A(' + fmtNum(x1) + ',0)' });
          pts.push({ x: x2, y: 0, label: 'B(' + fmtNum(x2) + ',0)' });
        }
      }
      pts.push({ x: 0, y: c, label: 'C(0,' + fmtNum(c) + ')' });
      const label = (s.match(/y\s*=\s*[^，。；与]+/) || [''])[0].replace(/\s+/g, '');
      return { type: 'axis', points: pts.slice(0, 5), curve: { kind: 'parabola', a: a, b: b, c: c, label: label } };
    }
    /* 一次函数：y = kx + b → 生成直线与轴交点 */
    m = s.match(/y\s*=\s*([+-]?\s*\d*)\s*x\s*([+-]?\s*\d+)/);
    if (m) {
      const k = coeffOf(m[1]), b = coeffOf(m[2]);
      const pts = [];
      if (k !== 0 && Math.abs(-b / k) <= 8) pts.push({ x: -b / k, y: 0, label: '(' + fmtNum(-b / k) + ',0)' });
      pts.push({ x: 0, y: b, label: '(0,' + fmtNum(b) + ')' });
      const label = (s.match(/y\s*=\s*[^，。；与]+/) || [''])[0].replace(/\s+/g, '');
      return { type: 'axis', points: pts, curve: { kind: 'line', k: k, b2: b, label: label } };
    }
    /* 圆柱：按半径/高生成 */
    m = s.match(/半径\s*(?:为|是)?\s*(\d+)/);
    const hM = s.match(/高\s*(?:为|是)?\s*(\d+)/);
    if (m && /圆柱/.test(s)) {
      const r = Number(m[1]) || 3, h = hM ? Number(hM[1]) : 10;
      return { type: 'cylinder', r: Math.min(92, 34 + r * 8), h: Math.min(190, 90 + h * 8), label: 'r=' + r + ', h=' + h };
    }
    /* 直角三角形：按直角边生成 */
    const legs = s.match(/直角边\s*(?:为|是)?\s*(\d+)[、,，和]?\s*(\d+)?/);
    if (legs && legs[1] && legs[2]) {
      const a = Number(legs[1]), b = Number(legs[2]);
      const c = Math.round(Math.sqrt(a * a + b * b) * 100) / 100;
      return { type: 'triangle', points: [0, 0, a, 0, 0, b], labels: ['A', 'B', 'C'], right: true, sideLabels: [{ from: 0, to: 1, text: String(a) }, { from: 0, to: 2, text: String(b) }, { from: 1, to: 2, text: fmtNum(c) }] };
    }
    /* 长方形/矩形：按长宽生成 */
    const lM = s.match(/长\s*(?:方形|方形为|方形是|为|是)?\s*(\d+)/);
    const wM = s.match(/宽\s*(?:为|是)?\s*(\d+)/);
    if (lM && wM && /(矩形|长方形|面积|周长)/.test(s)) {
      const L = Number(lM[1]) || 12, W = Number(wM[1]) || 8;
      return { type: 'rect', w: Math.min(280, 40 + L * 16), h: Math.min(180, 40 + W * 16), labels: ['A', 'B', 'C', 'D'], sideLabels: [{ from: 0, to: 1, text: String(L) }, { from: 1, to: 2, text: String(W) }] };
    }
    /* 数轴：按出现的点生成 */
    if (/数轴/.test(s)) {
      const nums = (s.match(/[-−]?\d+/g) || []).map(x => Number(String(x).replace('−', '-'))).filter(x => Number.isFinite(x) && Math.abs(x) <= 12);
      const pts = nums.slice(0, 4).map(n => ({ at: n, label: String(n) }));
      const lo = nums.length ? Math.min.apply(null, nums) - 1 : -5;
      const hi = nums.length ? Math.max.apply(null, nums) + 1 : 5;
      return { type: 'numberline', min: lo, max: hi, points: pts };
    }
    /* 圆：按半径生成 */
    if (/圆|⊙/.test(s)) {
      const r = m ? Number(m[1]) : 3;
      return { type: 'circle', r: 110, radius: { a: 1, b: 0, label: 'r=' + r } };
    }
    /* 关键词兜底（预设） */
    const name = guessMathFigure(s, diff);
    return name ? window.MathPlot.PRESETS[name] : null;
  }

  /* ---------- 按题型/难度分布构建题位规格 ---------- */
  function buildSpecs(type, diff, count, opts) {
    type = type || '全部题型';
    diff = diff || '全部难度';
    opts = opts || {};
    const base = ['选择题', '判断题', '填空题', '多选题', '解答题'];
    const types = type === '全部题型'
      ? (opts.includeReading ? base.concat(['阅读题']) : base)
      : [normType(type)];
    const diffs = diff === '全部难度' ? ['易', '中', '中', '难'] : [normDiff(diff)];
    const specs = [];
    for (let i = 0; i < count; i++) {
      specs.push({ type: types[i % types.length], diff: diffs[i % diffs.length] });
    }
    return specs;
  }

  function buildDiffArray(mix, count) {
    mix = mix || {};
    const arr = [];
    const easy = Math.round(count * (mix.易 || 0));
    const mid = Math.round(count * (mix.中 || 0));
    for (let i = 0; i < count; i++) arr.push(i < easy ? '易' : i < easy + mid ? '中' : '难');
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  function validateQuestion(raw, spec) {
    const errors = [];
    if (!raw || !String(raw.stem || '').trim()) errors.push('题干为空');
    const type = spec ? spec.type : normType(raw && raw.type);
    const answer = String(raw && raw.answer != null ? raw.answer : '').trim();
    if (!answer || /^略[。．]?$/.test(answer)) errors.push('答案为空或为占位符');
    if (!String(raw && raw.explain || '').trim() || /模型未返回|待补充|占位/.test(String(raw.explain || ''))) errors.push('缺少可核查详解');
    if ((type === '选择题' || type === '多选题')) {
      const opts = Array.isArray(raw.options) ? raw.options.map(x => String(x).trim()) : [];
      if (opts.length < 4 || opts.length > 5 || opts.some(x => !x || /^([A-E])[.．、：:]?\s*$/.test(x))) errors.push('选项不完整');
      const letters = opts.map((x, i) => String.fromCharCode(65 + i));
      const answers = answer.toUpperCase().replace(/[^A-E]/g, '').split('');
      if (!answers.length || answers.some(a => !letters.includes(a)) || new Set(answers).size !== answers.length) errors.push('答案与选项不一致');
      if (type === '选择题' && answers.length !== 1) errors.push('单选题答案不唯一');
    }
    if (type === '判断题' && !/^(正确|错误|对|错)$/i.test(answer)) errors.push('判断题答案格式不正确');
    if (type === '阅读题') {
      if (String(raw.passage || raw.material || '').trim().length < 40) errors.push('阅读材料过短或缺失');
      if (!String(raw.sourceNote || raw.source || '').trim()) errors.push('阅读材料缺少可核查来源');
      if (!String(raw.kp || '').trim()) errors.push('阅读题缺少知识点');
    }
    return { ok: !errors.length, errors: errors };
  }

  function normalizeQuestion(raw, spec, idx, opts) {
    if (!raw || !raw.stem || String(raw.stem).length < 3) return null;
    const type = spec ? spec.type : normType(raw.type);
    const diff = spec ? spec.diff : normDiff(raw.diff);
    const answer = raw.answer == null ? '' : String(raw.answer).trim();
    const check = validateQuestion(raw, spec);
    if (!check.ok) return null;
    /* 图形：仅数学题使用；优先用 AI 返回的 figure，缺失时按题干参数现生成 */
    let figure = null;
    if (!opts || opts.subject === 'math' || opts.subject === 'default') {
      figure = resolveFigure(raw.figure);
      if (!figure) figure = figureFromStem(raw.stem, diff);
    }
    const accepts = (raw.accept == null ? '' : String(raw.accept))
      .split(/[、,，;；]/)
      .map(s => s.trim())
      .filter(Boolean)
      .filter(a => a !== answer);
    /* 阅读题必须带材料：模型漏传时自动从公有领域阅读库补齐，避免“只有题干没有文章” */
    let passage = type === '阅读题' ? String(raw.passage || raw.material || '') : '';
    let sourceNote = type === '阅读题' ? String(raw.sourceNote || raw.source || '') : '';
    if (type === '阅读题' && !passage.trim()) {
      const rd = window.CORPUS && window.CORPUS.pickReading
        ? window.CORPUS.pickReading(opts && opts.subject === 'english' ? 'en' : 'zh', { diff: diff, seed: idx })
        : null;
      if (rd) {
        passage = rd.passage;
        sourceNote = sourceNote || '本文改编自《' + rd.title + '》（' + rd.source + '，' + rd.license + '），有删改。';
      }
    }
    /* 阅读题结构：长文本 + 编号小题（1. 2. 3.）——缺失小题时自动补标准模板 */
    let stem = String(raw.stem || '');
    if (type === '阅读题' && !/\d+[\.．、]\s*\S/.test(stem)) {
      stem = (stem.replace(/[。．]?\s*$/, '')) +
        '\n1. 请用简洁的语言概括材料的主要内容。' +
        '\n2. 结合上下文，赏析材料中画线句或关键语句的表达效果。' +
        '\n3. 结合材料内容与自己的生活体验，谈谈你获得的启示。';
    }
    const genre = type === '阅读题' && window.CORPUS && window.CORPUS.classifyReading
      ? window.CORPUS.classifyReading(passage, opts && opts.subject === 'english' ? 'en' : 'zh').genre
      : '';
    return {
      id: 0, no: idx + 1,
      type: type,
      diff: diff,
      diffCls: diff === '难' ? 'red' : diff === '中' ? 'gold' : 'green',
      source: 'AI 生成，请复核',
      stem: stem,
      options: (type === '选择题' || type === '多选题')
        ? (Array.isArray(raw.options) && raw.options.length ? raw.options.map(String) : ['A. ', 'B. ', 'C. ', 'D. '])
        : [],
      figure: figure,
      passage: passage,
      sourceNote: sourceNote,
      genre: genre,
      kp: raw.kp ? String(raw.kp).trim() : deriveKp(raw.explain || '', type),
      answer: answer,
      accepts: accepts,
      explain: raw.explain ? String(raw.explain).trim() : '（模型未返回详解，可在编辑中补充）',
      process: raw.process ? String(raw.process).trim() : '',
      points: type === '选择题' ? 3 : type === '判断题' ? 2 : type === '填空题' ? 4 : type === '多选题' ? 4 : type === '阅读题' ? 10 : 8,
      checked: false,
      fromAI: true
    };
  }

  function basicFallback(spec, idx, subject) {
    if (subject === 'zh') {
      const rd = window.CORPUS && window.CORPUS.pickReading ? window.CORPUS.pickReading('zh', { diff: spec.diff, seed: idx }) : null;
      if (!rd) return null;
      const sourceNote = '选自《' + rd.title + '》（' + rd.source + '，' + rd.license + '），本地审核语料 v' + (window.CORPUS.version || '1.0') + '。';
      const rawZh = spec.type === '阅读题'
        ? { type: spec.type, diff: spec.diff, passage: rd.passage, sourceNote: sourceNote, stem: '1. 请概括材料的主要内容。\n2. 结合材料说明作者表达的主要情感或观点。\n3. 摘录一个关键词句，并说明它在文中的作用。', answer: '1. 围绕材料主要事件与中心内容概括。\n2. 依据原文关键词句归纳，不脱离材料。\n3. 摘录准确，并从内容或结构作用说明。', explain: '①知识点回顾：阅读答案必须回到原文。\n②思考过程：先找人物、事件与关键词句。\n③推理过程：用原文证据支持概括。\n④易错点：不要写与材料无关的空泛感想。\n⑤举一反三：换一个段落继续做证据定位。', process: '通读材料—圈画关键词—定位证据—组织答案—回读核对', kp: '内容概括、情感主旨与关键词句作用；所有判断以材料证据为准。' }
        : { type: '判断题', diff: spec.diff, stem: '阅读材料时，回答主旨题可以完全不引用或依据原文。', options: [], answer: '错误', explain: '①知识点回顾：阅读理解重证据。\n②思考过程：主旨需要从人物、事件和关键词句归纳。\n③推理过程：没有原文依据的结论不可核查。\n④易错点：把个人感想当作材料主旨。\n⑤举一反三：每个结论至少标出一处文本证据。', process: '判断说法—回到材料—寻找证据—得出结论', kp: '文本证据与主旨概括。', sourceNote: sourceNote };
      const qzh = normalizeQuestion(rawZh, Object.assign({}, spec, { type: rawZh.type }), idx, { subject: 'zh' });
      if (qzh) { qzh.source = '本地题目，请教师复核'; qzh.fromAI = false; qzh.sourceStatus = '本地已审核'; }
      return qzh;
    }
    if (subject !== 'math') return null;
    const n = idx + 2;
    const answer = String(n + 3);
    const raw = { type: spec.type, diff: spec.diff, stem: '计算：' + n + ' + 3 =（  ）', options: ['A. ' + (n + 1), 'B. ' + (n + 2), 'C. ' + answer, 'D. ' + (n + 4)], answer: 'C', explain: '①知识点回顾：整数加法。\n②思考过程：把两个数相加。\n③计算过程：' + n + ' + 3 = ' + answer + '。\n④易错点：看清加号，不要误写成减法。\n⑤举一反三：尝试计算 ' + n + ' + 4。', process: n + ' + 3 = ' + answer, kp: '整数加法：理解加法意义并按位计算。' };
    if (spec.type === '判断题') { raw.stem = n + ' + 3 = ' + answer + '。'; raw.options = []; raw.answer = '正确'; }
    if (spec.type !== '选择题' && spec.type !== '判断题') { raw.options = []; raw.answer = answer; }
    const q = normalizeQuestion(raw, spec, idx, { subject: subject });
    if (q) { q.source = '本地基础题，请教师复核'; q.fromAI = false; }
    return q;
  }

  /* ---------- 内置语料库检索注入（模拟轻量微调：学习优秀教材/教育家的语气与理念） ---------- */
  function corpusPrompt(params) {
    if (!window.CORPUS || !window.CORPUS.corpusBlock) return '';
    try { return window.CORPUS.corpusBlock(params); } catch (e) { return ''; }
  }

  /* ---------- 分块生成（每块 2-3 题，避免一次信息过多；自动补全缺漏） ---------- */
  async function enforceDifficulty(batch, chunk, params) {
    const lines = batch.map((q, i) =>
      '第 ' + (i + 1) + ' 题（目标难度：' + chunk[i].diff + '）：题型=' + q.type + ' 题干=' + q.stem + ' 答案=' + q.answer
    ).join('\n');
    const band = gradeBandFocus(params.subjectKey, params.grade);
    const hardLine = SUBJECT_HARD_LINE[params.subjectKey] || SUBJECT_HARD_LINE.math;
    const prompt =
      '你是严格的命题质检员。以下题目刚由 AI 命制，请逐题核对是否真正达到目标难度，未达标的题必须改写成真正达到该难度的题（题型、知识点范围不得改变），达标的题原样保留。\n' +
      '难度标准：易=基础送分（1—2 步直接套用，得分率>0.8）；中=中档综合（2—4 步、常见变式，得分率 0.5—0.8）；难=压轴（多知识点综合、分类讨论、动点/最值、几何与函数综合，得分率<0.35）。\n' +
      '本卷学段：' + (params.gradeText || band.label) + '；学科：' + (params.subjectText || '数学') + '。\n' +
      '各年级“难”题底线示例（按本卷学科）：' + hardLine + '。\n' +
      '题目清单：\n' + lines + '\n\n' +
      '只输出一个 JSON 数组，与上面一一对应，每题格式：{"type":"...","diff":"...","stem":"...","options":[...],"answer":"...","explain":"五段式详解","process":"完整过程","kp":"知识点讲解+外延","figure":{...}}。不得输出任何其他文字。';
    let parsed = null;
    try {
      parsed = await askJSON(prompt, { temperature: 0.25, maxTokens: 2600, expect: 'array' });
    } catch (e) { return null; }
    const enforced = chunk.map((spec, i) => normalizeQuestion(parsed[i], spec, i, { subject: params.subjectKey })).filter(Boolean);
    return enforced.length === batch.length ? enforced : null;
  }

  /* 题干归一化：用于批量去重（阅读题按材料+题干，其余按题干主体） */
  function stemKey(q) {
    const text = String(q && (q.passage ? q.passage : '') + (q.stem || '') || '');
    return text.replace(/\s+/g, '').replace(/[（(][^）)]*[）)]/g, '').replace(/[，。、：:；;？！?！.．]/g, '').slice(0, 60);
  }
  function uniqueQuestion(q, used) {
    const key = stemKey(q);
    if (!key || used.has(key)) return null;
    used.add(key);
    return q;
  }

  async function generateBatch(params) {
    const specs = params.specs || [];
    if (!specs.length) return [];
    const kps = (params.knowledgePoints || []).slice(0, 6).join('、') || '本单元核心知识';
    const CHUNK = 3;
    const results = [];
    const used = new Set(); // 整卷去重：题干归一化后不得重复
    for (let start = 0; start < specs.length; start += CHUNK) {
      const chunk = specs.slice(start, start + CHUNK);
      const specLines = chunk.map((s, j) =>
        '第 ' + (start + j + 1) + ' 题：题型=' + s.type + '，难度=' + s.diff
      ).join('\n');
      const corpus = corpusPrompt({ kw: kps + ' ' + (params.subjectText || '') + ' ' + (params.gradeText || '') });
      const needReading = chunk.some(s => s.type === '阅读题');
      const band = gradeBandFocus(params.subjectKey, params.grade);
      const hardLine = SUBJECT_HARD_LINE[params.subjectKey] || SUBJECT_HARD_LINE.math;
      const diffAnchors = Array.from(new Set(chunk.map(s => s.diff))).map(d => d + ' = ' + DIFF_ANCHOR[d]).join('；');
      const readingBlock = needReading
        ? (params.readingText
            ? '本题需使用以下阅读材料（公有领域 / 开源文本，可节选或改编）：\n' + params.readingText + '\n'
            : '本题无指定材料：请从知识范围中自行选择适合的公有领域 / 开源文本（并注明来源），自拟 2-3 个小题。\n')
        : '';
      const prompt =
        '你是一名资深' + (params.subjectText || '数学') + '命题教师，正在命制一份试卷。请严格按照每题指定的【题型】与【难度】出题，难度不得偏离。\n' +
        '学段年级：' + (params.gradeText || '七年级') + '\n' +
        '学科：' + (params.subjectText || '数学') + '\n' +
        '教材版本：' + (params.versionText || '人教版') + '\n' +
        '知识点范围：' + kps + '\n\n' +
        '年级与难度基准（对标真实考情）：本卷为' + band.label + '，命题范围须与《' + band.focus + '》一致；难度区分度：' + (diffAnchors || '易/中/难按考纲') + '\n' +
        '难度底线：标“难”的题必须是真正的压轴题（按本卷学科：' + hardLine + '）。标“易”的题也要是正常的基础题，不是口算题。标“中”的题要有 2—4 步综合或常见变式。\n' +
        readingBlock +
        '本次命制 ' + chunk.length + ' 道题，每题要求如下：\n' + specLines + '\n\n' +
        '输出要求：\n' +
        '1. 只输出一个 JSON 数组，恰好 ' + chunk.length + ' 项，与上面每题一一对应，不要输出任何其他文字。\n' +
        '2. 每题格式：{"type":"选择题","diff":"易","stem":"题干","options":["A. xxx","B. xxx","C. xxx","D. xxx"],"answer":"C","explain":"详解","process":"计算过程与思考过程"}\n' +
        '3. 题型约定：选择题/多选题必须给出 4-5 个选项（多选题答案给出全部正确选项字母，如 "ABD"）；判断题 options 为空数组，答案只能是 "正确" 或 "错误"；填空题/解答题 options 为空数组。\n' +
        '3.1 阅读题必须是「一段长文本 + 下面跟几个编号小题」的结构：passage 放完整长文本（至少 80 字，诗歌/古文须保留原文并注明体裁），stem 只放编号小题（1. 2. 3. …，一行一个小题），严禁把题目塞进 passage、也严禁只有题干没有材料；同时给出 sourceNote（来源与删改标注）、kp（知识点讲解）。小题样式参考中考/高考及模拟卷（语文：字词、内容理解、句子赏析、段落作用、主旨、开放性题；英语：细节理解、主旨大意、词义猜测、推理判断）。\n' +
        '4. type、diff 必须与对应要求完全一致。\n' +
        '5. explain 必须包含五部分（用\\n分隔）：①知识点回顾 ②思考过程 ③计算/推理过程 ④易错点 ⑤举一反三。\n' +
        '6. process 单独给出完整计算过程与每步思考：数学题必须写出逐步计算，如 "(-3)+(-5) = -(3+5) = -8"。\n' +
        '7. 所有题目必须给出参考答案，严禁出现“略”、空字符串或占位符；填空题如有等价答案可用 accept 字段补充（多个用顿号分隔），答案本身也必须给在 answer 字段。\n' +
        '8. 每题必须给出 kp 字段（知识点讲解）：先讲清本题知识点（概念/法则/方法），再给出至少一条外延（相关知识点、现实应用、变式方向或易混对比），不要只写答案。\n' +
        '9. 阅读题若对原文有节选或改编，passage 文末必须标注：本文改编自《X》（来源），有删改。\n' +
        '10. 参考答案必须正确，题目贴合 ' + kps + '。\n' +
        '10.1 本卷所有题目严禁重复：题干、考查点、答案不得与其他题目相同或高度相似（同一知识点也要换情境、换数据、换问法），如发现重复必须改写成新题。\n' +
        '11. 数学题若涉及图形（函数图像、几何图形、数轴、统计图等），必须给出 figure 字段：可直接写预设名' +
        '（parabola_press、parabola_xx、line_xy、circle_8、circle_r3、rt_6_8、rect_fold、rect_12_8、cylinder、numline2、bar_week、pie_math），' +
        '或写对象如 {"type":"axis","points":[{"x":1,"y":0,"label":"A"}],"curve":{"kind":"parabola","a":1,"b":-2,"c":3,"label":"y=x²-2x"}}；' +
        'figure 必须与题干描述完全一致（图形名称、关键点、函数式都要对得上），不涉及图形的题不要给 figure。\n' +
        '12. ' + AUDIENCE_CONSTRAINT + '\n' +
        (corpus ? '\n\n' + corpus : '');
      let batch = [];
      for (let attempt = 0; attempt < 2 && batch.length < chunk.length; attempt++) {
        let parsed = null;
        try {
          parsed = await askJSON(prompt, { temperature: 0.7, maxTokens: 2600, expect: 'array' });
        } catch (err) {
          break; // 单次生成不重复扣费；立即进入本地审核题库回退
        }
        batch = chunk.map((spec, j) => normalizeQuestion(parsed[j], spec, start + j, { subject: params.subjectKey })).filter(Boolean);
      }
      /* 难度质检改写：让模型自查每题是否达标，未达标改写（尽力而为，失败保留原题） */
      if (batch.length === chunk.length) {
        try {
          const enforced = await enforceDifficulty(batch, chunk, params);
          if (enforced && enforced.length === chunk.length) batch = enforced;
        } catch (e) { /* 质检失败不影响已生成题目 */ }
      }
      /* 去重：同一试卷内题干不得重复，重复项剔除 */
      const filtered = [];
      batch.forEach(q => { if (uniqueQuestion(q, used)) filtered.push(q); });
      batch = filtered;
      /* AI 不可用时只对数学基础题回退；回退题明确标记，仍需教师复核 */
      if (batch.length < chunk.length) {
        const existing = new Set(batch.map(stemKey));
        for (let j = 0; j < chunk.length && batch.length < chunk.length; j++) {
          const fb = basicFallback(chunk[j], start + j, params.subjectKey);
          if (fb && !existing.has(stemKey(fb))) { existing.add(stemKey(fb)); batch.push(fb); }
        }
        if (batch.length < chunk.length) throw new Error('AI 返回不完整，且暂无适用的本地基础题，请教师补题后再发布');
      }
      results.push.apply(results, batch);
      if (params.onProgress) {
        params.onProgress(
          Math.min(100, Math.round((start + chunk.length) / specs.length * 100)),
          '已生成 ' + results.length + ' / ' + specs.length + ' 题（按题位难度逐一校验）'
        );
      }
    }
    return results;
  }

  /* ---------- 自由组卷：按题量生成 ---------- */
  async function generateQuestions(params) {
    const count = Math.max(1, Math.min(20, params.count || 5));
    const specs = buildSpecs(params.type, params.diff, count, { includeReading: params.includeReading });
    return generateBatch(Object.assign({}, params, { specs: specs }));
  }

  /* ---------- 整卷模板：按 Section 生成（每 section 独立分块） ---------- */
  async function generateSection(params) {
    const type = normType(params.type);
    const count = Math.max(1, Math.min(30, params.count || 10));
    const diffs = buildDiffArray(params.mix || { 易: 0.4, 中: 0.4, 难: 0.2 }, count);
    const specs = [];
    for (let i = 0; i < count; i++) specs.push({ type: type, diff: diffs[i] });
    const qs = await generateBatch(Object.assign({}, params, { specs: specs }));
    return qs.map((q, i) => Object.assign(q, {
      points: Array.isArray(params.points) ? params.points[i] : params.points
    }));
  }

  /* ---------- Moodle GIFT 导出（格式规范公开，可安全实现；借鉴 GIFT 文本题库） ---------- */
  function giftEscape(s) {
    return String(s == null ? '' : s)
      .replace(/\\/g, '\\\\')
      .replace(/\{/g, '\\{')
      .replace(/\}/g, '\\}')
      .replace(/=/g, '\\=')
      .replace(/#/g, '\\#')
      .replace(/~/g, '\\~')
      .replace(/\n/g, ' ');
  }

  function giftOption(o) {
    const m = String(o || '').match(/^([A-E])[\.．、]\s*(.*)$/);
    return m ? { letter: m[1], text: m[2] } : { letter: '', text: String(o || '') };
  }

  function exportGift(questions) {
    const lines = [];
    lines.push('// 凤凰花·智学 生成 · Moodle GIFT 题库');
    lines.push('// 题型：选择题 {=C ~A ~B ~D} / 判断题 {TRUE} / 填空题 {=答1 =答2} / 多选题 {~%50%A ...} / 阅读题、简答题 {=关键词}');
    (questions || []).forEach((q, i) => {
      if (q.type === '资料') return;
      const title = '第' + (i + 1) + '题（' + (q.type || '题') + '）';
      const stem = q.type === '阅读题'
        ? giftEscape((q.passage ? q.passage + '\n\n' : '') + q.stem + (q.sourceNote ? '\n（' + q.sourceNote + '）' : ''))
        : giftEscape(q.stem);
      let body = '';
      if (q.type === '判断题') {
        body = /^(对|正确|true|t|√|yes|y)$/i.test(String(q.answer || '').trim()) ? '{TRUE}' : '{FALSE}';
      } else if (q.type === '多选题') {
        const letters = String(q.answer || '').split('').filter(c => /[A-E]/i.test(c)).map(c => c.toUpperCase());
        const parts = (q.options || []).map(giftOption).filter(o => o.letter).map(o =>
          (letters.indexOf(o.letter.toUpperCase()) >= 0 ? '~%50%' : '~') + o.letter
        );
        body = '{ ' + parts.join(' ') + ' }';
      } else if (q.type === '选择题') {
        const answer = String(q.answer || '').trim().replace(/^([A-E])[\.．、].*$/, '$1').toUpperCase();
        const parts = (q.options || []).map(giftOption).filter(o => o.letter).map(o =>
          (o.letter.toUpperCase() === answer ? '=' : '~') + o.letter
        );
        body = '{ ' + parts.join(' ') + ' }';
      } else if (q.type === '填空题') {
        const answers = [String(q.answer || '')].concat(q.accepts || []);
        body = '{ ' + answers.filter(a => String(a).trim()).map(a => '=' + giftEscape(a)).join(' ') + ' }';
      } else if (q.type === '阅读题') {
        body = '{= ' + giftEscape(String(q.answer || '').slice(0, 80)) + ' }';
      } else {
        body = '{= ' + giftEscape(q.answer || '') + ' }';
      }
      lines.push('::' + title + '::' + stem + '\n' + body);
    });
    return lines.join('\n\n');
  }

  /* ---------- 考试时间 / 建议时长公式（按体量与难度） ---------- */
  function estimatePaperTime(questions, opts) {
    opts = opts || {};
    const typeBase = { 选择题: 45, 判断题: 30, 填空题: 60, 多选题: 70, 阅读题: 420, 解答题: 420 };
    const diffMult = { 易: 0.8, 中: 1.0, 难: 1.3 };
    let sec = 120; // 卷面说明 / 作答习惯固定开销（约 2 分钟）
    let obj = 0, subj = 0, chars = 0;
    (questions || []).forEach(q => {
      if (q.type === '资料') return;
      const base = typeBase[q.type] || 60;
      sec += base * (diffMult[q.diff] || 1.0);
      if (q.type === '解答题' || q.type === '阅读题') subj++;
      else obj++;
      if (q.passage) chars += String(q.passage).length;
    });
    sec += subj * 60 + obj * 5 + chars * 0.2; // 主观题书写、客观题涂卡、阅读材料读时
    const rawMin = Math.ceil(sec / 60);
    const round5 = v => Math.max(5, Math.ceil(v / 5) * 5);
    const suggested = Math.min(180, round5(Math.ceil(rawMin * 1.05)));
    const preset = Number(opts.presetTime) || 0;
    const formulaExam = round5(Math.ceil(rawMin * 1.3));
    const exam = Math.min(240, Math.max(formulaExam, preset, suggested + 10));
    return { rawMin: rawMin, suggested: suggested, exam: exam, formulaExam: formulaExam, preset: preset };
  }

  /* ---------- 来源检索：本地审核语料优先，外部网络仅作可追溯补充 ---------- */
  function wikiBase(lang, project) {
    lang = lang === 'en' ? 'en' : 'zh';
    project = project === 'wikipedia' ? 'wikipedia' : 'wikisource';
    return 'https://' + lang + '.' + project + '.org/w/api.php';
  }

  /* 本地语料检索辅助（多处复用）：按语言取分类范围、封装检索、提取首个页面 */
  function corpusCatsFor(lang) {
    return lang === 'zh' ? ['ancient', 'modern', 'pedagogy'] : ['foreign', 'pedagogy'];
  }
  function retrieveLocal(kw, lang, max) {
    if (!window.CORPUS || !window.CORPUS.retrieve) return [];
    return window.CORPUS.retrieve(kw, { cats: corpusCatsFor(lang), max: max || 8 });
  }
  function firstPage(pages, pred) {
    const list = Object.keys(pages || {}).map(k => pages[k]);
    return pred ? (list.find(pred) || null) : (list[0] || null);
  }

  async function searchSources(kw, lang, project) {
    const local = retrieveLocal(kw, lang, 8);
    if (local.length) return local.map(s => ({ title: s.title, snippet: s.excerpt, size: String(s.excerpt || '').length, source: s.source, version: window.CORPUS.version || 'local' , access: '本地已审核' }));
    const url = wikiBase(lang, project) +
      '?action=query&format=json&origin=*&list=search&srlimit=8&srsearch=' + encodeURIComponent(String(kw || ''));
    const res = await fetch(url);
    if (!res.ok) throw new Error('检索接口返回 ' + res.status);
    const data = await res.json();
    const list = (data.query && data.query.search) ? data.query.search : [];
    return list
      .filter(s => !/消歧义|維基文庫|维基文库|MediaWiki|Special:|分类:|Template:|Help:|Wikipedia:|Wikisource:/.test(s.title || ''))
      .slice(0, 8)
      .map(s => ({
        title: s.title,
        snippet: String(s.snippet || '').replace(/<[^>]+>/g, ''),
        size: s.size || 0,
        source: lang + '.' + project + '.org', access: '网络检索，需教师复核'
      }));
  }

  function stripWikitext(w) {
    let s = String(w || '');
    s = s.replace(/\{\{[^}]*\}\}/g, ' ');
    s = s.replace(/\[\[[^\]|]*\|([^\]]*)\]\]/g, '$1').replace(/\[\[([^\]]*)\]\]/g, '$1');
    s = s.replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, ' ').replace(/<[^>]+>/g, ' ');
    s = s.replace(/^==+.*==+$/gm, '').replace(/^\s*\*+/gm, '').replace(/[|{}[\]!]/g, ' ');
    s = s.replace(/\n{3,}/g, '\n\n').trim();
    return s;
  }

  async function fetchWikiPage(title, lang, project) {
    const url = wikiBase(lang, project) +
      '?action=query&format=json&origin=*&prop=extracts&explaintext=1&exintro=1&titles=' + encodeURIComponent(String(title || ''));
    const res = await fetch(url);
    if (!res.ok) throw new Error('获取文本接口返回 ' + res.status);
    const data = await res.json();
    return firstPage(data.query && data.query.pages, p => p && p.extract);
  }

  async function fetchWikiWikitext(title, lang, project) {
    const url = wikiBase(lang, project) +
      '?action=query&format=json&origin=*&prop=revisions&rvprop=content&rvslots=main&titles=' + encodeURIComponent(String(title || ''));
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const page = firstPage(data.query && data.query.pages, p => p && p.revisions && p.revisions[0]);
    if (!page) return null;
    const slot = page.revisions[0].slots && page.revisions[0].slots.main;
    return { title: page.title, extract: stripWikitext(slot ? slot['*'] : '') };
  }

  async function fetchSourceRemote(title, lang, project) {
    const local = retrieveLocal(title, lang, 1);
    if (local.length) {
      const item = local[0];
      return { title: item.title, text: String(item.excerpt || '').slice(0, 1800), genre: '教材语料', lang: lang, source: item.source, version: window.CORPUS.version || 'local', access: '本地已审核' };
    }
    let page = await fetchWikiPage(title, lang, project);
    let text = page ? String(page.extract || '').trim() : '';
    if (text.length < 40) {
      const fallback = await fetchWikiWikitext(title, lang, project);
      if (fallback && fallback.extract) {
        page = fallback;
        text = String(fallback.extract).trim();
      }
    }
    if (!text || text.length < 40) throw new Error('该页面没有可用的正文（可能为目录/重定向页），建议改用内置语料库');
    if (lang === 'zh' && window.CORPUS && window.CORPUS.convertZh) {
      text = window.CORPUS.convertZh(text);
    }
    const suit = window.CORPUS && window.CORPUS.suitableReading
      ? window.CORPUS.suitableReading(text, lang)
      : { genre: '散文', ok: true };
    if (!suit.ok) throw new Error('该页面不适合作为阅读材料：' + suit.reason + '，建议改用内置语料库');
    return { title: (page && page.title) || title, text: text.slice(0, 1800), genre: suit.genre, lang: lang, source: lang + '.' + project + '.org', version: 'network', access: '网络成功，教师复核' };
  }

  async function fetchSource(title, lang, project) {
    try { return await fetchSourceRemote(title, lang, project); }
    catch (err) {
      const local = retrieveLocal(title, lang, 1);
      if (local.length) return { title: local[0].title, text: String(local[0].excerpt || '').slice(0, 1800), genre: '教材语料', lang: lang, source: local[0].source, version: window.CORPUS.version || 'local', access: '网络失败，回退本地已审核内容；教师复核' };
      throw new Error('检索失败，暂无本地已审核材料；请教师补充来源后再生成');
    }
  }

  /* ---------- 批改：生成评分 / 评语 / 错因 ---------- */
  async function gradeAnswer(params) {
    const answers = (params.answers || []).map(a => (a.no ? a.no + '. ' : '') + (a.title || '') + ' ' + (a.text || '').replace(/<[^>]+>/g, '')).join('\n');
    const prompt = finalizePrompt(
      '你是一名初中数学教师，正在人工复核 AI 批改结果。\n' +
      '任务：' + (params.task || '数学测试') + '，满分 ' + (params.total || 40) + ' 分。\n' +
      '学生答卷摘录：\n' + answers + '\n\n' +
      '请只输出一个 JSON 对象（不要输出任何其他文字）：\n' +
      '{"score": 数字, "comment": "不超过120字的评语", "reasons": [{"type":"good"或"bad", "text":"要点"}]}\n' +
      '其中 reasons 给出 2-4 条具体得分点与失分点，type 只能是 "good" 或 "bad"。',
      (params.task || '') + ' 批改 评语 反馈'
    );
    const parsed = await askJSON(prompt, { temperature: 0.4, maxTokens: 1200, expect: 'object' });
    if (parsed.score == null) throw new Error('模型返回格式无法解析，请重试');
    return {
      score: Number(parsed.score),
      total: params.total || 40,
      comment: String(parsed.comment || '').trim(),
      reasons: Array.isArray(parsed.reasons) ? parsed.reasons.map(r => ({
        type: r.type === 'bad' ? 'bad' : 'good',
        text: String(r.text || '')
      })).filter(r => r.text) : []
    };
  }

  /* ---------- 学生版答案详解（从知识点开始讲） ---------- */
  async function generateExplanations(params) {
    const answers = (params.answers || []).map(a =>
      (a.no ? a.no + '. ' : '') + (a.title || '') + '\n' + (a.text || '').replace(/<[^>]+>/g, '')
    ).join('\n');
    const prompt = finalizePrompt(
      '你是一名耐心的初中教师，正在为学生写短小、易读、可朗读的答案讲解。每一步只说一句话，先讲最关键的一点：\n' +
      '任务：' + (params.task || '数学测试') + '\n' +
      '答卷（含学生作答）：\n' + answers + '\n\n' +
      '输出要求：只输出一个 JSON 数组，每题一项，格式：\n' +
      '{"no": 题号, "kp": "本题知识点", "explain": "详解内容"}\n' +
      '详解内容按以下结构组织（用\\n换行，最多 5 段，每段不超过 35 字）：\n' +
      '1. 知识点回顾：先讲清楚本题用到的基础知识点与概念；\n' +
      '2. 解题思路：说明分析问题的切入角度；\n' +
      '3. 逐步解答：给出完整、清晰的步骤与最终答案；\n' +
      '4. 易错点：指出学生常见错误（可结合该生作答）；\n' +
      '5. 举一反三：给出 1 道同类变式建议。\n' +
      '不要输出任何其他文字或 Markdown。',
      (params.task || '') + ' 详解 讲解'
    );
    const parsed = await askJSON(prompt, { temperature: 0.4, maxTokens: 3200, expect: 'array' });
    return parsed.filter(x => x && x.no != null && x.explain).map(x => ({
      no: Number(x.no),
      kp: String(x.kp || ''),
      explain: String(x.explain).trim()
    }));
  }

  /* ---------- 下一阶段学习计划书 ---------- */
  async function generatePlan(params) {
    const wrongs = (params.wrongs || []).map(w => (w.q || w.stem) + '（' + (w.kp || '') + '）').join('；') || '无近期错题记录';
    const homework = (params.homework || []).slice(-8).map(h =>
      (h.date || '') + '《' + (h.title || h.task || '作业') + '》' + (h.score != null ? h.score + '/' + (h.total || 100) + '分' : '已提交')
    ).join('；') || '暂无作业记录';
    const weak = (params.weakPoints || []).map(w => w.name + '（掌握度 ' + w.val + '%）').join('、') ||
      (params.grade ? params.grade + ' 基础巩固' : '课内基础巩固');
    const prompt = finalizePrompt(
      '你是一名教学经验丰富的初中数学教师。请根据一名学生的长期学习数据，制定下一阶段（4 周）个性化学习计划书。\n' +
      '学生：' + (params.student || '学生') + '，年级：' + (params.grade || '待确认') + '，当前平均分 ' + (params.avg != null ? params.avg : '待统计') + '\n' +
      '近 8 次作业记录：' + homework + '\n' +
      '薄弱知识点：' + weak + '\n' +
      '近期错题：' + wrongs + '\n\n' +
      '只输出一个 JSON 对象，格式：\n' +
      '{"phase":"阶段名称","goal":"一句话阶段目标","weeks":[{"week":1,"focus":"本周主题","tasks":["具体任务1","具体任务2","具体任务3"],"check":"完成标准"}],"specialTopics":["针对薄弱点的专项建议1","专项建议2"],"parentTips":["家长配合建议1","家长配合建议2"]}\n' +
      '要求：任务具体可执行（如每天 10 分钟口算、每两天 1 道变式题），与薄弱知识点强相关，不输出其他文字。',
      (params.student || '') + ' ' + weak + ' 学习计划 教师建议'
    );
    const parsed = await askJSON(prompt, { temperature: 0.5, maxTokens: 2400, expect: 'object' });
    if (!Array.isArray(parsed.weeks)) throw new Error('模型返回格式无法解析，请重试');
    return {
      phase: String(parsed.phase || '下一阶段（4 周）提升计划'),
      goal: String(parsed.goal || ''),
      weeks: parsed.weeks.slice(0, 4).map(w => ({
        week: Number(w.week) || 1,
        focus: String(w.focus || ''),
        tasks: Array.isArray(w.tasks) ? w.tasks.map(String) : [],
        check: String(w.check || '')
      })),
      specialTopics: Array.isArray(parsed.specialTopics) ? parsed.specialTopics.map(String) : [],
      parentTips: Array.isArray(parsed.parentTips) ? parsed.parentTips.map(String) : []
    };
  }

  /* ---------- 计划配套习题（生成计划时同步写入学生账户） ---------- */
  async function generatePlanExercises(params) {
    const prompt = finalizePrompt(
      '你是经验丰富的教师。请为学生的 4 周学习计划生成配套习题（覆盖计划中的薄弱知识点），要求每题带完整详解。\n' +
      '学生：' + (params.student || '学生') + '\n计划主题：' + (params.plan ? params.plan.goal : '') + '\n' +
      '题量：' + (params.count || 8) + ' 题。\n' +
      '只输出一个 JSON 数组，每项格式：{"q":"题目","kp":"关联知识点","type":"选择题/填空题/解答题","options":["A. ..","B. .."]（选择题必填，其他为空数组）,"answer":"答案","explain":"从知识点讲起的完整详解（含思路与步骤）"}\n' +
      '难度循序渐进：前 3 题基础、中间巩固、最后 1-2 题综合拔高。不输出其他文字。',
      '计划配套习题'
    );
    const parsed = await askJSON(prompt, { temperature: 0.6, maxTokens: 3000, expect: 'array' });
    return parsed.slice(0, (params.count || 8)).map(q => ({
      id: 'ex_ai_' + Math.random().toString(36).slice(2, 8),
      q: String(q.q || '').trim(),
      kp: String(q.kp || '课内知识').trim(),
      type: String(q.type || '练习').trim(),
      options: Array.isArray(q.options) ? q.options.map(String) : [],
      answer: String(q.answer || '').trim(),
      explain: String(q.explain || '').trim()
    })).filter(q => q.q);
  }

  /* ---------- 资料美化排版（教师贡献时调用） ---------- */
  async function beautifyResource(raw, meta) {
    const prompt =
      '你是一名资深教研编辑。请把下面的教学资料原始素材整理成排版美观、结构清晰的教学资料（Markdown）。\n' +
      '要求：\n' +
      '1. 生成合适的标题（如已有标题请保留）；\n' +
      '2. 提炼一句摘要；\n' +
      '3. 按逻辑分节（用 ## 标题），保留全部有效内容，不编造、不删减知识点；\n' +
      '4. 练习/例题统一编号，答案与解析保留；\n' +
      '5. 语言平实，面向偏远地区学生与教师，专业名词后跟一句大白话解释。\n' +
      '资料元信息：学科 ' + (meta && meta.subject || '') + '，年级 ' + (meta && meta.grade || '') + '，关联知识点 ' + (meta && meta.kp || '') + '。\n\n' +
      '原始素材：\n' + String(raw || '').slice(0, 8000) + '\n\n' +
      '只输出排版后的 Markdown 正文，不要输出任何解释性文字。';
    const out = await chat([
      { role: 'system', content: '你只输出排版后的 Markdown 正文，不输出其他文字。' },
      { role: 'user', content: prompt }
    ], { temperature: 0.4, maxTokens: 3500 });
    const lines = String(out || '').trim().split('\n');
    const first = lines.find(l => /^#\s/.test(l));
    const title = (first ? first.replace(/^#\s+/, '') : (meta && meta.title) || '').trim();
    const content = String(out || '').trim();
    const descLine = lines.find(l => /^>/.test(l) || l.includes('摘要'));
    return {
      title: title,
      content: content,
      desc: (descLine || '').replace(/^>\s*/, '').replace(/^摘要[:：]\s*/, '').slice(0, 120),
      note: '已由 ' + providerLabel() + ' 完成 AI 美化排版'
    };
  }

  /* ---------- 每日投入安排（与计划体量、配套习题匹配，实时生成） ---------- */
  async function generatePlanSchedule(params) {
    const plan = params.plan || {};
    const weeks = (plan.weeks || []).map(w =>
      '第' + w.week + '周「' + w.focus + '」：' + (w.tasks || []).join('；')
    ).join('\n');
    const exN = (params.exercises || []).length;
    const prompt = finalizePrompt(
      '你是一名经验丰富的学习规划师。请根据下面的 4 周学习计划与配套习题数量，为学生设计一份“每日投入安排”。\n' +
      '学生：' + (params.student || '学生') + '，配套习题 ' + exN + ' 道。\n计划：\n' + weeks + '\n\n' +
      '只输出一个 JSON 对象，格式：{"dailyMinutes":30,"weeklyTotal":210,"items":[{"time":"早晨","minutes":10,"desc":"具体做什么"},{"time":"课后","minutes":15,"desc":"具体做什么"},{"time":"睡前","minutes":5,"desc":"具体做什么"}]}\n' +
      '要求：items 共 3-4 项，minutes 之和 = dailyMinutes；dailyMinutes 依据计划任务量与习题量合理设定（25-60 之间）；desc 必须具体可执行（如“完成 2 道专项题并对照知识点讲解订正”）；面向偏远地区学生，语言平实。\n' +
      '不输出其他文字。',
      '每日投入安排'
    );
    const parsed = await askJSON(prompt, { temperature: 0.4, maxTokens: 1200, expect: 'object' });
    if (!Array.isArray(parsed.items) || !parsed.items.length) throw new Error('模型返回格式无法解析');
    return {
      dailyMinutes: Number(parsed.dailyMinutes) || 30,
      weeklyTotal: Number(parsed.weeklyTotal) || 210,
      items: parsed.items.slice(0, 5).map(it => ({
        time: String(it.time || ''),
        minutes: Number(it.minutes) || 5,
        desc: String(it.desc || '')
      }))
    };
  }

  /* ---------- 连接测试 ---------- */
  async function testConnection() {
    const raw = await chat([
      { role: 'system', content: '只回复两个字：正常' },
      { role: 'user', content: '你好' }
    ], { timeout: 20000, maxTokens: 20, temperature: 0 });
    return raw;
  }

  window.AI = {
    PROVIDERS: PROVIDERS,
    PROTOCOLS: PROTOCOLS,
    ROUTES: ROUTES,
    PAID_MODELS: PAID_MODELS,
    getConfig: getConfig,
    getProfiles: getProfiles,
    getProfile: getProfile,
    defaultProfile: defaultProfile,
    saveProfile: saveProfile,
    removeProfile: removeProfile,
    activateProfile: activateProfile,
    setConfig: setConfig,
    isConfigured: isConfigured,
    providerLabel: providerLabel,
    relayAvailable: relayAvailable,
    serverStatus: serverStatus,
    testProfile: testProfile,
    listModels: listModels,
    chat: chat,
    generateQuestions: generateQuestions,
    generateSection: generateSection,
    buildSpecs: buildSpecs,
    buildDiffArray: buildDiffArray,
    exportGift: exportGift,
    estimatePaperTime: estimatePaperTime,
    searchSources: searchSources,
    fetchSource: fetchSource,
    corpusPrompt: corpusPrompt,
    retrieveCorpus: function (kw, opts) {
      return window.CORPUS ? window.CORPUS.retrieve(kw, opts) : [];
    },
    stylePrompt: function (id) {
      return window.CORPUS ? window.CORPUS.stylePrompt(id) : '';
    },
    normalizeQuestion: normalizeQuestion,
    validateQuestion: validateQuestion,
    basicFallback: basicFallback,
    gradeBand: gradeBand,
    gradeBandFocus: gradeBandFocus,
    DIFF_ANCHOR: DIFF_ANCHOR,
    stemKey: stemKey,
    normType: normType,
    normDiff: normDiff,
    gradeAnswer: gradeAnswer,
    generateExplanations: generateExplanations,
    generatePlan: generatePlan,
    generatePlanExercises: generatePlanExercises,
    generatePlanSchedule: generatePlanSchedule,
    beautifyResource: beautifyResource,
    testConnection: testConnection
  };
  serverStatus().then(s => { window.__FH_AI_STATUS__ = s; }).catch(() => {});
})();
