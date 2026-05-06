# P04 微笑漣漪系統 README_SYSTEM

版本：P04 v2.0 function-prefix + compact UI + live notice

## 1. 專案定位

本系統為「慈濟大學微笑漣漪系統（經營管理學系學生專題） / TCU Smile ripple system」。使用者先在前端輸入校園帳號與暱稱，顯示個人 QRCode；另一位使用者掃描後，選擇「微笑、問候、鼓勵、幫助」等類型並送出紀錄。

## 2. 本版更新重點

1. 所有資料庫讀寫改由 Supabase Edge Functions 處理，前端不直接 select/insert 資料表。
2. Function 名稱全部以 `P04_` 開頭，方便在多專案 Supabase 環境中辨識。
3. 網頁風格調整為較緊湊版，字體以清晰、易讀為主。
4. 新增被掃描者通知：當 A 顯示自己的 QRCode，B 掃描並送出後，A 的 QRCode 頁面會輪詢 Function，顯示「某某人剛剛送出紀錄。謝謝你的微笑／問候／鼓勵／幫助。」
5. SQL 採非破壞性設計，只補欄位、索引與 RLS，不會刪除或覆蓋舊資料。

## 3. 資料表假設

本版 Function 預設資料表名稱為小寫：

- `public.tblp04smileevents`
- `public.tblp04maillog`

`tblp04smileevents` 至少需要下列欄位：

- `smiler_account`
- `responder_account`
- `smile_type`
- `event_date`
- `created_at`
- `smiler_nickname`
- `responder_nickname`

若既有資料表是 `TblP04SmileEvents` 這種大小寫混合名稱，請先在 Supabase 確認實際名稱，並同步調整 Function 中 `.from('tblp04smileevents')` 的表名。

## 4. Edge Functions

本版包含四支 Function：

1. `P04_get_home_stats`  
   首頁統計：累計次數、微笑王排行榜、回應王排行榜。

2. `P04_submit_smile_event`  
   掃描者送出紀錄。會驗證帳號、暱稱、類型；不允許自己對自己送出；使用 service_role 寫入資料表。

3. `P04_get_records_by_date`  
   隱藏管理頁按日期查詢紀錄。需使用 `ADMIN_ACCESS_CODE`。

4. `P04_get_recent_notifications`  
   QRCode 頁面輪詢使用。依 `smiler_account` 與 `since` 查詢剛剛收到的新紀錄。

## 5. 部署步驟

### 5.1 執行 SQL

在 Supabase SQL Editor 執行：

```sql
-- 開啟 sql_setup.sql，整段執行
```

此 SQL 不會清空資料，只會補欄位、補索引、更新 RLS policy。

### 5.2 設定 secrets

至少需要：

```bash
npx supabase secrets set SUPABASE_URL="https://你的專案.supabase.co"
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY="你的 service_role key"
npx supabase secrets set ADMIN_ACCESS_CODE="你的管理密碼"
```

### 5.3 部署 Functions

```bash
npx supabase functions deploy P04_get_home_stats --no-verify-jwt
npx supabase functions deploy P04_submit_smile_event --no-verify-jwt
npx supabase functions deploy P04_get_records_by_date --no-verify-jwt
npx supabase functions deploy P04_get_recent_notifications --no-verify-jwt
```

### 5.4 修改前端 config.js

請修改：

```js
SUPABASE_URL: 'https://YOUR-PROJECT.supabase.co',
SUPABASE_ANON_KEY: 'YOUR_SUPABASE_ANON_KEY',
SITE_URL: 'https://bagilu.github.io/P04V1/'
```

Function 名稱已預設為：

```js
FUNCTION_HOME_STATS: 'P04_get_home_stats',
FUNCTION_SUBMIT_EVENT: 'P04_submit_smile_event',
FUNCTION_RECORDS_BY_DATE: 'P04_get_records_by_date',
FUNCTION_RECENT_NOTIFICATIONS: 'P04_get_recent_notifications'
```

## 6. 前端檔案

- `index.html` / `app.js`：主畫面、帳號暱稱設定、首頁統計與排行榜。
- `myqrcode.html` / `myqrcode.js`：顯示個人 QRCode，並輪詢最新收到的紀錄。
- `scan.html` / `scan.js`：掃描他人 QRCode 並送出紀錄。
- `hidden-records-portal.html` / `hidden_records_console.js`：隱藏管理查詢頁。
- `styles.css`：緊湊版視覺風格。
- `config.js`：站台、Supabase 與 Function 名稱設定。
- `sql_setup.sql`：非破壞性資料庫更新。

## 7. 安全設計原則

1. 前端只保存 Supabase anon key，不保存 service_role key。
2. service_role key 只放在 Supabase Edge Function secrets。
3. 前端不直接讀寫資料表；資料庫操作集中在 `P04_` Functions。
4. 管理查詢頁不公開在主畫面，且需 `ADMIN_ACCESS_CODE`。
5. RLS 設定為 anon/authenticated 直接表格操作全部拒絕。

## 8. 新增通知功能的限制

目前採「輪詢」設計，不使用 Supabase Realtime，因此部署較簡單，也符合「資料庫存取皆透過 Function」原則。預設每 5 秒查詢一次，可在 `config.js` 的 `NOTIFICATION_POLL_MS` 調整。若未來需要更即時，可再設計以 Function 為中介的 Realtime 或 channel-based 方案。
