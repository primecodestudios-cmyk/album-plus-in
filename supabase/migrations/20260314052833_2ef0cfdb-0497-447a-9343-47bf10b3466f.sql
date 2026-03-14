
-- Create device_requests table for software activation requests
CREATE TABLE public.device_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  device_id TEXT NOT NULL,
  system_name TEXT DEFAULT '',
  windows_version TEXT DEFAULT '',
  software_version TEXT DEFAULT '',
  ip_address TEXT DEFAULT '',
  request_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.device_requests ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can view all device requests"
  ON public.device_requests FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update device requests"
  ON public.device_requests FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete device requests"
  ON public.device_requests FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow public insert (software sends requests without auth)
CREATE POLICY "Anyone can insert device requests"
  ON public.device_requests FOR INSERT
  TO public
  WITH CHECK (true);

-- Users can view their own requests
CREATE POLICY "Users can view own device requests"
  ON public.device_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Add unique constraint to prevent duplicate requests from same device
CREATE UNIQUE INDEX idx_device_requests_email_device ON public.device_requests (email, device_id) WHERE status = 'pending';
