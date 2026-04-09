-- Update demo video titles
UPDATE public.demo_videos SET title = REPLACE(title, 'FX MinuteAlbum', 'Album Plus') WHERE title ILIKE '%FX MinuteAlbum%';
UPDATE public.demo_videos SET title = REPLACE(title, 'FXMinuteAlbum', 'Album Plus') WHERE title ILIKE '%FXMinuteAlbum%';

-- Update license key prefix
CREATE OR REPLACE FUNCTION public.generate_license_key()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := 'ALBM-';
  i INT;
  g INT;
BEGIN
  FOR g IN 1..3 LOOP
    FOR i IN 1..4 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    IF g < 3 THEN result := result || '-'; END IF;
  END LOOP;
  RETURN result;
END;
$$;