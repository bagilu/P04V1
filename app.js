(function () {
  const config = window.APP_CONFIG;
  const welcomeText = document.getElementById('welcomeText');
  const accountFormSection = document.getElementById('accountFormSection');
  const currentAccountSection = document.getElementById('currentAccountSection');
  const currentAccountText = document.getElementById('currentAccountText');
  const currentNicknameText = document.getElementById('currentNicknameText');
  const accountInput = document.getElementById('accountInput');
  const nicknameInput = document.getElementById('nicknameInput');
  const saveAccountBtn = document.getElementById('saveAccountBtn');
  const editAccountBtn = document.getElementById('editAccountBtn');
  const myQrBtn = document.getElementById('myQrBtn');
  const scanBtn = document.getElementById('scanBtn');
  const indexMessage = document.getElementById('indexMessage');
  const systemEntryQr = document.getElementById('systemEntryQr');
  const totalSmileCount = document.getElementById('totalSmileCount');
  const smilerRankingList = document.getElementById('smilerRankingList');
  const responderRankingList = document.getElementById('responderRankingList');
  const mySmileRecordsBody = document.getElementById('mySmileRecordsBody');
  const myResponseRecordsBody = document.getElementById('myResponseRecordsBody');

  let mySmilePage = 1;
  let myResponsePage = 1;

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

  function getStoredAccount() {
    return normalizeAccount(localStorage.getItem(config.STORAGE_KEY_ACCOUNT));
  }

  function getStoredNickname() {
    return normalizeNickname(localStorage.getItem(config.STORAGE_KEY_NICKNAME));
  }

  function setStoredProfile(account, nickname) {
    localStorage.setItem(config.STORAGE_KEY_ACCOUNT, normalizeAccount(account));
    localStorage.setItem(config.STORAGE_KEY_NICKNAME, normalizeNickname(nickname));
  }

  function clearStoredProfile() {
    localStorage.removeItem(config.STORAGE_KEY_ACCOUNT);
    localStorage.removeItem(config.STORAGE_KEY_NICKNAME);
  }

  function setMessage(message, type = '') {
    indexMessage.textContent = message;
    indexMessage.className = 'status-message';
    if (type) indexMessage.classList.add(type);
  }

  function refreshUI() {
    const account = getStoredAccount();
    const nickname = getStoredNickname();

    if (account && isValidAccount(account) && nickname && isValidNickname(nickname)) {
      accountFormSection.classList.add('hidden');
      currentAccountSection.classList.remove('hidden');
      currentNicknameText.textContent = nickname;
      currentAccountText.textContent = accountToEmail(account);
      welcomeText.textContent = `${nickname} 您好，請點選以下功能。`;
      myQrBtn.disabled = false;
      scanBtn.disabled = false;
    } else {
      accountFormSection.classList.remove('hidden');
      currentAccountSection.classList.add('hidden');
      welcomeText.textContent = '請先輸入您的校園帳號與暱稱。';
      myQrBtn.disabled = true;
      scanBtn.disabled = true;
    }
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

  function renderPlaceholder(listElement, text) {
    if (!listElement) return;
    listElement.innerHTML = `<li class="leaderboard-placeholder">${text}</li>`;
  }

  function renderRanking(listElement, rankingData) {
    if (!listElement) return;
    if (!rankingData.length) {
      renderPlaceholder(listElement, '目前尚無資料');
      return;
    }
    listElement.innerHTML = rankingData.map((item, index) => {
      const safeNickname = item.nickname || item.account;
      return `<li><span class="rank-order">${index + 1}.</span><span class="rank-name">${safeNickname}</span><span class="rank-count">${item.count} 次</span></li>`;
    }).join('');
  }

  async function loadHomepageStats() {
    if (!ensureConfigAvailable()) {
      totalSmileCount.textContent = '--';
      renderPlaceholder(smilerRankingList, '請先設定 Supabase');
      renderPlaceholder(responderRankingList, '請先設定 Supabase');
      return;
    }

    const { data, error } = await invokeP04Function('GET_HOME_STATS', {});

    if (error || !data?.success) {
      console.error(error || data);
      totalSmileCount.textContent = '--';
      renderPlaceholder(smilerRankingList, '讀取失敗');
      renderPlaceholder(responderRankingList, '讀取失敗');
      return;
    }

    totalSmileCount.textContent = data.totalSmileCount ?? 0;
    renderRanking(smilerRankingList, data.smilerRanking || []);
    renderRanking(responderRankingList, data.responderRanking || []);
  }



  function formatDateTime(value) {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleString('zh-TW', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function renderRecordLoading() {
    if (mySmileRecordsBody) mySmileRecordsBody.innerHTML = '<div class="record-empty">載入中…</div>';
    if (myResponseRecordsBody) myResponseRecordsBody.innerHTML = '<div class="record-empty">載入中…</div>';
  }

  function renderRecordUnavailable(message) {
    const html = `<div class="record-empty">${escapeHtml(message)}</div>`;
    if (mySmileRecordsBody) mySmileRecordsBody.innerHTML = html;
    if (myResponseRecordsBody) myResponseRecordsBody.innerHTML = html;
  }

  async function loadMyRecords(mode, page) {
    const account = getStoredAccount();
    if (!account || !isValidAccount(account)) {
      return { success: false, message: '請先儲存帳號後，才能顯示個人紀錄。' };
    }
    return (await invokeP04Function('GET_MY_RECORDS', { account, mode, page })).data || { success: false, message: '讀取失敗。' };
  }

  function renderRecordTable(target, data, mode) {
    if (!target) return;
    if (!data?.success) {
      target.innerHTML = `<div class="record-error">${escapeHtml(data?.message || '讀取失敗')}</div>`;
      return;
    }
    const rows = data.rows || [];
    if (!rows.length) {
      target.innerHTML = `
        <div class="record-empty">目前尚無資料。今天也可以先送出第一個善意漣漪。</div>
        <div class="record-pagination"><button disabled>上一頁</button><span>第 1 / 1 頁</span><button disabled>下一頁</button></div>
      `;
      return;
    }
    const body = rows.map(row => {
      const otherName = mode === 'smiler'
        ? (row.responder_nickname || row.responder_account || '某位同學')
        : (row.smiler_nickname || row.smiler_account || '某位同學');
      const verb = mode === 'smiler' ? '記錄了你給他的' : '你記錄了他給你的';
      return `
        <tr>
          <td>${escapeHtml(formatDateTime(row.created_at))}</td>
          <td>${escapeHtml(otherName)}</td>
          <td><span class="record-pill">${escapeHtml(row.smile_type_label || '善意')}</span>${escapeHtml(verb)}</td>
        </tr>
      `;
    }).join('');
    const prevDisabled = data.page <= 1 ? 'disabled' : '';
    const nextDisabled = data.page >= data.total_pages ? 'disabled' : '';
    target.innerHTML = `
      <table class="record-table">
        <thead><tr><th>時間</th><th>對象</th><th>內容</th></tr></thead>
        <tbody>${body}</tbody>
      </table>
      <div class="record-pagination">
        <button data-record-mode="${mode}" data-record-action="prev" ${prevDisabled}>上一頁</button>
        <span>第 ${data.page} / ${data.total_pages} 頁，共 ${data.total} 筆</span>
        <button data-record-mode="${mode}" data-record-action="next" ${nextDisabled}>下一頁</button>
      </div>
    `;
  }

  async function loadAllMyRecords() {
    if (!mySmileRecordsBody && !myResponseRecordsBody) return;
    if (!ensureConfigAvailable()) {
      renderRecordUnavailable('請先完成 config.js 的 Supabase 與 Function URL 設定。');
      return;
    }
    const account = getStoredAccount();
    if (!account || !isValidAccount(account)) {
      renderRecordUnavailable('請先儲存帳號後，才能顯示個人紀錄。');
      return;
    }
    renderRecordLoading();
    const [smileData, responseData] = await Promise.all([
      loadMyRecords('smiler', mySmilePage),
      loadMyRecords('responder', myResponsePage),
    ]);
    renderRecordTable(mySmileRecordsBody, smileData, 'smiler');
    renderRecordTable(myResponseRecordsBody, responseData, 'responder');
  }

  document.addEventListener('click', async (event) => {
    const btn = event.target.closest('button[data-record-mode][data-record-action]');
    if (!btn) return;
    const mode = btn.dataset.recordMode;
    const action = btn.dataset.recordAction;
    if (mode === 'smiler') {
      mySmilePage = action === 'prev' ? Math.max(1, mySmilePage - 1) : mySmilePage + 1;
      const data = await loadMyRecords('smiler', mySmilePage);
      renderRecordTable(mySmileRecordsBody, data, 'smiler');
    }
    if (mode === 'responder') {
      myResponsePage = action === 'prev' ? Math.max(1, myResponsePage - 1) : myResponsePage + 1;
      const data = await loadMyRecords('responder', myResponsePage);
      renderRecordTable(myResponseRecordsBody, data, 'responder');
    }
  });

  saveAccountBtn?.addEventListener('click', () => {
    const account = normalizeAccount(accountInput.value);
    const nickname = normalizeNickname(nicknameInput.value);

    if (!account) {
      setMessage('請輸入帳號。', 'error');
      return;
    }
    if (!isValidAccount(account)) {
      setMessage('帳號格式不正確，請只輸入 @ 前面的帳號內容。', 'error');
      return;
    }
    if (!isValidNickname(nickname)) {
      setMessage(`請輸入 1 到 ${config.NICKNAME_MAX_LENGTH} 字的暱稱。`, 'error');
      return;
    }

    setStoredProfile(account, nickname);
    accountInput.value = account;
    nicknameInput.value = nickname;
    setMessage('資料已儲存。', 'success');
    refreshUI();
    loadAllMyRecords();
  });

  editAccountBtn?.addEventListener('click', () => {
    const account = getStoredAccount();
    const nickname = getStoredNickname();
    accountInput.value = account;
    nicknameInput.value = nickname;
    clearStoredProfile();
    refreshUI();
    setMessage('請輸入新的帳號與暱稱後重新儲存。', 'warn');
    accountInput.focus();
    loadAllMyRecords();
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
      width: 132,
      height: 132,
      correctLevel: QRCode.CorrectLevel.M
    });
  }

  refreshUI();
  loadHomepageStats();
  loadAllMyRecords();
})();
