import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const tables = await prisma.tournamentTable.findMany({
      include: {
        teams: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    // Calculate additional stats and apply proper ranking for each table
    const tablesWithStats = tables.map(table => {
      const teamsWithStats = table.teams.map(team => ({
        ...team,
        // Tournament Points (Win = 1 point, Loss = 0 points)
        tournamentPoints: team.wins,
        // Game Difference (wins - losses)
        gameDifference: team.wins - team.losses,
        // Point Difference (points scored - points conceded)
        pointDifferential: team.points - team.pointsAgainst,
        // Additional stats for display
        winPercentage: team.matchesPlayed > 0 ? (team.wins / team.matchesPlayed) * 100 : 0,
        averagePointsScored: team.matchesPlayed > 0 ? team.points / team.matchesPlayed : 0,
        averagePointsConceded: team.matchesPlayed > 0 ? team.pointsAgainst / team.matchesPlayed : 0,
      }))

      // Apply tournament ranking rules:
      // 1. Tournament Points (wins) - most wins first
      // 2. Game Difference (wins - losses) - higher difference first  
      // 3. Point Difference (points scored - points conceded) - higher difference first
      // 4. Points scored - higher points first (tiebreaker)
      const sortedTeams = teamsWithStats.sort((a, b) => {
        // 1. Tournament Points (most wins)
        if (a.tournamentPoints !== b.tournamentPoints) {
          return b.tournamentPoints - a.tournamentPoints
        }
        
        // 2. Game Difference (wins - losses)
        if (a.gameDifference !== b.gameDifference) {
          return b.gameDifference - a.gameDifference
        }
        
        // 3. Point Difference (points scored - points conceded)
        if (a.pointDifferential !== b.pointDifferential) {
          return b.pointDifferential - a.pointDifferential
        }
        
        // 4. Total points scored (tiebreaker)
        return b.points - a.points
      })

      return {
        ...table,
        teams: sortedTeams,
      }
    })

    return NextResponse.json(tablesWithStats)
  } catch (error) {
    console.error('Error fetching standings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch standings' },
      { status: 500 }
    )
  }
}