/* 资料采集工作台
 * 教师端只提交公开 HTTPS 来源或自己有权使用的正文，学生端继续使用学习资料视图。
 */
(function () {
  'use strict';
  const app = window.__app;
  if (!app || !window.__pages) return;
  const state = app.state;
  const DB = app.DB;
  const esc = app.esc;
  const icon = app.icon;
  const nav = app.nav;
  const originalResources = window.__pages['/resources'];
  const notice = (message, type) => '<div class="wf-notice' + (type ? ' wf-notice--' + type : '') + '">' + esc(message) + '</div>';
  const apiReady = () => DB.cloudInfo && DB.cloudInfo().cloud && window.FHNetwork && window.FHNetwork.url;
  const request = async (path, options) => {
    if (!apiReady()) throw new Error('学校数据服务未连接，当前资料不会保存到服务端。');
    const response = await fetch(window.FHNetwork.url(path), Object.assign({ headers: window.FHNetwork.headers({ 'Content-Type': 'application/json' }) }, options || {}));
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.ok) throw new Error(payload.msg || '资料服务暂时不可用');
    return payload;
  };
  const sourceRows = () => Array.isArray(state.wfSources) ? state.wfSources : [];
  function sourceCard(item) {
    const link = item.sourceUrl ? '<a class="wf-source" href="' + esc(item.sourceUrl) + '" target="_blank" rel="noreferrer">打开来源</a>' : '<span class="wf-muted">教师补充正文</span>';
    const method = item.acquisitionMethod === 'direct' ? '公开网页采集' : '手动补充';
    const quality = item.failureReason ? '采集失败：' + item.failureReason : method + ' · 完整度 ' + Math.round(Number(item.completeness || 0) * 100) + '%';
    return '<article class="wf-queue-item"><span class="wf-queue-item__icon">' + icon('res', 18) + '</span><div class="wf-queue-item__main"><strong>' + esc(item.title || '未命名资料') + '</strong><span>' + esc(quality) + '</span><small class="wf-muted">' + esc(item.createdAt || '') + '</small></div><div class="wf-inline-actions">' + link + '</div></article>';
  }
  function render() {
    if (state.role === 'student') return originalResources && originalResources();
    const rows = sourceRows();
    app.renderPage('<div class="wf-page"><div class="wf-hero"><div><div class="wf-kicker">Source Intake</div><h1 class="wf-title">资料采集工作台</h1><p class="wf-subtitle">先采集公开 HTTPS 页面；受限页面不会被绕过。直接采集失败后，可由教师补充自己有权使用的正文。</p></div><div class="wf-actions"><button type="button" class="btn btn-outline" data-source-wf-action="refresh">刷新记录</button></div></div>' +
      '<div class="wf-grid"><section class="wf-card"><div class="wf-card__head"><div><h2>新增资料来源</h2><p>来源、解析方式、完整度和失败原因会随记录保存。</p></div></div><div class="wf-card__body"><form id="source-wf-form" class="wf-form"><div class="wf-field"><label for="source-wf-mode">采集方式</label><select class="select" id="source-wf-mode"><option value="direct">公开网页直接采集</option><option value="manual">教师手动补充</option></select></div><div class="wf-field"><label for="source-wf-title">资料标题</label><input class="input" id="source-wf-title" maxlength="240" placeholder="例如：2026 年课程实施意见"></div><div class="wf-field"><label for="source-wf-url">来源链接</label><input class="input" id="source-wf-url" type="url" maxlength="1000" placeholder="https://官方来源地址"></div><div class="wf-field wf-field--full"><label for="source-wf-content">正文（手动补充时填写）</label><textarea class="textarea" id="source-wf-content" rows="9" maxlength="600000" placeholder="仅粘贴你有权使用的正文内容；直接采集方式无需填写"></textarea><p class="wf-help">系统不会绕过登录、付费墙、验证码、访问控制或 robots.txt。</p></div><div class="wf-field wf-field--full"><label for="source-wf-summary">摘要（可选）</label><textarea class="textarea" id="source-wf-summary" rows="3" maxlength="1000" placeholder="补充资料用途或摘要"></textarea></div><div class="wf-inline-actions"><button type="submit" class="btn btn-primary">保存资料来源</button><span id="source-wf-status" class="wf-muted" role="status" aria-live="polite">' + (apiReady() ? '已连接学校数据服务。' : '学校数据服务未连接。') + '</span></div></form></div></section><aside class="wf-card"><div class="wf-card__head"><div><h2>采集规则</h2><p>入库前先做来源和正文边界检查。</p></div></div><div class="wf-card__body">' + notice('直接采集只接受公开 HTTPS 页面，并记录 robots.txt 检查结果。遇到权限限制时，请改用官方公开来源或手动补充有权使用的内容。', 'ok') + '<div class="wf-queue"><div class="wf-count"><span>正文识别</span><strong>去导航、广告和脚本</strong></div><div class="wf-count"><span>来源追溯</span><strong>保留原始链接</strong></div><div class="wf-count"><span>质量记录</span><strong>完整度与失败原因</strong></div></div></div></aside></div><section class="wf-card" style="margin-top:18px"><div class="wf-card__head"><div><h2>学校资料来源记录</h2><p>这里仅显示当前学校数据服务中已登记的来源元数据。</p></div><span class="wf-chip wf-chip--blue">' + rows.length + ' 条</span></div><div class="wf-card__body"><div class="wf-queue">' + (rows.length ? rows.map(sourceCard).join('') : '<div class="wf-empty">' + icon('doc', 28) + '<div>还没有资料来源记录</div><small>提交公开来源或手动补充后，记录会显示在这里。</small></div>') + '</div></div></section></div>');
    const mode = document.querySelector('#source-wf-mode');
    const content = document.querySelector('#source-wf-content');
    const syncMode = () => { const manual = mode.value === 'manual'; content.disabled = !manual; content.required = manual; if (!manual) content.value = ''; };
    mode.onchange = syncMode; syncMode();
    document.querySelector('[data-source-wf-action="refresh"]').onclick = () => load(true);
    document.querySelector('#source-wf-form').onsubmit = async event => {
      event.preventDefault();
      const status = document.querySelector('#source-wf-status'); const submit = event.currentTarget.querySelector('button[type="submit"]');
      const body = { mode: mode.value, title: document.querySelector('#source-wf-title').value.trim(), sourceUrl: document.querySelector('#source-wf-url').value.trim(), content: content.value.trim(), summary: document.querySelector('#source-wf-summary').value.trim() };
      if (body.mode === 'direct' && !/^https:\/\//i.test(body.sourceUrl)) { status.textContent = '请填写公开 HTTPS 来源链接。'; return; }
      if (body.mode === 'manual' && !body.content) { status.textContent = '请补充自己有权使用的正文。'; content.focus(); return; }
      submit.disabled = true; status.textContent = '正在检查来源并保存记录…';
      try { await request('/api/sources', { method: 'POST', body: JSON.stringify(body) }); status.textContent = '资料来源已保存。'; app.showToast('资料来源已保存', 'success'); await load(true); }
      catch (error) { status.textContent = error.message || '资料保存失败。'; app.showToast(status.textContent, 'error'); }
      finally { submit.disabled = false; }
    };
  }
  async function load(force) {
    if (!apiReady()) { state.wfSources = []; if (force && state.route === '/resources') render(); return; }
    try { const payload = await request('/api/sources', { method: 'GET' }); state.wfSources = payload.sources || []; if (state.route === '/resources' && state.role !== 'student') render(); }
    catch (error) { if (force) app.showToast(error.message || '资料记录加载失败', 'error'); }
  }
  window.__pages['/resources'] = function () { render(); load(false); };
})();
