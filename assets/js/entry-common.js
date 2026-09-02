(function () {
  'use strict';

  var roles = {
    student: {
      label: '学生',
      description: '完成作业，查看学习进步',
      duty: '从今天的学习任务开始',
      icon: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c.4-3.2 3.1-5.3 7-5.3s6.6 2.1 7 5.3"/>'
    },
    teacher: {
      label: '教师',
      description: '开展教学与班级管理',
      duty: '把教学安排落到每一天',
      icon: '<path d="M4 19.5V5.8c0-.9.7-1.6 1.6-1.6H19v15.3H5.6c-.9 0-1.6-.7-1.6-1.6Z"/><path d="M7.5 7.5h8M7.5 11h8M7.5 14.5h4"/>'
    },
    academic: {
      label: '教务处',
      description: '统筹课程、班级与考试',
      duty: '让教学安排清楚可追踪',
      icon: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16M8 14h3M8 17h6"/>'
    },
    admin: {
      label: '系统管理员',
      description: '维护平台配置与安全',
      duty: '守住平台运行的秩序',
      icon: '<path d="M12 3 19 6v5c0 4.7-2.8 8-7 10-4.2-2-7-5.3-7-10V6l7-3Z"/><path d="m9.3 12 1.8 1.8 3.8-4"/>'
    }
  };

  function icon(role, size) {
    var data = roles[role] || roles.student;
    return '<svg viewBox="0 0 24 24" width="' + (size || 22) + '" height="' + (size || 22) + '" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + data.icon + '</svg>';
  }

  function roleLabel(role) {
    return roles[role] ? roles[role].label : '使用者';
  }

  window.FH_ENTRY = {
    roles: roles,
    order: ['student', 'teacher', 'academic', 'admin'],
    icon: icon,
    roleLabel: roleLabel,
    loginUrl: function (role, mode) {
      return 'login.html?role=' + encodeURIComponent(role || 'student') + (mode ? '&mode=' + encodeURIComponent(mode) : '');
    },
    identityUrl: function (role, mode) {
      return 'identity.html' + (role ? '?role=' + encodeURIComponent(role) + (mode ? '&mode=' + encodeURIComponent(mode) : '') : '');
    }
  };
}());
