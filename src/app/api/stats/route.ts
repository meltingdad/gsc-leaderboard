import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cleanDomain } from '@/lib/utils/domain'

export async function GET() {
  try {
    const supabase = await createClient()

    // Get total websites count
    const { count: totalSites, error: sitesError } = await supabase
      .from('websites')
      .select('*', { count: 'exact', head: true })

    if (sitesError) throw sitesError

    // Get total clicks and count of metrics
    const { data: metricsData, error: metricsError } = await supabase
      .from('metrics')
      .select('total_clicks, total_impressions, website_id')

    if (metricsError) throw metricsError

    const totalClicks = metricsData?.reduce((sum, m) => sum + (m.total_clicks || 0), 0) || 0
    const totalImpressions = metricsData?.reduce((sum, m) => sum + (m.total_impressions || 0), 0) || 0

    // Get active players (unique users with websites)
    const { data: activePlayersData, error: playersError } = await supabase
      .from('websites')
      .select('user_id')

    if (playersError) throw playersError

    const uniqueUsers = new Set(activePlayersData?.map(w => w.user_id) || [])
    const activePlayers = uniqueUsers.size

    // Get top performer with latest metrics
    const { data: websites, error: topError } = await supabase
      .from('websites')
      .select(`
        id,
        domain,
        site_url,
        anonymous,
        favicon_url,
        metrics (
          total_clicks,
          total_impressions,
          average_ctr,
          average_position,
          last_updated
        )
      `)
      .order('created_at', { ascending: false })

    if (topError) throw topError

    // Find the website with the most clicks from latest metrics
    let topPerformer = null
    let maxClicks = 0

    websites?.forEach((website: any) => {
      const latestMetric = website.metrics?.[0]
      if (latestMetric && latestMetric.total_clicks > maxClicks) {
        maxClicks = latestMetric.total_clicks
        topPerformer = {
          domain: cleanDomain(website.domain),
          clicks: latestMetric.total_clicks,
          impressions: latestMetric.total_impressions,
          ctr: latestMetric.average_ctr,
          position: latestMetric.average_position,
          lastUpdated: latestMetric.last_updated,
          anonymous: website.anonymous || false,
          faviconUrl: website.favicon_url || null,
        }
      }
    })

    return NextResponse.json({
      totalSites: totalSites || 0,
      totalClicks,
      totalImpressions,
      activePlayers,
      topPerformer,
    })
  } catch (error: any) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats', details: error.message },
      { status: 500 }
    )
  }
}
