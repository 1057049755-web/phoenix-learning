(function () {
  'use strict';

  var configKey = 'fh-team-index-config';
  var endpointKeys = ['student', 'teacher', 'admin'];
  var defaultConfig = { student: '', teacher: '', admin: '' };
  var dialog = document.getElementById('endpoint-dialog');
  var form = document.querySelector('[data-config-form]');
  var toast = document.querySelector('[data-team-toast]');
  var toastTimer;

  function readConfig() {
    try {
      var stored = JSON.parse(window.localStorage.getItem(configKey) || '{}');
      return endpointKeys.reduce(function (result, key) {
        result[key] = typeof stored[key] === 'string' ? stored[key].trim() : defaultConfig[key];
        return result;
      }, {});
    } catch (error) {
      return Object.assign({}, defaultConfig);
    }
  }

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { toast.classList.remove('is-visible'); }, 2600);
  }

  function safeUrl(value) {
    if (!value) return '';
    var trimmed = value.trim();
    if (/^(https?:\/\/|\/|\.\/|\.\.\/|#)/i.test(trimmed)) return trimmed;
    return '';
  }

  function renderConfig() {
    var config = readConfig();
    endpointKeys.forEach(function (key) {
      var input = document.querySelector('[data-config-input="' + key + '"]');
      var status = document.querySelector('[data-endpoint-status="' + key + '"]');
      if (input) input.value = config[key];
      if (status) {
        status.textContent = config[key] ? '地址已配置 · 点击进入' : '待接入地址';
        status.classList.toggle('is-ready', Boolean(config[key]));
      }
    });
  }

  function openConfig() {
    renderConfig();
    if (dialog && typeof dialog.showModal === 'function') {
      dialog.showModal();
      var firstInput = dialog.querySelector('input');
      if (firstInput) window.setTimeout(function () { firstInput.focus(); }, 50);
    } else if (dialog) {
      dialog.setAttribute('open', 'open');
    }
  }

  function closeConfig() {
    if (!dialog) return;
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
  }

  document.querySelectorAll('[data-open-config]').forEach(function (button) {
    button.addEventListener('click', openConfig);
  });
  document.querySelectorAll('[data-close-config]').forEach(function (button) {
    button.addEventListener('click', closeConfig);
  });

  if (dialog) {
    dialog.addEventListener('click', function (event) {
      if (event.target === dialog) closeConfig();
    });
  }

  if (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var nextConfig = endpointKeys.reduce(function (result, key) {
        var input = form.querySelector('[data-config-input="' + key + '"]');
        result[key] = input ? input.value.trim() : '';
        return result;
      }, {});
      try { window.localStorage.setItem(configKey, JSON.stringify(nextConfig)); } catch (error) { /* local-only fallback */ }
      renderConfig();
      closeConfig();
      showToast('三端入口已保存到当前浏览器');
    });
  }

  var clearButton = document.querySelector('[data-clear-config]');
  if (clearButton) {
    clearButton.addEventListener('click', function () {
      endpointKeys.forEach(function (key) {
        var input = document.querySelector('[data-config-input="' + key + '"]');
        if (input) input.value = '';
      });
      try { window.localStorage.removeItem(configKey); } catch (error) { /* local-only fallback */ }
      renderConfig();
      showToast('已清空三端入口');
    });
  }

  document.querySelectorAll('[data-endpoint-key]').forEach(function (button) {
    button.addEventListener('click', function () {
      var key = button.getAttribute('data-endpoint-key');
      var url = safeUrl(readConfig()[key]);
      if (!url) {
        showToast('还没有配置这个端口，先填写内部位置');
        openConfig();
        var input = document.querySelector('[data-config-input="' + key + '"]');
        if (input) window.setTimeout(function () { input.focus(); }, 70);
        return;
      }
      if (url.charAt(0) === '#') window.location.href = 'workbench.html' + url;
      else window.open(url, '_blank', 'noopener,noreferrer');
    });
  });

  var revealItems = document.querySelectorAll('.team-reveal');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var observer = new IntersectionObserver(function (entries, currentObserver) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          currentObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    Array.prototype.forEach.call(revealItems, function (item) { observer.observe(item); });
  } else {
    Array.prototype.forEach.call(revealItems, function (item) { item.classList.add('is-visible'); });
  }

  renderConfig();
}());
