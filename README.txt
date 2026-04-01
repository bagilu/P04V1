P04 微笑傳染系統（account 版）

1. 請先在 config.js 填入正確的 SUPABASE_URL 與 SUPABASE_ANON_KEY。
2. 本版本採用 account-only 模式：
   - 前端只輸入 @ 前面的帳號
   - localStorage 只記錄帳號
   - QRCode 內容只放帳號
   - 資料庫欄位使用 smiler_account / responder_account / target_account
3. 首頁右上角已加入系統入口 QRCode，內容固定為：
   https://bagilu.github.io/P04V1/
4. 若改動 JS 後未生效，請在瀏覽器執行 Ctrl+F5 強制重新整理。
5. 若 Supabase 建表後 API 尚未更新，可在 SQL Editor 執行：
   NOTIFY pgrst, 'reload schema';
