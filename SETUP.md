# Setup Guide

## Prerequisites

1. Install Docker Desktop
   - Download from [https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)
   - Run the installer and follow the prompts
   - Start Docker Desktop and wait for it to initialize

2. Install Scoop (Package Manager)
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   irm get.scoop.sh | iex
   ```

3. Install Supabase CLI
   ```powershell
   scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
   scoop install supabase
   ```

## Project Setup

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd Proxy
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Start local Supabase services
   ```bash
   supabase start
   ```

4. Apply database migrations
   ```bash
   supabase db reset
   ```

5. Start the development server
   ```bash
   npm run dev
   ```

## Building the Desktop App

1. Build the application
   ```bash
   npm run electron:build
   ```

2. Find the installer in the `dist` folder
   - Windows: `dist/Stealthy Answer Bot Setup.exe`

## Admin Setup

1. Create an admin user
   ```bash
   supabase auth signup -i -p <your-password> admin@example.com
   ```

2. Set admin privileges
   ```bash
   supabase db reset # This will apply migrations including admin role
   ```

3. Access the admin dashboard
   - Navigate to `http://localhost:5173/admin`
   - Log in with your admin credentials

## Usage Instructions

### For Admins
1. Open the admin dashboard
2. Monitor active users and sessions
3. Approve/deny access requests
4. Block users if needed
5. Use global lock for maintenance

### For Users
1. Install the application using the provided installer
2. Wait for admin approval (first-time use)
3. Use voice commands to ask questions
4. Press Alt + H to show/hide answers
5. Answers are invisible during screen sharing

## Troubleshooting

### Docker Issues
- Ensure Docker Desktop is running
- Try restarting Docker Desktop if services won't start
- Check Docker logs for detailed errors

### Database Issues
- Run `supabase db reset` to reset to a clean state
- Check `supabase/migrations` for migration files
- Use `supabase db remote commit` to sync schema changes

### Permission Issues
- Run Docker Desktop as administrator
- Ensure you have necessary permissions for npm global installs
- Check Windows Defender or antivirus if executables are blocked