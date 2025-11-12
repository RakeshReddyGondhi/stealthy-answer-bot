const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');

// Serverless endpoint to run idempotent DB setup on Vercel.
// Protect this endpoint by requiring a POST request with header `x-setup-token` equal to env `SETUP_TOKEN`.

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed. Use POST.' });
    return;
  }

  const token = req.headers['x-setup-token'] || req.headers['x-setup-token'.toLowerCase()];
  if (!process.env.SETUP_TOKEN) {
    res.status(500).json({ error: 'Server not configured: missing SETUP_TOKEN env' });
    return;
  }
  if (!token || token !== process.env.SETUP_TOKEN) {
    res.status(401).json({ error: 'Unauthorized. Provide correct x-setup-token header.' });
    return;
  }

  const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

  if (!databaseUrl) {
    res.status(400).json({ error: 'Missing DATABASE_URL in environment. Add it in Vercel project settings.' });
    return;
  }
  if (!supabaseUrl || !supabaseServiceKey) {
    res.status(400).json({ error: 'Missing Supabase credentials (SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY).' });
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const client = new Client({ connectionString: databaseUrl });

  try {
    await client.connect();
    // Create admin_controls table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.admin_controls (
        id UUID PRIMARY KEY,
        global_lock BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Trigger function
    await client.query(`
      CREATE OR REPLACE FUNCTION public.set_updated_at_admin_controls()
      RETURNS trigger AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Trigger (idempotent)
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_admin_controls') THEN
          CREATE TRIGGER set_updated_at_admin_controls
            BEFORE UPDATE ON public.admin_controls
            FOR EACH ROW
            EXECUTE FUNCTION public.set_updated_at_admin_controls();
        END IF;
      END
      $$;
    `);

    // Policies (idempotent via DO block)
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'admin_controls' AND policyname = 'Admins can view admin controls'
        ) THEN
          EXECUTE $$ CREATE POLICY "Admins can view admin controls" ON public.admin_controls FOR SELECT USING (public.has_role(auth.uid(), 'admin')); $$;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'admin_controls' AND policyname = 'Admins can update admin controls'
        ) THEN
          EXECUTE $$ CREATE POLICY "Admins can update admin controls" ON public.admin_controls FOR UPDATE USING (public.has_role(auth.uid(), 'admin')); $$;
        END IF;
      END
      $$;
    `);

    // Attempt to enable realtime via Supabase RPC if available
    try {
      await supabase.rpc('enable_realtime', {
        table_names: ['user_sessions', 'help_requests', 'ai_responses', 'user_roles', 'admin_controls']
      });
    } catch (rpcErr) {
      // Not fatal — still return success but include notice
      console.warn('enable_realtime RPC failed:', rpcErr.message || rpcErr);
    }

    // Insert default admin_controls row if missing
    try {
      const { error } = await supabase.from('admin_controls').upsert([{
        id: '00000000-0000-0000-0000-000000000000',
        global_lock: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]);
      if (error) throw error;
    } catch (upsertErr) {
      // If table not found in PostgREST cache, include message
      console.warn('Upsert admin_controls warning:', upsertErr.message || upsertErr);
    }

    res.status(200).json({ ok: true, message: 'DB setup run (idempotent). Check logs for details.' });
  } catch (err) {
    console.error('setup-database error:', err);
    res.status(500).json({ error: (err && err.message) || String(err) });
  } finally {
    try { await client.end(); } catch (e) { /* ignore */ }
  }
};
