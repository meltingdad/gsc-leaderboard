import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { google } from 'googleapis'

// Get all websites for leaderboard
export async function GET() {
  try {
    const supabase = await createClient()

    // Fetch all websites with their latest metrics
    const { data: websites, error } = await supabase
      .from('websites')
      .select(`
        id,
        domain,
        site_url,
        user_id,
        metrics (
          id,
          total_clicks,
          total_impressions,
          average_ctr,
          average_position,
          last_updated
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    // Format data for leaderboard
    const leaderboardData = (websites || [])
      .map((website: any) => {
        // Get the latest metric (metrics are already ordered by last_updated desc in the query)
        const latestMetric = website.metrics?.[0]
        if (!latestMetric) return null

        return {
          id: website.id,
          domain: website.domain,
          clicks: latestMetric.total_clicks,
          impressions: latestMetric.total_impressions,
          ctr: latestMetric.average_ctr,
          position: latestMetric.average_position,
          lastUpdated: latestMetric.last_updated,
        }
      })
      .filter(Boolean)
      .sort((a: any, b: any) => (b?.clicks || 0) - (a?.clicks || 0))
      .map((entry: any, index: number) => ({
        ...entry,
        rank: index + 1,
      }))

    return NextResponse.json({ data: leaderboardData })
  } catch (error: any) {
    console.error('Error fetching leaderboard:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard', details: error.message },
      { status: 500 }
    )
  }
}

// Add a new website to the leaderboard
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { siteUrl } = await request.json()

    if (!siteUrl) {
      return NextResponse.json({ error: 'Site URL is required' }, { status: 400 })
    }

    // Extract domain from siteUrl
    const domain = siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')

    // Check if website already exists
    const { data: existingWebsite } = await supabase
      .from('websites')
      .select('id')
      .eq('domain', domain)
      .single()

    if (existingWebsite) {
      return NextResponse.json(
        { error: 'This website is already in the leaderboard' },
        { status: 409 }
      )
    }

    // Get user's Google tokens
    const { data: tokenData, error: tokenError } = await supabase
      .from('user_tokens')
      .select('google_access_token, google_refresh_token')
      .eq('user_id', user.id)
      .single()

    if (tokenError || !tokenData?.google_access_token) {
      return NextResponse.json(
        { error: 'No Google access token found. Please sign in with Google.' },
        { status: 400 }
      )
    }

    // Set up OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    )

    oauth2Client.setCredentials({
      access_token: tokenData.google_access_token,
      refresh_token: tokenData.google_refresh_token,
    })

    // Get Search Console service
    const searchconsole = google.webmasters({ version: 'v3', auth: oauth2Client })

    // Calculate date range (last 28 days)
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 28)

    const formatDate = (date: Date) => date.toISOString().split('T')[0]

    // Fetch metrics from Google Search Console
    const response = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        dimensions: [],
      },
    })

    const rows = response.data.rows || []
    const totalClicks = rows.reduce((sum, row) => sum + (row.clicks || 0), 0)
    const totalImpressions = rows.reduce((sum, row) => sum + (row.impressions || 0), 0)
    const averageCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
    const averagePosition =
      rows.length > 0
        ? rows.reduce((sum, row) => sum + (row.position || 0), 0) / rows.length
        : 0

    // Create website in database
    const { data: website, error: websiteError } = await supabase
      .from('websites')
      .insert({
        user_id: user.id,
        domain,
        site_url: siteUrl,
      })
      .select()
      .single()

    if (websiteError) {
      throw websiteError
    }

    // Create metrics for the website
    const { data: metrics, error: metricsError } = await supabase
      .from('metrics')
      .insert({
        website_id: website.id,
        total_clicks: totalClicks,
        total_impressions: totalImpressions,
        average_ctr: averageCtr,
        average_position: averagePosition,
        date_range: 'last_28_days',
        last_updated: new Date().toISOString(),
      })
      .select()
      .single()

    if (metricsError) {
      // Rollback: delete the website if metrics creation fails
      await supabase.from('websites').delete().eq('id', website.id)
      throw metricsError
    }

    return NextResponse.json({
      success: true,
      website: {
        ...website,
        metrics: [metrics],
      },
      message: 'Website added to leaderboard successfully!',
    })
  } catch (error: any) {
    console.error('Error adding website:', error)
    return NextResponse.json(
      { error: 'Failed to add website', details: error.message },
      { status: 500 }
    )
  }
}
