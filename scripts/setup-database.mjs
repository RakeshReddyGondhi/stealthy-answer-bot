import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { promises as fs } from 'fs';

// Get the directory name of the current module
const __dirname = dirname(fileURLToPath(import.meta.url));

// Load environment variables from the root directory
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

// Note: direct DB (pg) based migrations were removed in cleanup.
// Use Supabase CLI or the SQL editor in the Supabase dashboard to run migrations/make schema changes.

async function enableRealtimeForTables() {
  try {
    // Enable realtime for tables using raw SQL
    await supabase.rpc('enable_realtime', {
      table_names: [
        'user_sessions',
        'help_requests',
        'ai_responses',
        'user_roles',
        'admin_controls'
      ]
    });

    console.log('Realtime enabled for all tables');
  } catch (error) {
    console.error('Error enabling realtime:', error);
  }
}

async function setupTables() {
  try {
    // Helper: check if table exists using Supabase; returns false if PostgREST reports missing relation
    async function tableExists(table) {
      try {
        const { error } = await supabase.from(table).select('1').limit(1);
        if (error) {
          // If PostgREST can't find the table it returns PGRST205
          if (error.code === 'PGRST205' || /Could not find the table/.test(error.message || '')) {
            return false;
          }
          // Other errors — rethrow to be handled by caller
          throw error;
        }
        return true;
      } catch (err) {
        // If error is a missing table indicator, return false; otherwise rethrow
        if (err && (err.code === 'PGRST205' || /Could not find the table/.test(err.message || ''))) {
          return false;
        }
        throw err;
      }
    }

    // Create admin_controls table if it doesn't exist
    const hasAdminControls = await tableExists('admin_controls');
    if (!hasAdminControls) {
      // Re-check
      const nowExists = await tableExists('admin_controls');
      if (!nowExists) {
        throw new Error('admin_controls table does not exist. Run the migration using the Supabase CLI or the SQL editor in the Supabase dashboard.');
      }
    }

    const { error: tableError } = await supabase
      .from('admin_controls')
      .upsert([
        {
          id: '00000000-0000-0000-0000-000000000000',
          global_lock: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]);

    if (tableError) throw tableError;

    // Create test admin user if it doesn't exist
    const { error: userError } = await supabase.auth.admin.createUser({
      email: 'admin@test.com',
      password: 'testadmin123',
      email_confirm: true,
      user_metadata: {
        full_name: 'Test Admin'
      }
    });

    if (userError) throw userError;

    // Set admin role for test user
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert([
        {
          user_id: (await supabase.auth.admin.listUsers()).data.users[0].id,
          role: 'admin',
          created_at: new Date().toISOString()
        }
      ]);

    if (roleError) throw roleError;

    console.log('Tables and test data set up successfully');
  } catch (error) {
    console.error('Error setting up tables:', error);
  }
}

async function main() {
  console.log('Starting database setup...');
  
  if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
    console.error('Error: Missing Supabase environment variables');
    console.log('Required variables:');
    console.log('- VITE_SUPABASE_URL');
    console.log('- VITE_SUPABASE_PUBLISHABLE_KEY');
    console.log('\nIf you do not want to run Supabase locally via Docker, set up a remote Supabase project and add the following to your .env:');
    console.log('- VITE_SUPABASE_URL="https://<your-project>.supabase.co"');
    console.log('- VITE_SUPABASE_PUBLISHABLE_KEY="<anon-or-pub-key>"');
    process.exit(1);
  }

  try {
  console.log('Enabling realtime for tables...');
  await enableRealtimeForTables();
    
    console.log('Setting up tables and test data...');
    await setupTables();
    
    console.log('\nSetup completed successfully! ✨');
    console.log('\nTest credentials:');
    console.log('Email: admin@test.com');
    console.log('Password: testadmin123');
  } catch (error) {
    console.error('\nSetup failed:', error);
    process.exit(1);
  }
}

main();