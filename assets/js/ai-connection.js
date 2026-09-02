/* ================= 凤凰花·智学 AI 连接中心 =================
 * 本版本没有可运行后端，因此连接中心采用主流 API 控制台的本地直连模型：
 * 选择服务商 → 读取/选择模型 → 配置凭据 → 测试 → 保存。
 * API Key 只保存于当前浏览器的设备存储，不进入项目文件、业务记录或日志。
 */
(function () {
  'use strict';

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }
  function icon(name) {
    var paths = {
      close: '<path d="M6 6l12 12M18 6L6 18"/>',
      plus: '<path d="M12 5v14M5 12h14"/>',
      key: '<circle cx="8.5" cy="12" r="3.2"/><path d="M11.3 10.1L19 2.4M15 6.4l2.1 2.1M17.3 4.1l2.1 2.1"/>',
      link: '<path d="M10 13.9l-1.4 1.4a3.5 3.5 0 0 1-5-5l2.2-2.2a3.5 3.5 0 0 1 5-.1"/><path d="M14 10.1l1.4-1.4a3.5 3.5 0 0 1 5 5l-2.2 2.2a3.5 3.5 0 0 1-5 .1"/><path d="M8.5 15.5l7-7"/>',
      eye: '<path d="M2.5 12s3.3-5 9.5-5 9.5 5 9.5 5-3.3 5-9.5 5-9.5-5-9.5-5Z"/><circle cx="12" cy="12" r="2.3"/>',
      refresh: '<path d="M19 7v4h-4M5 17v-4h4"/><path d="M6.5 9A6 6 0 0 1 19 11M17.5 15A6 6 0 0 1 5 13"/>',
      check: '<path d="m5 12 4.2 4.2L19 6.5"/>',
      shield: '<path d="M12 3 19 6v5c0 4.4-2.8 7.5-7 9-4.2-1.5-7-4.6-7-9V6l7-3Z"/><path d="m8.5 12 2.2 2.2 4.8-5"/>',
      sliders: '<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="8" cy="6" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="10" cy="18" r="2"/>',
      search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/>',
      external: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5"/>',
      info: '<circle cx="12" cy="12" r="9"/><path d="M12 10v6M12 7.2h.01"/>'
    };
    return '<svg class="fh-ai-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + (paths[name] || paths.info) + '</svg>';
  }
  function baseFromEndpoint(endpoint) {
    return String(endpoint || '').replace(/\/(?:chat\/completions|responses|messages|models)\/?$/i, '').replace(/\/+$/, '');
  }
  function modelCatalog() {
    var source = window.FH_REFERENCE_DATA;
    return source && typeof source.getModels === 'function' ? source.getModels() : { providers: [], models: [] };
  }
  function providerMeta(id) {
    var key = String(id || '');
    var providers = modelCatalog().providers || [];
    var catalogProvider = providers.find(function (item) { return item.slug === key || item.id === key; });
    var fallback = window.AI && window.AI.PROVIDERS && window.AI.PROVIDERS[key];
    if (catalogProvider) {
      var merged = Object.assign({}, fallback || {}, catalogProvider);
      merged.metadata = Object.assign({}, fallback && fallback.metadata || {}, catalogProvider.metadata || {});
      /* Google 的官方目录地址与其 OpenAI 兼容调用地址不同，保留本地预置的兼容地址。 */
      if (key === 'google-ai-studio' && fallback && fallback.endpoint) merged.apiBase = fallback.endpoint;
      if (!merged.protocol || !window.AI.PROTOCOLS[merged.protocol]) merged.protocol = fallback && fallback.protocol || 'openai-chat';
      return merged;
    }
    if (!fallback) return null;
    return Object.assign({ id: key, slug: key, kind: 'official_api', status: 'local-preset' }, fallback, {
      name: fallback.name || key,
      apiBase: fallback.endpoint || '',
      docsUrl: fallback.docsUrl || '',
      pricingUrl: fallback.pricingUrl || '',
      metadata: fallback.metadata || {}
    });
  }
  function providerOptions() {
    var providers = (modelCatalog().providers || []).slice();
    var known = providers.map(function (item) { return item.slug || item.id; });
    var fallbackProviders = window.AI && window.AI.PROVIDERS || {};
    Object.keys(fallbackProviders).forEach(function (key) { if (known.indexOf(key) < 0) providers.push(providerMeta(key)); });
    var custom = providers.find(function (item) { return item && (item.slug === 'custom' || item.id === 'custom'); });
    if (!custom) providers.push(providerMeta('custom'));
    var official = providers.filter(function (item) { return item && item.kind !== 'aggregator' && item.slug !== 'custom'; });
    var aggregators = providers.filter(function (item) { return item && item.kind === 'aggregator'; });
    var render = function (items) { return items.map(function (item) { return '<option value="' + esc(item.slug || item.id) + '">' + esc(item.name || item.slug || item.id) + '</option>'; }).join(''); };
    var html = '';
    if (official.length) html += '<optgroup label="原始厂家 / 官方 API">' + render(official) + '</optgroup>';
    if (aggregators.length) html += '<optgroup label="聚合与模型平台">' + render(aggregators) + '</optgroup>';
    html += '<optgroup label="其他">' + render([custom]) + '</optgroup>';
    return html;
  }
  function modelsForProvider(id, localModels, localProvider) {
    var key = String(id || '');
    var meta = providerMeta(key);
    var models = modelCatalog().models || [];
    var catalogModels = models.filter(function (item) { return item.providerId === key || (meta && item.providerId === meta.id) || String(item.canonicalKey || '').indexOf(key + ':') === 0; });
    var all = localProvider === key ? catalogModels.concat(localModels || []) : catalogModels;
    var unique = [];
    var seen = {};
    all.forEach(function (item) {
      var idValue = String(item.providerModelId || item.id || '').trim();
      if (!idValue || seen[idValue]) return;
      seen[idValue] = true;
      unique.push(Object.assign({}, item, { providerModelId: idValue, officialName: item.officialName || item.name || idValue }));
    });
    return unique;
  }
  function defaultModelForProvider(id) {
    var meta = providerMeta(id) || {};
    var metadata = meta.metadata || {};
    return metadata.defaultModel || meta.model || '';
  }
  function fallbackModel(providerId, modelId) {
    var meta = providerMeta(providerId) || {};
    var metadata = meta.metadata || {};
    if (!modelId || modelId !== (metadata.defaultModel || meta.model)) return null;
    return { providerId: meta.id || providerId, providerModelId: modelId, officialName: metadata.defaultModelName || modelId, pricing: metadata.defaultPricing || null, pricingUrl: meta.pricingUrl || null, status: 'local-default' };
  }
  function money(value) {
    var number = Number(value);
    if (!Number.isFinite(number)) return '';
    var amount = number * 1000000;
    if (amount === 0) return '0';
    if (amount < 0.01) return amount.toFixed(6).replace(/0+$/, '').replace(/\.$/, '');
    if (amount < 1) return amount.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
    return amount.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
  }
  function pricingText(item) {
    var pricing = item && item.pricing || {};
    var currency = pricing.currency || 'USD';
    var prompt = pricing.prompt != null ? pricing.prompt : pricing.input;
    var completion = pricing.completion != null ? pricing.completion : pricing.output;
    var hasPrompt = prompt !== null && prompt !== '' && Number.isFinite(Number(prompt));
    var hasCompletion = completion !== null && completion !== '' && Number.isFinite(Number(completion));
    if (hasPrompt && hasCompletion && Number(prompt) === 0 && Number(completion) === 0) return '价格/收费：免费 · 输入 0 ' + currency + ' / 输出 0 ' + currency + '（每百万 tokens）';
    if (hasPrompt || hasCompletion) {
      var input = hasPrompt ? money(prompt) + ' ' + currency : '官方未提供';
      var output = hasCompletion ? money(completion) + ' ' + currency : '官方未提供';
      return '价格/收费：输入 ' + input + ' / 输出 ' + output + '（每百万 tokens）';
    }
    return '价格/收费：官方接口未返回单价，请打开官方定价页查看';
  }
  function protocolOptions() {
    return Object.keys(window.AI.PROTOCOLS || {}).map(function (id) { return '<option value="' + esc(id) + '">' + esc(window.AI.PROTOCOLS[id].label || id) + '</option>'; }).join('');
  }

  function open(options) {
    var opts = options || {};
    var root = opts.root;
    if (!root || !window.AI) return;
    /* 无后端模式的连接只作用于当前浏览器，任何登录身份都可以维护自己的本地连接。 */
    var localOnly = !!(window.AI.getConfig && window.AI.getConfig().localOnly);
    var canEdit = localOnly || !!opts.isAdmin;
    var profiles = window.AI.getProfiles();
    var activeId = window.AI.getConfig().activeProfileId || (profiles[0] && profiles[0].id) || '';
    var selectedId = activeId;
    var draft = selectedId ? window.AI.getProfile(selectedId, false) : window.AI.defaultProfile(window.AI.DEFAULT_PROVIDER || 'zhipu');
    if (!draft) draft = window.AI.defaultProfile(window.AI.DEFAULT_PROVIDER || 'zhipu');
    var localModels = [];
    var localModelsProvider = '';
    var manualMode = false;
    var modelSearch = '';
    var modelFilter = 'all';
    var clearKeyRequested = false;
    var advancedOpen = false;
    var internalToastTimer;

    root.innerHTML = '<div class="dialog-mask fh-ai-mask"><div class="dialog fh-ai-dialog" role="dialog" aria-modal="true" aria-labelledby="fh-ai-dialog-title">' +
      '<header class="fh-ai-dialog__head"><div class="fh-ai-brand"><div class="fh-ai-brand__mark">' + icon('link') + '</div><div><span class="fh-ai-dialog__kicker">LOCAL MODEL CONNECTION</span><h2 class="fh-ai-dialog__title" id="fh-ai-dialog-title">AI 连接中心</h2><p class="fh-ai-dialog__subtitle">像主流模型控制台一样，先选服务商，再读取模型并完成一次连接测试。</p></div></div><div class="fh-ai-head-actions"><span class="fh-ai-local-badge"><i></i>本地浏览器模式</span><button class="fh-ai-dialog__close" type="button" data-ai-close aria-label="关闭 AI 连接中心">' + icon('close') + '</button></div></header>' +
      '<div class="fh-ai-dialog__body"><aside class="fh-ai-sidebar"><div class="fh-ai-sidebar__title"><div><strong>我的连接</strong><small>配置保存在此设备</small></div><button class="fh-ai-new" type="button" data-ai-new aria-label="新建连接配置">' + icon('plus') + '</button></div><div class="fh-ai-profile-search"><span>' + icon('search') + '</span><input type="search" data-ai-profile-search placeholder="搜索连接" aria-label="搜索连接配置"></div><div class="fh-ai-profile-list" data-ai-profile-list></div><div class="fh-ai-sidebar__foot"><span class="fh-ai-secure-dot">' + icon('shield') + '</span><div><b>本地保存</b><small>Key 不会上传到项目</small></div></div></aside>' +
      '<main class="fh-ai-main"><div class="fh-ai-main__scroll">' +
        '<div class="fh-ai-main__intro"><div><span class="fh-ai-step-count">连接配置</span><h3 data-ai-editor-title>新连接</h3><p data-ai-editor-subtitle>完成下面 4 步即可开始调用模型</p></div><span class="fh-ai-status-pill" data-ai-status-pill><i></i>未测试</span></div>' +
        (!canEdit ? '<div class="fh-ai-lock"><span>' + icon('shield') + '</span><div><b>当前账号只能查看状态</b><p>只有管理员可以维护模型连接，教师和学生会使用已启用的本机配置。</p></div></div>' : '') +
        '<div class="fh-ai-local-note"><span class="fh-ai-note-icon">' + icon('info') + '</span><div><b>当前为无后端版本</b><p>所有请求都从当前浏览器直接访问服务商官方 API。Key 只保存在本机；如果服务商限制跨域，检测结果会明确提示。</p></div></div>' +
        '<form class="fh-ai-form" data-ai-form>' +
          '<section class="fh-ai-card"><div class="fh-ai-card__head"><div class="fh-ai-step">01</div><div><h4>选择服务商</h4><p>官方地址和调用协议会自动填充，你也可以选择自定义接口。</p></div></div><div class="fh-ai-provider-select"><label for="fh-ai-provider">模型厂家 / 平台</label><select id="fh-ai-provider" data-ai-field="provider"' + (!canEdit ? ' disabled' : '') + '>' + providerOptions() + '</select></div><div class="fh-ai-provider-meta" data-ai-provider-meta></div></section>' +
          '<section class="fh-ai-card"><div class="fh-ai-card__head"><div class="fh-ai-step">02</div><div><h4>选择具体模型</h4><p>用 API Key 从当前服务商读取最新模型；读取不到时可手动输入模型 ID。</p></div><button class="fh-ai-card-action" type="button" data-ai-models' + (!canEdit ? ' disabled' : '') + '>' + icon('refresh') + '<span>从官方读取</span></button></div><div class="fh-ai-model-toolbar"><div class="fh-ai-model-search"><span>' + icon('search') + '</span><input type="search" data-ai-model-search placeholder="搜索模型名称或 ID" aria-label="搜索模型"></div><select data-ai-model-filter aria-label="筛选模型"><option value="all">全部模型</option><option value="text">文本生成</option><option value="vision">视觉理解</option><option value="embedding">向量模型</option></select></div><div class="fh-ai-model-row"><select id="fh-ai-model" data-ai-field="model"' + (!canEdit ? ' disabled' : '') + '><option value="">选择具体模型</option></select><input id="fh-ai-model-manual" data-ai-manual-model type="text" maxlength="180" placeholder="手动填写模型 ID，例如 provider/model-name" style="display:none"' + (!canEdit ? ' disabled' : '') + '><button class="fh-ai-manual-toggle" type="button" data-ai-manual-toggle' + (!canEdit ? ' disabled' : '') + '>手动填写</button></div><div class="fh-ai-model-foot"><p class="fh-ai-price" data-ai-model-price>价格/收费：选择具体模型后显示，免费模型也会明确标注。</p><span class="fh-ai-model-count" data-ai-model-count></span></div></section>' +
          '<section class="fh-ai-card"><div class="fh-ai-card__head"><div class="fh-ai-step">03</div><div><h4>填写访问凭据</h4><p>API Key 只保存在本浏览器。Base URL 和协议已放入高级设置，减少首次配置干扰。</p></div></div><div class="fh-ai-key-field"><label for="fh-ai-key">API Key <span><small data-ai-key-state>未配置</small><button type="button" class="fh-ai-clear-key" data-ai-clear-key' + (!canEdit ? ' disabled' : '') + '>清除本机 Key</button></span></label><div class="fh-ai-key-row"><div class="fh-ai-key-input"><span>' + icon('key') + '</span><input id="fh-ai-key" data-ai-field="apiKey" type="password" autocomplete="new-password" placeholder="粘贴服务商 API Key"' + (!canEdit ? ' disabled' : '') + '></div><button type="button" class="fh-ai-show-key" data-ai-key-toggle aria-label="显示 API Key"' + (!canEdit ? ' disabled' : '') + '>' + icon('eye') + '</button></div><p class="fh-ai-help" data-ai-key-help>保存后只保留脱敏状态；留空会继续使用已保存的 Key。</p></div><button class="fh-ai-advanced-toggle" type="button" data-ai-advanced-toggle aria-expanded="false"><span>' + icon('sliders') + '高级连接设置</span><span class="fh-ai-advanced-chevron">⌄</span></button><div class="fh-ai-advanced" data-ai-advanced hidden><div class="fh-ai-grid"><div class="fh-ai-field fh-ai-field--wide"><label for="fh-ai-base">API Base URL</label><input id="fh-ai-base" data-ai-field="baseUrl" type="url" inputmode="url" placeholder="由服务商自动填充"' + (!canEdit ? ' disabled' : '') + '><p class="fh-ai-help">只填写 Base URL，系统会按协议拼接请求路径。</p></div><div class="fh-ai-field"><label for="fh-ai-protocol">接口协议</label><select id="fh-ai-protocol" data-ai-field="protocol"' + (!canEdit ? ' disabled' : '') + '>' + protocolOptions() + '</select></div><div class="fh-ai-field"><label for="fh-ai-path">自定义路径 <small>可选</small></label><input id="fh-ai-path" data-ai-field="endpointPath" type="text" placeholder="默认按协议生成"' + (!canEdit ? ' disabled' : '') + '></div><div class="fh-ai-field fh-ai-field--wide"><label for="fh-ai-headers">额外 HTTP Headers <small>可选 JSON</small></label><textarea id="fh-ai-headers" data-ai-field="headers" rows="3" placeholder="例如：{&quot;X-Organization&quot;:&quot;school-a&quot;}"' + (!canEdit ? ' disabled' : '') + '></textarea><p class="fh-ai-help">不要在这里重复填写 Authorization；用于租户或项目标识等自定义请求头。</p></div></div><div class="fh-ai-endpoint-preview"><span>最终请求地址</span><code data-ai-endpoint-preview>尚未填写</code></div></div></section>' +
          '<section class="fh-ai-card fh-ai-test-card"><div class="fh-ai-card__head"><div class="fh-ai-step">04</div><div><h4>测试并启用</h4><p>先发出一条最小测试请求，确认地址、模型和 Key 都能用。</p></div></div><div class="fh-ai-test-result" data-ai-test-result><span class="fh-ai-test-result__icon">' + icon('info') + '</span><div><b>尚未测试</b><p>建议保存前先检测连接。</p></div></div></section>' +
        '</form></div><footer class="fh-ai-editor__foot"><div class="fh-ai-foot-status" data-ai-foot-status>配置只保存在当前设备，可随时切换。</div><button class="fh-ai-btn fh-ai-btn--danger" type="button" data-ai-delete' + (!canEdit ? ' disabled' : '') + '>删除</button><button class="fh-ai-btn" type="button" data-ai-cancel>取消</button><button class="fh-ai-btn" type="button" data-ai-test>' + icon('check') + '检测连接</button><button class="fh-ai-btn fh-ai-btn--primary" type="button" data-ai-save' + (!canEdit ? ' disabled' : '') + '>保存并启用</button></footer></main></div></div></div>';

    function query(selector) { return root.querySelector(selector); }
    function field(name) { return root.querySelector('[data-ai-field="' + name + '"]'); }
    function notify(message, kind) {
      if (typeof opts.showToast === 'function') opts.showToast(message, kind || 'info');
      else {
        var toast = query('[data-ai-toast]');
        if (!toast) { toast = document.createElement('div'); toast.className = 'fh-ai-toast'; toast.setAttribute('data-ai-toast', ''); root.appendChild(toast); }
        toast.textContent = message; toast.classList.add('is-visible'); window.clearTimeout(internalToastTimer); internalToastTimer = window.setTimeout(function () { toast.classList.remove('is-visible'); }, 2600);
      }
    }
    function endpointForDraft(value) {
      var protocols = window.AI.PROTOCOLS || {};
      var protocol = protocols[value.protocol] || protocols['openai-chat'];
      var base = baseFromEndpoint(value.baseUrl || value.endpoint);
      return base ? base + (value.endpointPath || protocol.suffix) : '填写 Base URL 后生成';
    }
    function resetModelFilters() {
      modelSearch = ''; modelFilter = 'all';
      var search = query('[data-ai-model-search]'); var filter = query('[data-ai-model-filter]');
      if (search) search.value = '';
      if (filter) filter.value = 'all';
    }
    function paintProviderMeta(providerId) {
      var meta = providerMeta(providerId);
      var target = query('[data-ai-provider-meta]');
      if (!target) return;
      if (!meta) { target.textContent = '自定义接口：请手动填写 Base URL、协议和模型 ID。'; return; }
      var kind = meta.kind === 'aggregator' ? '聚合平台' : '原始厂家';
      var docs = meta.docsUrl || meta.docs_url;
      var pricing = meta.pricingUrl || meta.pricing_url;
      var links = '';
      if (docs) links += '<a href="' + esc(docs) + '" target="_blank" rel="noreferrer">官方接口文档 ' + icon('external') + '</a>';
      if (pricing) links += '<a href="' + esc(pricing) + '" target="_blank" rel="noreferrer">官方定价 ' + icon('external') + '</a>';
      target.innerHTML = '<span class="fh-ai-provider-chip"><i></i>' + esc(meta.status === 'active' ? '目录已同步' : '本地预置') + '</span><span>' + esc(kind) + '</span><span class="fh-ai-provider-url">' + esc(meta.apiBase || meta.endpoint || '自定义地址') + '</span><span class="fh-ai-provider-links">' + links + '</span>';
    }
    function paintModelPrice(item) {
      var target = query('[data-ai-model-price]');
      if (!target) return;
      if (!item) { target.textContent = manualMode ? '价格/收费：自定义模型，收费由服务商官方定价。' : '价格/收费：选择具体模型后显示，免费模型也会明确标注。'; return; }
      var url = item.pricingUrl || (providerMeta(field('provider').value) || {}).pricingUrl || '';
      target.innerHTML = esc(pricingText(item)) + (url ? ' <a href="' + esc(url) + '" target="_blank" rel="noreferrer">查看定价 ' + icon('external') + '</a>' : '');
    }
    function modelItems(providerId) {
      var items = modelsForProvider(providerId, localModels, localModelsProvider);
      var selected = field('model') && field('model').value;
      var fallback = fallbackModel(providerId, selected || defaultModelForProvider(providerId));
      if (fallback && !items.some(function (item) { return item.providerModelId === fallback.providerModelId; })) items.push(fallback);
      return items;
    }
    function modelMatches(item) {
      var queryText = modelSearch.trim().toLowerCase();
      var type = String(item.type || item.modelType || '').toLowerCase();
      var capabilities = Array.isArray(item.capabilities) ? item.capabilities.join(' ').toLowerCase() : String(item.capabilities || '').toLowerCase();
      var haystack = String(item.providerModelId || '') + ' ' + String(item.officialName || '') + ' ' + String(item.name || '');
      if (queryText && haystack.toLowerCase().indexOf(queryText) < 0) return false;
      if (modelFilter === 'vision' && !/vision|image|multimodal|视觉/.test(type + ' ' + capabilities)) return false;
      if (modelFilter === 'embedding' && !/embedding|embed|向量/.test(type + ' ' + capabilities)) return false;
      if (modelFilter === 'text' && /embedding|embed|rerank|image|audio|speech/.test(type + ' ' + capabilities)) return false;
      return true;
    }
    function renderModelChoices(providerId, selected) {
      var select = field('model');
      var manual = query('[data-ai-manual-model]');
      var toggle = query('[data-ai-manual-toggle]');
      if (!select) return;
      var allItems = modelItems(providerId).sort(function (a, b) { return String(a.officialName || a.providerModelId).localeCompare(String(b.officialName || b.providerModelId)); });
      var visibleItems = allItems.filter(modelMatches);
      var options = '<option value="">' + (allItems.length ? '选择具体模型' : '暂无模型目录，请手动填写') + '</option>';
      if (visibleItems.length) options += visibleItems.map(function (item) { return '<option value="' + esc(item.providerModelId) + '">' + esc(item.officialName || item.providerModelId) + ' · ' + esc(item.providerModelId) + '</option>'; }).join('');
      if (selected && !visibleItems.some(function (item) { return item.providerModelId === selected; })) options += '<option value="' + esc(selected) + '">当前选择 · ' + esc(selected) + '</option>';
      select.innerHTML = options;
      select.style.display = manualMode ? 'none' : '';
      select.value = selected || '';
      if (manual) { manual.style.display = manualMode ? '' : 'none'; manual.disabled = !canEdit || !manualMode; manual.value = manualMode ? (selected || '') : ''; }
      if (toggle) { toggle.textContent = manualMode ? '返回模型列表' : '手动填写'; toggle.style.display = allItems.length && !manualMode ? '' : (canEdit ? '' : 'none'); }
      var current = allItems.find(function (item) { return item.providerModelId === (manualMode ? (manual && manual.value) : select.value); });
      paintModelPrice(current || fallbackModel(providerId, manualMode && manual ? manual.value : select.value) || null);
      var count = query('[data-ai-model-count]');
      if (count) count.textContent = allItems.length ? (visibleItems.length + ' 个模型') : '尚未从官方接口读取';
    }
    function refreshProviderOptions(selected) {
      var select = field('provider');
      if (!select) return;
      select.innerHTML = providerOptions();
      var value = selected || select.value || window.AI.DEFAULT_PROVIDER || 'zhipu';
      if (!providerMeta(value) && !Array.prototype.some.call(select.options, function (item) { return item.value === value; })) select.insertAdjacentHTML('beforeend', '<option value="' + esc(value) + '">当前配置 · ' + esc(value) + '</option>');
      select.value = value;
      paintProviderMeta(value);
      renderModelChoices(value, field('model') && field('model').value);
    }
    function draftFromForm() {
      var manual = query('[data-ai-manual-model]');
      var modelSelect = field('model');
      return { id: draft.id, name: field('name').value.trim(), provider: field('provider').value, protocol: field('protocol').value, baseUrl: field('baseUrl').value.trim(), endpointPath: field('endpointPath').value.trim(), model: (manualMode && manual ? manual.value : modelSelect.value).trim(), mode: 'direct', apiKey: field('apiKey').value.trim(), clearKey: clearKeyRequested, headers: field('headers').value.trim() };
    }
    function paintStatus(result) {
      var pill = query('[data-ai-status-pill]');
      var card = query('[data-ai-test-result]');
      if (!pill || !card) return;
      pill.classList.remove('is-ok', 'is-warn', 'is-loading'); card.classList.remove('is-ok', 'is-warn', 'is-loading');
      if (!result) { pill.innerHTML = '<i></i>未测试'; card.innerHTML = '<span class="fh-ai-test-result__icon">' + icon('info') + '</span><div><b>尚未测试</b><p>建议保存前先检测连接。</p></div>'; return; }
      if (result.loading) { pill.classList.add('is-loading'); pill.innerHTML = '<i></i>检测中'; card.classList.add('is-loading'); card.innerHTML = '<span class="fh-ai-test-result__icon">' + icon('refresh') + '</span><div><b>正在发送测试请求</b><p>只会发送最小探测内容，不会生成业务数据。</p></div>'; return; }
      var ok = !!result.ok;
      pill.classList.add(ok ? 'is-ok' : 'is-warn'); pill.innerHTML = '<i></i>' + (ok ? '已连接' : '连接失败'); card.classList.add(ok ? 'is-ok' : 'is-warn'); card.innerHTML = '<span class="fh-ai-test-result__icon">' + icon(ok ? 'check' : 'info') + '</span><div><b>' + esc(ok ? '连接测试通过' : '连接测试未通过') + '</b><p>' + esc(result.message || '请检查模型、地址和 API Key。') + '</p></div>';
    }
    function setProviderDefaults() {
      var provider = field('provider').value;
      var meta = providerMeta(provider) || {};
      var metadata = meta.metadata || {};
      var providerProtocol = metadata.protocol || meta.protocol || 'openai-chat';
      if (!window.AI.PROTOCOLS[providerProtocol]) providerProtocol = meta.protocol && window.AI.PROTOCOLS[meta.protocol] ? meta.protocol : 'openai-chat';
      resetModelFilters();
      field('baseUrl').value = meta.apiBase || meta.endpoint || '';
      field('protocol').value = providerProtocol;
      field('endpointPath').value = metadata.endpointPath || '';
      field('model').value = metadata.defaultModel || meta.model || '';
      localModels = []; localModelsProvider = ''; manualMode = !defaultModelForProvider(provider);
      renderModelChoices(provider, defaultModelForProvider(provider));
      paintProviderMeta(provider); query('[data-ai-endpoint-preview]').textContent = endpointForDraft(draftFromForm()); query('[data-ai-editor-subtitle]').textContent = meta.name || '选择服务商';
    }
    function renderProfiles() {
      var list = query('[data-ai-profile-list]');
      if (!list) return;
      var search = (query('[data-ai-profile-search]').value || '').trim().toLowerCase();
      var current = window.AI.getProfiles().filter(function (profile) { return !search || (profile.name + ' ' + profile.providerName + ' ' + profile.model).toLowerCase().indexOf(search) >= 0; });
      if (!current.length) { list.innerHTML = '<div class="fh-ai-empty">' + (search ? '没有找到匹配的连接。' : '还没有连接配置，点击上方“＋”创建。') + '</div>'; return; }
      list.innerHTML = current.map(function (profile) { var isActive = profile.id === activeId; return '<button class="fh-ai-profile' + (profile.id === selectedId ? ' is-selected' : '') + '" type="button" data-ai-profile="' + esc(profile.id) + '"><span class="fh-ai-profile__top"><span class="fh-ai-profile__name">' + esc(profile.name) + '</span><span class="fh-ai-profile__state ' + (isActive ? 'is-active' : '') + '">' + (isActive ? '当前' : '') + '</span></span><span class="fh-ai-profile__provider">' + esc(profile.providerName || profile.provider) + '</span><span class="fh-ai-profile__meta"><span>' + esc(profile.model || '未填写模型') + '</span><span class="fh-ai-key-dot ' + (profile.hasKey ? 'has-key' : '') + '">' + (profile.hasKey ? '已配置 Key' : '未配置 Key') + '</span></span></button>'; }).join('');
      list.querySelectorAll('[data-ai-profile]').forEach(function (button) { button.addEventListener('click', function () { selectedId = button.getAttribute('data-ai-profile'); draft = window.AI.getProfile(selectedId, false) || window.AI.defaultProfile(window.AI.DEFAULT_PROVIDER || 'zhipu'); clearKeyRequested = false; localModels = []; localModelsProvider = ''; manualMode = false; resetModelFilters(); renderEditor(); renderProfiles(); window.setTimeout(readModelsIfReady, 0); }); });
    }
    function renderEditor() {
      var profile = draft || window.AI.defaultProfile(window.AI.DEFAULT_PROVIDER || 'zhipu');
      field('name').value = profile.name || '';
      field('provider').value = profile.provider || window.AI.DEFAULT_PROVIDER || 'zhipu';
      field('baseUrl').value = profile.baseUrl || baseFromEndpoint(profile.endpoint || '');
      field('protocol').value = profile.protocol || 'openai-chat';
      field('endpointPath').value = profile.endpointPath || '';
      field('headers').value = profile.headers || '';
      field('apiKey').value = '';
      refreshProviderOptions(profile.provider || window.AI.DEFAULT_PROVIDER || 'zhipu');
      field('baseUrl').value = profile.baseUrl || baseFromEndpoint(profile.endpoint || ''); field('protocol').value = profile.protocol || 'openai-chat'; field('endpointPath').value = profile.endpointPath || '';
      manualMode = !modelItems(profile.provider || window.AI.DEFAULT_PROVIDER || 'zhipu').length && !defaultModelForProvider(profile.provider || window.AI.DEFAULT_PROVIDER || 'zhipu');
      renderModelChoices(profile.provider || window.AI.DEFAULT_PROVIDER || 'zhipu', profile.model || defaultModelForProvider(profile.provider || window.AI.DEFAULT_PROVIDER || 'zhipu'));
      query('[data-ai-editor-title]').textContent = profile.name || '新连接'; query('[data-ai-editor-subtitle]').textContent = profile.providerName || ((providerMeta(profile.provider) || {}).name || '选择服务商');
      var keyState = query('[data-ai-key-state]'); if (keyState) keyState.textContent = profile.hasKey ? '已保存（隐藏）' : '未配置';
      var keyHelp = query('[data-ai-key-help]'); if (keyHelp) keyHelp.textContent = profile.hasKey ? '已存在本机 Key；留空会保留旧 Key，输入新值会替换。' : '输入后只保存在当前设备；不会写入项目文件。';
      query('[data-ai-endpoint-preview]').textContent = endpointForDraft(profile); query('[data-ai-advanced]').hidden = !advancedOpen; query('[data-ai-advanced-toggle]').setAttribute('aria-expanded', String(advancedOpen));
      var last = profile.lastTest ? { ok: profile.lastTest.ok, route: profile.lastTest.route, message: profile.lastTest.message } : null; paintStatus(last); query('[data-ai-foot-status]').textContent = last ? (last.message || '已记录最近一次检测') : '配置只保存在当前设备，可随时切换。'; paintProviderMeta(profile.provider || window.AI.DEFAULT_PROVIDER || 'zhipu');
    }
    function validate() {
      var value = draftFromForm(); var errors = [];
      if (!value.name) errors.push({ field: 'name', message: '请填写连接名称' });
      if (!/^https:\/\//i.test(value.baseUrl)) errors.push({ field: 'baseUrl', message: 'Base URL 需要以 https:// 开头' }); else { try { new URL(value.baseUrl); } catch (e) { errors.push({ field: 'baseUrl', message: 'Base URL 格式不正确' }); } }
      if (!value.model) errors.push({ field: manualMode ? 'manual' : 'model', message: '请选择或填写模型 ID' });
      var summary = query('[data-ai-error]'); if (summary) summary.remove(); root.querySelectorAll('[data-ai-field]').forEach(function (item) { item.removeAttribute('aria-invalid'); });
      if (errors.length) { var error = errors[0]; var target = error.field === 'manual' ? query('[data-ai-manual-model]') : field(error.field); if (target) target.setAttribute('aria-invalid', 'true'); var node = document.createElement('div'); node.className = 'fh-ai-error'; node.setAttribute('data-ai-error', ''); node.setAttribute('role', 'alert'); node.innerHTML = icon('info') + '<span>' + esc(error.message) + '</span>'; query('.fh-ai-main__scroll').prepend(node); node.tabIndex = -1; node.focus(); return null; }
      return value;
    }
    async function readOfficialModels() {
      var button = query('[data-ai-models]'); var value = draftFromForm();
      if (!value.baseUrl) { query('[data-ai-foot-status]').textContent = '请先选择服务商或填写 Base URL。'; return; }
      button.disabled = true; button.classList.add('is-loading'); button.querySelector('span').textContent = '读取中…'; query('[data-ai-foot-status]').textContent = '正在从所选服务商官方模型接口读取…';
      try { var result = await window.AI.listModels(value); if (!result.ok) throw new Error(result.message || '官方模型列表读取失败'); localModels = result.models || []; localModelsProvider = value.provider; var chosen = value.model || defaultModelForProvider(value.provider) || (localModels[0] && localModels[0].id) || ''; manualMode = false; renderModelChoices(value.provider, chosen); query('[data-ai-foot-status]').textContent = '已从官方接口读取 ' + localModels.length + ' 个模型；价格以接口返回或官方定价页为准。'; notify('模型列表已更新', 'success'); }
      catch (error) { query('[data-ai-foot-status]').textContent = error.message || '官方模型列表读取失败'; notify(error.message || '模型列表读取失败', 'error'); }
      finally { button.disabled = !canEdit; button.classList.remove('is-loading'); button.querySelector('span').textContent = '从官方读取'; }
    }
    function readModelsIfReady() {
      var profile = selectedId ? window.AI.getProfile(selectedId, true) : null;
      if (profile && profile.apiKey && !localModels.length) readOfficialModels();
    }
    function close() { root.innerHTML = ''; }

    query('[data-ai-close]').addEventListener('click', close); query('[data-ai-cancel]').addEventListener('click', close); query('.fh-ai-mask').addEventListener('click', function (event) { if (event.target === event.currentTarget) close(); }); query('[data-ai-profile-search]').addEventListener('input', renderProfiles); query('[data-ai-provider]').addEventListener('change', setProviderDefaults); query('[data-ai-model-search]').addEventListener('input', function () { modelSearch = this.value; renderModelChoices(field('provider').value, manualMode ? query('[data-ai-manual-model]').value : field('model').value); }); query('[data-ai-model-filter]').addEventListener('change', function () { modelFilter = this.value; renderModelChoices(field('provider').value, manualMode ? query('[data-ai-manual-model]').value : field('model').value); }); query('[data-ai-models]').addEventListener('click', readOfficialModels); query('[data-ai-manual-toggle]').addEventListener('click', function () { manualMode = !manualMode; renderModelChoices(field('provider').value, manualMode ? (field('model').value || defaultModelForProvider(field('provider').value)) : (query('[data-ai-manual-model]').value || field('model').value)); }); query('[data-ai-field="model"]').addEventListener('change', function () { paintModelPrice(modelItems(field('provider').value).find(function (item) { return item.providerModelId === field('model').value; }) || fallbackModel(field('provider').value, field('model').value)); }); query('[data-ai-manual-model]').addEventListener('input', function () { paintModelPrice(fallbackModel(field('provider').value, this.value) || null); }); query('[data-ai-key-toggle]').addEventListener('click', function () { var input = field('apiKey'); var shown = input.type === 'text'; input.type = shown ? 'password' : 'text'; this.setAttribute('aria-label', shown ? '显示 API Key' : '隐藏 API Key'); }); query('[data-ai-clear-key]').addEventListener('click', function () { if (!canEdit) return; clearKeyRequested = true; field('apiKey').value = ''; query('[data-ai-key-state]').textContent = '保存时清除'; query('[data-ai-key-help]').textContent = '点击“保存并启用”后会删除此设备上的 Key；如需保留，请关闭窗口。'; }); query('[data-ai-advanced-toggle]').addEventListener('click', function () { advancedOpen = !advancedOpen; query('[data-ai-advanced]').hidden = !advancedOpen; this.setAttribute('aria-expanded', String(advancedOpen)); }); query('[data-ai-field="baseUrl"]').addEventListener('input', function () { query('[data-ai-endpoint-preview]').textContent = endpointForDraft(draftFromForm()); }); query('[data-ai-field="protocol"]').addEventListener('change', function () { query('[data-ai-endpoint-preview]').textContent = endpointForDraft(draftFromForm()); }); query('[data-ai-field="endpointPath"]').addEventListener('input', function () { query('[data-ai-endpoint-preview]').textContent = endpointForDraft(draftFromForm()); }); query('[data-ai-field="name"]').addEventListener('input', function () { query('[data-ai-editor-title]').textContent = this.value.trim() || '新连接'; }); query('[data-ai-field="apiKey"]').addEventListener('blur', function () { if (this.value.trim()) window.setTimeout(readOfficialModels, 0); });
    query('[data-ai-new]').addEventListener('click', function () { if (!canEdit) return; draft = window.AI.defaultProfile(window.AI.DEFAULT_PROVIDER || 'zhipu'); selectedId = draft.id; clearKeyRequested = false; localModels = []; localModelsProvider = ''; manualMode = false; resetModelFilters(); renderEditor(); renderProfiles(); });
    query('[data-ai-delete]').addEventListener('click', function () { if (!canEdit || !selectedId || !window.AI.getProfile(selectedId)) return; if (!window.confirm('删除这组 AI 连接配置？')) return; window.AI.removeProfile(selectedId); var next = window.AI.getProfiles()[0]; if (next) { selectedId = next.id; draft = window.AI.getProfile(selectedId, false); } else { selectedId = ''; draft = window.AI.defaultProfile(window.AI.DEFAULT_PROVIDER || 'zhipu'); } clearKeyRequested = false; renderEditor(); renderProfiles(); notify('连接配置已删除', 'success'); });
    query('[data-ai-test]').addEventListener('click', async function () { var value = draftFromForm(); if (!value.baseUrl || !value.model) { paintStatus({ ok: false, message: '请先填写 Base URL 和模型 ID' }); query('[data-ai-foot-status]').textContent = '请先填写 Base URL 和模型 ID'; return; } var button = query('[data-ai-test]'); button.disabled = true; button.innerHTML = icon('refresh') + '检测中…'; paintStatus({ loading: true }); try { var result = await window.AI.testProfile(value); paintStatus(result); query('[data-ai-foot-status]').textContent = result.message || '检测完成'; if (result.ok) notify('AI 连接测试通过', 'success'); } catch (error) { var failure = { ok: false, message: error.message || '检测失败' }; paintStatus(failure); query('[data-ai-foot-status]').textContent = failure.message; } finally { button.disabled = false; button.innerHTML = icon('check') + '检测连接'; } });
    query('[data-ai-save]').addEventListener('click', function () { if (!canEdit) return; var value = validate(); if (!value) return; try { var saved = window.AI.saveProfile(value, { activate: true }); selectedId = saved.id; activeId = saved.id; draft = window.AI.getProfile(selectedId, false); clearKeyRequested = false; renderEditor(); renderProfiles(); notify('连接已保存并启用', 'success'); } catch (error) { notify(error.message || '保存失败', 'error'); } });
    query('[data-ai-form]').addEventListener('submit', function (event) { event.preventDefault(); query('[data-ai-save]').click(); }); root.addEventListener('keydown', function (event) { if (event.key === 'Escape') close(); });
    renderEditor(); renderProfiles(); window.setTimeout(readModelsIfReady, 0);
  }

  window.FH_AI_SETTINGS = { open: open };
}());
