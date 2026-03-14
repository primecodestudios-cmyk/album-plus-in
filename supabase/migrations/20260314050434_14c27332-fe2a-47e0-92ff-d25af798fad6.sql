
CREATE TABLE public.contact_enquiries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_enquiries ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a contact form (no auth required)
CREATE POLICY "Anyone can insert enquiries"
ON public.contact_enquiries
FOR INSERT
TO public
WITH CHECK (true);

-- Only admins can view enquiries
CREATE POLICY "Admins can view enquiries"
ON public.contact_enquiries
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete enquiries
CREATE POLICY "Admins can delete enquiries"
ON public.contact_enquiries
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
