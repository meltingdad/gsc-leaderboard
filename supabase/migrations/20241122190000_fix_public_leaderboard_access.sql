-- Fix RLS policies to allow public (anonymous) access to leaderboard data
-- The leaderboard should be publicly viewable by anyone (authenticated or not)

-- Drop existing restrictive policies
drop policy if exists "Users can view all websites" on public.websites;
drop policy if exists "Users can view all metrics" on public.metrics;

-- Recreate policies to allow both anonymous and authenticated users
-- This makes the leaderboard publicly accessible
create policy "Anyone can view all websites"
  on public.websites for select
  using (true);

create policy "Anyone can view all metrics"
  on public.metrics for select
  using (true);

-- Note: Insert/Update/Delete policies remain restricted to authenticated users
-- who own the resources (these are already correctly configured)
