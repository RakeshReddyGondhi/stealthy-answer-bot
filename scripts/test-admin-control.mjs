#!/usr/bin/env node
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Simple CLI to test admin_controls table.
// Usage examples:
// SUPABASE_URL=... SUPABASE_SERVICE_KEY=... node scripts/test-admin-control.mjs lock-global
// SUPABASE_URL=... SUPABASE_SERVICE_KEY=... node scripts/test-admin-control.mjs unlock-global
// SUPABASE_URL=... SUPABASE_ANON_KEY=... node scripts/test-admin-control.mjs deny-user <userId>
// SUPABASE_URL=... SUPABASE_ANON_KEY=... node scripts/test-admin-control.mjs allow-user <userId>
// SUPABASE_URL=... SUPABASE_ANON_KEY=... node scripts/test-admin-control.mjs list

const URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!URL || !KEY) {
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_KEY (or SUPABASE_ANON_KEY).');
  process.exit(1);
}

const supabase = createClient(URL, KEY);

async function lockGlobal(flag) {
  const { error, data } = await supabase.from('admin_controls').upsert(
    { control_key: 'global', denied: flag },
    { onConflict: ['control_key'] }
  );
  if (error) console.error('Error:', error);
  else console.log('Global lock set:', flag, data);
}

async function setUserDenied(userId, flag) {
  const { error, data } = await supabase.from('admin_controls').upsert(
    { target_user: userId, denied: flag },
    { onConflict: ['target_user'] }
  );
  if (error) console.error('Error:', error);
  else console.log(`${flag ? 'Denied' : 'Allowed'} user:`, userId, data);
}

async function listControls() {
  const { data, error } = await supabase.from('admin_controls').select('*').order('created_at', { ascending: false });
  if (error) console.error('Error:', error);
  else console.log('Controls:\n', JSON.stringify(data, null, 2));
}

async function main() {
  const cmd = process.argv[2];
  if (!cmd) {
    console.error('Provide a command: lock-global | unlock-global | deny-user <id> | allow-user <id> | list');
    process.exit(1);
  }

  if (cmd === 'lock-global') return await lockGlobal(true);
  if (cmd === 'unlock-global') return await lockGlobal(false);
  if (cmd === 'deny-user') return await setUserDenied(process.argv[3], true);
  if (cmd === 'allow-user') return await setUserDenied(process.argv[3], false);
  if (cmd === 'list') return await listControls();

  console.error('Unknown command:', cmd);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
