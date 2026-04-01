(function () {
  const config = window.APP_CONFIG;

  const scannerNotice = document.getElementById('scannerNotice');
  const scanStatusMessage = document.getElementById('scanStatusMessage');
  const scanResultBlock = document.getElementById('scanResultBlock');
  const targetAccountText = document.getElementById('targetAccountText');
  const targetNicknameText = document.getElementById('targetNicknameText');
  const restartScanBtn = document.getElementById('restartScanBtn');
  const feedbackButtons = document.querySelectorAll('.feedback-btn');

  let html5QrCode = null;
  let targetAccount = '';
  let targetNickname = '';
  let isScannerRunning = false;

  function normalizeAccount(value) {
    return (value || '').trim().toLowerCase();
  }

  function normalizeNickname(value) {
    return (value || '').trim();
  }

  function isValidAccount(account) {
    return /^[a-zA-Z0-9._-]+$/.test(normalizeAccount(account));
  }

  function isValidNickname(nickname) {
    const value = normalizeNickname(nickname);
    return value.length > 0 && value.length <= 20;
  }

  function buildEmail(account) {
    return `${normalizeAccount(account)}${config.EMAIL_DOMAIN}`;
  }

  function getMyAccount() {
    return normalizeAccount(localStorage.getItem(config.STORAGE_KEY_ACCOUNT));
  }

  function getMyNickname() {
    const nickname = normalizeNickname(localStorage.getItem(config.STORAGE_KEY_NICKNAME));
    const account = getMyAccount();
    return nickname || account;
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

    if (!isValidAccount(myAccount)) {
      setMessage(scannerNotice, '尚未設定有效帳號，請先回主畫面輸入您的校園帳號。', 'error');
      return false;
    }

    if (!isValidNickname(myNickname)) {
      setMessage(scannerNotice, '尚未設定有效暱稱，請先回主畫面輸入您的暱稱。', 'error');
      return false;
    }

    setMessage(
      scannerNotice,
      `目前使用者：${myNickname}（${buildEmail(myAccount)}）`,
      'success'
    );
    return true;
  }

  function emailToAccount(email) {
    const value = (email || '').trim().toLowerCase();
    const suffix = (config.EMAIL_DOMAIN || '').toLowerCase();
    if (suffix && value.endsWith(suffix)) {
      return value.slice(0, -suffix.length);
    }
    return '';
  }

  function parseDecodedPayload(decodedText) {
    const raw = (decodedText || '').trim();
    if (!raw) return null;

    try {
      const obj = JSON.parse(raw);

      // 新版：{ account, nickname }
      const account1 = normalizeAccount(obj.account);
      const nickname1 = normalizeNickname(obj.nickname);
      if (isValidAccount(account1)) {
        return {
          account: account1,
          nickname: isValidNickname(nickname1) ? nickname1 : account1
        };
      }

      // 舊版：{ email, nickname }
      const account2 = emailToAccount(obj.email);
      const nickname2 = normalizeNickname(obj.nickname);
      if (isValidAccount(account2)) {
        return {
          account: account2,
          nickname: isValidNickname(nickname2) ? nickname2 : account2
        };
      }

      // 更舊版：{ email }
      const account3 = emailToAccount(obj.email);
      if (isValidAccount(account3)) {
        return {
          account: account3,
          nickname: account3
        };
      }
    } catch (error) {
      // 非 JSON，繼續往下判斷
    }

    // 純 account
    const fallbackAccount = normalizeAccount(raw);
    if (isValidAccount(fallbackAccount)) {
      return {
        account: fallbackAccount,
        nickname: fallbackAccount
      };
    }

    // 純完整 email
    const fallbackFromEmail = emailToAccount(raw);
    if (isValidAccount(fallbackFromEmail)) {
      return {
        account: fallbackFromEmail,
        nickname: fallbackFromEmail
      };
    }

    return null;
  }

  async function stopScanner() {
    if (html5QrCode && isScannerRunning) {
      try {
        await html5QrCode.stop();
      } catch (error) {
        console.warn('停止掃描器時發生問題：', error);
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
        console.warn('清除舊掃描器時發生問題：', error);
      }
    }

    html5QrCode = new Html5Qrcode('reader');

    try {
      await html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        async (decodedText) => {
          const parsed = parseDecodedPayload(decodedText);

          if (!parsed) {
            setMessage(scanStatusMessage, '掃描內容不是有效的系統帳號資料。', 'error');
            return;
          }

          targetAccount = parsed.account;
          targetNickname = parsed.nickname || parsed.account;

          targetAccountText.textContent = targetAccount;
          if (targetNicknameText) {
            targetNicknameText.textContent = targetNickname;
          }

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
      setMessage(
        scanStatusMessage,
        '無法啟動相機，請確認瀏覽器已允許相機權限，且目前網站在 HTTPS 環境。',
        'error'
      );
    }
  }

  async function submitEvent(smileType) {
    const responderAccount = getMyAccount();
    const responderNickname = getMyNickname();
    const smilerAccount = normalizeAccount(targetAccount);
    const smilerNickname = normalizeNickname(targetNickname) || smilerAccount;

    if (!isValidAccount(responderAccount) || !isValidAccount(smilerAccount)) {
      setMessage(scanStatusMessage, '帳號資料不完整或格式錯誤。', 'error');
      return;
    }

    if (!isValidNickname(responderNickname) || !isValidNickname(smilerNickname)) {
      setMessage(scanStatusMessage, '暱稱資料不完整或格式錯誤。', 'error');
      return;
    }

    if (responderAccount === smilerAccount) {
      setMessage(scanStatusMessage, '不能對自己送出肯定。', 'error');
      return;
    }

    feedbackButtons.forEach(btn => {
      btn.disabled = true;
    });
    setMessage(scanStatusMessage, '資料送出中，請稍候。', 'warn');

    const supabase = window.supabase.createClient(
      config.SUPABASE_URL,
      config.SUPABASE_ANON_KEY
    );

    const today = new Date();
    const eventDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const payload = {
      smiler_account: smilerAccount,
      smiler_nickname: smilerNickname,
      responder_account: responderAccount,
      responder_nickname: responderNickname,
      smile_type: smileType,
      event_date: eventDate
    };

    const { error } = await supabase
      .from(config.TABLE_SMILE_EVENTS)
      .insert(payload);

    if (error) {
      console.error(error);

      if (error.code === '23505') {
        setMessage(scanStatusMessage, '今天已經表達過。', 'warn');
      } else if (error.code === '23514') {
        setMessage(scanStatusMessage, '資料不符合資料庫限制，請確認帳號與暱稱內容。', 'error');
      } else {
        setMessage(scanStatusMessage, `送出失敗：${error.message}`, 'error');
      }

      feedbackButtons.forEach(btn => {
        btn.disabled = false;
      });
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
    targetNickname = '';
    setMessage(scanStatusMessage, '已準備重新掃描。', 'warn');
    await startScanner();
  });

  feedbackButtons.forEach(button => {
    button.addEventListener('click', () => {
      submitEvent(button.dataset.type);
    });
  });

  startScanner();
})();
