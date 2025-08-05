import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { selectedTeamIds } = await request.json()

    if (!selectedTeamIds || !Array.isArray(selectedTeamIds) || selectedTeamIds.length !== 2) {
      return NextResponse.json(
        { error: 'Exactly 2 team IDs must be provided for tie-breaking' },
        { status: 400 }
      )
    }

    // Get the selected teams
    const selectedTeams = await prisma.team.findMany({
      where: { id: { in: selectedTeamIds } }
    })

    if (selectedTeams.length !== 2) {
      return NextResponse.json(
        { error: 'Could not find the selected teams' },
        { status: 400 }
      )
    }

    // Get all qualified teams (top 2 from each table)
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
    
    // Get top 2 from each table
    for (const table of tables) {
      if (table.teams.length >= 3) {
        qualifiedTeams.push(table.teams[0], table.teams[1])
      }
    }

    // Add the 2 selected teams from tie-break
    qualifiedTeams.push(...selectedTeams)

    if (qualifiedTeams.length !== 8) {
      return NextResponse.json(
        { error: `Expected 8 qualified teams, found ${qualifiedTeams.length}` },
        { status: 400 }
      )
    }

    // Generate knockout bracket
    await generateKnockoutBracket(qualifiedTeams)

    // Update tournament stage
    await prisma.tournamentStage.updateMany({
      data: {
        currentStage: 'KNOCKOUT_STAGE',
        knockoutGenerated: true,
        groupStageCompleted: true,
      }
    })

    return NextResponse.json({ 
      message: 'Knockout stage generated successfully with tie-break resolution',
      qualifiedTeams: qualifiedTeams.map(team => ({ id: team.id, name: team.name }))
    })

  } catch (error) {
    console.error('Error generating knockout stage with tie-break:', error)
    return NextResponse.json(
      { error: 'Failed to generate knockout stage' },
      { status: 500 }
    )
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