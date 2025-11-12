Vercel deployment and DB setup
=================================

This project includes a protected serverless endpoint you can deploy to Vercel to run the idempotent DB setup without using local Docker.

Files added:
- `api/setup-database.js` — POST-only endpoint that will create `admin_controls` (idempotently), attach triggers/policies, and call Supabase RPC to enable realtime for configured tables.

Required environment variables (set these in Vercel Project > Settings > Environment Variables):
- `DATABASE_URL` — Postgres connection string (service role / admin DB URL is recommended)
- `VITE_SUPABASE_URL` or `SUPABASE_URL` — your Supabase project's URL
- `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SERVICE_KEY` — service role key for admin actions
- `SETUP_TOKEN` — a secret token used to protect the endpoint

How to run after deployment
---------------------------
1. Deploy the project to Vercel (push to the connected Git repo). Vercel will build the project and expose the function at:

   https://<your-deployment>.vercel.app/api/setup-database

2. Call the endpoint with a POST request and header `x-setup-token: <SETUP_TOKEN>`.

Example (curl):

```bash
curl -X POST \
  -H "x-setup-token: $SETUP_TOKEN" \
  https://<your-deployment>.vercel.app/api/setup-database
```

Notes & security
----------------
- The endpoint is intentionally protected by the `SETUP_TOKEN`. Treat that token like a secret and set it in Vercel's Environment Variables (not in client-side code).
- The function requires `DATABASE_URL` with privileges to create tables/policies. Use your Supabase project's service role DB connection string.
- Running the endpoint is idempotent; it attempts to create missing tables/policies safely and will not duplicate them.

If you'd like, I can also generate a small script that calls this endpoint for you (so you can run it locally with your token), or set up a GitHub Action to invoke the endpoint automatically after deployments.
