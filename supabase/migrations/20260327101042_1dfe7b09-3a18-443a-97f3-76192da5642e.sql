
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS studio_name text DEFAULT '',
  ADD COLUMN IF NOT EXISTS city text DEFAULT '',
  ADD COLUMN IF NOT EXISTS state text DEFAULT '',
  ADD COLUMN IF NOT EXISTS country text DEFAULT 'India',
  ADD COLUMN IF NOT EXISTS languages text[] DEFAULT '{}';

-- Update handle_new_user trigger to include new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, phone, studio_name, city, state, country, languages)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'studio_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'city', ''),
    COALESCE(NEW.raw_user_meta_data->>'state', ''),
    COALESCE(NEW.raw_user_meta_data->>'country', 'India'),
    CASE 
      WHEN NEW.raw_user_meta_data->'languages' IS NOT NULL 
      THEN ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'languages'))
      ELSE '{}'::text[]
    END
  );
  RETURN NEW;
END;
$function$;
