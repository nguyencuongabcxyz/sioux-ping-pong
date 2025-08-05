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
    const qualifiedTeams = await getQualifiedTeams()

    if (qualifiedTeams.length !== 8) {
      return NextResponse.json(
        { error: `Expected 8 qualified teams, found ${qualifiedTeams.length}` },
        { status: 400 }
      )
    }

    // Generate knockout bracket
    await generateKnockoutBracket(qualifiedTeams)

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
      qualifiedTeams: qualifiedTeams.map(team => ({ id: team.id, name: team.name }))
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

  // Sort 3rd place teams and take best 2
  thirdPlaceTeams.sort((a, b) => {
    // Tournament Points (wins)
    if (a.wins !== b.wins) return b.wins - a.wins
    // Game Difference
    const aGameDiff = a.wins - a.losses
    const bGameDiff = b.wins - b.losses
    if (aGameDiff !== bGameDiff) return bGameDiff - aGameDiff
    // Point Difference
    const aPointDiff = a.points - a.pointsAgainst
    const bPointDiff = b.points - b.pointsAgainst
    if (aPointDiff !== bPointDiff) return bPointDiff - aPointDiff
    // Total points scored
    return b.points - a.points
  })

  // Add best 2 third place teams
  qualifiedTeams.push(...thirdPlaceTeams.slice(0, 2))

  return qualifiedTeams
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