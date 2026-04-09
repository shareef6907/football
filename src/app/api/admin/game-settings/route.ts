import { NextRequest, NextResponse } from 'next/server'
import { getActiveGameSettings, getAllGameSettings, updateGameSettings, getGameSettings } from '../../../../lib/local-db-admin'

export async function GET() {
  try {
    const activeSettings = await getActiveGameSettings()
    const allSettings = await getGameSettings()
    
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
    
    if (!gameDate || !submissionStart || !submissionEnd) {
      return NextResponse.json(
        { error: 'Missing required fields: gameDate, submissionStart, submissionEnd' },
        { status: 400 }
      )
    }
    
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
    
    const success = await updateGameSettings({
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
    // Deactivate all active settings
    const success = await updateGameSettings({
      game_date: '',
      submission_start: '',
      submission_end: '',
      is_active: false
    })
    
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