
-- Create user_devices table for multi-PC tracking
CREATE TABLE public.user_devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  device_id TEXT NOT NULL,
  device_name TEXT DEFAULT '',
  system_info TEXT DEFAULT '',
  windows_version TEXT DEFAULT '',
  running_version TEXT DEFAULT '',
  ip_address TEXT DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  activated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  license_id UUID REFERENCES public.user_licenses(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, device_id)
);

-- Enable RLS
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view all devices" ON public.user_devices FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert devices" ON public.user_devices FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update devices" ON public.user_devices FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete devices" ON public.user_devices FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own devices" ON public.user_devices FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_user_devices_updated_at BEFORE UPDATE ON public.user_devices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
