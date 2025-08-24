import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { playerName, goals, assists, saves, won } = body

    // Validate input
    if (!playerName || goals < 0 || assists < 0 || saves < 0) {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 })
    }

    // Check if already submitted this week
    const weekStart = getWeekStart()
    
    const supabaseAdmin = getSupabaseAdmin()
    
    // Check if this specific player already submitted
    const { data: existing } = await supabaseAdmin
      .from('player_stats')
      .select('*')
      .gte('created_at', weekStart + 'T00:00:00')
    
    // Check if player already submitted by looking at team field
    const playerAlreadySubmitted = existing?.some(stat => 
      stat.team === playerName
    )
    
    if (playerAlreadySubmitted) {
      return NextResponse.json({ error: 'Already submitted this week' }, { status: 400 })
    }
    
    // Create unique single-character team ID for each player
    const playerTeamMap: { [key: string]: string } = {
      'Ahmed': 'A', 'Fasin': 'B', 'Hamsheed': 'C', 'Jalal': 'D', 'Shareef': 'E',
      'Shaheen': 'F', 'Emaad': 'G', 'Darwish': 'H', 'Luqman': 'I', 'Nabeel': 'J',
      'Jinish': 'K', 'Afzal': 'L', 'Rathul': 'M', 'Madan': 'N', 'Waleed': 'O',
      'Ahmed-Ateeq': 'P', 'Junaid': 'Q', 'Shafeer': 'R', 'Fathah': 'S', 'Nithin': 'T'
    }
    const assignedTeam = playerTeamMap[playerName] || 'Z'

    // Calculate points
    const points = (goals * 5) + (assists * 3) + (saves * 2) + (won ? 10 : 0)
    
    // Insert stats using service role (omit confirmed_by since it expects UUIDs)
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