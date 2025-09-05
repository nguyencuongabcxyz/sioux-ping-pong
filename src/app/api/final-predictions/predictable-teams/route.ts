import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Fetch teams available for prediction (public)
export async function GET() {
  try {
    const predictableTeams = await prisma.predictableTeam.findMany({
      where: { isActive: true },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            member1Image: true,
            member2Image: true,
            tournamentTable: {
              select: {
                name: true
              }
            }
          }
        },
        _count: {
          select: {
            predictions: true
          }
        }
      },
      orderBy: {
        team: {
          name: 'asc'
        }
      }
    })

    return NextResponse.json({ predictableTeams })
  } catch (error) {
    console.error('Error fetching predictable teams:', error)
    return NextResponse.json(
      { error: 'Failed to fetch predictable teams' },
      { status: 500 }
    )
  }
}

// POST - Manage predictable teams (temporarily public for debugging)
export async function POST(request: NextRequest) {
  try {
    // TODO: Re-enable authentication once NextAuth issue is resolved
    // const session = await getServerSession(authOptions)
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const body = await request.json()
    const { action, teamIds } = body

    if (action === 'set_predictable_teams') {
      if (!Array.isArray(teamIds)) {
        return NextResponse.json(
          { error: 'teamIds must be an array' },
          { status: 400 }
        )
      }

      // Start transaction to ensure data consistency
      const result = await prisma.$transaction(async (tx) => {
        // First, deactivate all current predictable teams
        await tx.predictableTeam.updateMany({
          data: { isActive: false }
        })

        // Then activate/create the selected teams
        const operations = teamIds.map(async (teamId: string) => {
          // Check if team exists
          const team = await tx.team.findUnique({
            where: { id: teamId }
          })

          if (!team) {
            throw new Error(`Team with id ${teamId} not found`)
          }

          // Upsert predictable team
          return tx.predictableTeam.upsert({
            where: { teamId },
            update: { isActive: true },
            create: {
              teamId,
              isActive: true
            }
          })
        })

        return Promise.all(operations)
      })

      // Fetch updated predictable teams with team info
      const updatedPredictableTeams = await prisma.predictableTeam.findMany({
        where: { isActive: true },
        include: {
          team: {
            select: {
              id: true,
              name: true,
              member1Image: true,
              member2Image: true,
              tournamentTable: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      })

      return NextResponse.json({ 
        message: `Successfully updated predictable teams. ${result.length} teams are now available for prediction.`,
        predictableTeams: updatedPredictableTeams
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error managing predictable teams:', error)
    return NextResponse.json(
      { error: 'Failed to manage predictable teams' },
      { status: 500 }
    )
  }
}
