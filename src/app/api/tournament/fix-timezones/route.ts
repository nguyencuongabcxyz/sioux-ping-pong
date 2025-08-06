import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    console.log('Starting comprehensive timezone fix process...')
    
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

    console.log(`Found ${matches.length} matches to check`)

    let fixedCount = 0
    let checkedCount = 0

    // Define the expected schedule pattern
    const expectedTimes = [
      { hour: 12, minute: 30 }, // 12:30 PM
      { hour: 12, minute: 50 }, // 12:50 PM
      { hour: 17, minute: 30 }, // 5:30 PM
      { hour: 17, minute: 50 }, // 5:50 PM
    ]

    for (const match of matches) {
      checkedCount++
      const currentDate = new Date(match.scheduledAt)
      
      console.log(`\nChecking match ${match.id}:`)
      console.log(`  Original: ${currentDate.toISOString()}`)
      console.log(`  Display: ${currentDate.toLocaleString()}`)
      
      // Get the UTC hours to see if this looks like a timezone-shifted time
      const utcHours = currentDate.getUTCHours()
      const utcMinutes = currentDate.getUTCMinutes()
      
      console.log(`  UTC time: ${utcHours}:${utcMinutes.toString().padStart(2, '0')}`)
      
      // Check if this looks like a time that was meant to be local but is stored as UTC
      const isLikelyTimezoneShifted = expectedTimes.some(expected => 
        utcHours === expected.hour && utcMinutes === expected.minute
      )
      
      console.log(`  Is likely timezone shifted: ${isLikelyTimezoneShifted}`)
      
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
        
        console.log(`  Converting: ${currentDate.toISOString()} -> ${newScheduledAt}`)
        console.log(`  Display: ${currentDate.toLocaleString()} -> ${new Date(newScheduledAt).toLocaleString()}`)
        
        // Update the match
        await prisma.match.update({
          where: { id: match.id },
          data: { scheduledAt: newScheduledAt }
        })
        
        fixedCount++
        console.log(`  Fixed match ${match.id}`)
      } else {
        console.log(`  No fix needed for match ${match.id}`)
      }
    }

    console.log(`\nProcessed ${checkedCount} matches, fixed ${fixedCount} matches`)

    return NextResponse.json({ 
      message: `Fixed timezone issues for ${fixedCount} matches`,
      fixedCount,
      totalMatches: matches.length,
      checkedCount
    })
  } catch (error) {
    console.error('Error fixing timezones:', error)
    return NextResponse.json(
      { error: 'Failed to fix timezone issues', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 