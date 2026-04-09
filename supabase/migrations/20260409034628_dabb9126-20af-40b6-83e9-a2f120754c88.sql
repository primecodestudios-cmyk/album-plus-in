CREATE TABLE public.changelogs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  version text NOT NULL,
  release_date date NOT NULL,
  changes text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.changelogs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active changelogs" ON public.changelogs FOR SELECT USING (true);
CREATE POLICY "Admins can insert changelogs" ON public.changelogs FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update changelogs" ON public.changelogs FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete changelogs" ON public.changelogs FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_changelogs_updated_at BEFORE UPDATE ON public.changelogs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();