const MIN_VALID_SUBMISSIONS = 3;
const VALID_STATUSES = new Set(['submitted', 'returned', 'done', 'completed', '已完成', '教师复核']);

function parse(value, fallback) {
  try { return typeof value === 'string' ? JSON.parse(value) : value == null ? fallback : value; } catch { return fallback; }
}

export function flattenGradingRows(rows = []) {
  const result = [];
  for (const row of rows || []) {
    const payload = parse(row && row.record_json, row);
    if (!payload || typeof payload !== 'object') continue;
    const groups = ['recognized', 'grading', 'review', 'done'];
    const hasGroups = groups.some(key => Array.isArray(payload[key]));
    if (hasGroups) {
      groups.forEach(group => (payload[group] || []).forEach(item => result.push(Object.assign({}, item, { _group: group }))));
    } else if (Array.isArray(payload)) payload.forEach(item => result.push(Object.assign({}, item)));
    else result.push(Object.assign({}, payload));
  }
  return result;
}

export function normalizeEffectiveRecords(records = []) {
  const candidates = records.map((item, index) => {
    const score = Number(item.score);
    const total = Number(item.total || 100);
    const submittedAt = String(item.submittedAt || item.submitted_at || item.updatedAt || item.updated_at || item.createdAt || item.created_at || '');
    return Object.assign({}, item, { score, total, submittedAt, status: item.status || (item._group === 'done' ? 'done' : ''), _index: index });
  }).filter(item => item.score >= 0 && item.total > 0 && item.score <= item.total && !!item.submittedAt && VALID_STATUSES.has(String(item.status)) && String(item.status) !== 'draft' && String(item.status) !== 'invalid' && String(item.status) !== '作废');
  const latest = new Map();
  for (const item of candidates) {
    const key = String(item.submissionId || item.submission_id || item.id || (String(item.assignmentId || item.assignment_id || '') + ':' + String(item.userId || item.studentId || '')));
    const previous = latest.get(key);
    if (!previous || item.submittedAt > previous.submittedAt || (item.submittedAt === previous.submittedAt && item._index > previous._index)) latest.set(key, item);
  }
  return Array.from(latest.values()).map(item => { const copy = Object.assign({}, item); delete copy._index; return copy; });
}

export function evaluateReport(records = [], subjects = [], period = {}, userId = '') {
  const start = String(period.start || period.periodStart || '').slice(0, 10);
  const end = String(period.end || period.periodEnd || '').slice(0, 10);
  const selected = Array.from(new Set((subjects || []).map(item => String(item || '').trim()).filter(Boolean)));
  const scoped = normalizeEffectiveRecords(records).filter(item => {
    const subject = String(item.subject || item.subjectCode || item.subject_code || '').trim();
    const date = String(item.submittedAt).slice(0, 10);
    const owner = String(item.userId || item.studentId || item.student_id || '');
    return selected.includes(subject) && (!userId || !owner || owner === String(userId)) && date >= start && date <= end;
  });
  const counts = Object.fromEntries(selected.map(subject => [subject, scoped.filter(item => String(item.subject || item.subjectCode || item.subject_code) === subject).length]));
  const missing = Object.fromEntries(selected.map(subject => [subject, Math.max(0, MIN_VALID_SUBMISSIONS - counts[subject])]));
  const canGenerate = !!start && !!end && start <= end && selected.length > 0 && selected.every(subject => counts[subject] >= MIN_VALID_SUBMISSIONS);
  return { canGenerate, minRequired: MIN_VALID_SUBMISSIONS, period: { start, end }, subjects: selected, counts, missing, validRecordCount: scoped.length, aiCalled: false };
}

export function calculateReportStatistics(records = [], eligibility) {
  const gate = eligibility || evaluateReport(records, [], {});
  const valid = normalizeEffectiveRecords(records).filter(item => {
    const subject = String(item.subject || item.subjectCode || item.subject_code || '');
    const date = String(item.submittedAt).slice(0, 10);
    return gate.subjects.includes(subject) && date >= gate.period.start && date <= gate.period.end;
  });
  return Object.fromEntries(gate.subjects.map(subject => {
    const rows = valid.filter(item => String(item.subject || item.subjectCode || item.subject_code) === subject);
    const percentages = rows.map(item => item.score / item.total * 100);
    const average = percentages.length ? Math.round(percentages.reduce((sum, value) => sum + value, 0) / percentages.length) : 0;
    const highest = percentages.length ? Math.round(Math.max(...percentages)) : 0;
    const lowest = percentages.length ? Math.round(Math.min(...percentages)) : 0;
    return [subject, { count: rows.length, average, highest, lowest, totalScore: rows.reduce((sum, item) => sum + item.score, 0), totalPossible: rows.reduce((sum, item) => sum + item.total, 0) }];
  }));
}
