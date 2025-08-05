'use client'

import { useState, useEffect } from 'react'
import { signOut } from 'next-auth/react'
import { 
  Calendar, 
  Trophy, 
  Users, 
  BarChart3, 
  LogOut, 
  Edit3, 
  Save, 
  X 
} from 'lucide-react'

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
  homeScore?: number // Legacy field
  awayScore?: number // Legacy field
  homeTeam: { id: string; name: string }
  awayTeam: { id: string; name: string }
  tournamentTable: { id: string; name: string }
  games: Game[]
}

const AdminDashboard = () => {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [editingMatch, setEditingMatch] = useState<string | null>(null)
  const [tournamentStage, setTournamentStage] = useState<any>(null)
  const [editForm, setEditForm] = useState({
    format: 'BO3' as Match['format'],
    status: 'SCHEDULED' as Match['status'],
    games: [] as Array<{ gameNumber: number; homeScore: string; awayScore: string; status: Game['status'] }>
  })

  useEffect(() => {
    fetchMatches()
    fetchTournamentStage()
  }, [])

  const fetchMatches = async () => {
    try {
      const response = await fetch('/api/matches')
      if (response.ok) {
        const data = await response.json()
        setMatches(data.matches)
      }
    } catch (error) {
      console.error('Error fetching matches:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTournamentStage = async () => {
    try {
      const response = await fetch('/api/tournament/knockout')
      if (response.ok) {
        const data = await response.json()
        setTournamentStage(data)
      }
    } catch (error) {
      console.error('Error fetching tournament stage:', error)
    }
  }

  const generateKnockout = async () => {
    try {
      const response = await fetch('/api/tournament/knockout', { method: 'POST' })
      if (response.ok) {
        await fetchTournamentStage()
        await fetchMatches() // Refresh to show new knockout matches
        alert('Knockout bracket generated successfully!')
      } else {
        const errorData = await response.json()
        alert(`Error: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error generating knockout:', error)
      alert('Failed to generate knockout bracket')
    }
  }

  const handleEditMatch = (match: Match) => {
    setEditingMatch(match.id)
    
    // Initialize games based on format
    const maxGames = match.format === 'BO5' ? 5 : 3
    const initialGames = []
    
    for (let i = 1; i <= maxGames; i++) {
      const existingGame = match.games.find(g => g.gameNumber === i)
      initialGames.push({
        gameNumber: i,
        homeScore: existingGame?.homeScore?.toString() || '',
        awayScore: existingGame?.awayScore?.toString() || '',
        status: existingGame?.status || 'SCHEDULED' as Game['status']
      })
    }
    
    setEditForm({
      format: match.format,
      status: match.status,
      games: initialGames
    })
  }

  const handleSaveMatch = async (matchId: string) => {
    try {
      // Prepare games data
      const gamesData = editForm.games
        .filter(game => game.homeScore !== '' && game.awayScore !== '')
        .map(game => ({
          gameNumber: game.gameNumber,
          homeScore: parseInt(game.homeScore),
          awayScore: parseInt(game.awayScore),
          status: 'COMPLETED' as Game['status']
        }))

      const response = await fetch(`/api/matches/${matchId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format: editForm.format,
          status: editForm.status,
          games: gamesData,
        }),
      })

      if (response.ok) {
        await fetchMatches() // Refresh the matches
        setEditingMatch(null)
      } else {
        alert('Failed to update match')
      }
    } catch (error) {
      console.error('Error updating match:', error)
      alert('Error updating match')
    }
  }

  const handleCancelEdit = () => {
    setEditingMatch(null)
    setEditForm({ 
      format: 'BO3', 
      status: 'SCHEDULED', 
      games: [] 
    })
  }

  const updateGameScore = (gameNumber: number, field: 'homeScore' | 'awayScore', value: string) => {
    setEditForm(prev => ({
      ...prev,
      games: prev.games.map(game => 
        game.gameNumber === gameNumber 
          ? { ...game, [field]: value }
          : game
      )
    }))
  }

  const formatMatchResult = (match: Match) => {
    if (match.games.length === 0) {
      return match.homeScore !== undefined && match.awayScore !== undefined
        ? `${match.homeScore} - ${match.awayScore}`
        : '-'
    }
    
    const completedGames = match.games.filter(g => g.status === 'COMPLETED')
    if (completedGames.length === 0) return '-'
    
    return `${match.homeGamesWon} - ${match.awayGamesWon} (${completedGames.map(g => `${g.homeScore}-${g.awayScore}`).join(', ')})`
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tournament Stage Status */}
      {tournamentStage && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Tournament Progress</h2>
              <div className="space-y-1">
                <div className={`flex items-center gap-2 ${tournamentStage.groupStageCompleted ? 'text-green-600' : 'text-gray-600'}`}>
                  <div className={`w-2 h-2 rounded-full ${tournamentStage.groupStageCompleted ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  Group Stage {tournamentStage.groupStageCompleted ? 'Completed' : 'In Progress'}
                </div>
                <div className={`flex items-center gap-2 ${tournamentStage.knockoutGenerated ? 'text-green-600' : 'text-gray-600'}`}>
                  <div className={`w-2 h-2 rounded-full ${tournamentStage.knockoutGenerated ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  Knockout Stage {tournamentStage.knockoutGenerated ? 'Generated' : 'Pending'}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Current Stage: <span className="font-medium">{tournamentStage.stage?.replace('_', ' ')}</span>
                </p>
              </div>
            </div>
            
            {!tournamentStage.knockoutGenerated && (
              <button
                onClick={generateKnockout}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                <Trophy className="w-4 h-4" />
                Generate Knockout
              </button>
            )}
          </div>
        </div>
      )}

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Schedule Match</span>
            <span className="sm:hidden">Schedule</span>
          </button>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
            <Trophy className="w-4 h-4" />
            <span className="hidden sm:inline">Update Rankings</span>
            <span className="sm:hidden">Rankings</span>
          </button>
        </div>
        <button 
          onClick={() => signOut()}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Matches</p>
              <p className="text-2xl font-semibold text-gray-900">{matches.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <Trophy className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-semibold text-gray-900">
                {matches.filter(m => m.status === 'COMPLETED').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100">
              <Users className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Scheduled</p>
              <p className="text-2xl font-semibold text-gray-900">
                {matches.filter(m => m.status === 'SCHEDULED').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">In Progress</p>
              <p className="text-2xl font-semibold text-gray-900">
                {matches.filter(m => m.status === 'IN_PROGRESS').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Matches Management */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Manage Matches</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Match
                </th>
                <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Table
                </th>
                <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Scheduled
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Result
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {matches.map((match) => (
                <tr key={match.id} className="hover:bg-gray-50">
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="font-medium">{match.homeTeam.name} vs</div>
                      <div className="font-medium">{match.awayTeam.name}</div>
                      <div className="text-xs text-gray-500 sm:hidden">
                        {match.tournamentTable.name} • {formatDateTime(match.scheduledAt)}
                      </div>
                    </div>
                  </td>
                  <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {match.tournamentTable.name}
                  </td>
                  <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDateTime(match.scheduledAt)}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    {editingMatch === match.id ? (
                      <select
                        value={editForm.status}
                        onChange={(e) => setEditForm({
                          ...editForm,
                          status: e.target.value as Match['status']
                        })}
                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                      >
                        <option value="SCHEDULED">Scheduled</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                    ) : (
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        match.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        match.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                        match.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {match.status}
                      </span>
                    )}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {editingMatch === match.id ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                          <label className="text-xs font-medium">Format:</label>
                          <select
                            value={editForm.format}
                            onChange={(e) => setEditForm({
                              ...editForm,
                              format: e.target.value as Match['format']
                            })}
                            className="border border-gray-300 rounded px-2 py-1 text-xs"
                          >
                            <option value="BO3">Best of 3</option>
                            <option value="BO5">Best of 5</option>
                          </select>
                        </div>
                        
                        {editForm.games.map((game) => (
                          <div key={game.gameNumber} className="flex items-center gap-2">
                            <span className="text-xs w-12">Game {game.gameNumber}:</span>
                            <input
                              type="number"
                              placeholder="0"
                              value={game.homeScore}
                              onChange={(e) => updateGameScore(game.gameNumber, 'homeScore', e.target.value)}
                              className="w-12 border border-gray-300 rounded px-1 py-1 text-xs"
                              min="0"
                              max="30"
                            />
                            <span className="text-xs">-</span>
                            <input
                              type="number"
                              placeholder="0"
                              value={game.awayScore}
                              onChange={(e) => updateGameScore(game.gameNumber, 'awayScore', e.target.value)}
                              className="w-12 border border-gray-300 rounded px-1 py-1 text-xs"
                              min="0"
                              max="30"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs">
                        {formatMatchResult(match)}
                      </div>
                    )}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {editingMatch === match.id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveMatch(match.id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="text-red-600 hover:text-red-900"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEditMatch(match)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard