import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST - Toggle match prediction status (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { matchId, predictionsOpen } = body

    if (matchId === undefined || predictionsOpen === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Update the match prediction status
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: { predictionsOpen },
      include: {
        homeTeam: {
          select: {
            name: true
          }
        },
        awayTeam: {
          select: {
            name: true
          }
        }
      }
    })

    return NextResponse.json({ 
      match: updatedMatch,
      message: `Predictions ${predictionsOpen ? 'opened' : 'closed'} for ${updatedMatch.homeTeam.name} vs ${updatedMatch.awayTeam.name}`
    })
  } catch (error) {
    console.error('Error toggling match prediction status:', error)
    return NextResponse.json(
      { error: 'Failed to toggle match prediction status' },
      { status: 500 }
    )
  }
}
