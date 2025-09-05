import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Fetch all teams for admin selection (temporarily public for debugging)  
export async function GET() {
  try {
    // TODO: Re-enable authentication once NextAuth issue is resolved
    // const session = await getServerSession(authOptions)
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const teams = await prisma.team.findMany({
      select: {
        id: true,
        name: true,
        member1Image: true,
        member2Image: true,
        tournamentTable: {
          select: {
            name: true
          }
        },
        predictableTeam: {
          select: {
            id: true,
            isActive: true
          }
        }
      },
      orderBy: [
        {
          tournamentTable: {
            name: 'asc'
          }
        },
        {
          name: 'asc'
        }
      ]
    })

    return NextResponse.json({ teams })
  } catch (error) {
    console.error('Error fetching all teams:', error)
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
      { status: 500 }
    )
  }
}
