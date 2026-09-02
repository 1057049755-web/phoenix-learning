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
  function providerOptions() {
    return Object.keys(window.AI.PROVIDERS || {}).map(function (id) {
      return '<option value="' + esc(id) + '">' + esc(window.AI.PROVIDERS[id].name || id) + '</option>';
    }).join('');
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
    var wasModalLocked = document.documentElement.classList.contains('fh-ai-modal-open');
    document.documentElement.classList.add('fh-ai-modal-open');
    var profiles = window.AI.getProfiles();
    var activeId = window.AI.getConfig().activeProfileId || (profiles[0] && profiles[0].id) || '';
    var selectedId = activeId;
    var draft = selectedId ? window.AI.getProfile(selectedId, false) : window.AI.defaultProfile('openrouter');
    if (!draft) draft = window.AI.defaultProfile('openrouter');
    var clearKeyRequested = false;
    var internalToastTimer;

    root.innerHTML = '<div class="dialog-mask fh-ai-mask"><div class="dialog fh-ai-dialog" role="dialog" aria-modal="true" aria-labelledby="fh-ai-dialog-title">' +
      '<div class="fh-ai-dialog__head"><div><span class="fh-ai-dialog__kicker">Model Gateway / Network Ready</span><h2 class="fh-ai-dialog__title" id="fh-ai-dialog-title">AI 连接中心</h2><p class="fh-ai-dialog__subtitle">像连接一个 AI harness 一样管理模型：选择服务商、协议、Base URL、模型和凭据，再决定请求走服务端中转还是浏览器直连。</p></div><button class="fh-ai-dialog__close" type="button" data-ai-close aria-label="关闭 AI 连接中心">×</button></div>' +
      '<div class="fh-ai-dialog__body"><aside class="fh-ai-profiles"><div class="fh-ai-profiles__head"><div><h3>连接配置</h3><small>可保存多个 provider / model</small></div><button class="fh-ai-new" type="button" data-ai-new aria-label="新建连接配置">＋</button></div><div class="fh-ai-profile-list" data-ai-profile-list></div></aside>' +
      '<section class="fh-ai-editor"><div class="fh-ai-editor__head"><div><p class="fh-ai-editor__eyebrow">Active connection</p><h3 data-ai-editor-title>新连接</h3><p data-ai-editor-subtitle>保存后可随时切换当前模型</p></div><span class="fh-ai-status-pill" data-ai-status-pill>未检测</span></div>' +
      (!canEdit ? '<div class="fh-ai-lock">当前账号可以查看连接状态，但只有管理员可以维护模型配置；教师和学生会使用当前已启用的学校服务。</div>' : '') +
      '<form class="fh-ai-form" data-ai-form>' +
        '<section class="fh-ai-section"><div class="fh-ai-section__head"><div><h4>连接身份</h4><p>把一组可复用的网络模型连接保存成一个名字。</p></div></div><div class="fh-ai-grid"><div class="fh-ai-field"><label for="fh-ai-name">配置名称</label><input id="fh-ai-name" data-ai-field="name" maxlength="80" placeholder="例如：学校主模型 / 公网模型"' + (!canEdit ? ' disabled' : '') + '></div><div class="fh-ai-field"><label for="fh-ai-provider">服务商预设</label><select id="fh-ai-provider" data-ai-field="provider"' + (!canEdit ? ' disabled' : '') + '>' + providerOptions() + '</select></div></div></section>' +
        '<section class="fh-ai-section"><div class="fh-ai-section__head"><div><h4>协议与模型</h4><p>Base URL 只填写服务根地址，系统会根据协议补齐请求路径。</p></div></div><div class="fh-ai-grid"><div class="fh-ai-field"><label for="fh-ai-protocol">Wire protocol</label><select id="fh-ai-protocol" data-ai-field="protocol"' + (!canEdit ? ' disabled' : '') + '>' + protocolOptions() + '</select><p class="fh-ai-help">兼容 OpenAI Chat、OpenAI Responses、Anthropic Messages 三种常见 harness 接口。</p></div><div class="fh-ai-field"><label for="fh-ai-base">Base URL</label><input id="fh-ai-base" data-ai-field="baseUrl" type="text" inputmode="url" placeholder="https://api.example.com/v1"' + (!canEdit ? ' disabled' : '') + '><p class="fh-ai-help">建议使用 HTTPS 公网地址；浏览器直连时需服务商开放跨域。</p></div><div class="fh-ai-field fh-ai-field--wide"><label for="fh-ai-model">模型 ID <small>优先使用服务商返回的真实 ID</small></label><div class="fh-ai-model-row"><input id="fh-ai-model" data-ai-field="model" list="fh-ai-model-list" maxlength="180" placeholder="例如：gpt-4.1-mini"' + (!canEdit ? ' disabled' : '') + '><button class="fh-ai-inline-btn" type="button" data-ai-models' + (!canEdit ? ' disabled' : '') + '>读取模型列表</button></div><datalist id="fh-ai-model-list"></datalist></div></div><div class="fh-ai-preview"><b>请求地址</b><span data-ai-endpoint-preview>尚未填写</span></div></section>' +
        '<section class="fh-ai-section"><div class="fh-ai-section__head"><div><h4>访问路径</h4><p>默认智能路由；网络端推荐把 Key 留在服务端环境变量中。</p></div></div><div class="fh-ai-route-grid" data-ai-routes>' + routeOptions() + '</div><div class="fh-ai-notice" data-ai-route-note>智能路由会优先调用服务端中转，失败时尝试浏览器直连；若站点没有 CORS 权限，建议改用服务端中转。</div></section>' +
        '<section class="fh-ai-section"><div class="fh-ai-section__head"><div><h4>凭据</h4><p>浏览器只保存当前设备的凭据副本；选择服务端中转时不会把 Key 放进请求正文。</p></div></div><div class="fh-ai-field"><label for="fh-ai-key">API Key <small data-ai-key-state>未配置</small></label><div class="fh-ai-key-row"><input id="fh-ai-key" data-ai-field="apiKey" type="password" autocomplete="new-password" placeholder="已保存的 Key 会保持隐藏；留空表示保留"' + (!canEdit ? ' disabled' : '') + '><button class="fh-ai-clear-key" type="button" data-ai-clear-key' + (!canEdit ? ' disabled' : '') + '>清除设备 Key</button></div><p class="fh-ai-help" data-ai-key-help>仅在浏览器直连时发送；不要把 Key 写进项目文件、截图或提交记录。</p></div><div class="fh-ai-field fh-ai-field--wide" style="margin-top:12px"><label for="fh-ai-headers">额外 HTTP Headers <small>可选 JSON</small></label><textarea id="fh-ai-headers" data-ai-field="headers" rows="3" placeholder="例如：{&quot;X-Organization&quot;:&quot;school-a&quot;}"' + (!canEdit ? ' disabled' : '') + '></textarea><p class="fh-ai-help">仅用于网关租户、项目标识等自定义请求头；不要在这里重复填写 Authorization。</p></div></section>' +
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
      return base ? base + protocol.suffix : '填写 Base URL 后生成';
    }
    function draftFromForm() {
      var apiKey = field('apiKey').value.trim();
      var activeRoute = query('[data-ai-route].is-active');
      return {
        id: draft.id,
        name: field('name').value.trim(),
        provider: field('provider').value,
        protocol: field('protocol').value,
        baseUrl: field('baseUrl').value.trim(),
        model: field('model').value.trim(),
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
      pill.textContent = result.ok ? ('已连接 · ' + (result.route === 'relay' ? '服务端' : '浏览器')) : '待处理';
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
      field('provider').value = profile.provider || 'openrouter';
      field('protocol').value = profile.protocol || 'openai-chat';
      field('baseUrl').value = profile.baseUrl || baseFromEndpoint(profile.endpoint || '');
      field('model').value = profile.model || '';
      field('apiKey').value = '';
      field('headers').value = profile.headers || '';
      root.querySelectorAll('[data-ai-route]').forEach(function (route) { route.classList.toggle('is-active', route.getAttribute('data-ai-route') === (profile.mode || 'auto')); var radio = route.querySelector('input'); if (radio) radio.checked = route.classList.contains('is-active'); });
      query('[data-ai-editor-title]').textContent = profile.name || '新连接';
      query('[data-ai-editor-subtitle]').textContent = profile.providerName || ((window.AI.PROVIDERS[profile.provider] || {}).name || '选择服务商');
      var keyState = query('[data-ai-key-state]');
      if (keyState) keyState.textContent = profile.hasKey ? '已保存（隐藏）' : '未配置';
      var keyHelp = query('[data-ai-key-help]');
      if (keyHelp) keyHelp.textContent = profile.hasKey ? '已存在设备 Key；留空会保留旧 Key，输入新值会替换。' : '仅在浏览器直连时发送；不要把 Key 写进项目文件、截图或提交记录。';
      query('[data-ai-endpoint-preview]').textContent = endpointForDraft(profile);
      var last = profile.lastTest ? { ok: profile.lastTest.ok, route: profile.lastTest.route, message: profile.lastTest.message } : null;
      paintStatus(last);
      query('[data-ai-foot-status]').textContent = last ? (last.message || '已记录最近一次检测') : '连接配置只保存在当前设备，可随时切换。';
      updateRouteNote();
    }
    function updateRouteNote() {
      var active = query('[data-ai-route].is-active');
      var mode = active ? active.getAttribute('data-ai-route') : 'auto';
      var route = window.AI.ROUTES[mode] || window.AI.ROUTES.auto;
      query('[data-ai-route-note]').textContent = route.desc + '。网络端建议使用独立 API 服务，在服务端环境变量里保存 Key。';
    }
    function setProviderDefaults() {
      var p = window.AI.PROVIDERS[field('provider').value] || window.AI.PROVIDERS.custom;
      field('baseUrl').value = baseFromEndpoint(p.endpoint || '');
      field('protocol').value = p.protocol || 'openai-chat';
      field('model').value = p.model || '';
      query('[data-ai-endpoint-preview]').textContent = endpointForDraft(draftFromForm());
      updateRouteNote();
    }
    function close() {
      root.innerHTML = '';
      if (!wasModalLocked) document.documentElement.classList.remove('fh-ai-modal-open');
    }
    query('[data-ai-close]').addEventListener('click', close);
    query('.fh-ai-mask').addEventListener('click', function (event) { if (event.target === event.currentTarget) close(); });
    field('provider').addEventListener('change', setProviderDefaults);
    field('protocol').addEventListener('change', function () { query('[data-ai-endpoint-preview]').textContent = endpointForDraft(draftFromForm()); });
    field('baseUrl').addEventListener('input', function () { query('[data-ai-endpoint-preview]').textContent = endpointForDraft(draftFromForm()); });
    field('model').addEventListener('input', function () { query('[data-ai-editor-title]').textContent = field('name').value.trim() || '新连接'; });
    field('name').addEventListener('input', function () { query('[data-ai-editor-title]').textContent = field('name').value.trim() || '新连接'; });
    root.querySelectorAll('[data-ai-route]').forEach(function (route) { route.addEventListener('click', function () { if (!canEdit) return; root.querySelectorAll('[data-ai-route]').forEach(function (item) { item.classList.remove('is-active'); }); route.classList.add('is-active'); route.querySelector('input').checked = true; updateRouteNote(); }); });
    query('[data-ai-clear-key]').addEventListener('click', function () { if (!canEdit) return; clearKeyRequested = true; field('apiKey').value = ''; query('[data-ai-key-state]').textContent = '将被清除'; query('[data-ai-key-help]').textContent = '保存后会删除当前设备上的 Key；如需保留，请直接关闭窗口。'; });
    query('[data-ai-new]').addEventListener('click', function () { if (!canEdit) return; draft = window.AI.defaultProfile('openrouter'); selectedId = draft.id; clearKeyRequested = false; renderEditor(); renderProfiles(); });
    query('[data-ai-delete]').addEventListener('click', function () { if (!canEdit || !selectedId || !window.AI.getProfile(selectedId)) return; if (!window.confirm('删除这组 AI 连接配置？')) return; window.AI.removeProfile(selectedId); var next = window.AI.getProfiles()[0]; if (next) { selectedId = next.id; draft = window.AI.getProfile(selectedId, false); } else { selectedId = ''; draft = window.AI.defaultProfile('openrouter'); } clearKeyRequested = false; renderEditor(); renderProfiles(); notify('连接配置已删除', 'success'); });
    query('[data-ai-test]').addEventListener('click', async function () {
      var button = query('[data-ai-test]'); var value = draftFromForm();
      if (!value.baseUrl || !value.model) { paintStatus({ ok: false }); query('[data-ai-foot-status]').textContent = '请先填写 Base URL 和模型 ID'; return; }
      button.disabled = true; button.textContent = '检测中…'; query('[data-ai-foot-status]').textContent = '正在检测服务端中转与浏览器直连…';
      try { var result = await window.AI.testProfile(value); paintStatus(result); query('[data-ai-foot-status]').textContent = result.message || '检测完成'; if (result.ok) notify('AI 连接测试通过', 'success'); } catch (error) { paintStatus({ ok: false }); query('[data-ai-foot-status]').textContent = error.message || '检测失败'; } finally { button.disabled = false; button.textContent = '检测连接'; }
    });
    query('[data-ai-models]').addEventListener('click', async function () {
      var button = query('[data-ai-models]'); button.disabled = true; button.textContent = '读取中…';
      try { var result = await window.AI.listModels(draftFromForm()); var datalist = query('#fh-ai-model-list'); if (result.ok && result.models.length) { datalist.innerHTML = result.models.map(function (item) { return '<option value="' + esc(item.id) + '">' + esc(item.name) + '</option>'; }).join(''); notify('已读取 ' + result.models.length + ' 个模型', 'success'); query('[data-ai-foot-status]').textContent = result.message; } else query('[data-ai-foot-status]').textContent = result.message || '没有读取到模型'; } catch (error) { query('[data-ai-foot-status]').textContent = error.message || '读取模型失败'; } finally { button.disabled = !canEdit ? true : false; button.textContent = '读取模型列表'; }
    });
    query('[data-ai-save]').addEventListener('click', function () {
      if (!canEdit) return;
      var value = draftFromForm();
      if (!value.name) { notify('请先填写配置名称', 'error'); field('name').focus(); return; }
      if (!/^https?:\/\//i.test(value.baseUrl)) { notify('Base URL 需要以 http:// 或 https:// 开头', 'error'); field('baseUrl').focus(); return; }
      try { new URL(value.baseUrl); } catch (error) { notify('Base URL 格式不正确', 'error'); field('baseUrl').focus(); return; }
      if (!value.model) { notify('请填写模型 ID', 'error'); field('model').focus(); return; }
      try { var saved = window.AI.saveProfile(value, { activate: true }); selectedId = saved.id; activeId = saved.id; draft = window.AI.getProfile(selectedId, false); clearKeyRequested = false; renderEditor(); renderProfiles(); notify('连接已保存并启用', 'success'); } catch (error) { notify(error.message || '保存失败', 'error'); }
    });
    query('[data-ai-form]').addEventListener('submit', function (event) { event.preventDefault(); query('[data-ai-save]').click(); });
    fields().forEach(function (item) { item.addEventListener('keydown', function (event) { if (event.key === 'Enter' && item.tagName !== 'TEXTAREA') event.stopPropagation(); }); });
    renderEditor(); renderProfiles();
  }

  window.FH_AI_SETTINGS = { open: open };
}());
