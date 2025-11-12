## Realtime Testing Flow

1. First Time Setup:
   ```bash
   # Apply database migrations
   supabase migration up

   # Install dependencies
   npm install
   ```

2. Start Three Terminal Windows:
   
   Terminal 1 - Development Server:
   ```bash
   npm run dev
   ```

   Terminal 2 - Database Watcher:
   ```bash
   supabase db remote changes
   ```

   Terminal 3 - Test Runner:
   ```bash
   npm run test:admin
   ```

3. Open Two Browser Windows:
   - Window 1: `http://localhost:5173/admin` (Admin View)
   - Window 2: `http://localhost:5173/` (User View)

4. Testing Sequence:

   a. Initial Setup:
   - Login as admin in Window 1
   - Login as regular user in Window 2
   - Copy the user ID for testing

   b. Run the Test Script:
   - In Terminal 3, run `npm run test:admin`
   - Enter the copied user ID when prompted
   - Watch both browser windows for realtime updates

   c. Verify These Events:
   1. Help Requests Creation:
      - Three requests appear sequentially in admin view
      - User view updates with new requests
   
   2. AI Response Generation:
      - Response cards appear in both views
      - Timestamps are correct
      - Content is properly formatted
   
   3. Status Updates:
      - Status badges update instantly
      - Color coding changes appropriately
      - User notifications appear
   
   4. Admin Actions:
      - Notes can be added/edited
      - Approval/denial works
      - Status transitions occur correctly

5. Common Issues:

   a. No Realtime Updates:
   - Check browser console for errors
   - Verify Supabase connection in Network tab
   - Confirm subscription channel IDs match

   b. Status Not Updating:
   - Check RLS policies
   - Verify user roles
   - Check database triggers

   c. Missing Data:
   - Verify database schema
   - Check relationship queries
   - Confirm data types match

6. Manual Verification Steps:

   a. Admin View Features:
   - [ ] Request list updates in realtime
   - [ ] Status changes reflect immediately
   - [ ] Admin notes persist
   - [ ] AI responses appear instantly
   - [ ] Action buttons disable appropriately

   b. User View Features:
   - [ ] Request status updates instantly
   - [ ] AI responses appear in realtime
   - [ ] Admin notes visible when added
   - [ ] Proper error states shown

   c. Edge Cases:
   - [ ] Multiple rapid updates handle correctly
   - [ ] Network disconnection recovery works
   - [ ] Invalid status transitions blocked
   - [ ] Concurrent admin actions resolve properly

7. Performance Metrics:
   - Realtime update latency < 500ms
   - UI remains responsive during updates
   - No duplicate events
   - Proper error handling