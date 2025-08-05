import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { selectedTeamIds } = await request.json()

    // Validate input
    if (!selectedTeamIds || !Array.isArray(selectedTeamIds) || selectedTeamIds.length !== 8) {
      return NextResponse.json(
        { error: 'Exactly 8 teams must be selected for quarter-finals' },
        { status: 400 }
      )
    }

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

    // Verify all selected teams exist
    const selectedTeams = await prisma.team.findMany({
      where: { id: { in: selectedTeamIds } }
    })

    if (selectedTeams.length !== 8) {
      return NextResponse.json(
        { error: 'Some selected teams do not exist' },
        { status: 400 }
      )
    }

    // Generate knockout bracket with selected teams
    await generateKnockoutBracket(selectedTeams)

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
      message: 'Knockout stage generated successfully with manual team selection',
      selectedTeams: selectedTeams.map(team => ({ id: team.id, name: team.name }))
    })

  } catch (error) {
    console.error('Error generating manual knockout stage:', error)
    return NextResponse.json(
      { error: 'Failed to generate knockout stage' },
      { status: 500 }
    )
  }
}

async function generateKnockoutBracket(teams: any[]) {
  const quarterFinalDate = new Date()
  quarterFinalDate.setDate(quarterFinalDate.getDate() + 1) // Tomorrow

  // Create quarter-final matches with selected teams
  const quarterFinals = []
  for (let i = 0; i < 4; i++) {
    const matchDate = new Date(quarterFinalDate)
    matchDate.setHours(14 + i, 0, 0, 0) // 2 PM, 3 PM, 4 PM, 5 PM

    const match = await prisma.match.create({
      data: {
        homeTeamId: teams[i * 2].id,
        awayTeamId: teams[i * 2 + 1].id,
        scheduledAt: matchDate,
        status: 'SCHEDULED',
        format: 'BO5', // Knockout matches are BO5
        matchType: 'KNOCKOUT',
        round: 'QUARTER_FINAL',
        roundOrder: i + 1,
      }
    })
    quarterFinals.push(match)
    console.log(`Created Quarter-Final ${i + 1}: ${teams[i * 2].name} vs ${teams[i * 2 + 1].name}`)
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

  console.log('Generated complete knockout bracket with manual team selection')
} 