(function () {
  'use strict';

  var configKey = 'fh-team-index-config';
  var endpointKeys = ['student', 'teacher', 'admin'];
  var roleLabels = { student: '学生', teacher: '教师', admin: '管理员' };
  var dialog = document.getElementById('fh-portal-dialog');
  var form = document.querySelector('[data-portal-config-form]');
  var toast = document.querySelector('[data-portal-toast]');
  var toastTimer;

  function readConfig() {
    try {
      var stored = JSON.parse(window.localStorage.getItem(configKey) || '{}');
      return endpointKeys.reduce(function (result, key) {
        result[key] = typeof stored[key] === 'string' ? stored[key].trim() : '';
        return result;
      }, {});
    } catch (error) {
      return { student: '', teacher: '', admin: '' };
    }
  }

  function safeUrl(value) {
    var trimmed = (value || '').trim();
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    if (/^(?:\/(?!\/)|\.{1,2}\/|#|[A-Za-z0-9][^\s]*)/.test(trimmed) && !/^[A-Za-z][A-Za-z0-9+.-]*:/i.test(trimmed)) return trimmed;
    return '';
  }

  function fallbackUrl(key) {
    return 'workbench.html#/login?role=' + encodeURIComponent(key);
  }

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { toast.classList.remove('is-visible'); }, 2600);
  }

  function renderStatus() {
    var config = readConfig();
    endpointKeys.forEach(function (key) {
      var input = document.querySelector('[data-portal-input="' + key + '"]');
      var status = document.querySelector('[data-entry-status="' + key + '"]');
      var target = safeUrl(config[key]) || fallbackUrl(key);
      if (input) input.value = config[key];
      if (status) {
        status.textContent = config[key] ? '已配置独立入口 · ' + roleLabels[key] : '使用本地工作台 · ' + roleLabels[key] + '身份';
        status.classList.toggle('is-custom', Boolean(config[key]));
      }
      document.querySelectorAll('[data-entry-key="' + key + '"]').forEach(function (link) {
        if (link.tagName !== 'A') return;
        link.setAttribute('href', target);
        if (/^https?:\/\//i.test(target)) {
          link.setAttribute('target', '_blank');
          link.setAttribute('rel', 'noopener noreferrer');
        } else {
          link.removeAttribute('target');
          link.removeAttribute('rel');
        }
      });
    });
  }

  function openConfig() {
    renderStatus();
    if (dialog && typeof dialog.showModal === 'function') {
      dialog.showModal();
      var first = dialog.querySelector('input');
      if (first) window.setTimeout(function () { first.focus(); }, 50);
    } else if (dialog) {
      dialog.setAttribute('open', 'open');
    }
  }

  function closeConfig() {
    if (!dialog) return;
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
  }

  document.querySelectorAll('[data-open-config]').forEach(function (button) { button.addEventListener('click', openConfig); });
  document.querySelectorAll('[data-close-config]').forEach(function (button) { button.addEventListener('click', closeConfig); });
  if (dialog) dialog.addEventListener('click', function (event) { if (event.target === dialog) closeConfig(); });

  if (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var nextConfig = endpointKeys.reduce(function (result, key) {
        var input = form.querySelector('[data-portal-input="' + key + '"]');
        result[key] = input ? input.value.trim() : '';
        return result;
      }, {});
      try { window.localStorage.setItem(configKey, JSON.stringify(nextConfig)); } catch (error) { /* local-only fallback */ }
      renderStatus();
      closeConfig();
      showToast('三端入口已保存到当前浏览器');
    });
  }

  var clearButton = document.querySelector('[data-clear-portal-config]');
  if (clearButton) {
    clearButton.addEventListener('click', function () {
      try { window.localStorage.removeItem(configKey); } catch (error) { /* local-only fallback */ }
      renderStatus();
      showToast('已恢复为本地工作台入口');
    });
  }

  renderStatus();
}());
