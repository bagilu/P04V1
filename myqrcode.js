(function () {
  const config = window.APP_CONFIG;
  const qrcodeEmailBlock = document.getElementById('qrcodeEmailBlock');
  const qrEmailText = document.getElementById('qrEmailText');
  const qrcodeBox = document.getElementById('qrcodeBox');
  const qrEmailInput = document.getElementById('qrEmailInput');
  const updateEmailBtn = document.getElementById('updateEmailBtn');
  const qrStatusMessage = document.getElementById('qrStatusMessage');

  function normalizeEmail(value) {
    return (value || '').trim().toLowerCase();
  }

  function isValidCampusEmail(email) {
    return /^[a-zA-Z0-9._%+-]+@gms\.tcu\.edu\.tw$/.test(normalizeEmail(email));
  }

  function getStoredEmail() {
    return normalizeEmail(localStorage.getItem(config.STORAGE_KEY_EMAIL));
  }

  function saveEmail(email) {
    localStorage.setItem(config.STORAGE_KEY_EMAIL, normalizeEmail(email));
  }

  function setStatus(message, type = '') {
    qrStatusMessage.textContent = message;
    qrStatusMessage.className = 'status-message';
    if (type) qrStatusMessage.classList.add(type);
  }

  function renderQr(email) {
    qrcodeBox.innerHTML = '';
    qrEmailText.textContent = email;
    qrEmailInput.value = email;
    new QRCode(qrcodeBox, {
      text: email,
      width: 240,
      height: 240
    });
    qrcodeEmailBlock.classList.remove('hidden');
  }

  function init() {
    const email = getStoredEmail();
    if (!isValidCampusEmail(email)) {
      setStatus('尚未設定有效 Email，請先回主頁輸入。', 'error');
      qrcodeEmailBlock.classList.add('hidden');
      return;
    }
    renderQr(email);
  }

  updateEmailBtn?.addEventListener('click', () => {
    const email = normalizeEmail(qrEmailInput.value);
    if (!isValidCampusEmail(email)) {
      setStatus('請輸入正確的校園 Email，且必須以 @gms.tcu.edu.tw 結尾。', 'error');
      return;
    }
    saveEmail(email);
    renderQr(email);
    setStatus('Email 已更新，QRCode 已重新產生。', 'success');
  });

  init();
})();
