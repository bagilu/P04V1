(function () {
  const config = window.APP_CONFIG;
  const adminCodeInput = document.getElementById('adminCodeInput');
  const recordDateInput = document.getElementById('recordDateInput');
  const loadRecordsBtn = document.getElementById('loadRecordsBtn');
  const adminMessage = document.getElementById('adminMessage');
  const recordsSummary = document.getElementById('recordsSummary');
  const recordsTableBody = document.getElementById('recordsTableBody');

  function setMessage(message, type = '') {
    adminMessage.textContent = message;
    adminMessage.className = 'status-message';
    if (type) adminMessage.classList.add(type);
  }

  function ensureConfig() {
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

  function smileTypeLabel(type) {
    switch (Number(type)) {
      case 1: return '他對我微笑';
      case 2: return '他和我打招呼';
      case 3: return '他鼓勵我';
      case 4: return '他幫助我';
      default: return String(type || '');
    }
  }

  function renderRows(rows) {
    if (!rows.length) {
      recordsTableBody.innerHTML = '<tr><td colspan="7" class="table-placeholder">此日期沒有資料</td></tr>';
      return;
    }

    recordsTableBody.innerHTML = rows.map((row) => `
      <tr>
        <td>${row.created_at || ''}</td>
        <td>${row.event_date || ''}</td>
        <td>${row.smiler_account || ''}</td>
        <td>${row.smiler_nickname || ''}</td>
        <td>${row.responder_account || ''}</td>
        <td>${row.responder_nickname || ''}</td>
        <td>${smileTypeLabel(row.smile_type)}</td>
      </tr>
    `).join('');
  }

  async function loadRecords() {
    if (!ensureConfig()) {
      setMessage('請先在 config.js 設定正確的 Supabase 參數。', 'error');
      return;
    }

    const adminCode = (adminCodeInput.value || '').trim();
    const eventDate = (recordDateInput.value || '').trim();

    if (!adminCode) {
      setMessage('請先輸入管理碼。', 'error');
      return;
    }

    if (!eventDate) {
      setMessage('請先選擇日期。', 'error');
      return;
    }

    loadRecordsBtn.disabled = true;
    setMessage('查詢中，請稍候。', 'warn');

    const supabase = createClient();
    const { data, error } = await supabase.functions.invoke(config.FUNCTION_RECORDS_BY_DATE, {
      body: { event_date: eventDate },
      headers: {
        'x-admin-code': adminCode
      }
    });

    loadRecordsBtn.disabled = false;

    if (error || !data?.success) {
      console.error(error || data);
      recordsSummary.textContent = '查詢失敗';
      recordsTableBody.innerHTML = '<tr><td colspan="7" class="table-placeholder">查詢失敗</td></tr>';
      setMessage(data?.message || error?.message || '查詢失敗。', 'error');
      return;
    }

    const rows = data.rows || [];
    recordsSummary.textContent = `${eventDate} 共 ${rows.length} 筆資料`;
    renderRows(rows);
    setMessage('查詢完成。', 'success');
  }

  const today = new Date();
  const defaultDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  recordDateInput.value = defaultDate;

  loadRecordsBtn?.addEventListener('click', loadRecords);
})();
