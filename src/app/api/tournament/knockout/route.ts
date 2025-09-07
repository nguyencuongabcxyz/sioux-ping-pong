import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    // Check if knockout stage has already been generated
    const tournamentStage = await prisma.tournamentStage.findFirst()
    
    if (!tournamentStage) {
      return NextResponse.json(
        { error: 'Tournament stage not initialized' },
        { status: 400 }
      )
    }

    if (tournamentStage.knockoutGenerated) {
      return NextResponse.json(
        { error: 'Knockout stage already generated' },
        { status: 400 }
      )
    }

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

    // Get qualified teams
    const qualificationResult = await getQualifiedTeams()

    // If tie-breaking is needed, return the teams for admin decision
    if (qualificationResult.needsTieBreak) {
      return NextResponse.json({
        needsTieBreak: true,
        message: 'Tie-breaking required for third-place teams',
        qualifiedTeams: qualificationResult.qualifiedTeams.map(team => ({ id: team.id, name: team.name })),
        thirdPlaceTeams: qualificationResult.thirdPlaceTeams.map(team => ({ id: team.id, name: team.name })),
        tiedTeams: qualificationResult.tiedTeams.map(team => ({ id: team.id, name: team.name }))
      })
    }

    if (qualificationResult.qualifiedTeams.length !== 8) {
      return NextResponse.json(
        { error: `Expected 8 qualified teams, found ${qualificationResult.qualifiedTeams.length}` },
        { status: 400 }
      )
    }

    // Generate knockout bracket
    await generateKnockoutBracket(qualificationResult.qualifiedTeams)

    // Update tournament stage
    await prisma.tournamentStage.update({
      where: { id: tournamentStage.id },
      data: {
        currentStage: 'KNOCKOUT_STAGE',
        knockoutGenerated: true,
        groupStageCompleted: true,
      }
    })

    return NextResponse.json({ 
      message: 'Knockout stage generated successfully',
      qualifiedTeams: qualificationResult.qualifiedTeams.map(team => ({ id: team.id, name: team.name }))
    })

  } catch (error) {
    console.error('Error generating knockout stage:', error)
    return NextResponse.json(
      { error: 'Failed to generate knockout stage' },
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

    // Debug logging for first table
    if (table.name === 'Table A') {
      console.log('Knockout - Table A teams after sorting:', sortedTeams.map(t => ({
        name: t.name,
        wins: t.wins,
        losses: t.losses,
        gameDiff: (teamGamesWon.get(t.id) || 0) - (teamGamesLost.get(t.id) || 0),
        pointDiff: t.points - t.pointsAgainst,
        points: t.points
      })))
    }

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

  // Check for ties in third place teams
  const tiedTeams = []
  if (thirdPlaceTeams.length >= 2) {
    const firstTeam = thirdPlaceTeams[0]
    const secondTeam = thirdPlaceTeams[1]
    
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
      thirdPlaceTeams,
      tiedTeams,
      needsTieBreak: true
    }
  }

  // Add best 2 third place teams
  qualifiedTeams.push(...thirdPlaceTeams.slice(0, 2))

  return {
    qualifiedTeams,
    thirdPlaceTeams,
    tiedTeams: [],
    needsTieBreak: false
  }
}

async function generateKnockoutBracket(teams: any[]) {
  // Shuffle teams for bracket seeding (in real tournament, this would be based on group performance)
  const shuffledTeams = [...teams].sort(() => Math.random() - 0.5)

  const quarterFinalDate = new Date()
  quarterFinalDate.setDate(quarterFinalDate.getDate() + 1) // Tomorrow

  // Create quarter-final matches
  const quarterFinals = []
  for (let i = 0; i < 4; i++) {
    const matchDate = new Date(quarterFinalDate)
    matchDate.setHours(14 + i, 0, 0, 0) // 2 PM, 3 PM, 4 PM, 5 PM

    const match = await prisma.match.create({
      data: {
        homeTeamId: shuffledTeams[i * 2].id,
        awayTeamId: shuffledTeams[i * 2 + 1].id,
        scheduledAt: matchDate,
        status: 'SCHEDULED',
        format: 'BO5', // Knockout matches are BO5
        matchType: 'KNOCKOUT',
        round: 'QUARTER_FINAL',
        roundOrder: i + 1,
      }
    })
    quarterFinals.push(match)
    console.log(`Created Quarter-Final ${i + 1}: ${shuffledTeams[i * 2].name} vs ${shuffledTeams[i * 2 + 1].name}`)
  }

  // Create semi-final placeholders
  const semiFinalDate = new Date(quarterFinalDate)
  semiFinalDate.setDate(semiFinalDate.getDate() + 1) // Day after quarters

  const semiFinals = []
  for (let i = 0; i < 2; i++) {
    const matchDate = new Date(semiFinalDate)
    matchDate.setHours(15 + i, 0, 0, 0) // 3 PM, 4 PM

    const match = await prisma.match.create({
      data: {
        homeTeamId: quarterFinals[i * 2].homeTeamId, // Placeholder: will be updated when QF completes
        awayTeamId: quarterFinals[i * 2 + 1].homeTeamId, // Placeholder: will be updated when QF completes
        scheduledAt: matchDate,
        status: 'SCHEDULED',
        format: 'BO5',
        matchType: 'KNOCKOUT',
        round: 'SEMI_FINAL',
        roundOrder: i + 1,
      }
    })
    semiFinals.push(match)

    // Link quarter-finals to advance to this semi-final
    await prisma.match.updateMany({
      where: { id: { in: [quarterFinals[i * 2].id, quarterFinals[i * 2 + 1].id] } },
      data: { winnerAdvancesToMatchId: match.id }
    })
  }

  // Create final placeholder
  const finalDate = new Date(semiFinalDate)
  finalDate.setDate(finalDate.getDate() + 1) // Day after semis
  finalDate.setHours(16, 0, 0, 0) // 4 PM

  const final = await prisma.match.create({
    data: {
      homeTeamId: semiFinals[0].homeTeamId, // Placeholder
      awayTeamId: semiFinals[1].homeTeamId, // Placeholder  
      scheduledAt: finalDate,
      status: 'SCHEDULED',
      format: 'BO5',
      matchType: 'KNOCKOUT',
      round: 'FINAL',
      roundOrder: 1,
    }
  })

  // Link semi-finals to advance to final
  await prisma.match.updateMany({
    where: { id: { in: [semiFinals[0].id, semiFinals[1].id] } },
    data: { winnerAdvancesToMatchId: final.id }
  })

  console.log('Generated complete knockout bracket')
}

export async function GET() {
  try {
    // Get current tournament stage
    const tournamentStage = await prisma.tournamentStage.findFirst()
    
    if (!tournamentStage) {
      return NextResponse.json({ stage: 'GROUP_STAGE', knockoutGenerated: false })
    }

    // If knockout stage exists, get bracket
    let bracket = null
    if (tournamentStage.knockoutGenerated) {
      bracket = await getKnockoutBracket()
    }

    return NextResponse.json({
      stage: tournamentStage.currentStage,
      groupStageCompleted: tournamentStage.groupStageCompleted,
      knockoutGenerated: tournamentStage.knockoutGenerated,
      bracket
    })

  } catch (error) {
    console.error('Error fetching tournament status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tournament status' },
      { status: 500 }
    )
  }
}

async function getKnockoutBracket() {
  const knockoutMatches = await prisma.match.findMany({
    where: { matchType: 'KNOCKOUT' },
    include: {
      homeTeam: true,
      awayTeam: true,
      games: {
        orderBy: { gameNumber: 'asc' }
      }
    },
    orderBy: [
      { round: 'asc' },
      { roundOrder: 'asc' }
    ]
  })

  const bracket = {
    quarterFinals: knockoutMatches.filter(m => m.round === 'QUARTER_FINAL'),
    semiFinals: knockoutMatches.filter(m => m.round === 'SEMI_FINAL'),
    final: knockoutMatches.find(m => m.round === 'FINAL'),
    thirdPlace: knockoutMatches.find(m => m.round === 'THIRD_PLACE')
  }

  return bracket
}