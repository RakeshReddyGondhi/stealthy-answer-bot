-- Update help_requests table with better status handling
ALTER TABLE help_requests ALTER COLUMN status SET DEFAULT 'pending';

-- Add check constraint for valid status values
ALTER TABLE help_requests ADD CONSTRAINT help_requests_status_check 
  CHECK (status IN ('pending', 'approved', 'denied', 'answered'));

-- Add realtime support for all relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE ai_responses;
ALTER PUBLICATION supabase_realtime ADD TABLE help_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE user_roles;

ALTER TABLE ai_responses REPLICA IDENTITY FULL;
ALTER TABLE help_requests REPLICA IDENTITY FULL;
ALTER TABLE user_roles REPLICA IDENTITY FULL;

-- Update RLS policies for better security
DROP POLICY IF EXISTS "Users can view responses for their requests" ON ai_responses;
CREATE POLICY "Users can view responses for their requests" ON ai_responses 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM help_requests
    WHERE help_requests.id = ai_responses.request_id
    AND (
      help_requests.user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_roles.user_id = auth.uid() 
        AND user_roles.role = 'admin'
      )
    )
  )
);

-- Add index for faster response lookups
CREATE INDEX IF NOT EXISTS idx_ai_responses_request_id 
  ON ai_responses(request_id);

-- Add index for status filtering
CREATE INDEX IF NOT EXISTS idx_help_requests_status 
  ON help_requests(status);

-- Add function to check admin status
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = $1
    AND user_roles.role = 'admin'
  );
$$;