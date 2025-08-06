import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    // Find all group stage matches that are not in BO3 format
    const nonBO3GroupMatches = await prisma.match.findMany({
      where: {
        matchType: 'GROUP_STAGE',
        format: { not: 'BO3' }
      },
      include: {
        homeTeam: true,
        awayTeam: true
      }
    })

    if (nonBO3GroupMatches.length === 0) {
      return NextResponse.json({
        message: 'All group stage matches are already in BO3 format',
        updatedMatches: 0
      })
    }

    // Update all group stage matches to BO3 format
    const updateResult = await prisma.match.updateMany({
      where: {
        matchType: 'GROUP_STAGE',
        format: { not: 'BO3' }
      },
      data: {
        format: 'BO3'
      }
    })

    return NextResponse.json({
      message: `Successfully updated ${updateResult.count} group stage matches to BO3 format`,
      updatedMatches: updateResult.count,
      format: 'BO3 (Best of 3)',
      note: 'All group stage matches are now guaranteed to be in BO3 format'
    })

  } catch (error) {
    console.error('Error ensuring BO3 format for group stage matches:', error)
    return NextResponse.json(
      { error: 'Failed to update group stage matches to BO3 format' },
      { status: 500 }
    )
  }
} 