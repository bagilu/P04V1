(function () {
  const config = window.APP_CONFIG;
  const myNicknameDisplay = document.getElementById('myNicknameDisplay');
  const myAccountDisplay = document.getElementById('myAccountDisplay');
  const myQrCodeBox = document.getElementById('myQrCodeBox');
  const myQrMessage = document.getElementById('myQrMessage');
  const editAccountBtn = document.getElementById('editAccountBtn');
  const liveNoticePanel = document.getElementById('liveNoticePanel');
  const liveNoticeText = document.getElementById('liveNoticeText');

  let pollTimer = null;
  let qrRestoreTimer = null;
  let latestKnownEventId = null;

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

  function renderQrCode(account) {
    if (!myQrCodeBox) return;
    myQrCodeBox.innerHTML = '';
    new QRCode(myQrCodeBox, {
      text: accountToEmail(account),
      width: 190,
      height: 190,
      correctLevel: QRCode.CorrectLevel.M
    });
  }

  function buildFlowerNotice(row) {
    const name = row.responder_nickname || row.responder_account || '某位同學';
    const label = row.smile_type_label || '善意';
    return `
      <div class="flower-notice-card" role="status" aria-live="polite">
        <div class="flower-emoji">💐</div>
        <div class="flower-title">收到一束微笑之花</div>
        <div class="flower-message">
          剛剛 <strong>${escapeHtml(name)}</strong><br>
          記錄了你對他的${escapeHtml(label)}
        </div>
        <div class="flower-subtitle">謝謝你把善意傳出去</div>
      </div>
    `;
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function showLiveNotice(row, account) {
    if (!row) return;

    const name = row.responder_nickname || row.responder_account || '某位同學';
    const label = row.smile_type_label || '善意';

    if (liveNoticeText && liveNoticePanel) {
      liveNoticeText.textContent = `剛剛 ${name} 記錄了你對他的${label}。`;
      liveNoticePanel.classList.remove('hidden');
      liveNoticePanel.classList.remove('notice-pop');
      void liveNoticePanel.offsetWidth;
      liveNoticePanel.classList.add('notice-pop');
    }

    if (myQrCodeBox) {
      myQrCodeBox.classList.add('qr-flower-mode');
      myQrCodeBox.innerHTML = buildFlowerNotice(row);
    }

    setMessage('新的微笑漣漪已送達。QRCode 稍後會自動回來。', 'success');

    if (qrRestoreTimer) clearTimeout(qrRestoreTimer);
    qrRestoreTimer = setTimeout(() => {
      myQrCodeBox.classList.remove('qr-flower-mode');
      renderQrCode(account);
      setMessage('此 QRCode 內容為完整校園 Email；掃描後系統會自動轉換為帳號。', 'success');
    }, config.NOTIFICATION_DISPLAY_MS || 8000);
  }

  function getSeenKey(account) {
    return `P04_LAST_SEEN_EVENT_ID_${normalizeAccount(account)}`;
  }

  function loadSeenEventId(account) {
    return localStorage.getItem(getSeenKey(account)) || null;
  }

  function saveSeenEventId(account, id) {
    if (id !== undefined && id !== null) {
      localStorage.setItem(getSeenKey(account), String(id));
    }
  }

  async function initializeLatestEvent(account) {
    const { data, error } = await invokeP04Function('GET_RECENT_NOTIFICATIONS', {
      smiler_account: account,
      limit: 1
    });

    if (error || !data?.success) {
      console.warn(error || data);
      return;
    }

    const rows = data.rows || [];
    if (rows.length && rows[0].id !== undefined && rows[0].id !== null) {
      latestKnownEventId = String(rows[0].id);
      saveSeenEventId(account, latestKnownEventId);
    }
  }

  async function pollRecentNotifications(account) {
    if (!ensureConfigAvailable()) return;

    const lastSeenId = latestKnownEventId || loadSeenEventId(account);

    const { data, error } = await invokeP04Function('GET_RECENT_NOTIFICATIONS', {
      smiler_account: account,
      after_id: lastSeenId,
      limit: 3
    });

    if (error || !data?.success) {
      console.warn(error || data);
      return;
    }

    const rows = data.rows || [];
    if (!rows.length) return;

    const newest = rows[0];
    if (newest.id !== undefined && newest.id !== null) {
      latestKnownEventId = String(newest.id);
      saveSeenEventId(account, latestKnownEventId);
    }

    showLiveNotice(newest, account);
  }

  const account = normalizeAccount(localStorage.getItem(config.STORAGE_KEY_ACCOUNT));
  const nickname = normalizeNickname(localStorage.getItem(config.STORAGE_KEY_NICKNAME));

  if (!isValidAccount(account) || !isValidNickname(nickname)) {
    setMessage('尚未設定有效帳號與暱稱，請先回到主畫面輸入資料。', 'error');
  } else {
    myNicknameDisplay.textContent = nickname;
    myAccountDisplay.textContent = accountToEmail(account);

    renderQrCode(account);

    setMessage('此 QRCode 內容為完整校園 Email；掃描後系統會自動轉換為帳號。', 'success');

    if (ensureConfigAvailable()) {
      latestKnownEventId = loadSeenEventId(account);
      if (!latestKnownEventId) {
        initializeLatestEvent(account).then(() => {
          pollTimer = setInterval(() => pollRecentNotifications(account), config.NOTIFICATION_POLL_MS || 3000);
        });
      } else {
        pollTimer = setInterval(() => pollRecentNotifications(account), config.NOTIFICATION_POLL_MS || 3000);
      }

      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) pollRecentNotifications(account);
      });
    }
  }

  editAccountBtn?.addEventListener('click', () => {
    if (pollTimer) clearInterval(pollTimer);
    if (qrRestoreTimer) clearTimeout(qrRestoreTimer);
    window.location.href = 'index.html';
  });
})();
