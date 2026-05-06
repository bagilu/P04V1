# P04 微笑漣漪系統 V2.2 部署步驟

本版是「小寫資料表修正版」，已依照目前 Supabase 實際資料表名稱調整：

- `public.tblp04smileevents`
- `public.tblp04maillog`

請依照以下順序更新。

---

## 1. 先執行 SQL

到 Supabase：

`SQL Editor → New Query`

打開 ZIP 內的：

`sql_setup.sql`

全部貼上並執行。

這份 SQL 是非破壞性更新：

- 不刪除舊資料
- 不清空資料表
- 只補欄位、補索引、補空白日期

---

## 2. 更新 Edge Functions

到 Supabase：

`Edge Functions → Deploy New Function`

如果同名 Function 已存在，請進入該 Function 後更新 `index.ts` 內容再 Deploy。

請逐一更新以下四支：

### A. P04_submit_smile_event

貼上：

`supabase/functions/P04_submit_smile_event/index.ts`

用途：掃描者送出微笑／問候／鼓勵／幫助紀錄。

### B. P04_get_home_stats

貼上：

`supabase/functions/P04_get_home_stats/index.ts`

用途：首頁統計、微笑王、回應王排行榜。

### C. P04_get_records_by_date

貼上：

`supabase/functions/P04_get_records_by_date/index.ts`

用途：隱藏管理頁依日期查詢紀錄。

### D. P04_get_recent_notifications

貼上：

`supabase/functions/P04_get_recent_notifications/index.ts`

用途：QRCode 頁面輪詢最新通知，顯示「某某人剛剛送出紀錄」。

---

## 3. 確認 Edge Function Secrets

到 Supabase：

`Edge Functions → Secrets`

至少需要：

```text
SUPABASE_SERVICE_ROLE_KEY
ADMIN_ACCESS_CODE
```

`SUPABASE_SERVICE_ROLE_KEY` 請使用 Project Settings → API 裡的 service_role key，不是 anon key。

---

## 4. 修改 config.js

請依照 `config.example.js` 修改正式 `config.js`。

至少要確認：

```javascript
FUNCTIONS: {
  SUBMIT_SMILE_EVENT: 'https://YOUR-PROJECT.supabase.co/functions/v1/P04_submit_smile_event',
  GET_HOME_STATS: 'https://YOUR-PROJECT.supabase.co/functions/v1/P04_get_home_stats',
  GET_RECORDS_BY_DATE: 'https://YOUR-PROJECT.supabase.co/functions/v1/P04_get_records_by_date',
  GET_RECENT_NOTIFICATIONS: 'https://YOUR-PROJECT.supabase.co/functions/v1/P04_get_recent_notifications'
}
```

若 GitHub Pages 網址不同，也請修改：

```javascript
SITE_URL: 'https://你的帳號.github.io/你的repo/'
```

---

## 5. 覆蓋 GitHub Pages 檔案

將 ZIP 內前端檔案覆蓋到 GitHub repository。

常見需要覆蓋：

```text
index.html
myqrcode.html
scan.html
hidden-records-portal.html
app.js
myqrcode.js
scan.js
hidden_records_console.js
styles.css
config.js
```

然後 commit / push。

---

## 6. 測試順序

### A. 首頁測試

打開首頁，確認：

- 統計數字正常
- 排行榜正常
- Console 沒有紅色錯誤

### B. QRCode 測試

用 A 掃 B 的 QRCode，送出一筆紀錄。

成功時不應再出現：

```text
Edge Function returned a non-2xx status code
```

### C. 通知測試

回到 B 的 QRCode 頁面，應能看到類似：

```text
某某人剛剛送出紀錄，謝謝你的微笑。
```

---

## 7. 若仍有錯誤

請優先檢查：

1. Function 裡是否都使用 `tblp04smileevents`
2. `config.js` 的 Function URL 是否正確
3. `SUPABASE_SERVICE_ROLE_KEY` 是否已設定
4. Function Logs 內的錯誤訊息

本版已修正 v2.1 的主要錯誤：舊版使用 `TblP04SmileEvents`，但您的 Supabase 實際資料表是全小寫 `tblp04smileevents`。
