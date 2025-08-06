import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    // Get all group stage matches
    const matches = await prisma.match.findMany({
      where: {
        matchType: 'GROUP_STAGE'
      },
      select: {
        id: true,
        scheduledAt: true
      }
    })

    let updatedCount = 0

    // Define the tournament schedule pattern (same as in seed)
    const tournamentSchedule = [
      // 11/8/2025: A: 12h30, A: 12h50, B: 5h30
      { date: 11, matches: [
        { tableIndex: 0, time: { hour: 12, minute: 30 } },
        { tableIndex: 0, time: { hour: 12, minute: 50 } },
        { tableIndex: 1, time: { hour: 17, minute: 30 } }
      ]},
      // 12/8/2025: B: 12h30, C: 12h50, C: 5h30
      { date: 12, matches: [
        { tableIndex: 1, time: { hour: 12, minute: 30 } },
        { tableIndex: 2, time: { hour: 12, minute: 50 } },
        { tableIndex: 2, time: { hour: 17, minute: 30 } }
      ]},
      // 13/8/2025: A: 12h30, A: 12h50, B: 5h30
      { date: 13, matches: [
        { tableIndex: 0, time: { hour: 12, minute: 30 } },
        { tableIndex: 0, time: { hour: 12, minute: 50 } },
        { tableIndex: 1, time: { hour: 17, minute: 30 } }
      ]},
      // 14/8/2025: B: 12h30, C: 12h50, C: 5h30
      { date: 14, matches: [
        { tableIndex: 1, time: { hour: 12, minute: 30 } },
        { tableIndex: 2, time: { hour: 12, minute: 50 } },
        { tableIndex: 2, time: { hour: 17, minute: 30 } }
      ]},
      // 15/8/2025: A: 12h30, A: 12h50, B: 5h30
      { date: 15, matches: [
        { tableIndex: 0, time: { hour: 12, minute: 30 } },
        { tableIndex: 0, time: { hour: 12, minute: 50 } },
        { tableIndex: 1, time: { hour: 17, minute: 30 } }
      ]},
      // 18/8/2025: B: 12h30, C: 12h50, C: 5h30
      { date: 18, matches: [
        { tableIndex: 1, time: { hour: 12, minute: 30 } },
        { tableIndex: 2, time: { hour: 12, minute: 50 } },
        { tableIndex: 2, time: { hour: 17, minute: 30 } }
      ]}
    ]

    // Get tables to map tableIndex to actual table
    const tables = await prisma.tournamentTable.findMany({
      orderBy: { name: 'asc' }
    })

    // Update each match with the correct time based on its position
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i]
      
      // Calculate which schedule day and match this should be
      const scheduleDayIndex = Math.floor(i / 3) // 3 matches per day
      const matchInDay = i % 3
      
      if (scheduleDayIndex < tournamentSchedule.length) {
        const scheduleDay = tournamentSchedule[scheduleDayIndex]
        const matchSchedule = scheduleDay.matches[matchInDay]
        
        if (matchSchedule) {
          // Create the date treating the times as local time, then convert to UTC for storage
          const matchDate = new Date(2025, 7, scheduleDay.date) // August 2025 (month is 0-indexed)
          matchDate.setHours(matchSchedule.time.hour, matchSchedule.time.minute, 0, 0)
          const newScheduledAt = matchDate.toISOString() // Convert to UTC for storage
          
          // Update the match
          await prisma.match.update({
            where: { id: match.id },
            data: { scheduledAt: newScheduledAt }
          })
          
          updatedCount++
          console.log(`Updated match ${match.id}: ${new Date(match.scheduledAt).toLocaleString()} -> ${new Date(newScheduledAt).toLocaleString()}`)
        }
      }
    }

    return NextResponse.json({ 
      message: `Regenerated times for ${updatedCount} matches`,
      updatedCount,
      totalMatches: matches.length
    })
  } catch (error) {
    console.error('Error regenerating match times:', error)
    return NextResponse.json(
      { error: 'Failed to regenerate match times' },
      { status: 500 }
    )
  }
} 