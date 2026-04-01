P04 微笑傳染系統
=================

檔案說明
--------
1. index.html       主畫面
2. myqrcode.html    顯示與更新自己的 QR Code
3. scan.html        掃描他人 QR Code 並送出紀錄
4. styles.css       版面樣式
5. config.js        系統設定與 Supabase 連線資訊
6. app.js           主畫面程式
7. myqrcode.js      QR Code 頁面程式
8. scan.js          掃描與送出程式

使用前請先修改 config.js
------------------------
請填入：
- SUPABASE_URL
- SUPABASE_ANON_KEY

範例：
window.APP_CONFIG = {
  EMAIL_DOMAIN: '@gms.tcu.edu.tw',
  STORAGE_KEY_EMAIL: 'p04_smile_email',
  SUPABASE_URL: 'https://xxxxx.supabase.co',
  SUPABASE_ANON_KEY: 'your-anon-key',
  TABLE_SMILE_EVENTS: 'TblP04SmileEvents'
};

注意事項
--------
1. 本系統使用 localStorage 記住使用者 Email。
2. 只接受 @gms.tcu.edu.tw 結尾的 Email。
3. QR Code 內容直接為 Email。
4. scan.html 使用手機相機功能，請在 HTTPS 環境下使用（例如 GitHub Pages）。
5. 若資料表中 event_date 沒有預設值，前端會自動送出今天日期。
6. 若資料表已設定 UNIQUE(smiler_email, responder_email, event_date)，同一天重複送出時會顯示「今天已經表達過」。

建議的 Supabase 設定
---------------------
若前端直接寫入資料表，請至少確認：
- 已啟用 RLS
- 允許 insert 到 TblP04SmileEvents
- 視需要限制 update/delete
