(function () {
  'use strict';

  var entry = window.FH_ENTRY;
  var testMode = window.FH_TEST_MODE;

  function query() {
    try { return new URLSearchParams(window.location.search); } catch (error) { return new Map(); }
  }

  function updateTestLinks() {
    var enabled = !!(testMode && testMode.isEnabled());
    document.querySelectorAll('[data-test-link]').forEach(function (link) { link.hidden = !enabled; });
  }

  function renderLastUsed() {
    var lastRole = window.FH_LOCAL_AUTH && window.FH_LOCAL_AUTH.lastRole ? window.FH_LOCAL_AUTH.lastRole() : '';
    if (!lastRole || !entry.roles[lastRole]) return;
    var card = document.querySelector('.portal-role-card--' + lastRole);
    if (!card) return;
    var top = card.querySelector('.portal-role-card__top');
    if (!top || top.querySelector('.portal-last-used')) return;
    var badge = document.createElement('span');
    badge.className = 'portal-last-used';
    badge.textContent = '上次使用';
    top.appendChild(badge);
  }

  function renderIdentity() {
    var grid = document.getElementById('identity-role-grid');
    var current = document.getElementById('identity-current');
    var continueButton = document.getElementById('identity-continue');
    if (!grid || !current || !continueButton) return;
    var params = query();
    var selected = entry.roles[params.get('role')] ? params.get('role') : '';
    var mode = params.get('mode') === 'create' ? 'create' : '';
    grid.innerHTML = entry.order.map(function (role) {
      var item = entry.roles[role];
      return '<button type="button" class="identity-role" data-identity-role="' + role + '" aria-pressed="' + (selected === role ? 'true' : 'false') + '">' +
        '<span class="identity-role__icon">' + entry.icon(role, 22) + '</span>' +
        '<h2>' + item.label + '</h2><span>' + item.description + '</span></button>';
    }).join('');

    function paint() {
      grid.querySelectorAll('[data-identity-role]').forEach(function (button) {
        var active = button.dataset.identityRole === selected;
        button.setAttribute('aria-pressed', String(active));
      });
      if (!selected) {
        current.textContent = '请选择一个身份';
        continueButton.setAttribute('aria-disabled', 'true');
        continueButton.href = '#identity-roles';
      } else {
        current.innerHTML = '当前选择：<strong>' + entry.roles[selected].label + '</strong>';
        continueButton.removeAttribute('aria-disabled');
        continueButton.href = entry.loginUrl(selected, mode);
      }
    }

    grid.querySelectorAll('[data-identity-role]').forEach(function (button) {
      button.addEventListener('click', function () {
        selected = button.dataset.identityRole;
        paint();
      });
    });
    continueButton.addEventListener('click', function (event) {
      if (!selected) { event.preventDefault(); continueButton.focus(); }
    });
    paint();
  }

  function renderTestAccess() {
    var grid = document.getElementById('test-role-grid');
    var card = document.querySelector('.test-card');
    var disabled = document.getElementById('test-disabled');
    if (!grid || !card || !disabled) return;
    if (!testMode || !testMode.isEnabled()) {
      card.hidden = true;
      disabled.hidden = false;
      return;
    }
    grid.innerHTML = entry.order.map(function (role) {
      var item = entry.roles[role];
      return '<button class="test-role" type="button" data-test-role="' + role + '"><span class="test-role__icon">' + entry.icon(role, 21) + '</span><span><strong>以' + item.label + '身份测试</strong><small>' + item.duty + '</small></span></button>';
    }).join('');
    grid.querySelectorAll('[data-test-role]').forEach(function (button) {
      button.addEventListener('click', function () {
        var role = button.dataset.testRole;
        var demo = document.getElementById('test-demo-data');
        if (!testMode.start(role, !!(demo && demo.checked))) return;
        window.location.href = 'workbench.html#/home?test=1&role=' + encodeURIComponent(role);
      });
    });
  }

  updateTestLinks();
  renderLastUsed();
  renderIdentity();
  renderTestAccess();
}());
