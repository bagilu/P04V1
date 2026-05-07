(function () {
  const config = window.APP_CONFIG;
  const myNicknameDisplay = document.getElementById('myNicknameDisplay');
  const myAccountDisplay = document.getElementById('myAccountDisplay');
  const myQrCodeBox = document.getElementById('myQrCodeBox');
  const myQrMessage = document.getElementById('myQrMessage');
  const editAccountBtn = document.getElementById('editAccountBtn');
  const liveNoticePanel = document.getElementById('liveNoticePanel');
  const liveNoticeText = document.getElementById('liveNoticeText');

  let lastCheckedAt = new Date().toISOString();
  let pollTimer = null;

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

  function ensureConfigAvailable() {
    return Boolean(
      config.SUPABASE_URL &&
      !config.SUPABASE_URL.includes('YOUR-PROJECT') &&
      config.SUPABASE_ANON_KEY &&
      !config.SUPABASE_ANON_KEY.includes('YOUR_SUPABASE_ANON_KEY')
    );
  }

  function createClient() {
    return window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
  }


  function getFunctionUrl(key) {
    return config.FUNCTIONS && config.FUNCTIONS[key];
  }

  async function invokeP04Function(key, body = {}, extraHeaders = {}) {
    const url = getFunctionUrl(key);
    if (!url || url.includes('YOUR-PROJECT')) {
      return { data: null, error: { message: '請先在 config.js 填入正確的 Function URL。' } };
    }
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': config.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${config.SUPABASE_ANON_KEY}`,
          ...extraHeaders
        },
        body: JSON.stringify(body || {})
      });
      let data = null;
      try { data = await response.json(); } catch (_) {}
      if (!response.ok) {
        return { data, error: { message: data?.message || `Edge Function returned ${response.status}` } };
      }
      return { data, error: null };
    } catch (error) {
      return { data: null, error: { message: error?.message || 'Function 呼叫失敗。' } };
    }
  }

  function setMessage(message, type = '') {
    myQrMessage.textContent = message;
    myQrMessage.className = 'status-message';
    if (type) myQrMessage.classList.add(type);
  }

  function showLiveNotice(row) {
    if (!row) return;
    const name = row.responder_nickname || row.responder_account || '某位同學';
    const label = row.smile_type_label || '善意';
    liveNoticeText.textContent = `${name} 剛剛送出紀錄。謝謝你的${label}。`;
    liveNoticePanel.classList.remove('hidden');
    liveNoticePanel.classList.remove('notice-pop');
    void liveNoticePanel.offsetWidth;
    liveNoticePanel.classList.add('notice-pop');
  }

  async function pollRecentNotifications(account) {
    if (!ensureConfigAvailable()) return;

    const { data, error } = await invokeP04Function('GET_RECENT_NOTICE', {
      smiler_account: account,
      since: lastCheckedAt
    });

    const now = new Date().toISOString();

    if (error || !data?.success) {
      console.warn(error || data);
      return;
    }

    const rows = data.rows || [];
    if (rows.length) {
      showLiveNotice(rows[0]);
      lastCheckedAt = rows[0].created_at || now;
    }
  }

  const account = normalizeAccount(localStorage.getItem(config.STORAGE_KEY_ACCOUNT));
  const nickname = normalizeNickname(localStorage.getItem(config.STORAGE_KEY_NICKNAME));

  if (!isValidAccount(account) || !isValidNickname(nickname)) {
    setMessage('尚未設定有效帳號與暱稱，請先回到主畫面輸入資料。', 'error');
  } else {
    myNicknameDisplay.textContent = nickname;
    myAccountDisplay.textContent = accountToEmail(account);

    new QRCode(myQrCodeBox, {
      text: accountToEmail(account),
      width: 190,
      height: 190,
      correctLevel: QRCode.CorrectLevel.M
    });

    setMessage('此 QRCode 內容為完整校園 Email；掃描後系統會自動轉換為帳號。', 'success');

    if (ensureConfigAvailable()) {
      pollTimer = setInterval(() => pollRecentNotifications(account), config.NOTIFICATION_POLL_MS || 5000);
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) pollRecentNotifications(account);
      });
    }
  }

  editAccountBtn?.addEventListener('click', () => {
    if (pollTimer) clearInterval(pollTimer);
    window.location.href = 'index.html';
  });
})();
