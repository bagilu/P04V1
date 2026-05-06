# P04 V2.3 花束通知版變更摘要

## 新增
- 被掃描者端 QRCode 區域花束通知卡。
- 通知顯示時間設定：`NOTIFICATION_DISPLAY_MS`。
- 通知輪詢設定：`NOTIFICATION_POLL_MS` 預設 3000 ms。
- 通知查詢改用 `id` 遞增判斷，降低漏接機率。

## 更新
- `myqrcode.js`
- `styles.css`
- `supabase/functions/P04_get_recent_notifications/index.ts`
- `sql_setup.sql`
- `DEPLOY_STEPS.md`

## 不影響
- 不清空舊資料。
- 不改變資料表主結構。
- 不改變 P04_submit_smile_event 的送出流程。
