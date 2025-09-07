'use client'

import { useState, useEffect } from 'react'
import { 
  Trophy, 
  Users, 
  User,
  Mail,
  Target,
  Send,
  CheckCircle,
  X,
  AlertCircle,
  Calendar,
  Clock,
  Eye
} from 'lucide-react'
import MatchPredictionsDisplay from './MatchPredictionsDisplay'
import CompletedMatchResults from './CompletedMatchResults'

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

interface MatchPredictionFormProps {
  onPredictionSubmitted: () => void
  refreshTrigger?: number
}

const MatchPredictionForm = ({ onPredictionSubmitted }: MatchPredictionFormProps) => {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    playerName: '',
    companyEmail: '',
    matchId: '',
    winningTeamId: '',
    matchResult: '3-0',
    losingTeamScore: 0
  })

  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [showPredictionsModal, setShowPredictionsModal] = useState(false)
  const [selectedMatchForPredictions, setSelectedMatchForPredictions] = useState<Match | null>(null)
  const [showCompletedResultsModal, setShowCompletedResultsModal] = useState(false)
  const [selectedCompletedMatch, setSelectedCompletedMatch] = useState<Match | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    fetchMatches()
  }, [])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showPredictionsModal) {
      // Store current scroll position
      const scrollY = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
      document.body.style.overflow = 'hidden'
      
      // Cleanup function to restore scroll
      return () => {
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.width = ''
        document.body.style.overflow = ''
        window.scrollTo(0, scrollY)
      }
    }
  }, [showPredictionsModal])

  useEffect(() => {
    // Update losing team score when match result changes
    const losingScore = parseInt(formData.matchResult.split('-')[1])
    setFormData(prev => ({ ...prev, losingTeamScore: losingScore }))
  }, [formData.matchResult])

  // Debug: Log form data changes
  useEffect(() => {
    console.log('Form data changed:', formData)
  }, [formData])

  // Validate form data
  const isFormValid = () => {
    return formData.playerName && 
           formData.companyEmail && 
           formData.matchId && 
           formData.winningTeamId && 
           formData.losingTeamScore >= 0 && 
           formData.losingTeamScore <= 11
  }

  const fetchMatches = async () => {
    try {
      const response = await fetch('/api/match-predictions/matches')
      if (response.ok) {
        const data = await response.json()
        console.log('MatchPredictionForm - Fetched matches:', data.matches)
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

  const handleMatchSelect = (match: Match) => {
    // Only select matches with valid data
    if (!match || !match.homeTeam || !match.awayTeam) {
      console.warn('Attempted to select invalid match:', match)
      return
    }
    
    setSelectedMatch(match)
    setFormData(prev => ({ 
      ...prev, 
      matchId: match.id
      // Don't reset winningTeamId - let user keep their selection
    }))
  }

  const handleViewPredictions = (matchId: string) => {
    const match = matches.find(m => m.id === matchId)
    if (match) {
      setSelectedMatchForPredictions(match)
      setShowPredictionsModal(true)
    }
  }

  const handleViewCompletedMatchResults = (matchId: string) => {
    const match = matches.find(m => m.id === matchId)
    if (match) {
      setSelectedCompletedMatch(match)
      setShowCompletedResultsModal(true)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setSubmitting(true)

    try {
      const response = await fetch('/api/match-predictions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('🎉 Your match prediction has been submitted successfully!')
        setFormData({
          playerName: '',
          companyEmail: '',
          matchId: '',
          winningTeamId: '',
          matchResult: '3-0',
          losingTeamScore: 0
        })
        setSelectedMatch(null)
        setRefreshTrigger(prev => prev + 1)
        onPredictionSubmitted()
      } else {
        setError(data.error || 'Failed to submit prediction')
      }
    } catch (err) {
      setError('Failed to submit prediction. Please try again.')
    } finally {
      setSubmitting(false)
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  if (matches.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-2">
          <AlertCircle className="w-6 h-6 text-yellow-600" />
          <h3 className="text-lg font-semibold text-yellow-900">No Scheduled Matches</h3>
        </div>
        <p className="text-yellow-800">
          There are no scheduled matches available for predictions at the moment. 
          Please check back later!
        </p>
      </div>
    )
  }

  const validMatches = matches.filter(match => 
    match.homeTeam && 
    match.awayTeam
  )
  const openMatches = validMatches.filter(match => match.status === 'SCHEDULED' && match.predictionsOpen)
  const closedMatches = validMatches.filter(match => match.status === 'SCHEDULED' && !match.predictionsOpen)
  const completedMatches = validMatches.filter(match => match.status === 'COMPLETED')

  return (
    <div className="space-y-6">
      {/* Match Selection */}
      <div className="bg-white rounded-lg shadow-lg border border-orange-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-orange-200 bg-gradient-to-r from-orange-50 to-red-50">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-orange-600" />
            <h2 className="text-xl font-bold text-orange-900">Select a Match to Predict</h2>
          </div>
          <p className="text-orange-700 mt-1">
            Choose from the matches below that are open for predictions
          </p>
        </div>

        <div className="p-6">
          {/* Open Matches */}
          {openMatches.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-green-700 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Open for Predictions ({openMatches.length})
              </h3>
              <div className="space-y-3">
                {openMatches.map((match) => {
                  // Skip matches with invalid data
                  if (!match || !match.homeTeam || !match.awayTeam) {
                    return null
                  }
                  
                  const { date, time } = formatDateTime(match.scheduledAt || null)
                  return (
                    <div
                      key={match.id || 'unknown'}
                      className={`border rounded-lg cursor-pointer transition-all p-4 w-full ${
                        formData.matchId === (match.id || '')
                          ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
                          : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                      }`}
                      onClick={() => handleMatchSelect(match)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>{date}</span>
                          <Clock className="w-4 h-4" />
                          <span>{time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleViewPredictions(match.id || '')
                            }}
                            className="flex items-center gap-2 px-2 py-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors text-sm"
                            title="View others predictions for this match"
                          >
                            <Eye className="w-4 h-4" />
                            <span className="whitespace-nowrap">View others predictions</span>
                          </button>
                          <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                            Open
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="flex -space-x-1">
                            {match.homeTeam?.member1Image && (
                              <img 
                                src={match.homeTeam.member1Image} 
                                alt="Player 1" 
                                className="w-8 h-8 rounded-full border border-white object-cover shadow-sm"
                                onError={(e) => { 
                                  const target = e.target as HTMLImageElement
                                  target.src = '/api/placeholder/32/32'
                                }}
                              />
                            )}
                            {match.homeTeam?.member2Image && (
                              <img 
                                src={match.homeTeam.member2Image} 
                                alt="Player 2" 
                                className="w-8 h-8 rounded-full border border-white object-cover shadow-sm"
                                onError={(e) => { 
                                  const target = e.target as HTMLImageElement
                                  target.src = '/api/placeholder/32/32'
                                }}
                              />
                            )}
                          </div>
                          <span className="font-medium text-gray-900 text-lg">{match.homeTeam?.name || 'Unknown Team'}</span>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <span className="text-gray-400 font-bold text-xl px-4">VS</span>
                          <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                            {match.tournamentTable?.name || 'No Table'} • {match._count?.predictions || 0} prediction{(match._count?.predictions || 0) !== 1 ? 's' : ''}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 flex-1 justify-end">
                          <span className="font-medium text-gray-900 text-lg">{match.awayTeam?.name || 'Unknown Team'}</span>
                          <div className="flex -space-x-1">
                            {match.awayTeam?.member1Image && (
                              <img 
                                src={match.awayTeam.member1Image} 
                                alt="Player 1" 
                                className="w-8 h-8 rounded-full border border-white object-cover shadow-sm"
                                onError={(e) => { 
                                  const target = e.target as HTMLImageElement
                                  target.src = '/api/placeholder/32/32'
                                }}
                              />
                            )}
                            {match.awayTeam?.member2Image && (
                              <img 
                                src={match.awayTeam.member2Image} 
                                alt="Player 2" 
                                className="w-8 h-8 rounded-full border border-white object-cover shadow-sm"
                                onError={(e) => { 
                                  const target = e.target as HTMLImageElement
                                  target.src = '/api/placeholder/32/24'
                                }}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                      

                      
                      {formData.matchId === (match.id || '') && (
                        <CheckCircle className="w-5 h-5 text-green-600 mx-auto mt-2" />
                      )}
                      
                      {/* Show Prediction Form directly below selected match */}
                      {formData.matchId === (match.id || '') && (
                        <div className="mt-4 p-4 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg">
                          <div className="flex items-center gap-3 mb-4">
                            <Trophy className="w-6 h-6 text-orange-600" />
                            <h3 className="text-lg font-bold text-orange-900">Make Your Prediction</h3>
                          </div>
                          
                          {error && (
                            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                              <div className="flex items-center gap-2">
                                <X className="w-4 h-4 text-red-600" />
                                <span className="text-red-800 text-sm">{error}</span>
                              </div>
                            </div>
                          )}

                          {success && (
                            <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span className="text-green-800 text-sm">{success}</span>
                              </div>
                            </div>
                          )}
                          
                          <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Player Name */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                <User className="w-4 h-4 inline mr-1" />
                                Your Name *
                              </label>
                              <input
                                type="text"
                                required
                                value={formData.playerName}
                                onChange={(e) => setFormData({ ...formData, playerName: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                placeholder="Enter your full name"
                              />
                            </div>

                            {/* Company Email */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Mail className="w-4 h-4 inline mr-1" />
                                Company Email *
                              </label>
                              <input
                                type="email"
                                required
                                value={formData.companyEmail}
                                onChange={(e) => setFormData({ ...formData, companyEmail: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                placeholder="your.email@company.com"
                              />
                            </div>

                            {/* Winning Team Prediction */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Trophy className="w-4 h-4 inline mr-1" />
                                Predict Winning Team *
                              </label>
                              <p className="text-xs text-gray-500 mb-3">
                                Who do you think will win this match? This is your prediction, not your preference.
                              </p>
                              <div className="grid grid-cols-2 gap-3">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const teamId = match.homeTeam?.id || ''
                                    console.log('Home team clicked:', teamId)
                                    console.log('Previous formData:', formData)
                                    setFormData(prev => {
                                      const newData = { ...prev, winningTeamId: teamId }
                                      console.log('New formData:', newData)
                                      return newData
                                    })
                                  }}
                                  className={`p-3 border rounded-lg transition-all cursor-pointer ${
                                    formData.winningTeamId === match.homeTeam?.id
                                      ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200'
                                      : 'border-gray-300 hover:border-orange-300 hover:bg-orange-50'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
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
                                    <span className="font-medium text-gray-900 text-sm">{match.homeTeam?.name}</span>
                                    {formData.winningTeamId === match.homeTeam?.id && (
                                      <CheckCircle className="w-4 h-4 text-orange-600" />
                                    )}
                                  </div>
                                </button>
                                
                                <button
                                  type="button"
                                  onClick={() => {
                                    const teamId = match.awayTeam?.id || ''
                                    console.log('Away team clicked:', teamId)
                                    console.log('Previous formData:', formData)
                                    setFormData(prev => {
                                      const newData = { ...prev, winningTeamId: teamId }
                                      console.log('New formData:', newData)
                                      return newData
                                    })
                                  }}
                                  className={`p-3 border rounded-lg transition-all cursor-pointer ${
                                    formData.winningTeamId === match.awayTeam?.id
                                      ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200'
                                      : 'border-gray-300 hover:border-orange-300 hover:bg-orange-50'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900 text-sm">{match.awayTeam?.name}</span>
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
                                    {formData.winningTeamId === match.awayTeam?.id && (
                                      <CheckCircle className="w-4 h-4 text-orange-600" />
                                    )}
                                  </div>
                                </button>
                              </div>
                            </div>

                            {/* Match Result */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Target className="w-4 h-4 inline mr-1" />
                                Match Result *
                              </label>
                              <div className="grid grid-cols-3 gap-2">
                                {['3-0', '3-1', '3-2'].map((result) => (
                                  <button
                                    key={result}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, matchResult: result })}
                                    className={`p-2 border rounded-lg transition-all text-center ${
                                      formData.matchResult === result
                                        ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200'
                                        : 'border-gray-300 hover:border-orange-300 hover:bg-orange-50'
                                    }`}
                                  >
                                    <div className="text-lg font-bold text-gray-900">{result}</div>
                                    <div className="text-xs text-gray-500">
                                      {result === '3-0' ? 'Dominant' :
                                       result === '3-1' ? 'Comfortable' :
                                       'Close'}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Losing Team Final Game Score */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Target className="w-4 h-4 inline mr-1" />
                                Losing Team&apos;s Final Game Score *
                              </label>
                              <div className="max-w-xs">
                                <input
                                  type="number"
                                  min="0"
                                  max="11"
                                  required
                                  value={formData.losingTeamScore}
                                  onChange={(e) => {
                                    const value = parseInt(e.target.value) || 0
                                    setFormData({ ...formData, losingTeamScore: value })
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-center text-lg font-mono"
                                  placeholder="8"
                                />
                              </div>
                            </div>

                            {/* Debug Info - Remove this later */}
                            <div className="bg-gray-100 border border-gray-300 rounded-lg p-3 text-xs">
                              <div className="font-semibold mb-2">Debug Info:</div>
                              <div>Selected Match ID: {formData.matchId}</div>
                              <div>Winning Team ID: {formData.winningTeamId || 'None'}</div>
                              <div>Home Team ID: {match.homeTeam?.id}</div>
                              <div>Away Team ID: {match.awayTeam?.id}</div>
                              <div>Form Valid: {isFormValid() ? 'Yes' : 'No'}</div>
                            </div>

                            {/* Prediction Summary */}
                            {formData.winningTeamId && (
                              <div className="bg-white border border-orange-200 rounded-lg p-3">
                                <h4 className="font-semibold text-orange-900 mb-2 text-sm">Your Prediction Summary:</h4>
                                <div className="text-xs space-y-1">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Predicted Winner:</span>
                                    <span className="font-medium text-orange-900">
                                      {match.homeTeam?.id === formData.winningTeamId 
                                        ? match.homeTeam?.name
                                        : match.awayTeam?.name}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Predicted Score:</span>
                                    <span className="font-mono font-bold text-orange-900">{formData.matchResult}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Predicted Game Points:</span>
                                    <span className="font-mono font-bold text-orange-900">{formData.losingTeamScore}</span>
                                  </div>
                                </div>
                                <div className="mt-2 pt-2 border-t border-orange-100">
                                  <p className="text-xs text-gray-500">
                                    💡 Remember: This is your prediction of what will happen, not what you want to happen!
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Submit Button */}
                            <div className="flex justify-center pt-2">
                              <button
                                type="submit"
                                disabled={submitting || !isFormValid()}
                                className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-2 rounded-lg hover:from-orange-700 hover:to-red-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all flex items-center gap-2 font-semibold"
                              >
                                {submitting ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Submitting...
                                  </>
                                ) : (
                                  <>
                                    <Send className="w-4 h-4" />
                                    Submit Prediction
                                  </>
                                )}
                              </button>
                            </div>
                          </form>
                        </div>
                      )}
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
              <div className="space-y-3">
                {closedMatches.map((match) => {
                  // Skip matches with invalid data
                  if (!match || !match.homeTeam || !match.awayTeam) {
                    return null
                  }
                  
                  const { date, time } = formatDateTime(match.scheduledAt || null)
                  return (
                    <div
                      key={match.id || 'unknown'}
                      className="border border-gray-200 rounded-lg p-4 bg-gray-50 opacity-75 w-full"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          <span>{date}</span>
                          <Clock className="w-4 h-4" />
                          <span>{time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleViewPredictions(match.id || '')
                            }}
                            className="flex items-center gap-2 px-2 py-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors text-sm"
                            title="View others predictions for this match"
                          >
                            <Eye className="w-4 h-4" />
                            <span className="whitespace-nowrap">View others predictions</span>
                          </button>
                          <div className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                            Closed
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3 flex-1">
                          <span className="font-medium text-gray-500 text-lg">{match.homeTeam.name}</span>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <span className="text-gray-500 font-bold text-xl px-4">VS</span>
                          <div className="text-xs text-gray-400 bg-gray-200 px-3 py-1 rounded-full">
                            {match.tournamentTable?.name || 'No Table'} • {match._count?.predictions || 0} prediction{(match._count?.predictions || 0) !== 1 ? 's' : ''}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 flex-1 justify-end">
                          <span className="font-medium text-gray-500 text-lg">{match.awayTeam.name}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Completed Matches with Results */}
          {completedMatches.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-green-600 mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Completed Matches ({completedMatches.length})
              </h3>
              <div className="space-y-3">
                {completedMatches.map((match) => {
                  // Skip matches with invalid data
                  if (!match || !match.homeTeam || !match.awayTeam) {
                    return null
                  }
                  
                  const { date, time } = formatDateTime(match.scheduledAt || null)
                  return (
                    <div
                      key={match.id || 'unknown'}
                      className="border border-green-200 rounded-lg p-4 bg-green-50 w-full"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <Calendar className="w-4 h-4" />
                          <span>{date}</span>
                          <Clock className="w-4 h-4" />
                          <span>{time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleViewPredictions(match.id || '')
                            }}
                            className="flex items-center gap-2 px-2 py-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors text-sm"
                            title="View others predictions for this match"
                          >
                            <Eye className="w-4 h-4" />
                            <span className="whitespace-nowrap">View others predictions</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleViewCompletedMatchResults(match.id || '')
                            }}
                            className="flex items-center gap-2 px-2 py-1.5 text-green-600 hover:text-green-700 hover:bg-green-100 rounded-lg transition-colors text-sm"
                            title="View match results and predictions"
                          >
                            <Trophy className="w-4 h-4" />
                            <span className="whitespace-nowrap">View Results</span>
                          </button>
                          <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                            Completed
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3 flex-1">
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
                          <span className="font-medium text-green-800 text-lg">{match.homeTeam.name}</span>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <span className="text-green-600 font-bold text-xl px-4">VS</span>
                          <div className="text-xs text-green-600 bg-green-100 px-3 py-1 rounded-full">
                            {match.tournamentTable?.name || 'No Table'} • {match._count?.predictions || 0} prediction{(match._count?.predictions || 0) !== 1 ? 's' : ''}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 flex-1 justify-end">
                          <span className="font-medium text-green-800 text-lg">{match.awayTeam.name}</span>
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
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      

      {/* Predictions Modal */}
      {showPredictionsModal && selectedMatchForPredictions && (
        <div className="fixed inset-0 bg-black bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-2xl max-w-5xl w-full max-h-[85vh] overflow-hidden border border-white/20">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50/90 to-red-50/90 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <Trophy className="w-7 h-7 text-orange-600" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Predictions for {selectedMatchForPredictions.homeTeam?.name} vs {selectedMatchForPredictions.awayTeam?.name}
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowPredictionsModal(false)
                  setSelectedMatchForPredictions(null)
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(85vh-120px)]">
              <MatchPredictionsDisplay 
                refreshTrigger={refreshTrigger || 0} 
                selectedMatchId={selectedMatchForPredictions.id}
                showOnlySelectedMatch={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* Completed Match Results Modal */}
      {showCompletedResultsModal && selectedCompletedMatch && (
        <div className="fixed inset-0 bg-black bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-2xl max-w-6xl w-full max-h-[85vh] overflow-hidden border border-white/20">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-green-50/90 to-emerald-50/90 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <Trophy className="w-7 h-7 text-green-600" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Match Results: {selectedCompletedMatch.homeTeam?.name} vs {selectedCompletedMatch.awayTeam?.name}
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowCompletedResultsModal(false)
                  setSelectedCompletedMatch(null)
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(85vh-120px)]">
              <CompletedMatchResults 
                matchId={selectedCompletedMatch.id}
                refreshTrigger={refreshTrigger || 0}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MatchPredictionForm
