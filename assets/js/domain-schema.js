/* 凤凰花·智学领域契约 v1
 * 只保存字段、规则和校验器，不保存教材正文、题目、示例数据或地区卷。
 * 所有内容记录都应带来源、版本和审核状态；未通过校验的数据不得直接渲染。
 */
(function () {
  'use strict';

  const subjects = Object.freeze({
    chinese: { code: 'chinese', name: '语文', aliases: ['语文'] },
    math: { code: 'math', name: '数学', aliases: ['数学'] },
    english: { code: 'english', name: '英语', aliases: ['英语', '外语', 'foreign_language'] },
    physics: { code: 'physics', name: '物理', aliases: ['物理'] },
    chemistry: { code: 'chemistry', name: '化学', aliases: ['化学'] },
    biology: { code: 'biology', name: '生物', aliases: ['生物', '生物学'] },
    history: { code: 'history', name: '历史', aliases: ['历史'] },
    ethics: { code: 'ethics', name: '道德与法治', aliases: ['道德与法治', '政治', '思想品德'] },
    geography: { code: 'geography', name: '地理', aliases: ['地理'] }
  });

  const subjectAliases = Object.freeze(Object.keys(subjects).reduce((out, code) => {
    [code].concat(subjects[code].aliases).forEach(alias => { out[String(alias).toLowerCase()] = code; });
    return out;
  }, {}));

  const difficultyLevels = Object.freeze({
    1: { label: '基础识记', scoreRate: [0.80, 0.95], criteria: ['单一知识点', '信息直接给出', '无需跨步骤推理'] },
    2: { label: '基础应用', scoreRate: [0.65, 0.82], criteria: ['单一知识点应用', '条件显性', '最多两步完成'] },
    3: { label: '综合应用', scoreRate: [0.48, 0.68], criteria: ['两个及以上知识点', '需要条件转化或信息整合', '有可识别的推理链'] },
    4: { label: '探究推理', scoreRate: [0.28, 0.52], criteria: ['隐含条件提取', '分类讨论/实验设计/数形结合/建模至少一项', '多阶段论证'] },
    5: { label: '中考压轴', scoreRate: [0.10, 0.35], criteria: ['多知识点深度融合', '动态、开放、复杂建模或严密证明', '难点来自结构与推理，不以篇幅和计算量代替'] }
  });

  const baseFields = Object.freeze([
    'schemaVersion', 'id', 'stage', 'grade', 'subject', 'region', 'textbookVersion', 'book',
    'unit', 'chapter', 'knowledgePoints', 'prerequisites', 'competencies', 'type', 'difficulty',
    'difficultyBasis', 'estimatedMinutes', 'points', 'stem', 'material', 'options', 'figure',
    'answer', 'solutionSteps', 'rubric', 'commonErrors', 'distractorRationale', 'source',
    'generation', 'review', 'similarity', 'confidence', 'trace'
  ]);

  const subjectFields = Object.freeze({
    chinese: ['readingMaterial', 'passageGroup', 'subjectiveScoringPoints', 'essayRequirement', 'essayBands'],
    math: ['formulas', 'functions', 'geometryConditions', 'auxiliaryLines', 'symbolChecks', 'plotParameters'],
    english: ['passage', 'vocabularyLevel', 'listeningMaterial', 'itemGroup', 'writingRubric'],
    physics: ['units', 'significantFigures', 'experimentSetup', 'quantityRelations', 'calculationChecks'],
    chemistry: ['chemicalFormulas', 'equations', 'reactionConditions', 'experimentSetup', 'balancingChecks'],
    biology: ['structureFigure', 'experimentSteps', 'controlledVariables', 'lifeProcess'],
    history: ['materialSource', 'timeline', 'historicalScope', 'evidenceRelations'],
    ethics: ['materialDate', 'policySource', 'competencyTarget', 'openQuestionRubric'],
    geography: ['map', 'region', 'scale', 'statisticalChart', 'spatialRelations']
  });

  function canonicalSubject(value) {
    return subjectAliases[String(value == null ? '' : value).trim().toLowerCase()] || '';
  }

  function asArray(value) { return Array.isArray(value) ? value : value == null || value === '' ? [] : [value]; }
  function isObject(value) { return !!value && typeof value === 'object' && !Array.isArray(value); }
  function text(value) { return String(value == null ? '' : value).trim(); }
  function issue(code, field, message) { return { code, field, message }; }

  function validateQuestion(input) {
    const q = isObject(input) ? input : {};
    const errors = [];
    const subject = canonicalSubject(q.subject);
    if (q.schemaVersion !== 'question.v1') errors.push(issue('SCHEMA_VERSION', 'schemaVersion', '题目必须使用 question.v1 结构。'));
    if (q.stage !== 'junior_middle') errors.push(issue('STAGE', 'stage', '题目学段必须是 junior_middle。'));
    if (![7, 8, 9].includes(Number(q.grade))) errors.push(issue('GRADE', 'grade', '题目年级必须是七、八或九年级。'));
    if (!subject || !subjects[subject]) errors.push(issue('SUBJECT', 'subject', '题目必须属于九个初中学科。'));
    if (!text(q.type)) errors.push(issue('TYPE', 'type', '缺少题型。'));
    const difficulty = Number(q.difficulty);
    if (!difficultyLevels[difficulty]) errors.push(issue('DIFFICULTY', 'difficulty', '难度必须是 1—5 级。'));
    if (!text(q.stem)) errors.push(issue('STEM', 'stem', '缺少题干。'));
    if (!Number.isFinite(Number(q.points)) || Number(q.points) <= 0) errors.push(issue('POINTS', 'points', '分值必须是正数。'));
    if (!Number.isFinite(Number(q.estimatedMinutes)) || Number(q.estimatedMinutes) <= 0) errors.push(issue('TIME', 'estimatedMinutes', '预计答题时间必须是正数。'));
    if (!text(q.answer) && !asArray(q.solutionSteps).length) errors.push(issue('ANSWER', 'answer', '必须提供标准答案或可验证的分步解答。'));
    if (!asArray(q.knowledgePoints).length) errors.push(issue('KNOWLEDGE', 'knowledgePoints', '至少绑定一个知识点。'));
    if (!isObject(q.source) || !text(q.source.type)) errors.push(issue('SOURCE', 'source', '必须记录来源类型。'));
    if (!isObject(q.generation) || !text(q.generation.model) || !text(q.generation.createdAt)) errors.push(issue('GENERATION', 'generation', '必须记录生成模型与时间。'));
    if (!isObject(q.review) || !text(q.review.status)) errors.push(issue('REVIEW', 'review', '必须记录审核状态。'));
    const options = asArray(q.options).map(text).filter(Boolean);
    if (options.length && new Set(options.map(x => x.toLowerCase())).size !== options.length) errors.push(issue('OPTIONS_DUPLICATE', 'options', '客观题选项不能重复。'));
    if (options.length && !text(q.answer)) errors.push(issue('CHOICE_ANSWER', 'answer', '有选项的题目必须给出标准答案。'));
    if (q.figure && !isObject(q.figure)) errors.push(issue('FIGURE', 'figure', '图形必须是结构化定义。'));
    return { ok: errors.length === 0, errors, subject, level: difficultyLevels[difficulty] || null };
  }

  function normalizeQuestion(input) {
    const q = isObject(input) ? JSON.parse(JSON.stringify(input)) : {};
    q.schemaVersion = 'question.v1';
    q.stage = 'junior_middle';
    q.grade = Number(q.grade);
    q.subject = canonicalSubject(q.subject);
    q.knowledgePoints = asArray(q.knowledgePoints).map(text).filter(Boolean);
    q.prerequisites = asArray(q.prerequisites).map(text).filter(Boolean);
    q.competencies = asArray(q.competencies).map(text).filter(Boolean);
    q.options = asArray(q.options).map(text).filter(Boolean);
    q.solutionSteps = asArray(q.solutionSteps).map(text).filter(Boolean);
    q.commonErrors = asArray(q.commonErrors).map(text).filter(Boolean);
    q.estimatedMinutes = Number(q.estimatedMinutes);
    q.points = Number(q.points);
    q.difficulty = Number(q.difficulty);
    return q;
  }

  function validatePaper(input) {
    const paper = isObject(input) ? input : {};
    const questions = asArray(paper.questions).map(normalizeQuestion);
    const errors = [];
    if (![7, 8, 9].includes(Number(paper.grade))) errors.push(issue('PAPER_GRADE', 'grade', '试卷年级必须是七至九年级。'));
    if (!subjects[canonicalSubject(paper.subject)]) errors.push(issue('PAPER_SUBJECT', 'subject', '试卷学科不在九学科范围内。'));
    if (!questions.length) errors.push(issue('PAPER_EMPTY', 'questions', '试卷至少需要一道题。'));
    questions.forEach((q, index) => {
      const result = validateQuestion(q);
      if (!result.ok) result.errors.forEach(error => errors.push(Object.assign({}, error, { field: `questions[${index}].${error.field}` })));
    });
    const total = questions.reduce((sum, q) => sum + (Number.isFinite(q.points) ? q.points : 0), 0);
    if (paper.totalPoints != null && Number(paper.totalPoints) !== total) errors.push(issue('PAPER_TOTAL', 'totalPoints', `总分应为 ${total} 分。`));
    return { ok: errors.length === 0, errors, totalPoints: total, questionCount: questions.length, questions };
  }

  function effectiveSubmissions(records, start, end) {
    const seen = new Set();
    return asArray(records).slice().sort((a, b) => text(b && (b.submittedAt || b.updatedAt)).localeCompare(text(a && (a.submittedAt || a.updatedAt)))).filter(row => {
      if (!isObject(row) || row.status !== 'submitted' || row.isDraft || row.invalid || row.deletedAt) return false;
      const date = text(row.submittedAt || row.updatedAt);
      if (!date || (start && date < start) || (end && date > end)) return false;
      const key = text(row.submissionGroupId || (row.assignmentId && row.userId ? `${row.assignmentId}:${row.userId}` : row.submissionId || row.id));
      if (!key || seen.has(key)) return false;
      if (!Number.isFinite(Number(row.score)) && !row.evaluation) return false;
      seen.add(key);
      return true;
    });
  }

  function reportEligibility(records, subjectsSelected, period) {
    const selected = Array.from(new Set(asArray(subjectsSelected).map(canonicalSubject).filter(code => subjects[code])));
    const valid = effectiveSubmissions(records, period && period.start, period && period.end);
    const counts = selected.reduce((out, subject) => {
      out[subject] = valid.filter(row => canonicalSubject(row.subject) === subject).length;
      return out;
    }, {});
    const missing = selected.map(subject => ({ subject, count: counts[subject], need: Math.max(0, 3 - counts[subject]) })).filter(row => row.need > 0);
    return {
      canGenerate: selected.length > 0 && missing.length === 0,
      selectedSubjects: selected,
      period: period || null,
      validTotal: valid.length,
      counts,
      missing,
      reason: selected.length === 0 ? '请至少选择一个学科。' : missing.length ? '每个被选学科在所选周期内都需要至少三次有效作业。' : ''
    };
  }

  function sanitizeVisibleText(value) {
    return text(value)
      .replace(/```[\s\S]*?```/g, '')
      .replace(/(^|\s)\*\*([^*]+)\*\*(?=\s|$)/g, '$1$2')
      .replace(/[“”]/g, '')
      .replace(/\s{3,}/g, ' ');
  }

  window.FH_DOMAIN = Object.freeze({
    version: 'domain.v1',
    stage: 'junior_middle',
    grades: [7, 8, 9],
    subjects,
    subjectAliases,
    difficultyLevels,
    baseFields,
    subjectFields,
    canonicalSubject,
    normalizeQuestion,
    validateQuestion,
    validatePaper,
    effectiveSubmissions,
    reportEligibility,
    sanitizeVisibleText
  });
})();
