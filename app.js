(function () {
  const config = window.APP_CONFIG;
  const welcomeText = document.getElementById('welcomeText');
  const accountFormSection = document.getElementById('accountFormSection');
  const currentAccountSection = document.getElementById('currentAccountSection');
  const currentAccountText = document.getElementById('currentAccountText');
  const accountInput = document.getElementById('accountInput');
  const saveAccountBtn = document.getElementById('saveAccountBtn');
  const editAccountBtn = document.getElementById('editAccountBtn');
  const myQrBtn = document.getElementById('myQrBtn');
  const scanBtn = document.getElementById('scanBtn');
  const indexMessage = document.getElementById('indexMessage');
  const systemEntryQr = document.getElementById('systemEntryQr');

  function normalizeAccount(value) {
    return (value || '').trim().toLowerCase();
  }

  function isValidAccount(account) {
    return /^[a-zA-Z0-9._%+-]+$/.test(normalizeAccount(account));
  }

  function accountToEmail(account) {
    return `${normalizeAccount(account)}${config.EMAIL_DOMAIN}`;
  }

  function getStoredAccount() {
    return normalizeAccount(localStorage.getItem(config.STORAGE_KEY_ACCOUNT));
  }

  function setStoredAccount(account) {
    localStorage.setItem(config.STORAGE_KEY_ACCOUNT, normalizeAccount(account));
  }

  function clearStoredAccount() {
    localStorage.removeItem(config.STORAGE_KEY_ACCOUNT);
  }

  function setMessage(message, type = '') {
    indexMessage.textContent = message;
    indexMessage.className = 'status-message';
    if (type) indexMessage.classList.add(type);
  }

  function refreshUI() {
    const account = getStoredAccount();
    if (account && isValidAccount(account)) {
      accountFormSection.classList.add('hidden');
      currentAccountSection.classList.remove('hidden');
      currentAccountText.textContent = accountToEmail(account);
      welcomeText.textContent = `${accountToEmail(account)} 您好，請點選以下功能。`;
      myQrBtn.disabled = false;
      scanBtn.disabled = false;
    } else {
      accountFormSection.classList.remove('hidden');
      currentAccountSection.classList.add('hidden');
      welcomeText.textContent = '請先輸入您的校園帳號。';
      myQrBtn.disabled = true;
      scanBtn.disabled = true;
    }
  }

  saveAccountBtn?.addEventListener('click', () => {
    const account = normalizeAccount(accountInput.value);
    if (!account) {
      setMessage('請輸入帳號。', 'error');
      return;
    }
    if (!isValidAccount(account)) {
      setMessage('帳號格式不正確，請只輸入 @ 前面的帳號內容。', 'error');
      return;
    }
    setStoredAccount(account);
    accountInput.value = account;
    setMessage('帳號已儲存。', 'success');
    refreshUI();
  });

  editAccountBtn?.addEventListener('click', () => {
    const account = getStoredAccount();
    accountInput.value = account;
    clearStoredAccount();
    refreshUI();
    setMessage('請輸入新的帳號後重新儲存。', 'warn');
    accountInput.focus();
  });

  myQrBtn?.addEventListener('click', () => {
    window.location.href = 'myqrcode.html';
  });

  scanBtn?.addEventListener('click', () => {
    window.location.href = 'scan.html';
  });

  if (systemEntryQr) {
    new QRCode(systemEntryQr, {
      text: config.SITE_URL,
      width: 140,
      height: 140,
      correctLevel: QRCode.CorrectLevel.M
    });
  }

  refreshUI();
})();
