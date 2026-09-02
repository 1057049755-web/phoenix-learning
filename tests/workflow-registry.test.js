/* 工作流与制图 Skill 契约回归测试。运行：node tests/workflow-registry.test.js */
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const context = { window: {}, console };
['assets/js/domain-schema.js', 'assets/js/plot-skills.js', 'assets/js/ai-workflows.js'].forEach(file => {
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), context, { filename: file });
});

const plot = context.window.FH_PLOT_SKILLS;
const workflows = context.window.FH_AI_WORKFLOWS;
assert.equal(plot.list().length, 11);
assert.equal(plot.validateInput('function', { expression: 'x^2', coordinateSystem: {}, sampling: {}, annotations: {} }).ok, true);
assert.equal(plot.validateOutput('function', { description: {}, reproducibleCode: 'safe', svg: '<svg id="plot-1"></svg>', pngRef: 'ref', elements: [], binding: {}, blackWhiteCheck: {}, accessibilityText: '函数图', validation: {} }).ok, true);
assert.equal(plot.validateOutput('function', { description: {}, reproducibleCode: 'bad', svg: '<svg><script>alert(1)</script></svg>', pngRef: 'ref', elements: [], binding: {}, blackWhiteCheck: {}, accessibilityText: '图', validation: {} }).ok, false);

assert.equal(workflows.list().length >= 20, true);
const messages = workflows.buildMessages('question.single', { grade: 8, subject: '政治', knowledgePoints: ['x'], difficulty: 3 }, { retrieved: 'untrusted' });
assert.equal(messages.ok, true);
assert.equal(messages.messages[0].role, 'system');
assert.equal(messages.messages[1].role, 'user');
assert.match(messages.messages[1].content, /untrusted-data/);
const sampleQuestion = {
  schemaVersion: 'question.v1', stage: 'junior_middle', grade: 8, subject: '数学', type: '解答题', difficulty: 3,
  difficultyBasis: '条件转化', estimatedMinutes: 8, points: 8, stem: '求未知数。', knowledgePoints: ['一元一次方程'],
  answer: 'x=1', solutionSteps: ['列方程', '解得 x=1'], source: { type: 'ai_generated' },
  generation: { model: 'test-model', createdAt: '2026-09-02T00:00:00Z' }, review: { status: 'draft' }
};
const blocked = workflows.run('analytics.explain', { statistics: {}, period: {}, subjects: ['数学'] }, { records: [], context: {} });
assert.equal(typeof blocked.then, 'function');
blocked.then(result => {
  assert.equal(result.aiCalled, false);
  context.window.AI = { runWorkflow: async () => ({ ok: true, output: { questions: [
    sampleQuestion
  ] }, usage: {} }) };
  return workflows.run('question.batch', { grade: 8, subject: '数学', blueprint: {}, count: 1 }, { context: {} });
}).then(async result => {
  assert.equal(result.ok, true);
  let attempts = 0;
  context.window.AI.runWorkflow = async () => {
    attempts += 1;
    return attempts === 1
      ? { ok: true, output: { questions: [] }, usage: {} }
      : { ok: true, output: { questions: [sampleQuestion] }, usage: {} };
  };
  const retried = await workflows.run('question.batch', { grade: 8, subject: '数学', blueprint: {}, count: 1 }, { context: {} });
  assert.equal(retried.ok, true);
  assert.equal(attempts, 2);
  assert.equal(retried.usage.retryCount, 1);
  console.log('workflow-registry tests: passed');
}).catch(error => { console.error(error); process.exitCode = 1; });
