Testing admin control (global lock and per-user deny)
===============================================

This repository includes a small test script to help simulate admin actions against the `admin_controls` table.

Files:
- `scripts/test-admin-control.mjs` — Node ESM script to lock/unlock global, deny/allow a user, and list control rows.

Before you run
---------------
- Apply the database migration (`supabase/migrations/20251106190000_add_admin_controls.sql`) to your Supabase DB.
- Ensure your Supabase project has the `admin_controls` table and at least the seeded `global` row.
- For security, prefer using a service role key when changing controls (env var `SUPABASE_SERVICE_KEY` or `SUPABASE_SERVICE_ROLE_KEY`).

Examples
--------
Run a global lock (requires SUPABASE_URL and a key in env):

Windows PowerShell example:

```powershell
$env:SUPABASE_URL="https://your-project.supabase.co";
$env:SUPABASE_SERVICE_KEY="your_service_role_key";
node scripts/test-admin-control.mjs lock-global
```

Unlock global:

```powershell
node scripts/test-admin-control.mjs unlock-global
```

Deny a user (replace <user-uuid> with a real user id):

```powershell
node scripts/test-admin-control.mjs deny-user <user-uuid>
```

List all controls:

```powershell
node scripts/test-admin-control.mjs list
```

Notes
-----
- This script uses `@supabase/supabase-js` and requires network access to your Supabase project.
- For production use, ensure RLS policies on `admin_controls` restrict who can upsert rows (only admins).
- To fully test realtime behavior, open the app in two browsers:
  1. Admin: open `AdminDashboard` and run a deny or global lock.
  2. User: open as a normal user and observe the overlay or forced sign-out when the admin action runs.
