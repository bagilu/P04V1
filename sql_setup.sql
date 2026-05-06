-- P04 微笑漣漪系統 v2.2：小寫資料表修正版（非破壞性 SQL）
-- 目前 Supabase 實際表名：public.tblp04smileevents、public.tblp04maillog
-- 本 SQL 不刪除、不清空、不覆蓋既有資料。

-- 1. 若資料表已存在，補齊新版需要欄位。
alter table if exists public.tblp04smileevents
  add column if not exists smiler_nickname text,
  add column if not exists responder_nickname text,
  add column if not exists created_at timestamptz default now(),
  add column if not exists event_date date;

-- 2. 若舊資料 created_at 為空，補現在時間。
update public.tblp04smileevents
set created_at = now()
where created_at is null;

-- 3. 若 event_date 有空值，用 created_at 的台北日期補上。
update public.tblp04smileevents
set event_date = (created_at at time zone 'Asia/Taipei')::date
where event_date is null;

-- 4. 索引：供首頁統計、日期查詢、QRCode 頁面通知輪詢使用。
create index if not exists idx_p04_smileevents_created_at
  on public.tblp04smileevents (created_at desc);

create index if not exists idx_p04_smileevents_event_date
  on public.tblp04smileevents (event_date);

create index if not exists idx_p04_smileevents_smiler_created_at
  on public.tblp04smileevents (smiler_account, created_at desc);

create index if not exists idx_p04_smileevents_responder_created_at
  on public.tblp04smileevents (responder_account, created_at desc);

-- 5. 安全原則：前端不直接操作資料表；資料庫操作由 P04_ Edge Functions 以 service_role 執行。
alter table if exists public.tblp04smileevents enable row level security;

notify pgrst, 'reload schema';
