import { NextRequest, NextResponse } from 'next/server'
import { editPlayerStats, PLAYER_UUIDS } from '../../../lib/local-db-admin'

function getWeekStart(): string {
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

export async function POST(request: NextRequest) {
  try {
    console.log('Admin API: Edit player stats request received (local mode)')
    
    const body = await request.json()
    const { playerName, goals, assists, saves, won } = body

    if (!playerName || goals < 0 || assists < 0 || saves < 0) {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 })
    }

    const playerUUID = PLAYER_UUIDS[playerName]
    if (!playerUUID) {
      return NextResponse.json({ error: 'Invalid player name' }, { status: 400 })
    }

    const points = (goals * 5) + (assists * 3) + (saves * 2) + (won ? 10 : 0)
    
    const success = await editPlayerStats(playerName, {
      goals,
      assists,
      saves,
      points_earned: points
    })
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to update stats' }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Stats updated for ${playerName}`
    })
    
  } catch (error) {
    console.error('Admin API: Unexpected error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const playerName = searchParams.get('playerName')

    if (!playerName) {
      return NextResponse.json({ error: 'Player name required' }, { status: 400 })
    }

    const playerUUID = PLAYER_UUIDS[playerName]
    if (!playerUUID) {
      return NextResponse.json({ error: 'Invalid player name' }, { status: 400 })
    }

    // Return default stats (local DB doesn't track weekly submissions the same way)
    return NextResponse.json({ 
      success: true, 
      playerName,
      currentStats: {
        goals: 0,
        assists: 0,
        saves: 0,
        won: false,
        points: 0,
        hasSubmitted: false
      }
    })
    
  } catch (error) {
    console.error('Admin API: Error fetching player stats:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}