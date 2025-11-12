-- Create admin controls table
CREATE TABLE IF NOT EXISTS public.admin_controls (
  id UUID PRIMARY KEY,
  global_lock BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.admin_controls ENABLE ROW LEVEL SECURITY;

-- Only admins can view or modify admin controls
CREATE POLICY "Admins can view admin controls"
  ON public.admin_controls FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update admin controls"
  ON public.admin_controls FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for admin_controls
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_controls;
ALTER TABLE public.admin_controls REPLICA IDENTITY FULL;