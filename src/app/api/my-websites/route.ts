import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Get current user's websites including original_site_url for matching
export async function GET() {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch only the current user's websites with site_hash for matching
    const { data: websites, error } = await supabase
      .from('websites')
      .select('id, site_hash, original_site_url, domain, anonymous')
      .eq('user_id', user.id)

    if (error) {
      throw error
    }

    return NextResponse.json({ data: websites || [] })
  } catch (error: any) {
    console.error('Error fetching user websites:', error)
    return NextResponse.json(
      { error: 'Failed to fetch websites', details: error.message },
      { status: 500 }
    )
  }
}
