'use client'

import { useState, useEffect } from 'react'
import { 
  Trophy, 
  Users, 
  CheckCircle, 
  X, 
  Save,
  RefreshCw,
  Target
} from 'lucide-react'

interface Team {
  id: string
  name: string
  member1Image?: string
  member2Image?: string
  tournamentTable: {
    name: string
  }
  predictableTeam?: {
    id: string
    isActive: boolean
  }
}

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

interface PredictableTeamsManagerProps {
  onClose: () => void
}

const PredictableTeamsManager = ({ onClose }: PredictableTeamsManagerProps) => {
  const [allTeams, setAllTeams] = useState<Team[]>([])
  const [predictableTeams, setPredictableTeams] = useState<PredictableTeam[]>([])
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch all teams and predictable teams in parallel
      const [allTeamsResponse, predictableTeamsResponse] = await Promise.all([
        fetch('/api/final-predictions/all-teams'),
        fetch('/api/final-predictions/predictable-teams')
      ])

      if (!allTeamsResponse.ok) {
        throw new Error('Failed to fetch teams')
      }

      if (!predictableTeamsResponse.ok) {
        throw new Error('Failed to fetch predictable teams')
      }

      const [allTeamsData, predictableTeamsData] = await Promise.all([
        allTeamsResponse.json(),
        predictableTeamsResponse.json()
      ])

      setAllTeams(allTeamsData.teams)
      setPredictableTeams(predictableTeamsData.predictableTeams)
      
      // Set initially selected teams
      const currentlyActiveTeamIds = allTeamsData.teams
        .filter((team: Team) => team.predictableTeam?.isActive)
        .map((team: Team) => team.id)
      
      setSelectedTeamIds(currentlyActiveTeamIds)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleTeamToggle = (teamId: string) => {
    setSelectedTeamIds(prev => 
      prev.includes(teamId)
        ? prev.filter(id => id !== teamId)
        : [...prev, teamId]
    )
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)

      const response = await fetch('/api/final-predictions/predictable-teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'set_predictable_teams',
          teamIds: selectedTeamIds
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save changes')
      }

      const result = await response.json()
      
      setNotification({
        type: 'success',
        message: result.message
      })

      // Refresh data to show updated state
      await fetchData()

      setTimeout(() => {
        setNotification(null)
      }, 3000)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  const getTeamPredictionCount = (teamId: string) => {
    const predictableTeam = predictableTeams.find(pt => pt.team.id === teamId)
    return predictableTeam?._count.predictions || 0
  }

  const groupedTeams = allTeams.reduce((groups, team) => {
    const tableName = team.tournamentTable.name
    if (!groups[tableName]) {
      groups[tableName] = []
    }
    groups[tableName].push(team)
    return groups
  }, {} as Record<string, Team[]>)

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Target className="w-6 h-6 text-orange-600" />
            Manage Final Match Prediction Teams
          </h2>
          <p className="text-gray-600 mt-1">
            Select which teams people can choose as champions for the final match prediction game.
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`rounded-lg p-4 border ${
          notification.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-lg">{notification.type === 'success' ? '✅' : '❌'}</span>
            <span className="font-medium">{notification.message}</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">❌</span>
            <span className="text-red-800 font-medium">Error: {error}</span>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-blue-600" />
            <div>
              <div className="text-xl font-semibold text-blue-900">{allTeams.length}</div>
              <div className="text-sm text-blue-600">Total Teams</div>
            </div>
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <div className="text-xl font-semibold text-green-900">{selectedTeamIds.length}</div>
              <div className="text-sm text-green-600">Available for Prediction</div>
            </div>
          </div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-600" />
            <div>
              <div className="text-xl font-semibold text-orange-900">
                {predictableTeams.reduce((sum, pt) => sum + pt._count.predictions, 0)}
              </div>
              <div className="text-sm text-orange-600">Total Predictions</div>
            </div>
          </div>
        </div>
      </div>

      {/* Team Selection */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Select Teams</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedTeamIds(allTeams.map(team => team.id))}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Select All
            </button>
            <button
              onClick={() => setSelectedTeamIds([])}
              className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Clear All
            </button>
            <button
              onClick={() => setSelectedTeamIds([])}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Close All Predictions
            </button>
            <button
              onClick={() => setSelectedTeamIds(allTeams.map(team => team.id))}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              Open All Predictions
            </button>
          </div>
        </div>

        {Object.entries(groupedTeams).map(([tableName, teams]) => (
          <div key={tableName} className="bg-white rounded-lg border shadow-sm">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <h4 className="font-medium text-gray-900">{tableName}</h4>
            </div>
            <div className="p-4 space-y-2">
              {teams.map((team) => {
                const isSelected = selectedTeamIds.includes(team.id)
                const predictionCount = getTeamPredictionCount(team.id)
                
                return (
                  <div
                    key={team.id}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-orange-300 bg-orange-50' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => handleTeamToggle(team.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        isSelected 
                          ? 'border-orange-500 bg-orange-500' 
                          : 'border-gray-300'
                      }`}>
                        {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                      </div>
                      
                      <div className="flex -space-x-1">
                        {team.member1Image && (
                          <img 
                            src={team.member1Image} 
                            alt="Player 1" 
                            className="w-8 h-8 rounded-full border border-white object-cover shadow-sm"
                            onError={(e) => { 
                              const target = e.target as HTMLImageElement
                              target.src = '/api/placeholder/32/32'
                            }}
                          />
                        )}
                        {team.member2Image && (
                          <img 
                            src={team.member2Image} 
                            alt="Player 2" 
                            className="w-8 h-8 rounded-full border border-white object-cover shadow-sm"
                            onError={(e) => { 
                              const target = e.target as HTMLImageElement
                              target.src = '/api/placeholder/32/32'
                            }}
                          />
                        )}
                        {(!team.member1Image && !team.member2Image) && (
                          <div className="w-8 h-8 rounded-full border border-white bg-gray-200 flex items-center justify-center">
                            <Users className="w-4 h-4 text-gray-600" />
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <div className="font-medium text-gray-900">{team.name}</div>
                        {predictionCount > 0 && (
                          <div className="text-xs text-orange-600">
                            {predictionCount} prediction{predictionCount !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {isSelected && (
                      <div className="text-orange-600">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-end border-t border-gray-200 pt-6">
        <button
          onClick={onClose}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {saving ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}

export default PredictableTeamsManager
