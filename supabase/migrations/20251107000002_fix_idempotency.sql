-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view their own sessions" ON user_sessions;
DROP POLICY IF EXISTS "Admins can view all sessions" ON user_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON user_sessions;
DROP POLICY IF EXISTS "Admins can update any session" ON user_sessions;

-- Re-create policies with proper conditions
CREATE POLICY "Users can view their own sessions"
    ON public.user_sessions 
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all sessions"
    ON public.user_sessions 
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    );

CREATE POLICY "Users can update their own sessions"
    ON public.user_sessions 
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can update any session"
    ON public.user_sessions 
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    );

-- Enable realtime for all relevant tables
DO $$ 
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS user_sessions;
    ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS help_requests;
    ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS ai_responses;
    ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS user_roles;
    ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS admin_controls;
EXCEPTION
    WHEN undefined_object THEN
        NULL;
END $$;

-- Set replica identity for realtime functionality
ALTER TABLE user_sessions REPLICA IDENTITY FULL;
ALTER TABLE help_requests REPLICA IDENTITY FULL;
ALTER TABLE ai_responses REPLICA IDENTITY FULL;
ALTER TABLE user_roles REPLICA IDENTITY FULL;
ALTER TABLE admin_controls REPLICA IDENTITY FULL;

-- Add missing indices for performance
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE indexname = 'idx_user_sessions_user_id'
    ) THEN
        CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE indexname = 'idx_user_sessions_status'
    ) THEN
        CREATE INDEX idx_user_sessions_status ON user_sessions(status);
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE indexname = 'idx_help_requests_user_id'
    ) THEN
        CREATE INDEX idx_help_requests_user_id ON help_requests(user_id);
    END IF;
END $$;