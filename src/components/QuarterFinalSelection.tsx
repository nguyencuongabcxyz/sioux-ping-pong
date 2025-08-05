'use client'

import { useState, useEffect } from 'react'
import { Users, Trophy, Target, CheckCircle, XCircle, ArrowRight } from 'lucide-react'

interface QualifiedTeam {
  id: string
  name: string
  member1Image?: string
  member2Image?: string
  tableName: string
  position: number
  wins: number
  losses: number
  points: number
  pointsAgainst: number
  gameDifference: number
  pointDifference: number
  wildcardPosition?: number
}

interface QuarterFinalMatch {
  id: string
  name: string
  homeTeamId: string | null
  awayTeamId: string | null
}

interface QuarterFinalSelectionProps {
  onGenerateBracket: (matches: QuarterFinalMatch[]) => void
  onCancel: () => void
}

const QuarterFinalSelection = ({ onGenerateBracket, onCancel }: QuarterFinalSelectionProps) => {
  const [qualifiedTeams, setQualifiedTeams] = useState<QualifiedTeam[]>([])
  const [thirdPlaceTeams, setThirdPlaceTeams] = useState<QualifiedTeam[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [needsTieBreak, setNeedsTieBreak] = useState(false)
  const [tiedTeams, setTiedTeams] = useState<QualifiedTeam[]>([])
  const [quarterFinalMatches, setQuarterFinalMatches] = useState<QuarterFinalMatch[]>([
    { id: 'qf1', name: 'QUARTER FINAL 1', homeTeamId: null, awayTeamId: null },
    { id: 'qf2', name: 'QUARTER FINAL 2', homeTeamId: null, awayTeamId: null },
    { id: 'qf3', name: 'QUARTER FINAL 3', homeTeamId: null, awayTeamId: null },
    { id: 'qf4', name: 'QUARTER FINAL 4', homeTeamId: null, awayTeamId: null }
  ])
  const [unassignedTeams, setUnassignedTeams] = useState<QualifiedTeam[]>([])

  useEffect(() => {
    fetchQualifiedTeams()
  }, [])

  useEffect(() => {
    // Update unassigned teams when qualified teams change
    const assignedTeamIds = quarterFinalMatches
      .flatMap(match => [match.homeTeamId, match.awayTeamId])
      .filter(id => id !== null) as string[]
    
    setUnassignedTeams(qualifiedTeams.filter(team => !assignedTeamIds.includes(team.id)))
  }, [qualifiedTeams, quarterFinalMatches])

  const fetchQualifiedTeams = async () => {
    try {
      const response = await fetch('/api/tournament/qualified-teams')
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error)
      }
      
      const data = await response.json()
      setQualifiedTeams(data.qualifiedTeams || [])
      setThirdPlaceTeams(data.thirdPlaceTeams || [])
      setNeedsTieBreak(data.needsTieBreak || false)
      setTiedTeams(data.tiedTeams || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch qualified teams')
    } finally {
      setLoading(false)
    }
  }

  const assignTeamToMatch = (teamId: string, matchId: string, position: 'home' | 'away') => {
    setQuarterFinalMatches(prev => prev.map(match => {
      if (match.id === matchId) {
        return {
          ...match,
          [position === 'home' ? 'homeTeamId' : 'awayTeamId']: teamId
        }
      }
      return match
    }))
  }

  const removeTeamFromMatch = (matchId: string, position: 'home' | 'away') => {
    setQuarterFinalMatches(prev => prev.map(match => {
      if (match.id === matchId) {
        return {
          ...match,
          [position === 'home' ? 'homeTeamId' : 'awayTeamId']: null
        }
      }
      return match
    }))
  }

  const getTeamById = (teamId: string) => {
    return qualifiedTeams.find(team => team.id === teamId)
  }

  const isTeamAssigned = (teamId: string) => {
    return quarterFinalMatches.some(match => 
      match.homeTeamId === teamId || match.awayTeamId === teamId
    )
  }

  const handleGenerateBracket = () => {
    const allMatchesFilled = quarterFinalMatches.every(match => 
      match.homeTeamId && match.awayTeamId
    )
    
    if (allMatchesFilled) {
      onGenerateBracket(quarterFinalMatches)
    }
  }

  const getPositionColor = (position: number) => {
    switch (position) {
      case 1: return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 2: return 'bg-gray-100 text-gray-800 border-gray-200'
      case 3: return 'bg-orange-100 text-orange-800 border-orange-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1: return '🥇'
      case 2: return '🥈'
      case 3: return '🥉'
      default: return '🏆'
    }
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

  if (needsTieBreak) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <Trophy className="w-6 h-6 text-yellow-600" />
          <h3 className="text-lg font-semibold text-yellow-900">Tie-Break Required</h3>
        </div>
        <p className="text-yellow-800 mb-4">
          There is a tie between third-place teams that needs to be resolved before proceeding with quarter-final assignment.
        </p>
        <div className="space-y-2">
          {tiedTeams.map((team) => (
            <div key={team.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border">
              <div className="flex -space-x-1">
                {team.member1Image && (
                  <img src={team.member1Image} alt="Player 1" className="w-6 h-6 rounded-full border border-white object-cover shadow-sm" />
                )}
                {team.member2Image && (
                  <img src={team.member2Image} alt="Player 2" className="w-6 h-6 rounded-full border border-white object-cover shadow-sm" />
                )}
                {(!team.member1Image && !team.member2Image) && (
                  <div className="w-6 h-6 rounded-full border border-white bg-gray-200 flex items-center justify-center">
                    <Users className="w-3 h-3 text-gray-600" />
                  </div>
                )}
              </div>
              <span className="font-medium">{team.name}</span>
              <span className="text-sm text-gray-600">({team.tableName} - 3rd place)</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const assignedCount = quarterFinalMatches.filter(match => 
    match.homeTeamId && match.awayTeamId
  ).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
          <Trophy className="w-6 h-6 text-purple-600" />
          Assign Teams to Quarter-Final Matches
        </h2>
        <p className="text-gray-600">
          Drag and drop teams to assign them to specific quarter-final matches. All 8 qualified teams must be assigned.
        </p>
        <div className="mt-4 flex items-center justify-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span>Matches Filled: {assignedCount}/4</span>
          </div>
          {assignedCount === 4 && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span>Ready to generate bracket</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quarter-Final Matches */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Quarter-Final Matches</h3>
          {quarterFinalMatches.map((match) => (
            <div key={match.id} className="bg-white rounded-lg border-2 border-purple-200 p-4">
              <h4 className="font-semibold text-purple-900 mb-3">{match.name}</h4>
              
              <div className="space-y-3">
                {/* Home Team */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-600">Home:</span>
                    {match.homeTeamId ? (
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-1">
                          {getTeamById(match.homeTeamId)?.member1Image && (
                            <img 
                              src={getTeamById(match.homeTeamId)?.member1Image} 
                              alt="Player 1" 
                              className="w-6 h-6 rounded-full border border-white object-cover shadow-sm"
                            />
                          )}
                          {getTeamById(match.homeTeamId)?.member2Image && (
                            <img 
                              src={getTeamById(match.homeTeamId)?.member2Image} 
                              alt="Player 2" 
                              className="w-6 h-6 rounded-full border border-white object-cover shadow-sm"
                            />
                          )}
                          {(!getTeamById(match.homeTeamId)?.member1Image && !getTeamById(match.homeTeamId)?.member2Image) && (
                            <div className="w-6 h-6 rounded-full border border-white bg-gray-200 flex items-center justify-center">
                              <Users className="w-3 h-3 text-gray-600" />
                            </div>
                          )}
                        </div>
                        <span className="font-medium">{getTeamById(match.homeTeamId)?.name}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">No team assigned</span>
                    )}
                  </div>
                  {match.homeTeamId && (
                    <button
                      onClick={() => removeTeamFromMatch(match.id, 'home')}
                      className="text-red-600 hover:text-red-800"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Away Team */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-600">Away:</span>
                    {match.awayTeamId ? (
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-1">
                          {getTeamById(match.awayTeamId)?.member1Image && (
                            <img 
                              src={getTeamById(match.awayTeamId)?.member1Image} 
                              alt="Player 1" 
                              className="w-6 h-6 rounded-full border border-white object-cover shadow-sm"
                            />
                          )}
                          {getTeamById(match.awayTeamId)?.member2Image && (
                            <img 
                              src={getTeamById(match.awayTeamId)?.member2Image} 
                              alt="Player 2" 
                              className="w-6 h-6 rounded-full border border-white object-cover shadow-sm"
                            />
                          )}
                          {(!getTeamById(match.awayTeamId)?.member1Image && !getTeamById(match.awayTeamId)?.member2Image) && (
                            <div className="w-6 h-6 rounded-full border border-white bg-gray-200 flex items-center justify-center">
                              <Users className="w-3 h-3 text-gray-600" />
                            </div>
                          )}
                        </div>
                        <span className="font-medium">{getTeamById(match.awayTeamId)?.name}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">No team assigned</span>
                    )}
                  </div>
                  {match.awayTeamId && (
                    <button
                      onClick={() => removeTeamFromMatch(match.id, 'away')}
                      className="text-red-600 hover:text-red-800"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Available Teams */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Available Teams ({unassignedTeams.length})</h3>
          
          {/* Qualified Teams */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 bg-green-50">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-900">Automatically Qualified</span>
              </div>
            </div>
            <div className="p-4 space-y-2">
              {unassignedTeams.filter(team => !team.wildcardPosition).map((team) => (
                <div
                  key={team.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    isTeamAssigned(team.id) 
                      ? 'border-gray-300 bg-gray-100 opacity-50 cursor-not-allowed' 
                      : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                  }`}
                  onClick={() => {
                    if (!isTeamAssigned(team.id)) {
                      // Find first match that needs a team
                      const emptyMatch = quarterFinalMatches.find(match => 
                        !match.homeTeamId || !match.awayTeamId
                      )
                      if (emptyMatch) {
                        const position = !emptyMatch.homeTeamId ? 'home' : 'away'
                        assignTeamToMatch(team.id, emptyMatch.id, position)
                      }
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{getPositionIcon(team.position)}</span>
                      <div className="flex -space-x-1">
                        {team.member1Image && (
                          <img 
                            src={team.member1Image} 
                            alt="Player 1" 
                            className="w-6 h-6 rounded-full border border-white object-cover shadow-sm"
                          />
                        )}
                        {team.member2Image && (
                          <img 
                            src={team.member2Image} 
                            alt="Player 2" 
                            className="w-6 h-6 rounded-full border border-white object-cover shadow-sm"
                          />
                        )}
                        {(!team.member1Image && !team.member2Image) && (
                          <div className="w-6 h-6 rounded-full border border-white bg-gray-200 flex items-center justify-center">
                            <Users className="w-3 h-3 text-gray-600" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{team.name}</div>
                        <div className="text-xs text-gray-600">
                          {team.tableName} - {team.position === 1 ? '1st' : '2nd'} • {team.wins}W {team.losses}L
                        </div>
                      </div>
                    </div>
                    {!isTeamAssigned(team.id) && (
                      <ArrowRight className="w-4 h-4 text-purple-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Third Place Teams */}
          {unassignedTeams.filter(team => team.wildcardPosition).length > 0 && (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 bg-orange-50">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-900">Wildcard Teams</span>
                </div>
              </div>
              <div className="p-4 space-y-2">
                {unassignedTeams.filter(team => team.wildcardPosition).map((team) => (
                  <div
                    key={team.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      isTeamAssigned(team.id) 
                        ? 'border-gray-300 bg-gray-100 opacity-50 cursor-not-allowed' 
                        : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                    }`}
                    onClick={() => {
                      if (!isTeamAssigned(team.id)) {
                        // Find first match that needs a team
                        const emptyMatch = quarterFinalMatches.find(match => 
                          !match.homeTeamId || !match.awayTeamId
                        )
                        if (emptyMatch) {
                          const position = !emptyMatch.homeTeamId ? 'home' : 'away'
                          assignTeamToMatch(team.id, emptyMatch.id, position)
                        }
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">🥉</span>
                        <div className="flex -space-x-1">
                          {team.member1Image && (
                            <img 
                              src={team.member1Image} 
                              alt="Player 1" 
                              className="w-6 h-6 rounded-full border border-white object-cover shadow-sm"
                            />
                          )}
                          {team.member2Image && (
                            <img 
                              src={team.member2Image} 
                              alt="Player 2" 
                              className="w-6 h-6 rounded-full border border-white object-cover shadow-sm"
                            />
                          )}
                          {(!team.member1Image && !team.member2Image) && (
                            <div className="w-6 h-6 rounded-full border border-white bg-gray-200 flex items-center justify-center">
                              <Users className="w-3 h-3 text-gray-600" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{team.name}</div>
                          <div className="text-xs text-gray-600">
                            {team.tableName} - 3rd (Wildcard #{team.wildcardPosition}) • {team.wins}W {team.losses}L
                          </div>
                        </div>
                      </div>
                      {!isTeamAssigned(team.id) && (
                        <ArrowRight className="w-4 h-4 text-purple-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center">
        <button
          onClick={onCancel}
          className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
        >
          <XCircle className="w-4 h-4" />
          Cancel
        </button>
        <button
          onClick={handleGenerateBracket}
          disabled={assignedCount !== 4}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          <Trophy className="w-4 h-4" />
          Generate Quarter-Final Bracket ({assignedCount}/4 matches filled)
        </button>
      </div>
    </div>
  )
}

export default QuarterFinalSelection 