-- Add site_hash column for privacy-preserving matching
-- This allows duplicate detection and removal without storing the actual URL
-- The hash is SHA-256(user_id:siteUrl) for anonymous sites

alter table public.websites
add column if not exists site_hash text;

-- Add index for fast hash lookups
create index if not exists idx_websites_site_hash on public.websites(site_hash);

-- Make original_site_url nullable (keep for backwards compatibility with existing data)
-- New anonymous submissions will NOT use this column
alter table public.websites
alter column original_site_url drop not null;

-- Add comment
comment on column public.websites.site_hash is 'SHA-256 hash of user_id:siteUrl for privacy-preserving matching and duplicate detection';
