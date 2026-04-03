P04 微笑漣漪系統（Email QR 穩定版）

1. 請先在 config.js 填入正確的 SUPABASE_URL 與 SUPABASE_ANON_KEY。
2. 本版本採用：
   - 前端只輸入 @ 前面的帳號
   - localStorage 記錄帳號與暱稱
   - 我的 QRCode 內容固定為：account@gms.tcu.edu.tw
   - 掃描器會自動把完整 Email 去掉 @gms.tcu.edu.tw，轉成 account
   - 資料庫只存 account
3. 目前資料庫欄位應使用：
   - smiler_account
   - smiler_nickname
   - responder_account
   - responder_nickname
   - smile_type
   - event_date
   - created_at
4. 首頁新增：
   - 系統累計微笑次數
   - 前 10 名微笑王
   - 前 10 名回應王
   排行榜以 account 統計，顯示該 account 最新一次出現的暱稱。
5. 排行榜已改成較淺的顏色，避免與主按鈕混淆。
6. 若改動 JS 後未生效，請在瀏覽器執行 Ctrl+F5 強制重新整理。
7. 若 Supabase 建表後 API 尚未更新，可在 SQL Editor 執行：
   NOTIFY pgrst, 'reload schema';
