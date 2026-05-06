# P04 V2.3 花束通知版部署步驟

本版目的：
當「掃描者」掃描並送出紀錄後，「被掃描者」停留在自己的 QRCode 畫面時，QRCode 區域會暫時顯示一張花束通知卡，例如：

> 剛剛 XXX 記錄了你對他的問候  
> 謝謝你把善意傳出去

數秒後 QRCode 會自動恢復。

---

## 1. 先執行 SQL

Supabase Dashboard → SQL Editor → New Query

執行：

```sql
-- P04 V2.3：通知查詢加速索引，不刪除、不覆蓋既有資料
CREATE INDEX IF NOT EXISTS idx_p04_smiler_id_desc
ON public.tblp04smileevents(smiler_account, id DESC);
```

若您已經執行完整 `sql_setup.sql`，也可以直接執行 ZIP 內完整版本。

---

## 2. 更新 Edge Function

這一版主要必須更新：

```text
P04_get_recent_notifications
```

Supabase Dashboard → Edge Functions → P04_get_recent_notifications → Edit / Update Function

將以下檔案完整貼上：

```text
supabase/functions/P04_get_recent_notifications/index.ts
```

然後 Deploy。

其他 Function 若已經是 V2.2 且正常運作，可以不用重貼。

---

## 3. 更新 config.js

確認 `config.js` 有以下設定：

```javascript
NOTIFICATION_POLL_MS: 3000,
NOTIFICATION_DISPLAY_MS: 8000,
```

並確認 Function URL：

```javascript
GET_RECENT_NOTIFICATIONS:
  "https://您的PROJECT_REF.supabase.co/functions/v1/P04_get_recent_notifications"
```

---

## 4. 覆蓋 GitHub Pages 前端

請覆蓋這些前端檔案：

```text
myqrcode.js
styles.css
config.js
```

若您習慣整包覆蓋，也可以覆蓋全部前端檔案。

---

## 5. 測試方式

1. A 使用者打開自己的 QRCode 頁面，不要離開。
2. B 使用者掃描 A 的 QRCode。
3. B 送出「微笑 / 問候 / 鼓勵 / 幫助」。
4. A 的 QRCode 區域應在約 3 秒內變成花束訊息卡。
5. 約 8 秒後，A 的 QRCode 自動恢復。

---

## 6. 若沒有出現通知

請依序檢查：

1. `P04_get_recent_notifications` 是否已重新 Deploy。
2. `config.js` 的 `GET_RECENT_NOTIFICATIONS` URL 是否正確。
3. A 是否停留在 `myqrcode.html`。
4. 瀏覽器是否有快取舊版 `myqrcode.js`，可按 Ctrl + F5 強制重新整理。
5. Supabase Edge Function Logs 是否有錯誤訊息。

---

## 7. 本版不會做的事

本版不會刪除任何舊資料。  
本版不會改變既有打卡/送出紀錄邏輯。  
本版只強化「被掃描者端收到通知」的前端顯示與通知查詢 Function。
