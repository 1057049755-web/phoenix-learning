(function () {
  'use strict';

  var entry = window.FH_ENTRY;
  var auth = window.FH_LOCAL_AUTH;
  var testMode = window.FH_TEST_MODE;
  var content = document.getElementById('auth-content');
  var params;
  try { params = new URLSearchParams(window.location.search); } catch (error) { params = new Map(); }
  var remembered = auth.remembered();
  var initialRole = entry.roles[params.get('role')] ? params.get('role') : '';
  var state = { role: initialRole, mode: params.get('mode') === 'create' ? 'create' : 'login', accounts: [], busy: false };

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char];
    });
  }

  function roleButtons() {
    return entry.order.map(function (role) {
      var item = entry.roles[role];
      return '<button type="button" class="auth-role" data-auth-role="' + role + '" aria-pressed="' + (state.role === role ? 'true' : 'false') + '">' + entry.icon(role, 22) + '<span>' + item.label + '</span></button>';
    }).join('');
  }

  function inputFor(field) {
    var ids = {
      account: 'auth-account',
      password: 'auth-login-password',
      displayName: 'auth-displayName',
      createAccount: 'auth-create-account',
      createPassword: 'auth-create-password',
      confirmPassword: 'auth-confirm-password'
    };
    return document.getElementById(ids[field] || ('auth-' + field));
  }

  function messageFor(field) {
    return document.querySelector('[data-auth-error="' + field + '"]');
  }

  function clearErrors() {
    document.querySelectorAll('[data-auth-error]').forEach(function (message) { message.textContent = ''; message.classList.remove('is-visible'); });
    document.querySelectorAll('[aria-invalid="true"]').forEach(function (input) { input.setAttribute('aria-invalid', 'false'); });
    var alert = document.getElementById('auth-alert');
    if (alert) alert.textContent = '';
  }

  function showError(field, message) {
    var target = messageFor(field);
    if (target) { target.textContent = message; target.classList.add('is-visible'); }
    var input = inputFor(field);
    if (input) input.setAttribute('aria-invalid', 'true');
  }

  function showAlert(message) {
    var alert = document.getElementById('auth-alert');
    if (alert) alert.textContent = message || '';
  }

  function focusField(field) {
    var input = inputFor(field);
    if (input) { input.focus(); return; }
    var role = document.querySelector('[data-auth-role]');
    if (role) role.focus();
  }

  function setBusy(busy, label) {
    state.busy = busy;
    document.querySelectorAll('#auth-content button[type="submit"]').forEach(function (button) {
      button.disabled = busy;
      if (busy && label) button.dataset.idleLabel = button.textContent;
      if (busy && label) button.textContent = label;
      if (!busy && button.dataset.idleLabel) { button.textContent = button.dataset.idleLabel; delete button.dataset.idleLabel; }
    });
    var form = document.querySelector('.auth-form:not([hidden])');
    if (form) form.setAttribute('aria-busy', String(busy));
  }

  function strength(value) {
    var length = value.length;
    var level = length < 8 ? 0 : length < 11 ? 1 : /[A-Za-z]/.test(value) && /\d/.test(value) ? 3 : 2;
    var labels = ['至少 8 位', '基础强度', '较强', '较强'];
    var meter = document.getElementById('auth-strength');
    if (!meter) return;
    meter.dataset.level = String(level);
    meter.querySelector('span').textContent = value ? labels[level] : '允许粘贴，也可以使用密码管理器';
  }

  function renderMode() {
    var isCreate = state.mode === 'create';
    var title = document.getElementById('auth-title');
    var description = document.getElementById('auth-description');
    var loginForm = document.getElementById('login-form');
    var createForm = document.getElementById('create-form');
    var localNote = document.getElementById('auth-local-note');
    var switchButton = document.querySelector('[data-switch-mode]');
    if (title) title.textContent = isCreate ? '创建本地账号' : '账号登录';
    if (description) description.textContent = isCreate ? '在当前浏览器创建一个用于原型测试的账号。' : '选择身份，使用本设备已有的账号进入。';
    if (loginForm) loginForm.hidden = isCreate;
    if (createForm) createForm.hidden = !isCreate;
    if (localNote) localNote.hidden = !isCreate;
    document.querySelectorAll('[data-auth-mode]').forEach(function (button) { button.setAttribute('aria-selected', String(button.dataset.authMode === state.mode)); });
    if (switchButton) switchButton.textContent = isCreate ? '已有账号，直接登录' : '创建本地账号';
    var summary = document.getElementById('auth-account-summary');
    if (summary) summary.innerHTML = state.accounts.length ? '本设备已有 <strong>' + state.accounts.length + '</strong> 个本地账号' : '本设备还没有本地账号';
  }

  function renderRoleState() {
    document.querySelectorAll('[data-auth-role]').forEach(function (button) {
      button.setAttribute('aria-pressed', String(button.dataset.authRole === state.role));
    });
  }

  function buildPage() {
    content.innerHTML =
      '<div class="auth-panel__top"><a class="auth-panel__back" href="identity.html">← 返回身份选择</a><a class="auth-panel__test" id="auth-test-link" href="test-access.html" hidden>进入测试模式</a></div>' +
      '<div class="auth-heading"><p class="auth-heading__eyebrow">ACCOUNT ACCESS</p><h2 id="auth-title">账号登录</h2><p id="auth-description">选择身份，使用本设备已有的账号进入。</p></div>' +
      '<div class="auth-mode" role="tablist" aria-label="账号操作"><button type="button" data-auth-mode="login" aria-selected="true">登录</button><button type="button" data-auth-mode="create" aria-selected="false">创建账号</button></div>' +
      '<span class="auth-role-label">身份 <span class="auth-required">*</span></span><div class="auth-roles" role="group" aria-label="选择身份">' + roleButtons() + '</div><p class="auth-message" data-auth-error="role" aria-live="polite"></p>' +
      '<div id="auth-alert" class="auth-alert" role="alert" tabindex="-1"></div>' +
      '<form class="auth-form" id="login-form" novalidate>' +
        '<div class="auth-field"><label for="auth-account">账号 <span class="auth-required">*</span></label><input class="auth-control" id="auth-account" name="account" type="text" inputmode="email" autocomplete="username" autocapitalize="none" spellcheck="false" aria-describedby="auth-account-error"><p class="auth-message" id="auth-account-error" data-auth-error="account" aria-live="polite"></p></div>' +
        '<div class="auth-field"><label for="auth-login-password">密码 <span class="auth-required">*</span></label><div class="auth-password"><input class="auth-control" id="auth-login-password" name="password" type="password" autocomplete="current-password" aria-describedby="auth-login-password-error"><button type="button" data-password-toggle="auth-login-password" aria-label="显示密码" aria-pressed="false">显示</button></div><p class="auth-message" id="auth-login-password-error" data-auth-error="password" aria-live="polite"></p></div>' +
        '<label class="auth-check-row"><input id="auth-remember" type="checkbox" checked><span>记住当前账号</span></label>' +
        '<button class="auth-submit" type="submit">登录</button>' +
      '</form>' +
      '<form class="auth-form" id="create-form" novalidate hidden>' +
        '<div class="auth-field"><label for="auth-displayName">显示名称 <span class="auth-required">*</span></label><input class="auth-control" id="auth-displayName" name="displayName" type="text" maxlength="40" autocomplete="name" aria-describedby="auth-displayName-error"><p class="auth-message" id="auth-displayName-error" data-auth-error="displayName" aria-live="polite"></p></div>' +
        '<div class="auth-field"><label for="auth-create-account">登录账号 <span class="auth-required">*</span></label><input class="auth-control" id="auth-create-account" name="account" type="text" maxlength="64" autocomplete="username" autocapitalize="none" spellcheck="false" aria-describedby="auth-create-account-error"><p class="auth-message" id="auth-create-account-error" data-auth-error="createAccount" aria-live="polite"></p></div>' +
        '<div class="auth-field"><label for="auth-create-password">设置密码 <span class="auth-required">*</span></label><div class="auth-password"><input class="auth-control" id="auth-create-password" name="password" type="password" minlength="8" autocomplete="new-password" aria-describedby="auth-create-password-error auth-strength"><button type="button" data-password-toggle="auth-create-password" aria-label="显示密码" aria-pressed="false">显示</button></div><p class="auth-message" id="auth-create-password-error" data-auth-error="createPassword" aria-live="polite"></p><div class="auth-strength" id="auth-strength" data-level="0"><i class="auth-strength__bar"><i></i></i><span>允许粘贴，也可以使用密码管理器</span></div></div>' +
        '<div class="auth-field"><label for="auth-confirm-password">确认密码 <span class="auth-required">*</span></label><div class="auth-password"><input class="auth-control" id="auth-confirm-password" name="confirmPassword" type="password" minlength="8" autocomplete="new-password" aria-describedby="auth-confirm-password-error"><button type="button" data-password-toggle="auth-confirm-password" aria-label="显示密码" aria-pressed="false">显示</button></div><p class="auth-message" id="auth-confirm-password-error" data-auth-error="confirmPassword" aria-live="polite"></p></div>' +
        '<button class="auth-submit" type="submit">创建并进入</button>' +
      '</form>' +
      '<div class="auth-secondary-actions"><button type="button" data-switch-mode>' + (state.mode === 'create' ? '已有账号，直接登录' : '创建本地账号') + '</button><button type="button" id="auth-accounts-button">查看本设备已有账号</button></div>' +
      '<div class="auth-account-summary" id="auth-account-summary" aria-live="polite"></div><p class="auth-hint">密码至少 8 位。允许粘贴，不强制使用特殊符号。</p><p class="auth-local-note" id="auth-local-note" hidden>当前为本地测试账号，仅在本设备有效</p>';

    document.querySelectorAll('[data-auth-mode]').forEach(function (button) { button.addEventListener('click', function () { state.mode = button.dataset.authMode; clearErrors(); renderMode(); focusField(state.mode === 'create' ? 'displayName' : 'account'); }); });
    document.querySelector('[data-switch-mode]').addEventListener('click', function () { state.mode = state.mode === 'create' ? 'login' : 'create'; clearErrors(); renderMode(); focusField(state.mode === 'create' ? 'displayName' : 'account'); });
    document.querySelectorAll('[data-auth-role]').forEach(function (button) { button.addEventListener('click', function () { state.role = button.dataset.authRole; clearErrors(); renderRoleState(); }); });
    document.querySelectorAll('[data-password-toggle]').forEach(bindPasswordToggle);
    document.getElementById('auth-create-password').addEventListener('input', function () { strength(this.value); });
    document.getElementById('login-form').addEventListener('submit', submitLogin);
    document.getElementById('create-form').addEventListener('submit', submitCreate);
    document.getElementById('auth-accounts-button').addEventListener('click', openAccounts);
    var testLink = document.getElementById('auth-test-link');
    if (testLink && testMode && testMode.isEnabled()) testLink.hidden = false;
    renderMode();
    renderRoleState();
    var rememberedAccount = auth.remembered();
    if (rememberedAccount.account && state.mode === 'login') document.getElementById('auth-account').value = rememberedAccount.account;
  }

  function bindPasswordToggle(button) {
    button.addEventListener('click', function () {
      var input = document.getElementById(button.dataset.passwordToggle);
      if (!input) return;
      var visible = input.type === 'text';
      input.type = visible ? 'password' : 'text';
      button.textContent = visible ? '显示' : '隐藏';
      button.setAttribute('aria-label', visible ? '显示密码' : '隐藏密码');
      button.setAttribute('aria-pressed', String(!visible));
    });
  }

  function validRole() {
    if (!state.role) { showError('role', '请选择身份'); return false; }
    return true;
  }

  async function submitLogin(event) {
    event.preventDefault();
    if (state.busy) return;
    clearErrors();
    var account = document.getElementById('auth-account').value.trim();
    var password = document.getElementById('auth-login-password').value;
    if (!validRole()) { showAlert('请先选择身份'); focusField('role'); return; }
    if (!account) { showError('account', '请输入账号'); showAlert('请检查账号'); focusField('account'); return; }
    if (!password) { showError('password', '请输入密码'); showAlert('请检查密码'); focusField('password'); return; }
    setBusy(true, '登录中…');
    var result = await auth.login({ role: state.role, account: account, password: password, remember: document.getElementById('auth-remember').checked });
    setBusy(false);
    if (!result.ok) {
      if (result.field === 'role') showError('role', result.msg);
      else showError(result.field === 'password' ? 'password' : 'account', result.msg);
      showAlert('登录未完成，请查看对应提示');
      focusField(result.field === 'role' ? 'role' : result.field);
      return;
    }
    showAlert('登录成功，正在进入工作空间');
    window.setTimeout(function () { window.location.href = 'workbench.html#/home'; }, 160);
  }

  async function submitCreate(event) {
    event.preventDefault();
    if (state.busy) return;
    clearErrors();
    var displayName = document.getElementById('auth-displayName').value.trim();
    var account = document.getElementById('auth-create-account').value.trim();
    var password = document.getElementById('auth-create-password').value;
    var confirmPassword = document.getElementById('auth-confirm-password').value;
    if (!validRole()) { showAlert('请先选择身份'); focusField('role'); return; }
    if (!displayName) { showError('displayName', '请输入显示名称'); showAlert('请检查显示名称'); focusField('displayName'); return; }
    if (!account) { showError('createAccount', '请输入账号'); showAlert('请检查登录账号'); focusField('create-account'); return; }
    if (password.length < 8) { showError('createPassword', '密码至少 8 位'); showAlert('请设置一个至少 8 位的密码'); focusField('create-password'); return; }
    if (password !== confirmPassword) { showError('confirmPassword', '两次输入的密码不一致'); showAlert('请重新确认密码'); focusField('confirm-password'); return; }
    setBusy(true, '创建中…');
    var result = await auth.createAccount({ role: state.role, displayName: displayName, account: account, password: password, remember: true });
    setBusy(false);
    if (!result.ok) {
      showError(result.field === 'account' ? 'createAccount' : result.field === 'password' ? 'createPassword' : result.field, result.msg);
      showAlert('账号未创建，请查看对应提示');
      focusField(result.field === 'account' ? 'create-account' : result.field === 'password' ? 'create-password' : result.field);
      return;
    }
    showAlert('账号已创建，正在进入工作空间');
    window.setTimeout(function () { window.location.href = 'workbench.html#/home'; }, 160);
  }

  function dialogClose(dialog) { if (dialog && typeof dialog.close === 'function') dialog.close(); else if (dialog) dialog.removeAttribute('open'); }

  async function openAccounts() {
    state.accounts = await auth.listAccounts();
    var dialog = document.getElementById('accounts-dialog');
    if (!dialog) {
      document.body.insertAdjacentHTML('beforeend', '<dialog class="auth-dialog" id="accounts-dialog" aria-labelledby="accounts-title"><div class="auth-dialog__inner"><div class="auth-dialog__head"><div><h2 id="accounts-title">本设备已有账号</h2><p>账号只保存在当前浏览器。</p></div><button type="button" class="auth-dialog__close" data-close-accounts aria-label="关闭账号列表">×</button></div><div class="auth-accounts" id="auth-accounts-list"></div><div class="auth-dialog__actions"><button type="button" data-close-accounts>关闭</button></div></div></dialog>');
      dialog = document.getElementById('accounts-dialog');
      dialog.querySelectorAll('[data-close-accounts]').forEach(function (button) { button.addEventListener('click', function () { dialogClose(dialog); }); });
      dialog.addEventListener('click', function (event) { if (event.target === dialog) dialogClose(dialog); });
      dialog.addEventListener('click', accountsAction);
    }
    var list = document.getElementById('auth-accounts-list');
    list.innerHTML = state.accounts.length ? state.accounts.map(function (account) {
      return '<div class="auth-account"><span class="auth-account__icon">' + entry.icon(account.role, 20) + '</span><div><div class="auth-account__name">' + esc(account.displayName) + '</div><div class="auth-account__meta">' + esc(account.account) + ' · ' + esc(entry.roleLabel(account.role)) + '</div></div><div class="auth-account__actions"><button type="button" data-use-account="' + esc(account.id) + '">使用</button><button type="button" data-change-account="' + esc(account.id) + '">改密码</button><button type="button" class="danger" data-delete-account="' + esc(account.id) + '">删除</button></div></div>';
    }).join('') : '<div class="auth-empty">本设备还没有本地账号。关闭后选择“创建账号”即可开始。</div>';
    if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', 'open');
    var close = dialog.querySelector('[data-close-accounts]');
    if (close) window.setTimeout(function () { close.focus(); }, 0);
  }

  function accountsAction(event) {
    var use = event.target.closest('[data-use-account]');
    var change = event.target.closest('[data-change-account]');
    var remove = event.target.closest('[data-delete-account]');
    if (!use && !change && !remove) return;
    var id = (use || change || remove).dataset.useAccount || (use || change || remove).dataset.changeAccount || (use || change || remove).dataset.deleteAccount;
    var account = state.accounts.find(function (item) { return item.id === id; });
    if (!account) return;
    if (use) {
      state.role = account.role;
      state.mode = 'login';
      renderRoleState(); renderMode();
      document.getElementById('auth-account').value = account.account;
      dialogClose(document.getElementById('accounts-dialog'));
      focusField('account');
    } else if (change) {
      openPasswordDialog(account);
    } else if (remove) {
      if (!window.confirm('确定删除“' + account.displayName + '”的本地账号吗？删除后需要重新创建。')) return;
      auth.deleteAccount(account.id).then(function (result) { if (result.ok) { showAlert('本地账号已删除'); openAccounts(); } else showAlert(result.msg); });
    }
  }

  function openPasswordDialog(account) {
    var dialog = document.getElementById('password-dialog');
    if (!dialog) {
      document.body.insertAdjacentHTML('beforeend', '<dialog class="auth-dialog" id="password-dialog" aria-labelledby="password-title"><form class="auth-dialog__inner" id="password-form" method="dialog"><div class="auth-dialog__head"><div><h2 id="password-title">修改本地密码</h2><p id="password-account-label"></p></div><button type="button" class="auth-dialog__close" data-close-password aria-label="关闭修改密码">×</button></div><div class="auth-field"><label for="old-local-password">原密码</label><div class="auth-password"><input class="auth-control" id="old-local-password" type="password" autocomplete="current-password"><button type="button" data-password-toggle="old-local-password" aria-label="显示密码" aria-pressed="false">显示</button></div><p class="auth-message" data-password-error="old"></p></div><div class="auth-field"><label for="new-local-password">新密码</label><div class="auth-password"><input class="auth-control" id="new-local-password" type="password" minlength="8" autocomplete="new-password"><button type="button" data-password-toggle="new-local-password" aria-label="显示密码" aria-pressed="false">显示</button></div><p class="auth-message" data-password-error="new"></p></div><div class="auth-field"><label for="confirm-local-password">确认新密码</label><div class="auth-password"><input class="auth-control" id="confirm-local-password" type="password" autocomplete="new-password"><button type="button" data-password-toggle="confirm-local-password" aria-label="显示密码" aria-pressed="false">显示</button></div><p class="auth-message" data-password-error="confirm"></p></div><div class="auth-dialog__actions"><button type="button" data-close-password>取消</button><button class="primary" type="submit">保存密码</button></div></form></dialog>');
      dialog = document.getElementById('password-dialog');
      dialog.querySelectorAll('[data-close-password]').forEach(function (button) { button.addEventListener('click', function () { dialogClose(dialog); }); });
      dialog.querySelectorAll('[data-password-toggle]').forEach(bindPasswordToggle);
      dialog.querySelector('#password-form').addEventListener('submit', submitPasswordChange);
      dialog.addEventListener('click', function (event) { if (event.target === dialog) dialogClose(dialog); });
    }
    dialog.dataset.accountId = account.id;
    document.getElementById('password-account-label').textContent = account.displayName + ' · ' + entry.roleLabel(account.role);
    ['old', 'new', 'confirm'].forEach(function (key) { var field = dialog.querySelector('[data-password-error="' + key + '"]'); if (field) { field.textContent = ''; field.classList.remove('is-visible'); } });
    ['old-local-password', 'new-local-password', 'confirm-local-password'].forEach(function (id) { document.getElementById(id).value = ''; });
    if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', 'open');
    window.setTimeout(function () { document.getElementById('old-local-password').focus(); }, 0);
  }

  async function submitPasswordChange(event) {
    event.preventDefault();
    var dialog = document.getElementById('password-dialog');
    var oldPassword = document.getElementById('old-local-password').value;
    var newPassword = document.getElementById('new-local-password').value;
    var confirmPassword = document.getElementById('confirm-local-password').value;
    var error = function (key, message, focusId) { var field = dialog.querySelector('[data-password-error="' + key + '"]'); field.textContent = message; field.classList.add('is-visible'); document.getElementById(focusId).focus(); };
    dialog.querySelectorAll('[data-password-error]').forEach(function (item) { item.textContent = ''; item.classList.remove('is-visible'); });
    if (!oldPassword) { error('old', '请输入原密码', 'old-local-password'); return; }
    if (newPassword.length < 8) { error('new', '新密码至少 8 位', 'new-local-password'); return; }
    if (newPassword !== confirmPassword) { error('confirm', '两次输入的新密码不一致', 'confirm-local-password'); return; }
    var submit = dialog.querySelector('button[type="submit"]');
    submit.disabled = true; submit.textContent = '保存中…';
    var result = await auth.changePassword(dialog.dataset.accountId, oldPassword, newPassword);
    submit.disabled = false; submit.textContent = '保存密码';
    if (!result.ok) { error(result.field === 'oldPassword' ? 'old' : 'new', result.msg, result.field === 'oldPassword' ? 'old-local-password' : 'new-local-password'); return; }
    dialogClose(dialog); showAlert('本地密码已修改');
  }

  buildPage();
  auth.ready().then(function () { return auth.listAccounts(); }).then(function (accounts) { state.accounts = accounts; renderMode(); }).catch(function (error) { showAlert(error.message || '本地账号暂不可用'); });
}());
