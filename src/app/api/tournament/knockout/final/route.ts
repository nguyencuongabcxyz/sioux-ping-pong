import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    // Check if all semi-final matches are completed
    const incompleteSemiFinals = await prisma.match.count({
      where: {
        matchType: 'KNOCKOUT',
        round: 'SEMI_FINAL',
        status: { not: 'COMPLETED' }
      }
    })

    if (incompleteSemiFinals > 0) {
      return NextResponse.json(
        { error: `${incompleteSemiFinals} semi-final matches are still incomplete` },
        { status: 400 }
      )
    }

    // Get all semi-final matches with their results
    const semiFinals = await prisma.match.findMany({
      where: {
        matchType: 'KNOCKOUT',
        round: 'SEMI_FINAL'
      },
      include: {
        homeTeam: true,
        awayTeam: true
      },
      orderBy: { roundOrder: 'asc' }
    })

    if (semiFinals.length !== 2) {
      return NextResponse.json(
        { error: 'Expected 2 semi-final matches, found ' + semiFinals.length },
        { status: 400 }
      )
    }

    // Determine winners and losers of semi-finals
    const semiFinalWinners = semiFinals.map(match => {
      if (match.homeGamesWon > match.awayGamesWon) {
        return match.homeTeam
      } else {
        return match.awayTeam
      }
    })

    const semiFinalLosers = semiFinals.map(match => {
      if (match.homeGamesWon > match.awayGamesWon) {
        return match.awayTeam
      } else {
        return match.homeTeam
      }
    })

    // Create final match
    const finalDate = new Date()
    finalDate.setDate(finalDate.getDate() + 1) // Tomorrow
    finalDate.setHours(16, 0, 0, 0) // 4 PM

    const final = await prisma.match.create({
      data: {
        homeTeamId: semiFinalWinners[0].id,
        awayTeamId: semiFinalWinners[1].id,
        scheduledAt: finalDate,
        status: 'SCHEDULED',
        format: 'BO5',
        matchType: 'KNOCKOUT',
        round: 'FINAL',
        roundOrder: 1,
      }
    })

    // Create third-place match
    const thirdPlaceDate = new Date()
    thirdPlaceDate.setDate(thirdPlaceDate.getDate() + 1) // Tomorrow
    thirdPlaceDate.setHours(14, 0, 0, 0) // 2 PM (before the final)

    const thirdPlace = await prisma.match.create({
      data: {
        homeTeamId: semiFinalLosers[0].id,
        awayTeamId: semiFinalLosers[1].id,
        scheduledAt: thirdPlaceDate,
        status: 'SCHEDULED',
        format: 'BO5',
        matchType: 'KNOCKOUT',
        round: 'THIRD_PLACE',
        roundOrder: 2,
      }
    })

    // Link semi-finals to advance to final
    await prisma.match.updateMany({
      where: { id: { in: [semiFinals[0].id, semiFinals[1].id] } },
      data: { winnerAdvancesToMatchId: final.id }
    })

    console.log('Generated final match:', `${semiFinalWinners[0].name} vs ${semiFinalWinners[1].name}`)
    console.log('Generated third-place match:', `${semiFinalLosers[0].name} vs ${semiFinalLosers[1].name}`)

    return NextResponse.json({ 
      message: 'Final and third-place matches generated successfully',
      final: { id: final.id, homeTeamId: final.homeTeamId, awayTeamId: final.awayTeamId },
      thirdPlace: { id: thirdPlace.id, homeTeamId: thirdPlace.homeTeamId, awayTeamId: thirdPlace.awayTeamId }
    })

  } catch (error) {
    console.error('Error advancing to final:', error)
    return NextResponse.json(
      { error: 'Failed to advance to final' },
      { status: 500 }
    )
  }
} 