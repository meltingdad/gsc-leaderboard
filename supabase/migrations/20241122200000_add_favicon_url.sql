-- Add favicon_url column to websites table
-- This stores the URL to the website's favicon for non-anonymous sites
-- Anonymous sites will have NULL favicon_url for privacy

alter table public.websites
add column if not exists favicon_url text;

-- Add index for potential filtering or performance
create index if not exists idx_websites_favicon_url on public.websites(favicon_url) where favicon_url is not null;

-- Add comment
comment on column public.websites.favicon_url is 'URL to the website favicon (NULL for anonymous sites)';
