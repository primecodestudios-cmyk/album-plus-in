ALTER TABLE public.pricing_plans 
ADD COLUMN IF NOT EXISTS max_pcs integer NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS data_pack text NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS duration_type text NOT NULL DEFAULT 'days';