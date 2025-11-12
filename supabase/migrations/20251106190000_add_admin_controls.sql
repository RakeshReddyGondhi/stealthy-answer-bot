-- Create admin_controls table to allow admins to globally lock the app or deny specific users in realtime
CREATE TABLE IF NOT EXISTS public.admin_controls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user uuid NULL,
  control_key text NULL,
  denied boolean NOT NULL DEFAULT false,
  value jsonb NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Update timestamp on update
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_admin_controls ON public.admin_controls;
CREATE TRIGGER set_updated_at_admin_controls
  BEFORE UPDATE ON public.admin_controls
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_updated_at();

-- Seed a global control row (control_key = 'global') if not exists
INSERT INTO public.admin_controls (control_key, denied)
SELECT 'global', false
WHERE NOT EXISTS (SELECT 1 FROM public.admin_controls WHERE control_key = 'global');
