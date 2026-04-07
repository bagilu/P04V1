(function () {
  const config = window.APP_CONFIG;
  const queryDateInput = document.getElementById('queryDateInput');
  const loadRecordsBtn = document.getElementById('loadRecordsBtn');
  const adminStatusMessage = document.getElementById('adminStatusMessage');
  const dailyCount = document.getElementById('dailyCount');
  const recordsTableBody = document.getElementById('recordsTableBody');

  function normalizeAccount(value) {
    return (value || '').trim().toLowerCase();
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function setMessage(message, type = '') {
    adminStatusMessage.textContent = message;
    adminStatusMessage.className = 'status-message';
    if (type) adminStatusMessage.classList.add(type);
  }

  function ensureConfigAvailable() {
    return Boolean(
      config.SUPABASE_URL &&
      !config.SUPABASE_URL.includes('YOUR-PROJECT') &&
      config.SUPABASE_ANON_KEY &&
      !config.SUPABASE_ANON_KEY.includes('YOUR_SUPABASE_ANON_KEY')
    );
  }

  function getStoredAccount() {
    return normalizeAccount(localStorage.getItem(config.STORAGE_KEY_ACCOUNT));
  }

  function isAdminAccount(account) {
    const allowlist = Array.isArray(config.ADMIN_ACCOUNTS) ? config.ADMIN_ACCOUNTS : [];
    return allowlist.map(normalizeAccount).includes(normalizeAccount(account));
  }

  function renderPlaceholder(text) {
    recordsTableBody.innerHTML = `<tr><td colspan="7" class="table-placeholder">${escapeHtml(text)}</td></tr>`;
  }

  function formatTime(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mi = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
  }

  function renderRows(rows) {
    if (!rows.length) {
      renderPlaceholder('該日期目前沒有紀錄');
      return;
    }

    recordsTableBody.innerHTML = rows.map((row) => `
      <tr>
        <td>${escapeHtml(formatTime(row.created_at))}</td>
        <td>${escapeHtml(row.responder_account)}</td>
        <td>${escapeHtml(row.responder_nickname)}</td>
        <td>${escapeHtml(row.smiler_account)}</td>
        <td>${escapeHtml(row.smiler_nickname)}</td>
        <td>${escapeHtml(row.smile_type)}</td>
        <td>${escapeHtml(row.event_date)}</td>
      </tr>
    `).join('');
  }

  async function loadRecordsByDate() {
    const dateValue = (queryDateInput.value || '').trim();
    if (!dateValue) {
      setMessage('請先選擇日期。', 'error');
      renderPlaceholder('請先選擇日期');
      dailyCount.textContent = '0';
      return;
    }

    if (!ensureConfigAvailable()) {
      setMessage('請先在 config.js 填入正確的 Supabase URL 與 Anon Key。', 'error');
      return;
    }

    setMessage('讀取中，請稍候。', 'warn');
    renderPlaceholder('讀取中…');

    const supabase = window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
    const { data, error } = await supabase
      .from(config.TABLE_SMILE_EVENTS)
      .select('smiler_account, smiler_nickname, responder_account, responder_nickname, smile_type, event_date, created_at')
      .eq('event_date', dateValue)
      .order('created_at', { ascending: false })
      .limit(5000);

    if (error) {
      console.error(error);
      setMessage(`讀取失敗：${error.message}`, 'error');
      renderPlaceholder('讀取失敗');
      dailyCount.textContent = '0';
      return;
    }

    const rows = data || [];
    dailyCount.textContent = String(rows.length);
    renderRows(rows);
    setMessage(`已讀取 ${rows.length} 筆紀錄。`, 'success');
  }

  function init() {
    const myAccount = getStoredAccount();
    if (!isAdminAccount(myAccount)) {
      setMessage('目前登入帳號不在管理者白名單中，無法查看本頁。請先在 config.js 設定 ADMIN_ACCOUNTS。', 'error');
      queryDateInput.disabled = true;
      loadRecordsBtn.disabled = true;
      renderPlaceholder('無權限查看');
      return;
    }

    const today = new Date();
    const todayText = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    queryDateInput.value = todayText;
    setMessage(`目前管理者帳號：${myAccount}`, 'success');
    loadRecordsByDate();
  }

  loadRecordsBtn?.addEventListener('click', loadRecordsByDate);
  queryDateInput?.addEventListener('change', loadRecordsByDate);

  init();
})();
