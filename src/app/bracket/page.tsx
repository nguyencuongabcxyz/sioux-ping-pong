'use client'

import { useEffect, useState } from 'react'
import { Trophy, Users, Calendar, Clock, ArrowRight } from 'lucide-react'

interface Game {
  id: string
  gameNumber: number
  homeScore: number
  awayScore: number
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED'
}

interface Team {
  id: string
  name: string
  member1Image?: string
  member2Image?: string
}

interface Match {
  id: string
  scheduledAt: string
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  format: 'BO3' | 'BO5'
  round: 'QUARTER_FINAL' | 'SEMI_FINAL' | 'FINAL'
  roundOrder: number
  homeGamesWon: number
  awayGamesWon: number
  homeTeam: Team
  awayTeam: Team
  games: Game[]
}

interface BracketData {
  stage: string
  groupStageCompleted: boolean
  knockoutGenerated: boolean
  bracket?: {
    quarterFinals: Match[]
    semiFinals: Match[]
    final: Match | null
  }
}

const BracketPage = () => {
  const [bracketData, setBracketData] = useState<BracketData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchBracketData()
  }, [])

  const fetchBracketData = async () => {
    try {
      const response = await fetch('/api/tournament/knockout')
      if (!response.ok) throw new Error('Failed to fetch bracket data')
      const data = await response.json()
      setBracketData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }



  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  const getMatchResult = (match: Match) => {
    if (match.status === 'COMPLETED') {
      const completedGames = match.games.filter(g => g.status === 'COMPLETED')
      return {
        homeDisplay: match.homeGamesWon.toString(),
        awayDisplay: match.awayGamesWon.toString(),
        gameDetails: completedGames.map(g => `${g.homeScore}-${g.awayScore}`).join(', ')
      }
    }
    return { homeDisplay: '-', awayDisplay: '-', gameDetails: null }
  }

  const MatchCard = ({ match, position = 'left' }: { match: Match, position?: 'left' | 'right' | 'center' }) => {
    const result = getMatchResult(match)
    const isCompleted = match.status === 'COMPLETED'
    const homeWinner = isCompleted && match.homeGamesWon > match.awayGamesWon
    const awayWinner = isCompleted && match.awayGamesWon > match.homeGamesWon

    return (
      <div className={`bg-white rounded-lg border-2 shadow-lg p-4 w-80 ${
        isCompleted ? 'border-green-200' : 'border-gray-200'
      }`}>
        <div className="text-center mb-3">
          <h3 className="font-bold text-lg text-gray-900">
            {match.round.replace('_', ' ')} {match.roundOrder}
          </h3>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            {formatTime(match.scheduledAt)}
          </div>
          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
            isCompleted ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
          }`}>
            {isCompleted ? 'FINAL' : 'SCHEDULED'} • {match.format}
          </span>
        </div>

        <div className="space-y-2">
          {/* Home Team */}
          <div className={`flex items-center justify-between p-3 rounded-lg ${
            homeWinner ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
          }`}>
            <div className="flex items-center gap-3">
              <div className="flex -space-x-1">
                {match.homeTeam.member1Image && (
                  <img 
                    src={match.homeTeam.member1Image} 
                    alt="Player 1" 
                    className="w-8 h-8 rounded-full border-2 border-white object-cover"
                  />
                )}
                {match.homeTeam.member2Image && (
                  <img 
                    src={match.homeTeam.member2Image} 
                    alt="Player 2" 
                    className="w-8 h-8 rounded-full border-2 border-white object-cover"
                  />
                )}
                {(!match.homeTeam.member1Image && !match.homeTeam.member2Image) && (
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center">
                    <Users className="w-4 h-4 text-gray-600" />
                  </div>
                )}
              </div>
              <div>
                <div className={`font-medium ${homeWinner ? 'text-green-800' : 'text-gray-900'}`}>
                  {match.homeTeam.name}
                </div>
              </div>
            </div>
            {isCompleted && (
              <div className={`text-xl font-bold ${homeWinner ? 'text-green-600' : 'text-gray-400'}`}>
                {result.homeDisplay}
              </div>
            )}
          </div>

          {/* Away Team */}
          <div className={`flex items-center justify-between p-3 rounded-lg ${
            awayWinner ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
          }`}>
            <div className="flex items-center gap-3">
              <div className="flex -space-x-1">
                {match.awayTeam.member1Image && (
                  <img 
                    src={match.awayTeam.member1Image} 
                    alt="Player 1" 
                    className="w-8 h-8 rounded-full border-2 border-white object-cover"
                  />
                )}
                {match.awayTeam.member2Image && (
                  <img 
                    src={match.awayTeam.member2Image} 
                    alt="Player 2" 
                    className="w-8 h-8 rounded-full border-2 border-white object-cover"
                  />
                )}
                {(!match.awayTeam.member1Image && !match.awayTeam.member2Image) && (
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center">
                    <Users className="w-4 h-4 text-gray-600" />
                  </div>
                )}
              </div>
              <div>
                <div className={`font-medium ${awayWinner ? 'text-green-800' : 'text-gray-900'}`}>
                  {match.awayTeam.name}
                </div>
              </div>
            </div>
            {isCompleted && (
              <div className={`text-xl font-bold ${awayWinner ? 'text-green-600' : 'text-gray-400'}`}>
                {result.awayDisplay}
              </div>
            )}
          </div>
        </div>

        {isCompleted && result.gameDetails && (
          <div className="mt-3 text-center">
            <div className="text-xs text-gray-500">Game Scores: {result.gameDetails}</div>
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Error: {error}</p>
      </div>
    )
  }

  if (!bracketData) {
    return <div>No tournament data available</div>
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2" style={{ color: '#F15D03' }}>
          <Trophy className="w-8 h-8" style={{ color: '#F15D03' }} />
          Tournament Bracket
        </h1>
        <p className="text-gray-600">
          Current Stage: <span className="font-semibold">{bracketData.stage.replace('_', ' ')}</span>
        </p>
      </div>

      {/* Tournament Status */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Tournament Progress</h2>
            <div className="mt-2 space-y-1">
              <div className={`flex items-center gap-2 ${bracketData.groupStageCompleted ? 'text-green-600' : 'text-gray-600'}`}>
                <div className={`w-2 h-2 rounded-full ${bracketData.groupStageCompleted ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                Group Stage {bracketData.groupStageCompleted ? 'Completed' : 'In Progress'}
              </div>
              <div className={`flex items-center gap-2 ${bracketData.knockoutGenerated ? 'text-green-600' : 'text-gray-600'}`}>
                <div className={`w-2 h-2 rounded-full ${bracketData.knockoutGenerated ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                Knockout Stage {bracketData.knockoutGenerated ? 'Generated' : 'Pending'}
              </div>
            </div>
          </div>
          
          {!bracketData.knockoutGenerated && bracketData.groupStageCompleted && (
            <div className="text-center">
              <p className="text-gray-600 mb-2">
                Group stage completed! Quarter-final teams must be assigned manually by the tournament administrator.
              </p>
              <p className="text-sm text-gray-500">
                Please go to the Admin Dashboard to assign the 8 qualified teams to quarter-final matches.
              </p>
            </div>
          )}
          
          {bracketData.knockoutGenerated && (
            <div className="text-center">
              <p className="text-gray-600 mb-2">
                Quarter-final bracket generated! Use the Admin Dashboard to advance the tournament when matches are completed.
              </p>
              <p className="text-sm text-gray-500">
                Semi-finals and finals will be generated automatically when all matches in the current stage are completed.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bracket */}
      {bracketData.bracket ? (
        <div className="bg-white rounded-lg shadow-lg p-8 overflow-x-auto">
          <div className="min-w-[1200px]">
            {/* Quarter Finals */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-center mb-6 text-gray-900">Quarter Finals</h2>
              <div className="grid grid-cols-4 gap-8">
                {bracketData.bracket.quarterFinals.map((match, index) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            </div>

            {/* Semi Finals */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-center mb-6 text-gray-900">Semi Finals</h2>
              <div className="flex justify-center gap-24">
                {bracketData.bracket.semiFinals.map((match, index) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            </div>

            {/* Final */}
            {bracketData.bracket.final && (
              <div>
                <h2 className="text-2xl font-bold text-center mb-6 text-gray-900">Final</h2>
                <div className="flex justify-center">
                  <MatchCard match={bracketData.bracket.final} position="center" />
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">Knockout Bracket Not Generated</h3>
          <p>Complete all group stage matches to generate the knockout bracket.</p>
        </div>
      )}
    </div>
  )
}

export default BracketPage