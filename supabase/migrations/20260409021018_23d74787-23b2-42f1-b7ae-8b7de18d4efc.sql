CREATE OR REPLACE FUNCTION public.generate_license_key()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := 'ALPM-';
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