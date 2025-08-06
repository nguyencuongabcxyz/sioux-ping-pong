import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get a sample match to check the current time format
    const sampleMatch = await prisma.match.findFirst({
      where: {
        matchType: 'GROUP_STAGE'
      },
      select: {
        id: true,
        scheduledAt: true
      }
    })

    if (!sampleMatch) {
      return NextResponse.json({ 
        message: 'No matches found',
        sampleMatch: null
      })
    }

    const currentDate = new Date(sampleMatch.scheduledAt)
    
    return NextResponse.json({ 
      message: 'Timezone test endpoint working',
      sampleMatch: {
        id: sampleMatch.id,
        scheduledAt: sampleMatch.scheduledAt,
        isoString: currentDate.toISOString(),
        localString: currentDate.toLocaleString(),
        utcHours: currentDate.getUTCHours(),
        utcMinutes: currentDate.getUTCMinutes(),
        localHours: currentDate.getHours(),
        localMinutes: currentDate.getMinutes()
      }
    })
  } catch (error) {
    console.error('Error in test endpoint:', error)
    return NextResponse.json(
      { error: 'Test endpoint failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 