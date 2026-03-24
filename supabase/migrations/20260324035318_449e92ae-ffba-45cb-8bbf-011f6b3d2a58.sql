
-- App settings table for admin toggles (persisted in DB instead of localStorage)
CREATE TABLE public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL DEFAULT '',
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings (frontend needs to check toggles)
CREATE POLICY "Anyone can read settings" ON public.app_settings
  FOR SELECT TO public USING (true);

-- Only admins can modify settings
CREATE POLICY "Admins can insert settings" ON public.app_settings
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update settings" ON public.app_settings
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete settings" ON public.app_settings
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Insert default values (OFF by default)
INSERT INTO public.app_settings (key, value) VALUES
  ('enable_chat_widget', 'false'),
  ('enable_whatsapp_button', 'false'),
  ('maintenance_mode', 'false'),
  ('whatsapp_instance_id', ''),
  ('whatsapp_access_token', ''),
  ('support_phone', ''),
  ('support_email', ''),
  ('site_title', 'AlbumPlus');
