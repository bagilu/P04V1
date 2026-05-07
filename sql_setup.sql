-- P04 V2.8 非破壞性 SQL
-- 不刪除、不覆蓋既有資料，只補必要欄位與索引。

ALTER TABLE public.tblp04smileevents
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

ALTER TABLE public.tblp04smileevents
ADD COLUMN IF NOT EXISTS smiler_nickname TEXT;

ALTER TABLE public.tblp04smileevents
ADD COLUMN IF NOT EXISTS responder_nickname TEXT;

CREATE INDEX IF NOT EXISTS idx_p04_created_at
ON public.tblp04smileevents(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_p04_smiler_created_at_desc
ON public.tblp04smileevents(smiler_account, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_p04_responder_created_at_desc
ON public.tblp04smileevents(responder_account, created_at DESC);

UPDATE public.tblp04smileevents
SET created_at = NOW()
WHERE created_at IS NULL;
