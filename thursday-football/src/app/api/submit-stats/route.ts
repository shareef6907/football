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
    
    // Map players to teams A and B only (constraint allows only A, B)
    const playerTeamMap: { [key: string]: string } = {
      // Team A (10 players)
      'Ahmed': 'A', 'Hamsheed': 'A', 'Shareef': 'A', 'Emaad': 'A', 'Luqman': 'A',
      'Jinish': 'A', 'Rathul': 'A', 'Waleed': 'A', 'Junaid': 'A', 'Fathah': 'A',
      // Team B (10 players)  
      'Fasin': 'B', 'Jalal': 'B', 'Shaheen': 'B', 'Darwish': 'B', 'Nabeel': 'B',
      'Afzal': 'B', 'Madan': 'B', 'Ahmed-Ateeq': 'B', 'Shafeer': 'B', 'Nithin': 'B'
    }
    const assignedTeam = playerTeamMap[playerName] || 'Z'

    // Check if this specific player already submitted
    console.log('API: Checking existing submissions for player:', playerName)
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('player_stats')
      .select('*')
      .gte('created_at', weekStart + 'T00:00:00')
      .eq('user_id', playerName)
    
    if (checkError) {
      console.error('API: Error checking existing submissions:', checkError)
      return NextResponse.json({ error: 'Database check error' }, { status: 500 })
    }
    
    console.log('API: Existing submissions found:', existing?.length || 0)
    
    // Check if player already submitted
    const playerAlreadySubmitted = existing && existing.length > 0
    
    if (playerAlreadySubmitted) {
      console.log('API: Player already submitted this week')
      return NextResponse.json({ error: 'Already submitted this week' }, { status: 400 })
    }
    
    // Calculate points
    const points = (goals * 5) + (assists * 3) + (saves * 2) + (won ? 10 : 0)
    console.log('API: Calculated points:', points)
    
    // Insert stats using service role (omit confirmed_by since it expects UUIDs)
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
        user_id: playerName // Use user_id field to store player name for identification
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
    return NextResponse.json({ success: true, data })
    
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