import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Check tournament stage
    const tournamentStage = await prisma.tournamentStage.findFirst()
    
    // Check group stage completion status
    const incompleteGroupMatches = await prisma.match.count({
      where: {
        matchType: 'GROUP_STAGE',
        status: { not: 'COMPLETED' }
      }
    })
    
    const totalGroupMatches = await prisma.match.count({
      where: {
        matchType: 'GROUP_STAGE'
      }
    })
    
    // Check knockout matches
    const knockoutMatches = await prisma.match.findMany({
      where: {
        matchType: 'KNOCKOUT'
      },
      include: {
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } }
      },
      orderBy: [
        { round: 'asc' },
        { roundOrder: 'asc' }
      ]
    })
    
    // Group knockout matches by round
    const knockoutByRound = {
      quarterFinals: knockoutMatches.filter(m => m.round === 'QUARTER_FINAL'),
      semiFinals: knockoutMatches.filter(m => m.round === 'SEMI_FINAL'),
      final: knockoutMatches.find(m => m.round === 'FINAL') || null
    }

    return NextResponse.json({
      tournamentStage: {
        currentStage: tournamentStage?.currentStage || 'Not found',
        groupStageCompleted: tournamentStage?.groupStageCompleted || false,
        knockoutGenerated: tournamentStage?.knockoutGenerated || false
      },
      groupStageStatus: {
        total: totalGroupMatches,
        incomplete: incompleteGroupMatches,
        completed: totalGroupMatches - incompleteGroupMatches,
        allCompleted: incompleteGroupMatches === 0
      },
      knockoutMatches: {
        total: knockoutMatches.length,
        byRound: knockoutByRound,
        quarterFinalsCount: knockoutByRound.quarterFinals.length
      },
      diagnosis: {
        canGenerateKnockout: incompleteGroupMatches === 0 && !tournamentStage?.knockoutGenerated,
        shouldShowBracket: (tournamentStage?.knockoutGenerated && knockoutMatches.length > 0) || tournamentStage?.groupStageCompleted,
        issue: incompleteGroupMatches > 0 
          ? `${incompleteGroupMatches} group stage matches still incomplete`
          : tournamentStage?.knockoutGenerated && knockoutMatches.length === 0
          ? 'Knockout flag is true but no knockout matches found in database'
          : 'No obvious issues detected'
      }
    })

  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json(
      { error: 'Failed to get tournament debug info', details: error },
      { status: 500 }
    )
  }
}
