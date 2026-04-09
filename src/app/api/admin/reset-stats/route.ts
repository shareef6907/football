import { NextRequest, NextResponse } from 'next/server'
import { resetAllStats, resetWeeklyStats } from '../../../../lib/local-db-admin'

export async function POST(request: NextRequest) {
  try {
    console.log('Admin API: Reset stats request received (local mode)')
    
    const body = await request.json()
    const { action } = body

    if (!['reset_all', 'reset_weekly'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    if (action === 'reset_all') {
      console.log('Admin API: Deleting all player stats...')
      const success = await resetAllStats()
      
      if (!success) {
        return NextResponse.json({ error: 'Failed to reset stats' }, { status: 500 })
      }
      
      console.log('Admin API: All stats successfully reset')
      return NextResponse.json({ 
        success: true, 
        message: 'All player stats have been reset to 0' 
      })
      
    } else if (action === 'reset_weekly') {
      console.log('Admin API: Deleting current week stats only...')
      const success = await resetWeeklyStats()
      
      if (!success) {
        return NextResponse.json({ error: 'Failed to reset weekly stats' }, { status: 500 })
      }
      
      console.log('Admin API: Current week stats successfully reset')
      return NextResponse.json({ 
        success: true, 
        message: 'Current week stats have been reset. Historical data preserved.' 
      })
    }
    
  } catch (error) {
    console.error('Admin API: Unexpected error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}