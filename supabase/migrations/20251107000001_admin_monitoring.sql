create table if not exists public.user_sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  last_active timestamp with time zone default now(),
  ip_address text,
  device_info text,
  status text default 'pending' check (status in ('pending', 'approved', 'denied')),
  created_at timestamp with time zone default now()
);

create table if not exists public.admin_controls (
  id uuid default uuid_generate_v4() primary key,
  global_lock boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists public.user_blocks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  reason text,
  blocked_at timestamp with time zone default now(),
  blocked_by uuid references auth.users(id)
);

-- Enable Row Level Security
alter table public.user_sessions enable row level security;
alter table public.admin_controls enable row level security;
alter table public.user_blocks enable row level security;

-- RLS Policies
create policy "Users can view their own sessions"
  on public.user_sessions for select
  using (auth.uid() = user_id);

create policy "Only admins can manage sessions"
  on public.user_sessions for all
  using (exists (
    select 1 from auth.users
    where auth.uid() = id and raw_user_meta_data->>'isAdmin' = 'true'
  ));

create policy "Only admins can manage controls"
  on public.admin_controls for all
  using (exists (
    select 1 from auth.users
    where auth.uid() = id and raw_user_meta_data->>'isAdmin' = 'true'
  ));

create policy "Only admins can manage blocks"
  on public.user_blocks for all
  using (exists (
    select 1 from auth.users
    where auth.uid() = id and raw_user_meta_data->>'isAdmin' = 'true'
  ));

-- Function to check if user is blocked
create or replace function public.is_user_blocked(user_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.user_blocks
    where user_blocks.user_id = is_user_blocked.user_id
  );
end;
$$ language plpgsql security definer;