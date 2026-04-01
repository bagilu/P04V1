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

  function buildRanking(rows, rolePrefix) {
    const counter = new Map();
    const latestNicknameByAccount = new Map();
    const latestTimeByAccount = new Map();

    rows.forEach((row) => {
      const account = normalizeAccount(row[`${rolePrefix}_account`]);
      const nickname = normalizeNickname(row[`${rolePrefix}_nickname`]);
      const createdAt = row.created_at || '';
      if (!account) return;

      counter.set(account, (counter.get(account) || 0) + 1);

      const existingTime = latestTimeByAccount.get(account) || '';
      if (!existingTime || createdAt >= existingTime) {
        latestTimeByAccount.set(account, createdAt);
        latestNicknameByAccount.set(account, nickname || account);
      }
    });

    return Array.from(counter.entries())
      .map(([account, count]) => ({
        account,
        nickname: latestNicknameByAccount.get(account) || account,
        count
      }))
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return a.account.localeCompare(b.account, 'zh-Hant');
      })
      .slice(0, 10);
  }

  async function loadHomepageStats() {
    if (!ensureConfigAvailable()) {
      totalSmileCount.textContent = '--';
      renderPlaceholder(smilerRankingList, '請先設定 Supabase');
      renderPlaceholder(responderRankingList, '請先設定 Supabase');
      return;
    }

    const supabase = window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);

    const { count, error: countError } = await supabase
      .from(config.TABLE_SMILE_EVENTS)
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error(countError);
      totalSmileCount.textContent = '--';
      renderPlaceholder(smilerRankingList, '讀取失敗');
      renderPlaceholder(responderRankingList, '讀取失敗');
      return;
    }

    totalSmileCount.textContent = count ?? 0;

    const { data: rows, error: rowsError } = await supabase
      .from(config.TABLE_SMILE_EVENTS)
      .select('smiler_account, smiler_nickname, responder_account, responder_nickname, created_at')
      .order('created_at', { ascending: false })
      .limit(5000);

    if (rowsError) {
      console.error(rowsError);
      renderPlaceholder(smilerRankingList, '讀取失敗');
      renderPlaceholder(responderRankingList, '讀取失敗');
      return;
    }

    renderRanking(smilerRankingList, buildRanking(rows || [], 'smiler'));
    renderRanking(responderRankingList, buildRanking(rows || [], 'responder'));
  }

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
})();
