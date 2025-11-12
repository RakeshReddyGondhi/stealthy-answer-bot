-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create user_sessions table
create table if not exists public.user_sessions (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users(id) on delete cascade,
    last_active timestamp with time zone default timezone('utc'::text, now()),
    ip_address text not null,
    device_info text not null,
    status text check (status in ('pending', 'approved', 'denied')) default 'pending',
    created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create admin_controls table
create table if not exists public.admin_controls (
    id uuid default uuid_generate_v4() primary key,
    global_lock boolean not null default false,
    created_at timestamp with time zone default timezone('utc'::text, now()),
    updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create user_blocks table
create table if not exists public.user_blocks (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users(id) on delete cascade,
    reason text not null,
    blocked_by uuid references auth.users(id),
    created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create is_user_blocked function
create or replace function public.is_user_blocked(user_id uuid)
returns boolean
language plpgsql security definer
as $$
begin
    return exists (
        select 1
        from public.user_blocks
        where user_blocks.user_id = $1
    );
end;
$$;