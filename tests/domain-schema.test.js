/* 无外部依赖的领域契约回归测试。运行：node tests/domain-schema.test.js */
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('assets/js/domain-schema.js', 'utf8');
const context = { window: {}, console };
vm.runInNewContext(source, context, { filename: 'assets/js/domain-schema.js' });
const domain = context.window.FH_DOMAIN;

assert.equal(domain.canonicalSubject('外语'), 'english');
assert.equal(domain.canonicalSubject('政治'), 'ethics');
assert.deepEqual(Array.from(domain.grades), [7, 8, 9]);
assert.equal(domain.difficultyLevels[5].label, '中考压轴');

const validQuestion = {
  schemaVersion: 'question.v1', stage: 'junior_middle', grade: 9, subject: '数学', type: 'calculation',
  difficulty: 4, difficultyBasis: '条件转化与分类讨论', estimatedMinutes: 12, points: 8,
  stem: '设函数满足给定条件，求参数范围。', knowledgePoints: ['函数'], prerequisites: ['代数式'],
  answer: '见分步解答', solutionSteps: ['列出条件', '分类讨论并验证'], source: { type: 'official_metadata', url: 'https://example.invalid/source' },
  generation: { model: 'test-model', createdAt: '2026-09-02T00:00:00Z' }, review: { status: 'pending' }
};
assert.equal(domain.validateQuestion(validQuestion).ok, true);
assert.equal(domain.validateQuestion(Object.assign({}, validQuestion, { options: ['A', 'A'] })).ok, false);

const submissions = [
  { id: 'old-attempt', assignmentId: 'a1', userId: 'u1', subject: '数学', status: 'submitted', score: 7, submittedAt: '2026-08-10T10:00:00Z' },
  { id: 'latest-attempt', assignmentId: 'a1', userId: 'u1', subject: '数学', status: 'submitted', score: 8, submittedAt: '2026-08-11T10:00:00Z' },
  { id: 'a2', assignmentId: 'a2', userId: 'u1', subject: '数学', status: 'submitted', score: 6, submittedAt: '2026-08-12T10:00:00Z' },
  { id: 'a3', assignmentId: 'a3', userId: 'u1', subject: '数学', status: 'submitted', score: 9, submittedAt: '2026-08-13T10:00:00Z' },
  { id: 'draft', assignmentId: 'a4', userId: 'u1', subject: '数学', status: 'draft', score: 10, submittedAt: '2026-08-14T10:00:00Z' }
];
const eligibility = domain.reportEligibility(submissions, ['数学'], { start: '2026-08-01', end: '2026-08-31' });
assert.equal(eligibility.canGenerate, true);
assert.equal(eligibility.counts.math, 3);
assert.equal(domain.reportEligibility(submissions, ['数学', '英语'], { start: '2026-08-01', end: '2026-08-31' }).canGenerate, false);
assert.equal(domain.sanitizeVisibleText('**重点** “内容”'), '重点 内容');
console.log('domain-schema tests: passed');
