'use client'

import { useEffect, useState } from 'react'
import { Calendar, Clock, MapPin, Trophy, Users, Filter, Target, Crown } from 'lucide-react'

interface Team {
  id: string
  name: string
  wins: number
  losses: number
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
  round?: 'QUARTER_FINAL' | 'SEMI_FINAL' | 'FINAL'
  homeGamesWon: number
  awayGamesWon: number
  homeScore?: number // Legacy/total points
  awayScore?: number // Legacy/total points
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

const MatchSchedules = () => {
  const [matchesData, setMatchesData] = useState<MatchesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [tableFilter, setTableFilter] = useState<string>('all')
  const [tables, setTables] = useState<TournamentTable[]>([])

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const params = new URLSearchParams()
        if (statusFilter !== 'all') {
          params.append('status', statusFilter)
        }
        if (tableFilter !== 'all') {
          params.append('tableId', tableFilter)
        }

        const response = await fetch(`/api/matches?${params.toString()}`)
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

    const fetchTables = async () => {
      try {
        const response = await fetch('/api/tables')
        if (response.ok) {
          const data = await response.json()
          setTables(data)
        }
      } catch (err) {
        console.error('Error fetching tables:', err)
      }
    }

    fetchMatches()
    fetchTables()
  }, [statusFilter, tableFilter])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow'
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric' 
      })
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      SCHEDULED: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Scheduled' },
      IN_PROGRESS: { bg: '', text: 'text-white', label: 'Live', customBg: '#F15D03' },
      COMPLETED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Final' },
      CANCELLED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelled' },
    }
    
    const config = statusConfig[status as keyof typeof statusConfig]
    return (
      <span 
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
        style={'customBg' in config ? { backgroundColor: config.customBg } : {}}
      >
        {config.label}
      </span>
    )
  }

  const formatMatchResult = (match: Match) => {
    if (match.games.length === 0) {
      // Legacy format fallback
      return {
        homeDisplay: match.homeScore?.toString() || '-',
        awayDisplay: match.awayScore?.toString() || '-',
        gameDetails: null
      }
    }

    const completedGames = match.games.filter(g => g.status === 'COMPLETED')
    return {
      homeDisplay: match.homeGamesWon.toString(),
      awayDisplay: match.awayGamesWon.toString(),
      gameDetails: completedGames.map(g => `${g.homeScore}-${g.awayScore}`).join(', ')
    }
  }

  const PlayerImages = ({ team }: { team: Team }) => {
    return (
      <div className="flex -space-x-1">
        {team.member1Image && (
          <img 
            src={team.member1Image} 
            alt="Player 1" 
            className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-white object-cover shadow-sm bg-gray-100"
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
            className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-white object-cover shadow-sm bg-gray-100"
            onError={(e) => { 
              const target = e.target as HTMLImageElement
              target.src = '/api/placeholder/32/32'
            }}
          />
        )}
        {(!team.member1Image && !team.member2Image) && (
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center">
            <Users className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
          </div>
        )}
      </div>
    )
  }

  const getMatchTypeInfo = (matchType: string, round?: string) => {
    if (matchType === 'KNOCKOUT') {
      const roundLabels = {
        'QUARTER_FINAL': 'Quarter-Final',
        'SEMI_FINAL': 'Semi-Final',
        'FINAL': 'Final'
      }
      return {
        label: round ? roundLabels[round as keyof typeof roundLabels] : 'Knockout',
        icon: round === 'FINAL' ? Crown : Target,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200'
      }
    }
    return {
      label: 'Group Stage',
      icon: Trophy,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    }
  }

  // Group matches by match type first, then by date
  const groupMatchesByTypeAndDate = (matches: Match[]) => {
    const grouped = {
      GROUP_STAGE: {} as Record<string, Match[]>,
      KNOCKOUT: {} as Record<string, Match[]>
    }

    matches.forEach(match => {
      const dateKey = match.scheduledAt.split('T')[0]
      if (!grouped[match.matchType][dateKey]) {
        grouped[match.matchType][dateKey] = []
      }
      grouped[match.matchType][dateKey].push(match)
    })

    return grouped
  }

  const MatchCard = ({ match }: { match: Match }) => {
    const result = formatMatchResult(match)
    const matchTypeInfo = getMatchTypeInfo(match.matchType, match.round)
    const isCompleted = match.status === 'COMPLETED'
    const homeWinner = isCompleted && match.homeGamesWon > match.awayGamesWon
    const awayWinner = isCompleted && match.awayGamesWon > match.homeGamesWon

    return (
      <div className="p-3 sm:p-4 lg:p-6 hover:bg-gray-50 transition-colors">
        {/* Match Info Header */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-3 sm:mb-4">
          <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-500">
            <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
            {formatTime(match.scheduledAt)}
          </div>
          {match.tournamentTable && (
            <div className={`flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-semibold px-2 sm:px-3 py-1 rounded-full border ${
              match.tournamentTable.name === 'Table A' 
                ? 'bg-orange-100 text-orange-800 border-orange-200' 
                : match.tournamentTable.name === 'Table B'
                ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
                : match.tournamentTable.name === 'Table C'
                ? 'bg-purple-100 text-purple-800 border-purple-200'
                : 'bg-blue-100 text-blue-800 border-blue-200'
            }`}>
              <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
              {match.tournamentTable.name}
            </div>
          )}
          {match.matchType === 'KNOCKOUT' && match.round && (
            <div className={`flex items-center gap-1 text-xs sm:text-sm px-2 py-1 rounded-full ${matchTypeInfo.bgColor} ${matchTypeInfo.color} border ${matchTypeInfo.borderColor}`}>
              <matchTypeInfo.icon className="w-3 h-3" />
              {matchTypeInfo.label}
            </div>
          )}
          {getStatusBadge(match.status)}
          <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {match.format}
          </div>
        </div>

        {/* Teams and Results */}
        <div className="space-y-4">
          {/* Mobile Layout */}
          <div className="md:hidden">
            {/* Home Team */}
            <div className={`flex items-center justify-between p-3 sm:p-4 rounded-lg border-2 transition-all ${
              homeWinner 
                ? 'bg-green-50 border-green-200 shadow-sm' 
                : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center gap-2 sm:gap-3">
                <PlayerImages team={match.homeTeam} />
                <div>
                  <div className={`font-semibold text-sm sm:text-base ${homeWinner ? 'text-green-800' : 'text-gray-900'}`}>
                    {match.homeTeam.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {match.homeTeam.wins}W - {match.homeTeam.losses}L
                  </div>
                </div>
              </div>
              {isCompleted && (
                <div className="text-right">
                  <div className={`text-2xl sm:text-3xl font-bold ${homeWinner ? 'text-green-600' : 'text-gray-400'}`}>
                    {result.homeDisplay}
                  </div>
                  <div className="text-xs text-gray-500">games won</div>
                </div>
              )}
            </div>

            {/* VS/Result Status */}
            <div className="flex flex-col items-center justify-center py-2 sm:py-3">
              {isCompleted ? (
                <div className="text-center">
                  <div className="text-base sm:text-lg font-bold text-gray-600 mb-1">FINAL</div>
                  {result.gameDetails && (
                    <div className="text-xs sm:text-sm text-gray-500 bg-gray-100 px-2 sm:px-3 py-1 rounded-full">
                      Game Scores: {result.gameDetails}
                    </div>
                  )}
                </div>
              ) : match.status === 'IN_PROGRESS' ? (
                <div className="text-yellow-600 font-bold text-base sm:text-lg animate-pulse">LIVE</div>
              ) : (
                <div className="text-gray-500 font-medium text-base sm:text-lg">VS</div>
              )}
            </div>

            {/* Away Team */}
            <div className={`flex items-center justify-between p-3 sm:p-4 rounded-lg border-2 transition-all ${
              awayWinner 
                ? 'bg-green-50 border-green-200 shadow-sm' 
                : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center gap-2 sm:gap-3">
                <PlayerImages team={match.awayTeam} />
                <div>
                  <div className={`font-semibold text-sm sm:text-base ${awayWinner ? 'text-green-800' : 'text-gray-900'}`}>
                    {match.awayTeam.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {match.awayTeam.wins}W - {match.awayTeam.losses}L
                  </div>
                </div>
              </div>
              {isCompleted && (
                <div className="text-right">
                  <div className={`text-2xl sm:text-3xl font-bold ${awayWinner ? 'text-green-600' : 'text-gray-400'}`}>
                    {result.awayDisplay}
                  </div>
                  <div className="text-xs text-gray-500">games won</div>
                </div>
              )}
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden md:grid md:grid-cols-5 gap-6 items-center">
            {/* Home Team */}
            <div className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
              homeWinner ? 'bg-green-50' : 'bg-gray-50'
            }`}>
              <PlayerImages team={match.homeTeam} />
              <div>
                <div className={`font-semibold ${homeWinner ? 'text-green-800' : 'text-gray-900'}`}>
                  {match.homeTeam.name}
                </div>
                <div className="text-xs text-gray-500">
                  {match.homeTeam.wins}W - {match.homeTeam.losses}L
                </div>
              </div>
            </div>

            {/* Home Score */}
            <div className="text-center">
              {isCompleted && (
                <div className={`text-4xl font-bold ${homeWinner ? 'text-green-600' : 'text-gray-400'}`}>
                  {result.homeDisplay}
                </div>
              )}
            </div>

            {/* VS/Status */}
            <div className="text-center">
              {isCompleted ? (
                <div>
                  <div className="text-lg font-bold text-gray-600 mb-2">FINAL</div>
                  {result.gameDetails && (
                    <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {result.gameDetails}
                    </div>
                  )}
                </div>
              ) : match.status === 'IN_PROGRESS' ? (
                <div className="text-yellow-600 font-bold text-lg animate-pulse">LIVE</div>
              ) : (
                <div className="text-gray-500 font-medium text-lg">VS</div>
              )}
            </div>

            {/* Away Score */}
            <div className="text-center">
              {isCompleted && (
                <div className={`text-4xl font-bold ${awayWinner ? 'text-green-600' : 'text-gray-400'}`}>
                  {result.awayDisplay}
                </div>
              )}
            </div>

            {/* Away Team */}
            <div className={`flex items-center gap-3 justify-end p-3 rounded-lg transition-all ${
              awayWinner ? 'bg-green-50' : 'bg-gray-50'
            }`}>
              <div className="text-right">
                <div className={`font-semibold ${awayWinner ? 'text-green-800' : 'text-gray-900'}`}>
                  {match.awayTeam.name}
                </div>
                <div className="text-xs text-gray-500">
                  {match.awayTeam.wins}W - {match.awayTeam.losses}L
                </div>
              </div>
              <PlayerImages team={match.awayTeam} />
            </div>
          </div>
        </div>
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
        <p className="text-red-600">Error loading matches: {error}</p>
      </div>
    )
  }

  if (!matchesData) {
    return null
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Filter by Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Filter by Table
            </label>
            <select
              value={tableFilter}
              onChange={(e) => setTableFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Tables</option>
              {tables.map((table) => (
                <option key={table.id} value={table.id}>
                  {table.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => {
                setStatusFilter('all')
                setTableFilter('all')
              }}
              className="w-full sm:w-auto px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors text-sm"
            >
              Clear Filters
            </button>
          </div>
        </div>
        
        <div className="mt-3 sm:mt-4 text-sm text-gray-600">
          Showing {matchesData.matches.length} of {matchesData.total} matches
        </div>
      </div>

      {/* Match Results Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 sm:p-6 border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Tournament Progress</h2>
            <p className="text-sm text-gray-600">Total matches: {matchesData.total}</p>
          </div>
          <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
        </div>
      </div>

      {/* Matches by Type */}
      {matchesData.matches.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No matches found for the selected filters</p>
        </div>
      ) : (
        (() => {
          const groupedByType = groupMatchesByTypeAndDate(matchesData.matches)
          
          return (
            <div className="space-y-6 sm:space-y-8">
              {/* Group Stage Matches */}
              {Object.keys(groupedByType.GROUP_STAGE).length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b-2 border-blue-200">
                    <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                    <h2 className="text-xl sm:text-2xl font-bold text-blue-900">Group Stage</h2>
                    <div className="text-xs sm:text-sm text-blue-600 bg-blue-100 px-2 sm:px-3 py-1 rounded-full">
                      Round Robin
                    </div>
                  </div>
                  
                  {Object.entries(groupedByType.GROUP_STAGE)
                    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
                    .map(([date, matches]) => (
                      <div key={`group-${date}`} className="bg-white rounded-lg shadow-sm border border-blue-200 overflow-hidden">
                        <div className="bg-blue-50 px-4 sm:px-6 py-3 border-b border-blue-200">
                          <h3 className="text-base sm:text-lg font-semibold text-blue-900 flex items-center gap-2">
                            <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                            {formatDate(date)}
                          </h3>
                        </div>
                        
                        <div className="divide-y divide-blue-100">
                          {matches
                            .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
                            .map((match) => (
                              <MatchCard key={match.id} match={match} />
                            ))}
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* Knockout Stage Matches */}
              {Object.keys(groupedByType.KNOCKOUT).length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b-2 border-purple-200">
                    <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                    <h2 className="text-xl sm:text-2xl font-bold text-purple-900">Knockout Stage</h2>
                    <div className="text-xs sm:text-sm text-purple-600 bg-purple-100 px-2 sm:px-3 py-1 rounded-full">
                      Single Elimination
                    </div>
                  </div>
                  
                  {Object.entries(groupedByType.KNOCKOUT)
                    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
                    .map(([date, matches]) => (
                      <div key={`knockout-${date}`} className="bg-white rounded-lg shadow-sm border border-purple-200 overflow-hidden">
                        <div className="bg-purple-50 px-4 sm:px-6 py-3 border-b border-purple-200">
                          <h3 className="text-base sm:text-lg font-semibold text-purple-900 flex items-center gap-2">
                            <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                            {formatDate(date)}
                          </h3>
                        </div>
                        
                        <div className="divide-y divide-purple-100">
                          {matches
                            .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
                            .map((match) => (
                              <MatchCard key={match.id} match={match} />
                            ))}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )
        })()
      )}
    </div>
  )
}

export default MatchSchedules