import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    // Start a transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      // Reset all team statistics
      await tx.team.updateMany({
        data: {
          matchesPlayed: 0,
          wins: 0,
          losses: 0,
          points: 0,
          pointsAgainst: 0,
        }
      })

      // Reset all matches to SCHEDULED status
      await tx.match.updateMany({
        data: {
          status: 'SCHEDULED',
          homeGamesWon: 0,
          awayGamesWon: 0,
          homeScore: null,
          awayScore: null,
          completedAt: null,
        }
      })

      // Delete all games (individual game scores)
      await tx.game.deleteMany({})

      // Reset tournament stage
      await tx.tournamentStage.updateMany({
        data: {
          currentStage: 'GROUP_STAGE',
          groupStageCompleted: false,
          knockoutGenerated: false,
        }
      })

      // Delete all knockout matches (they will be regenerated when needed)
      await tx.match.deleteMany({
        where: {
          matchType: 'KNOCKOUT'
        }
      })
    })

    return NextResponse.json({ 
      message: 'All match results have been reset successfully',
      resetItems: [
        'Team statistics cleared',
        'All matches reset to SCHEDULED',
        'All game scores deleted',
        'Tournament stage reset to GROUP_STAGE',
        'Knockout bracket removed'
      ]
    })

  } catch (error) {
    console.error('Error resetting tournament:', error)
    return NextResponse.json(
      { error: 'Failed to reset tournament results' },
      { status: 500 }
    )
  }
} 