'use client'

import { useState, useEffect } from 'react'
import { 
  Trophy, 
  Users, 
  User,
  Mail,
  Target,
  RefreshCw,
  Eye,
  TrendingUp,
  Calendar,
  Clock
} from 'lucide-react'

interface MatchPrediction {
  id: string
  playerName: string
  companyEmail: string
  matchResult: string
  losingTeamScore: number
  createdAt: string
  match: {
    id: string
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
    scheduledAt: string
  }
  winningTeam: {
    id: string
    name: string
    member1Image?: string
    member2Image?: string
  }
}

interface MatchStats {
  matchId: string
  homeTeam: string
  awayTeam: string
  homeTeamImages: {
    member1Image?: string
    member2Image?: string
  }
  awayTeamImages: {
    member1Image?: string
    member2Image?: string
  }
  count: number
  homeTeamWins: number
  awayTeamWins: number
  predictions: MatchPrediction[]
}

interface MatchPredictionsDisplayProps {
  refreshTrigger?: number
  selectedMatchId?: string | null
  showOnlySelectedMatch?: boolean
}

const MatchPredictionsDisplay = ({ refreshTrigger, selectedMatchId: propSelectedMatchId, showOnlySelectedMatch }: MatchPredictionsDisplayProps) => {
  const [predictions, setPredictions] = useState<MatchPrediction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<'summary' | 'all'>('summary')
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(propSelectedMatchId || null)

  useEffect(() => {
    fetchPredictions()
  }, [refreshTrigger])

  useEffect(() => {
    if (propSelectedMatchId) {
      setSelectedMatchId(propSelectedMatchId)
      setView('all')
    }
  }, [propSelectedMatchId])

  const fetchPredictions = async () => {
    try {
      setError(null)
      const response = await fetch('/api/match-predictions')
      if (response.ok) {
        const data = await response.json()
        setPredictions(data.predictions)
      } else {
        setError('Failed to load predictions')
      }
    } catch (err) {
      setError('Failed to load predictions')
    } finally {
      setLoading(false)
    }
  }

  const handleViewMatchPredictions = (matchId: string) => {
    setSelectedMatchId(matchId)
    setView('all')
  }

  // Calculate match statistics with winning team breakdown
  const matchStats = predictions.reduce((stats, prediction) => {
    const matchKey = prediction.match.id
    if (!stats[matchKey]) {
      stats[matchKey] = {
        matchId: matchKey,
        homeTeam: prediction.match.homeTeam.name,
        awayTeam: prediction.match.awayTeam.name,
        homeTeamImages: {
          member1Image: prediction.match.homeTeam.member1Image,
          member2Image: prediction.match.homeTeam.member2Image
        },
        awayTeamImages: {
          member1Image: prediction.match.awayTeam.member1Image,
          member2Image: prediction.match.awayTeam.member2Image
        },
        count: 0,
        homeTeamWins: 0,
        awayTeamWins: 0,
        predictions: []
      }
    }
    stats[matchKey].count++
    
    // Count which team is predicted to win
    if (prediction.winningTeam.id === prediction.match.homeTeam.id) {
      stats[matchKey].homeTeamWins++
    } else {
      stats[matchKey].awayTeamWins++
    }
    
    stats[matchKey].predictions.push(prediction)
    return stats
  }, {} as Record<string, MatchStats>)

  // Calculate percentages and sort by popularity
  const sortedMatchStats = Object.values(matchStats).map(stat => ({
    ...stat,
    homeTeamPercentage: stat.count > 0 ? Math.round((stat.homeTeamWins / stat.count) * 100) : 0,
    awayTeamPercentage: stat.count > 0 ? Math.round((stat.awayTeamWins / stat.count) * 100) : 0
  })).sort((a, b) => b.count - a.count)

  // Calculate result statistics
  const resultStats = predictions.reduce((stats, prediction) => {
    const result = prediction.matchResult
    stats[result] = (stats[result] || 0) + 1
    return stats
  }, {} as Record<string, number>)

  const totalPredictions = predictions.length

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatEmail = (email: string) => {
    // Partially hide email for privacy
    const [user, domain] = email.split('@')
    if (user.length <= 2) return email
    return `${user.slice(0, 2)}***@${domain}`
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-600">Error: {error}</p>
      </div>
    )
  }

  if (predictions.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-700 mb-2">No Match Predictions Yet</h3>
        <p className="text-gray-500">
          Be the first to make predictions for scheduled matches!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-orange-600" />
          <h2 className="text-lg font-bold text-gray-900">
            Match Predictions ({predictions.length})
          </h2>
        </div>
        <button
          onClick={fetchPredictions}
          className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          title="Refresh predictions"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* View Toggle - Only show when not in modal mode */}
      {!showOnlySelectedMatch && (
        <div className="flex gap-1 mb-4">
          <button
            onClick={() => {
              setView('summary')
              setSelectedMatchId(null)
            }}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              view === 'summary' 
                ? 'bg-orange-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Summary
          </button>
          <button
            onClick={() => {
              setView('all')
              setSelectedMatchId(null)
            }}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              view === 'all' 
                ? 'bg-orange-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All
          </button>
          {selectedMatchId && (
            <button
              onClick={() => setSelectedMatchId(null)}
              className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            >
              Clear Filter
            </button>
          )}
        </div>
      )}

      {view === 'summary' && !showOnlySelectedMatch ? (
        <div className="space-y-6">
          {/* Match Predictions Summary */}
          <div className="bg-white rounded-lg shadow-lg border border-orange-200">
            <div className="px-4 py-3 border-b border-orange-200 bg-gradient-to-r from-orange-50 to-red-50">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-orange-600" />
                <h3 className="text-base font-semibold text-orange-900">Match Predictions</h3>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {sortedMatchStats.slice(0, 5).map((stat, index) => (
                <div key={stat.matchId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex items-center gap-1 text-xs text-gray-500 min-w-[20px]">
                      #{index + 1}
                    </div>
                    
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex -space-x-1">
                        {stat.homeTeamImages.member1Image && (
                          <img 
                            src={stat.homeTeamImages.member1Image} 
                            alt="Player 1" 
                            className="w-6 h-6 rounded-full border border-white object-cover shadow-sm"
                            onError={(e) => { 
                              const target = e.target as HTMLImageElement
                              target.src = '/api/placeholder/24/24'
                            }}
                          />
                        )}
                        {stat.homeTeamImages.member2Image && (
                          <img 
                            src={stat.homeTeamImages.member2Image} 
                            alt="Player 2" 
                            className="w-6 h-6 rounded-full border border-white object-cover shadow-sm"
                            onError={(e) => { 
                              const target = e.target as HTMLImageElement
                              target.src = '/api/placeholder/24/24'
                            }}
                          />
                        )}
                      </div>
                      <div className="text-sm text-gray-900 truncate max-w-[80px]">{stat.homeTeam}</div>
                      <span className="text-gray-400 text-xs">vs</span>
                      <div className="text-sm text-gray-900 truncate max-w-[80px]">{stat.awayTeam}</div>
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      {stat.count} prediction{stat.count !== 1 ? 's' : ''}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleViewMatchPredictions(stat.matchId)}
                    className="flex items-center gap-2 px-3 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors"
                    title="View detailed predictions for this match"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                </div>
              ))}
              {sortedMatchStats.length > 5 && (
                <div className="text-xs text-gray-500 text-center pt-2">
                  +{sortedMatchStats.length - 5} more matches
                </div>
              )}
            </div>
          </div>

          {/* Result Predictions Summary */}
          <div className="bg-white rounded-lg shadow-lg border border-orange-200">
            <div className="px-4 py-3 border-b border-orange-200 bg-gradient-to-r from-orange-50 to-red-50">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-orange-600" />
                <h3 className="text-base font-semibold text-orange-900">Score Predictions</h3>
              </div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(resultStats)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([result, count]) => {
                    const percentage = Math.round((count / totalPredictions) * 100)
                    return (
                      <div key={result} className="text-center">
                        <div className="text-2xl font-bold text-orange-600 mb-1">{result}</div>
                        <div className="text-xs text-gray-600 mb-1">
                          {result === '3-0' ? 'Dominant' :
                           result === '3-1' ? 'Comfortable' :
                           'Close'}
                        </div>
                        <div className="font-semibold text-gray-900 text-sm">{count}</div>
                        <div className="text-xs text-gray-500">{percentage}%</div>
                      </div>
                    )
                  })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* All Predictions View */
        <div className="bg-white rounded-lg shadow-lg border border-orange-200">
          <div className="px-4 py-3 border-b border-orange-200 bg-gradient-to-r from-orange-50 to-red-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-orange-600" />
                <h3 className="text-base font-semibold text-orange-900">
                  {selectedMatchId ? 'Match Predictions' : 'All Predictions'}
                </h3>
              </div>
              {selectedMatchId && (
                <div className="text-sm text-gray-600">
                  {(() => {
                    const match = sortedMatchStats.find(stat => stat.matchId === selectedMatchId)
                    return match ? `${match.homeTeam} vs ${match.awayTeam}` : ''
                  })()}
                </div>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-orange-100">
              <thead className="bg-orange-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider">
                    Player
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider">
                    Winner
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider">
                    Game
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-orange-100">
                {(selectedMatchId 
                  ? predictions.filter(p => p.match.id === selectedMatchId)
                  : predictions.slice(0, 10)
                ).map((prediction) => (
                  <tr key={prediction.id} className="hover:bg-orange-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900 truncate max-w-[120px]" title={prediction.playerName}>
                          {prediction.playerName}
                        </div>
                        <div className="text-xs text-gray-500 truncate max-w-[120px]" title={prediction.companyEmail}>
                          {formatEmail(prediction.companyEmail)}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="flex -space-x-1">
                          {prediction.winningTeam.member1Image && (
                            <img 
                              src={prediction.winningTeam.member1Image} 
                              alt="Player 1" 
                              className="w-6 h-6 rounded-full border border-white object-cover shadow-sm"
                              onError={(e) => { 
                                const target = e.target as HTMLImageElement
                                target.src = '/api/placeholder/24/24'
                              }}
                            />
                          )}
                          {prediction.winningTeam.member2Image && (
                            <img 
                              src={prediction.winningTeam.member2Image} 
                              alt="Player 2" 
                              className="w-6 h-6 rounded-full border border-white object-cover shadow-sm"
                              onError={(e) => { 
                                const target = e.target as HTMLImageElement
                                target.src = '/api/placeholder/24/24'
                              }}
                            />
                          )}
                        </div>
                        <div className="font-medium text-gray-900 text-sm" title={prediction.winningTeam.name}>
                          {prediction.winningTeam.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-mono text-lg font-bold text-orange-600">{prediction.matchResult}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-mono text-lg font-bold text-gray-600">{prediction.losingTeamScore}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {predictions.length > 10 && (
              <div className="p-3 text-center text-xs text-gray-500 border-t border-orange-100">
                Showing first 10 of {predictions.length} predictions
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default MatchPredictionsDisplay
