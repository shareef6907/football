import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../lib/supabase'

export async function POST(request: NextRequest) {
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
    
    // Create unique single-character team ID for each player
    const playerTeamMap: { [key: string]: string } = {
      'Ahmed': 'A', 'Fasin': 'B', 'Hamsheed': 'C', 'Jalal': 'D', 'Shareef': 'E',
      'Shaheen': 'F', 'Emaad': 'G', 'Darwish': 'H', 'Luqman': 'I', 'Nabeel': 'J',
      'Jinish': 'K', 'Afzal': 'L', 'Rathul': 'M', 'Madan': 'N', 'Waleed': 'O',
      'Ahmed-Ateeq': 'P', 'Junaid': 'Q', 'Shafeer': 'R', 'Fathah': 'S', 'Nithin': 'T'
    }
    const assignedTeam = playerTeamMap[playerName] || 'Z'

    // Check if this specific player already submitted
    console.log('API: Checking existing submissions for team:', assignedTeam)
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('player_stats')
      .select('*')
      .gte('created_at', weekStart + 'T00:00:00')
      .eq('team', assignedTeam)
    
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
        verified: true
      })
      .select()
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }
    
    return NextResponse.json({ success: true, data })
    
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getWeekStart(): string {
  const now = new Date()
  const monday = new Date(now)
  monday.setDate(now.getDate() - now.getDay() + 1)
  monday.setHours(0, 0, 0, 0)
  return monday.toISOString().split('T')[0]
}