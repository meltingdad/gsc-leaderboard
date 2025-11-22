-- GSC Leaderboard Database Schema
-- Run this in your Supabase SQL Editor

-- Create websites table
CREATE TABLE IF NOT EXISTS websites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  domain TEXT UNIQUE NOT NULL,
  site_url TEXT NOT NULL,
  anonymous BOOLEAN DEFAULT FALSE NOT NULL,
  original_site_url TEXT,
  site_hash TEXT,
  favicon_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create metrics table
CREATE TABLE IF NOT EXISTS metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID REFERENCES websites(id) ON DELETE CASCADE NOT NULL,
  total_clicks INTEGER DEFAULT 0,
  total_impressions INTEGER DEFAULT 0,
  average_ctr DECIMAL(5,2) DEFAULT 0,
  average_position DECIMAL(5,2) DEFAULT 0,
  date_range TEXT DEFAULT 'last_28_days',
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_websites_user_id ON websites(user_id);
CREATE INDEX IF NOT EXISTS idx_websites_domain ON websites(domain);
CREATE INDEX IF NOT EXISTS idx_websites_anonymous ON websites(anonymous);
CREATE INDEX IF NOT EXISTS idx_websites_original_site_url ON websites(original_site_url);
CREATE INDEX IF NOT EXISTS idx_websites_site_hash ON websites(site_hash);
CREATE INDEX IF NOT EXISTS idx_websites_favicon_url ON websites(favicon_url) WHERE favicon_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_metrics_website_id ON metrics(website_id);
CREATE INDEX IF NOT EXISTS idx_metrics_last_updated ON metrics(last_updated DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for websites
CREATE POLICY "Users can view all websites"
  ON websites FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own websites"
  ON websites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own websites"
  ON websites FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own websites"
  ON websites FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for metrics
CREATE POLICY "Users can view all metrics"
  ON metrics FOR SELECT
  USING (true);

CREATE POLICY "Users can insert metrics for their own websites"
  ON metrics FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM websites
      WHERE websites.id = metrics.website_id
      AND websites.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update metrics for their own websites"
  ON metrics FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM websites
      WHERE websites.id = metrics.website_id
      AND websites.user_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_websites_updated_at
  BEFORE UPDATE ON websites
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create a view for leaderboard with latest metrics
CREATE OR REPLACE VIEW leaderboard AS
SELECT
  w.id,
  w.domain,
  w.site_url,
  w.anonymous,
  w.favicon_url,
  m.total_clicks,
  m.total_impressions,
  m.average_ctr,
  m.average_position,
  m.last_updated,
  ROW_NUMBER() OVER (ORDER BY m.total_clicks DESC) as rank
FROM websites w
LEFT JOIN LATERAL (
  SELECT * FROM metrics
  WHERE website_id = w.id
  ORDER BY last_updated DESC
  LIMIT 1
) m ON true
WHERE m.id IS NOT NULL
ORDER BY m.total_clicks DESC;
