import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const tableId = searchParams.get('tableId')
    const limit = searchParams.get('limit')

    const where: any = {}
    
    if (status) {
      where.status = status
    }
    
    if (tableId) {
      where.tournamentTableId = tableId
    }

    const matches = await prisma.match.findMany({
      where,
      include: {
        homeTeam: true,
        awayTeam: true,
        tournamentTable: true,
        games: {
          orderBy: { gameNumber: 'asc' }
        },
      },
      orderBy: [
        { scheduledAt: 'asc' },
        { createdAt: 'asc' },
      ],
      take: limit ? parseInt(limit) : undefined,
    })

    // Group matches by date
    const groupedMatches = matches.reduce((acc, match) => {
      const date = match.scheduledAt.toISOString().split('T')[0]
      if (!acc[date]) {
        acc[date] = []
      }
      acc[date].push(match)
      return acc
    }, {} as Record<string, typeof matches>)

    return NextResponse.json({
      matches,
      groupedMatches,
      total: matches.length,
    })
  } catch (error) {
    console.error('Error fetching matches:', error)
    return NextResponse.json(
      { error: 'Failed to fetch matches' },
      { status: 500 }
    )
  }
}