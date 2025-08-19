import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { quarterFinalMatches } = await request.json()

    // Validate input
    if (!quarterFinalMatches || !Array.isArray(quarterFinalMatches) || quarterFinalMatches.length !== 4) {
      return NextResponse.json(
        { error: 'Exactly 4 quarter-final matches must be provided' },
        { status: 400 }
      )
    }

    // Validate that all matches have both home and away teams
    for (const match of quarterFinalMatches) {
      if (!match.homeTeamId || !match.awayTeamId) {
        return NextResponse.json(
          { error: 'All quarter-final matches must have both home and away teams assigned' },
          { status: 400 }
        )
      }
    }

    // Extract team IDs for validation
    const selectedTeamIds = quarterFinalMatches.flatMap((match: any) => [match.homeTeamId, match.awayTeamId])

    if (selectedTeamIds.length !== 8) {
      return NextResponse.json(
        { error: 'Exactly 8 teams must be assigned to quarter-finals' },
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

    // Generate knockout bracket with specific match assignments
    await generateKnockoutBracket(quarterFinalMatches)

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
      message: 'Knockout bracket generated successfully with manual team assignments'
    })

  } catch (error) {
    console.error('Error generating manual knockout bracket:', error)
    return NextResponse.json(
      { error: 'Failed to generate knockout bracket' },
      { status: 500 }
    )
  }
}

async function generateKnockoutBracket(quarterFinalMatches: any[]) {
  const quarterFinalDate = new Date()
  quarterFinalDate.setDate(quarterFinalDate.getDate() + 1) // Tomorrow

  // Create quarter-final matches with specific assignments
  const quarterFinals = []
  for (let i = 0; i < quarterFinalMatches.length; i++) {
    const matchAssignment = quarterFinalMatches[i]
    const matchDate = new Date(quarterFinalDate)
    matchDate.setHours(14 + i, 0, 0, 0) // 2 PM, 3 PM, 4 PM, 5 PM

    // Get team details for logging
    const homeTeam = await prisma.team.findUnique({ where: { id: matchAssignment.homeTeamId } })
    const awayTeam = await prisma.team.findUnique({ where: { id: matchAssignment.awayTeamId } })

    const match = await prisma.match.create({
      data: {
        homeTeamId: matchAssignment.homeTeamId,
        awayTeamId: matchAssignment.awayTeamId,
        scheduledAt: matchDate,
        status: 'SCHEDULED',
        format: 'BO5', // Knockout matches are BO5
        matchType: 'KNOCKOUT',
        round: 'QUARTER_FINAL',
        roundOrder: i + 1,
      }
    })
    quarterFinals.push(match)
    console.log(`Created Quarter-Final ${i + 1}: ${homeTeam?.name} vs ${awayTeam?.name}`)
  }

  console.log('Generated quarter-final bracket with manual team assignment')
} 