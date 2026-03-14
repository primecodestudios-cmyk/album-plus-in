
-- Table to store all cPanel-specific user data
CREATE TABLE public.cpanel_user_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  cpanel_id integer,
  pc_id text DEFAULT '',
  sub_start timestamp with time zone,
  sub_end timestamp with time zone,
  short_name text DEFAULT '',
  studio_name text DEFAULT '',
  city text DEFAULT '',
  address text DEFAULT '',
  activation integer DEFAULT 0,
  block_user integer DEFAULT 0,
  running_version text DEFAULT '',
  system_info text DEFAULT '',
  cpanel_created text DEFAULT '',
  note1 text DEFAULT '',
  note2 text DEFAULT '',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cpanel_user_data ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "Admins can view cpanel data" ON public.cpanel_user_data
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert cpanel data" ON public.cpanel_user_data
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update cpanel data" ON public.cpanel_user_data
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete cpanel data" ON public.cpanel_user_data
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Users can view own data
CREATE POLICY "Users can view own cpanel data" ON public.cpanel_user_data
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_cpanel_user_data_updated_at
  BEFORE UPDATE ON public.cpanel_user_data
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
