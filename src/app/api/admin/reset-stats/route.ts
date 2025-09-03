import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../../lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('Admin API: Reset stats request received')
    
    const body = await request.json()
    const { action } = body

    if (!['reset_all', 'reset_weekly'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    console.log('Admin API: Getting Supabase admin client...')
    const supabaseAdmin = getSupabaseAdmin()
    
    if (action === 'reset_all') {
      // Delete all player stats
      console.log('Admin API: Deleting all player stats...')
      const { error } = await supabaseAdmin
        .from('player_stats')
        .delete()
        .not('id', 'is', null) // Delete all records
      
      if (error) {
        console.error('Admin API: Error deleting stats:', error)
        return NextResponse.json({ 
          error: 'Failed to reset stats', 
          details: error.message 
        }, { status: 500 })
      }
      
      console.log('Admin API: All stats successfully reset')
      return NextResponse.json({ 
        success: true, 
        message: 'All player stats have been reset to 0' 
      })
      
    } else if (action === 'reset_weekly') {
      // Get current week start (Thursday 8PM to next Wednesday 11:59PM)
      const getCurrentWeekRange = () => {
        const now = new Date()
        const currentDay = now.getDay()
        const currentHour = now.getHours()
        
        // Thursday is day 4
        let weekStart = new Date(now)
        
        if (currentDay < 4 || (currentDay === 4 && currentHour < 20)) {
          // Before this week's Thursday 8PM, so current week starts last Thursday
          const daysToLastThursday = currentDay + 3
          weekStart.setDate(now.getDate() - daysToLastThursday)
        } else {
          // After this week's Thursday 8PM, current week is this Thursday
          const daysToThursday = currentDay - 4
          weekStart.setDate(now.getDate() - daysToThursday)
        }
        
        weekStart.setHours(20, 0, 0, 0) // Thursday 8PM
        
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6) // Next Wednesday
        weekEnd.setHours(23, 59, 59, 999) // 11:59:59 PM
        
        return { start: weekStart, end: weekEnd }
      }
      
      const { start: weekStart, end: weekEnd } = getCurrentWeekRange()
      
      console.log('Admin API: Deleting current week stats only...')
      console.log('Week range:', weekStart.toISOString(), 'to', weekEnd.toISOString())
      
      const { error } = await supabaseAdmin
        .from('player_stats')
        .delete()
        .gte('created_at', weekStart.toISOString())
        .lte('created_at', weekEnd.toISOString())
      
      if (error) {
        console.error('Admin API: Error deleting weekly stats:', error)
        return NextResponse.json({ 
          error: 'Failed to reset weekly stats', 
          details: error.message 
        }, { status: 500 })
      }
      
      console.log('Admin API: Current week stats successfully reset')
      return NextResponse.json({ 
        success: true, 
        message: `Current week stats (${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}) have been reset. Historical data preserved.` 
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