P04 微笑漣漪系統（Edge Function 版本）

本版本重點：
0. 管理查詢頁不再出現在主畫面連結中，改為隱藏網址入口。
1. 前端不再直接讀寫資料表。
2. 首頁統計、掃描送出、管理者日期查詢，全部改走 Supabase Edge Functions。
3. 建議將 public schema 相關資料表開啟 RLS，且不提供前端直接 policy。
4. submit-smile-event 會在後端自動查找 smiler_nickname，不再直接把 account 寫進 smiler_nickname。
5. admin.html 改成輸入「管理碼」後查詢；管理碼保存在 Edge Function secret，不寫在前端。

-----------------------------------
一、前端要設定的檔案
-----------------------------------
請修改 config.js：
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SITE_URL（若 GitHub Pages 網址有變）

-----------------------------------
二、Supabase 端要部署的內容
-----------------------------------
請把本 ZIP 中的 supabase 資料夾放到您的本機專案目錄。

建議流程：
1. 安裝 Supabase CLI
2. 登入：supabase login
3. 連結專案：supabase link --project-ref 您的 project ref
4. 設定 secret：
   supabase secrets set ADMIN_ACCESS_CODE=您自己設定的管理碼
5. 部署 functions：
   supabase functions deploy get-home-stats
   supabase functions deploy submit-smile-event
   supabase functions deploy get-records-by-date

-----------------------------------
三、資料庫安全建議
-----------------------------------
請在 SQL Editor 執行 sql_setup.sql。
這個檔案會：
- 對 tblp04smileevents 開啟 RLS
- 對 tblp04maillog 開啟 RLS
- 不開放 anon / authenticated 直接存取資料表
- 保留 Edge Function 使用 service_role 存取

-----------------------------------
四、admin.html 使用方式
-----------------------------------
1. 直接輸入您自己知道的隱藏網址 hidden-records-portal.html
2. 輸入 ADMIN_ACCESS_CODE 對應的管理密碼
3. 選擇日期
4. 按「查詢紀錄」

-----------------------------------
五、注意事項
-----------------------------------
1. Edge Function 若尚未部署成功，瀏覽器可能只看到 Failed to send a request to the Edge Function。
2. 若 function 名稱打錯、未部署、或 CORS 設定不正確，都可能導致前端失敗。
3. 如果前端改版後沒生效，請 Ctrl+F5 強制重新整理。
