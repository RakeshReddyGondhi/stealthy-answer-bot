-- Create user_sessions table
create table if not exists public.user_sessions (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade,
    last_active timestamp with time zone default timezone('utc'::text, now()),
    ip_address text not null,
    device_info text not null,
    status text check (status in ('pending', 'approved', 'denied')) default 'pending',
    created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create admin_controls table
create table if not exists public.admin_controls (
    id uuid default gen_random_uuid() primary key,
    global_lock boolean not null default false,
    created_at timestamp with time zone default timezone('utc'::text, now()),
    updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create user_blocks table
create table if not exists public.user_blocks (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade,
    reason text not null,
    blocked_by uuid references auth.users(id),
    created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Add RLS policies
alter table public.user_sessions enable row level security;
alter table public.admin_controls enable row level security;
alter table public.user_blocks enable row level security;

-- User sessions policies
create policy "Users can view their own sessions"
    on public.user_sessions for select
    to authenticated
    using (auth.uid() = user_id);

create policy "Admins can view all sessions"
    on public.user_sessions for select
    to authenticated
    using (exists (
        select 1 from public.user_roles
        where user_id = auth.uid() and role = 'admin'
    ));

create policy "Admins can update session status"
    on public.user_sessions for update
    to authenticated
    using (exists (
        select 1 from public.user_roles
        where user_id = auth.uid() and role = 'admin'
    ));

-- Admin controls policies
create policy "Admins can view controls"
    on public.admin_controls for select
    to authenticated
    using (exists (
        select 1 from public.user_roles
        where user_id = auth.uid() and role = 'admin'
    ));

create policy "Admins can update controls"
    on public.admin_controls for update
    to authenticated
    using (exists (
        select 1 from public.user_roles
        where user_id = auth.uid() and role = 'admin'
    ));

create policy "Admins can insert controls"
    on public.admin_controls for insert
    to authenticated
    with check (exists (
        select 1 from public.user_roles
        where user_id = auth.uid() and role = 'admin'
    ));

-- User blocks policies
create policy "Admins can view blocks"
    on public.user_blocks for select
    to authenticated
    using (exists (
        select 1 from public.user_roles
        where user_id = auth.uid() and role = 'admin'
    ));

create policy "Admins can create blocks"
    on public.user_blocks for insert
    to authenticated
    with check (exists (
        select 1 from public.user_roles
        where user_id = auth.uid() and role = 'admin'
    ));

-- Functions for automatic updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

-- Add updated_at trigger to admin_controls
create trigger set_updated_at
    before update on public.admin_controls
    for each row
    execute function public.handle_updated_at();