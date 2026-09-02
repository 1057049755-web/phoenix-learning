/* ================= 凤凰花·智学 AI 连接中心 =================
 * 将模型连接拆成可保存、可切换的 profile，避免把 provider、endpoint、Key
 * 和访问路径挤在一个不可解释的表单里。界面只读取脱敏 profile，Key 留在
 * AI 模块的设备存储中，并且只有发起请求时才会进入对应连接路径。
 */
(function () {
  'use strict';

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }
  function baseFromEndpoint(endpoint) {
    return String(endpoint || '').replace(/\/(?:chat\/completions|responses|messages)\/?$/i, '').replace(/\/+$/, '');
  }
  function modelCatalog() {
    var source = window.FH_REFERENCE_DATA;
    return source && typeof source.getModels === 'function' ? source.getModels() : { providers: [], models: [] };
  }
  function providerMeta(id) {
    var key = String(id || '');
    var providers = modelCatalog().providers || [];
    return providers.find(function (item) { return item.slug === key || item.id === key; }) || null;
  }
  function providerOptions() {
    var providers = modelCatalog().providers || [];
    var official = providers.filter(function (item) { return item.kind !== 'aggregator'; });
    var aggregators = providers.filter(function (item) { return item.kind === 'aggregator'; });
    var render = function (items) { return items.map(function (item) { return '<option value="' + esc(item.slug) + '">' + esc(item.name || item.slug) + '</option>'; }).join(''); };
    var html = '';
    if (official.length) html += '<optgroup label="原始厂家 / 官方 API">' + render(official) + '</optgroup>';
    if (aggregators.length) html += '<optgroup label="聚合与模型平台">' + render(aggregators) + '</optgroup>';
    if (!html) html = '<option value="custom">自定义接口</option>';
    return html;
  }
  function modelsForProvider(id) {
    var key = String(id || '');
    var meta = providerMeta(key);
    var models = modelCatalog().models || [];
    return models.filter(function (item) { return item.providerId === key || (meta && item.providerId === meta.id) || String(item.canonicalKey || '').indexOf(key + ':') === 0; });
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
    var prompt = pricing.prompt;
    var completion = pricing.completion;
    var hasPrompt = prompt !== null && prompt !== '' && Number.isFinite(Number(prompt));
    var hasCompletion = completion !== null && completion !== '' && Number.isFinite(Number(completion));
    if (prompt === 0 && completion === 0) return '价格/收费：免费（输入 0 ' + currency + ' / 输出 0 ' + currency + '，每百万 tokens）';
    if (hasPrompt || hasCompletion) {
      var input = hasPrompt ? money(prompt) + ' ' + currency : '服务商未公布';
      var output = hasCompletion ? money(completion) + ' ' + currency : '服务商未公布';
      var cached = pricing.cachedPrompt !== null && pricing.cachedPrompt !== '' && Number.isFinite(Number(pricing.cachedPrompt)) ? '；缓存输入 ' + money(pricing.cachedPrompt) + ' ' + currency : '';
      return '价格/收费：输入 ' + input + ' / 输出 ' + output + cached + '，每百万 tokens';
    }
    return '价格/收费：官方模型列表未返回单价，请打开服务商定价页查看';
  }
  function protocolOptions() {
    return Object.keys(window.AI.PROTOCOLS || {}).map(function (id) {
      return '<option value="' + esc(id) + '">' + esc(window.AI.PROTOCOLS[id].label || id) + '</option>';
    }).join('');
  }
  function routeOptions() {
    return Object.keys(window.AI.ROUTES || {}).map(function (id) {
      var route = window.AI.ROUTES[id];
      return '<label class="fh-ai-route" data-ai-route="' + esc(id) + '"><input type="radio" name="fh-ai-route" value="' + esc(id) + '"><strong>' + esc(route.label) + '</strong><span>' + esc(route.desc) + '</span></label>';
    }).join('');
  }

  function open(options) {
    var opts = options || {};
    var root = opts.root;
    if (!root || !window.AI) return;
    var canEdit = !!opts.isAdmin;
    var profiles = window.AI.getProfiles();
    var activeId = window.AI.getConfig().activeProfileId || (profiles[0] && profiles[0].id) || '';
    var selectedId = activeId;
    var draft = selectedId ? window.AI.getProfile(selectedId, false) : window.AI.defaultProfile('openrouter');
    if (!draft) draft = window.AI.defaultProfile('openrouter');
    var clearKeyRequested = false;
    var internalToastTimer;

    root.innerHTML = '<div class="dialog-mask fh-ai-mask"><div class="dialog fh-ai-dialog" role="dialog" aria-modal="true" aria-labelledby="fh-ai-dialog-title">' +
      '<div class="fh-ai-dialog__head"><div><span class="fh-ai-dialog__kicker">Model Gateway / Network Ready</span><h2 class="fh-ai-dialog__title" id="fh-ai-dialog-title">AI 连接中心</h2><p class="fh-ai-dialog__subtitle">选择服务商、协议、Base URL、模型和凭据；工作台统一经服务端中转，连接记录和调用状态更容易追踪。</p></div><button class="fh-ai-dialog__close" type="button" data-ai-close aria-label="关闭 AI 连接中心">×</button></div>' +
      '<div class="fh-ai-dialog__body"><aside class="fh-ai-profiles"><div class="fh-ai-profiles__head"><div><h3>连接配置</h3><small>可保存多个服务商与模型</small></div><button class="fh-ai-new" type="button" data-ai-new aria-label="新建连接配置">＋</button></div><div class="fh-ai-profile-list" data-ai-profile-list></div></aside>' +
      '<section class="fh-ai-editor"><div class="fh-ai-editor__head"><div><p class="fh-ai-editor__eyebrow">Active connection</p><h3 data-ai-editor-title>新连接</h3><p data-ai-editor-subtitle>保存后可随时切换当前模型</p></div><span class="fh-ai-status-pill" data-ai-status-pill>未检测</span></div>' +
      (!canEdit ? '<div class="fh-ai-lock">当前账号可以查看连接状态，但只有管理员可以维护模型配置；教师和学生会使用当前已启用的学校服务。</div>' : '') +
      '<form class="fh-ai-form" data-ai-form>' +
        '<section class="fh-ai-section"><div class="fh-ai-section__head"><div><h4>连接身份</h4><p>把一组可复用的网络模型连接保存成一个名字。</p></div></div><div class="fh-ai-grid"><div class="fh-ai-field"><label for="fh-ai-name">配置名称</label><input id="fh-ai-name" data-ai-field="name" maxlength="80" placeholder="例如：学校主模型 / 公网模型"' + (!canEdit ? ' disabled' : '') + '></div><div class="fh-ai-field"><label for="fh-ai-provider">服务商</label><select id="fh-ai-provider" data-ai-field="provider"' + (!canEdit ? ' disabled' : '') + '>' + providerOptions() + '</select><p class="fh-ai-help fh-ai-provider-meta" data-ai-provider-meta>从官方服务商目录选择，网址和协议会自动填充。</p></div></div></section>' +
        '<section class="fh-ai-section"><div class="fh-ai-section__head"><div><h4>协议与模型</h4><p>先选模型，再填写 API Key；Base URL 会随服务商自动填充，也可以按官方文档修改。</p></div><button class="fh-ai-inline-btn fh-ai-sync-btn" type="button" data-ai-sync-all' + (!canEdit ? ' disabled' : '') + '>同步全部厂家目录</button></div><div class="fh-ai-grid"><div class="fh-ai-field"><label for="fh-ai-protocol">接口协议</label><select id="fh-ai-protocol" data-ai-field="protocol"' + (!canEdit ? ' disabled' : '') + '>' + protocolOptions() + '</select><p class="fh-ai-help">选择与服务商一致的调用格式，系统会自动拼接请求路径。</p></div><div class="fh-ai-field"><label for="fh-ai-base">API Base URL</label><input id="fh-ai-base" data-ai-field="baseUrl" type="text" inputmode="url" placeholder="由服务商目录自动填充"' + (!canEdit ? ' disabled' : '') + '><p class="fh-ai-help">默认使用官方 HTTPS 地址；如使用自有网关，可手动替换。</p></div><div class="fh-ai-field fh-ai-field--wide"><label for="fh-ai-model">具体模型</label><div class="fh-ai-model-row"><select id="fh-ai-model" data-ai-field="model"' + (!canEdit ? ' disabled' : '') + '><option value="">先选择服务商</option></select><input id="fh-ai-model-manual" data-ai-manual-model type="text" maxlength="180" placeholder="该接口没有模型列表时，手动填写模型 ID" style="display:none"' + (!canEdit ? ' disabled' : '') + '><button class="fh-ai-inline-btn" type="button" data-ai-models' + (!canEdit ? ' disabled' : '') + '>刷新官方目录</button></div><p class="fh-ai-price" data-ai-model-price>价格/收费：选择具体模型后显示；免费模型也会明确标注。</p></div></div><div class="fh-ai-preview"><b>请求地址</b><span data-ai-endpoint-preview>尚未填写</span></div></section>' +
        '<section class="fh-ai-section"><div class="fh-ai-section__head"><div><h4>访问路径</h4><p>保留路由策略字段，实际工作台请求统一由服务端中转。</p></div></div><div class="fh-ai-route-grid" data-ai-routes>' + routeOptions() + '</div><div class="fh-ai-notice" data-ai-route-note>服务端中转会统一处理 HTTPS、协议适配、超时和调用留痕；API Key 不会写入业务记录。</div></section>' +
        '<section class="fh-ai-section"><div class="fh-ai-section__head"><div><h4>凭据</h4><p>当前设备只保存凭据副本；调用时临时提交给服务端中转，服务端不写入业务记录和工作流日志。</p></div></div><div class="fh-ai-field"><label for="fh-ai-key">API Key <small data-ai-key-state>未配置</small></label><div class="fh-ai-key-row"><input id="fh-ai-key" data-ai-field="apiKey" type="password" autocomplete="new-password" placeholder="已保存的 Key 会保持隐藏；留空表示保留"' + (!canEdit ? ' disabled' : '') + '><button class="fh-ai-clear-key" type="button" data-ai-clear-key' + (!canEdit ? ' disabled' : '') + '>清除设备 Key</button></div><p class="fh-ai-help" data-ai-key-help>输入后只保存在当前设备，不要把 Key 写进项目文件、截图或提交记录。</p></div><div class="fh-ai-field fh-ai-field--wide" style="margin-top:12px"><label for="fh-ai-headers">额外 HTTP Headers <small>可选 JSON</small></label><textarea id="fh-ai-headers" data-ai-field="headers" rows="3" placeholder="例如：{&quot;X-Organization&quot;:&quot;school-a&quot;}"' + (!canEdit ? ' disabled' : '') + '></textarea><p class="fh-ai-help">仅用于网关租户、项目标识等自定义请求头；不要在这里重复填写 Authorization。</p></div></section>' +
      '</form><div class="fh-ai-editor__foot"><span class="fh-ai-foot-status" data-ai-foot-status>连接配置只保存在当前设备，可随时切换。</span><button class="fh-ai-btn fh-ai-btn--danger" type="button" data-ai-delete' + (!canEdit ? ' disabled' : '') + '>删除配置</button><button class="fh-ai-btn" type="button" data-ai-test>检测连接</button><button class="fh-ai-btn fh-ai-btn--primary" type="button" data-ai-save' + (!canEdit ? ' disabled' : '') + '>保存并启用</button></div>' +
      '</section></div></div></div>';

    function query(selector) { return root.querySelector(selector); }
    function fields() { return root.querySelectorAll('[data-ai-field]'); }
    function field(name) { return root.querySelector('[data-ai-field="' + name + '"]'); }
    function notify(message, kind) {
      if (typeof opts.showToast === 'function') opts.showToast(message, kind || 'info');
      else {
        var toast = query('[data-ai-toast]');
        if (!toast) { toast = document.createElement('div'); toast.className = 'fh-ai-toast'; toast.setAttribute('data-ai-toast', ''); root.appendChild(toast); }
        toast.textContent = message; toast.classList.add('is-visible'); window.clearTimeout(internalToastTimer); internalToastTimer = window.setTimeout(function () { toast.classList.remove('is-visible'); }, 2500);
      }
    }
    function endpointForDraft(value) {
      var protocol = (window.AI.PROTOCOLS || {})[value.protocol] || window.AI.PROTOCOLS['openai-chat'];
      var base = baseFromEndpoint(value.baseUrl || value.endpoint);
      return base ? base + (value.endpointPath || protocol.suffix) : '填写 Base URL 后生成';
    }
    function paintProviderMeta(providerId) {
      var meta = providerMeta(providerId);
      var target = query('[data-ai-provider-meta]');
      if (!target) return;
      if (!meta) { target.textContent = '自定义接口：请手动填写 Base URL、协议和模型 ID。'; return; }
      var status = meta.status === 'active' ? '目录已同步' : meta.status === 'error' ? '目录同步出现错误' : '目录未同步';
      var link = meta.docsUrl ? ' <a href="' + esc(meta.docsUrl) + '" target="_blank" rel="noreferrer">查看官方接口文档</a>' : '';
      target.innerHTML = esc(status) + ' · ' + esc(meta.kind === 'aggregator' ? '聚合平台' : '原始厂家') + link;
    }
    function paintModelPrice(item) {
      var target = query('[data-ai-model-price]');
      if (!target) return;
      if (!item) { target.textContent = '价格/收费：选择具体模型后显示；免费模型也会明确标注。'; return; }
      target.innerHTML = esc(pricingText(item)) + (item.pricingUrl ? ' <a href="' + esc(item.pricingUrl) + '" target="_blank" rel="noreferrer">官方定价</a>' : '');
    }
    function renderModelChoices(providerId, selected) {
      var select = field('model');
      var manual = query('[data-ai-manual-model]');
      if (!select) return;
      var items = modelsForProvider(providerId).slice().sort(function (a, b) { return String(a.officialName || a.providerModelId).localeCompare(String(b.officialName || b.providerModelId)); });
      var options = '<option value="">选择具体模型</option>';
      if (items.length) options += items.map(function (item) { return '<option value="' + esc(item.providerModelId) + '">' + esc(item.officialName || item.providerModelId) + '</option>'; }).join('');
      if (selected && !items.some(function (item) { return item.providerModelId === selected; })) options += '<option value="' + esc(selected) + '">当前配置模型 · ' + esc(selected) + '</option>';
      if (!items.length && !selected) options += '<option value="" disabled>刷新官方目录后显示模型</option>';
      select.innerHTML = options;
      select.value = selected || '';
      var useManual = !items.length && !selected && !providerMeta(providerId);
      select.style.display = useManual ? 'none' : '';
      if (manual) { manual.style.display = useManual ? '' : 'none'; manual.disabled = !canEdit || !useManual; manual.value = useManual ? (selected || '') : ''; }
      var current = items.find(function (item) { return item.providerModelId === select.value; });
      paintModelPrice(current || null);
    }
    function refreshProviderOptions(selected) {
      var select = field('provider');
      if (!select) return;
      select.innerHTML = providerOptions();
      var value = selected || select.value || 'openrouter';
      if (!providerMeta(value) && !Array.prototype.some.call(select.options, function (item) { return item.value === value; })) {
        select.insertAdjacentHTML('beforeend', '<option value="' + esc(value) + '">当前配置服务商 · ' + esc(value) + '</option>');
      }
      select.value = value;
      paintProviderMeta(value);
      renderModelChoices(value, field('model') && field('model').value);
      var refreshButton = query('[data-ai-models]');
      if (refreshButton) refreshButton.disabled = !canEdit || !providerMeta(value);
    }
    function draftFromForm() {
      var apiKey = field('apiKey').value.trim();
      var activeRoute = query('[data-ai-route].is-active');
      var modelSelect = field('model');
      var manualModel = query('[data-ai-manual-model]');
      return {
        id: draft.id,
        name: field('name').value.trim(),
        provider: field('provider').value,
        protocol: field('protocol').value,
        baseUrl: field('baseUrl').value.trim(),
        endpointPath: draft.endpointPath || ((providerMeta(field('provider').value) || {}).metadata || {}).endpointPath || '',
        model: (manualModel && !manualModel.disabled ? manualModel.value : modelSelect.value).trim(),
        mode: activeRoute ? activeRoute.getAttribute('data-ai-route') : (draft.mode || 'auto'),
        apiKey: apiKey,
        clearKey: clearKeyRequested,
        headers: field('headers').value.trim()
      };
    }
    function paintStatus(result) {
      var pill = query('[data-ai-status-pill]');
      if (!pill) return;
      pill.classList.remove('is-ok', 'is-warn');
      if (!result) { pill.textContent = '未检测'; return; }
      pill.textContent = result.ok ? ('已连接 · ' + (result.route === 'relay' ? '服务端' : '浏览器')) : '连接失败';
      pill.classList.add(result.ok ? 'is-ok' : 'is-warn');
    }
    function renderProfiles() {
      var list = query('[data-ai-profile-list]');
      if (!list) return;
      var current = window.AI.getProfiles();
      if (!current.length) { list.innerHTML = '<div class="fh-ai-empty">还没有连接配置。点击右上角“＋”创建一个，或直接编辑右侧的默认配置。</div>'; return; }
      list.innerHTML = current.map(function (profile) {
        return '<button class="fh-ai-profile' + (profile.id === selectedId ? ' is-selected' : '') + '" type="button" data-ai-profile="' + esc(profile.id) + '"><span class="fh-ai-profile__top"><span class="fh-ai-profile__name">' + esc(profile.name) + '</span>' + (profile.id === activeId ? '<span class="fh-ai-profile__active">当前</span>' : '') + '</span><span class="fh-ai-profile__provider">' + esc(profile.providerName) + '</span><span class="fh-ai-profile__meta"><span>' + esc(profile.model || '未填写模型') + '</span><span>' + esc(profile.modeLabel || '智能路由') + '</span></span></button>';
      }).join('');
      list.querySelectorAll('[data-ai-profile]').forEach(function (button) {
        button.addEventListener('click', function () {
          selectedId = button.getAttribute('data-ai-profile');
          draft = window.AI.getProfile(selectedId, false) || window.AI.defaultProfile('openrouter');
          clearKeyRequested = false;
          activeId = window.AI.getConfig().activeProfileId || activeId;
          renderEditor(); renderProfiles();
        });
      });
    }
    function renderEditor() {
      var profile = draft || window.AI.defaultProfile('openrouter');
      field('name').value = profile.name || '';
      refreshProviderOptions(profile.provider || 'openrouter');
      field('protocol').value = profile.protocol || 'openai-chat';
      field('baseUrl').value = profile.baseUrl || baseFromEndpoint(profile.endpoint || '');
      renderModelChoices(profile.provider || 'openrouter', profile.model || '');
      field('apiKey').value = '';
      field('headers').value = profile.headers || '';
      root.querySelectorAll('[data-ai-route]').forEach(function (route) { route.classList.toggle('is-active', route.getAttribute('data-ai-route') === (profile.mode || 'auto')); var radio = route.querySelector('input'); if (radio) radio.checked = route.classList.contains('is-active'); });
      query('[data-ai-editor-title]').textContent = profile.name || '新连接';
      query('[data-ai-editor-subtitle]').textContent = profile.providerName || ((providerMeta(profile.provider) || {}).name || '选择服务商');
      var keyState = query('[data-ai-key-state]');
      if (keyState) keyState.textContent = profile.hasKey ? '已保存（隐藏）' : '未配置';
      var keyHelp = query('[data-ai-key-help]');
      if (keyHelp) keyHelp.textContent = profile.hasKey ? '已存在设备 Key；留空会保留旧 Key，输入新值会替换。' : '输入后只保存在当前设备，调用时临时提交给服务端中转。';
      query('[data-ai-endpoint-preview]').textContent = endpointForDraft(profile);
      var last = profile.lastTest ? { ok: profile.lastTest.ok, route: profile.lastTest.route, message: profile.lastTest.message } : null;
      paintStatus(last);
      query('[data-ai-foot-status]').textContent = last ? (last.message || '已记录最近一次检测') : '连接配置只保存在当前设备，可随时切换。';
      paintProviderMeta(profile.provider || 'openrouter');
      updateRouteNote();
    }
    function updateRouteNote() {
      var active = query('[data-ai-route].is-active');
      var mode = active ? active.getAttribute('data-ai-route') : 'auto';
      var route = window.AI.ROUTES[mode] || window.AI.ROUTES.auto;
      query('[data-ai-route-note]').textContent = route.desc + '。当前工作台统一经服务端中转，服务端环境变量仍是生产环境的推荐凭据来源。';
    }
    function setProviderDefaults() {
      var selectedProvider = field('provider').value;
      var p = providerMeta(selectedProvider) || (window.AI.PROVIDERS || {}).custom || {};
      field('baseUrl').value = p.apiBase || baseFromEndpoint(p.endpoint || '');
      field('protocol').value = (p.metadata && p.metadata.protocol) || p.protocol || 'openai-chat';
      draft.endpointPath = (p.metadata && p.metadata.endpointPath) || '';
      renderModelChoices(selectedProvider, '');
      paintProviderMeta(selectedProvider);
      query('[data-ai-endpoint-preview]').textContent = endpointForDraft(draftFromForm());
      updateRouteNote();
    }
    function close() { root.innerHTML = ''; }
    query('[data-ai-close]').addEventListener('click', close);
    query('.fh-ai-mask').addEventListener('click', function (event) { if (event.target === event.currentTarget) close(); });
    field('provider').addEventListener('change', setProviderDefaults);
    field('protocol').addEventListener('change', function () { query('[data-ai-endpoint-preview]').textContent = endpointForDraft(draftFromForm()); });
    field('baseUrl').addEventListener('input', function () { query('[data-ai-endpoint-preview]').textContent = endpointForDraft(draftFromForm()); });
    field('model').addEventListener('change', function () {
      var item = modelsForProvider(field('provider').value).find(function (model) { return model.providerModelId === field('model').value; });
      paintModelPrice(item || null);
      query('[data-ai-editor-title]').textContent = field('name').value.trim() || '新连接';
    });
    query('[data-ai-manual-model]').addEventListener('input', function () { query('[data-ai-model-price]').textContent = '价格/收费：自定义接口，收费由服务商官方定价。'; });
    field('name').addEventListener('input', function () { query('[data-ai-editor-title]').textContent = field('name').value.trim() || '新连接'; });
    root.querySelectorAll('[data-ai-route]').forEach(function (route) { route.addEventListener('click', function () { if (!canEdit) return; root.querySelectorAll('[data-ai-route]').forEach(function (item) { item.classList.remove('is-active'); }); route.classList.add('is-active'); route.querySelector('input').checked = true; updateRouteNote(); }); });
    query('[data-ai-clear-key]').addEventListener('click', function () { if (!canEdit) return; clearKeyRequested = true; field('apiKey').value = ''; query('[data-ai-key-state]').textContent = '将被清除'; query('[data-ai-key-help]').textContent = '保存后会删除当前设备上的 Key；如需保留，请直接关闭窗口。'; });
    query('[data-ai-new]').addEventListener('click', function () { if (!canEdit) return; draft = window.AI.defaultProfile('openrouter'); selectedId = draft.id; clearKeyRequested = false; renderEditor(); renderProfiles(); });
    query('[data-ai-delete]').addEventListener('click', function () { if (!canEdit || !selectedId || !window.AI.getProfile(selectedId)) return; if (!window.confirm('删除这组 AI 连接配置？')) return; window.AI.removeProfile(selectedId); var next = window.AI.getProfiles()[0]; if (next) { selectedId = next.id; draft = window.AI.getProfile(selectedId, false); } else { selectedId = ''; draft = window.AI.defaultProfile('openrouter'); } clearKeyRequested = false; renderEditor(); renderProfiles(); notify('连接配置已删除', 'success'); });
    query('[data-ai-test]').addEventListener('click', async function () {
      var button = query('[data-ai-test]'); var value = draftFromForm();
      if (!value.baseUrl || !value.model) { paintStatus({ ok: false }); query('[data-ai-foot-status]').textContent = '请先填写 Base URL 和模型 ID'; return; }
      button.disabled = true; button.textContent = '检测中…'; query('[data-ai-foot-status]').textContent = '正在检测服务端中转…';
      try { var result = await window.AI.testProfile(value); paintStatus(result); query('[data-ai-foot-status]').textContent = result.message || '检测完成'; if (result.ok) notify('AI 连接测试通过', 'success'); } catch (error) { paintStatus({ ok: false }); query('[data-ai-foot-status]').textContent = error.message || '检测失败'; } finally { button.disabled = false; button.textContent = '检测连接'; }
    });
    query('[data-ai-models]').addEventListener('click', async function () {
      var button = query('[data-ai-models]'); button.disabled = true; button.textContent = '读取中…';
      try {
        var network = window.FHNetwork;
        var url = network && network.url ? network.url('/api/admin/models/sync') : '/api/admin/models/sync';
        var headers = network && network.headers ? network.headers({ 'Content-Type': 'application/json' }) : { 'Content-Type': 'application/json' };
        var response = await fetch(url, { method: 'POST', headers: headers, body: JSON.stringify({ provider: field('provider').value, apiKey: field('apiKey').value.trim() }) });
        var sync = await response.json().catch(function () { return {}; });
        if (!response.ok || !sync.ok) throw new Error(sync.msg || (sync.results && sync.results[0] && sync.results[0].message) || '官方目录同步失败');
        if (window.FH_REFERENCE_DATA && typeof window.FH_REFERENCE_DATA.loadModels === 'function') await window.FH_REFERENCE_DATA.loadModels(true);
        refreshProviderOptions(field('provider').value);
        var count = sync.results && sync.results[0] ? sync.results[0].modelCount : 0;
        notify('已同步 ' + count + ' 个官方模型', 'success');
        query('[data-ai-foot-status]').textContent = '模型名称、价格和可用状态已从官方接口刷新；本次 Key 仅用于同步，不写入同步记录';
      } catch (error) { query('[data-ai-foot-status]').textContent = error.message || '读取模型失败'; } finally { button.disabled = !canEdit ? true : false; button.textContent = '刷新官方目录'; }
    });
    query('[data-ai-sync-all]').addEventListener('click', async function () {
      if (!canEdit) return;
      var button = query('[data-ai-sync-all]');
      button.disabled = true; button.textContent = '同步中…';
      try {
        var network = window.FHNetwork;
        var url = network && network.url ? network.url('/api/admin/models/sync') : '/api/admin/models/sync';
        var headers = network && network.headers ? network.headers({ 'Content-Type': 'application/json' }) : { 'Content-Type': 'application/json' };
        var response = await fetch(url, { method: 'POST', headers: headers, body: JSON.stringify({}) });
        var result = await response.json().catch(function () { return {}; });
        if (!response.ok || !result.ok) throw new Error(result.msg || '官方目录同步失败');
        if (window.FH_REFERENCE_DATA && typeof window.FH_REFERENCE_DATA.loadModels === 'function') await window.FH_REFERENCE_DATA.loadModels(true);
        refreshProviderOptions(field('provider').value);
        notify('全部厂家目录已同步', 'success');
        query('[data-ai-foot-status]').textContent = '模型名称、价格和可用状态已从官方接口刷新';
      } catch (error) {
        query('[data-ai-foot-status]').textContent = error.message || '官方目录同步失败';
      } finally { button.disabled = false; button.textContent = '同步全部厂家目录'; }
    });
    query('[data-ai-save]').addEventListener('click', function () {
      if (!canEdit) return;
      var value = draftFromForm();
      if (!value.name) { notify('请先填写配置名称', 'error'); field('name').focus(); return; }
      if (!/^https?:\/\//i.test(value.baseUrl)) { notify('Base URL 需要以 http:// 或 https:// 开头', 'error'); field('baseUrl').focus(); return; }
      try { new URL(value.baseUrl); } catch (error) { notify('Base URL 格式不正确', 'error'); field('baseUrl').focus(); return; }
      if (!value.model) { notify('请填写模型 ID', 'error'); var modelInput = query('[data-ai-manual-model]:not([disabled])') || field('model'); modelInput.focus(); return; }
      try { var saved = window.AI.saveProfile(value, { activate: true }); selectedId = saved.id; activeId = saved.id; draft = window.AI.getProfile(selectedId, false); clearKeyRequested = false; renderEditor(); renderProfiles(); notify('连接已保存并启用', 'success'); } catch (error) { notify(error.message || '保存失败', 'error'); }
    });
    query('[data-ai-form]').addEventListener('submit', function (event) { event.preventDefault(); query('[data-ai-save]').click(); });
    fields().forEach(function (item) { item.addEventListener('keydown', function (event) { if (event.key === 'Enter' && item.tagName !== 'TEXTAREA') event.stopPropagation(); }); });
    renderEditor(); renderProfiles();
    if (window.FH_REFERENCE_DATA && typeof window.FH_REFERENCE_DATA.loadModels === 'function') {
      window.FH_REFERENCE_DATA.loadModels(true).then(function () { refreshProviderOptions(field('provider').value); }).catch(function () {});
    }
  }

  window.FH_AI_SETTINGS = { open: open };
}());
