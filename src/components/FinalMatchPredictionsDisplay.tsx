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
  TrendingUp
} from 'lucide-react'

interface FinalMatchPrediction {
  id: string
  playerName: string
  companyEmail: string
  matchResult: string
  losingTeamScore: number
  createdAt: string
  championTeam: {
    team: {
      name: string
      member1Image?: string
      member2Image?: string
    }
  }
}

interface TeamStats {
  teamName: string
  teamImages: {
    member1Image?: string
    member2Image?: string
  }
  count: number
  percentage: number
  predictions: FinalMatchPrediction[]
}

interface FinalMatchPredictionsDisplayProps {
  refreshTrigger?: number
}

const FinalMatchPredictionsDisplay = ({ refreshTrigger }: FinalMatchPredictionsDisplayProps) => {
  const [predictions, setPredictions] = useState<FinalMatchPrediction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<'summary' | 'all'>('summary')

  useEffect(() => {
    fetchPredictions()
  }, [refreshTrigger])

  const fetchPredictions = async () => {
    try {
      setError(null)
      const response = await fetch('/api/final-predictions')
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

  // Calculate team statistics
  const teamStats = predictions.reduce((stats, prediction) => {
    const teamName = prediction.championTeam.team.name
    if (!stats[teamName]) {
      stats[teamName] = {
        teamName,
        teamImages: {
          member1Image: prediction.championTeam.team.member1Image,
          member2Image: prediction.championTeam.team.member2Image
        },
        count: 0,
        percentage: 0,
        predictions: []
      }
    }
    stats[teamName].count++
    stats[teamName].predictions.push(prediction)
    return stats
  }, {} as Record<string, TeamStats>)

  // Calculate percentages and sort by popularity
  const totalPredictions = predictions.length
  const sortedTeamStats = Object.values(teamStats).map(stat => ({
    ...stat,
    percentage: totalPredictions > 0 ? Math.round((stat.count / totalPredictions) * 100) : 0
  })).sort((a, b) => b.count - a.count)

  // Calculate result statistics
  const resultStats = predictions.reduce((stats, prediction) => {
    const result = prediction.matchResult
    stats[result] = (stats[result] || 0) + 1
    return stats
  }, {} as Record<string, number>)

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
        <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-700 mb-2">No Predictions Yet</h3>
        <p className="text-gray-500">
          Be the first to make a prediction for the final match!
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
            Predictions ({predictions.length})
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

      {/* View Toggle */}
      <div className="flex gap-1 mb-4">
        <button
          onClick={() => setView('summary')}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
            view === 'summary' 
              ? 'bg-orange-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Summary
        </button>
        <button
          onClick={() => setView('all')}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
            view === 'all' 
              ? 'bg-orange-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All
        </button>
      </div>

      {view === 'summary' ? (
        <div className="space-y-6">
          {/* Champion Predictions Summary */}
          <div className="bg-white rounded-lg shadow-lg border border-orange-200">
            <div className="px-4 py-3 border-b border-orange-200 bg-gradient-to-r from-orange-50 to-red-50">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-orange-600" />
                <h3 className="text-base font-semibold text-orange-900">Champion Predictions</h3>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {sortedTeamStats.slice(0, 5).map((stat, index) => (
                <div key={stat.teamName} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-xs text-gray-500 min-w-[20px]">
                    #{index + 1}
                  </div>
                  
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="flex -space-x-1">
                      {stat.teamImages.member1Image && (
                        <img 
                          src={stat.teamImages.member1Image} 
                          alt="Player 1" 
                          className="w-6 h-6 rounded-full border border-white object-cover shadow-sm"
                          onError={(e) => { 
                            const target = e.target as HTMLImageElement
                            target.src = '/api/placeholder/24/24'
                          }}
                        />
                      )}
                      {stat.teamImages.member2Image && (
                        <img 
                          src={stat.teamImages.member2Image} 
                          alt="Player 2" 
                          className="w-6 h-6 rounded-full border border-white object-cover shadow-sm"
                          onError={(e) => { 
                            const target = e.target as HTMLImageElement
                            target.src = '/api/placeholder/24/24'
                          }}
                        />
                      )}
                      {(!stat.teamImages.member1Image && !stat.teamImages.member2Image) && (
                        <div className="w-6 h-6 rounded-full border border-white bg-gray-200 flex items-center justify-center">
                          <Users className="w-3 h-3 text-gray-600" />
                        </div>
                      )}
                    </div>
                    <div 
                      className="font-medium text-gray-900 text-sm truncate cursor-help" 
                      title={stat.teamName}
                    >
                      {stat.teamName}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 min-w-[60px]">
                      <div 
                        className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${stat.percentage}%` }}
                      ></div>
                    </div>
                    <div className="text-right min-w-[40px]">
                      <div className="font-semibold text-gray-900 text-sm">{stat.count}</div>
                      <div className="text-xs text-gray-500">{stat.percentage}%</div>
                    </div>
                  </div>
                </div>
              ))}
              {sortedTeamStats.length > 5 && (
                <div className="text-xs text-gray-500 text-center pt-2">
                  +{sortedTeamStats.length - 5} more teams
                </div>
              )}
            </div>
          </div>

          {/* Result Predictions Summary */}
          <div className="bg-white rounded-lg shadow-lg border border-orange-200">
            <div className="px-4 py-3 border-b border-orange-200 bg-gradient-to-r from-orange-50 to-red-50">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-orange-600" />
                <h3 className="text-base font-semibold text-orange-900">Final Score Predictions</h3>
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
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-orange-600" />
              <h3 className="text-base font-semibold text-orange-900">All Predictions</h3>
            </div>
          </div>
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="min-w-full divide-y divide-orange-100">
              <thead className="bg-orange-50 sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-orange-700 uppercase tracking-wider">
                    Player
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-orange-700 uppercase tracking-wider">
                    Team
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-orange-700 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-orange-700 uppercase tracking-wider">
                    Game
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-orange-100">
                {predictions.map((prediction) => (
                  <tr key={prediction.id} className="hover:bg-orange-50">
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-sm">
                        <div 
                          className="font-medium text-gray-900 truncate max-w-[80px] cursor-help" 
                          title={prediction.playerName}
                        >
                          {prediction.playerName}
                        </div>
                        <div 
                          className="text-xs text-gray-500 truncate max-w-[80px] cursor-help" 
                          title={prediction.companyEmail}
                        >
                          {formatEmail(prediction.companyEmail)}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-1">
                          {prediction.championTeam.team.member1Image && (
                            <img 
                              src={prediction.championTeam.team.member1Image} 
                              alt="Player 1" 
                              className="w-5 h-5 rounded-full border border-white object-cover shadow-sm"
                              onError={(e) => { 
                                const target = e.target as HTMLImageElement
                                target.src = '/api/placeholder/20/20'
                              }}
                            />
                          )}
                          {prediction.championTeam.team.member2Image && (
                            <img 
                              src={prediction.championTeam.team.member2Image} 
                              alt="Player 2" 
                              className="w-5 h-5 rounded-full border border-white object-cover shadow-sm"
                              onError={(e) => { 
                                const target = e.target as HTMLImageElement
                                target.src = '/api/placeholder/20/20'
                              }}
                            />
                          )}
                          {(!prediction.championTeam.team.member1Image && !prediction.championTeam.team.member2Image) && (
                            <div className="w-5 h-5 rounded-full border border-white bg-gray-200 flex items-center justify-center">
                              <Users className="w-3 h-3 text-gray-600" />
                            </div>
                          )}
                        </div>
                        <div 
                          className="font-medium text-gray-900 text-sm truncate max-w-[60px] cursor-help" 
                          title={prediction.championTeam.team.name}
                        >
                          {prediction.championTeam.team.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="font-mono text-sm font-bold text-orange-600">{prediction.matchResult}</div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="font-mono text-sm font-bold text-gray-600">{prediction.losingTeamScore}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default FinalMatchPredictionsDisplay
