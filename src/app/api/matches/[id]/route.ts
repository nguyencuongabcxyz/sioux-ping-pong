import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { format, status, games, homeScore, awayScore, scheduledAt } = await request.json()
    const matchId = params.id

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

    let updateData: any = {}
    
    // Handle legacy format (simple homeScore/awayScore)
    if (homeScore !== undefined && awayScore !== undefined && !games) {
      updateData = {
        homeScore,
        awayScore,
        status,
        completedAt: status === 'COMPLETED' ? new Date() : null,
        ...(scheduledAt && { scheduledAt: new Date(scheduledAt) }),
      }
    }
    // Handle new table tennis format (games)
    else if (games && Array.isArray(games)) {
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
        ...(scheduledAt && { scheduledAt: new Date(scheduledAt) }),
      }
    }
    // Handle status-only updates
    else if (status) {
      updateData = { status }
      if (format) updateData.format = format
      if (scheduledAt) updateData.scheduledAt = new Date(scheduledAt)
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

    // Update team stats if match was completed
    if (updateData.status === 'COMPLETED' && currentMatch.status !== 'COMPLETED') {
      const homeWins = (updatedMatch.homeGamesWon || 0) > (updatedMatch.awayGamesWon || 0) ||
                      (updatedMatch.homeScore || 0) > (updatedMatch.awayScore || 0)
      
      // Update home team stats
      await prisma.team.update({
        where: { id: currentMatch.homeTeamId },
        data: {
          matchesPlayed: { increment: 1 },
          wins: homeWins ? { increment: 1 } : undefined,
          losses: homeWins ? undefined : { increment: 1 },
          points: { increment: updatedMatch.homeScore || 0 },
          pointsAgainst: { increment: updatedMatch.awayScore || 0 },
        },
      })

      // Update away team stats
      await prisma.team.update({
        where: { id: currentMatch.awayTeamId },
        data: {
          matchesPlayed: { increment: 1 },
          wins: homeWins ? undefined : { increment: 1 },
          losses: homeWins ? { increment: 1 } : undefined,
          points: { increment: updatedMatch.awayScore || 0 },
          pointsAgainst: { increment: updatedMatch.homeScore || 0 },
        },
      })

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