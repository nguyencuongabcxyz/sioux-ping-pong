'use client'

import { useEffect, useState } from 'react'
import { Calendar, Clock, MapPin, Trophy, Users, Filter } from 'lucide-react'

interface Team {
  id: string
  name: string
  wins: number
  losses: number
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
  homeGamesWon: number
  awayGamesWon: number
  homeScore?: number // Legacy/total points
  awayScore?: number // Legacy/total points
  completedAt?: string
  games: Game[]
  homeTeam: Team
  awayTeam: Team
  tournamentTable: TournamentTable
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

    fetchMatches()
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
      hour12: true,
    })
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      SCHEDULED: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Scheduled' },
      IN_PROGRESS: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Live' },
      COMPLETED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Final' },
      CANCELLED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelled' },
    }
    
    const config = statusConfig[status as keyof typeof statusConfig]
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
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
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 sm:flex-none"
            >
              <option value="all">All Statuses</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            
            <select
              value={tableFilter}
              onChange={(e) => setTableFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 sm:flex-none"
            >
              <option value="all">All Tables</option>
              <option value="table1">Table 1</option>
              <option value="table2">Table 2</option>
              <option value="table3">Table 3</option>
            </select>
          </div>
        </div>
      </div>

      {/* Match Results Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Tournament Progress</h2>
            <p className="text-gray-600">Total matches: {matchesData.total}</p>
          </div>
          <Trophy className="w-8 h-8 text-blue-600" />
        </div>
      </div>

      {/* Grouped Matches */}
      {Object.entries(matchesData.groupedMatches).length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No matches found for the selected filters</p>
        </div>
      ) : (
        Object.entries(matchesData.groupedMatches)
          .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
          .map(([date, matches]) => (
            <div key={date} className="bg-white rounded-lg shadow-sm border overflow-hidden">
              {/* Date Header */}
              <div className="bg-gray-50 px-6 py-3 border-b">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  {formatDate(date)}
                </h3>
              </div>
              
              {/* Matches for this date */}
              <div className="divide-y divide-gray-100">
                {matches
                  .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
                  .map((match) => (
                    <div key={match.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          {/* Match Info */}
                          <div className="flex items-center gap-4 mb-3">
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Clock className="w-4 h-4" />
                              {formatTime(match.scheduledAt)}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <MapPin className="w-4 h-4" />
                              {match.tournamentTable.name}
                            </div>
                            {getStatusBadge(match.status)}
                          </div>
                          
                          {/* Teams and Score */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                            {/* Mobile-optimized layout */}
                            <div className="md:hidden col-span-1">
                              <div className="space-y-3">
                                {/* Home Team - Mobile */}
                                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                      <Users className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div>
                                      <div className="font-medium text-gray-900">{match.homeTeam.name}</div>
                                      <div className="text-xs text-gray-500">
                                        {match.homeTeam.wins}W - {match.homeTeam.losses}L
                                      </div>
                                    </div>
                                  </div>
                                  {match.status === 'COMPLETED' && (
                                    <div className="text-right">
                                      <div className={`text-xl font-bold ${
                                        match.homeGamesWon > match.awayGamesWon 
                                          ? 'text-green-600' 
                                          : 'text-gray-400'
                                      }`}>
                                        {formatMatchResult(match).homeDisplay}
                                      </div>
                                      <div className="text-xs text-gray-500">games</div>
                                    </div>
                                  )}
                                </div>
                                
                                {/* VS Status - Mobile */}
                                <div className="flex flex-col items-center justify-center py-2">
                                  {match.status === 'COMPLETED' ? (
                                    <div>
                                      <div className="text-gray-400 font-medium text-center">FINAL</div>
                                      {formatMatchResult(match).gameDetails && (
                                        <div className="text-xs text-gray-500 mt-1 text-center">
                                          ({formatMatchResult(match).gameDetails})
                                        </div>
                                      )}
                                    </div>
                                  ) : match.status === 'IN_PROGRESS' ? (
                                    <div className="text-yellow-600 font-medium animate-pulse">LIVE</div>
                                  ) : (
                                    <div className="text-gray-400 font-medium">VS</div>
                                  )}
                                </div>
                                
                                {/* Away Team - Mobile */}
                                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                                      <Users className="w-4 h-4 text-red-600" />
                                    </div>
                                    <div>
                                      <div className="font-medium text-gray-900">{match.awayTeam.name}</div>
                                      <div className="text-xs text-gray-500">
                                        {match.awayTeam.wins}W - {match.awayTeam.losses}L
                                      </div>
                                    </div>
                                  </div>
                                  {match.status === 'COMPLETED' && (
                                    <div className="text-right">
                                      <div className={`text-xl font-bold ${
                                        match.awayGamesWon > match.homeGamesWon 
                                          ? 'text-green-600' 
                                          : 'text-gray-400'
                                      }`}>
                                        {formatMatchResult(match).awayDisplay}
                                      </div>
                                      <div className="text-xs text-gray-500">games</div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            {/* Home Team - Desktop */}
                            <div className="hidden md:flex items-center justify-between md:justify-start">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                  <Users className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">{match.homeTeam.name}</div>
                                  <div className="text-xs text-gray-500">
                                    {match.homeTeam.wins}W - {match.homeTeam.losses}L
                                  </div>
                                </div>
                              </div>
                              {match.status === 'COMPLETED' && (
                                <div className="text-right mr-4">
                                  <div className={`text-2xl font-bold ${
                                    match.homeGamesWon > match.awayGamesWon 
                                      ? 'text-green-600' 
                                      : 'text-gray-400'
                                  }`}>
                                    {formatMatchResult(match).homeDisplay}
                                  </div>
                                  <div className="text-xs text-gray-500">games</div>
                                </div>
                              )}
                            </div>
                            
                            {/* VS or Status - Desktop */}
                            <div className="hidden md:flex flex-col items-center justify-center">
                              {match.status === 'COMPLETED' ? (
                                <div>
                                  <div className="text-gray-400 font-medium text-center">FINAL</div>
                                  {formatMatchResult(match).gameDetails && (
                                    <div className="text-xs text-gray-500 mt-1 text-center">
                                      ({formatMatchResult(match).gameDetails})
                                    </div>
                                  )}
                                </div>
                              ) : match.status === 'IN_PROGRESS' ? (
                                <div className="text-yellow-600 font-medium animate-pulse">LIVE</div>
                              ) : (
                                <div className="text-gray-400 font-medium">VS</div>
                              )}
                            </div>
                            
                            {/* Away Team - Desktop */}
                            <div className="hidden md:flex items-center justify-between md:justify-end">
                              {match.status === 'COMPLETED' && (
                                <div className="text-left ml-4">
                                  <div className={`text-2xl font-bold ${
                                    match.awayGamesWon > match.homeGamesWon 
                                      ? 'text-green-600' 
                                      : 'text-gray-400'
                                  }`}>
                                    {formatMatchResult(match).awayDisplay}
                                  </div>
                                  <div className="text-xs text-gray-500">games</div>
                                </div>
                              )}
                              <div className="flex items-center gap-3">
                                <div className="text-right md:text-left">
                                  <div className="font-medium text-gray-900">{match.awayTeam.name}</div>
                                  <div className="text-xs text-gray-500">
                                    {match.awayTeam.wins}W - {match.awayTeam.losses}L
                                  </div>
                                </div>
                                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                                  <Users className="w-4 h-4 text-red-600" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))
      )}
    </div>
  )
}

export default MatchSchedules