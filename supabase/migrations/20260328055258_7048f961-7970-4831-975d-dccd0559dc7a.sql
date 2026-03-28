CREATE OR REPLACE FUNCTION public.generate_license_key()
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := 'FXMA-';
  i INT;
  g INT;
BEGIN
  FOR g IN 1..3 LOOP
    IF g > 1 THEN result := result || '-'; END IF;
    FOR i IN 1..4 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
  END LOOP;
  RETURN result;
END;
$function$;