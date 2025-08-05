import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Helper function to generate realistic table tennis game scores
function generateGameScore(): { homeScore: number; awayScore: number } {
  // Start with 11 points as target
  let homeScore = 11
  let awayScore = 11

  // Randomly determine winner and adjust scores
  const homeWins = Math.random() > 0.5

  if (homeWins) {
    // Home team wins, add 2-4 extra points for realistic margin
    homeScore += Math.floor(Math.random() * 3) + 2
    // Away team gets 7-10 points (realistic losing score)
    awayScore = Math.floor(Math.random() * 4) + 7
  } else {
    // Away team wins, add 2-4 extra points for realistic margin
    awayScore += Math.floor(Math.random() * 3) + 2
    // Home team gets 7-10 points (realistic losing score)
    homeScore = Math.floor(Math.random() * 4) + 7
  }

  return { homeScore, awayScore }
}

// Helper function to generate a complete BO3 match
function generateBO3Match(): Array<{ gameNumber: number; homeScore: number; awayScore: number; status: string }> {
  const games = []
  let homeWins = 0
  let awayWins = 0

  // Generate 2-3 games (BO3 format)
  for (let gameNumber = 1; gameNumber <= 3; gameNumber++) {
    const { homeScore, awayScore } = generateGameScore()
    
    if (homeScore > awayScore) {
      homeWins++
    } else {
      awayWins++
    }

    games.push({
      gameNumber,
      homeScore,
      awayScore,
      status: 'COMPLETED'
    })

    // Stop if one team has won 2 games (BO3)
    if (homeWins === 2 || awayWins === 2) {
      break
    }
  }

  return games
}

export async function POST() {
  try {
    // Get all group stage matches that are not completed
    const groupStageMatches = await prisma.match.findMany({
      where: {
        matchType: 'GROUP_STAGE',
        status: { not: 'COMPLETED' }
      },
      include: {
        homeTeam: true,
        awayTeam: true
      }
    })

    if (groupStageMatches.length === 0) {
      return NextResponse.json(
        { error: 'No incomplete group stage matches found' },
        { status: 400 }
      )
    }

    // Start a transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      for (const match of groupStageMatches) {
        // Generate BO3 match results
        const games = generateBO3Match()
        
        // Calculate match totals
        let homeGamesWon = 0
        let awayGamesWon = 0
        let totalHomePoints = 0
        let totalAwayPoints = 0

        // Create game records
        for (const game of games) {
          await tx.game.create({
            data: {
              matchId: match.id,
              gameNumber: game.gameNumber,
              homeScore: game.homeScore,
              awayScore: game.awayScore,
              status: 'COMPLETED',
              completedAt: new Date()
            }
          })

          if (game.homeScore > game.awayScore) {
            homeGamesWon++
          } else {
            awayGamesWon++
          }
          totalHomePoints += game.homeScore
          totalAwayPoints += game.awayScore
        }

        // Update match with results
        await tx.match.update({
          where: { id: match.id },
          data: {
            status: 'COMPLETED',
            homeGamesWon,
            awayGamesWon,
            homeScore: totalHomePoints,
            awayScore: totalAwayPoints,
            completedAt: new Date()
          }
        })

        // Update team statistics
        const homeWin = homeGamesWon > awayGamesWon

        // Update home team stats
        await tx.team.update({
          where: { id: match.homeTeamId },
          data: {
            matchesPlayed: { increment: 1 },
            wins: homeWin ? { increment: 1 } : undefined,
            losses: homeWin ? undefined : { increment: 1 },
            points: { increment: totalHomePoints },
            pointsAgainst: { increment: totalAwayPoints }
          }
        })

        // Update away team stats
        await tx.team.update({
          where: { id: match.awayTeamId },
          data: {
            matchesPlayed: { increment: 1 },
            wins: homeWin ? undefined : { increment: 1 },
            losses: homeWin ? { increment: 1 } : undefined,
            points: { increment: totalAwayPoints },
            pointsAgainst: { increment: totalHomePoints }
          }
        })
      }

      // Check if all group stage matches are now completed
      const remainingIncompleteMatches = await tx.match.count({
        where: {
          matchType: 'GROUP_STAGE',
          status: { not: 'COMPLETED' }
        }
      })

      // Update tournament stage if all group matches are complete
      if (remainingIncompleteMatches === 0) {
        await tx.tournamentStage.updateMany({
          data: {
            groupStageCompleted: true
          }
        })
      }
    })

    return NextResponse.json({ 
      message: `Successfully filled ${groupStageMatches.length} group stage matches with realistic BO3 results`,
      matchesProcessed: groupStageMatches.length,
      format: 'BO3 (Best of 3)',
      scoring: '11 points per game, 2-point lead required'
    })

  } catch (error) {
    console.error('Error filling group stage results:', error)
    return NextResponse.json(
      { error: 'Failed to fill group stage results' },
      { status: 500 }
    )
  }
} 