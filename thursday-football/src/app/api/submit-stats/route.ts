import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin, PLAYER_UUIDS } from '../../../../lib/supabase'

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
    
    // Get player UUID for tracking
    const playerUUID = PLAYER_UUIDS[playerName]
    if (!playerUUID) {
      console.log('API: Invalid player name:', playerName)
      return NextResponse.json({ error: 'Invalid player name' }, { status: 400 })
    }
    
    // Use a default team since we're not doing team-based tracking
    const assignedTeam = 'A'

    // Check if this player already submitted this week
    console.log('API: Checking existing submissions for player:', playerName)
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('player_stats')
      .select('*')
      .gte('created_at', weekStart + 'T00:00:00')
      .contains('confirmed_by', [playerUUID])
    
    if (checkError) {
      console.error('API: Error checking existing submissions:', checkError)
      return NextResponse.json({ error: 'Database check error' }, { status: 500 })
    }
    
    if (existing && existing.length > 0) {
      console.log('API: Player already submitted this week')
      return NextResponse.json({ error: 'Already submitted this week' }, { status: 400 })
    }
    
    // Calculate points
    const points = (goals * 5) + (assists * 3) + (saves * 2) + (won ? 10 : 0)
    console.log('API: Calculated points:', points)
    
    // Insert stats using service role with player UUID in confirmed_by
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
        verified: true,
        confirmed_by: [playerUUID] // Store player UUID for cross-device tracking
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
  
  // Convert to Bahrain time (UTC+3)
  const bahrainTime = new Date(now.getTime() + (3 * 60 * 60 * 1000))
  
  // Get this week's Thursday at 6PM
  const thursday = new Date(bahrainTime)
  thursday.setDate(bahrainTime.getDate() - bahrainTime.getDay() + 4) // This week's Thursday
  thursday.setHours(18, 0, 0, 0) // 6PM
  
  // If it's before Thursday 6PM, use previous Thursday 6PM
  if (bahrainTime < thursday) {
    thursday.setDate(thursday.getDate() - 7)
  }
  
  // Convert back to UTC and return ISO date
  const utcThursday = new Date(thursday.getTime() - (3 * 60 * 60 * 1000))
  return utcThursday.toISOString().split('T')[0]
}