/* 凤凰花·智学新版工作流页面
 * 组卷、批改、学情与学生学习入口使用同一套结构化数据和网络 AI 工作流。
 * 页面只渲染事实字段，不展示 JSON、提示词或内部执行过程。
 */
(function () {
  'use strict';
  const app = window.__app;
  if (!app) return;
  const state = app.state;
  const DB = app.DB;
  const esc = app.esc;
  const icon = app.icon;
  const clean = value => window.FH_DOMAIN && window.FH_DOMAIN.sanitizeVisibleText ? window.FH_DOMAIN.sanitizeVisibleText(value) : String(value == null ? '' : value).trim();
  const nav = app.nav;
  const subjects = window.FH_DOMAIN ? Object.values(window.FH_DOMAIN.subjects) : [];
  const subjectName = code => { const item = window.FH_DOMAIN && window.FH_DOMAIN.subjects[code]; return item ? item.name : code || '未设置学科'; };
  const catalog = () => window.FH_REFERENCE_DATA && window.FH_REFERENCE_DATA.getCatalog ? window.FH_REFERENCE_DATA.getCatalog() : { curriculum: [], knowledgeNodes: [], templates: [] };
  const currentUser = () => state.user || DB.currentUser && DB.currentUser() || {};
  const button = (label, action, cls) => '<button type="button" class="btn ' + (cls || 'btn-outline') + '" data-wf-action="' + esc(action) + '">' + label + '</button>';
  const page = html => app.renderPage('<div class="wf-page">' + html + '</div>');
  const empty = (message, detail) => '<div class="wf-empty">' + icon('doc', 28) + '<div>' + esc(message) + '</div>' + (detail ? '<small>' + esc(detail) + '</small>' : '') + '</div>';
  const notice = (message, type) => '<div class="wf-notice' + (type ? ' wf-notice--' + type : '') + '">' + esc(message) + '</div>';
  const getBuilder = () => state.wfPaper || (state.wfPaper = { grade: 7, subject: 'math', region: 'gansu', template: '', chapter: '', type: '选择题', difficulty: 3, count: 5, includeReading: false, questions: [], message: '' });

  function hero(kicker, title, subtitle, actions) {
    return '<div class="wf-hero"><div><div class="wf-kicker">' + esc(kicker) + '</div><h1 class="wf-title">' + esc(title) + '</h1><p class="wf-subtitle">' + esc(subtitle) + '</p></div><div class="wf-actions">' + (actions || '') + '</div></div>';
  }
  function questionCard(q, index) {
    const options = Array.isArray(q.options) ? q.options : [];
    const steps = q.solutionSteps || q.process || q.explain || '';
    return '<article class="wf-question"><div class="wf-question__top"><span class="wf-question__no">' + (index + 1) + '</span><div class="wf-question__stem">' + esc(clean(q.stem || q.q || q.question || '')) + '</div><span class="wf-chip wf-chip--orange">' + esc(q.diff || ('难度 ' + (q.difficulty || 3))) + '</span></div>' +
      '<div class="wf-question__meta"><span class="wf-chip wf-chip--blue">' + esc(q.type || '题目') + '</span><span class="wf-chip">' + esc(q.kp || (q.knowledgePoints || []).join('、') || '已绑定知识点') + '</span><span class="wf-chip">' + esc((q.points || 0) + ' 分') + '</span></div>' +
      (options.length ? '<ul class="wf-options">' + options.map(item => '<li>' + esc(clean(item)) + '</li>').join('') + '</ul>' : '') +
      '<details class="wf-details"><summary>查看答案与分步解析</summary><p><b>答案：</b>' + esc(clean(q.answer || '')) + '\n' + esc(clean(Array.isArray(steps) ? steps.join('\n') : steps)) + '</p></details></article>';
  }
  function templateOptions(selected, subject, grade) {
    const list = (catalog().templates || []).filter(t => (!subject || t.subject === subject || t.subject === 'all') && (!grade || Number(t.grade) === Number(grade)));
    return '<option value="">手动设置题型与题量</option>' + list.map(t => '<option value="' + esc(t.id) + '"' + (t.id === selected ? ' selected' : '') + '>' + esc((t.region || '通用') + ' · ' + t.year + ' · ' + subjectName(t.subject)) + '</option>').join('');
  }
  function curriculumOptions(subject, grade, selected) {
    const list = (catalog().knowledgeNodes || []).filter(n => n.subject === subject && Number(n.grade) === Number(grade));
    const seen = new Set();
    const values = list.map(n => n.chapter || n.unit || n.title).filter(Boolean).filter(v => !seen.has(v) && seen.add(v));
    return '<option value="">选择已入库章节（可选）</option>' + values.map(v => '<option value="' + esc(v) + '"' + (v === selected ? ' selected' : '') + '>' + esc(v) + '</option>').join('');
  }
  function formatStructure(structure) {
    const value = structure && typeof structure === 'object' ? structure : {};
    const labels = [];
    if (value.exam_name) labels.push(String(value.exam_name));
    if (value.paper_role) labels.push('卷面：' + value.paper_role);
    if (value.score != null) labels.push('总分 ' + value.score + ' 分');
    if (value.duration || value.minutes) labels.push('时长 ' + (value.duration || value.minutes) + ' 分钟');
    if (value.exam_mode) labels.push('方式：' + value.exam_mode);
    if (value.schedule) labels.push('安排：' + value.schedule);
    if (Array.isArray(value.sections) && value.sections.length) labels.push('分区 ' + value.sections.length + ' 个');
    if (Array.isArray(value.group_a) && value.group_a.length) labels.push('A 组 ' + value.group_a.join('、'));
    if (Array.isArray(value.group_b) && value.group_b.length) labels.push('B 组 ' + value.group_b.join('、'));
    if (value.source_scope) labels.push('范围：' + value.source_scope);
    return labels.join('；') || '已录入结构，详情以官方来源为准';
  }
  function paperView() {
    const b = getBuilder();
    const templates = catalog().templates || [];
    const qs = b.questions || [];
    const total = qs.reduce((sum, q) => sum + Number(q.points || 0), 0);
    page(hero('Assessment Studio', '智能组卷工作台', '按年级、学科、地区和官方卷型组织命题。题目必须经过结构化校验后才进入试卷。', button('查看我的试卷', 'paper-mine') + button('卷型目录', 'templates')) +
      '<div class="wf-steps"><div class="wf-step is-done"><strong>01 · 定义边界</strong><span>年级、学科、地区与章节</span></div><div class="wf-step ' + (qs.length ? 'is-done' : 'is-active') + '"><strong>02 · 生成草稿</strong><span>按蓝图生成结构化题目</span></div><div class="wf-step ' + (qs.length ? 'is-active' : '') + '"><strong>03 · 质量检查</strong><span>答案、解析、知识点与重复度</span></div><div class="wf-step"><strong>04 · 保存发布</strong><span>教师复核后形成正式试卷</span></div></div>' +
      '<div class="wf-grid"><section class="wf-card"><div class="wf-card__head"><div><h2>命题蓝图</h2><p>选择的官方卷型只提供结构，不会带入旧题目或旧教材正文。</p></div></div><div class="wf-card__body"><div class="wf-form"><div class="wf-field"><label for="wf-paper-grade">年级</label><select class="select" id="wf-paper-grade"><option value="7"' + (b.grade === 7 ? ' selected' : '') + '>七年级</option><option value="8"' + (b.grade === 8 ? ' selected' : '') + '>八年级</option><option value="9"' + (b.grade === 9 ? ' selected' : '') + '>九年级</option></select></div><div class="wf-field"><label for="wf-paper-subject">学科</label><select class="select" id="wf-paper-subject">' + subjects.map(s => '<option value="' + s.code + '"' + (s.code === b.subject ? ' selected' : '') + '>' + esc(s.name) + '</option>').join('') + '</select></div><div class="wf-field"><label for="wf-paper-region">地区结构</label><select class="select" id="wf-paper-region"><option value="gansu"' + (b.region === 'gansu' ? ' selected' : '') + '>甘肃</option><option value="qinghai"' + (b.region === 'qinghai' ? ' selected' : '') + '>青海</option><option value="ningxia"' + (b.region === 'ningxia' ? ' selected' : '') + '>宁夏</option><option value="xinjiang"' + (b.region === 'xinjiang' ? ' selected' : '') + '>新疆</option><option value="xizang"' + (b.region === 'xizang' ? ' selected' : '') + '>西藏</option><option value="general"' + (b.region === 'general' ? ' selected' : '') + '>通用结构</option></select></div><div class="wf-field"><label for="wf-paper-template">官方卷型</label><select class="select" id="wf-paper-template">' + templateOptions(b.template, b.subject, b.grade) + '</select><p class="wf-help">当前目录共 ' + templates.length + ' 条可用结构。</p></div><div class="wf-field"><label for="wf-paper-chapter">教材章节</label><select class="select" id="wf-paper-chapter">' + curriculumOptions(b.subject, b.grade, b.chapter) + '</select></div><div class="wf-field"><label for="wf-paper-type">题型</label><select class="select" id="wf-paper-type"><option>选择题</option><option>多选题</option><option>判断题</option><option>填空题</option><option>解答题</option><option>阅读题</option></select></div><div class="wf-field"><label for="wf-paper-difficulty">难度层级</label><select class="select" id="wf-paper-difficulty"><option value="1">1 · 基础识记</option><option value="2">2 · 基础应用</option><option value="3">3 · 综合应用</option><option value="4">4 · 探究推理</option><option value="5">5 · 中考压轴</option></select></div><div class="wf-field"><label for="wf-paper-count">题量</label><input class="input" id="wf-paper-count" type="number" min="1" max="30" value="' + Number(b.count || 5) + '"><p class="wf-help">单次最多生成 30 道，完整试卷建议分段生成。</p></div><div class="wf-field wf-field--full"><label for="wf-paper-prompt">命题补充要求（可选）</label><textarea class="textarea" id="wf-paper-prompt" rows="3" placeholder="例如：加入生活情境，重点考查条件转化与表达规范"></textarea></div></div><div class="wf-inline-actions" style="margin-top:18px">' + button('开始生成', 'generate-paper', 'btn-primary') + button('清空草稿', 'clear-paper', 'btn-ghost') + '<span class="wf-muted" id="wf-paper-status">' + esc(b.message || '生成前请先确认命题边界。') + '</span></div></div></section>' +
      '<aside class="wf-card"><div class="wf-card__head"><div><h2>本次试卷概览</h2><p>只统计当前草稿，不读取历史演示题。</p></div></div><div class="wf-card__body"><div class="wf-metrics"><div class="wf-metric"><b id="wf-paper-qcount">' + qs.length + '</b><span>已生成题目</span></div><div class="wf-metric"><b id="wf-paper-total">' + total + '</b><span>当前总分</span></div><div class="wf-metric"><b>' + (b.grade || 7) + '</b><span>目标年级</span></div><div class="wf-metric"><b>' + esc(subjectName(b.subject)) + '</b><span>目标学科</span></div></div>' + (templates.length ? '<div class="wf-notice wf-notice--ok">官方目录已加载。生成时会把地区结构作为蓝图约束，题目内容仍由新工作流独立生成。</div>' : notice('当前没有可用的官方卷型记录，请先完成服务端目录迁移；页面不会用旧地区模板替代。')) + '<div class="wf-inline-actions">' + button('保存试卷草稿', 'save-paper', 'btn-primary') + button('导出教师版', 'export-paper', 'btn-outline') + '</div></div></aside></div>' +
      '<section class="wf-card" style="margin-top:18px"><div class="wf-card__head"><div><h2>结构化题目草稿</h2><p>答案、解析、知识点、来源和生成记录随题目保存；展开可查看学生可见内容。</p></div><span class="wf-chip wf-chip--blue">' + (qs.length ? '已通过基础 Schema' : '等待生成') + '</span></div><div class="wf-card__body">' + (qs.length ? qs.map(questionCard).join('') : empty('还没有题目草稿', '选择命题边界后开始生成；系统不会回填本地示例题。')) + '</div></section>');
    const grade = document.querySelector('#wf-paper-grade');
    const subject = document.querySelector('#wf-paper-subject');
    const type = document.querySelector('#wf-paper-type');
    const diff = document.querySelector('#wf-paper-difficulty');
    const count = document.querySelector('#wf-paper-count');
    const region = document.querySelector('#wf-paper-region');
    const template = document.querySelector('#wf-paper-template');
    const chapter = document.querySelector('#wf-paper-chapter');
    grade.value = b.grade; subject.value = b.subject; type.value = b.type; diff.value = b.difficulty; count.value = b.count; region.value = b.region;
    const update = () => { b.grade = Number(grade.value); b.subject = subject.value; b.type = type.value; b.difficulty = Number(diff.value); b.count = Math.min(30, Math.max(1, Number(count.value) || 1)); b.region = region.value; b.template = template.value; b.chapter = chapter.value; };
    [grade, subject, type, diff, count, region, template, chapter].forEach(el => el.addEventListener('change', () => { update(); if (el === grade || el === subject) renderPaper(); }));
    document.querySelector('[data-wf-action="generate-paper"]').onclick = async () => {
      update(); const status = document.querySelector('#wf-paper-status'); const btn = document.querySelector('[data-wf-action="generate-paper"]');
      if (!window.AI || !window.AI.isConfigured()) { status.textContent = '请先在 AI 连接中心选择并保存可用模型。'; return; }
      btn.disabled = true; btn.textContent = '生成中…'; status.textContent = '正在执行生成、结构化校验和质量门槛…';
      try {
        b.questions = await window.AI.generateQuestions({ subjectKey: b.subject, subject: b.subject, grade: b.grade, region: b.region, type: b.type, diff: b.difficulty, count: b.count, includeReading: b.type === '阅读题', knowledgePoints: b.chapter ? [b.chapter] : [], textbookVersion: '', prompt: document.querySelector('#wf-paper-prompt').value.trim() });
        b.message = '已生成 ' + b.questions.length + ' 道结构化题目，请完成教师复核。'; renderPaper();
        const next = document.querySelector('#wf-paper-status'); if (next) next.textContent = b.message;
      } catch (error) { b.message = error && error.message ? error.message : '生成失败，请检查连接后重试。'; status.textContent = b.message; }
      finally { btn.disabled = false; btn.textContent = '开始生成'; }
    };
    document.querySelector('[data-wf-action="clear-paper"]').onclick = () => { b.questions = []; b.message = '草稿已清空。'; renderPaper(); };
    document.querySelector('[data-wf-action="save-paper"]').onclick = () => {
      update(); if (!b.questions.length) { app.showToast('请先生成至少一道题', 'warning'); return; }
      const record = { id: DB.uid('paper'), name: '未命名试卷 · ' + subjectName(b.subject), type: '结构化 AI 试卷', grade: b.grade, subject: b.subject, region: b.region, qs: b.questions.length, total: b.questions.reduce((sum, q) => sum + Number(q.points || 0), 0), questions: b.questions, status: '草稿', date: new Date().toISOString().slice(0, 10), updatedAt: DB.now(), createdBy: currentUser().id || '' };
      const result = DB.upsertRecord('papers', record); app.showToast(result.ok ? '试卷草稿已保存到学校数据服务' : result.msg, result.ok ? 'success' : 'error');
    };
    document.querySelector('[data-wf-action="export-paper"]').onclick = () => {
      if (!b.questions.length) { app.showToast('当前没有可导出的题目', 'warning'); return; }
      const text = window.AI && window.AI.exportGift ? window.AI.exportGift(b.questions) : '';
      const name = '凤凰花智学-结构化试卷-' + new Date().toISOString().slice(0, 10) + '.txt';
      if (window.fhNativeSave && window.fhNativeSave(name, text)) app.showToast('教师版已保存', 'success');
      else { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); }
    };
    document.querySelector('[data-wf-action="paper-mine"]').onclick = () => nav('#/paper/mine');
    document.querySelector('[data-wf-action="templates"]').onclick = () => nav('#/paper/templates');
  }
  function renderPaper() { paperView(); }
  function renderPaperTemplates() {
    const list = catalog().templates || [];
    page(hero('Template Library', '地区卷型目录', '按地区与年份查看已经录入的结构化考试规则；历史版本保留，页面不再默认福建或厦门模板。', button('返回组卷', 'back-paper', 'btn-primary')) + '<section class="wf-card"><div class="wf-card__head"><div><h2>已启用结构</h2><p>每条记录都绑定来源、年份、学科和版本。</p></div><span class="wf-chip wf-chip--blue">' + list.length + ' 条</span></div><div class="wf-table-wrap"><table class="wf-table"><thead><tr><th>地区 / 年份</th><th>学科 / 年级</th><th>考试结构</th><th>来源</th></tr></thead><tbody>' + (list.length ? list.map(t => '<tr><td><strong>' + esc(t.region || '通用') + ' · ' + esc(t.year || '') + '</strong><div class="wf-muted">版本 ' + esc(t.version || 1) + ' · 核验时间 ' + esc(t.source && t.source.verifiedAt || '') + '</div></td><td>' + esc(subjectName(t.subject)) + ' · ' + esc(String(t.grade || '')) + ' 年级</td><td>' + esc(formatStructure(t.structure)) + '</td><td><a class="wf-source" href="' + esc(t.source && t.source.url || '#') + '" target="_blank" rel="noreferrer">打开官方来源</a></td></tr>').join('') : '<tr><td colspan="4">' + empty('暂无已启用卷型', '部署数据库迁移后可从官方目录读取。') + '</td></tr>') + '</tbody></table></div></section>');
    document.querySelector('[data-wf-action="back-paper"]').onclick = () => nav('#/paper');
  }
  function gradingItems() { const g = DB.grading() || {}; return ['recognized', 'grading', 'review', 'done'].flatMap(key => (g[key] || []).map(item => Object.assign({}, item, { group: key }))); }
  function findGrading(id) {
    const local = gradingItems().find(item => String(item.id) === String(id));
    if (local) return local;
    return (state.wfStudentRemote && state.wfStudentRemote.feedback || []).map(item => Object.assign({}, item, { group: 'done', name: '作业反馈', task: '结构化提交' })).find(item => String(item.id) === String(id));
  }
  function gradingStatus(item) { return item.group === 'done' ? '已完成' : item.group === 'review' ? '教师复核' : item.group === 'grading' ? 'AI 处理中' : '已登记'; }
  function gradingView() {
    if (state.role === 'student') return studentFeedbackView();
    const items = gradingItems();
    page(hero('Review Desk', '批改工作台', '登记答卷、补充结构化作答内容、执行评分工作流，再由教师复核后下发反馈。', button('评分标准', 'rubric') + button('查看学情', 'analytics', 'btn-primary')) + '<div class="wf-grid"><section class="wf-card"><div class="wf-card__head"><div><h2>登记答卷</h2><p>当前浏览器只登记文件信息；识别结果需要明确来源，不会把空白文件伪装成答案。</p></div></div><div class="wf-card__body"><label class="wf-upload" for="wf-answer-file">' + icon('upload', 30) + '<strong>选择图片或 PDF 答卷</strong><span>登记后进入队列；点击任务补充题目和学生答案</span></label><input id="wf-answer-file" type="file" accept="image/*,.pdf" multiple hidden></div></section><aside class="wf-card"><div class="wf-card__head"><div><h2>队列状态</h2><p>真实记录 · 教师操作留痕</p></div></div><div class="wf-card__body"><div class="wf-metrics"><div class="wf-metric"><b>' + items.length + '</b><span>全部任务</span></div><div class="wf-metric"><b>' + items.filter(i => i.group === 'review').length + '</b><span>需要复核</span></div><div class="wf-metric"><b>' + items.filter(i => i.group === 'done').length + '</b><span>已完成</span></div><div class="wf-metric"><b>' + items.filter(i => i.group === 'recognized').length + '</b><span>待补答案</span></div></div>' + notice('只有填写了真实作答内容并通过评分工作流，系统才会生成分数。') + '</div></aside></div><section class="wf-card" style="margin-top:18px"><div class="wf-card__head"><div><h2>批改队列</h2><p>点击任务进入结构化评分页面。</p></div></div><div class="wf-card__body"><div class="wf-queue">' + (items.length ? items.map(item => '<article class="wf-queue-item" data-wf-grade="' + esc(item.id) + '"><span class="wf-queue-item__icon">' + icon(item.group === 'done' ? 'check' : 'doc', 18) + '</span><div class="wf-queue-item__main"><strong>' + esc(item.name || item.fileName || '未命名答卷') + '</strong><span>' + esc(item.task || '未设置作业') + ' · ' + esc(item.time || item.createdAt || '') + ' · ' + esc(gradingStatus(item)) + '</span></div>' + (item.score != null ? '<span class="wf-score">' + esc(item.score + ' / ' + (item.total || 100)) + '</span>' : '<span class="wf-chip">进入</span>') + '</article>').join('') : empty('批改队列为空', '上传一份答卷文件开始登记。')) + '</div></div></section>');
    const file = document.querySelector('#wf-answer-file');
    const assignmentButton = document.createElement('button'); assignmentButton.type = 'button'; assignmentButton.className = 'btn btn-outline'; assignmentButton.textContent = '发布作业'; assignmentButton.onclick = () => nav('#/assignments'); const actionBar = document.querySelector('.wf-hero .wf-actions'); if (actionBar) actionBar.prepend(assignmentButton);
    file.onchange = () => { Array.from(file.files || []).forEach(f => DB.addGradingItem({ name: f.name.replace(/\.[^.]+$/, ''), fileName: f.name, sourceType: f.type || 'file', task: '新登记答卷', time: '刚刚', status: 'recognized', note: '文件已登记，请补充结构化答案', progress: 0, createdBy: currentUser().id || '' })); app.showToast('已登记 ' + file.files.length + ' 份答卷，请逐份补充作答内容', 'success'); renderGrading(); };
    document.querySelectorAll('[data-wf-grade]').forEach(el => el.onclick = () => nav('#/grading/' + encodeURIComponent(el.dataset.wfGrade)));
    document.querySelector('[data-wf-action="rubric"]').onclick = () => nav('#/grading/rubric');
    document.querySelector('[data-wf-action="analytics"]').onclick = () => nav('#/analytics');
  }
  function hydrateStudentLoop() {
    if (state.role !== 'student' || !window.FH_LEARNING || !DB.cloudInfo().cloud || state.wfStudentHydrating || state.wfStudentRemote) return;
    state.wfStudentHydrating = true;
    Promise.all([window.FH_LEARNING.listFeedback(), window.FH_LEARNING.listWrongbook(), window.FH_LEARNING.listAssignments(), window.FH_LEARNING.listNotifications()]).then(values => {
      state.wfStudentRemote = { feedback: values[0].feedback || [], wrongbook: values[1].entries || [], assignments: values[2].assignments || [], notifications: values[3].notifications || [] };
      if (state.route === '/home' || state.route === '/grading') window.__router && window.__router();
    }).catch(() => {}).finally(() => { state.wfStudentHydrating = false; });
  }
  function assignmentListView() {
    const remote = state.wfAssignments || (state.wfStudentRemote && state.wfStudentRemote.assignments) || [];
    const student = state.role === 'student';
    const form = student ? '' : '<section class="wf-card"><div class="wf-card__head"><div><h2>发布新作业</h2><p>作业元数据单独保存，学生提交后进入批改与反馈链路。</p></div></div><div class="wf-card__body"><div class="wf-form"><div class="wf-field"><label for="wf-assignment-title">作业名称</label><input class="input" id="wf-assignment-title" maxlength="120" placeholder="例如：一次函数阶段练习"></div><div class="wf-field"><label for="wf-assignment-grade">年级</label><select class="select" id="wf-assignment-grade"><option value="7">七年级</option><option value="8">八年级</option><option value="9">九年级</option></select></div><div class="wf-field"><label for="wf-assignment-subject">学科</label><select class="select" id="wf-assignment-subject">' + subjects.map(item => '<option value="' + esc(item.code) + '">' + esc(item.name) + '</option>').join('') + '</select></div><div class="wf-field"><label for="wf-assignment-due">截止时间</label><input class="input" id="wf-assignment-due" type="datetime-local"></div></div><div class="wf-inline-actions" style="margin-top:16px">' + button('发布作业', 'save-assignment', 'btn-primary') + '<span class="wf-muted" id="wf-assignment-status">需要连接学校数据服务后保存。</span></div></div></section>';
    page(hero('Assignment Loop', student ? '我的作业' : '作业发布', student ? '接收作业、保存草稿、正式提交和补交都在同一条记录链路中。' : '发布作业后，学生可以在线作答并保存草稿。', student ? button('回到学习首页', 'student-home', 'btn-outline') : button('查看批改', 'grading', 'btn-outline')) + form + '<section class="wf-card" style="margin-top:18px"><div class="wf-card__head"><div><h2>' + (student ? '待完成作业' : '已发布作业') + '</h2><p>列表来自结构化学习接口，不使用前端示例记录。</p></div><span class="wf-chip wf-chip--blue">' + remote.length + ' 份</span></div><div class="wf-card__body"><div class="wf-queue">' + (remote.length ? remote.map(item => '<article class="wf-queue-item" data-wf-assignment="' + esc(item.id) + '"><span class="wf-queue-item__icon">' + icon('paper', 18) + '</span><div class="wf-queue-item__main"><strong>' + esc(item.title) + '</strong><span>' + esc(subjectName(item.subject)) + ' · ' + esc(String(item.grade)) + ' 年级' + (item.dueAt ? ' · 截止 ' + esc(item.dueAt) : '') + '</span></div><span class="wf-chip">' + esc(student ? '开始作答' : item.status || '已发布') + '</span></article>').join('') : empty('当前没有作业记录', '教师发布后，作业会出现在这里。')) + '</div></div></section>');
    if (student) document.querySelector('[data-wf-action="student-home"]').onclick = () => nav('#/home'); else { document.querySelector('[data-wf-action="grading"]').onclick = () => nav('#/grading'); document.querySelector('[data-wf-action="save-assignment"]').onclick = async () => { const title = document.querySelector('#wf-assignment-title').value.trim(); const status = document.querySelector('#wf-assignment-status'); if (!title) { status.textContent = '请先填写作业名称。'; return; } if (!window.FH_LEARNING || !DB.cloudInfo().cloud) { status.textContent = '学校数据服务未连接，作业没有保存。'; return; } const btn = document.querySelector('[data-wf-action="save-assignment"]'); btn.disabled = true; try { await window.FH_LEARNING.saveAssignment({ title, subject: document.querySelector('#wf-assignment-subject').value, grade: Number(document.querySelector('#wf-assignment-grade').value), dueAt: document.querySelector('#wf-assignment-due').value ? new Date(document.querySelector('#wf-assignment-due').value).toISOString() : '' }); status.textContent = '作业已发布。'; app.showToast('作业已发布', 'success'); loadAssignmentsForView(); } catch (error) { status.textContent = error.message || '作业保存失败。'; } finally { btn.disabled = false; } }; }
    document.querySelectorAll('[data-wf-assignment]').forEach(el => el.onclick = () => nav('#/assignments/' + encodeURIComponent(el.dataset.wfAssignment)));
    loadAssignmentsForView();
  }
  function loadAssignmentsForView() {
    if (!window.FH_LEARNING || !DB.cloudInfo().cloud || state.wfAssignmentsLoading) return;
    state.wfAssignmentsLoading = true;
    window.FH_LEARNING.listAssignments().then(payload => { state.wfAssignments = payload.assignments || []; if (state.route === '/assignments') window.__router && window.__router(); }).catch(() => {}).finally(() => { state.wfAssignmentsLoading = false; });
  }
  function assignmentDetailView() {
    const id = decodeURIComponent(state.route.split('/')[2] || ''); const list = state.wfAssignments || (state.wfStudentRemote && state.wfStudentRemote.assignments) || []; const assignment = list.find(item => String(item.id) === String(id));
    if (!assignment) { page(hero('Assignment Loop', '正在读取作业', '作业列表更新后会显示详细内容。', button('返回作业列表', 'back-assignments', 'btn-primary')) + '<section class="wf-card">' + empty('暂时找不到这份作业', '请返回列表重新打开。') + '</section>'); document.querySelector('[data-wf-action="back-assignments"]').onclick = () => nav('#/assignments'); loadAssignmentsForView(); return; }
    const draft = state.wfDraftAnswers && state.wfDraftAnswers[id] || '';
    page(hero('Assignment Loop', assignment.title, subjectName(assignment.subject) + ' · ' + assignment.grade + ' 年级' + (assignment.dueAt ? ' · 截止 ' + assignment.dueAt : ''), button('返回作业列表', 'back-assignments', 'btn-outline')) + '<div class="wf-grid"><section class="wf-card"><div class="wf-card__head"><div><h2>在线作答</h2><p>草稿可以反复保存；点击正式提交后进入教师批改队列。</p></div></div><div class="wf-card__body"><div class="wf-field"><label for="wf-assignment-answer">我的答案</label><textarea class="textarea" id="wf-assignment-answer" rows="16" placeholder="写下解题过程、答案或作文内容"></textarea></div><div class="wf-inline-actions" style="margin-top:16px">' + button('保存草稿', 'save-draft', 'btn-outline') + button('正式提交', 'submit-assignment', 'btn-primary') + '<span class="wf-muted" id="wf-assignment-detail-status">草稿只保存在学校数据服务。</span></div></div></section><aside class="wf-card"><div class="wf-card__head"><div><h2>提交提醒</h2><p>提交前检查答案是否完整。</p></div></div><div class="wf-card__body">' + notice('正式提交后，教师完成批改并发布反馈，结果会回到学习首页和批改反馈。') + '</div></aside></div>');
    document.querySelector('#wf-assignment-answer').value = draft; document.querySelector('[data-wf-action="back-assignments"]').onclick = () => nav('#/assignments');
    async function save(status) { const value = document.querySelector('#wf-assignment-answer').value.trim(); const message = document.querySelector('#wf-assignment-detail-status'); if (!value) { message.textContent = '请先填写答案。'; return; } state.wfDraftAnswers = state.wfDraftAnswers || {}; state.wfDraftAnswers[id] = value; if (!window.FH_LEARNING || !DB.cloudInfo().cloud) { message.textContent = '学校数据服务未连接，答案没有保存。'; return; } const btn = document.querySelector('[data-wf-action="' + (status === 'submitted' ? 'submit-assignment' : 'save-draft') + '"]'); btn.disabled = true; try { await window.FH_LEARNING[status === 'submitted' ? 'submit' : 'saveDraft']({ assignmentId: id, answers: { text: value } }); message.textContent = status === 'submitted' ? '已正式提交。' : '草稿已保存。'; if (status === 'submitted') app.showToast('作业已提交', 'success'); } catch (error) { message.textContent = error.message || '保存失败。'; } finally { btn.disabled = false; } }
    document.querySelector('[data-wf-action="save-draft"]').onclick = () => save('draft'); document.querySelector('[data-wf-action="submit-assignment"]').onclick = () => save('submitted');
  }
  function studentFeedbackView() {
    const id = currentUser().id; const local = gradingItems().filter(item => item.group === 'done' && (!item.studentId || String(item.studentId) === String(id))); const remote = (state.wfStudentRemote && state.wfStudentRemote.feedback || []).map(item => Object.assign({}, item, { group: 'done', name: '作业反馈', task: '结构化提交' })); const list = local.concat(remote.filter(item => !local.some(existing => String(existing.submissionId || existing.id) === String(item.submissionId || item.id))));
    page(hero('My Feedback', '批改反馈', '查看教师复核后的得分、评语、失分原因和允许下发的分步讲解。', button('回到学习首页', 'student-home', 'btn-primary')) + '<section class="wf-card"><div class="wf-card__head"><div><h2>已发布反馈</h2><p>学生端只展示已完成并允许查看的内容。</p></div><span class="wf-chip wf-chip--blue">' + list.length + ' 份</span></div><div class="wf-card__body"><div class="wf-queue">' + (list.length ? list.map(item => '<article class="wf-queue-item" data-wf-grade="' + esc(item.id) + '"><span class="wf-queue-item__icon">' + icon('check', 18) + '</span><div class="wf-queue-item__main"><strong>' + esc(item.name || '批改反馈') + '</strong><span>' + esc(item.task || '作业') + ' · ' + esc(item.updatedAt || item.time || '') + '</span></div><span class="wf-score">' + esc((item.score || 0) + ' / ' + (item.total || 100)) + '</span></article>').join('') : empty('还没有可查看的批改反馈', '教师完成复核并下发后，反馈会出现在这里。')) + '</div></div></section>');
    document.querySelectorAll('[data-wf-grade]').forEach(el => el.onclick = () => nav('#/grading/' + encodeURIComponent(el.dataset.wfGrade)));
    document.querySelector('[data-wf-action="student-home"]').onclick = () => nav('#/home');
    hydrateStudentLoop();
  }
  function gradingDetailView() {
    const id = decodeURIComponent((state.route.split('/')[2] || '')); const item = findGrading(id);
    if (!item) { page(hero('Review Desk', '找不到这份答卷', '这条批改记录可能已被移除或不属于当前账号。', button('返回批改工作台', 'back-grading', 'btn-primary')) + '<section class="wf-card">' + empty('批改记录不存在') + '</section>'); document.querySelector('[data-wf-action="back-grading"]').onclick = () => nav('#/grading'); return; }
    const student = state.role === 'student';
    page(hero('Review Detail', student ? '我的批改结果' : '答卷批改详情', student ? '只显示教师已复核并发布的反馈。' : '评分工作流只读取本页明确填写的作答内容，生成后仍需教师确认。', button('返回批改工作台', 'back-grading', 'btn-outline')) + '<div class="wf-grid"><section class="wf-card"><div class="wf-card__head"><div><h2>' + esc(item.name || '未命名答卷') + '</h2><p>' + esc(item.task || '未设置作业') + ' · ' + esc(item.fileName || '未关联文件') + '</p></div><span class="wf-chip wf-chip--blue">' + esc(gradingStatus(item)) + '</span></div><div class="wf-card__body">' + (item.score != null ? '<div class="wf-metric" style="margin-bottom:18px"><b>' + esc(item.score + ' / ' + (item.total || 100)) + '</b><span>当前评分</span></div>' : '') + (student ? '<div class="wf-notice wf-notice--ok">教师反馈已发布，以下内容来自结构化评分结果。</div>' : '<div class="wf-field"><label for="wf-grade-answers">学生作答内容</label><textarea class="textarea" id="wf-grade-answers" rows="15" placeholder="每行填写一道题：题号｜题目｜学生答案\n例如：1｜……｜……"></textarea><p class="wf-help">没有真实作答文本时不调用模型，也不会产生分数。</p></div><div class="wf-inline-actions" style="margin-top:14px">' + button('运行结构化评分', 'run-grade', 'btn-primary') + (item.score != null ? button('教师确认并发布', 'publish-grade', 'btn-outline') : '') + '<span class="wf-muted" id="wf-grade-status">' + esc(item.note || '评分结果需要教师复核。') + '</span></div>') + '</div></section><aside class="wf-card"><div class="wf-card__head"><div><h2>反馈摘要</h2><p>面向学生的可读结果</p></div></div><div class="wf-card__body">' + (item.comment ? '<p style="line-height:1.8;margin-top:0">' + esc(clean(item.comment)) + '</p>' : empty('评分完成后显示评语')) + (item.reasons && item.reasons.length ? '<div class="wf-queue">' + item.reasons.map(r => '<div class="wf-count"><span>' + esc(clean(r.text)) + '</span><strong>' + (r.type === 'bad' ? '失分点' : '得分点') + '</strong></div>').join('') + '</div>' : '') + '</div></aside></div>');
    document.querySelector('[data-wf-action="back-grading"]').onclick = () => nav('#/grading');
    if (student) return;
    document.querySelector('[data-wf-action="run-grade"]').onclick = async () => {
      const input = document.querySelector('#wf-grade-answers'); const status = document.querySelector('#wf-grade-status'); const value = input.value.trim();
      if (!value) { status.textContent = '请先填写真实作答内容。'; input.focus(); return; }
      const btn = document.querySelector('[data-wf-action="run-grade"]'); btn.disabled = true; btn.textContent = '评分中…'; status.textContent = '正在执行评分、理由提取和结构化校验…';
      try { const result = await window.AI.gradeAnswer({ task: item.task || item.name, total: item.total || 100, answers: value.split(/\n+/).map((line, index) => ({ no: index + 1, title: '第 ' + (index + 1) + ' 题', text: line })) }); const saved = DB.updateGradingItem(id, Object.assign({}, result, { status: 'review', note: 'AI 评分已完成，请教师复核', reviewRequired: true, answerText: value })); if (saved.ok && item.submissionId && window.FH_LEARNING) await window.FH_LEARNING.saveFeedback({ submissionId: item.submissionId, score: result.score, total: result.total, comment: result.comment, reasons: result.reasons, release: false }); status.textContent = saved.ok ? '评分已生成，已进入教师复核状态。' : saved.msg; app.showToast(saved.ok ? '评分结果已保存，请教师复核后发布' : saved.msg, saved.ok ? 'success' : 'error'); setTimeout(() => nav('#/grading/' + encodeURIComponent(id)), 500); }
      catch (error) { status.textContent = error && error.message ? error.message : '评分失败，原记录未改变。'; }
      finally { btn.disabled = false; btn.textContent = '运行结构化评分'; }
    };
    const publish = document.querySelector('[data-wf-action="publish-grade"]');
    if (publish) publish.onclick = async () => { publish.disabled = true; try { const saved = DB.updateGradingItem(id, { status: 'done', note: '教师已确认并发布反馈', reviewRequired: false, releasedAt: new Date().toISOString() }); if (saved.ok && item.submissionId && window.FH_LEARNING) await window.FH_LEARNING.saveFeedback({ submissionId: item.submissionId, score: item.score, total: item.total || 100, comment: item.comment || '', reasons: item.reasons || [], release: true }); app.showToast(saved.ok ? '反馈已发布到学生端' : saved.msg, saved.ok ? 'success' : 'error'); nav('#/grading/' + encodeURIComponent(id)); } catch (error) { app.showToast(error.message || '发布失败', 'error'); } finally { publish.disabled = false; } };
  }
  function reportRecords() { return gradingItems().filter(item => item.group === 'done' && item.score != null).map(item => ({ id: item.id, assignmentId: item.assignmentId || item.id, submissionId: item.submissionId || item.id, userId: item.studentId || currentUser().id, subject: item.subject || 'math', status: 'submitted', submittedAt: item.updatedAt || item.createdAt || new Date().toISOString(), score: Number(item.score), total: Number(item.total || 100) })); }
  function analyticsView() {
    const records = reportRecords(); const selected = state.wfReportSubjects || ['math']; const period = state.wfReportPeriod || { start: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10), end: new Date().toISOString().slice(0, 10) }; const gate = window.FH_DOMAIN.reportEligibility(records, selected, period); const stats = selected.reduce((out, code) => { const rows = records.filter(r => r.subject === code && r.submittedAt.slice(0, 10) >= period.start && r.submittedAt.slice(0, 10) <= period.end); out[code] = { count: rows.length, average: rows.length ? Math.round(rows.reduce((sum, r) => sum + r.score / r.total * 100, 0) / rows.length) : 0 }; return out; }, {});
    page(hero('Learning Analytics', '学情报告工作台', '先按周期筛选真实有效作业，再逐科检查门槛；不足时不调用 AI。', button('返回首页', 'analytics-home', 'btn-outline')) + '<div class="wf-report-gate"><section class="wf-card"><div class="wf-card__head"><div><h2>报告范围</h2><p>每个被选学科都需要至少三次正式提交且可计分的作业。</p></div></div><div class="wf-card__body"><div class="wf-form"><div class="wf-field"><label for="wf-period-start">开始日期</label><input class="input" id="wf-period-start" type="date" value="' + esc(period.start) + '"></div><div class="wf-field"><label for="wf-period-end">结束日期</label><input class="input" id="wf-period-end" type="date" value="' + esc(period.end) + '"></div><div class="wf-field wf-field--full"><label>组合分析学科</label><div class="wf-subjects">' + subjects.map(s => '<label class="wf-check"><input type="checkbox" value="' + s.code + '"' + (selected.includes(s.code) ? ' checked' : '') + '>' + esc(s.name) + '</label>').join('') + '</div></div></div><div class="wf-inline-actions" style="margin-top:18px">' + button('检查门槛', 'check-report', 'btn-primary') + '<span class="wf-muted" id="wf-report-status">' + (gate.canGenerate ? '满足生成条件。' : '先完成范围选择和作业数量检查。') + '</span></div></div></section><aside class="wf-card"><div class="wf-card__head"><div><h2>逐科数据</h2><p>当前周期内的有效作业</p></div></div><div class="wf-card__body"><div class="wf-gate-counts">' + (selected.length ? selected.map(code => { const x = gate.counts[code] || 0; return '<div class="wf-count"><span>' + esc(subjectName(code)) + '</span><strong>' + x + ' / 3</strong></div>'; }).join('') : empty('请选择学科')) + '</div>' + (gate.canGenerate ? '<div class="wf-notice wf-notice--ok">已满足门槛：先完成确定性统计，再由 AI 解释统计结果。</div>' : notice('当前数据不足，不会调用模型，也不会消耗模型额度。')) + '</div></aside></div><section class="wf-card" style="margin-top:18px"><div class="wf-card__head"><div><h2>统计结果</h2><p>数字来自当前周期内的有效作业记录。</p></div></div><div class="wf-card__body">' + (selected.length ? '<div class="wf-metrics">' + selected.map(code => '<div class="wf-metric"><b>' + (stats[code] ? stats[code].average + '%' : '—') + '</b><span>' + esc(subjectName(code)) + ' · ' + ((stats[code] && stats[code].count) || 0) + ' 次</span></div>').join('') + '</div>' : empty('没有统计对象')) + '<div class="wf-inline-actions">' + button(gate.canGenerate ? '生成 AI 解读' : '数据达到门槛后生成', 'generate-report', gate.canGenerate ? 'btn-primary' : 'btn-outline') + '<span class="wf-muted" id="wf-report-result"></span></div></div></section>');
    const collect = () => { state.wfReportPeriod = { start: document.querySelector('#wf-period-start').value, end: document.querySelector('#wf-period-end').value }; state.wfReportSubjects = Array.from(document.querySelectorAll('.wf-subjects input:checked')).map(x => x.value); };
    document.querySelector('[data-wf-action="analytics-home"]').onclick = () => nav('#/home');
    document.querySelector('[data-wf-action="check-report"]').onclick = () => { collect(); analyticsView(); };
    async function createReportRun() {
      if (!DB.cloudInfo().cloud || !window.FHNetwork || !window.FHNetwork.url) return null;
      const response = await fetch(window.FHNetwork.url('/api/analytics/reports'), { method: 'POST', headers: window.FHNetwork.headers({ 'Content-Type': 'application/json' }), body: JSON.stringify({ subjects: state.wfReportSubjects, period: state.wfReportPeriod, statistics: stats }) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.ok) { const error = new Error(payload.msg || '报告统计服务暂时不可用'); error.payload = payload; throw error; }
      return payload;
    }
    async function saveReportExplanation(reportId, explanation) {
      if (!reportId || !window.FHNetwork || !window.FHNetwork.url) return;
      await fetch(window.FHNetwork.url('/api/analytics/reports/' + encodeURIComponent(reportId)), { method: 'PUT', headers: window.FHNetwork.headers({ 'Content-Type': 'application/json' }), body: JSON.stringify({ explanation: explanation, modelId: window.AI && window.AI.providerLabel ? window.AI.providerLabel() : '' }) });
    }
    document.querySelector('[data-wf-action="generate-report"]').onclick = async () => {
      collect(); const current = window.FH_DOMAIN.reportEligibility(records, state.wfReportSubjects, state.wfReportPeriod); if (!current.canGenerate) { analyticsView(); return; }
      const target = document.querySelector('#wf-report-result'); const btn = document.querySelector('[data-wf-action="generate-report"]'); btn.disabled = true; target.textContent = '正在保存统计结果并检查服务端门槛…';
      try {
        const stored = await createReportRun();
        if (stored && stored.eligibility && !stored.eligibility.canGenerate) { target.textContent = '当前周期内的有效作业数量不足，未调用模型。'; analyticsView(); return; }
        const explanation = await window.FH_WORKFLOW_BRIDGE.generateReport(records, state.wfReportSubjects, state.wfReportPeriod, stats);
        await saveReportExplanation(stored && stored.reportId, explanation && explanation.explanation ? explanation.explanation : explanation);
        target.textContent = explanation && explanation.explanation ? '报告解读已生成并保存，可继续人工编辑后下发。' : '统计报告已保存。'; app.showToast('学情报告解读已生成', 'success');
      } catch (error) { target.textContent = error.message || '报告生成失败，统计结果未改变。'; }
      finally { btn.disabled = false; }
    };
  }
  function studentHomeView() {
    const user = currentUser(); const localFeedback = gradingItems().filter(item => item.group === 'done' && (!item.studentId || String(item.studentId) === String(user.id))); const remoteFeedback = (state.wfStudentRemote && state.wfStudentRemote.feedback || []).map(item => Object.assign({}, item, { name: '作业反馈' })); const feedback = localFeedback.concat(remoteFeedback.filter(item => !localFeedback.some(existing => String(existing.submissionId || existing.id) === String(item.submissionId || item.id)))); const wrongs = (state.wfStudentRemote && state.wfStudentRemote.wrongbook || []).length || (Array.isArray(user.wrongs) ? user.wrongs.length : 0); const plan = user.plan || null; const completion = plan && plan.exercises ? Math.min(100, Math.round((plan.exercises.filter(item => item.done).length / Math.max(1, plan.exercises.length)) * 100)) : 0;
    page(hero('Student Space', '今天学什么，由你来决定', '这里汇总作业反馈、错题复习、学习计划和知识点入口；每一步都基于你的真实记录。', button('查看批改反馈', 'student-feedback', 'btn-primary')) + '<section class="wf-card" style="margin-bottom:18px"><div class="wf-card__body"><div class="wf-student-grid"><a class="wf-student-card" href="#/grading"><span class="wf-student-card__icon">' + icon('review', 19) + '</span><h3>批改反馈</h3><p>查看教师复核后的成绩、得失分点和讲解。</p><div class="wf-progress"><i style="width:' + Math.min(100, feedback.length * 20) + '%"></i></div></a><a class="wf-student-card" href="#/wrongbook"><span class="wf-student-card__icon">' + icon('wrong', 19) + '</span><h3>错题本</h3><p>整理错题、复习排期和知识点讲解。</p><div class="wf-progress"><i style="width:' + Math.min(100, wrongs * 10) + '%"></i></div></a><a class="wf-student-card" href="#/analytics/students/plan"><span class="wf-student-card__icon">' + icon('plan', 19) + '</span><h3>学习计划</h3><p>' + (plan ? '按当前计划完成每天的学习动作。' : '教师生成计划后，会在这里显示执行步骤。') + '</p><div class="wf-progress"><i style="width:' + completion + '%"></i></div></a><a class="wf-student-card" href="#/knowledge"><span class="wf-student-card__icon">' + icon('knowledge', 19) + '</span><h3>知识点讲解</h3><p>从概念开始理解，再做变式练习。</p></a><a class="wf-student-card" href="#/resources"><span class="wf-student-card__icon">' + icon('res', 19) + '</span><h3>学习资料</h3><p>阅读教师发布的资料和课程来源。</p></a><a class="wf-student-card" href="#/help"><span class="wf-student-card__icon">' + icon('help', 19) + '</span><h3>隐私与帮助</h3><p>查看数据授权、账号和使用说明。</p></a></div></div></section><section class="wf-card"><div class="wf-card__head"><div><h2>最近反馈</h2><p>只显示当前账号可见的已发布结果。</p></div><span class="wf-chip wf-chip--blue">' + feedback.length + ' 份</span></div><div class="wf-card__body">' + (feedback.length ? feedback.slice(0, 4).map(item => '<div class="wf-count" style="margin-bottom:9px"><span><strong>' + esc(item.name || '作业') + '</strong><br><span class="wf-muted">' + esc(item.comment || '教师已完成批改') + '</span></span><strong>' + esc(item.score + ' / ' + (item.total || 100)) + '</strong></div>').join('') : empty('还没有已发布反馈', '完成作业并等待教师复核后，这里会显示学习证据。')) + '</div></section>');
    document.querySelector('[data-wf-action="student-feedback"]').onclick = () => nav('#/grading');
    const assignmentButton = document.createElement('button'); assignmentButton.type = 'button'; assignmentButton.className = 'btn btn-outline'; assignmentButton.textContent = '查看作业'; assignmentButton.onclick = () => nav('#/assignments'); const actionBar = document.querySelector('.wf-hero .wf-actions'); if (actionBar) actionBar.prepend(assignmentButton);
    hydrateStudentLoop();
  }
  function paperMineView() {
    const papers = DB.collection('papers').filter(item => item && item.status !== '已删除');
    page(hero('Assessment Library', '我的试卷', '查看当前账号可见的结构化试卷草稿和已保存版本。', button('返回组卷', 'back-paper', 'btn-primary')) + '<section class="wf-card"><div class="wf-card__head"><div><h2>试卷记录</h2><p>题目内容来自生成后的结构化记录，不会在页面上展示内部对象。</p></div><span class="wf-chip wf-chip--blue">' + papers.length + ' 份</span></div><div class="wf-card__body"><div class="wf-queue">' + (papers.length ? papers.map(item => '<article class="wf-queue-item"><span class="wf-queue-item__icon">' + icon('paper', 18) + '</span><div class="wf-queue-item__main"><strong>' + esc(item.name || '未命名试卷') + '</strong><span>' + esc(subjectName(item.subject)) + ' · ' + esc(String(item.grade || '')) + ' 年级 · ' + esc(item.status || '草稿') + '</span></div><span class="wf-score">' + esc((item.qs || 0) + ' 题 · ' + (item.total || 0) + ' 分') + '</span></article>').join('') : empty('还没有保存的试卷', '从组卷工作台生成题目后保存。')) + '</div></div></section>');
    document.querySelector('[data-wf-action="back-paper"]').onclick = () => nav('#/paper');
  }
  function rubricView() {
    const rows = ['选择题与判断题：检查答案唯一性、选项完整性和客观规则。', '填空题：检查等价答案、单位和关键步骤。', '解答题：按步骤、关键依据、结论和表达规范形成评分点。', '作文与开放题：按内容、证据、结构、语言和任务完成度分项记录。'];
    page(hero('Review Policy', '评分标准', '评分先形成结构化结果，再由教师复核；学生端只接收已经发布的反馈。', button('返回批改', 'back-grading', 'btn-primary')) + '<section class="wf-card"><div class="wf-card__head"><div><h2>通用评分规则</h2><p>学科专用字段由题目 Schema 和教师评分标准共同约束。</p></div></div><div class="wf-card__body"><div class="wf-queue">' + rows.map((row, index) => '<div class="wf-count"><span><strong>' + (index + 1) + '</strong> · ' + esc(row) + '</span><span class="wf-chip wf-chip--blue">需复核</span></div>').join('') + '</div></div></section>');
    document.querySelector('[data-wf-action="back-grading"]').onclick = () => nav('#/grading');
  }
  function studentWrongbookView() {
    const entries = state.wfStudentRemote && state.wfStudentRemote.wrongbook || [];
    page(hero('Review Loop', '错题本', '按知识点和复习时间整理真实错题；没有同步数据时不会填入示例题。', button('返回学习首页', 'student-home', 'btn-primary')) + '<section class="wf-card"><div class="wf-card__head"><div><h2>复习条目</h2><p>完成一次复习后，教师或学生可以更新复习状态。</p></div><span class="wf-chip wf-chip--orange">' + entries.length + ' 条</span></div><div class="wf-card__body"><div class="wf-queue">' + (entries.length ? entries.map(item => '<article class="wf-queue-item"><span class="wf-queue-item__icon">' + icon('wrong', 18) + '</span><div class="wf-queue-item__main"><strong>' + esc(item.questionId || '错题条目') + '</strong><span>' + esc(subjectName(item.subject)) + ' · ' + esc(item.note || '记录了失分原因和下一次复习安排') + '</span></div><span class="wf-chip">' + esc(item.reviewStatus || '未复习') + '</span></article>').join('') : empty('错题本还没有同步条目', '完成批改并保存错题后，这里会形成复习清单。')) + '</div></div></section>');
    document.querySelector('[data-wf-action="student-home"]').onclick = () => nav('#/home');
    hydrateStudentLoop();
  }
  function studentPlanView() {
    const user = currentUser(); const plan = user && user.plan || (DB.collection('plans').find(item => item && (!item.studentId || String(item.studentId) === String(user && user.id))) || null);
    const weeks = plan && Array.isArray(plan.weeks) ? plan.weeks : [];
    page(hero('Study Plan', '学习计划', '计划、配套练习和每日安排都来自当前账号的学习记录与结构化工作流。', button('返回学习首页', 'student-home', 'btn-primary')) + '<section class="wf-card"><div class="wf-card__head"><div><h2>' + esc(plan && plan.phase || '还没有生效计划') + '</h2><p>' + esc(plan && plan.goal || '教师发布学习计划后，周任务会显示在这里。') + '</p></div><span class="wf-chip wf-chip--blue">' + weeks.length + ' 周</span></div><div class="wf-card__body"><div class="wf-queue">' + (weeks.length ? weeks.map(week => '<article class="wf-queue-item"><span class="wf-question__no">' + esc(week.week) + '</span><div class="wf-queue-item__main"><strong>' + esc(week.focus || '本周学习重点') + '</strong><span>' + esc((week.tasks || []).join('；') || week.check || '按教师安排完成学习任务') + '</span></div></article>').join('') : empty('学习计划尚未发布', '当前页面不会生成或展示虚构计划。')) + '</div></div></section>');
    document.querySelector('[data-wf-action="student-home"]').onclick = () => nav('#/home');
  }
  function studentKnowledgeView() {
    const nodes = (catalog().knowledgeNodes || []).slice(0, 100);
    page(hero('Knowledge Map', '知识点讲解', '从已入库的教材目录和知识结构进入学习；当前没有目录时保持空状态。', button('返回学习首页', 'student-home', 'btn-primary')) + '<section class="wf-card"><div class="wf-card__head"><div><h2>知识结构</h2><p>点击一个章节查看能力要求、常见错误和来源。</p></div><span class="wf-chip wf-chip--blue">' + nodes.length + ' 个</span></div><div class="wf-card__body"><div class="wf-student-grid">' + (nodes.length ? nodes.map(node => '<a class="wf-student-card" href="#/knowledge/' + esc(node.id) + '"><span class="wf-student-card__icon">' + icon('knowledge', 19) + '</span><h3>' + esc(node.title || node.chapter || node.unit || '知识点') + '</h3><p>' + esc(subjectName(node.subject)) + ' · ' + esc(String(node.grade || '')) + ' 年级 · ' + esc(node.chapter || node.unit || '课程结构') + '</p></a>').join('') : empty('当前没有可用知识目录', '目录从服务端官方参考数据加载。')) + '</div></div></section>');
    document.querySelector('[data-wf-action="student-home"]').onclick = () => nav('#/home');
  }
  function studentKnowledgeDetailView() {
    const id = state.route.replace('/knowledge/', ''); const node = (catalog().knowledgeNodes || []).find(item => String(item.id) === String(id));
    if (!node) { page(hero('Knowledge Map', '知识点不存在', '这条目录记录可能已更新。', button('返回知识点', 'back-knowledge', 'btn-primary')) + '<section class="wf-card">' + empty('找不到知识点') + '</section>'); document.querySelector('[data-wf-action="back-knowledge"]').onclick = () => nav('#/knowledge'); return; }
    const competencies = Array.isArray(node.competencies) ? node.competencies : []; const source = node.source || {};
    page(hero('Knowledge Map', clean(node.title || node.chapter || '知识点'), subjectName(node.subject) + ' · ' + String(node.grade || '') + ' 年级 · ' + clean(node.chapter || node.unit || '课程结构'), button('返回知识点', 'back-knowledge', 'btn-outline')) + '<div class="wf-grid"><section class="wf-card"><div class="wf-card__head"><div><h2>学习提示</h2><p>页面只呈现已入库的结构化信息，不复制教材正文。</p></div></div><div class="wf-card__body">' + (competencies.length ? '<div class="wf-queue">' + competencies.map(item => '<div class="wf-count"><span>' + esc(clean(item)) + '</span><span class="wf-chip wf-chip--blue">能力要求</span></div>').join('') + '</div>' : empty('暂未记录能力要求')) + '</div></section><aside class="wf-card"><div class="wf-card__head"><div><h2>来源</h2><p>目录元数据可追溯到官方来源。</p></div></div><div class="wf-card__body">' + (source.url ? '<a class="wf-source" href="' + esc(source.url) + '" target="_blank" rel="noreferrer">打开来源页面</a>' : empty('没有来源链接')) + '</div></aside></div>');
    document.querySelector('[data-wf-action="back-knowledge"]').onclick = () => nav('#/knowledge');
  }
  function studentResourcesView() {
    const rows = DB.resources().filter(item => item && item.status !== '已下架');
    page(hero('Source Library', '学习资料', '阅读教师发布且有来源记录的资料；页面不会把模型原始输出直接展示给学生。', button('返回学习首页', 'student-home', 'btn-primary')) + '<section class="wf-card"><div class="wf-card__head"><div><h2>资料库</h2><p>标题、摘要和来源由专用资料组件显示。</p></div><span class="wf-chip wf-chip--blue">' + rows.length + ' 份</span></div><div class="wf-card__body"><div class="wf-queue">' + (rows.length ? rows.map(item => '<article class="wf-queue-item"><span class="wf-queue-item__icon">' + icon('res', 18) + '</span><div class="wf-queue-item__main"><strong>' + esc(item.title || '学习资料') + '</strong><span>' + esc(clean(item.summary || item.text || '教师发布的学习资料')) + '</span></div><span class="wf-chip">查看</span></article>').join('') : empty('资料库暂时没有已发布内容', '教师发布并完成来源记录后，学生端会显示。')) + '</div></div></section>');
    document.querySelector('[data-wf-action="student-home"]').onclick = () => nav('#/home');
  }
  function studentHelpView() {
    page(hero('Account & Privacy', '隐私与帮助', '账号、学习记录和模型调用都按学校权限处理。', button('返回学习首页', 'student-home', 'btn-primary')) + '<div class="wf-grid"><section class="wf-card"><div class="wf-card__head"><div><h2>数据说明</h2><p>你能看到的内容取决于账号权限和教师发布状态。</p></div></div><div class="wf-card__body"><div class="wf-queue"><div class="wf-count"><span>成绩与反馈</span><span>只显示教师确认并发布的结果</span></div><div class="wf-count"><span>匿名排名</span><span>不显示姓名、学号或手机号</span></div><div class="wf-count"><span>AI 调用</span><span>连接 Key 不进入学习记录和导出内容</span></div></div></div></section><aside class="wf-card"><div class="wf-card__head"><div><h2>需要帮助</h2><p>请联系任课教师或学校管理员。</p></div></div><div class="wf-card__body">' + notice('如果发现成绩、作业或资料显示异常，请先确认当前账号和学校数据服务连接状态。') + '</div></aside></div>');
    document.querySelector('[data-wf-action="student-home"]').onclick = () => nav('#/home');
  }
  function register() {
    if (!window.__pages) return;
    const originalHome = window.__pages['/home'];
    const originalWrongbook = window.__pages['/wrongbook'];
    const originalStudentPlan = window.__pages['/analytics/students/plan'];
    const originalKnowledge = window.__pages['/knowledge'];
    const originalKnowledgeDetail = window.__pages['/knowledge/_detail'];
    const originalResources = window.__pages['/resources'];
    const originalHelp = window.__pages['/help'];
    window.__pages['/paper'] = renderPaper;
    window.__pages['/paper/mine'] = paperMineView;
    window.__pages['/paper/templates'] = renderPaperTemplates;
    window.__pages['/assignments'] = assignmentListView;
    window.__pages['/assignments/_detail'] = assignmentDetailView;
    window.__pages['/grading'] = renderGrading;
    window.__pages['/grading/_detail'] = gradingDetailView;
    window.__pages['/grading/rubric'] = rubricView;
    window.__pages['/analytics'] = analyticsView;
    window.__pages['/wrongbook'] = function () { return state.role === 'student' ? studentWrongbookView() : originalWrongbook && originalWrongbook(); };
    window.__pages['/analytics/students/plan'] = function () { return state.role === 'student' ? studentPlanView() : originalStudentPlan && originalStudentPlan(); };
    window.__pages['/knowledge'] = function () { return state.role === 'student' ? studentKnowledgeView() : originalKnowledge && originalKnowledge(); };
    window.__pages['/knowledge/_detail'] = function () { return state.role === 'student' ? studentKnowledgeDetailView() : originalKnowledgeDetail && originalKnowledgeDetail(); };
    window.__pages['/resources'] = function () { return state.role === 'student' ? studentResourcesView() : originalResources && originalResources(); };
    window.__pages['/help'] = function () { return state.role === 'student' ? studentHelpView() : originalHelp && originalHelp(); };
    window.__pages['/home'] = function () { return state.role === 'student' ? studentHomeView() : originalHome && originalHome(); };
  }
  register();
  window.addEventListener('fh-reference-catalog', () => { if (state.route === '/paper' || state.route === '/paper/templates') window.__router && window.__router(); });
})();
