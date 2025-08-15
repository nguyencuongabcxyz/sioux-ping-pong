import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'



export async function GET() {
  try {
    // Get tournament stage to check if knockout is generated
    const tournamentStage = await prisma.tournamentStage.findFirst()
    const knockoutGenerated = tournamentStage?.knockoutGenerated || false

    // Check if all group stage matches are completed and calculate qualified teams
    if (!knockoutGenerated) {
      const incompleteGroupMatches = await prisma.match.count({
        where: {
          matchType: 'GROUP_STAGE',
          status: { not: 'COMPLETED' }
        }
      })

      // If all group stage matches are completed, calculate qualified teams for indicators
      if (incompleteGroupMatches === 0) {
        try {
          const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/tournament/check-group-completion`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          })

          if (response.ok) {
            const result = await response.json()
            console.log('Group completion check from standings API:', result)
            // Don't set knockoutGenerated to true - we only want to show indicators
          }
        } catch (error) {
          console.error('Error calling group completion check from standings:', error)
        }
      }
    }

    // Get all knockout matches to determine which teams advanced (if knockout is generated)
    let advancedTeamIds: string[] = []
    if (knockoutGenerated) {
      const knockoutMatches = await prisma.match.findMany({
        where: { matchType: 'KNOCKOUT' },
        select: { homeTeamId: true, awayTeamId: true }
      })
      advancedTeamIds = [...new Set([
        ...knockoutMatches.map(m => m.homeTeamId),
        ...knockoutMatches.map(m => m.awayTeamId)
      ])]
    } else {
      // If knockout not generated but group stage is completed, calculate qualified teams for indicators
      const incompleteGroupMatches = await prisma.match.count({
        where: {
          matchType: 'GROUP_STAGE',
          status: { not: 'COMPLETED' }
        }
      })

      if (incompleteGroupMatches === 0) {
        // Calculate qualified teams for indicators
        const qualifiedTeams = await calculateQualifiedTeams()
        advancedTeamIds = qualifiedTeams.map(team => team.id)
      }
    }

    const tables = await prisma.tournamentTable.findMany({
      include: {
        teams: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    // Calculate additional stats and apply proper ranking for each table
    const tablesWithStats = await Promise.all(tables.map(async table => {
      // Get all completed matches for this table to calculate game differences and head-to-head results
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

      const teamsWithStats = table.teams.map(team => {
        const gamesWon = teamGamesWon.get(team.id) || 0
        const gamesLost = teamGamesLost.get(team.id) || 0
        
        return {
          ...team,
          // Tournament Points (Win = 1 point, Loss = 0 points)
          tournamentPoints: team.wins,
          // Game Difference (games won - games lost) - CORRECTED
          gameDifference: gamesWon - gamesLost,
          // Point Difference (points scored - points conceded)
          pointDifferential: team.points - team.pointsAgainst,
          // Additional stats for display
          winPercentage: team.matchesPlayed > 0 ? (team.wins / team.matchesPlayed) * 100 : 0,
          averagePointsScored: team.matchesPlayed > 0 ? team.points / team.matchesPlayed : 0,
          averagePointsConceded: team.matchesPlayed > 0 ? team.pointsAgainst / team.matchesPlayed : 0,
          // Check if team advanced to knockout stage
          advancedToKnockout: advancedTeamIds.includes(team.id),
        }
      })

      // Create head-to-head lookup map
      const headToHeadMap = new Map<string, number>()
      for (const match of tableMatches) {
        const key = `${match.homeTeamId}-${match.awayTeamId}`
        const reverseKey = `${match.awayTeamId}-${match.homeTeamId}`
        
        const homeWon = match.homeGamesWon > match.awayGamesWon
        headToHeadMap.set(key, homeWon ? 1 : -1)
        headToHeadMap.set(reverseKey, homeWon ? -1 : 1)
      }

      // Apply tournament ranking rules:
      // 1. Tournament Points (wins) - most wins first
      // 2. Head-to-Head Result (if tied, but skip if circular tie)
      // 3. Game Difference (games won - games lost) - higher difference first  
      // 4. Point Difference (points scored - points conceded) - higher difference first
      // 5. Points scored - higher points first (tiebreaker)
      
      // First, group teams by their win count to detect circular ties
      const teamsByWins = new Map<number, typeof teamsWithStats>()
      for (const team of teamsWithStats) {
        if (!teamsByWins.has(team.wins)) {
          teamsByWins.set(team.wins, [])
        }
        teamsByWins.get(team.wins)!.push(team)
      }
      
      // Check for circular ties in groups with 3+ teams
      const circularTieGroups = new Set<string>()
      for (const [wins, teams] of teamsByWins) {
        if (teams.length >= 3) {
          // Check if this group has circular head-to-head relationships
          let hasCircularTie = false
          for (let i = 0; i < teams.length; i++) {
            for (let j = i + 1; j < teams.length; j++) {
              for (let k = j + 1; k < teams.length; k++) {
                const teamA = teams[i]
                const teamB = teams[j]
                const teamC = teams[k]
                
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
            // Mark all teams in this group as having circular ties
            for (const team of teams) {
              circularTieGroups.add(team.id)
            }
          }
        }
      }
      
      const sortedTeams = teamsWithStats.sort((a, b) => {
        // 1. Tournament Points (most wins)
        if (a.wins !== b.wins) {
          return b.wins - a.wins
        }
        
        // 2. Head-to-Hand Result (if tied, but skip if circular tie)
        // Only use head-to-head if neither team is in a circular tie group
        if (!circularTieGroups.has(a.id) && !circularTieGroups.has(b.id)) {
          const headToHeadKey = `${a.id}-${b.id}`
          const headToHeadResult = headToHeadMap.get(headToHeadKey)
          if (headToHeadResult !== undefined) {
            if (headToHeadResult > 0) return -1  // Team A won head-to-head
            if (headToHeadResult < 0) return 1   // Team B won head-to-head
          }
        }
        
        // 3. Game Difference (games won - games lost) - higher difference first
        if (a.gameDifference !== b.gameDifference) {
          return b.gameDifference - a.gameDifference
        }
        
        // 4. Point Difference (points scored - points conceded) - higher difference first
        if (a.pointDifferential !== b.pointDifferential) {
          return b.pointDifferential - a.pointDifferential
        }
        
        // 5. Total points scored (tiebreaker)
        return b.points - a.points
      })

      // Debug logging for first table
      if (table.name === 'Table A') {
        console.log('Table A teams after sorting:', sortedTeams.map(t => ({
          name: t.name,
          wins: t.wins,
          losses: t.losses,
          gameDiff: t.gameDifference,
          pointDiff: t.pointDifferential,
          points: t.points,
          advanced: t.advancedToKnockout
        })))
        console.log('Head-to-head map:', Object.fromEntries(headToHeadMap))
        console.log('Circular tie groups detected:', Array.from(circularTieGroups))
        
        // Log the ranking logic for the tied teams
        const tiedTeams = sortedTeams.filter(t => t.wins === sortedTeams[0].wins)
        if (tiedTeams.length >= 3) {
          console.log('Teams tied on wins:', tiedTeams.map(t => t.name))
          console.log('Circular tie detected:', circularTieGroups.has(tiedTeams[0].id))
          console.log('Ranking will use Game Difference instead of Head-to-Head due to circular tie')
        }
      }

      return {
        ...table,
        teams: sortedTeams,
      }
    }))

    return NextResponse.json({
      tables: tablesWithStats,
      knockoutGenerated,
      advancedTeamIds,
      groupStageCompleted: tournamentStage?.groupStageCompleted || false
    })
  } catch (error) {
    console.error('Error fetching standings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch standings' },
      { status: 500 }
    )
  }
}

async function calculateQualifiedTeams() {
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
      qualifiedTeams.push(table.teams[0], table.teams[1])
      // 3rd place team goes to wildcard pool
      thirdPlaceTeams.push({
        ...table.teams[2],
        tableId: table.id,
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

  // Add best 2 third place teams
  qualifiedTeams.push(...thirdPlaceTeams.slice(0, 2))

  return qualifiedTeams
}