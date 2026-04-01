(function () {
  const config = window.APP_CONFIG;
  const myAccountDisplay = document.getElementById('myAccountDisplay');
  const myQrCodeBox = document.getElementById('myQrCodeBox');
  const myQrMessage = document.getElementById('myQrMessage');
  const editAccountBtn = document.getElementById('editAccountBtn');

  function normalizeAccount(value) {
    return (value || '').trim().toLowerCase();
  }

  function isValidAccount(account) {
    return /^[a-zA-Z0-9._%+-]+$/.test(normalizeAccount(account));
  }

  function accountToEmail(account) {
    return `${normalizeAccount(account)}${config.EMAIL_DOMAIN}`;
  }

  function setMessage(message, type = '') {
    myQrMessage.textContent = message;
    myQrMessage.className = 'status-message';
    if (type) myQrMessage.classList.add(type);
  }

  const account = normalizeAccount(localStorage.getItem(config.STORAGE_KEY_ACCOUNT));
  if (!isValidAccount(account)) {
    setMessage('尚未設定有效帳號，請先回到主畫面輸入帳號。', 'error');
  } else {
    myAccountDisplay.textContent = accountToEmail(account);
    new QRCode(myQrCodeBox, {
      text: account,
      width: 200,
      height: 200,
      correctLevel: QRCode.CorrectLevel.M
    });
    setMessage('此 QRCode 內容為帳號本身，掃描後系統會自動補上固定網域。', 'success');
  }

  editAccountBtn?.addEventListener('click', () => {
    window.location.href = 'index.html';
  });
})();
