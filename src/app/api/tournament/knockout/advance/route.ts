import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    // Check if all quarter-final matches are completed
    const incompleteQuarterFinals = await prisma.match.count({
      where: {
        matchType: 'KNOCKOUT',
        round: 'QUARTER_FINAL',
        status: { not: 'COMPLETED' }
      }
    })

    if (incompleteQuarterFinals > 0) {
      return NextResponse.json(
        { error: `${incompleteQuarterFinals} quarter-final matches are still incomplete` },
        { status: 400 }
      )
    }

    // Get all quarter-final matches with their results
    const quarterFinals = await prisma.match.findMany({
      where: {
        matchType: 'KNOCKOUT',
        round: 'QUARTER_FINAL'
      },
      include: {
        homeTeam: true,
        awayTeam: true
      },
      orderBy: { roundOrder: 'asc' }
    })

    if (quarterFinals.length !== 4) {
      return NextResponse.json(
        { error: 'Expected 4 quarter-final matches, found ' + quarterFinals.length },
        { status: 400 }
      )
    }

    // Determine winners of quarter-finals
    const quarterFinalWinners = quarterFinals.map(match => {
      if (match.homeGamesWon > match.awayGamesWon) {
        return match.homeTeam
      } else {
        return match.awayTeam
      }
    })

    // Create semi-final matches
    const semiFinalDate = new Date()
    semiFinalDate.setDate(semiFinalDate.getDate() + 1) // Tomorrow

    const semiFinals = []
    for (let i = 0; i < 2; i++) {
      const matchDate = new Date(semiFinalDate)
      matchDate.setHours(15 + i, 0, 0, 0) // 3 PM, 4 PM

      const match = await prisma.match.create({
        data: {
          homeTeamId: quarterFinalWinners[i * 2].id,
          awayTeamId: quarterFinalWinners[i * 2 + 1].id,
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

    console.log('Generated semi-final matches:', semiFinals.map(m => `${m.homeTeamId} vs ${m.awayTeamId}`))

    return NextResponse.json({ 
      message: 'Semi-final matches generated successfully',
      semiFinals: semiFinals.map(match => ({ id: match.id, homeTeamId: match.homeTeamId, awayTeamId: match.awayTeamId }))
    })

  } catch (error) {
    console.error('Error advancing to semi-finals:', error)
    return NextResponse.json(
      { error: 'Failed to advance to semi-finals' },
      { status: 500 }
    )
  }
} 