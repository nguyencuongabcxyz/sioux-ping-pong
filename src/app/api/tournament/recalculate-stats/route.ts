import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    // Get all teams
    const teams = await prisma.team.findMany()
    
    // Recalculate statistics for each team
    for (const team of teams) {
      await recalculateTeamStats(team.id)
    }

    return NextResponse.json({ 
      message: 'All team statistics recalculated successfully',
      teamsCount: teams.length 
    })
  } catch (error) {
    console.error('Error recalculating team statistics:', error)
    return NextResponse.json(
      { error: 'Failed to recalculate team statistics' },
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