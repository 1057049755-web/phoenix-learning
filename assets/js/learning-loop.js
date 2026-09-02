/* 凤凰花·智学学生学习闭环 API 适配层 v1
 * 页面只通过这些动作读写作业、提交、反馈、错题、笔记和通知，不把学习记录塞回一张通用快照。
 */
(function () {
  'use strict';
  function networkUrl(path) { return window.FHNetwork && window.FHNetwork.url ? window.FHNetwork.url(path) : path; }
  function headers() { return window.FHNetwork && window.FHNetwork.headers ? window.FHNetwork.headers({ 'Content-Type': 'application/json' }) : { 'Content-Type': 'application/json' }; }
  async function request(method, path, body) {
    const options = { method, headers: headers() };
    if (body !== undefined) options.body = JSON.stringify(body);
    const response = await fetch(networkUrl(path), options);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.ok === false) { const error = new Error(payload.msg || '学习数据服务暂时不可用'); error.code = payload.code; error.status = response.status; throw error; }
    return payload;
  }
  window.FH_LEARNING = Object.freeze({
    listAssignments: () => request('GET', '/api/learning/assignments'),
    saveAssignment: data => request('POST', '/api/learning/assignments', data),
    listSubmissions: () => request('GET', '/api/learning/submissions'),
    saveDraft: data => request('POST', '/api/learning/submissions', Object.assign({}, data, { status: 'draft' })),
    submit: data => request('POST', '/api/learning/submissions', Object.assign({}, data, { status: 'submitted' })),
    listFeedback: () => request('GET', '/api/learning/feedback'),
    saveFeedback: data => request('POST', '/api/learning/feedback', data),
    listWrongbook: () => request('GET', '/api/learning/wrongbook'),
    saveWrongbook: data => request('POST', '/api/learning/wrongbook', data),
    listNotes: () => request('GET', '/api/learning/notes'),
    saveNote: data => request('POST', '/api/learning/notes', data),
    listNotifications: () => request('GET', '/api/learning/notifications'),
    markNotificationRead: id => request('PATCH', '/api/learning/notifications/' + encodeURIComponent(id))
  });
})();
