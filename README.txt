P04 微笑漣漪系統（暱稱排行榜版）

1. 請先在 config.js 填入正確的 SUPABASE_URL 與 SUPABASE_ANON_KEY。
2. 本版本採用 account-only 模式：
   - 前端只輸入 @ 前面的帳號
   - localStorage 會記錄帳號與暱稱
   - QRCode 內容包含 account 與 nickname
   - 資料庫欄位使用 smiler_account / smiler_nickname / responder_account / responder_nickname / smile_type / event_date
3. 首頁右上角已加入系統入口 QRCode，內容固定為：
   https://bagilu.github.io/P04V1/
4. 首頁新增：
   - 系統累計微笑次數
   - 前 10 名微笑王
   - 前 10 名回應王
   排行榜以 account 統計，顯示該 account 最新一次出現的暱稱。
5. 若改動 JS 後未生效，請在瀏覽器執行 Ctrl+F5 強制重新整理。
6. 若 Supabase 建表後 API 尚未更新，可在 SQL Editor 執行：
   NOTIFY pgrst, 'reload schema';
