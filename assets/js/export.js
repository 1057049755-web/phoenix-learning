/* ================= 凤凰花·智学 试卷导出（市面卷格式） =================
 * 输出 A4 标准试卷：卷头（校名/标题/满分时间/班级姓名学号）、注意事项、
 * 分题型题目（选择题/填空题/解答题带答题区）、参考答案与详解。
 * Word：生成 .doc（HTML 包装，可在 Word/WPS 打开）；
 * PDF：打开打印预览，浏览器“另存为 PDF”。
 */
(function () {
  'use strict';

  const GRADE_NAMES = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function sectionOf(type) {
    if (type === '选择题') return 'choice';
    if (type === '判断题') return 'judge';
    if (type === '填空题') return 'fill';
    if (type === '多选题') return 'multi';
    if (type === '阅读题') return 'reading';
    return 'solve';
  }

  function buildQuestionsHtml(qs) {
    const sections = { choice: [], judge: [], fill: [], multi: [], reading: [], solve: [] };
    let no = 0;
    qs.forEach(q => {
      no++;
      if (q.type === '资料') return;
      const item = Object.assign({}, q, { no: no });
      sections[sectionOf(q.type)].push(item);
    });
    const CN = ['一', '二', '三', '四', '五', '六'];
    const sectionDefs = [
      { key: 'choice', title: '选择题' },
      { key: 'judge', title: '判断题' },
      { key: 'fill', title: '填空题' },
      { key: 'multi', title: '多选题' },
      { key: 'reading', title: '阅读题' },
      { key: 'solve', title: '解答题' }
    ];
    let html = '';
    let secIdx = 0;
    sectionDefs.forEach(def => {
      const items = sections[def.key];
      if (!items.length) return;
      secIdx++;
      const totalScore = items.reduce((s, q) => s + (q.points || 3), 0);
      const firstP = items[0].points;
      const uniform = items.every(q => q.points === firstP);
      html += '<div class="section-title">' + CN[secIdx - 1] + '、' + def.title + '（' +
        (uniform ? '每题 ' + firstP + ' 分' : '分值见题后标注') +
        '，共 ' + items.length + ' 题，' + totalScore + ' 分）</div>';
      items.forEach(q => {
        html += '<div class="q-item">' +
          (def.key === 'reading' && q.passage
            ? '<div class="read-material"><div class="read-material-title">阅读材料</div>' + esc(q.passage).replace(/\n/g, '<br>') +
              (q.sourceNote ? '<div class="read-srcnote">' + esc(q.sourceNote) + '</div>' : '') + '</div>'
            : '') +
          '<div class="q-stem"><span class="q-no">' + q.no + '．</span>' + esc(q.stem) +
          ((def.key === 'solve' || def.key === 'reading') && q.points ? '<span class="q-score">（' + q.points + ' 分）</span>' : '') + '</div>';
        if (q.figure && window.MathPlot) {
          const figSvg = window.MathPlot.figureSVG(q.figure);
          if (figSvg) html += '<div class="q-figure">' + figSvg + '</div>';
        }
        if (q.options && q.options.length) {
          html += '<div class="q-opts">' + q.options.map(o => '<span class="q-opt">' + esc(o.replace(/^([A-E])[\.．、]\s*/, '$1. ')) + '</span>').join('') + '</div>';
        } else if (def.key === 'judge') {
          html += '<div class="q-opts"><span class="q-opt">（　）正确　　（　）错误</span></div>';
        } else if (def.key === 'fill') {
          html += '<div class="fill-blank"></div>';
        } else {
          html += '<div class="solve-area"><div class="line"></div><div class="line"></div><div class="line"></div><div class="line"></div><div class="line"></div><div class="line"></div></div>';
        }
        html += '</div>';
      });
    });
    return html;
  }

  function buildAnswersHtml(qs) {
    if (!qs.length) return '';
    let no = 0;
    let html = '<div class="section-title" style="page-break-before:always">参考答案与详解</div>';
    qs.forEach(q => {
      no++;
      if (q.type === '资料') return;
      const figSvg = (q.figure && window.MathPlot) ? window.MathPlot.figureSVG(q.figure) : '';
      html += '<div class="ans-item"><div class="ans-head"><b>第 ' + no + ' 题</b>（' + esc(q.type) + '）　答案：<b>' + esc(q.answer || '见下方详解') + '</b>' +
        (q.points ? '　（' + q.points + ' 分）' : '') + '</div>' +
        '<div class="ans-stem">' + esc(q.stem) + '</div>' +
        (figSvg ? '<div class="q-figure">' + figSvg + '</div>' : '') +
        (q.kp ? '<div class="ans-explain"><b>【知识点讲解（不只讲答案）】</b><br>' + esc(q.kp).replace(/\n/g, '<br>') + '</div>' : '') +
        (q.process ? '<div class="ans-explain"><b>【解题过程】</b><br>' + esc(q.process).replace(/\n/g, '<br>') + '</div>' : '') +
        '<div class="ans-explain">' + esc(q.explain || '（暂无详解，可在命题页编辑补充）').replace(/\n/g, '<br>') + '</div></div>';
    });
    return html;
  }

  function paperMeta() {
    const s = window.__app.state;
    const ctx = s.paper.ctx || { subject: 'math', grade: 7, term: '上', version: 'renjiao' };
    const M = window.MOCK;
    const subj = M.TEXTBOOKS[ctx.subject];
    const ver = subj && subj.versions.find(v => v.id === ctx.version);
    return {
      gradeText: GRADE_NAMES[ctx.grade] || ctx.grade,
      subjectText: subj ? subj.name : '学科',
      versionText: ver ? ver.name : ''
    };
  }

  function buildHTML(opts) {
    opts = opts || {};
    const withAnswers = opts.withAnswers !== false;
    const s = window.__app.state;
    const qs = s.paper.questions;
    const meta = paperMeta();
    const name = s.paper.name || '单元测试卷';
    const total = qs.reduce((sum, q) => sum + (q.points || 0), 0);
    const times = (window.AI && window.AI.estimatePaperTime)
      ? window.AI.estimatePaperTime(qs, {})
      : { exam: 90, suggested: 45 };
    const now = new Date();
    const schoolYear = now.getMonth() + 1 >= 9 ? (now.getFullYear()) + '-' + (now.getFullYear() + 1) : (now.getFullYear() - 1) + '-' + now.getFullYear();
    const term = s.paper.ctx && s.paper.ctx.term === '下' ? '第二学期' : '第一学期';
    const html =
      '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><title>' + esc(name) + '</title>' +
      '<style>' +
      '@page { size: A4; margin: 18mm 16mm 16mm; }' +
      'body { font-family: "SimSun","Songti SC","STSong",serif; font-size: 12pt; color: #000; line-height: 1.8; margin: 0; }' +
      '.paper-footer { position: fixed; bottom: 0; left: 0; right: 0; text-align: center; font-size: 9pt; color: #666; }' +
      '.paper-footer span.pn::before { content: "第 " counter(page) " 页 / 共 " counter(pages) " 页"; }' +
      '.school { text-align: center; font-size: 11pt; letter-spacing: 2px; color: #444; }' +
      '.paper-title { text-align: center; font-size: 17pt; font-weight: bold; margin: 6px 0 2px; }' +
      '.paper-sub { text-align: center; font-size: 11pt; margin-bottom: 8px; }' +
      '.paper-meta { display: flex; justify-content: space-between; font-size: 11pt; border-bottom: 1.5px solid #000; padding-bottom: 6px; margin-bottom: 6px; }' +
      '.notice { border: 1px solid #000; padding: 6px 10px; font-size: 10.5pt; margin-bottom: 12px; }' +
      '.notice b { display: block; margin-bottom: 2px; }' +
      '.info-line { display: flex; gap: 24px; font-size: 11pt; margin: 6px 0 12px; }' +
      '.info-line .u { flex: 1; border-bottom: 1px solid #000; display: inline-block; }' +
      '.section-title { font-weight: bold; margin: 12px 0 8px; }' +
      '.q-item { margin-bottom: 10px; page-break-inside: avoid; }' +
      '.q-stem { text-align: justify; }' +
      '.q-no { font-weight: bold; }' +
      '.q-score { font-size: 10.5pt; color: #555; margin-left: 6px; }' +
      '.q-figure { text-align: center; margin: 6px 0; }' +
      '.q-figure svg { max-width: 300px; border: 1px solid #ddd; border-radius: 6px; background: #fff; }' +
      '.q-opts { margin: 2px 0 0 24px; font-size: 11.5pt; }' +
      '.q-opt { display: inline-block; width: 45%; }' +
      '.read-material { border: 1px solid #999; padding: 8px 10px; margin: 6px 0 8px; font-size: 11pt; line-height: 1.9; }' +
      '.read-material-title { font-weight: bold; margin-bottom: 4px; }' +
      '.read-srcnote { font-size: 9.5pt; color: #666; margin-top: 6px; border-top: 1px dashed #999; padding-top: 4px; }' +
      '.fill-blank { width: 55%; border-bottom: 1px solid #000; height: 22px; margin-top: 4px; }' +
      '.solve-area { margin: 8px 0 2px; }' +
      '.solve-area .line { border-bottom: 1px solid #bbb; height: 26px; }' +
      '.ans-item { margin-bottom: 14px; page-break-inside: avoid; }' +
      '.ans-head { font-size: 11pt; }' +
      '.ans-stem { font-size: 10.5pt; color: #333; margin: 3px 0; }' +
      '.ans-explain { font-size: 10.5pt; color: #222; border-left: 3px solid #999; padding-left: 8px; margin-top: 4px; }' +
      '@media print { .toolbar { display: none; } body { font-size: 12pt; } }' +
      '</style></head><body>' +
      '<div class="paper-footer"><span class="pn"></span></div>' +
      '<div class="school">凤凰花·智学</div>' +
      '<div class="paper-title">' + esc(meta.gradeText) + '年级' + esc(meta.subjectText) + '《' + esc(name) + '》</div>' +
      '<div class="paper-sub">' + schoolYear + ' 学年' + term + ' · ' + esc(meta.versionText) + ' · 命题：凤凰花·智学 · ' + (withAnswers ? '教师版（含答案与详解）' : '学生版（纯试卷）') + '</div>' +
      '<div class="paper-meta"><span>满分：' + total + ' 分</span><span>考试时间：' + times.exam + ' 分钟</span><span>建议时长：' + times.suggested + ' 分钟</span></div>' +
      '<div class="notice"><b>注意事项：</b>1. 答题前请填写班级、姓名、学号；2. 客观题请将答案填在题后括号内，主观题请在指定区域作答；3. 考试结束后将试卷与答题纸一并交回。</div>' +
      '<div class="info-line"><span>班级：<span class="u"></span></span><span>姓名：<span class="u"></span></span><span>学号：<span class="u"></span></span></div>' +
      buildQuestionsHtml(qs) +
      (withAnswers ? buildAnswersHtml(qs) : '<div class="notice" style="margin-top:30px;border-style:dashed"><b>交卷说明：</b>学生完成作答后，答案与详解将在教师批改发布后于学生端查看。</div>') +
      '</body></html>';
    return html;
  }

  function downloadWord() {
    const s = window.__app.state;
    if (!s.paper.questions.length) { window.__app.showToast('试卷为空，无法导出', 'error'); return; }
    const name = s.paper.name || '未命名试卷';
    const html = buildHTML({ withAnswers: s.paper.exportVer !== 'student' }).replace('<!DOCTYPE html>', '');
    if (window.fhNativeSave && window.fhNativeSave(name + '.doc', html)) {
      window.__app.showToast('Word 试卷已导出到系统「下载」：' + name + '.doc', 'success');
      return;
    }
    const full = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>' + esc(name) + '</title><!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]--><style>@page{size:210mm 297mm;margin:18mm 16mm 16mm}body{font-family:"宋体",SimSun;font-size:12pt}</style></head><body>' + html + '</body></html>';
    const blob = new Blob(['\ufeff', full], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name + '.doc';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1500);
    window.__app.showToast('Word 试卷已导出：' + name + '.doc', 'success');
  }

  function openPrintPreview() {
    const s = window.__app.state;
    if (!s.paper.questions.length) { window.__app.showToast('试卷为空，无法导出', 'error'); return; }
    const name = s.paper.name || '未命名试卷';
    const win = window.open('about:blank', '_blank', 'width=900,height=1100');
    if (!win) { window.__app.showToast('浏览器拦截了新窗口，请允许弹窗后重试', 'error'); return; }
    win.document.open();
    win.document.write(
      buildHTML({ withAnswers: s.paper.exportVer !== 'student' }).replace('</head>',
        '<div class="toolbar" style="position:fixed;top:0;left:0;right:0;background:#fff;border-bottom:2px solid #2E74B5;padding:8px 16px;z-index:99;display:flex;gap:10px;align-items:center;font-family:sans-serif">' +
        '<b style="color:#0B2545">试卷打印预览 · ' + esc(name) + '</b>' +
        '<button onclick="window.print()" style="background:#2E74B5;color:#fff;border:0;padding:7px 16px;border-radius:6px;cursor:pointer">打印 / 另存为 PDF</button>' +
        '<span style="color:#666;font-size:12px">市面卷 A4 版式 · 浏览器打印时选择“另存为 PDF”</span></div>' +
        '<style>@media print{.toolbar{display:none}}</style></head>')
    );
    win.document.close();
    win.focus();
    window.__app.showToast('已打开打印预览（含参考答案与详解）', 'success');
  }

  window.PaperExport = {
    buildHTML: buildHTML,
    downloadWord: downloadWord,
    openPrintPreview: openPrintPreview
  };
})();
