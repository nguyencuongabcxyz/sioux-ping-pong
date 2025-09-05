'use client'

import { useState, useEffect } from 'react'
import { 
  Calendar, 
  Clock, 
  Users, 
  ToggleLeft, 
  ToggleRight,
  CheckCircle,
  X,
  RefreshCw,
  AlertCircle
} from 'lucide-react'

interface Match {
  id: string
  scheduledAt: string
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
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
  predictionsOpen: boolean
  _count: {
    predictions: number
  }
}

interface MatchPredictionManagerProps {
  onClose: () => void
}

const MatchPredictionManager = ({ onClose }: MatchPredictionManagerProps) => {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetchMatches()
  }, [])

  const fetchMatches = async () => {
    try {
      setError(null)
      const response = await fetch('/api/match-predictions/matches')
      if (response.ok) {
        const data = await response.json()
        console.log('Fetched matches data:', data.matches)
        setMatches(data.matches)
      } else {
        setError('Failed to load scheduled matches')
      }
    } catch (err) {
      setError('Failed to load scheduled matches')
    } finally {
      setLoading(false)
    }
  }

  const togglePredictionStatus = async (matchId: string, currentStatus: boolean) => {
    setUpdating(matchId)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/match-predictions/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          matchId,
          predictionsOpen: !currentStatus
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(data.message)
        // Update the local state
        setMatches(prev => prev.map(match => 
          match.id === matchId 
            ? { ...match, predictionsOpen: !currentStatus }
            : match
        ))
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(data.error || 'Failed to update prediction status')
      }
    } catch (err) {
      setError('Failed to update prediction status')
    } finally {
      setUpdating(null)
    }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    }
  }

  const scheduledMatches = matches.filter(match => 
    match.status === 'SCHEDULED' && 
    match.homeTeam && 
    match.awayTeam
  )
  const openMatches = scheduledMatches.filter(match => match.predictionsOpen)
  const closedMatches = scheduledMatches.filter(match => !match.predictionsOpen)

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="w-8 h-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Match Prediction Manager</h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <p className="text-gray-600">
        Control which scheduled matches are open for user predictions. Users can only make predictions 
        for matches that are marked as open.
      </p>

      {/* Notifications */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <X className="w-5 h-5 text-red-600" />
            <span className="text-red-800 font-medium">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800 font-medium">{success}</span>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-blue-600" />
            <div>
              <div className="text-2xl font-bold text-blue-900">{scheduledMatches.length}</div>
              <div className="text-sm text-blue-700">Scheduled Matches</div>
            </div>
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <div className="text-2xl font-bold text-green-900">{openMatches.length}</div>
              <div className="text-sm text-green-700">Open for Predictions</div>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <X className="w-8 h-8 text-gray-600" />
            <div>
              <div className="text-2xl font-bold text-gray-900">{closedMatches.length}</div>
              <div className="text-sm text-gray-700">Closed for Predictions</div>
            </div>
          </div>
        </div>
      </div>

      {/* Open Matches */}
      {openMatches.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-green-700 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Open for Predictions ({openMatches.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {openMatches.map((match) => {
              const { date, time } = formatDateTime(match.scheduledAt)
              return (
                <div key={match.id} className="border border-green-200 rounded-lg p-4 bg-green-50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <Calendar className="w-4 h-4" />
                      <span>{date}</span>
                      <Clock className="w-4 h-4" />
                      <span>{time}</span>
                    </div>
                    <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                      Open
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-2 flex-1">
                      <div className="flex -space-x-1">
                        {match.homeTeam?.member1Image && (
                          <img 
                            src={match.homeTeam.member1Image} 
                            alt="Player 1" 
                            className="w-6 h-6 rounded-full border border-white object-cover shadow-sm"
                            onError={(e) => { 
                              const target = e.target as HTMLImageElement
                              target.src = '/api/placeholder/24/24'
                            }}
                          />
                        )}
                        {match.homeTeam?.member2Image && (
                          <img 
                            src={match.homeTeam.member2Image} 
                            alt="Player 2" 
                            className="w-6 h-6 rounded-full border border-white object-cover shadow-sm"
                            onError={(e) => { 
                              const target = e.target as HTMLImageElement
                              target.src = '/api/placeholder/24/24'
                            }}
                          />
                        )}
                      </div>
                      <span className="font-medium text-gray-900">{match.homeTeam?.name || 'Unknown Team'}</span>
                    </div>
                    <span className="text-gray-400 font-bold">VS</span>
                    <div className="flex items-center gap-2 flex-1 justify-end">
                      <span className="font-medium text-gray-900">{match.awayTeam?.name || 'Unknown Team'}</span>
                      <div className="flex -space-x-1">
                        {match.awayTeam?.member1Image && (
                          <img 
                            src={match.awayTeam.member1Image} 
                            alt="Player 1" 
                            className="w-6 h-6 rounded-full border border-white object-cover shadow-sm"
                            onError={(e) => { 
                              const target = e.target as HTMLImageElement
                              target.src = '/api/placeholder/24/24'
                            }}
                          />
                        )}
                        {match.awayTeam?.member2Image && (
                          <img 
                            src={match.awayTeam.member2Image} 
                            alt="Player 2" 
                            className="w-6 h-6 rounded-full border border-white object-cover shadow-sm"
                            onError={(e) => { 
                              const target = e.target as HTMLImageElement
                              target.src = '/api/placeholder/24/24'
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 mb-3">
                    {match.tournamentTable?.name || 'No Table'} • {match._count.predictions} prediction{match._count.predictions !== 1 ? 's' : ''}
                  </div>

                  <button
                    onClick={() => togglePredictionStatus(match.id, true)}
                    disabled={updating === match.id}
                    className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {updating === match.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Closing...
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-4 h-4" />
                        Close Predictions
                      </>
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Closed Matches */}
      {closedMatches.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-500 mb-4 flex items-center gap-2">
            <X className="w-5 h-5" />
            Closed for Predictions ({closedMatches.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {closedMatches.map((match) => {
              const { date, time } = formatDateTime(match.scheduledAt)
              return (
                <div key={match.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>{date}</span>
                      <Clock className="w-4 h-4" />
                      <span>{time}</span>
                    </div>
                    <div className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                      Closed
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="font-medium text-gray-500">{match.homeTeam?.name || 'Unknown Team'}</span>
                    </div>
                    <span className="text-gray-400 font-bold">VS</span>
                    <div className="flex items-center gap-2 flex-1 justify-end">
                      <span className="font-medium text-gray-500">{match.awayTeam?.name || 'Unknown Team'}</span>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-400 mb-3">
                    {match.tournamentTable?.name || 'No Table'} • {match._count.predictions} prediction{match._count.predictions !== 1 ? 's' : ''}
                  </div>

                  <button
                    onClick={() => togglePredictionStatus(match.id, false)}
                    disabled={updating === match.id}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {updating === match.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Opening...
                      </>
                    ) : (
                      <>
                        <ToggleRight className="w-4 h-4" />
                        Open Predictions
                      </>
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* No Scheduled Matches */}
      {scheduledMatches.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-yellow-600" />
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">No Scheduled Matches</h3>
          <p className="text-yellow-800">
            There are no scheduled matches available at the moment. 
            Schedule some matches first to enable predictions.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <button
          onClick={fetchMatches}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  )
}

export default MatchPredictionManager
