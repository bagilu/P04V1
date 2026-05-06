
-- 非破壞性 SQL
ALTER TABLE IF EXISTS "TblP04SmileEvents"
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_p04_created_at
ON "TblP04SmileEvents"(created_at);
