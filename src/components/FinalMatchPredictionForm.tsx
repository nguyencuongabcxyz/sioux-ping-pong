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
  AlertCircle
} from 'lucide-react'

interface PredictableTeam {
  id: string
  team: {
    id: string
    name: string
    member1Image?: string
    member2Image?: string
    tournamentTable: {
      name: string
    }
  }
  _count: {
    predictions: number
  }
}

interface FinalMatchPredictionFormProps {
  onPredictionSubmitted: () => void
}

const FinalMatchPredictionForm = ({ onPredictionSubmitted }: FinalMatchPredictionFormProps) => {
  const [predictableTeams, setPredictableTeams] = useState<PredictableTeam[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    playerName: '',
    companyEmail: '',
    championTeamId: '',
    matchResult: '3-0',
    losingTeamScore: 0
  })

  useEffect(() => {
    fetchPredictableTeams()
  }, [])

  useEffect(() => {
    // Update losing team score when match result changes
    const losingScore = parseInt(formData.matchResult.split('-')[1])
    setFormData(prev => ({ ...prev, losingTeamScore: losingScore }))
  }, [formData.matchResult])

  // Validate form data
  const isFormValid = () => {
    return formData.playerName && 
           formData.companyEmail && 
           formData.championTeamId && 
           formData.losingTeamScore >= 0 && 
           formData.losingTeamScore <= 11
  }

  const fetchPredictableTeams = async () => {
    try {
      const response = await fetch('/api/final-predictions/predictable-teams')
      if (response.ok) {
        const data = await response.json()
        setPredictableTeams(data.predictableTeams)
      } else {
        setError('Failed to load teams available for prediction')
      }
    } catch (err) {
      setError('Failed to load teams available for prediction')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setSubmitting(true)

    try {
      const response = await fetch('/api/final-predictions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('🎉 Your prediction has been submitted successfully! It will appear in the public predictions list.')
        setFormData({
          playerName: '',
          companyEmail: '',
          championTeamId: '',
          matchResult: '3-0',
          losingTeamScore: 0
        })
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

  const selectedTeam = predictableTeams.find(pt => pt.id === formData.championTeamId)

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  if (predictableTeams.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-2">
          <AlertCircle className="w-6 h-6 text-yellow-600" />
          <h3 className="text-lg font-semibold text-yellow-900">Predictions Not Available</h3>
        </div>
        <p className="text-yellow-800">
          The admin has not yet selected teams for the final match prediction game. 
          Please check back later!
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border border-orange-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-orange-200 bg-gradient-to-r from-orange-50 to-red-50">
        <div className="flex items-center gap-3">
          <Trophy className="w-6 h-6 text-orange-600" />
          <h2 className="text-xl font-bold text-orange-900">Make Your Final Match Prediction</h2>
        </div>
        <p className="text-orange-700 mt-1">
          Predict who will win the championship and the final match score!
        </p>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <X className="w-5 h-5 text-red-600" />
              <span className="text-red-800 font-medium">{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-green-800 font-medium">{success}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <p className="text-xs text-gray-500 mt-1">
                Only one prediction per email address is allowed
              </p>
            </div>
          </div>

          {/* Champion Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <Trophy className="w-4 h-4 inline mr-1" />
              Select Your Champion *
            </label>
            <div className="space-y-2">
              {predictableTeams.map((predictableTeam) => (
                <div
                  key={predictableTeam.id}
                  className={`border rounded-lg cursor-pointer transition-all p-3 ${
                    formData.championTeamId === predictableTeam.id
                      ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200'
                      : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                  }`}
                  onClick={() => setFormData({ ...formData, championTeamId: predictableTeam.id })}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-1">
                      {predictableTeam.team.member1Image && (
                        <img 
                          src={predictableTeam.team.member1Image} 
                          alt="Player 1" 
                          className="w-8 h-8 rounded-full border border-white object-cover shadow-sm"
                          onError={(e) => { 
                            const target = e.target as HTMLImageElement
                            target.src = '/api/placeholder/32/32'
                          }}
                        />
                      )}
                      {predictableTeam.team.member2Image && (
                        <img 
                          src={predictableTeam.team.member2Image} 
                          alt="Player 2" 
                          className="w-8 h-8 rounded-full border border-white object-cover shadow-sm"
                          onError={(e) => { 
                            const target = e.target as HTMLImageElement
                            target.src = '/api/placeholder/32/32'
                          }}
                        />
                      )}
                      {(!predictableTeam.team.member1Image && !predictableTeam.team.member2Image) && (
                        <div className="w-8 h-8 rounded-full border border-white bg-gray-200 flex items-center justify-center">
                          <Users className="w-4 h-4 text-gray-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{predictableTeam.team.name}</div>
                        <div className="text-xs text-gray-500">{predictableTeam.team.tournamentTable.name}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {predictableTeam._count.predictions > 0 && (
                          <div className="text-xs text-orange-600">
                            {predictableTeam._count.predictions} prediction{predictableTeam._count.predictions !== 1 ? 's' : ''}
                          </div>
                        )}
                        {formData.championTeamId === predictableTeam.id && (
                          <CheckCircle className="w-5 h-5 text-orange-600" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Match Result Prediction */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <Target className="w-4 h-4 inline mr-1" />
              Final Match Result *
            </label>
            <div className="grid grid-cols-3 gap-3">
              {['3-0', '3-1', '3-2'].map((result) => (
                <div
                  key={result}
                  className={`border rounded-lg cursor-pointer transition-all p-4 text-center ${
                    formData.matchResult === result
                      ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200'
                      : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                  }`}
                  onClick={() => setFormData({ ...formData, matchResult: result })}
                >
                  <div className="text-2xl font-bold text-gray-900">{result}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {result === '3-0' ? 'Dominant Win' :
                     result === '3-1' ? 'Comfortable Win' :
                     'Close Match'}
                  </div>
                  {formData.matchResult === result && (
                    <CheckCircle className="w-5 h-5 text-orange-600 mx-auto mt-2" />
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              In table tennis, matches are played as &quot;Best of 5&quot; - first to win 3 games wins the match.
            </p>
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
            <p className="text-xs text-gray-500 mt-2">
              Enter the points the losing team scores in the final game of the match (0-11).
            </p>
            <p className="text-xs text-gray-400 mt-1">
              In table tennis, games are played to 11 points. The losing team might score 8, 9, or 10 points in the final game.
            </p>
          </div>

          {/* Prediction Summary */}
          {selectedTeam && (
            <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-4">
              <h3 className="font-semibold text-orange-900 mb-2">Your Prediction Summary:</h3>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Champion:</span>
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-1">
                      {selectedTeam.team.member1Image && (
                        <img 
                          src={selectedTeam.team.member1Image} 
                          alt="Player 1" 
                          className="w-6 h-6 rounded-full border border-white object-cover shadow-sm"
                        />
                      )}
                      {selectedTeam.team.member2Image && (
                        <img 
                          src={selectedTeam.team.member2Image} 
                          alt="Player 2" 
                          className="w-6 h-6 rounded-full border border-white object-cover shadow-sm"
                        />
                      )}
                    </div>
                    <span className="font-medium text-orange-900">{selectedTeam.team.name}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Final Score:</span>
                  <span className="font-mono text-lg font-bold text-orange-900">{formData.matchResult}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Final Game Score:</span>
                  <span className="font-mono text-lg font-bold text-orange-900">{formData.losingTeamScore}</span>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-center pt-4">
            <button
              type="submit"
              disabled={submitting || !isFormValid()}
              className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-8 py-3 rounded-lg hover:from-orange-700 hover:to-red-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all flex items-center gap-2 text-lg font-semibold"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Submit My Prediction
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default FinalMatchPredictionForm
