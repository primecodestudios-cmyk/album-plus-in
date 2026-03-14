-- Add license_key and device_id columns
ALTER TABLE public.user_licenses
  ADD COLUMN license_key TEXT UNIQUE DEFAULT NULL,
  ADD COLUMN device_id TEXT DEFAULT NULL,
  ADD COLUMN max_devices INTEGER NOT NULL DEFAULT 1;

-- Function to generate a unique license key (format: ALBM-XXXX-XXXX-XXXX)
CREATE OR REPLACE FUNCTION public.generate_license_key()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := 'ALBM-';
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
$$;

-- Auto-generate license key on insert if not provided
CREATE OR REPLACE FUNCTION public.set_license_key()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.license_key IS NULL THEN
    NEW.license_key := public.generate_license_key();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_license_key
  BEFORE INSERT ON public.user_licenses
  FOR EACH ROW EXECUTE FUNCTION public.set_license_key();

-- Activation function: validates key, checks expiry, binds device
CREATE OR REPLACE FUNCTION public.activate_license(_license_key TEXT, _device_id TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lic RECORD;
  result JSON;
BEGIN
  -- Find the license
  SELECT * INTO lic FROM public.user_licenses WHERE license_key = _license_key;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid license key');
  END IF;

  -- Check if active
  IF NOT lic.is_active THEN
    RETURN json_build_object('success', false, 'error', 'License has been deactivated');
  END IF;

  -- Check expiry
  IF lic.expires_at < now() THEN
    RETURN json_build_object('success', false, 'error', 'License has expired');
  END IF;

  -- Check device binding
  IF lic.device_id IS NOT NULL AND lic.device_id <> '' AND lic.device_id <> _device_id THEN
    RETURN json_build_object('success', false, 'error', 'License is already activated on another device');
  END IF;

  -- Bind device if not yet bound
  IF lic.device_id IS NULL OR lic.device_id = '' THEN
    UPDATE public.user_licenses SET device_id = _device_id WHERE id = lic.id;
  END IF;

  RETURN json_build_object(
    'success', true,
    'plan_name', lic.plan_name,
    'expires_at', lic.expires_at,
    'remaining_days', GREATEST(0, EXTRACT(DAY FROM lic.expires_at - now())::int)
  );
END;
$$;