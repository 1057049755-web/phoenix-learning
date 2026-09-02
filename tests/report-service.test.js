import assert from 'node:assert/strict';
import { calculateReportStatistics, evaluateReport, flattenGradingRows, normalizeEffectiveRecords } from '../server/report-service.mjs';

const records = [
  { record_json: JSON.stringify({ done: [
    { id: 'a', studentId: 's1', subject: 'math', status: 'done', submittedAt: '2026-09-01T08:00:00Z', score: 80, total: 100 },
    { id: 'b', studentId: 's1', subject: 'math', status: 'done', submittedAt: '2026-09-01T09:00:00Z', score: 90, total: 100 },
    { id: 'c', studentId: 's1', subject: 'math', status: 'done', submittedAt: '2026-09-01T10:00:00Z', score: 70, total: 100 },
    { id: 'd', studentId: 's1', subject: 'english', status: 'done', submittedAt: '2026-09-01T10:00:00Z', score: 70, total: 100 }
  ] }) }
];
const flat = flattenGradingRows(records);
assert.equal(flat.length, 4);
assert.equal(normalizeEffectiveRecords(flat).length, 4);
const gate = evaluateReport(flat, ['math', 'english'], { start: '2026-09-01', end: '2026-09-02' }, 's1');
assert.equal(gate.canGenerate, false);
assert.equal(gate.counts.math, 3);
assert.equal(gate.missing.english, 2);
const stats = calculateReportStatistics(flat, evaluateReport(flat, ['math'], { start: '2026-09-01', end: '2026-09-02' }, 's1'));
assert.equal(stats.math.average, 80);
console.log('report-service.test.js passed');
