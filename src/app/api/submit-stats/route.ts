import { NextRequest, NextResponse } from 'next/server'
import { submitPlayerStats, hasPlayerSubmittedThisWeek, PLAYER_UUIDS, getWeekStart } from '../../../../lib/local-db'

// Replicate getWeekStart for API compatibility
function getAPIWeekStart(): string {
  const now = new Date()
  const bahrainTime = new Date(now.getTime() + (3 * 60 * 60 * 1000))
  const thursday = new Date(bahrainTime)
  thursday.setDate(bahrainTime.getDate() - bahrainTime.getDay() + 4)
  thursday.setHours(18, 0, 0, 0)
  if (bahrainTime < thursday) {
    thursday.setDate(thursday.getDate() - 7)
  }
  return new Date(thursday.getTime() - (3 * 60 * 60 * 1000)).toISOString().split('T')[0]
}

export async function POST(request: NextRequest) {
  const timeoutId = setTimeout(() => {
    console.error('API: Request timed out after 30 seconds')
  }, 30000)
  
  try {
    console.log('API: Starting stats submission (local mode)...')
    const body = await request.json()
    console.log('API: Received data:', { playerName: body.playerName, goals: body.goals, assists: body.assists, saves: body.saves, won: body.won })
    
    const { playerName, goals, assists, saves, won } = body

    // Validate input
    if (!playerName || goals < 0 || assists < 0 || saves < 0) {
      console.log('API: Invalid input data')
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 })
    }

    // Check if player exists
    const playerUUID = PLAYER_UUIDS[playerName]
    if (!playerUUID) {
      console.log('API: Invalid player name:', playerName)
      return NextResponse.json({ error: 'Invalid player name' }, { status: 400 })
    }

    // Check if already submitted this week
    const hasSubmitted = await hasPlayerSubmittedThisWeek(playerName)
    if (hasSubmitted) {
      console.log('API: Player already submitted this week')
      return NextResponse.json({ error: 'Already submitted this week' }, { status: 400 })
    }

    // Submit stats to local database
    const success = await submitPlayerStats(playerName, {
      goals,
      assists,
      saves,
      won,
      game_date: getAPIWeekStart()
    })
    
    if (!success) {
      console.error('API: Failed to submit stats')
      return NextResponse.json({ error: 'Failed to submit stats' }, { status: 500 })
    }
    
    console.log('API: Stats submitted successfully!')
    clearTimeout(timeoutId)
    return NextResponse.json({ 
      success: true, 
      playerName: playerName
    })
    
  } catch (error) {
    console.error('API: Unexpected error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    clearTimeout(timeoutId)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}