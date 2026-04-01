(function () {
  const config = window.APP_CONFIG;
  const myNicknameDisplay = document.getElementById('myNicknameDisplay');
  const myAccountDisplay = document.getElementById('myAccountDisplay');
  const myQrCodeBox = document.getElementById('myQrCodeBox');
  const myQrMessage = document.getElementById('myQrMessage');
  const editAccountBtn = document.getElementById('editAccountBtn');

  function normalizeAccount(value) {
    return (value || '').trim().toLowerCase();
  }

  function normalizeNickname(value) {
    return (value || '').trim();
  }

  function isValidAccount(account) {
    return /^[a-zA-Z0-9._%+-]+$/.test(normalizeAccount(account));
  }

  function isValidNickname(nickname) {
    const value = normalizeNickname(nickname);
    return value.length > 0 && value.length <= config.NICKNAME_MAX_LENGTH;
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
  const nickname = normalizeNickname(localStorage.getItem(config.STORAGE_KEY_NICKNAME));

  if (!isValidAccount(account) || !isValidNickname(nickname)) {
    setMessage('尚未設定有效帳號與暱稱，請先回到主畫面輸入資料。', 'error');
  } else {
    myNicknameDisplay.textContent = nickname;
    myAccountDisplay.textContent = accountToEmail(account);
    new QRCode(myQrCodeBox, {
      text: JSON.stringify({ account, nickname }),
      width: 200,
      height: 200,
      correctLevel: QRCode.CorrectLevel.M
    });
    setMessage('此 QRCode 內容包含帳號與暱稱，掃描後系統會自動帶出資料。', 'success');
  }

  editAccountBtn?.addEventListener('click', () => {
    window.location.href = 'index.html';
  });
})();
