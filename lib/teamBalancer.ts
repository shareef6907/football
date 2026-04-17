import { PLAYERS, Position } from './constants'

interface PlayerWithRating {
  id: string
  name: string
  position: Position
  forwardRating: number
  midfielderRating: number
  defenderRating: number
  goalkeeperRating: number
}

// Generate a simple rating based on player ID (in production this would come from the database)
function getPlayerRatings(playerId: string): PlayerWithRating {
  const player = PLAYERS.find(p => p.id === playerId)
  if (!player) {
    return {
      id: playerId,
      name: 'Unknown',
      position: 'midfielder',
      forwardRating: 5,
      midfielderRating: 5,
      defenderRating: 5,
      goalkeeperRating: 5,
    }
  }
  
  // Generate pseudo-random but consistent ratings
  const seed = playerId.charCodeAt(0) + playerId.charCodeAt(playerId.length - 1)
  const random = (idx: number) => ((seed * (idx + 1) * 17) % 10) + 1
  
  return {
    id: player.id,
    name: player.name,
    position: player.position,
    forwardRating: player.position === 'forward' ? 8 + random(0) : random(1),
    midfielderRating: player.position === 'midfielder' ? 8 + random(2) : random(3),
    defenderRating: player.position === 'defender' ? 8 + random(4) : random(5),
    goalkeeperRating: player.position === 'goalkeeper' ? 8 + random(6) : random(7),
  }
}

function getOverallRating(player: PlayerWithRating): number {
  return Math.floor(
    (player.forwardRating + player.midfielderRating + player.defenderRating + player.goalkeeperRating) / 4
  )
}

export function autoBalanceTeams(
  playerIds: string[], 
  numTeams: number
): Map<number, PlayerWithRating[]> {
  const teams = new Map<number, PlayerWithRating[]>()
  
  // Initialize teams
  for (let i = 1; i <= numTeams; i++) {
    teams.set(i, [])
  }
  
  // Get players with ratings
  const playersWithRatings = playerIds.map(id => ({
    ...getPlayerRatings(id),
    overall: getOverallRating(getPlayerRatings(id)),
  }))
  
  // Sort by overall rating (descending)
  playersWithRatings.sort((a, b) => b.overall - a.overall)
  
  // Snake draft distribution for balance
  // Team 1 gets best, team 2 gets second best, etc, then reverse
  playerIds.forEach((playerId, index) => {
    const teamNum = calculateTeamInSnake(index, numTeams, playerIds.length)
    const team = teams.get(teamNum) || []
    team.push(playersWithRatings[index])
    teams.set(teamNum, team)
  })
  
  return teams
}

function calculateTeamInSnake(index: number, numTeams: number, totalPlayers: number): number {
  const round = Math.floor(index / numTeams)
  const positionInRound = index % numTeams
  
  if (round % 2 === 0) {
    return positionInRound + 1
  } else {
    return numTeams - positionInRound
  }
}

export function generateSnakeDraftOrder(numTeams: number, totalPlayers: number): number[] {
  const order: number[] = []
  
  for (let i = 0; i < totalPlayers; i++) {
    order.push(calculateTeamInSnake(i, numTeams, totalPlayers))
  }
  
  return order
}

export function getTopCaptains(
  playerIds: string[],
  numCaptains: number
): PlayerWithRating[] {
  const playersWithRatings = playerIds.map(id => ({
    ...getPlayerRatings(id),
    overall: getOverallRating(getPlayerRatings(id)),
  }))
  
  // Sort by overall rating
  playersWithRatings.sort((a, b) => b.overall - a.overall)
  
  // Return top N as captains
  return playersWithRatings.slice(0, numCaptains)
}