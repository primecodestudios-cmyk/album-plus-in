
-- Table 1: WhatsApp API Configs (multi-API support)
CREATE TABLE public.whatsapp_api_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL DEFAULT 'API 1',
  api_url TEXT NOT NULL DEFAULT 'https://chat2me.in/api/send',
  api_method TEXT NOT NULL DEFAULT 'POST',
  api_token TEXT NOT NULL DEFAULT '',
  instance_id TEXT NOT NULL DEFAULT '',
  sender_number TEXT NOT NULL DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  health_status TEXT NOT NULL DEFAULT 'connected',
  failure_count INT NOT NULL DEFAULT 0,
  last_failure_at TIMESTAMPTZ,
  total_sent INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_api_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view whatsapp configs" ON public.whatsapp_api_configs
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert whatsapp configs" ON public.whatsapp_api_configs
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update whatsapp configs" ON public.whatsapp_api_configs
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete whatsapp configs" ON public.whatsapp_api_configs
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Table 2: WhatsApp Message Logs
CREATE TABLE public.whatsapp_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  user_name TEXT,
  whatsapp_number TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'manual',
  channel TEXT DEFAULT 'API 1',
  message_content TEXT NOT NULL,
  delivery_status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view whatsapp logs" ON public.whatsapp_logs
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete whatsapp logs" ON public.whatsapp_logs
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
-- Service role inserts logs from edge functions, no public insert policy needed
CREATE POLICY "Service can insert whatsapp logs" ON public.whatsapp_logs
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Table 3: WhatsApp Message Templates
CREATE TABLE public.whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  template_name TEXT NOT NULL DEFAULT '',
  template_text TEXT NOT NULL DEFAULT '',
  variables TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view whatsapp templates" ON public.whatsapp_templates
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert whatsapp templates" ON public.whatsapp_templates
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update whatsapp templates" ON public.whatsapp_templates
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete whatsapp templates" ON public.whatsapp_templates
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
