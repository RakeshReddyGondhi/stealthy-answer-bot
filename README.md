# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/a891368e-5355-4886-a6a2-bfefb25fded1

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/a891368e-5355-4886-a6a2-bfefb25fded1) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/a891368e-5355-4886-a6a2-bfefb25fded1) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## Testing Admin Controls

### Prerequisites
1. Make sure you have Supabase CLI installed:
```bash
npm install -g supabase-cli
```

2. Start the Supabase services locally:
```bash
supabase start
```

### Database Migration
1. Apply the database migration for admin controls:
```bash
supabase db reset
```
This will create the required `admin_controls` table and set up necessary permissions.

### Testing Admin Controls
1. Start the development server:
```bash
npm run dev
```

2. Open two browser windows:
   - Window 1: Navigate to http://localhost:5173/auth and log in as an admin user
   - Window 2: Navigate to http://localhost:5173/auth and log in as a regular user

3. Run the admin control test script:
```bash
node scripts/test-admin-control.mjs
```

4. Test Scenarios:
   - The script will perform these actions in sequence:
     a. Lock global access (all users blocked)
     b. Unlock global access
     c. Deny specific user access
     d. Allow specific user access
     e. List current controls

5. Expected Behavior:
   - When global access is locked:
     * All users should see "Access Temporarily Disabled"
     * Voice chat interface should be disabled
   - When specific user is denied:
     * Only that user sees "Access Denied"
     * Other users can continue using voice chat
   - Changes should be reflected in real-time
   - Admin dashboard should show current control status

### Troubleshooting
- If realtime updates aren't working, check:
  1. Supabase connection in the browser console
  2. Subscription status in the Network tab
  3. Database permissions in Supabase dashboard
- For any database errors, try:
  ```bash
  supabase db reset --linked
  ```

### Clean Up
After testing, stop the Supabase services:
```bash
supabase stop
```
