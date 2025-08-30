import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin, PLAYER_UUIDS } from '../../../../../lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('Admin API: Edit player stats request received')
    
    const body = await request.json()
    const { playerName, goals, assists, saves, won } = body

    console.log('Admin API: Request data:', { playerName, goals, assists, saves, won })

    // Validate input
    if (!playerName || goals < 0 || assists < 0 || saves < 0) {
      console.log('Admin API: Invalid input data')
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 })
    }

    console.log('Admin API: Getting Supabase admin client...')
    console.log('Admin API: Environment check - URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Present' : 'Missing')
    console.log('Admin API: Environment check - Service Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Present' : 'Missing')
    
    try {
      const supabaseAdmin = getSupabaseAdmin()
      console.log('Admin API: Supabase admin client created successfully')
    } catch (envError) {
      console.error('Admin API: Failed to create Supabase client:', envError)
      return NextResponse.json({ 
        error: 'Configuration error', 
        details: envError instanceof Error ? envError.message : 'Unknown error'
      }, { status: 500 })
    }
    
    const supabaseAdmin = getSupabaseAdmin()
    
    // Get player UUID
    const playerUUID = PLAYER_UUIDS[playerName]
    console.log('Admin API: Player UUID lookup:', { playerName, playerUUID })
    if (!playerUUID) {
      console.log('Admin API: Invalid player name:', playerName)
      console.log('Admin API: Available players:', Object.keys(PLAYER_UUIDS))
      return NextResponse.json({ error: 'Invalid player name' }, { status: 400 })
    }

    // Get current week start (Thursday 6PM Bahrain time)
    const getWeekStart = () => {
      const now = new Date()
      const bahrainTime = new Date(now.getTime() + (3 * 60 * 60 * 1000))
      const thursday = new Date(bahrainTime)
      thursday.setDate(bahrainTime.getDate() - bahrainTime.getDay() + 4)
      thursday.setHours(18, 0, 0, 0)
      if (bahrainTime < thursday) {
        thursday.setDate(thursday.getDate() - 7)
      }
      const utcThursday = new Date(thursday.getTime() - (3 * 60 * 60 * 1000))
      return utcThursday.toISOString().split('T')[0]
    }

    const weekStart = getWeekStart()
    console.log('Admin API: Current week start:', weekStart)

    // Calculate points
    const points = (goals * 5) + (assists * 3) + (saves * 2) + (won ? 10 : 0)
    console.log('Admin API: Calculated points:', points)

    // Check if player has existing stats this week
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('player_stats')
      .select('*')
      .gte('created_at', weekStart + 'T00:00:00')
      .contains('confirmed_by', [playerUUID])

    if (checkError) {
      console.error('Admin API: Error checking existing stats:', checkError)
      return NextResponse.json({ 
        error: 'Database check error', 
        details: checkError.message 
      }, { status: 500 })
    }

    let result
    if (existing && existing.length > 0) {
      // Update existing stats
      console.log('Admin API: Updating existing stats...')
      const { data, error } = await supabaseAdmin
        .from('player_stats')
        .update({
          goals,
          assists,
          saves,
          points_earned: points
        })
        .eq('id', existing[0].id)
        .select()

      if (error) {
        console.error('Admin API: Error updating stats:', error)
        return NextResponse.json({ 
          error: 'Failed to update stats', 
          details: error.message,
          code: error.code,
          hint: error.hint
        }, { status: 500 })
      }
      result = data
    } else {
      // Create new stats entry
      console.log('Admin API: Creating new stats entry...')
      const { data, error } = await supabaseAdmin
        .from('player_stats')
        .insert({
          goals,
          assists,
          saves,
          points_earned: points,
          team: 'A', // Default team
          verification_count: 1,
          verified: true,
          confirmed_by: [playerUUID]
        })
        .select()

      if (error) {
        console.error('Admin API: Error creating stats:', error)
        return NextResponse.json({ 
          error: 'Failed to create stats', 
          details: error.message,
          code: error.code,
          hint: error.hint
        }, { status: 500 })
      }
      result = data
    }
    
    console.log('Admin API: Player stats updated successfully!')
    return NextResponse.json({ 
      success: true, 
      data: result,
      message: `Stats updated for ${playerName}`,
      action: existing && existing.length > 0 ? 'updated' : 'created'
    })
    
  } catch (error) {
    console.error('Admin API: Unexpected error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET endpoint to fetch current week stats for a player
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const playerName = searchParams.get('playerName')

    if (!playerName) {
      return NextResponse.json({ error: 'Player name required' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()
    const playerUUID = PLAYER_UUIDS[playerName]
    
    if (!playerUUID) {
      return NextResponse.json({ error: 'Invalid player name' }, { status: 400 })
    }

    // Get current week start
    const getWeekStart = () => {
      const now = new Date()
      const bahrainTime = new Date(now.getTime() + (3 * 60 * 60 * 1000))
      const thursday = new Date(bahrainTime)
      thursday.setDate(bahrainTime.getDate() - bahrainTime.getDay() + 4)
      thursday.setHours(18, 0, 0, 0)
      if (bahrainTime < thursday) {
        thursday.setDate(thursday.getDate() - 7)
      }
      const utcThursday = new Date(thursday.getTime() - (3 * 60 * 60 * 1000))
      return utcThursday.toISOString().split('T')[0]
    }

    const weekStart = getWeekStart()

    const { data, error } = await supabaseAdmin
      .from('player_stats')
      .select('*')
      .gte('created_at', weekStart + 'T00:00:00')
      .contains('confirmed_by', [playerUUID])
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Admin API: Error fetching current stats:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch stats', 
        details: error.message 
      }, { status: 500 })
    }

    // Return current stats or default values
    const currentStats = data ? {
      goals: data.goals,
      assists: data.assists,
      saves: data.saves,
      won: data.points_earned > ((data.goals * 5) + (data.assists * 3) + (data.saves * 2)),
      points: data.points_earned,
      hasSubmitted: true
    } : {
      goals: 0,
      assists: 0,
      saves: 0,
      won: false,
      points: 0,
      hasSubmitted: false
    }

    return NextResponse.json({ 
      success: true, 
      playerName,
      currentStats 
    })
    
  } catch (error) {
    console.error('Admin API: Error fetching player stats:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}