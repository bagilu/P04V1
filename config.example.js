window.APP_CONFIG = {
  SITE_URL: 'https://bagilu.github.io/P04V1/',
  EMAIL_DOMAIN: '@gms.tcu.edu.tw',
  NICKNAME_MAX_LENGTH: 20,
  STORAGE_KEY_ACCOUNT: 'p04_smile_account',
  STORAGE_KEY_NICKNAME: 'p04_smile_nickname',

  SUPABASE_URL: 'https://YOUR-PROJECT.supabase.co',
  SUPABASE_ANON_KEY: 'YOUR_SUPABASE_ANON_KEY',

  // Dashboard Function URL 版：請把 YOUR-PROJECT 改成自己的 Project Ref。
  FUNCTIONS: {
    SUBMIT_SMILE_EVENT: 'https://YOUR-PROJECT.supabase.co/functions/v1/P04_submit_smile_event',
    GET_HOME_STATS: 'https://YOUR-PROJECT.supabase.co/functions/v1/P04_get_home_stats',
    GET_RECORDS_BY_DATE: 'https://YOUR-PROJECT.supabase.co/functions/v1/P04_get_records_by_date',
    GET_RECENT_NOTICE: 'https://YOUR-PROJECT.supabase.co/functions/v1/P04_get_recent_notice',
    GET_MY_RECORDS: 'https://YOUR-PROJECT.supabase.co/functions/v1/P04_get_my_records'
  },

  NOTIFICATION_POLL_MS: 3000,
  NOTIFICATION_DISPLAY_MS: 8000
};
