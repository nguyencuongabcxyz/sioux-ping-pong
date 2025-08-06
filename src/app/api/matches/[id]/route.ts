import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Helper function to parse scheduledAt date consistently
function parseScheduledAt(scheduledAt: string): Date {
  // The scheduledAt string is already in ISO format (UTC)
  // Just create a Date object from it
  return new Date(scheduledAt)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const { format, status, games, homeScore, awayScore, scheduledAt } = await request.json()
    const matchId = id

    // Get the current match to check previous state
    const currentMatch = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        homeTeam: true,
        awayTeam: true,
        games: true,
      },
    })

    if (!currentMatch) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      )
    }

    let updateData: {
      homeScore?: number;
      awayScore?: number;
      status?: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
      completedAt?: Date | null;
      scheduledAt?: Date;
      format?: 'BO3' | 'BO5';
      homeGamesWon?: number;
      awayGamesWon?: number;
    } = {}
    
    // Handle legacy format (simple homeScore/awayScore)
    if (homeScore !== undefined && awayScore !== undefined && !games) {
      updateData = {
        homeScore,
        awayScore,
        status,
        completedAt: status === 'COMPLETED' ? new Date() : null,
        ...(scheduledAt && { scheduledAt: parseScheduledAt(scheduledAt) }),
      }
    }
    // Handle new table tennis format (games)
    else if (games && Array.isArray(games)) {
      // First, delete any games that are not in the new games array
      // This handles the case where we want to reduce the number of games
      const newGameNumbers = games.map(g => g.gameNumber)
      await prisma.game.deleteMany({
        where: {
          matchId: matchId,
          gameNumber: {
            notIn: newGameNumbers
          }
        }
      })

      // Update or create games
      for (const gameData of games) {
        await prisma.game.upsert({
          where: {
            matchId_gameNumber: {
              matchId: matchId,
              gameNumber: gameData.gameNumber
            }
          },
          update: {
            homeScore: gameData.homeScore,
            awayScore: gameData.awayScore,
            status: gameData.status,
            completedAt: gameData.status === 'COMPLETED' ? new Date() : null,
          },
          create: {
            matchId: matchId,
            gameNumber: gameData.gameNumber,
            homeScore: gameData.homeScore,
            awayScore: gameData.awayScore,
            status: gameData.status,
            completedAt: gameData.status === 'COMPLETED' ? new Date() : null,
          },
        })
      }

      // Calculate match result based on games won
      const completedGames = games.filter(g => g.status === 'COMPLETED')
      let homeGamesWon = 0
      let awayGamesWon = 0
      let totalHomePoints = 0
      let totalAwayPoints = 0

      completedGames.forEach(game => {
        if (game.homeScore > game.awayScore) {
          homeGamesWon++
        } else if (game.awayScore > game.homeScore) {
          awayGamesWon++
        }
        totalHomePoints += game.homeScore
        totalAwayPoints += game.awayScore
      })

      // Determine if match is completed based on format
      const requiredWins = format === 'BO5' ? 3 : 2
      const isMatchCompleted = homeGamesWon >= requiredWins || awayGamesWon >= requiredWins

      updateData = {
        format: format || currentMatch.format,
        homeGamesWon,
        awayGamesWon,
        homeScore: totalHomePoints,
        awayScore: totalAwayPoints,
        status: isMatchCompleted ? 'COMPLETED' : (status || currentMatch.status),
        completedAt: isMatchCompleted ? new Date() : null,
        ...(scheduledAt && { scheduledAt: parseScheduledAt(scheduledAt) }),
      }
    }
    // Handle status-only updates
    else if (status) {
      updateData = { status }
      if (format) updateData.format = format
      if (scheduledAt) updateData.scheduledAt = parseScheduledAt(scheduledAt)
    }

    // Update the match
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: updateData,
      include: {
        homeTeam: true,
        awayTeam: true,
        games: {
          orderBy: { gameNumber: 'asc' }
        },
      },
    })

    // Recalculate team statistics for both teams involved in this match
    // This ensures that any changes to the match result are properly reflected
    await recalculateTeamStats(currentMatch.homeTeamId)
    await recalculateTeamStats(currentMatch.awayTeamId)

    // Check if this was a group stage match and if all group stage matches are now completed
    if (currentMatch.matchType === 'GROUP_STAGE') {
      const incompleteGroupMatches = await prisma.match.count({
        where: {
          matchType: 'GROUP_STAGE',
          status: { not: 'COMPLETED' }
        }
      })

      console.log(`Match ${matchId} completed. ${incompleteGroupMatches} group stage matches remaining`)

      // If all group stage matches are completed, mark group stage as completed
      if (incompleteGroupMatches === 0) {
        console.log('All group stage matches completed! Marking group stage as completed...')
        try {
          const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/tournament/check-group-completion`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          })

          if (response.ok) {
            const result = await response.json()
            console.log('Group completion result:', result)
          } else {
            console.error('Failed to mark group stage as completed')
          }
        } catch (error) {
          console.error('Error calling group completion check:', error)
        }
      }
    }

    return NextResponse.json(updatedMatch)
  } catch (error) {
    console.error('Error updating match:', error)
    return NextResponse.json(
      { error: 'Failed to update match' },
      { status: 500 }
    )
  }
}

// Helper function to recalculate team statistics from scratch
async function recalculateTeamStats(teamId: string) {
  // Get all completed matches for this team
  const completedMatches = await prisma.match.findMany({
    where: {
      OR: [
        { homeTeamId: teamId },
        { awayTeamId: teamId }
      ],
      status: 'COMPLETED'
    },
    select: {
      homeTeamId: true,
      awayTeamId: true,
      homeGamesWon: true,
      awayGamesWon: true,
      homeScore: true,
      awayScore: true
    }
  })

  // Calculate new statistics
  let matchesPlayed = 0
  let wins = 0
  let losses = 0
  let points = 0
  let pointsAgainst = 0

  for (const match of completedMatches) {
    matchesPlayed++
    
    const isHomeTeam = match.homeTeamId === teamId
    const teamGamesWon = isHomeTeam ? match.homeGamesWon : match.awayGamesWon
    const opponentGamesWon = isHomeTeam ? match.awayGamesWon : match.homeGamesWon
    const teamPoints = isHomeTeam ? match.homeScore : match.awayScore
    const opponentPoints = isHomeTeam ? match.awayScore : match.homeScore

    if (teamGamesWon > opponentGamesWon) {
      wins++
    } else {
      losses++
    }

    points += teamPoints || 0
    pointsAgainst += opponentPoints || 0
  }

  // Update team statistics
  await prisma.team.update({
    where: { id: teamId },
    data: {
      matchesPlayed,
      wins,
      losses,
      points,
      pointsAgainst,
    },
  })

  console.log(`Recalculated stats for team ${teamId}: ${wins}W-${losses}L, ${points}PF-${pointsAgainst}PA`)
}