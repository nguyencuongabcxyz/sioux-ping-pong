'use client'

import { useState, useEffect } from 'react'
import { Trophy, Users, Calendar, Clock, RefreshCw } from 'lucide-react'

interface MatchResult {
  id: string
  scheduledAt: string
  status: string
  homeGamesWon: number
  awayGamesWon: number
  homeTeam: {
    id: string
    name: string
    member1Image?: string
    member2Image?: string
  }
  awayTeam: {
    id: string
    name: string
    member1Image?: string
    member2Image?: string
  }
  tournamentTable: {
    name: string
  }
  games: Array<{
    gameNumber: number
    homeScore: number
    awayScore: number
    status: string
  }>
}

interface CompletedMatchResultsProps {
  matchId: string
  refreshTrigger?: number
}

const CompletedMatchResults = ({ matchId, refreshTrigger = 0 }: CompletedMatchResultsProps) => {
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMatchResult()
  }, [matchId, refreshTrigger])

  const fetchMatchResult = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/matches/${matchId}`)
      if (response.ok) {
        const data = await response.json()
        setMatchResult(data.match)
      } else {
        setError('Failed to load match results')
      }
    } catch (err) {
      setError('Failed to load match results')
    } finally {
      setLoading(false)
    }
  }

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) {
      return { date: 'TBD', time: 'TBD' }
    }
    
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return { date: 'TBD', time: 'TBD' }
      }
      
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
      }
    } catch (error) {
      console.warn('Error formatting date:', dateString, error)
      return { date: 'TBD', time: 'TBD' }
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="w-6 h-6 text-red-600" />
          <h3 className="text-lg font-semibold text-red-900">Error Loading Results</h3>
        </div>
        <p className="text-red-800">{error}</p>
        <button
          onClick={fetchMatchResult}
          className="mt-3 flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    )
  }

  if (!matchResult) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="w-6 h-6 text-yellow-600" />
          <h3 className="text-lg font-semibold text-yellow-900">No Results Found</h3>
        </div>
        <p className="text-yellow-800">Match results are not available yet.</p>
      </div>
    )
  }

  const { date, time } = formatDateTime(matchResult.scheduledAt)
  const winner = matchResult.homeGamesWon > matchResult.awayGamesWon ? matchResult.homeTeam : matchResult.awayTeam
  const loser = matchResult.homeGamesWon > matchResult.awayGamesWon ? matchResult.awayTeam : matchResult.homeTeam
  const finalScore = `${Math.max(matchResult.homeGamesWon, matchResult.awayGamesWon)}-${Math.min(matchResult.homeGamesWon, matchResult.awayGamesWon)}`

  return (
    <div className="space-y-6">
      {/* Match Header */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-green-600" />
            <h2 className="text-2xl font-bold text-green-900">Match Results</h2>
          </div>
          <div className="text-sm text-green-600">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{date}</span>
              <Clock className="w-4 h-4" />
              <span>{time}</span>
            </div>
          </div>
        </div>

        {/* Teams */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex -space-x-1">
              {matchResult.homeTeam.member1Image && (
                <img 
                  src={matchResult.homeTeam.member1Image} 
                  alt="Player 1" 
                  className="w-10 h-10 rounded-full border border-white object-cover shadow-sm"
                  onError={(e) => { 
                    const target = e.target as HTMLImageElement
                    target.src = '/api/placeholder/40/40'
                  }}
                />
              )}
              {matchResult.homeTeam.member2Image && (
                <img 
                  src={matchResult.homeTeam.member2Image} 
                  alt="Player 2" 
                  className="w-10 h-10 rounded-full border border-white object-cover shadow-sm"
                  onError={(e) => { 
                    const target = e.target as HTMLImageElement
                    target.src = '/api/placeholder/40/40'
                  }}
                />
              )}
            </div>
            <span className="font-medium text-green-800 text-xl">{matchResult.homeTeam.name}</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{finalScore}</div>
              <div className="text-xs text-green-500">Final Score</div>
            </div>
            <div className="text-xs text-green-600 bg-green-100 px-3 py-1 rounded-full">
              {matchResult.tournamentTable?.name || 'No Table'}
            </div>
          </div>
          
          <div className="flex items-center gap-3 flex-1 justify-end">
            <span className="font-medium text-green-800 text-xl">{matchResult.awayTeam.name}</span>
            <div className="flex -space-x-1">
              {matchResult.awayTeam.member1Image && (
                <img 
                  src={matchResult.awayTeam.member1Image} 
                  alt="Player 1" 
                  className="w-10 h-10 rounded-full border border-white object-cover shadow-sm"
                  onError={(e) => { 
                    const target = e.target as HTMLImageElement
                    target.src = '/api/placeholder/40/40'
                  }}
                />
              )}
              {matchResult.awayTeam.member2Image && (
                <img 
                  src={matchResult.awayTeam.member2Image} 
                  alt="Player 2" 
                  className="w-10 h-10 rounded-full border border-white object-cover shadow-sm"
                  onError={(e) => { 
                    const target = e.target as HTMLImageElement
                    target.src = '/api/placeholder/40/40'
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Winner */}
        <div className="bg-green-100 border border-green-300 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-green-600" />
            <span className="font-semibold text-green-800">Winner: </span>
            <span className="font-bold text-green-900">{winner.name}</span>
          </div>
        </div>
      </div>

      {/* Individual Games */}
      {matchResult.games && matchResult.games.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Individual Games
            </h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            {matchResult.games.map((game) => (
              <div key={game.gameNumber} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 text-green-800 rounded-full flex items-center justify-center font-bold text-sm">
                      {game.gameNumber}
                    </div>
                    <span className="font-medium text-gray-900">Game {game.gameNumber}</span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className="font-medium text-gray-700">{matchResult.homeTeam.name}</span>
                    <div className="text-2xl font-bold text-gray-900">{game.homeScore} - {game.awayScore}</div>
                    <span className="font-medium text-gray-700">{matchResult.awayTeam.name}</span>
                  </div>
                  
                  <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {game.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default CompletedMatchResults
