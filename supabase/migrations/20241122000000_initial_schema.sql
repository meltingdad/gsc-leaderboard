-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create websites table
create table if not exists public.websites (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  domain text unique not null,
  site_url text not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Create metrics table
create table if not exists public.metrics (
  id uuid primary key default uuid_generate_v4(),
  website_id uuid references public.websites(id) on delete cascade not null,
  total_clicks integer default 0 not null,
  total_impressions integer default 0 not null,
  average_ctr double precision default 0 not null,
  average_position double precision default 0 not null,
  date_range text default 'last_28_days' not null,
  last_updated timestamp with time zone default now() not null,
  created_at timestamp with time zone default now() not null
);

-- Create user_tokens table to store Google OAuth tokens
create table if not exists public.user_tokens (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade unique not null,
  google_access_token text,
  google_refresh_token text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Enable Row Level Security
alter table public.websites enable row level security;
alter table public.metrics enable row level security;
alter table public.user_tokens enable row level security;

-- RLS Policies for websites
create policy "Users can view all websites"
  on public.websites for select
  to authenticated
  using (true);

create policy "Users can insert their own websites"
  on public.websites for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own websites"
  on public.websites for update
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can delete their own websites"
  on public.websites for delete
  to authenticated
  using (auth.uid() = user_id);

-- RLS Policies for metrics
create policy "Users can view all metrics"
  on public.metrics for select
  to authenticated
  using (true);

create policy "Users can insert metrics for their websites"
  on public.metrics for insert
  to authenticated
  with check (
    exists (
      select 1 from public.websites
      where id = website_id and user_id = auth.uid()
    )
  );

create policy "Users can update metrics for their websites"
  on public.metrics for update
  to authenticated
  using (
    exists (
      select 1 from public.websites
      where id = website_id and user_id = auth.uid()
    )
  );

create policy "Users can delete metrics for their websites"
  on public.metrics for delete
  to authenticated
  using (
    exists (
      select 1 from public.websites
      where id = website_id and user_id = auth.uid()
    )
  );

-- RLS Policies for user_tokens
create policy "Users can view their own tokens"
  on public.user_tokens for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their own tokens"
  on public.user_tokens for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own tokens"
  on public.user_tokens for update
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can delete their own tokens"
  on public.user_tokens for delete
  to authenticated
  using (auth.uid() = user_id);

-- Create indexes
create index if not exists websites_user_id_idx on public.websites(user_id);
create index if not exists metrics_website_id_idx on public.metrics(website_id);
create index if not exists metrics_last_updated_idx on public.metrics(last_updated desc);
create index if not exists user_tokens_user_id_idx on public.user_tokens(user_id);

-- Create updated_at trigger function
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Add updated_at triggers
create trigger websites_updated_at
  before update on public.websites
  for each row
  execute function public.handle_updated_at();

create trigger user_tokens_updated_at
  before update on public.user_tokens
  for each row
  execute function public.handle_updated_at();
