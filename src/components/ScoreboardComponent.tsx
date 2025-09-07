'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, MapPin, Target, Trophy, Users, Plus, Minus, Save, RotateCcw, Play, CheckCircle, ArrowLeft } from 'lucide-react'

interface Team {
  id: string
  name: string
  member1Image?: string
  member2Image?: string
}

interface TournamentTable {
  id: string
  name: string
}

interface Game {
  id: string
  gameNumber: number
  homeScore: number
  awayScore: number
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED'
  completedAt?: string
}

interface Match {
  id: string
  scheduledAt: string
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  format: 'BO3' | 'BO5'
  matchType: 'GROUP_STAGE' | 'KNOCKOUT'
  round?: 'QUARTER_FINAL' | 'SEMI_FINAL' | 'FINAL' | 'THIRD_PLACE'
  homeGamesWon: number
  awayGamesWon: number
  homeScore?: number
  awayScore?: number
  completedAt?: string
  games: Game[]
  homeTeam: Team
  awayTeam: Team
  tournamentTable?: TournamentTable
}

interface MatchesResponse {
  matches: Match[]
  groupedMatches: Record<string, Match[]>
  total: number
}

const ScoreboardComponent = () => {
  const [matchesData, setMatchesData] = useState<MatchesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [editingScores, setEditingScores] = useState<Game[]>([])
  const [currentGameIndex, setCurrentGameIndex] = useState(0)
  const [saving, setSaving] = useState(false)
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null)

  useEffect(() => {
    fetchMatches()
  }, [])

  const fetchMatches = async () => {
    try {
      const response = await fetch(`/api/matches`)
      if (!response.ok) {
        throw new Error('Failed to fetch matches')
      }
      const data = await response.json()
      setMatchesData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      SCHEDULED: { color: 'bg-blue-100 text-blue-800', text: 'Scheduled' },
      IN_PROGRESS: { color: 'bg-yellow-100 text-yellow-800', text: 'In Progress' },
      COMPLETED: { color: 'bg-green-100 text-green-800', text: 'Completed' },
      CANCELLED: { color: 'bg-red-100 text-red-800', text: 'Cancelled' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.SCHEDULED
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    )
  }

  const getMatchTypeInfo = (matchType: string, round?: string) => {
    if (matchType === 'GROUP_STAGE') {
      return { icon: Target, text: 'Group Stage', color: 'text-blue-600' }
    } else if (matchType === 'KNOCKOUT') {
      const roundConfig = {
        QUARTER_FINAL: { text: 'Quarter Final', color: 'text-purple-600' },
        SEMI_FINAL: { text: 'Semi Final', color: 'text-orange-600' },
        FINAL: { text: 'Final', color: 'text-red-600' }
      }
      const config = roundConfig[round as keyof typeof roundConfig] || { text: 'Knockout', color: 'text-purple-600' }
      return { icon: Trophy, text: config.text, color: config.color }
    }
    return { icon: Target, text: 'Match', color: 'text-gray-600' }
  }

  const handleSelectMatch = (match: Match) => {
    setSelectedMatch(match)
    // Initialize games if they don't exist
    let games = [...match.games]
    if (games.length === 0) {
      const gameCount = match.format === 'BO5' ? 5 : 3
      games = Array.from({ length: gameCount }, (_, i) => ({
        id: `temp-${i + 1}`,
        gameNumber: i + 1,
        homeScore: 0,
        awayScore: 0,
        status: 'SCHEDULED' as const,
        completedAt: undefined
      }))
    }
    setEditingScores(games)
    setCurrentGameIndex(0)
  }

  const updateGameScore = (gameNumber: number, field: 'homeScore' | 'awayScore', value: number) => {
    setEditingScores(prev => prev.map(game => 
      game.gameNumber === gameNumber 
        ? { ...game, [field]: Math.max(0, value) }
        : game
    ))
  }

  const startGame = (gameNumber: number) => {
    setEditingScores(prev => prev.map(game => 
      game.gameNumber === gameNumber 
        ? { ...game, status: 'IN_PROGRESS' }
        : game
    ))
    setCurrentGameIndex(gameNumber - 1)
  }

  const completeGame = (gameNumber: number) => {
    setEditingScores(prev => prev.map(game => 
      game.gameNumber === gameNumber 
        ? { ...game, status: 'COMPLETED', completedAt: new Date().toISOString() }
        : game
    ))
    
    // Move to next game if available
    const nextGame = editingScores.find(g => g.gameNumber === gameNumber + 1 && g.status === 'SCHEDULED')
    if (nextGame) {
      setCurrentGameIndex(gameNumber)
      startGame(gameNumber + 1)
    }
  }

  const canCompleteGame = (game: Game) => {
    return game.status === 'IN_PROGRESS' && (game.homeScore > 0 || game.awayScore > 0)
  }

  const getCurrentGame = () => {
    if (!editingScores.length) return null
    return editingScores.find(game => game.status === 'IN_PROGRESS') || 
           editingScores.find(game => game.status === 'SCHEDULED')
  }

  const getMatchResult = () => {
    const completedGames = editingScores.filter(g => g.status === 'COMPLETED')
    let homeWins = 0
    let awayWins = 0
    
    completedGames.forEach(game => {
      if (game.homeScore > game.awayScore) {
        homeWins++
      } else if (game.awayScore > game.homeScore) {
        awayWins++
      }
    })
    
    return { homeWins, awayWins }
  }

  const isMatchComplete = () => {
    const { homeWins, awayWins } = getMatchResult()
    const requiredWins = selectedMatch?.format === 'BO5' ? 3 : 2
    return homeWins >= requiredWins || awayWins >= requiredWins
  }

  const saveMatchResult = async () => {
    if (!selectedMatch) return

    setSaving(true)
    try {
      const response = await fetch(`/api/matches/${selectedMatch.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format: selectedMatch.format,
          status: isMatchComplete() ? 'COMPLETED' : 'IN_PROGRESS',
          games: editingScores
        }),
      })

      if (response.ok) {
        const updatedMatch = await response.json()
        setNotification({ type: 'success', message: 'Match result saved successfully!' })
        
        // Update the match in the list
        if (matchesData) {
          setMatchesData({
            ...matchesData,
            matches: matchesData.matches.map(m => 
              m.id === selectedMatch.id ? updatedMatch : m
            )
          })
        }
        
        // Close the scoreboard after a delay
        setTimeout(() => {
          setSelectedMatch(null)
          setEditingScores([])
          setCurrentGameIndex(0)
          setNotification(null)
        }, 2000)
      } else {
        throw new Error('Failed to save match result')
      }
    } catch (error) {
      setNotification({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Failed to save match result' 
      })
    } finally {
      setSaving(false)
    }
  }

  const resetScores = () => {
    if (selectedMatch) {
      const gameCount = selectedMatch.format === 'BO5' ? 5 : 3
      const resetGames = Array.from({ length: gameCount }, (_, i) => ({
        id: `temp-${i + 1}`,
        gameNumber: i + 1,
        homeScore: 0,
        awayScore: 0,
        status: 'SCHEDULED' as const,
        completedAt: undefined
      }))
      setEditingScores(resetGames)
      setCurrentGameIndex(0)
    }
  }

  const currentGame = getCurrentGame()
  const { homeWins, awayWins } = getMatchResult()
  const firstScheduledGame = editingScores.find(g => g.status === 'SCHEDULED')
  const anyInProgress = editingScores.some(g => g.status === 'IN_PROGRESS')

  const renderTeamImages = (team: Team) => {
    const hasAny = Boolean(team.member1Image || team.member2Image)
    if (!hasAny) return null
    return (
      <div className="flex justify-center mb-2">
        <div className="flex -space-x-3">
          {team.member1Image && (
            <img
              src={team.member1Image}
              alt="Member 1"
              className="w-12 h-12 rounded-full object-cover ring-2 ring-white"
            />
          )}
          {team.member2Image && (
            <img
              src={team.member2Image}
              alt="Member 2"
              className="w-12 h-12 rounded-full object-cover ring-2 ring-white"
            />
          )}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2" style={{ borderColor: '#F15D03' }}></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-600">Error: {error}</p>
      </div>
    )
  }

  return (
    <div className="h-full">
      {/* Live Scoreboard Display */}
      {selectedMatch && (
        <div className="bg-white rounded-lg shadow-lg border overflow-hidden h-full p-4 flex flex-col">
          {/* Compact top bar with back button */}
          <div className="flex items-center mb-3">
            <button
              onClick={() => setSelectedMatch(null)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 text-sm hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          </div>

          {/* Body */}
          <div className="grid grid-cols-12 gap-4 overflow-hidden flex-1 min-h-0">
            {/* Left: Teams + Current Game */}
            <div className="col-span-12 lg:col-span-7 xl:col-span-8 h-full overflow-hidden min-h-0">
              {/* Teams */}
              <div className="bg-gray-50 rounded-md p-4 mb-4">
                <div className="grid grid-cols-2 gap-6">
                  {/* Home Team */}
                  <div className="text-center">
                    {renderTeamImages(selectedMatch.homeTeam)}
                    <h3 className="text-lg font-semibold text-gray-900">{selectedMatch.homeTeam.name}</h3>
                    <div className="text-3xl font-bold text-orange-600 mt-1">{homeWins}</div>
                    <div className="text-xs text-gray-500">Games Won</div>
                  </div>
                  {/* Away Team */}
                  <div className="text-center">
                    {renderTeamImages(selectedMatch.awayTeam)}
                    <h3 className="text-lg font-semibold text-gray-900">{selectedMatch.awayTeam.name}</h3>
                    <div className="text-3xl font-bold text-orange-600 mt-1">{awayWins}</div>
                    <div className="text-xs text-gray-500">Games Won</div>
                  </div>
                </div>
              </div>

              {/* Current Game Score */}
              {currentGame && (
                <div className="bg-white rounded-md p-4 h-[calc(100%-112px)] min-h-[260px] flex flex-col">
                  <div className="text-center mb-4 flex-shrink-0">
                    <h3 className="text-2xl font-bold text-gray-800">Game {currentGame.gameNumber}</h3>
                    <div className="text-sm text-gray-600">
                      {currentGame.status === 'SCHEDULED' && 'Ready to Start'}
                      {currentGame.status === 'IN_PROGRESS' && 'In Progress'}
                      {currentGame.status === 'COMPLETED' && 'Completed'}
                    </div>
                  </div>

                  {/* Massive Score Display */}
                  <div className="flex-1 min-h-0 flex justify-center items-center space-x-20 overflow-visible">
                    <div className="text-center">
                      <div className="relative inline-flex">
                        <div className="font-bold text-orange-600 leading-none text-[clamp(8rem,20vw,18rem)]">
                          {currentGame.homeScore}
                        </div>
                        {currentGame.status === 'IN_PROGRESS' && (
                          <div className="absolute -left-16 top-1/2 -translate-y-1/2 flex flex-col gap-2">
                            <button
                              onClick={() => updateGameScore(currentGame.gameNumber, 'homeScore', currentGame.homeScore + 1)}
                              className="w-14 h-14 rounded-full bg-green-100 text-green-600 hover:bg-green-200 flex items-center justify-center transition-colors shadow-md"
                            >
                              <Plus className="w-7 h-7" />
                            </button>
                            <button
                              onClick={() => updateGameScore(currentGame.gameNumber, 'homeScore', Math.max(0, currentGame.homeScore - 1))}
                              className="w-14 h-14 rounded-full bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center transition-colors shadow-md"
                            >
                              <Minus className="w-7 h-7" />
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="text-base text-gray-700 font-medium mt-3">Home Team</div>
                    </div>

                    <div className="font-bold text-gray-300 leading-none text-[clamp(6rem,12vw,12rem)]">:</div>

                    <div className="text-center">
                      <div className="relative inline-flex">
                        <div className="font-bold text-orange-600 leading-none text-[clamp(8rem,20vw,18rem)]">
                          {currentGame.awayScore}
                        </div>
                        {currentGame.status === 'IN_PROGRESS' && (
                          <div className="absolute -right-16 top-1/2 -translate-y-1/2 flex flex-col gap-2">
                            <button
                              onClick={() => updateGameScore(currentGame.gameNumber, 'awayScore', currentGame.awayScore + 1)}
                              className="w-14 h-14 rounded-full bg-green-100 text-green-600 hover:bg-green-200 flex items-center justify-center transition-colors shadow-md"
                            >
                              <Plus className="w-7 h-7" />
                            </button>
                            <button
                              onClick={() => updateGameScore(currentGame.gameNumber, 'awayScore', Math.max(0, currentGame.awayScore - 1))}
                              className="w-14 h-14 rounded-full bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center transition-colors shadow-md"
                            >
                              <Minus className="w-7 h-7" />
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="text-base text-gray-700 font-medium mt-3">Away Team</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-center gap-4 mt-4 flex-shrink-0">
                    {currentGame.status === 'SCHEDULED' && (
                      <button
                        onClick={() => startGame(currentGame.gameNumber)}
                        className="px-8 py-3 bg-blue-600 text-white rounded-lg text-base font-semibold hover:bg-blue-700 flex items-center gap-2 shadow-md"
                      >
                        <Play className="w-5 h-5" />
                        <span>Start Game</span>
                      </button>
                    )}
                    {currentGame.status === 'IN_PROGRESS' && canCompleteGame(currentGame) && (
                      <button
                        onClick={() => completeGame(currentGame.gameNumber)}
                        className="px-8 py-3 bg-green-600 text-white rounded-lg text-base font-semibold hover:bg-green-700 flex items-center gap-2 shadow-md"
                      >
                        <CheckCircle className="w-5 h-5" />
                        <span>End Game</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Progress + Actions */}
            <div className="col-span-12 lg:col-span-5 xl:col-span-4 h-full grid grid-rows-[auto,1fr,auto] gap-4 min-h-0">
              {/* Game Progress */}
              <div className="bg-gray-50 rounded-md p-4">
                <h4 className="text-base font-semibold text-gray-800 mb-3">Game Progress</h4>
                <div className="grid grid-cols-5 gap-2">
                  {editingScores.map((game) => (
                    <div
                      key={game.gameNumber}
                      className={`p-3 rounded-lg border text-center text-sm ${
                        game.status === 'COMPLETED'
                          ? 'bg-green-100 border-green-400 text-green-800'
                          : game.status === 'IN_PROGRESS'
                          ? 'bg-orange-100 border-orange-400 text-orange-800'
                          : 'bg-gray-100 border-gray-300 text-gray-600'
                      }`}
                    >
                      <div className="font-semibold">G{game.gameNumber}</div>
                      <div className="font-bold">{game.homeScore} — {game.awayScore}</div>
                      <div className="text-[10px] capitalize">{game.status.replace('_',' ')}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Spacer / Info */}
              <div className="overflow-auto rounded-md border p-4">
                <div className="text-sm text-gray-700 space-y-2">
                  <div className="flex items-center gap-2"><Target className="w-4 h-4 text-orange-600" /> <span>{selectedMatch.format}</span></div>
                  <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-500" /> <span>{formatDate(selectedMatch.scheduledAt)}</span></div>
                  <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-gray-500" /> <span>{formatTime(selectedMatch.scheduledAt)}</span></div>
                  {selectedMatch.tournamentTable && (
                    <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-500" /> <span>{selectedMatch.tournamentTable.name}</span></div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="bg-white rounded-md p-4 border">
                <div className="flex justify-between gap-3 items-center flex-wrap">
                  {!anyInProgress && firstScheduledGame && (
                    <button
                      onClick={() => startGame(firstScheduledGame.gameNumber)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700 flex items-center gap-2"
                    >
                      <Play className="w-4 h-4" />
                      Start Game
                    </button>
                  )}
                  {anyInProgress && currentGame && canCompleteGame(currentGame) && (
                    <button
                      onClick={() => completeGame(currentGame.gameNumber)}
                      className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-semibold hover:bg-green-700 flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      End Game
                    </button>
                  )}
                  <button
                    onClick={resetScores}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Reset All
                  </button>
                  {isMatchComplete() && (
                    <button
                      onClick={saveMatchResult}
                      disabled={saving}
                      className="px-5 py-2 bg-orange-600 text-white rounded-md text-sm font-semibold hover:bg-orange-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Saving...' : 'Save Result'}
                    </button>
                  )}
                </div>
                {!isMatchComplete() && editingScores.some(g => g.status === 'COMPLETED') && (
                  <p className="text-xs text-gray-500 mt-3">Complete all games to save the match result</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 p-4 rounded-md shadow-lg z-50 ${
          notification.type === 'success' ? 'bg-green-500 text-white' :
          notification.type === 'error' ? 'bg-red-500 text-white' :
          'bg-blue-500 text-white'
        }`}>
          {notification.message}
        </div>
      )}

      {/* Matches List */}
      {!selectedMatch && (
        <div className="space-y-4 h-full overflow-auto pr-1">
          <h3 className="text-lg font-semibold text-gray-900">Select a Match to Score</h3>
          
          {matchesData?.matches.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No matches found with the current filters.
            </div>
          ) : (
            matchesData?.matches.map(match => (
              <div
                key={match.id}
                onClick={() => handleSelectMatch(match)}
                className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {(() => {
                        const { icon: Icon, text, color } = getMatchTypeInfo(match.matchType, match.round)
                        return (
                          <div className={`flex items-center space-x-1 ${color}`}>
                            <Icon className="w-4 h-4" />
                            <span className="text-sm font-medium">{text}</span>
                          </div>
                        )
                      })()}
                      
                      {match.tournamentTable && (
                        <div className="flex items-center space-x-1 text-gray-500">
                          <MapPin className="w-4 h-4" />
                          <span className="text-sm">{match.tournamentTable.name}</span>
                        </div>
                      )}
                      
                      {getStatusBadge(match.status)}
                    </div>
                    
                    <div className="flex items-center space-x-4 mb-2">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{match.homeTeam.name}</span>
                        <span className="text-gray-500">vs</span>
                        <span className="font-medium">{match.awayTeam.name}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(match.scheduledAt)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{formatTime(match.scheduledAt)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Target className="w-4 h-4" />
                        <span>{match.format}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-orange-600">
                      {match.homeGamesWon} - {match.awayGamesWon}
                    </div>
                    <div className="text-sm text-gray-500">Games</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default ScoreboardComponent
