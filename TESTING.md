# Admin Testing Guide

This guide explains how to test the admin monitoring functionality and realtime updates in the application.

## Prerequisites

1. Node.js v18 or later installed
2. Supabase project set up
3. Database migrations applied
4. Environment variables configured

## Recent Changes

1. Enhanced database schema:
   - Improved status handling with constraints
   - Added realtime support for AI responses
   - Updated RLS policies for better security
   - Added performance indexes
   - New admin helper functions

2. Component Updates:
   - AdminRequestCard: Proper status transitions
   - AIResponseDialog: Realtime response updates
   - Type-safe database operations
   - Better error handling

## Setup

1. Apply the database migration:
   ```bash
   supabase migration up
   ```

2. Create a `.env` file in the root directory with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_project_url
   VITE_SUPABASE_KEY=your_anon_key
   ```

## Running Tests

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open two browser windows:
   - Window 1: Log in as an admin user
   - Window 2: Log in as a regular user

3. Run the test script:
   ```bash
   node scripts/test-admin.mjs
   ```

4. When prompted, enter the user ID from Window 2 (the regular user)

## Expected Behavior

1. In Window 1 (Admin):
   - A new help request should appear in real-time
   - After ~2 seconds, an AI response should be added
   - The status updates should be reflected immediately

2. In Window 2 (User):
   - The help request should show as "pending"
   - The AI response should appear in real-time
   - Status changes should be reflected immediately

## Manual Testing Steps

1. **Admin Actions:**
   - View incoming help requests
   - Review AI responses
   - Approve/deny requests
   - Add admin notes

2. **User Actions:**
   - Create new help requests
   - View AI responses
   - Monitor request status

## Troubleshooting

1. If realtime updates aren't working:
   - Check the browser console for errors
   - Verify Supabase realtime is enabled for the tables
   - Confirm the subscription channels are correct

2. If database operations fail:
   - Check the RLS policies
   - Verify user roles are set correctly
   - Confirm the database schema matches the types

## Need Help?

If you encounter any issues:
1. Check the application logs
2. Review the Supabase dashboard
3. Verify all environment variables are set correctly