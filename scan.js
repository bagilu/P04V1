(function () {
  const config = window.APP_CONFIG;
  const scannerNotice = document.getElementById('scannerNotice');
  const scanStatusMessage = document.getElementById('scanStatusMessage');
  const scanResultBlock = document.getElementById('scanResultBlock');
  const targetAccountText = document.getElementById('targetAccountText');
  const restartScanBtn = document.getElementById('restartScanBtn');
  const feedbackButtons = document.querySelectorAll('.feedback-btn');

  let html5QrCode = null;
  let targetAccount = '';
  let isScannerRunning = false;

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

  function emailToAccount(email) {
    const value = (email || '').trim().toLowerCase();
    const suffix = (config.EMAIL_DOMAIN || '').toLowerCase();
    return value.endsWith(suffix) ? value.slice(0, -suffix.length) : '';
  }

  function getMyAccount() {
    return normalizeAccount(localStorage.getItem(config.STORAGE_KEY_ACCOUNT));
  }

  function getMyNickname() {
    return normalizeNickname(localStorage.getItem(config.STORAGE_KEY_NICKNAME));
  }

  function setMessage(element, message, type = '') {
    if (!element) return;
    element.textContent = message;
    element.className = 'status-message';
    if (type) element.classList.add(type);
  }

  function ensureConfig() {
    if (!config.SUPABASE_URL || config.SUPABASE_URL.includes('YOUR-PROJECT')) {
      setMessage(scanStatusMessage, '請先在 config.js 填入正確的 Supabase URL 與 Anon Key。', 'error');
      return false;
    }
    if (!config.SUPABASE_ANON_KEY || config.SUPABASE_ANON_KEY.includes('YOUR_SUPABASE_ANON_KEY')) {
      setMessage(scanStatusMessage, '請先在 config.js 填入正確的 Supabase URL 與 Anon Key。', 'error');
      return false;
    }
    return true;
  }

  function ensureMyProfile() {
    const myAccount = getMyAccount();
    const myNickname = getMyNickname();
    if (!isValidAccount(myAccount) || !isValidNickname(myNickname)) {
      setMessage(scannerNotice, '尚未設定有效帳號與暱稱，請先回主畫面輸入資料。', 'error');
      return false;
    }
    setMessage(scannerNotice, `目前使用者：${myNickname}（${accountToEmail(myAccount)}）`, 'success');
    return true;
  }

  function parseDecodedText(decodedText) {
    const raw = (decodedText || '').trim();
    if (!raw) return '';

    if (raw.includes('@')) {
      const accountFromEmail = emailToAccount(raw);
      if (isValidAccount(accountFromEmail)) return accountFromEmail;
    }

    const account = normalizeAccount(raw);
    if (isValidAccount(account)) return account;

    return '';
  }

  function createClient() {
    return window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
  }

  async function stopScanner() {
    if (html5QrCode && isScannerRunning) {
      try {
        await html5QrCode.stop();
      } catch (error) {
        console.warn(error);
      }
      isScannerRunning = false;
    }
  }

  async function startScanner() {
    if (!ensureMyProfile() || !ensureConfig()) return;

    if (html5QrCode) {
      try {
        await stopScanner();
        await html5QrCode.clear();
      } catch (error) {
        console.warn(error);
      }
    }

    html5QrCode = new Html5Qrcode('reader');

    try {
      await html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        async (decodedText) => {
          const decodedAccount = parseDecodedText(decodedText);

          if (!decodedAccount) {
            setMessage(scanStatusMessage, '掃描內容不是有效的系統帳號資料。', 'error');
            return;
          }

          targetAccount = decodedAccount;
          targetAccountText.textContent = targetAccount;
          scanResultBlock.classList.remove('hidden');
          restartScanBtn.classList.remove('hidden');

          await stopScanner();
          setMessage(scanStatusMessage, '掃描成功，請選擇一種表達方式。', 'success');
        },
        () => {}
      );

      isScannerRunning = true;
      setMessage(scanStatusMessage, '請將 QRCode 對準掃描框。', 'warn');
    } catch (error) {
      console.error(error);
      setMessage(scanStatusMessage, '無法啟動相機，請確認瀏覽器已允許相機權限，且目前網站在 HTTPS 環境。', 'error');
    }
  }

  async function submitEvent(smileType) {
    const responderAccount = getMyAccount();
    const responderNickname = getMyNickname();
    const smilerAccount = normalizeAccount(targetAccount);

    if (!isValidAccount(responderAccount) || !isValidAccount(smilerAccount)) {
      setMessage(scanStatusMessage, '帳號資料不完整或格式錯誤。', 'error');
      return;
    }

    if (!isValidNickname(responderNickname)) {
      setMessage(scanStatusMessage, '您的暱稱資料不完整或格式錯誤。', 'error');
      return;
    }

    feedbackButtons.forEach(btn => btn.disabled = true);
    setMessage(scanStatusMessage, '資料送出中，請稍候。', 'warn');

    const supabase = createClient();
    const { data, error } = await supabase.functions.invoke(config.FUNCTION_SUBMIT_EVENT, {
      body: {
        smiler_account: smilerAccount,
        responder_account: responderAccount,
        responder_nickname: responderNickname,
        smile_type: Number(smileType)
      }
    });

    if (error || !data?.success) {
      console.error(error || data);
      const code = data?.code;
      if (code === 'SELF_NOT_ALLOWED') {
        setMessage(scanStatusMessage, '不能對自己送出肯定。', 'error');
      } else if (code === 'DUPLICATE_TODAY') {
        setMessage(scanStatusMessage, '今天已經表達過。', 'warn');
      } else if (code === 'INVALID_INPUT') {
        setMessage(scanStatusMessage, data.message || '資料格式錯誤。', 'error');
      } else {
        setMessage(scanStatusMessage, data?.message || error?.message || '送出失敗。', 'error');
      }
      feedbackButtons.forEach(btn => btn.disabled = false);
      return;
    }

    setMessage(scanStatusMessage, '送出成功，系統即將回到主畫面。', 'success');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1400);
  }

  restartScanBtn?.addEventListener('click', async () => {
    scanResultBlock.classList.add('hidden');
    restartScanBtn.classList.add('hidden');
    targetAccount = '';
    setMessage(scanStatusMessage, '已準備重新掃描。', 'warn');
    await startScanner();
  });

  feedbackButtons.forEach(button => {
    button.addEventListener('click', () => submitEvent(button.dataset.type));
  });

  startScanner();
})();
