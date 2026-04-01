(function () {
  const config = window.APP_CONFIG;
  const emailInput = document.getElementById('emailInput');
  const saveEmailBtn = document.getElementById('saveEmailBtn');
  const welcomeBlock = document.getElementById('welcomeBlock');
  const emailFormBlock = document.getElementById('emailFormBlock');
  const currentEmailText = document.getElementById('currentEmailText');
  const statusMessage = document.getElementById('statusMessage');
  const editEmailBtn = document.getElementById('editEmailBtn');
  const clearEmailBtn = document.getElementById('clearEmailBtn');

  function normalizeEmail(value) {
    return (value || '').trim().toLowerCase();
  }

  function isValidCampusEmail(email) {
    const value = normalizeEmail(email);
    return /^[a-zA-Z0-9._%+-]+@gms\.tcu\.edu\.tw$/.test(value);
  }

  function setStatus(message, type = '') {
    statusMessage.textContent = message;
    statusMessage.className = 'status-message';
    if (type) {
      statusMessage.classList.add(type);
    }
  }

  function getStoredEmail() {
    return normalizeEmail(localStorage.getItem(config.STORAGE_KEY_EMAIL));
  }

  function saveEmail(email) {
    localStorage.setItem(config.STORAGE_KEY_EMAIL, normalizeEmail(email));
  }

  function showFormMode() {
    emailFormBlock.classList.remove('hidden');
    welcomeBlock.classList.add('hidden');
    editEmailBtn.classList.add('hidden');
    clearEmailBtn.classList.add('hidden');
  }

  function showWelcomeMode(email) {
    currentEmailText.textContent = email;
    welcomeBlock.classList.remove('hidden');
    emailFormBlock.classList.add('hidden');
    editEmailBtn.classList.remove('hidden');
    clearEmailBtn.classList.remove('hidden');
  }

  function init() {
    const storedEmail = getStoredEmail();
    if (storedEmail && isValidCampusEmail(storedEmail)) {
      showWelcomeMode(storedEmail);
    } else {
      localStorage.removeItem(config.STORAGE_KEY_EMAIL);
      showFormMode();
    }
  }

  saveEmailBtn?.addEventListener('click', () => {
    const email = normalizeEmail(emailInput.value);
    if (!isValidCampusEmail(email)) {
      setStatus('請輸入正確的校園 Email，且必須以 @gms.tcu.edu.tw 結尾。', 'error');
      return;
    }
    saveEmail(email);
    setStatus('Email 已儲存。', 'success');
    showWelcomeMode(email);
    emailInput.value = email;
  });

  editEmailBtn?.addEventListener('click', () => {
    const storedEmail = getStoredEmail();
    emailInput.value = storedEmail;
    showFormMode();
    setStatus('請重新輸入 Email 後按下儲存。', 'warn');
  });

  clearEmailBtn?.addEventListener('click', () => {
    localStorage.removeItem(config.STORAGE_KEY_EMAIL);
    emailInput.value = '';
    showFormMode();
    setStatus('本機 Email 已清除。', 'success');
  });

  init();
})();
