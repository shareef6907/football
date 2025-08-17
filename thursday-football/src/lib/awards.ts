// Award system for Thursday Football
// Manages monthly and quarterly awards with permanent badges

export interface PlayerAwards {
  playerName: string
  ballonDor: number // Count of Ballon d'Or awards (every 4 months)
  goldenBoot: number // Count of Golden Boot awards (every 4 months) 
  monthlyTopScorer: number // Count of monthly top scorer awards
  monthlyTopAssists: number // Count of monthly top assists awards
  monthlyTopKeeper: number // Count of monthly top keeper awards
}

export interface QuarterlyAwards {
  ballonDor: string // Player name
  goldenBoot: string // Player name
  quarter: string // e.g., "Q1 2025"
  date: string
}

export interface MonthlyAwards {
  topScorer: string
  topAssists: string
  topKeeper: string
  month: string
  date: string
}

// Get all permanent badges for a player
export function getPlayerBadges(playerName: string): string[] {
  const badges: string[] = []
  
  // Get permanent awards from localStorage
  const permanentAwards = localStorage.getItem('permanentPlayerAwards')
  if (permanentAwards) {
    const awards = JSON.parse(permanentAwards)
    const playerAward = awards[playerName] as PlayerAwards
    
    if (playerAward) {
      // Add badges based on award counts
      if (playerAward.ballonDor > 0) {
        badges.push(`⚽️🏆×${playerAward.ballonDor}`) // Golden Ball with count
      }
      if (playerAward.goldenBoot > 0) {
        badges.push(`👟×${playerAward.goldenBoot}`) // Golden Boot with count
      }
      if (playerAward.monthlyTopScorer > 0) {
        badges.push(`⚽`) // Football for monthly top scorer
      }
      if (playerAward.monthlyTopAssists > 0) {
        badges.push(`🥇`) // Gold medal for monthly assists
      }
      if (playerAward.monthlyTopKeeper > 0) {
        badges.push(`🧤`) // Gloves for monthly keeper
      }
    }
  }
  
  return badges
}

// Award Ballon d'Or (called every 4 months)
export function awardBallonDor(playerName: string) {
  const awards = localStorage.getItem('permanentPlayerAwards')
  const allAwards = awards ? JSON.parse(awards) : {}
  
  if (!allAwards[playerName]) {
    allAwards[playerName] = {
      playerName,
      ballonDor: 0,
      goldenBoot: 0,
      monthlyTopScorer: 0,
      monthlyTopAssists: 0,
      monthlyTopKeeper: 0
    }
  }
  
  allAwards[playerName].ballonDor += 1
  localStorage.setItem('permanentPlayerAwards', JSON.stringify(allAwards))
  
  // Save quarterly award record
  const quarterlyAwards = localStorage.getItem('quarterlyAwards')
  const allQuarterly = quarterlyAwards ? JSON.parse(quarterlyAwards) : []
  
  const now = new Date()
  const quarter = `Q${Math.ceil((now.getMonth() + 1) / 3)} ${now.getFullYear()}`
  
  allQuarterly.push({
    ballonDor: playerName,
    quarter,
    date: now.toISOString()
  })
  
  localStorage.setItem('quarterlyAwards', JSON.stringify(allQuarterly))
}

// Award Golden Boot (called every 4 months)
export function awardGoldenBoot(playerName: string) {
  const awards = localStorage.getItem('permanentPlayerAwards')
  const allAwards = awards ? JSON.parse(awards) : {}
  
  if (!allAwards[playerName]) {
    allAwards[playerName] = {
      playerName,
      ballonDor: 0,
      goldenBoot: 0,
      monthlyTopScorer: 0,
      monthlyTopAssists: 0,
      monthlyTopKeeper: 0
    }
  }
  
  allAwards[playerName].goldenBoot += 1
  localStorage.setItem('permanentPlayerAwards', JSON.stringify(allAwards))
}

// Award monthly badges
export function awardMonthlyBadge(playerName: string, type: 'topScorer' | 'topAssists' | 'topKeeper') {
  const awards = localStorage.getItem('permanentPlayerAwards')
  const allAwards = awards ? JSON.parse(awards) : {}
  
  if (!allAwards[playerName]) {
    allAwards[playerName] = {
      playerName,
      ballonDor: 0,
      goldenBoot: 0,
      monthlyTopScorer: 0,
      monthlyTopAssists: 0,
      monthlyTopKeeper: 0
    }
  }
  
  if (type === 'topScorer') {
    allAwards[playerName].monthlyTopScorer += 1
  } else if (type === 'topAssists') {
    allAwards[playerName].monthlyTopAssists += 1
  } else if (type === 'topKeeper') {
    allAwards[playerName].monthlyTopKeeper += 1
  }
  
  localStorage.setItem('permanentPlayerAwards', JSON.stringify(allAwards))
}

// Check if it's time for quarterly awards (every 4 months)
export function shouldAwardQuarterly(): boolean {
  const now = new Date()
  const month = now.getMonth() + 1
  
  // Award at the end of months 4, 8, 12 (April, August, December)
  // Check if we're in the last week of these months
  if ([4, 8, 12].includes(month)) {
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const daysUntilEnd = lastDayOfMonth.getDate() - now.getDate()
    return daysUntilEnd <= 7 // Last week of the quarter
  }
  
  return false
}

// Calculate Ballon d'Or winner based on overall performance
export function calculateBallonDor(playerStats: any[]): string | null {
  if (!playerStats || playerStats.length === 0) return null
  
  // Calculate comprehensive score for each player
  const scores = playerStats.map(player => {
    // Weighted scoring system for Ballon d'Or
    const goalScore = (player.goals || 0) * 5
    const assistScore = (player.assists || 0) * 3
    const saveScore = (player.saves || 0) * 2
    const winScore = (player.wins || 0) * 4
    const ratingScore = (player.rating || 5) * 10
    const gamesScore = (player.gamesPlayed || 0) * 2
    
    // Calculate win rate bonus
    const winRate = player.gamesPlayed > 0 ? (player.wins / player.gamesPlayed) : 0
    const winRateBonus = winRate * 20
    
    // Total comprehensive score
    const totalScore = goalScore + assistScore + saveScore + winScore + ratingScore + gamesScore + winRateBonus
    
    return {
      name: player.name,
      score: totalScore,
      goals: player.goals || 0
    }
  })
  
  // Sort by total score
  scores.sort((a, b) => b.score - a.score)
  
  // Return the winner
  return scores[0]?.name || null
}

// Get Golden Boot winner (highest goal scorer)
export function calculateGoldenBoot(playerStats: any[]): string | null {
  if (!playerStats || playerStats.length === 0) return null
  
  const topScorer = [...playerStats].sort((a, b) => (b.goals || 0) - (a.goals || 0))[0]
  return topScorer?.name || null
}