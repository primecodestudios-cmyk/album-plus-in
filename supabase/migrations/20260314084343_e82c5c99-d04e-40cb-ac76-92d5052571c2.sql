CREATE TABLE public.demo_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  youtube_id text NOT NULL,
  duration text DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.demo_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active demo videos"
  ON public.demo_videos FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can insert demo videos"
  ON public.demo_videos FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update demo videos"
  ON public.demo_videos FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete demo videos"
  ON public.demo_videos FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.demo_videos (title, description, youtube_id, duration, sort_order) VALUES
  ('Album Plus Full Demo — How It Works', 'Complete walkthrough of all features', 'dQw4w9WgXcQ', '12:45', 1),
  ('Auto Album Designing Tutorial', 'Design 200 sheets in minutes', 'dQw4w9WgXcQ', '8:30', 2),
  ('PSD Automation & Template Import', 'Convert any PSD to auto layout', 'dQw4w9WgXcQ', '6:15', 3);