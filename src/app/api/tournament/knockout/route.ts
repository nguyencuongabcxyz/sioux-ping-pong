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
      teams: {
        orderBy: [
          { wins: 'desc' },
          { points: 'desc' },
          { pointsAgainst: 'asc' }
        ]
      }
    },
    orderBy: { name: 'asc' }
  })

  const qualifiedTeams = []
  const thirdPlaceTeams = []

  // Get top 2 from each table and collect 3rd place teams
  for (const table of tables) {
    if (table.teams.length >= 3) {
      // Top 2 teams qualify directly
      qualifiedTeams.push(table.teams[0], table.teams[1])
      // 3rd place team goes to wildcard pool
      thirdPlaceTeams.push(table.teams[2])
    }
  }

  // Sort 3rd place teams according to the rules
  thirdPlaceTeams.sort((a, b) => {
    // 1. Points earned in their group (wins)
    if (a.wins !== b.wins) return b.wins - a.wins
    // 2. Game difference (wins - losses)
    const aGameDiff = a.wins - a.losses
    const bGameDiff = b.wins - b.losses
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
    
    // Check if first and second are tied
    if (firstTeam.wins === secondTeam.wins &&
        (firstTeam.wins - firstTeam.losses) === (secondTeam.wins - secondTeam.losses) &&
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
    final: knockoutMatches.find(m => m.round === 'FINAL')
  }

  return bracket
}