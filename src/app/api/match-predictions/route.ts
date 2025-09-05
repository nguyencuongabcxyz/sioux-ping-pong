import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Fetch all match predictions
export async function GET() {
  try {
    const predictions = await prisma.matchPrediction.findMany({
      include: {
        match: {
          include: {
            homeTeam: {
              select: {
                name: true,
                member1Image: true,
                member2Image: true
              }
            },
            awayTeam: {
              select: {
                name: true,
                member1Image: true,
                member2Image: true
              }
            }
          }
        },
        winningTeam: {
          select: {
            name: true,
            member1Image: true,
            member2Image: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ predictions })
  } catch (error) {
    console.error('Error fetching match predictions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch predictions' },
      { status: 500 }
    )
  }
}

// POST - Create a new match prediction
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { playerName, companyEmail, matchId, winningTeamId, matchResult, losingTeamScore } = body

    // Validate required fields
    if (!playerName || !companyEmail || !matchId || !winningTeamId || !matchResult || losingTeamScore === undefined) {
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

    // Check if the match exists and predictions are open
    const match = await prisma.match.findUnique({
      where: { id: matchId }
    })

    if (!match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 400 }
      )
    }

    if (!match.predictionsOpen) {
      return NextResponse.json(
        { error: 'Predictions are not open for this match' },
        { status: 400 }
      )
    }

    // Check if the winning team is one of the teams in the match
    if (winningTeamId !== match.homeTeamId && winningTeamId !== match.awayTeamId) {
      return NextResponse.json(
        { error: 'Winning team must be one of the teams in the match' },
        { status: 400 }
      )
    }

    // Check if user already made a prediction for this match
    const existingPrediction = await prisma.matchPrediction.findUnique({
      where: {
        companyEmail_matchId: {
          companyEmail,
          matchId
        }
      }
    })

    if (existingPrediction) {
      return NextResponse.json(
        { error: 'You have already made a prediction for this match. Only one prediction per email per match is allowed.' },
        { status: 400 }
      )
    }

    // Create the prediction
    const prediction = await prisma.matchPrediction.create({
      data: {
        playerName: playerName.trim(),
        companyEmail: companyEmail.toLowerCase().trim(),
        matchId,
        winningTeamId,
        matchResult,
        losingTeamScore
      },
      include: {
        match: {
          include: {
            homeTeam: {
              select: {
                name: true,
                member1Image: true,
                member2Image: true
              }
            },
            awayTeam: {
              select: {
                name: true,
                member1Image: true,
                member2Image: true
              }
            }
          }
        },
        winningTeam: {
          select: {
            name: true,
            member1Image: true,
            member2Image: true
          }
        }
      }
    })

    return NextResponse.json({ prediction })
  } catch (error) {
    console.error('Error creating match prediction:', error)
    return NextResponse.json(
      { error: 'Failed to create prediction' },
      { status: 500 }
    )
  }
}
