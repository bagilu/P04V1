window.APP_CONFIG = {
  SITE_URL: 'https://bagilu.github.io/P04V1/',
  EMAIL_DOMAIN: '@gms.tcu.edu.tw',
  NICKNAME_MAX_LENGTH: 20,
  STORAGE_KEY_ACCOUNT: 'p04_smile_account',
  STORAGE_KEY_NICKNAME: 'p04_smile_nickname',

  SUPABASE_URL: 'https://mfljkyvdadxlrbxlboce.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mbGpreXZkYWR4bHJieGxib2NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MTQwMDUsImV4cCI6MjA4MDM5MDAwNX0.Z4OeacVpO8yM1d1uOWZ6jU2Gl7wgEbhXvAFSqF5pBRs',

  // Dashboard Function URL 版：請把 YOUR-PROJECT 改成自己的 Project Ref。
  FUNCTIONS: {
    SUBMIT_SMILE_EVENT: 'https://mfljkyvdadxlrbxlboce.supabase.co/functions/v1/P04_submit_smile_event',
    GET_HOME_STATS: 'https://mfljkyvdadxlrbxlboce.supabase.co/functions/v1/P04_get_home_stats',
    GET_RECORDS_BY_DATE: 'https://mfljkyvdadxlrbxlboce.supabase.co/functions/v1/P04_get_records_by_date',
    GET_RECENT_NOTIFICATIONS: 'https://mfljkyvdadxlrbxlboce.supabase.co/functions/v1/P04_get_recent_notifications'
  },

  NOTIFICATION_POLL_MS: 5000
};
