import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Fetch all scheduled matches with prediction status
export async function GET() {
  try {
    const matches = await prisma.match.findMany({
      where: {
        status: 'SCHEDULED', // Only show scheduled matches
        // Removed the date filter to show all scheduled matches
      },
      include: {
        homeTeam: {
          select: {
            id: true,
            name: true,
            member1Image: true,
            member2Image: true
          }
        },
        awayTeam: {
          select: {
            id: true,
            name: true,
            member1Image: true,
            member2Image: true
          }
        },
        tournamentTable: {
          select: {
            name: true
          }
        },
        _count: {
          select: {
            predictions: true
          }
        }
      },
      orderBy: [
        {
          scheduledAt: 'asc'
        }
      ]
    })

    console.log('API returning matches:', matches.length, 'matches')
    if (matches.length > 0) {
      console.log('First match sample:', JSON.stringify(matches[0], null, 2))
    }

    return NextResponse.json({ matches })
  } catch (error) {
    console.error('Error fetching scheduled matches:', error)
    return NextResponse.json(
      { error: 'Failed to fetch scheduled matches' },
      { status: 500 }
    )
  }
}
