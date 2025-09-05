import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Fetch all final match predictions
export async function GET() {
  try {
    const predictions = await prisma.finalMatchPrediction.findMany({
      include: {
        championTeam: {
          include: {
            team: {
              select: {
                name: true,
                member1Image: true,
                member2Image: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ predictions })
  } catch (error) {
    console.error('Error fetching final match predictions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch predictions' },
      { status: 500 }
    )
  }
}

// POST - Create a new final match prediction
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { playerName, companyEmail, championTeamId, matchResult, losingTeamScore } = body

    // Validate required fields
    if (!playerName || !companyEmail || !championTeamId || !matchResult || losingTeamScore === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(companyEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate match result format (e.g., "3-1", "3-0", "3-2")
    const matchResultRegex = /^3-[0-2]$/
    if (!matchResultRegex.test(matchResult)) {
      return NextResponse.json(
        { error: 'Invalid match result format. Must be in format "3-X" where X is 0, 1, or 2 (representing games won by the losing team)' },
        { status: 400 }
      )
    }

    // Validate losing team score (final game points: 0-11)
    if (losingTeamScore < 0 || losingTeamScore > 11) {
      return NextResponse.json(
        { error: 'Losing team score must be between 0 and 11 points' },
        { status: 400 }
      )
    }

    // Check if the team is available for prediction
    const predictableTeam = await prisma.predictableTeam.findUnique({
      where: { id: championTeamId },
      include: { team: true }
    })

    if (!predictableTeam || !predictableTeam.isActive) {
      return NextResponse.json(
        { error: 'Selected team is not available for prediction' },
        { status: 400 }
      )
    }

    // Check if user already made a prediction (unique email)
    const existingPrediction = await prisma.finalMatchPrediction.findUnique({
      where: { companyEmail }
    })

    if (existingPrediction) {
      return NextResponse.json(
        { error: 'You have already made a prediction. Only one prediction per email is allowed.' },
        { status: 400 }
      )
    }

    // Create the prediction
    const prediction = await prisma.finalMatchPrediction.create({
      data: {
        playerName: playerName.trim(),
        companyEmail: companyEmail.toLowerCase().trim(),
        championTeamId,
        matchResult,
        losingTeamScore
      },
      include: {
        championTeam: {
          include: {
            team: {
              select: {
                name: true,
                member1Image: true,
                member2Image: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({ prediction })
  } catch (error) {
    console.error('Error creating final match prediction:', error)
    return NextResponse.json(
      { error: 'Failed to create prediction' },
      { status: 500 }
    )
  }
}
