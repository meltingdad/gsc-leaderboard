import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { google } from 'googleapis'
import { extractDomain, cleanDomain } from '@/lib/utils/domain'

// Get all websites for leaderboard
export async function GET() {
  try {
    const supabase = await createClient()

    // Fetch all websites with their latest metrics
    // Note: Using LEFT JOIN to include websites even without metrics for debugging
    const { data: websites, error } = await supabase
      .from('websites')
      .select(`
        id,
        domain,
        site_url,
        user_id,
        anonymous,
        favicon_url,
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
      .order('last_updated', { foreignTable: 'metrics', ascending: false })

    if (error) {
      throw error
    }

    console.log(`Fetched ${websites?.length || 0} websites from database`)

    // Format data for leaderboard
    const leaderboardData = (websites || [])
      .map((website: any) => {
        // Get the latest metric (metrics are already ordered by last_updated desc in the query)
        const latestMetric = website.metrics?.[0]

        // Log websites without metrics for debugging
        if (!latestMetric) {
          console.warn('Website without metrics:', {
            id: website.id,
            domain: website.domain,
            site_url: website.site_url,
            user_id: website.user_id,
          })
          return null
        }

        return {
          id: website.id,
          domain: cleanDomain(website.domain),
          clicks: latestMetric.total_clicks,
          impressions: latestMetric.total_impressions,
          ctr: latestMetric.average_ctr,
          position: latestMetric.average_position,
          lastUpdated: latestMetric.last_updated,
          anonymous: website.anonymous || false,
          faviconUrl: website.favicon_url || null,
        }
      })
      .filter(Boolean)
      .sort((a: any, b: any) => (b?.clicks || 0) - (a?.clicks || 0))
      .map((entry: any, index: number) => ({
        ...entry,
        rank: index + 1,
      }))

    console.log(`Returning ${leaderboardData.length} websites with metrics to leaderboard`)

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

    const { siteUrl, anonymous = false } = await request.json()

    if (!siteUrl) {
      return NextResponse.json({ error: 'Site URL is required' }, { status: 400 })
    }

    // For anonymous sites, we'll use a UUID for domain/site_url
    // For public sites, extract the clean domain
    const domain = anonymous ? crypto.randomUUID() : extractDomain(siteUrl)
    const storedSiteUrl = anonymous ? crypto.randomUUID() : siteUrl

    // Fetch favicon for non-anonymous sites
    // Use Google's favicon service for reliability
    const faviconUrl = anonymous ? null : `https://www.google.com/s2/favicons?domain=${domain}&sz=32`

    // Generate hash for matching (used for both public and anonymous for consistency)
    const textEncoder = new TextEncoder()
    const hashData = textEncoder.encode(`${user.id}:${siteUrl}`)
    const hashBuffer = await crypto.subtle.digest('SHA-256', hashData)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const siteHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    // Check if website already exists (check by hash)
    const { data: existingWebsite } = await supabase
      .from('websites')
      .select('id')
      .eq('site_hash', siteHash)
      .maybeSingle()

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
    // For anonymous sites: do NOT store original_site_url (privacy requirement)
    // For public sites: store original_site_url for backwards compatibility
    const { data: website, error: websiteError } = await supabase
      .from('websites')
      .insert({
        user_id: user.id,
        domain,
        site_url: storedSiteUrl,
        site_hash: siteHash, // Hash-based matching for all sites
        original_site_url: anonymous ? null : siteUrl, // Only store for public sites
        anonymous,
        favicon_url: faviconUrl, // Favicon URL (NULL for anonymous sites)
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

// Remove a website from the leaderboard
export async function DELETE(request: Request) {
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

    // Generate hash for matching
    const textEncoder = new TextEncoder()
    const hashData = textEncoder.encode(`${user.id}:${siteUrl}`)
    const hashBuffer = await crypto.subtle.digest('SHA-256', hashData)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const siteHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    // Check if website exists and belongs to the user
    // Primary: use site_hash (works for both public and anonymous)
    // Fallback: use original_site_url or domain for backwards compatibility
    const cleanedDomain = extractDomain(siteUrl)
    const { data: websites, error: findError } = await supabase
      .from('websites')
      .select('id, user_id, domain')
      .or(`site_hash.eq.${siteHash},original_site_url.eq.${siteUrl},domain.eq.${cleanedDomain},domain.eq.${siteUrl},site_url.eq.${siteUrl}`)

    if (findError) {
      console.error('Error finding website:', findError)
      return NextResponse.json(
        { error: 'Database error', details: findError.message },
        { status: 500 }
      )
    }

    if (!websites || websites.length === 0) {
      console.error('Website not found. Searched for:', { cleanedDomain, siteUrl })
      return NextResponse.json(
        { error: 'Website not found on leaderboard' },
        { status: 404 }
      )
    }

    const website = websites[0]

    // Verify ownership
    if (website.user_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only remove your own websites' },
        { status: 403 }
      )
    }

    // Delete the website (metrics will be cascade deleted)
    const { error: deleteError } = await supabase
      .from('websites')
      .delete()
      .eq('id', website.id)

    if (deleteError) {
      throw deleteError
    }

    return NextResponse.json({
      success: true,
      message: 'Website removed from leaderboard successfully!',
    })
  } catch (error: any) {
    console.error('Error removing website:', error)
    return NextResponse.json(
      { error: 'Failed to remove website', details: error.message },
      { status: 500 }
    )
  }
}
