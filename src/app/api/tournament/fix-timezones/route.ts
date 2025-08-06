import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    // Get all matches that might have timezone issues
    const matches = await prisma.match.findMany({
      where: {
        matchType: 'GROUP_STAGE'
      },
      select: {
        id: true,
        scheduledAt: true
      }
    })

    let fixedCount = 0

    for (const match of matches) {
      const currentDate = new Date(match.scheduledAt)
      
      // Check if this looks like it was generated with the old UTC approach
      // The old approach used Date.UTC() which created times like:
      // - 12:30 PM became 12:30 UTC (which displays as 5:30 AM in some timezones)
      // - 5:30 PM became 17:30 UTC (which displays as 10:30 AM in some timezones)
      
      // Get the UTC hours to see if this looks like a timezone-shifted time
      const utcHours = currentDate.getUTCHours()
      const utcMinutes = currentDate.getUTCMinutes()
      
      // Check if this looks like a time that was meant to be local but is stored as UTC
      // Common patterns: 12:30, 12:50, 17:30, 17:50 (the original intended times)
      const isLikelyTimezoneShifted = (
        (utcHours === 12 && (utcMinutes === 30 || utcMinutes === 50)) ||
        (utcHours === 17 && (utcMinutes === 30 || utcMinutes === 50))
      )
      
      if (isLikelyTimezoneShifted) {
        // This was likely generated with the old UTC approach
        // Convert it to the new local time approach
        const year = currentDate.getUTCFullYear()
        const month = currentDate.getUTCMonth()
        const day = currentDate.getUTCDate()
        const hour = currentDate.getUTCHours()
        const minute = currentDate.getUTCMinutes()
        
        // Create a new date in local timezone (treating the UTC time as local time)
        const localDate = new Date(year, month, day, hour, minute, 0, 0)
        const newScheduledAt = localDate.toISOString()
        
        // Update the match
        await prisma.match.update({
          where: { id: match.id },
          data: { scheduledAt: newScheduledAt }
        })
        
        fixedCount++
        console.log(`Fixed match ${match.id}: ${currentDate.toISOString()} (${currentDate.toLocaleString()}) -> ${newScheduledAt} (${new Date(newScheduledAt).toLocaleString()})`)
      }
    }

    return NextResponse.json({ 
      message: `Fixed timezone issues for ${fixedCount} matches`,
      fixedCount,
      totalMatches: matches.length
    })
  } catch (error) {
    console.error('Error fixing timezones:', error)
    return NextResponse.json(
      { error: 'Failed to fix timezone issues' },
      { status: 500 }
    )
  }
} 