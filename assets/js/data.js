/* 凤凰花·智学 v3 结构配置
 * 本文件只保存导航、权限和字段定义，不保存题目、教材正文、阅读材料或示例数据。
 * 课程、教材、知识点、试卷模板和学习资源均从受权限保护的网络服务获取。
 */
(function () {
  'use strict';

  const subjects = {
    chinese: { code: 'chinese', name: '语文' },
    math: { code: 'math', name: '数学' },
    english: { code: 'english', name: '英语' },
    science: { code: 'science', name: '科学' },
    physics: { code: 'physics', name: '物理' },
    chemistry: { code: 'chemistry', name: '化学' },
    biology: { code: 'biology', name: '生物学' },
    history: { code: 'history', name: '历史' },
    geography: { code: 'geography', name: '地理' },
    ethics: { code: 'ethics', name: '道德与法治' },
    information_technology: { code: 'information_technology', name: '信息科技' },
    pe_health: { code: 'pe_health', name: '体育与健康' },
    arts: { code: 'arts', name: '艺术' },
    labor: { code: 'labor', name: '劳动' },
    integrated_practice: { code: 'integrated_practice', name: '综合实践活动' }
  };

  const emptyTextbook = code => ({
    name: subjects[code].name,
    versions: []
  });

  const nav = {
    teacher: [
      { key: 'home', label: '首页', route: '#/home', icon: 'home' },
      { key: 'paper', label: '命题组卷', route: '#/paper', icon: 'paper' },
      { key: 'grading', label: '批改中心', route: '#/grading', icon: 'grading' },
      { key: 'resources', label: '学习资源', route: '#/resources', icon: 'book' },
      { key: 'analytics', label: '学情报告', route: '#/analytics', icon: 'chart' }
    ],
    admin: [
      { key: 'home', label: '首页', route: '#/home', icon: 'home' },
      { key: 'admin', label: '学校管理', route: '#/admin', icon: 'school' },
      { key: 'resources', label: '资源审核', route: '#/resources', icon: 'book' }
    ],
    student: [
      { key: 'home', label: '首页', route: '#/home', icon: 'home' },
      { key: 'knowledge', label: '知识点讲解', route: '#/knowledge', icon: 'knowledge' },
      { key: 'wrongbook', label: '错题本', route: '#/wrongbook', icon: 'wrong' },
      { key: 'grading', label: '批改反馈', route: '#/grading', icon: 'grading' },
      { key: 'resources', label: '学习资源', route: '#/resources', icon: 'book' },
      { key: 'plan', label: '我的学习计划', route: '#/analytics/students/plan', icon: 'plan' }
    ]
  };

  const common = [
    { label: '首页', route: '#/home', icon: 'home' },
    { label: '网络状态', route: '#/help?tab=network', icon: 'network' }
  ];

  window.FH_EDUCATION = {
    schemaVersion: 3,
    subjects,
    responseFormats: ['single_choice', 'multiple_choice', 'true_false', 'fill_blank', 'matching', 'ordering', 'short_answer', 'calculation', 'proof', 'drawing', 'writing', 'oral', 'listening', 'experiment', 'project'],
    cognitiveOperations: ['recall', 'understand', 'apply', 'analyze', 'reason', 'evaluate', 'create'],
    itemStructures: ['independent', 'material_group', 'passage_group', 'integrated', 'progressive_subquestions', 'practice_task', 'project_task'],
    schoolSystems: ['six_three', 'five_four'],
    scienceRoutes: ['comprehensive_science', 'physics_chemistry_biology'],
    courseOfferingSource: 'server',
    contentSource: 'server'
  };

  window.MOCK = {
    schemaVersion: 3,
    roles: {
      teacher: { label: '教师', desc: '备课、组卷、批改与学情分析' },
      academic: { label: '教务处', desc: '教师体系内的教务与导入权限' },
      admin: { label: '管理端', desc: '学校、校区、成员与权限管理' },
      student: { label: '学生', desc: '作业、反馈、错题与个性化学习' }
    },
    navModules: nav,
    sidebar: {
      home: common,
      paper: [
        { label: '课程与知识点', route: '#/paper', icon: 'book' },
        { label: '我的试卷', route: '#/paper/mine', icon: 'mine' },
        { label: '组卷方案', route: '#/paper/templates', icon: 'template' }
      ],
      grading: [
        { label: '批改队列', route: '#/grading', icon: 'upload' },
        { label: '待复核', route: '#/grading?tab=review', icon: 'review' },
        { label: '已完成', route: '#/grading?tab=done', icon: 'done' },
        { label: '评分标准', route: '#/grading/rubric', icon: 'rubric' }
      ],
      resources: [
        { label: '网络资源检索', route: '#/resources', icon: 'search' },
        { label: '我的收藏', route: '#/resources?tab=fav', icon: 'fav' },
        { label: '提交资源', route: '#/resources/upload', icon: 'upload' }
      ],
      analytics: [
        { label: '班级概览', route: '#/analytics', icon: 'chart' },
        { label: '学生明细', route: '#/analytics/students', icon: 'student' },
        { label: '报告导出', route: '#/analytics/export', icon: 'export' }
      ],
      admin: [
        { label: '成员管理', route: '#/admin', icon: 'members' },
        { label: '班级与学期', route: '#/admin?tab=classes', icon: 'class' },
        { label: '公告管理', route: '#/admin?tab=notices', icon: 'notice' },
        { label: '权限设置', route: '#/admin?tab=permissions', icon: 'perm' }
      ],
      knowledge: [
        { label: '全部知识点', route: '#/knowledge', icon: 'knowledge' },
        { label: '错题本', route: '#/wrongbook', icon: 'wrong' }
      ],
      wrongbook: [
        { label: '错题本', route: '#/wrongbook', icon: 'wrong' },
        { label: '知识点讲解', route: '#/knowledge', icon: 'knowledge' }
      ],
      plan: [
        { label: '我的学习计划', route: '#/analytics/students/plan', icon: 'plan' },
        { label: '错题本', route: '#/wrongbook', icon: 'wrong' }
      ],
      help: common
    },
    TEXTBOOKS: {
      chinese: emptyTextbook('chinese'),
      math: emptyTextbook('math'),
      english: emptyTextbook('english'),
      physics: emptyTextbook('physics'),
      chemistry: emptyTextbook('chemistry'),
      biology: emptyTextbook('biology'),
      history: emptyTextbook('history'),
      ethics: emptyTextbook('ethics'),
      geography: emptyTextbook('geography')
    },
    PAPER_PRESETS: {},
    KNOWLEDGE: [],
    permissions: {},
    guides: [],
    faqs: []
  };
})();
