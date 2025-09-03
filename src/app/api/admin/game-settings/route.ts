import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin, getActiveGameSettings, upsertGameSettings, getAllGameSettings } from '../../../../../lib/supabase'

export async function GET() {
  try {
    const activeSettings = await getActiveGameSettings()
    const allSettings = await getAllGameSettings()
    
    return NextResponse.json({
      success: true,
      activeSettings,
      allSettings
    })
  } catch (error) {
    console.error('Error fetching game settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch game settings' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { gameDate, submissionStart, submissionEnd } = body
    
    // Validate required fields
    if (!gameDate || !submissionStart || !submissionEnd) {
      return NextResponse.json(
        { error: 'Missing required fields: gameDate, submissionStart, submissionEnd' },
        { status: 400 }
      )
    }
    
    // Validate date formats and logic
    const gameDateObj = new Date(gameDate)
    const submissionStartObj = new Date(submissionStart)
    const submissionEndObj = new Date(submissionEnd)
    
    if (isNaN(gameDateObj.getTime()) || isNaN(submissionStartObj.getTime()) || isNaN(submissionEndObj.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      )
    }
    
    if (submissionStartObj >= submissionEndObj) {
      return NextResponse.json(
        { error: 'Submission start time must be before end time' },
        { status: 400 }
      )
    }
    
    // Upsert the game settings
    const success = await upsertGameSettings({
      game_date: gameDate,
      submission_start: submissionStart,
      submission_end: submissionEnd,
      is_active: true
    })
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to save game settings' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Game settings updated successfully'
    })
    
  } catch (error) {
    console.error('Error updating game settings:', error)
    return NextResponse.json(
      { error: 'Failed to update game settings' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    
    // Deactivate all active settings
    const { error } = await supabaseAdmin
      .from('game_settings')
      .update({ is_active: false })
      .eq('is_active', true)
    
    if (error) {
      console.error('Error deactivating game settings:', error)
      return NextResponse.json(
        { error: 'Failed to deactivate game settings' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'All game settings deactivated. System reverted to default Thursday schedule.'
    })
    
  } catch (error) {
    console.error('Error deactivating game settings:', error)
    return NextResponse.json(
      { error: 'Failed to deactivate game settings' },
      { status: 500 }
    )
  }
}