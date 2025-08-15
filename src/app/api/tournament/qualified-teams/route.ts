import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Check if all group stage matches are completed
    const incompleteGroupMatches = await prisma.match.count({
      where: {
        matchType: 'GROUP_STAGE',
        status: { not: 'COMPLETED' }
      }
    })

    if (incompleteGroupMatches > 0) {
      return NextResponse.json(
        { error: `${incompleteGroupMatches} group stage matches are still incomplete` },
        { status: 400 }
      )
    }

    // Get qualified teams using the same logic as the knockout generation
    const qualificationResult = await getQualifiedTeams()

    return NextResponse.json({
      qualifiedTeams: qualificationResult.qualifiedTeams,
      thirdPlaceTeams: qualificationResult.thirdPlaceTeams,
      needsTieBreak: qualificationResult.needsTieBreak,
      tiedTeams: qualificationResult.tiedTeams
    })

  } catch (error) {
    console.error('Error fetching qualified teams:', error)
    return NextResponse.json(
      { error: 'Failed to fetch qualified teams' },
      { status: 500 }
    )
  }
}

async function getQualifiedTeams() {
  // Get all tables with their teams and stats
  const tables = await prisma.tournamentTable.findMany({
    include: {
      teams: true
    },
    orderBy: { name: 'asc' }
  })

  // Sort teams within each table using the same logic as standings
  const tablesWithSortedTeams = await Promise.all(tables.map(async table => {
    // Get all completed matches for this table to calculate game differences
    const tableMatches = await prisma.match.findMany({
      where: {
        tournamentTableId: table.id,
        matchType: 'GROUP_STAGE',
        status: 'COMPLETED'
      },
      select: {
        homeTeamId: true,
        awayTeamId: true,
        homeGamesWon: true,
        awayGamesWon: true
      }
    })

    // Calculate games won/lost for each team
    const teamGamesWon = new Map<string, number>()
    const teamGamesLost = new Map<string, number>()
    
    for (const match of tableMatches) {
      // Add games won by home team
      const currentHomeWon = teamGamesWon.get(match.homeTeamId) || 0
      teamGamesWon.set(match.homeTeamId, currentHomeWon + match.homeGamesWon)
      
      // Add games lost by home team
      const currentHomeLost = teamGamesLost.get(match.homeTeamId) || 0
      teamGamesLost.set(match.homeTeamId, currentHomeLost + match.awayGamesWon)
      
      // Add games won by away team
      const currentAwayWon = teamGamesWon.get(match.awayTeamId) || 0
      teamGamesWon.set(match.awayTeamId, currentAwayWon + match.awayGamesWon)
      
      // Add games lost by away team
      const currentAwayLost = teamGamesLost.get(match.awayTeamId) || 0
      teamGamesLost.set(match.awayTeamId, currentAwayLost + match.homeGamesWon)
    }

    // Create head-to-head lookup map
    const headToHeadMap = new Map<string, number>()
    for (const match of tableMatches) {
      const key = `${match.homeTeamId}-${match.awayTeamId}`
      const reverseKey = `${match.awayTeamId}-${match.homeTeamId}`
      
      const homeWon = match.homeGamesWon > match.awayGamesWon
      headToHeadMap.set(key, homeWon ? 1 : -1)
      headToHeadMap.set(reverseKey, homeWon ? -1 : 1)
    }

    const sortedTeams = table.teams.sort((a, b) => {
      // 1. Tournament Points (most wins)
      if (a.wins !== b.wins) {
        return b.wins - a.wins
      }
      
      // 2. Head-to-Head Result (if tied, but skip if circular tie)
      // First, check if these teams are part of a larger tie group
      const teamsWithSameWins = table.teams.filter(team => team.wins === a.wins)
      let skipHeadToHead = false
      
      if (teamsWithSameWins.length >= 3) {
        // Check for circular ties in this group
        let hasCircularTie = false
        for (let i = 0; i < teamsWithSameWins.length; i++) {
          for (let j = i + 1; j < teamsWithSameWins.length; j++) {
            for (let k = j + 1; k < teamsWithSameWins.length; k++) {
              const teamA = teamsWithSameWins[i]
              const teamB = teamsWithSameWins[j]
              const teamC = teamsWithSameWins[k]
              
              const abResult = headToHeadMap.get(`${teamA.id}-${teamB.id}`)
              const bcResult = headToHeadMap.get(`${teamB.id}-${teamC.id}`)
              const caResult = headToHeadMap.get(`${teamC.id}-${teamA.id}`)
              
              // If all three head-to-head results exist and form a circle, it's a circular tie
              if (abResult !== undefined && bcResult !== undefined && caResult !== undefined) {
                // Check if A beats B, B beats C, and C beats A (circular)
                if ((abResult > 0 && bcResult > 0 && caResult > 0) ||
                    (abResult < 0 && bcResult < 0 && caResult < 0)) {
                  hasCircularTie = true
                  break
                }
              }
            }
            if (hasCircularTie) break
          }
          if (hasCircularTie) break
        }
        
        if (hasCircularTie) {
          skipHeadToHead = true
        }
      }
      
      // Only use head-to-head if not in a circular tie
      if (!skipHeadToHead) {
        const headToHeadKey = `${a.id}-${b.id}`
        const headToHeadResult = headToHeadMap.get(headToHeadKey)
        if (headToHeadResult !== undefined) {
          if (headToHeadResult > 0) return -1  // Team A won head-to-head
          if (headToHeadResult < 0) return 1   // Team B won head-to-head
        }
      }
      
      // 3. Game Difference (individual games won - games lost)
      const aGamesWon = teamGamesWon.get(a.id) || 0
      const aGamesLost = teamGamesLost.get(a.id) || 0
      const bGamesWon = teamGamesWon.get(b.id) || 0
      const bGamesLost = teamGamesLost.get(b.id) || 0
      
      const aGameDiff = aGamesWon - aGamesLost
      const bGameDiff = bGamesWon - bGamesLost
      if (aGameDiff !== bGameDiff) {
        return bGameDiff - aGameDiff
      }
      
      // 4. Point Difference (points scored - points conceded)
      const aPointDiff = a.points - a.pointsAgainst
      const bPointDiff = b.points - b.pointsAgainst
      if (aPointDiff !== bPointDiff) {
        return bPointDiff - aPointDiff
      }
      
      // 5. Total points scored (tiebreaker)
      return b.points - a.points
    })

    return {
      ...table,
      teams: sortedTeams,
      teamGamesWon,
      teamGamesLost
    }
  }))

  const qualifiedTeams = []
  const thirdPlaceTeams = []

  // Get top 2 from each table and collect 3rd place teams
  for (const table of tablesWithSortedTeams) {
    if (table.teams.length >= 3) {
      // Top 2 teams qualify directly
      qualifiedTeams.push({
        ...table.teams[0],
        tableName: table.name,
        position: 1,
        gameDifference: (table.teamGamesWon.get(table.teams[0].id) || 0) - (table.teamGamesLost.get(table.teams[0].id) || 0),
        pointDifference: table.teams[0].points - table.teams[0].pointsAgainst
      })
      qualifiedTeams.push({
        ...table.teams[1],
        tableName: table.name,
        position: 2,
        gameDifference: (table.teamGamesWon.get(table.teams[1].id) || 0) - (table.teamGamesLost.get(table.teams[1].id) || 0),
        pointDifference: table.teams[1].points - table.teams[1].pointsAgainst
      })
      // 3rd place team goes to wildcard pool
      thirdPlaceTeams.push({
        ...table.teams[2],
        tableName: table.name,
        position: 3,
        teamGamesWon: table.teamGamesWon,
        teamGamesLost: table.teamGamesLost
      })
    }
  }

  // Sort 3rd place teams according to the rules
  thirdPlaceTeams.sort((a, b) => {
    // 1. Points earned in their group (wins)
    if (a.wins !== b.wins) return b.wins - a.wins
    
    // 2. Game difference (individual games won - games lost)
    const aGamesWon = a.teamGamesWon.get(a.id) || 0
    const aGamesLost = a.teamGamesLost.get(a.id) || 0
    const bGamesWon = b.teamGamesWon.get(b.id) || 0
    const bGamesLost = b.teamGamesLost.get(b.id) || 0
    
    const aGameDiff = aGamesWon - aGamesLost
    const bGameDiff = bGamesWon - bGamesLost
    if (aGameDiff !== bGameDiff) return bGameDiff - aGameDiff
    
    // 3. Point difference (points scored - points conceded)
    const aPointDiff = a.points - a.pointsAgainst
    const bPointDiff = b.points - b.pointsAgainst
    if (aPointDiff !== bPointDiff) return bPointDiff - aPointDiff
    
    // 4. Total points scored
    if (a.points !== b.points) return b.points - a.points
    
    // 5. If still tied, we need to draw lots (handled by frontend)
    return 0
  })

  // Add position and stats to third place teams
  const thirdPlaceTeamsWithStats = thirdPlaceTeams.map((team, index) => ({
    ...team,
    wildcardPosition: index + 1,
    gameDifference: (team.teamGamesWon.get(team.id) || 0) - (team.teamGamesLost.get(team.id) || 0),
    pointDifference: team.points - team.pointsAgainst
  }))

  // Check for ties in third place teams
  const tiedTeams = []
  if (thirdPlaceTeamsWithStats.length >= 2) {
    const firstTeam = thirdPlaceTeamsWithStats[0]
    const secondTeam = thirdPlaceTeamsWithStats[1]
    
    // Check if first and second are tied using the same criteria as sorting
    const firstGamesWon = firstTeam.teamGamesWon.get(firstTeam.id) || 0
    const firstGamesLost = firstTeam.teamGamesLost.get(firstTeam.id) || 0
    const secondGamesWon = secondTeam.teamGamesWon.get(secondTeam.id) || 0
    const secondGamesLost = secondTeam.teamGamesLost.get(secondTeam.id) || 0
    
    if (firstTeam.wins === secondTeam.wins &&
        (firstGamesWon - firstGamesLost) === (secondGamesWon - secondGamesLost) &&
        (firstTeam.points - firstTeam.pointsAgainst) === (secondTeam.points - secondTeam.pointsAgainst) &&
        firstTeam.points === secondTeam.points) {
      tiedTeams.push(firstTeam, secondTeam)
    }
  }

  // If there are ties, we need admin decision
  if (tiedTeams.length > 0) {
    return {
      qualifiedTeams,
      thirdPlaceTeams: thirdPlaceTeamsWithStats,
      tiedTeams,
      needsTieBreak: true
    }
  }

  // Add best 2 third place teams to qualified teams
  qualifiedTeams.push(...thirdPlaceTeamsWithStats.slice(0, 2))

  return {
    qualifiedTeams,
    thirdPlaceTeams: thirdPlaceTeamsWithStats,
    tiedTeams: [],
    needsTieBreak: false
  }
} 