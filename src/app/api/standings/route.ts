import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get tournament stage to check if knockout is generated
    const tournamentStage = await prisma.tournamentStage.findFirst()
    const knockoutGenerated = tournamentStage?.knockoutGenerated || false

    // Get all knockout matches to determine which teams advanced
    let advancedTeamIds: string[] = []
    if (knockoutGenerated) {
      const knockoutMatches = await prisma.match.findMany({
        where: { matchType: 'KNOCKOUT' },
        select: { homeTeamId: true, awayTeamId: true }
      })
      advancedTeamIds = [...new Set([
        ...knockoutMatches.map(m => m.homeTeamId),
        ...knockoutMatches.map(m => m.awayTeamId)
      ])]
    }

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
        // Check if team advanced to knockout stage
        advancedToKnockout: advancedTeamIds.includes(team.id),
      }))

      // Apply tournament ranking rules:
      // 1. Tournament Points (wins) - most wins first
      // 2. Game Difference (wins - losses) - higher difference first  
      // 3. Point Difference (points scored - points conceded) - higher difference first
      // 4. Points scored - higher points first (tiebreaker)
      const sortedTeams = teamsWithStats.sort((a, b) => {
        // 1. Tournament Points (most wins)
        if (a.wins !== b.wins) {
          return b.wins - a.wins
        }
        
        // 2. Game Difference (wins - losses)
        const aGameDiff = a.wins - a.losses
        const bGameDiff = b.wins - b.losses
        if (aGameDiff !== bGameDiff) {
          return bGameDiff - aGameDiff
        }
        
        // 3. Point Difference (points scored - points conceded)
        const aPointDiff = a.points - a.pointsAgainst
        const bPointDiff = b.points - b.pointsAgainst
        if (aPointDiff !== bPointDiff) {
          return bPointDiff - aPointDiff
        }
        
        // 4. Total points scored (tiebreaker)
        return b.points - a.points
      })

      return {
        ...table,
        teams: sortedTeams,
      }
    })

    return NextResponse.json({
      tables: tablesWithStats,
      knockoutGenerated,
      advancedTeamIds
    })
  } catch (error) {
    console.error('Error fetching standings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch standings' },
      { status: 500 }
    )
  }
}