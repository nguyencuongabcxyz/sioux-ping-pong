import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    console.log('Starting force fix for all match times with Vietnam timezone...')
    
    // Get all group stage matches
    const matches = await prisma.match.findMany({
      where: {
        matchType: 'GROUP_STAGE'
      },
      select: {
        id: true,
        scheduledAt: true
      },
      orderBy: {
        scheduledAt: 'asc'
      }
    })

    console.log(`Found ${matches.length} matches to fix`)

    let fixedCount = 0

    // Define the tournament schedule pattern (same as in seed)
    const tournamentSchedule = [
      // 11/8/2025: A: 12h30, A: 12h50, B: 5h30
      { date: 11, matches: [
        { time: { hour: 12, minute: 30 } },
        { time: { hour: 12, minute: 50 } },
        { time: { hour: 17, minute: 30 } }
      ]},
      // 12/8/2025: B: 12h30, C: 12h50, C: 5h30
      { date: 12, matches: [
        { time: { hour: 12, minute: 30 } },
        { time: { hour: 12, minute: 50 } },
        { time: { hour: 17, minute: 30 } }
      ]},
      // 13/8/2025: A: 12h30, A: 12h50, B: 5h30
      { date: 13, matches: [
        { time: { hour: 12, minute: 30 } },
        { time: { hour: 12, minute: 50 } },
        { time: { hour: 17, minute: 30 } }
      ]},
      // 14/8/2025: B: 12h30, C: 12h50, C: 5h30
      { date: 14, matches: [
        { time: { hour: 12, minute: 30 } },
        { time: { hour: 12, minute: 50 } },
        { time: { hour: 17, minute: 30 } }
      ]},
      // 15/8/2025: A: 12h30, A: 12h50, B: 5h30
      { date: 15, matches: [
        { time: { hour: 12, minute: 30 } },
        { time: { hour: 12, minute: 50 } },
        { time: { hour: 17, minute: 30 } }
      ]},
      // 18/8/2025: B: 12h30, C: 12h50, C: 5h30
      { date: 18, matches: [
        { time: { hour: 12, minute: 30 } },
        { time: { hour: 12, minute: 50 } },
        { time: { hour: 17, minute: 30 } }
      ]}
    ]

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
          // Create the date explicitly in Vietnam timezone (UTC+7)
          // This ensures consistency between local and Vercel deployments
          const year = 2025
          const month = 7 // August (0-indexed)
          const day = scheduleDay.date
          const hour = matchSchedule.time.hour
          const minute = matchSchedule.time.minute
          
          // Create a date string in Vietnam timezone
          const vietnamDateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00.000+07:00`
          
          // Convert to UTC for storage
          const vietnamDate = new Date(vietnamDateString)
          const newScheduledAt = vietnamDate.toISOString()
          
          console.log(`Match ${i + 1}: ${new Date(match.scheduledAt).toLocaleString()} -> ${new Date(newScheduledAt).toLocaleString()}`)
          console.log(`  Vietnam time: ${vietnamDateString}`)
          console.log(`  UTC storage: ${newScheduledAt}`)
          
          // Update the match
          await prisma.match.update({
            where: { id: match.id },
            data: { scheduledAt: newScheduledAt }
          })
          
          fixedCount++
        }
      }
    }

    console.log(`Fixed ${fixedCount} matches`)

    return NextResponse.json({ 
      message: `Force fixed times for ${fixedCount} matches using Vietnam timezone`,
      fixedCount,
      totalMatches: matches.length
    })
  } catch (error) {
    console.error('Error force fixing times:', error)
    return NextResponse.json(
      { error: 'Failed to force fix times', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 