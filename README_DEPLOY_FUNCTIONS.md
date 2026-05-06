
# P04 微笑漣漪系統（Dashboard Function Version）

本版本採用：
- Supabase Dashboard → Edge Functions → Deploy New Function
- 每支 Function 個別建立
- 前端 config.js 管理 Function URL

## Functions

1. P04_submit_smile_event
2. P04_get_home_stats
3. P04_get_records_by_date
4. P04_get_recent_notice

## 建立方式

Supabase Dashboard:
Edge Functions → Deploy New Function

將對應 index.ts 內容貼入即可。

## config.js

請修改：

window.APP_CONFIG = {
  SUPABASE_URL: "...",
  SUPABASE_ANON_KEY: "...",

  FUNCTIONS: {
    SUBMIT_SMILE_EVENT: "...",
    GET_HOME_STATS: "...",
    GET_RECORDS_BY_DATE: "...",
    GET_RECENT_NOTICE: "..."
  }
};

