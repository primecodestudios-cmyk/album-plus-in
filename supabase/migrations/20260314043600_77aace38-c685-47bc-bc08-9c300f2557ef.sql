-- User roles enum and table
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS: admins can see all roles, users can see own
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own role" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Pricing configuration table (admin-managed)
CREATE TABLE public.pricing_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_name TEXT NOT NULL UNIQUE,
  duration_days INTEGER NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;

-- Everyone can read pricing
CREATE POLICY "Anyone can view active pricing" ON public.pricing_plans
  FOR SELECT USING (true);

-- Only admins can modify
CREATE POLICY "Admins can insert pricing" ON public.pricing_plans
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update pricing" ON public.pricing_plans
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete pricing" ON public.pricing_plans
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_pricing_plans_updated_at BEFORE UPDATE ON public.pricing_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default pricing plans
INSERT INTO public.pricing_plans (plan_name, duration_days, price) VALUES
  ('28 Days', 28, 200),
  ('3 Months', 90, 499),
  ('6 Months', 180, 899),
  ('1 Year', 365, 1499);

-- PSD templates table (admin-managed marketplace)
CREATE TABLE public.psd_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT DEFAULT '',
  preview_url TEXT DEFAULT '',
  file_url TEXT DEFAULT '',
  file_size TEXT DEFAULT '',
  photoshop_version TEXT DEFAULT 'CS6 — CC 2024',
  pages INTEGER NOT NULL DEFAULT 1,
  price NUMERIC NOT NULL DEFAULT 0,
  is_free BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  downloads_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.psd_templates ENABLE ROW LEVEL SECURITY;

-- Everyone can read active templates
CREATE POLICY "Anyone can view active templates" ON public.psd_templates
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert templates" ON public.psd_templates
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update templates" ON public.psd_templates
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete templates" ON public.psd_templates
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_psd_templates_updated_at BEFORE UPDATE ON public.psd_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Admin policies for existing tables
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all licenses" ON public.user_licenses
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert licenses" ON public.user_licenses
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update licenses" ON public.user_licenses
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all purchases" ON public.user_purchases
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all downloads" ON public.user_downloads
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Function to get admin stats (security definer to bypass RLS)
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM auth.users),
    'active_licenses', (SELECT COUNT(*) FROM public.user_licenses WHERE is_active = true AND expires_at > now()),
    'total_purchases', (SELECT COUNT(*) FROM public.user_purchases),
    'total_revenue', (SELECT COALESCE(SUM(price), 0) FROM public.user_purchases)
  ) INTO result;

  RETURN result;
END;
$$;