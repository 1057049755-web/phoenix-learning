/* 凤凰花·智学页面工作流桥
 * 组卷、批改、学生计划和学情解释统一从 FH_AI_WORKFLOWS 进入；旧页面只接收兼容后的结构化对象。
 */
(function () {
  'use strict';
  const legacy = {};
  const oldAI = window.AI || {};
  ['generateQuestions', 'generateSection', 'gradeAnswer', 'generateExplanations', 'generatePlan', 'generatePlanExercises', 'generatePlanSchedule', 'isConfigured', 'providerLabel', 'normalizeQuestion', 'normType'].forEach(key => { legacy[key] = oldAI[key]; });

  function text(value) { return window.FH_DOMAIN && window.FH_DOMAIN.sanitizeVisibleText ? window.FH_DOMAIN.sanitizeVisibleText(value) : String(value == null ? '' : value).trim(); }
  function subject(value) { return window.FH_DOMAIN && window.FH_DOMAIN.canonicalSubject ? window.FH_DOMAIN.canonicalSubject(value) : String(value || ''); }
  function diffLevel(value) { const item = String(value || ''); return item === '易' ? 2 : item === '难' ? 4 : Number(value) || 3; }
  function oldType(value) { return legacy.normType ? legacy.normType(value) : (String(value || '').includes('选择') ? '选择题' : '解答题'); }
  function canonicalQuestion(raw, input, index) {
    const item = raw && typeof raw === 'object' ? raw : {};
    const q = {
      schemaVersion: 'question.v1', id: item.id || 'workflow-q-' + Date.now() + '-' + index,
      stage: 'junior_middle', grade: Number(item.grade || input.grade), subject: subject(item.subject || input.subject),
      region: text(item.region || input.region || 'general'), textbookVersion: text(item.textbookVersion || input.textbookVersion || ''),
      book: text(item.book || input.book || ''), unit: text(item.unit || ''), chapter: text(item.chapter || ''),
      knowledgePoints: Array.isArray(item.knowledgePoints) ? item.knowledgePoints : (item.kp ? [item.kp] : (input.knowledgePoints || ['课内综合应用'])),
      prerequisites: Array.isArray(item.prerequisites) ? item.prerequisites : [], competencies: Array.isArray(item.competencies) ? item.competencies : [],
      type: text(item.type || input.type || '解答题'), difficulty: Number(item.difficulty || diffLevel(input.difficulty)),
      difficultyBasis: text(item.difficultyBasis || '依据知识点数量、条件转化和推理链判定'), estimatedMinutes: Number(item.estimatedMinutes || 8),
      points: Number(item.points || input.points || 8), stem: text(item.stem || item.question || item.q), material: text(item.material || ''),
      options: Array.isArray(item.options) ? item.options.map(text).filter(Boolean) : [], figure: item.figure && typeof item.figure === 'object' ? item.figure : null,
      answer: text(item.answer || item.standardAnswer || ''), solutionSteps: Array.isArray(item.solutionSteps) ? item.solutionSteps.map(text).filter(Boolean) : (item.process ? String(item.process).split(/\n+/).map(text).filter(Boolean) : []),
      rubric: item.rubric || {}, commonErrors: Array.isArray(item.commonErrors) ? item.commonErrors : [], distractorRationale: item.distractorRationale || '',
      source: { type: 'ai_generated', workflow: 'question.batch', sourceUrl: text(item.sourceUrl || '') },
      generation: { model: text(item.model || ''), version: text(item.modelVersion || ''), createdAt: new Date().toISOString() },
      review: { status: 'draft', qualityGate: 'workflow' }, similarity: item.similarity || {}, confidence: Number(item.confidence || 0), trace: { workflow: 'question.batch' },
      explain: text(item.explain || item.explanation || '')
    };
    const check = window.FH_DOMAIN.validateQuestion(q);
    if (!check.ok) return null;
    return q;
  }
  function adaptQuestions(raw, input, result) {
    if (result && result.model) input.model = result.model;
    const source = Array.isArray(raw) ? raw : (raw && (raw.questions || raw.items || raw.data)) || [];
    const questions = source.map((item, index) => canonicalQuestion(item, input, index)).filter(Boolean);
    return { questions };
  }
  function toLegacyQuestion(q, input, index) {
    const raw = Object.assign({}, q, {
      type: oldType(q.type), diff: Number(q.difficulty) >= 4 ? '难' : Number(q.difficulty) <= 2 ? '易' : '中',
      kp: (q.knowledgePoints || []).join('、'), explain: q.explain || (q.solutionSteps || []).join('\n'), process: (q.solutionSteps || []).join('\n')
    });
    return legacy.normalizeQuestion ? legacy.normalizeQuestion(raw, { type: raw.type, diff: raw.diff }, index, { subject: subject(input.subject) }) : raw;
  }
  function adaptGrade(raw, input) {
    const item = raw && (raw.result || raw.grading || raw) || {};
    return { score: Number(item.score || 0), total: Number(input.total || item.total || 100), comment: text(item.comment || item.feedback || ''), reasons: Array.isArray(item.reasons) ? item.reasons.map(reason => ({ type: reason.type === 'bad' ? 'bad' : 'good', text: text(reason.text) })).filter(reason => reason.text) : [] };
  }
  function adaptExplain(raw) { const source = Array.isArray(raw) ? raw : (raw && (raw.items || raw.explanations || [])); return source.map(item => ({ no: Number(item.no), kp: text(item.kp || (item.knowledgePoints || []).join('、')), explain: text(item.explain || item.explanation || (item.solutionSteps || []).join('\n')) })).filter(item => item.no && item.explain); }
  function adaptPlan(raw) {
    const item = raw && (raw.plan || raw.result || raw) || {};
    return {
      phase: text(item.phase || '下一阶段（4 周）提升计划'), goal: text(item.goal || item.objective || ''),
      weeks: Array.isArray(item.weeks) ? item.weeks.slice(0, 4).map((week, index) => ({ week: Number(week.week) || index + 1, focus: text(week.focus || ''), tasks: Array.isArray(week.tasks) ? week.tasks.map(text).filter(Boolean) : [], check: text(week.check || '') })) : [],
      specialTopics: Array.isArray(item.specialTopics) ? item.specialTopics.map(text).filter(Boolean) : [], studentTips: Array.isArray(item.studentTips || item.nextSteps) ? (item.studentTips || item.nextSteps).map(text).filter(Boolean) : []
    };
  }
  function adaptSchedule(raw) {
    const item = raw && (raw.schedule || raw.result || raw) || {};
    const items = Array.isArray(item.items) ? item.items.slice(0, 5).map(entry => ({ time: text(entry.time || ''), minutes: Number(entry.minutes) || 5, desc: text(entry.desc || '') })).filter(entry => entry.desc) : [];
    return { dailyMinutes: Number(item.dailyMinutes) || 30, weeklyTotal: Number(item.weeklyTotal) || 210, items };
  }
  function context() { return window.FH_REFERENCE_DATA ? window.FH_REFERENCE_DATA.getCatalog() : {}; }
  async function run(key, input, adapt, options) {
    const result = await window.FH_AI_WORKFLOWS.run(key, input, Object.assign({ context: context() }, options || {}, { adaptOutput: adapt }));
    if (!result.ok) {
      const error = new Error(result.stage === 'eligibility' ? '所选周期内的有效作业数量不足，暂不生成报告' : (result.errors && result.errors[0] && result.errors[0].message) || '工作流未通过质量检查');
      error.workflow = key; error.result = result; throw error;
    }
    return result.output;
  }
  async function generateQuestions(params) {
    const input = Object.assign({}, params, { subject: subject(params.subjectKey || params.subject), knowledgePoints: params.knowledgePoints || [], blueprint: { type: params.type, difficulty: params.diff, reading: !!params.includeReading } });
    const output = await run('question.batch', input, raw => adaptQuestions(raw, input), { maxTokens: 5200, timeout: 90000 });
    return output.questions.map((q, index) => toLegacyQuestion(q, input, index)).filter(Boolean);
  }
  async function generateSection(params) {
    const input = Object.assign({}, params, { subject: subject(params.subjectKey || params.subject), blueprint: { type: params.type, points: params.points, difficultyMix: params.mix } });
    const output = await run('question.batch', input, raw => adaptQuestions(raw, input), { maxTokens: 7200, timeout: 90000 });
    return output.questions.map((q, index) => toLegacyQuestion(q, input, index)).filter(Boolean).map(q => Object.assign(q, { points: Array.isArray(params.points) ? params.points[index] : params.points }));
  }
  async function gradeAnswer(params) {
    return adaptGrade(await run('grading.score', { question: { task: params.task, total: params.total, answers: params.answers }, studentAnswer: params.answers, rubric: params.rubric || {} }, raw => adaptGrade(raw, params), { maxTokens: 1800, timeout: 60000 }), params);
  }
  async function generateExplanations(params) {
    return adaptExplain(await run('answer.generate', { question: { task: params.task, answers: params.answers }, answer: params.answers }, raw => raw, { maxTokens: 4200, timeout: 90000 }));
  }
  async function generatePlan(params) {
    const input = { studentProfile: { name: params.student, grade: params.grade, homework: params.homework || [], wrongs: params.wrongs || [] }, weakPoints: params.weakPoints || [], constraints: { weeks: 4, audience: 'junior_middle_student' } };
    return run('practice.personalize', input, raw => adaptPlan(raw, input), { maxTokens: 3200, timeout: 90000 });
  }
  async function generatePlanExercises(params) {
    const gradeMatch = String(params.grade || (params.studentProfile && params.studentProfile.grade) || '7').match(/[789]/);
    const input = { studentProfile: { name: params.student, grade: Number(gradeMatch ? gradeMatch[0] : 7) }, plan: params.plan || {}, count: Number(params.count) || 8, grade: Number(gradeMatch ? gradeMatch[0] : 7), subject: subject(params.subject || 'math'), knowledgePoints: params.weakPoints || [], type: '解答题' };
    const output = await run('practice.exercises', input, raw => adaptQuestions(raw, input), { maxTokens: 5200, timeout: 90000 });
    return output.questions.map((q, index) => toLegacyQuestion(q, input, index)).filter(Boolean).map(q => ({ id: q.id, q: q.stem, kp: q.kp, type: q.type, options: q.options || [], answer: q.answer, explain: q.explain || q.process }));
  }
  async function generatePlanSchedule(params) {
    const input = { studentProfile: { name: params.student }, plan: params.plan || {}, exercises: params.exercises || [] };
    return run('practice.schedule', input, raw => adaptSchedule(raw, input), { maxTokens: 1800, timeout: 60000 });
  }
  async function generateReport(records, subjects, period, statistics) {
    const selected = subjects || [];
    const gate = window.FH_DOMAIN.reportEligibility(records || [], selected, period || {});
    if (!gate.canGenerate) return { ok: false, gate, aiCalled: false };
    return { ok: true, gate, aiCalled: true, explanation: await run('analytics.explain', { statistics: statistics || {}, period: period || {}, subjects: selected }, raw => raw, { records, maxTokens: 2200, timeout: 60000 }) };
  }
  function isConfigured() {
    const status = window.__FH_AI_STATUS__;
    const config = window.AI && window.AI.getConfig ? window.AI.getConfig() : {};
    const profile = window.FH_AI_RUNTIME && window.FH_AI_RUNTIME.getActiveProfile ? window.FH_AI_RUNTIME.getActiveProfile() : (window.AI && window.AI.getProfile ? window.AI.getProfile(config.activeProfileId, true) : null);
    const endpoint = window.FH_AI_RUNTIME && window.FH_AI_RUNTIME.endpoint ? window.FH_AI_RUNTIME.endpoint(profile || {}) : profile && (profile.endpoint || profile.baseUrl);
    return !!((profile && endpoint && profile.apiKey) || (status && status.configured));
  }
  function providerLabel() {
    const active = window.FH_AI_RUNTIME && window.FH_AI_RUNTIME.getActiveProfile ? window.FH_AI_RUNTIME.getActiveProfile() : null;
    if (active && active.provider && active.model) return (active.providerName || active.provider) + ' · ' + active.model;
    const model = window.FH_REFERENCE_DATA && window.FH_REFERENCE_DATA.getModels().models[0];
    return model ? model.officialName : (legacy.providerLabel ? legacy.providerLabel() : '网络 AI');
  }
  if (!window.AI) window.AI = {};
  window.AI.generateQuestions = generateQuestions;
  window.AI.generateSection = generateSection;
  window.AI.gradeAnswer = gradeAnswer;
  window.AI.generateExplanations = generateExplanations;
  window.AI.generatePlan = generatePlan;
  window.AI.generatePlanExercises = generatePlanExercises;
  window.AI.generatePlanSchedule = generatePlanSchedule;
  window.AI.isConfigured = isConfigured;
  window.AI.providerLabel = providerLabel;
  window.AI.runWorkflow = async function (messages, options) {
    const opts = options || {};
    if (!window.AI || typeof window.AI.chat !== 'function') return { ok: false, code: 'AI_NOT_AVAILABLE', message: '本地 AI 连接层未加载' };
    const started = Date.now();
    try {
      const content = await window.AI.chat(messages, { maxTokens: opts.maxTokens, temperature: opts.temperature, timeout: opts.timeout, workflow: opts.workflow });
      let output = null;
      try { output = JSON.parse(String(content || '').replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')); } catch (e) { return { ok: false, code: 'INVALID_STRUCTURED_OUTPUT', message: '模型没有返回可解析的结构化结果', usage: { latencyMs: Date.now() - started } }; }
      const config = window.AI.getConfig ? window.AI.getConfig() : {};
      return { ok: true, output, model: config.model || '', usage: { latencyMs: Date.now() - started } };
    } catch (error) {
      return { ok: false, code: error && error.code || 'AI_REQUEST_FAILED', message: String(error && error.message || '本地浏览器 AI 请求失败'), usage: { latencyMs: Date.now() - started } };
    }
  };
  window.FH_WORKFLOW_BRIDGE = Object.freeze({ run, generateQuestions, generateSection, gradeAnswer, generateExplanations, generateReport, legacy });
})();
