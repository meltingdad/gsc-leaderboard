import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { google } from 'googleapis'

export async function GET() {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's Google tokens from database
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

    // Fetch user's sites
    const response = await searchconsole.sites.list()

    return NextResponse.json({ sites: response.data.siteEntry || [] })
  } catch (error: any) {
    console.error('Error fetching GSC sites:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sites', details: error.message },
      { status: 500 }
    )
  }
}
