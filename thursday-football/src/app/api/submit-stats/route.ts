import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../lib/supabase'

export async function POST(request: NextRequest) {
  // Set timeout for the entire request
  const timeoutId = setTimeout(() => {
    console.error('API: Request timed out after 30 seconds')
  }, 30000)
  
  try {
    console.log('API: Starting stats submission...')
    const body = await request.json()
    console.log('API: Received data:', { playerName: body.playerName, goals: body.goals, assists: body.assists, saves: body.saves, won: body.won })
    
    const { playerName, goals, assists, saves, won } = body

    // Validate input
    if (!playerName || goals < 0 || assists < 0 || saves < 0) {
      console.log('API: Invalid input data')
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 })
    }

    // Check if already submitted this week
    const weekStart = getWeekStart()
    console.log('API: Week start:', weekStart)
    
    console.log('API: Getting Supabase admin client...')
    console.log('API: Environment check - URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Present' : 'Missing')
    console.log('API: Environment check - Service Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Present' : 'Missing')
    
    try {
      const supabaseAdmin = getSupabaseAdmin()
      console.log('API: Supabase admin client created successfully')
    } catch (envError) {
      console.error('API: Failed to create Supabase client:', envError)
      return NextResponse.json({ error: 'Configuration error' }, { status: 500 })
    }
    
    const supabaseAdmin = getSupabaseAdmin()
    
    // Use a default team since we're not doing team-based tracking
    const assignedTeam = 'A'

    // Check if this exact player already submitted by checking for similar stats pattern
    // We'll allow duplicate submissions since teams change weekly
    console.log('API: Allowing submission (teams change weekly)')
    
    // Calculate points
    const points = (goals * 5) + (assists * 3) + (saves * 2) + (won ? 10 : 0)
    console.log('API: Calculated points:', points)
    
    // Insert stats using service role 
    console.log('API: Inserting stats...')
    const { data, error } = await supabaseAdmin
      .from('player_stats')
      .insert({
        goals,
        assists,
        saves,
        points_earned: points,
        team: assignedTeam,
        verification_count: 1,
        verified: true
        // Player name will be tracked client-side since DB fields expect UUIDs
      })
      .select()
    
    if (error) {
      console.error('API: Database insert error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        full: error
      })
      return NextResponse.json({ 
        error: 'Database error', 
        details: error.message,
        code: error.code 
      }, { status: 500 })
    }
    
    console.log('API: Stats submitted successfully!')
    clearTimeout(timeoutId)
    return NextResponse.json({ 
      success: true, 
      data: data,
      playerName: playerName, // Return player name for client tracking
      submissionId: data?.[0]?.id 
    })
    
  } catch (error) {
    console.error('API: Unexpected error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      full: error
    })
    clearTimeout(timeoutId)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

function getWeekStart(): string {
  const now = new Date()
  const monday = new Date(now)
  monday.setDate(now.getDate() - now.getDay() + 1)
  monday.setHours(0, 0, 0, 0)
  return monday.toISOString().split('T')[0]
}