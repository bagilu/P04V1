# P04 V2.2 小寫資料表修正版

重要：本版已依照目前 Supabase 實際資料表名稱修正為 `tblp04smileevents` 與 `tblp04maillog`。請先閱讀 `DEPLOY_STEPS.md`。

# P04 微笑漣漪系統 v2.1

本版修正重點：

1. Function 採用老師熟悉的 Supabase Dashboard 建立方式。
2. 每支 Function 都有獨立資料夾與完整 `index.ts`，不依賴 `_shared`。
3. Function 名稱全部以 `P04_` 開頭。
4. 前端 `config.js` 改為直接填入 Function URL。
5. 資料表名稱統一使用目前正式表名：`tblp04smileevents`。
6. SQL 為非破壞性，不會清空舊資料。

---

## 一、需要建立的 Edge Functions

請到 Supabase Dashboard：

`Edge Functions` → `Deploy New Function`

逐一建立以下 Function，並貼上對應資料夾中的 `index.ts`。

| Function 名稱 | 來源檔案 | 功能 |
|---|---|---|
| `P04_submit_smile_event` | `supabase/functions/P04_submit_smile_event/index.ts` | 掃描者送出微笑／問候／鼓勵／幫助紀錄 |
| `P04_get_home_stats` | `supabase/functions/P04_get_home_stats/index.ts` | 首頁總數與排行榜 |
| `P04_get_records_by_date` | `supabase/functions/P04_get_records_by_date/index.ts` | 隱藏管理頁依日期查詢紀錄 |
| `P04_get_recent_notifications` | `supabase/functions/P04_get_recent_notifications/index.ts` | 被掃描者 QRCode 頁面顯示即時通知 |

---

## 二、必須設定 Secrets

Supabase Dashboard → Project Settings → Edge Functions / Secrets

至少需要：

```text
SUPABASE_SERVICE_ROLE_KEY=你的 service_role key
ADMIN_ACCESS_CODE=你的後台管理碼
```

其中 `SUPABASE_SERVICE_ROLE_KEY` 不可以放在前端，只能放在 Edge Function Secrets。

---

## 三、config.js 修改方式

請將 `YOUR-PROJECT` 改成您的 Supabase Project Ref，並填入 anon key。

```javascript
window.APP_CONFIG = {
  SUPABASE_URL: 'https://YOUR-PROJECT.supabase.co',
  SUPABASE_ANON_KEY: 'YOUR_SUPABASE_ANON_KEY',

  FUNCTIONS: {
    SUBMIT_SMILE_EVENT: 'https://YOUR-PROJECT.supabase.co/functions/v1/P04_submit_smile_event',
    GET_HOME_STATS: 'https://YOUR-PROJECT.supabase.co/functions/v1/P04_get_home_stats',
    GET_RECORDS_BY_DATE: 'https://YOUR-PROJECT.supabase.co/functions/v1/P04_get_records_by_date',
    GET_RECENT_NOTIFICATIONS: 'https://YOUR-PROJECT.supabase.co/functions/v1/P04_get_recent_notifications'
  }
};
```

---

## 四、SQL

請在 Supabase SQL Editor 執行：

```text
sql_setup.sql
```

這份 SQL 只會補欄位與索引，不會刪除資料。

---

## 五、若出現 Edge Function returned a non-2xx status code

請依序檢查：

1. `config.js` 的 Function URL 是否正確。
2. Function 名稱是否完全一致，例如 `P04_submit_smile_event`。
3. Secrets 是否已設定 `SUPABASE_SERVICE_ROLE_KEY`。
4. SQL 是否已執行，尤其是 `smiler_nickname`、`responder_nickname`、`event_date` 欄位。
5. Function Logs 中若出現 relation not found，通常是資料表名稱大小寫不一致；本版已統一使用 `tblp04smileevents`。


## P04 V2.3 更新紀錄：花束通知

- 被掃描者停留在 QRCode 頁面時，系統會每 3 秒透過 `P04_get_recent_notifications` 查詢是否有新紀錄。
- 若有新紀錄，QRCode 區域會暫時切換成花束通知卡。
- 通知文字來源為最新一筆 `tblp04smileevents`，以 `smiler_account` 判斷被掃描者，以 `responder_nickname` 顯示掃描者。
- 本版使用 `id` 作為通知遞增判斷，避免以時間比較造成漏接。
- Function 與資料表均維持 P04 命名與小寫資料表名稱：
  - Function: `P04_get_recent_notifications`
  - Table: `tblp04smileevents`
