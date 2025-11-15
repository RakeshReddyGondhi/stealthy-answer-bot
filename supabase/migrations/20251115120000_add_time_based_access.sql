-- Add time-based access control to help_requests table
-- This allows admin to grant temporary access (e.g., 1 hour, 2 hours)
-- Access automatically expires after the duration

-- Add new columns for time-based access
ALTER TABLE help_requests 
ADD COLUMN IF NOT EXISTS access_granted_at timestamptz,
ADD COLUMN IF NOT EXISTS access_expires_at timestamptz,
ADD COLUMN IF NOT EXISTS access_duration_minutes integer;

-- Add 'expired' status to the enum if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'request_status') THEN
    CREATE TYPE request_status AS ENUM ('pending', 'approved', 'denied', 'answered', 'expired');
  ELSE
    ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'expired';
  END IF;
END $$;

-- Function to check if user's access is still valid
CREATE OR REPLACE FUNCTION is_access_valid(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM help_requests
    WHERE help_requests.user_id = is_access_valid.user_id
    AND status = 'approved'
    AND (access_expires_at IS NULL OR access_expires_at > now())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to grant time-based access
-- Admin calls this with request_id and duration in minutes
CREATE OR REPLACE FUNCTION grant_time_based_access(
  request_id uuid,
  duration_minutes integer
)
RETURNS void AS $$
BEGIN
  UPDATE help_requests
  SET 
    status = 'approved',
    access_granted_at = now(),
    access_expires_at = now() + (duration_minutes || ' minutes')::interval,
    access_duration_minutes = duration_minutes,
    updated_at = now()
  WHERE id = request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-expire access
CREATE OR REPLACE FUNCTION auto_expire_access()
RETURNS void AS $$
BEGIN
  UPDATE help_requests
  SET status = 'expired',
      updated_at = now()
  WHERE status = 'approved'
  AND access_expires_at IS NOT NULL
  AND access_expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function to check expiration on access
CREATE OR REPLACE FUNCTION check_access_expiration()
RETURNS trigger AS $$
BEGIN
  -- If access has an expiration time and it's in the past, mark as expired
  IF NEW.status = 'approved' 
     AND NEW.access_expires_at IS NOT NULL 
     AND NEW.access_expires_at < now() THEN
    NEW.status := 'expired';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_check_access_expiration ON help_requests;
CREATE TRIGGER trigger_check_access_expiration
  BEFORE UPDATE ON help_requests
  FOR EACH ROW
  EXECUTE FUNCTION check_access_expiration();

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_help_requests_access_expires 
ON help_requests(access_expires_at) 
WHERE status = 'approved';

-- Add helpful comments
COMMENT ON COLUMN help_requests.access_granted_at IS 'Timestamp when admin granted access';
COMMENT ON COLUMN help_requests.access_expires_at IS 'Timestamp when access expires (NULL = permanent access)';
COMMENT ON COLUMN help_requests.access_duration_minutes IS 'Duration of access in minutes (e.g., 60 = 1 hour, 120 = 2 hours)';

COMMENT ON FUNCTION grant_time_based_access IS 'Admin function to grant time-limited access. Example: SELECT grant_time_based_access(''request-uuid-here'', 120) -- Grants 2 hours';
COMMENT ON FUNCTION is_access_valid IS 'Check if user has valid (non-expired) access';
COMMENT ON FUNCTION auto_expire_access IS 'Automatically expire access for users whose time has run out. Should be called periodically';
