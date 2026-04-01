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

  function isValidAccount(account) {
    return /^[a-zA-Z0-9._%+-]+$/.test(normalizeAccount(account));
  }

  function accountToEmail(account) {
    return `${normalizeAccount(account)}${config.EMAIL_DOMAIN}`;
  }

  function getMyAccount() {
    return normalizeAccount(localStorage.getItem(config.STORAGE_KEY_ACCOUNT));
  }

  function setMessage(element, message, type = '') {
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

  function ensureMyAccount() {
    const myAccount = getMyAccount();
    if (!isValidAccount(myAccount)) {
      setMessage(scannerNotice, '尚未設定有效帳號，請先回主畫面輸入您的校園帳號。', 'error');
      return false;
    }
    setMessage(scannerNotice, `目前使用者：${accountToEmail(myAccount)}`, 'success');
    return true;
  }

  async function stopScanner() {
    if (html5QrCode && isScannerRunning) {
      await html5QrCode.stop();
      isScannerRunning = false;
    }
  }

  async function startScanner() {
    if (!ensureMyAccount() || !ensureConfig()) return;

    html5QrCode = new Html5Qrcode('reader');
    try {
      await html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        async (decodedText) => {
          const decodedAccount = normalizeAccount(decodedText);
          if (!isValidAccount(decodedAccount)) {
            setMessage(scanStatusMessage, '掃描內容不是有效帳號。', 'error');
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
    } catch (error) {
      console.error(error);
      setMessage(scanStatusMessage, '無法啟動相機，請確認瀏覽器已允許相機權限，且目前網站在 HTTPS 環境。', 'error');
    }
  }

  async function submitEvent(smileType) {
    const responderAccount = getMyAccount();
    const smilerAccount = normalizeAccount(targetAccount);

    if (!isValidAccount(responderAccount) || !isValidAccount(smilerAccount)) {
      setMessage(scanStatusMessage, '帳號資料不完整或格式錯誤。', 'error');
      return;
    }

    if (responderAccount === smilerAccount) {
      setMessage(scanStatusMessage, '不能對自己送出肯定。', 'error');
      return;
    }

    feedbackButtons.forEach(btn => btn.disabled = true);
    setMessage(scanStatusMessage, '資料送出中，請稍候。', 'warn');

    const supabase = window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
    const today = new Date();
    const eventDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const payload = {
      smiler_account: smilerAccount,
      responder_account: responderAccount,
      smile_type: smileType,
      event_date: eventDate
    };

    const { error } = await supabase.from(config.TABLE_SMILE_EVENTS).insert(payload);

    if (error) {
      console.error(error);
      if (error.code === '23505') {
        setMessage(scanStatusMessage, '今天已經表達過。', 'warn');
      } else if (error.code === '23514') {
        setMessage(scanStatusMessage, '資料不符合資料庫限制，請確認帳號與輸入內容。', 'error');
      } else {
        setMessage(scanStatusMessage, `送出失敗：${error.message}`, 'error');
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
