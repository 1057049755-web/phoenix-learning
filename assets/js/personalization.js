/* ================= 凤凰花·智学 · 个性化数据与推荐层 =================
 * 本文件只使用浏览器能力和 FH_DB，不引入第三方运行时依赖。
 * 数据集合：profiles / knowledge / content_tags / goals / plan_tasks /
 * learning_events / recommendation_feedback / review_schedule / data_dictionary
 */
(function () {
  'use strict';

  const PROFILE_DEFAULTS = {
    goal: '稳步提分',
    weeklyMinutes: 120,
    learningStyle: '例题拆解',
    subjects: ['math'],
    interests: [],
    weakTopics: []
  };

  const DICTIONARY = [
    { name: 'profiles', label: '学习画像', purpose: '记录目标、可投入时间、学科偏好、学习方式与薄弱点', owner: 'student', retention: 'account' },
    { name: 'knowledge', label: '知识点索引', purpose: '把讲解内容变成可推荐、可追踪的知识点资产', owner: 'content', retention: 'long-term' },
    { name: 'content_tags', label: '内容标签', purpose: '沉淀学科、年级、难度、方法与兴趣标签', owner: 'content', retention: 'long-term' },
    { name: 'goals', label: '学习目标', purpose: '记录阶段目标及目标完成状态', owner: 'student', retention: 'account' },
    { name: 'plan_tasks', label: '计划任务', purpose: '将计划书拆成可执行、可勾选、可回写的学生任务', owner: 'student', retention: 'account' },
    { name: 'learning_events', label: '学习事件', purpose: '记录浏览、练习、完成和停留等行为信号', owner: 'student', retention: '90-days' },
    { name: 'recommendation_feedback', label: '推荐反馈', purpose: '记录有用、少推、不感兴趣等反馈并影响后续排序', owner: 'student', retention: 'account' },
    { name: 'review_schedule', label: '复习排期', purpose: '按间隔重复思想安排错题与知识点复习', owner: 'student', retention: 'account' },
    { name: 'data_dictionary', label: '数据字典', purpose: '说明各数据集合用途、归属与保留策略', owner: 'system', retention: 'long-term' }
  ];

  function db() { return window.FH_DB; }
  function now() { return (db() && db().now ? db().now() : new Date().toISOString()); }
  function uid(prefix) { return db() && db().uid ? db().uid(prefix) : prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7); }
  function today() { return db() && db().today ? db().today() : new Date().toISOString().slice(0, 10); }
  function scopeOf(user) {
    if (user && (user.id || user.phone)) return String(user.id || user.phone);
    try { return sessionStorage.getItem('fh_uid') || 'guest'; } catch (e) { return 'guest'; }
  }
  function list(name) {
    const value = db() && db().collection ? db().collection(name) : [];
    return Array.isArray(value) ? value : [];
  }
  function copyProfile(raw) {
    const p = Object.assign({}, PROFILE_DEFAULTS, raw || {});
    p.subjects = Array.isArray(p.subjects) && p.subjects.length ? p.subjects.slice(0, 3) : PROFILE_DEFAULTS.subjects.slice();
    p.interests = Array.isArray(p.interests) ? p.interests.slice(0, 12) : [];
    p.weakTopics = Array.isArray(p.weakTopics) ? p.weakTopics.slice(0, 12) : [];
    p.weeklyMinutes = Number(p.weeklyMinutes) || PROFILE_DEFAULTS.weeklyMinutes;
    return p;
  }
  function getProfile(user) {
    const id = scopeOf(user);
    const row = list('profiles').find(x => String(x.userId) === id);
    return copyProfile(row);
  }
  function saveProfile(user, patch) {
    const id = scopeOf(user);
    const profile = Object.assign(copyProfile(getProfile(user)), patch || {}, { id: 'profile_' + id, userId: id, updatedAt: now() });
    profile.subjects = Array.isArray(profile.subjects) && profile.subjects.length ? profile.subjects.slice(0, 3) : ['math'];
    profile.interests = Array.isArray(profile.interests) ? profile.interests.filter(Boolean).slice(0, 12) : [];
    profile.weakTopics = Array.isArray(profile.weakTopics) ? profile.weakTopics.filter(Boolean).slice(0, 12) : [];
    if (db() && db().upsertRecord) db().upsertRecord('profiles', profile);
    if (db() && db().upsertRecord) db().upsertRecord('goals', { id: 'goal_' + id, userId: id, title: profile.goal, status: '进行中', updatedAt: now() });
    return profile;
  }

  function seedKnowledge(docs) {
    const source = Array.isArray(docs) ? docs : [];
    if (!source.length || !db() || !db().saveCollection) return;
    const current = list('knowledge');
    const byId = {};
    current.forEach(item => { if (item && item.id) byId[item.id] = item; });
    source.forEach(item => {
      if (!item || !item.id) return;
      byId[item.id] = Object.assign({}, byId[item.id] || {}, item, {
        source: 'fh-local-curriculum',
        tags: Array.from(new Set([item.tag, item.subject, item.grade].filter(Boolean))),
        updatedAt: byId[item.id] && byId[item.id].updatedAt || now()
      });
    });
    const merged = Object.keys(byId).map(k => byId[k]);
    if (merged.length !== current.length || source.some(item => !current.some(x => x && x.id === item.id))) db().saveCollection('knowledge', merged);
    const tags = [];
    source.forEach(item => {
      [item.subject, item.grade, item.tag].filter(Boolean).forEach(tag => tags.push({ id: 'tag_' + String(tag).replace(/[^\w\u4e00-\u9fff-]/g, '_'), label: tag, source: 'curriculum' }));
    });
    const tagMap = {};
    list('content_tags').forEach(item => { if (item && item.id) tagMap[item.id] = item; });
    tags.forEach(item => { tagMap[item.id] = Object.assign({}, tagMap[item.id] || {}, item); });
    db().saveCollection('content_tags', Object.keys(tagMap).map(k => tagMap[k]));
  }

  function feedbackFor(user) {
    const id = scopeOf(user);
    const map = {};
    list('recommendation_feedback').filter(x => String(x.userId) === id).forEach(item => { map[item.itemId] = item; });
    return map;
  }
  function recordFeedback(user, itemId, action, meta) {
    const id = scopeOf(user);
    const key = 'feedback_' + id + '_' + itemId;
    const current = list('recommendation_feedback').find(x => x.id === key) || { count: 0, history: [] };
    const row = Object.assign({}, current, {
      id: key, userId: id, itemId: String(itemId), action: action,
      count: Number(current.count || 0) + 1, updatedAt: now(), meta: meta || {}
    });
    row.history = (Array.isArray(current.history) ? current.history : []).concat([{ action: action, at: row.updatedAt }]).slice(-12);
    if (db() && db().upsertRecord) db().upsertRecord('recommendation_feedback', row);
    recordEvent(user, 'recommendation_feedback', { itemId: itemId, action: action });
    return row;
  }
  function recordEvent(user, type, payload) {
    if (!db() || !db().upsertRecord) return;
    const row = Object.assign({ id: uid('event'), userId: scopeOf(user), type: type, at: now() }, payload || {});
    db().upsertRecord('learning_events', row);
    return row;
  }

  function weakSignals(user, profile) {
    const out = [];
    (profile.weakTopics || []).forEach(x => out.push(String(x).toLowerCase()));
    ((user && user.wrongs) || []).forEach(w => {
      [w.docId, w.kp, w.subject].filter(Boolean).forEach(x => out.push(String(x).toLowerCase()));
    });
    return out;
  }
  function textOf(item) { return [item.title, item.brief, item.tag, item.grade, item.kp, item.subject].filter(Boolean).join(' ').toLowerCase(); }
  function labels(item) { return item.subject === 'math' ? '数学' : item.subject === 'zh' ? '语文' : item.subject === 'en' ? '英语' : '通用'; }
  function scoreItem(item, user, profile, feedback) {
    const text = textOf(item);
    const weak = weakSignals(user, profile);
    const subjectNames = { math: '数学', zh: '语文', en: '英语' };
    let score = 10;
    let reason = '与你当前的学习方向匹配';
    if (weak.some(signal => signal && (String(item.id).toLowerCase() === signal || text.indexOf(signal) >= 0))) {
      score += 70;
      reason = '根据你的错题与薄弱点优先安排';
    } else if ((profile.subjects || []).includes(item.subject)) {
      score += 26;
      reason = '符合你关注的' + (subjectNames[item.subject] || '学科');
    }
    const interests = (profile.interests || []).map(x => String(x).toLowerCase()).filter(Boolean);
    if (interests.some(x => text.indexOf(x) >= 0)) { score += 18; reason = '贴合你填写的兴趣方向'; }
    const styleMap = {
      '图示理解': ['图', '模型', '数轴', '面积'],
      '例题拆解': ['例题', '做法', '方法', '步骤'],
      '先做后讲': ['变式', '练习', '主动回忆'],
      '间隔复习': ['复习', '记忆', '间隔']
    };
    const styleHits = styleMap[profile.learningStyle] || [];
    if (styleHits.some(x => text.indexOf(x) >= 0)) { score += 15; reason += '，也符合你的' + profile.learningStyle + '偏好'; }
    const signal = feedback[item.id];
    if (signal && signal.action === 'useful') score += 22;
    if (signal && signal.action === 'less') score -= 24;
    if (signal && signal.action === 'dismiss') score -= 120;
    return { item: item, score: score, reason: reason, subjectLabel: labels(item) };
  }
  function recommendations(user, docs, limit) {
    const source = (list('knowledge').length ? list('knowledge') : (Array.isArray(docs) ? docs : []));
    const profile = getProfile(user);
    const feedback = feedbackFor(user);
    const ranked = source.filter(x => x && x.id).map(item => scoreItem(item, user, profile, feedback)).sort((a, b) => b.score - a.score);
    const visible = ranked.filter(x => !(feedback[x.item.id] && feedback[x.item.id].action === 'dismiss'));
    return (visible.length ? visible : ranked).slice(0, Number(limit) || 4);
  }

  function dateAdd(base, days) {
    const d = new Date(base || Date.now());
    d.setDate(d.getDate() + Number(days || 0));
    return d.toISOString().slice(0, 10);
  }
  function getPlanTasks(user, plan, docs) {
    const id = scopeOf(user);
    const rows = list('plan_tasks').filter(x => String(x.userId) === id).sort((a, b) => String(a.dueDate || '').localeCompare(String(b.dueDate || '')));
    if (rows.length) return rows;
    const recs = recommendations(user, docs, 4);
    const wrong = ((user && user.wrongs) || []).slice(0, 2);
    const tasks = [];
    if (wrong.length) wrong.forEach((item, i) => tasks.push({ id: 'task_' + id + '_wrong_' + i, userId: id, type: 'review', title: '复习错题：' + (item.kp || item.subject || '薄弱题型'), detail: '回到错题本，写出错误原因并重做一遍。', route: '#/wrongbook', dueDate: today(), done: false, source: 'wrongbook' }));
    recs.slice(0, Math.max(1, 4 - tasks.length)).forEach((rec, i) => tasks.push({ id: 'task_' + id + '_knowledge_' + i, userId: id, type: 'knowledge', title: '掌握：' + rec.item.title, detail: rec.reason, knowledgeId: rec.item.id, route: '#/knowledge/' + rec.item.id, dueDate: today(), done: false, source: 'recommendation' }));
    if (!tasks.length && plan) tasks.push({ id: 'task_' + id + '_plan_0', userId: id, type: 'plan', title: '打开学习计划书并完成第一项行动', detail: '先完成一个最小行动，再回看计划的完成标准。', route: '#/analytics/students/plan', dueDate: today(), done: false, source: 'plan' });
    if (tasks.length && db() && db().saveCollection) {
      const merged = list('plan_tasks').concat(tasks);
      db().saveCollection('plan_tasks', merged);
    }
    return tasks;
  }
  function toggleTask(user, taskId, done) {
    const task = list('plan_tasks').find(x => x.id === taskId && String(x.userId) === scopeOf(user));
    if (!task || !db() || !db().upsertRecord) return null;
    task.done = !!done;
    task.completedAt = task.done ? now() : '';
    db().upsertRecord('plan_tasks', task);
    recordEvent(user, task.done ? 'plan_task_completed' : 'plan_task_reopened', { taskId: taskId, knowledgeId: task.knowledgeId || '' });
    return task;
  }
  function scheduleReview(user, item, mastered) {
    if (!db() || !db().upsertRecord || !item) return null;
    const id = scopeOf(user);
    const itemId = String(item.id || item.docId || item.kp || uid('review'));
    const key = 'review_' + id + '_' + itemId;
    const current = list('review_schedule').find(x => x.id === key) || { repetitions: 0, interval: 1 };
    const repetitions = mastered ? Number(current.repetitions || 0) + 1 : 0;
    const intervals = [1, 2, 4, 7, 14, 30];
    const interval = mastered ? intervals[Math.min(repetitions, intervals.length - 1)] : 1;
    const row = Object.assign({}, current, {
      id: key, userId: id, itemId: itemId, title: item.kp || item.subject || '错题复习',
      repetitions: repetitions, interval: interval, lastReviewed: today(), nextReview: dateAdd(today(), interval),
      algorithm: 'FSRS-inspired-local', updatedAt: now()
    });
    db().upsertRecord('review_schedule', row);
    recordEvent(user, 'review_scheduled', { itemId: itemId, mastered: !!mastered, nextReview: row.nextReview });
    return row;
  }
  function getReviewSchedule(user, itemId) {
    const id = scopeOf(user);
    return list('review_schedule').find(x => String(x.userId) === id && String(x.itemId) === String(itemId)) || null;
  }

  function weeklySummary(user, docs) {
    const id = scopeOf(user);
    const since = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const events = list('learning_events').filter(x => String(x.userId) === id && new Date(x.at || 0).getTime() >= since);
    const days = {};
    events.forEach(x => { if (x.at) days[String(x.at).slice(0, 10)] = true; });
    const tasks = list('plan_tasks').filter(x => String(x.userId) === id);
    const completed = tasks.filter(x => x.done && (!x.completedAt || new Date(x.completedAt).getTime() >= since)).length;
    const reviews = list('review_schedule').filter(x => String(x.userId) === id && x.nextReview && x.nextReview <= today()).length;
    const rec = recommendations(user, docs, 1)[0];
    let streak = 0;
    const cursor = new Date();
    for (let i = 0; i < 7; i++) {
      const key = cursor.getFullYear() + '-' + String(cursor.getMonth() + 1).padStart(2, '0') + '-' + String(cursor.getDate()).padStart(2, '0');
      if (!days[key]) break;
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return {
      studyDays: Object.keys(days).length,
      streak: streak,
      views: events.filter(x => ['knowledge_view', 'recommendation_open', 'resource_open'].includes(x.type)).length,
      practices: events.filter(x => x.type === 'practice_completed').length,
      completed: completed,
      dueReviews: reviews,
      focus: rec && rec.item ? rec.item.title : '等待下一条适合你的内容'
    };
  }

  function bootstrap(docs) {
    seedKnowledge(docs || (window.MOCK && window.MOCK.KNOWLEDGE) || []);
    if (db() && db().saveCollection && !list('data_dictionary').length) db().saveCollection('data_dictionary', DICTIONARY.slice());
    return { collections: db() && db().collections ? db().collections() : [] };
  }

  window.FH_PERSONALIZATION = {
    defaults: PROFILE_DEFAULTS,
    dictionary: DICTIONARY,
    bootstrap: bootstrap,
    getProfile: getProfile,
    saveProfile: saveProfile,
    recommendations: recommendations,
    recordFeedback: recordFeedback,
    recordEvent: recordEvent,
    getPlanTasks: getPlanTasks,
    toggleTask: toggleTask,
    scheduleReview: scheduleReview,
    getReviewSchedule: getReviewSchedule,
    weeklySummary: weeklySummary,
    today: today
  };
})();
