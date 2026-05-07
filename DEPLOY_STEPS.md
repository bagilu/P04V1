# P04 V2.8 完整版部署步驟

本版不是補丁包，而是完整 ZIP。ZIP 最外層資料夾為：

```text
P04V2_8_full_gamified_apple_my_records/
```

本版新增主畫面下方兩個表格：

1. 我的微笑紀錄：別人記錄了我對他的微笑、問候或鼓勵。
2. 我的回應紀錄：我記錄了別人給我的微笑、問候或鼓勵。

每頁 10 筆，支援上一頁 / 下一頁。

---

## 1. 執行 SQL

Supabase Dashboard → SQL Editor → New Query

執行：

```text
sql_setup.sql
```

此 SQL 不會刪除舊資料，只會補欄位與索引。

---

## 2. 建立或更新 Edge Functions

Supabase Dashboard → Edge Functions

請確認以下 Function 都存在且為本 ZIP 內版本：

```text
P04_submit_smile_event
P04_get_home_stats
P04_get_records_by_date
P04_get_recent_notice
P04_get_my_records
```

其中新增的是：

```text
P04_get_my_records
```

更新方式：

1. 點選 Deploy New Function 或進入既有 Function。
2. Function name 輸入上方名稱。
3. 貼上對應資料夾內的 `index.ts`。
4. Deploy。

對應位置：

```text
supabase/functions/P04_submit_smile_event/index.ts
supabase/functions/P04_get_home_stats/index.ts
supabase/functions/P04_get_records_by_date/index.ts
supabase/functions/P04_get_recent_notice/index.ts
supabase/functions/P04_get_my_records/index.ts
```

---

## 3. 確認 Edge Function Secrets

Supabase Dashboard → Edge Functions → Secrets

至少需要：

```text
SUPABASE_SERVICE_ROLE_KEY
```

若管理頁有使用密碼，也保留：

```text
ADMIN_ACCESS_CODE
```

---

## 4. 修改 config.js

請不要直接覆蓋您已經設定好的 `config.js`，除非您願意重新填入 Supabase URL。

請確認 `FUNCTIONS` 裡面包含：

```javascript
GET_MY_RECORDS:
  'https://YOUR-PROJECT.supabase.co/functions/v1/P04_get_my_records'
```

並確認通知 Function 名稱是：

```javascript
GET_RECENT_NOTICE:
  'https://YOUR-PROJECT.supabase.co/functions/v1/P04_get_recent_notice'
```

不是 `GET_RECENT_NOTIFICATIONS`。

---

## 5. 覆蓋 GitHub Pages 前端

請將本資料夾內前端檔案上傳或覆蓋到 GitHub Pages repository：

```text
index.html
app.js
styles.css
myqrcode.html
myqrcode.js
scan.html
scan.js
hidden-records-portal.html
hidden_records_console.js
admin.html
```

`config.js` 請小心：若您原本已填好 Supabase URL 與 anon key，建議只手動補上 `GET_MY_RECORDS`，不要整個覆蓋。

---

## 6. 測試順序

1. 開啟主畫面。
2. 確認前 10 名微笑王、前 10 名回應王正常。
3. 往下看是否出現：
   - 我的微笑紀錄
   - 我的回應紀錄
4. 每個表格應每頁最多 10 筆。
5. 測試上一頁 / 下一頁。
6. 若尚未輸入帳號，表格會提示請先儲存帳號。

---

## 7. 若看不到新表格

請檢查：

1. GitHub Pages 是否已更新到新版 `index.html`。
2. 瀏覽器是否快取舊版，請按 Ctrl + F5。
3. `config.js` 是否有 `GET_MY_RECORDS`。
4. Supabase 是否已部署 `P04_get_my_records`。
5. Edge Function Logs 是否有錯誤。
