import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../../lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('Admin API: Reset stats request received')
    
    const body = await request.json()
    const { action } = body

    if (action !== 'reset_all') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    console.log('Admin API: Getting Supabase admin client...')
    const supabaseAdmin = getSupabaseAdmin()
    
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
    
  } catch (error) {
    console.error('Admin API: Unexpected error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}