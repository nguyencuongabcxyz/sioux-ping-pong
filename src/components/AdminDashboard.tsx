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
  X,
  Target,
  Crown,
  RotateCcw,
  Zap,
  CheckCircle
} from 'lucide-react'
import QuarterFinalSelection from './QuarterFinalSelection'

interface Game {
  id: string
  gameNumber: number
  homeScore: number
  awayScore: number
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED'
  completedAt?: string
}

interface TournamentTable {
  id: string
  name: string
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
  homeScore?: number // Legacy field
  awayScore?: number // Legacy field
  homeTeam: { id: string; name: string; member1Image?: string; member2Image?: string }
  awayTeam: { id: string; name: string; member1Image?: string; member2Image?: string }
  tournamentTable?: TournamentTable
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
    scheduledAt: '',
    scheduledDate: '',
    scheduledTime: '12:30',
    games: [] as Array<{ gameNumber: number; homeScore: string; awayScore: string; status: Game['status'] }>
  })
  const [showTieBreakModal, setShowTieBreakModal] = useState(false)
  const [tieBreakData, setTieBreakData] = useState<any>(null)
  const [selectedTieBreakTeams, setSelectedTieBreakTeams] = useState<string[]>([])
  const [showQuarterFinalSelection, setShowQuarterFinalSelection] = useState(false)
  const [tableFilter, setTableFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null)
  const [advancingStage, setAdvancingStage] = useState(false)
  const [tables, setTables] = useState<TournamentTable[]>([])
  const [sortBy, setSortBy] = useState<'date' | 'status' | 'table'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  useEffect(() => {
    fetchMatches()
    fetchTournamentStage()
    fetchTables()
  }, [statusFilter, tableFilter, sortBy, sortOrder])

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

  const fetchTables = async () => {
    try {
      const response = await fetch('/api/tables')
      if (response.ok) {
        const data = await response.json()
        setTables(data)
      }
    } catch (error) {
      console.error('Error fetching tables:', error)
    }
  }

  const handleManualBracketGeneration = async (matches: any[]) => {
    try {
      // Extract team IDs from the matches
      const selectedTeamIds = matches.flatMap(match => [match.homeTeamId, match.awayTeamId]).filter(id => id)
      
      const response = await fetch('/api/tournament/knockout/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedTeamIds })
      })
      
      if (response.ok) {
        await fetchTournamentStage()
        await fetchMatches() // Refresh to show new knockout matches
        setShowQuarterFinalSelection(false)
        setNotification({
          type: 'success',
          message: 'Quarter-final bracket generated successfully with manual team assignment!'
        })
      } else {
        const errorData = await response.json()
        setNotification({
          type: 'error',
          message: `Error: ${errorData.error}`
        })
      }
    } catch (error) {
      console.error('Error generating manual knockout:', error)
      setNotification({
        type: 'error',
        message: 'Failed to generate knockout bracket'
      })
    }
  }

  const advanceToSemiFinals = async () => {
    setAdvancingStage(true)
    try {
      const response = await fetch('/api/tournament/knockout/advance', { method: 'POST' })
      
      if (response.ok) {
        await fetchTournamentStage()
        await fetchMatches() // Refresh to show new semi-final matches
        setNotification({
          type: 'success',
          message: 'Semi-final matches generated successfully!'
        })
      } else {
        const errorData = await response.json()
        setNotification({
          type: 'error',
          message: `Error: ${errorData.error}`
        })
      }
    } catch (error) {
      console.error('Error advancing to semi-finals:', error)
      setNotification({
        type: 'error',
        message: 'Failed to advance to semi-finals'
      })
    } finally {
      setAdvancingStage(false)
    }
  }

  const advanceToFinal = async () => {
    setAdvancingStage(true)
    try {
      const response = await fetch('/api/tournament/knockout/final', { method: 'POST' })
      
      if (response.ok) {
        await fetchTournamentStage()
        await fetchMatches() // Refresh to show new final match
        setNotification({
          type: 'success',
          message: 'Final match generated successfully!'
        })
      } else {
        const errorData = await response.json()
        setNotification({
          type: 'error',
          message: `Error: ${errorData.error}`
        })
      }
    } catch (error) {
      console.error('Error advancing to final:', error)
      setNotification({
        type: 'error',
        message: 'Failed to advance to final'
      })
    } finally {
      setAdvancingStage(false)
    }
  }

  const handleTieBreakSelection = async () => {
    if (selectedTieBreakTeams.length !== 2) {
      alert('Please select exactly 2 teams for tie-breaking')
      return
    }

    try {
      const response = await fetch('/api/tournament/knockout/tiebreak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedTeamIds: selectedTieBreakTeams })
      })

      if (response.ok) {
        await fetchTournamentStage()
        await fetchMatches()
        setShowTieBreakModal(false)
        setTieBreakData(null)
        setSelectedTieBreakTeams([])
        alert('Knockout stage generated successfully with tie-break resolution!')
      } else {
        const errorData = await response.json()
        alert(`Error: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error resolving tie-break:', error)
      alert('Failed to resolve tie-break')
    }
  }

  const regenerateKnockout = async () => {
    if (!confirm('This will delete the current knockout bracket and regenerate it with the updated ranking logic. Continue?')) {
      return
    }

    try {
      // First delete existing knockout matches
      const deleteResponse = await fetch('/api/tournament/reset', { method: 'POST' })
      if (!deleteResponse.ok) {
        throw new Error('Failed to reset tournament')
      }

      // Then regenerate knockout
      const response = await fetch('/api/tournament/knockout', { method: 'POST' })
      const data = await response.json()
      
      if (response.ok) {
        await fetchTournamentStage()
        await fetchMatches()
        alert('Knockout bracket regenerated successfully with updated ranking logic!')
      } else if (data.needsTieBreak) {
        setTieBreakData(data)
        setShowTieBreakModal(true)
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error regenerating knockout:', error)
      alert('Failed to regenerate knockout bracket')
    }
  }

  const resetAllResults = async () => {
    if (!confirm('Are you sure you want to reset all match results? This will:\n\n• Clear all completed matches\n• Reset knockout bracket to initial state\n• Remove all game scores\n\nThis action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch('/api/tournament/reset', { method: 'POST' })
      if (response.ok) {
        await fetchTournamentStage()
        await fetchMatches() // Refresh to show reset matches
        alert('All match results have been reset successfully!')
      } else {
        const errorData = await response.json()
        alert(`Error: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error resetting results:', error)
      alert('Failed to reset match results')
    }
  }

  const fillGroupStageResults = async () => {
    if (!confirm('This will randomly fill all group stage match results with realistic BO3 table tennis scores.\n\nEach game is played to 11 points with a 2-point lead needed to win.\n\nThis action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch('/api/tournament/fill-group-results', { method: 'POST' })
      if (response.ok) {
        await fetchTournamentStage()
        await fetchMatches() // Refresh to show filled results
        alert('Group stage results have been filled successfully!')
      } else {
        const errorData = await response.json()
        alert(`Error: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error filling group results:', error)
      alert('Failed to fill group stage results')
    }
  }

  const ensureBO3GroupMatches = async () => {
    if (!confirm('This will ensure all group stage matches are in BO3 format.\n\nThis will update any group stage matches that might not be in BO3 format.\n\nContinue?')) {
      return
    }

    try {
      const response = await fetch('/api/tournament/ensure-bo3-group-matches', { method: 'POST' })
      if (response.ok) {
        const data = await response.json()
        await fetchMatches() // Refresh to show updated matches
        alert(data.message)
      } else {
        const errorData = await response.json()
        alert(`Error: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error ensuring BO3 format:', error)
      alert('Failed to ensure BO3 format for group stage matches')
    }
  }

  const generateGroupStageMatches = async () => {
    if (!confirm('This will generate all group stage matches for the tournament.\n\nThis will create round-robin matches for all teams in each table.\n\nContinue?')) {
      return
    }

    try {
      // Use admin access key for the seed endpoint
      const response = await fetch('/api/seed?key=admin-access', { method: 'POST' })
      if (response.ok) {
        const data = await response.json()
        await fetchMatches() // Refresh to show new matches
        await fetchTournamentStage() // Refresh tournament stage
        setNotification({
          type: 'success',
          message: `Successfully generated ${data.totalMatchesCreated} group stage matches!`
        })
      } else {
        const errorData = await response.json()
        setNotification({
          type: 'error',
          message: `Error: ${errorData.error}`
        })
      }
    } catch (error) {
      console.error('Error generating group stage matches:', error)
      setNotification({
        type: 'error',
        message: 'Failed to generate group stage matches'
      })
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
    
    // Format date and time for input fields
    const scheduledDate = new Date(match.scheduledAt)
    const formattedDate = scheduledDate.toISOString().split('T')[0]
    const formattedTime = extractTimeFromDateTime(match.scheduledAt)
    
    setEditForm({
      format: match.format,
      status: match.status,
      scheduledAt: match.scheduledAt,
      scheduledDate: formattedDate,
      scheduledTime: formattedTime,
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

      // Create the full datetime string from date and time
      const fullDateTime = createDateTimeString(editForm.scheduledDate, editForm.scheduledTime)
      
      const response = await fetch(`/api/matches/${matchId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format: editForm.format,
          status: editForm.status,
          scheduledAt: fullDateTime,
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
      scheduledAt: '',
      scheduledDate: '',
      scheduledTime: '12:30',
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

  // Helper function to get available time slots
  const getTimeSlots = () => {
    return [
      { value: '12:30', label: '12:30 PM' },
      { value: '12:50', label: '12:50 PM' },
      { value: '17:30', label: '5:30 PM' },
      { value: '17:50', label: '5:50 PM' }
    ]
  }

  // Helper function to format current date for datetime-local input
  const getCurrentDateString = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  // Helper function to create datetime string from date and time
  const createDateTimeString = (date: string, time: string) => {
    // Parse the time (e.g., "12:30" or "17:30")
    const [hours, minutes] = time.split(':').map(Number)
    
    // Create a date object for the selected date
    const selectedDate = new Date(date)
    
    // Set the time in the local timezone
    selectedDate.setHours(hours, minutes, 0, 0)
    
    // Return the ISO string - this will be the exact time selected
    return selectedDate.toISOString()
  }

  // Helper function to format time for display (shows exactly what was selected)
  const formatTimeForDisplay = (dateString: string) => {
    const date = new Date(dateString)
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }
    
    // Use the browser's local timezone for display
    return date.toLocaleString('en-US', options)
  }

  // Helper function to extract time from datetime string
  const extractTimeFromDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString)
    // Convert to local timezone for display
    const localHours = date.getHours().toString().padStart(2, '0')
    const localMinutes = date.getMinutes().toString().padStart(2, '0')
    return `${localHours}:${localMinutes}`
  }

  // Sort function
  const sortMatches = (matches: Match[]) => {
    return matches.sort((a, b) => {
      let aValue: any
      let bValue: any
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.scheduledAt).getTime()
          bValue = new Date(b.scheduledAt).getTime()
          break
        case 'status':
          aValue = a.status
          bValue = b.status
          break
        case 'table':
          aValue = a.tournamentTable?.name || ''
          bValue = b.tournamentTable?.name || ''
          break
        default:
          aValue = new Date(a.scheduledAt).getTime()
          bValue = new Date(b.scheduledAt).getTime()
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })
  }

  // Filter matches based on selected filters
  const filteredMatches = matches.filter(match => {
    // Table filter
    if (tableFilter !== 'all' && match.tournamentTable?.id !== tableFilter) {
      return false
    }
    
    // Status filter
    if (statusFilter !== 'all' && match.status !== statusFilter) {
      return false
    }
    
    return true
  })

  // Sort and separate matches by type
  const sortedMatches = sortMatches(filteredMatches)
  const groupStageMatches = sortedMatches.filter(match => match.matchType === 'GROUP_STAGE')
  const knockoutMatches = sortedMatches.filter(match => match.matchType === 'KNOCKOUT')

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <div className={`rounded-lg p-4 border ${
          notification.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : notification.type === 'error'
            ? 'bg-red-50 border-red-200 text-red-800'
            : 'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">{notification.type === 'success' ? '✅' : notification.type === 'error' ? '❌' : 'ℹ️'}</span>
              <span className="font-medium">{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

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
            
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={generateGroupStageMatches}
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                Generate Group Matches
              </button>
              {!tournamentStage.knockoutGenerated && (
                <button
                  onClick={() => setShowQuarterFinalSelection(true)}
                  className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                >
                  <Trophy className="w-4 h-4" />
                  Assign Quarter-Final Teams
                </button>
              )}
              {tournamentStage.knockoutGenerated && (
                <button
                  onClick={regenerateKnockout}
                  className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
                >
                  <Trophy className="w-4 h-4" />
                  Regenerate Knockout
                </button>
              )}
              <button
                onClick={ensureBO3GroupMatches}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Ensure BO3 Format
              </button>
              <button
                onClick={fillGroupStageResults}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Zap className="w-4 h-4" />
                Fill Group Results
              </button>
              <button
                onClick={resetAllResults}
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset All Results
              </button>
            </div>

            {/* Tournament Advancement Buttons */}
            {tournamentStage.knockoutGenerated && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Tournament Advancement</h4>
                <div className="flex gap-3">
                  <button
                    onClick={advanceToSemiFinals}
                    disabled={advancingStage}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    <Target className="w-4 h-4" />
                    {advancingStage ? 'Advancing...' : 'Advance to Semi-Finals'}
                  </button>
                  <button
                    onClick={advanceToFinal}
                    disabled={advancingStage}
                    className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    <Crown className="w-4 h-4" />
                    {advancingStage ? 'Advancing...' : 'Advance to Final'}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Use these buttons to advance the tournament after completing all matches in the current stage.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <button className="text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2" style={{ backgroundColor: '#F15D03' }}>
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Schedule Match</span>
            <span className="sm:hidden">Schedule</span>
          </button>
          <button className="text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2" style={{ backgroundColor: '#F15D03' }}>
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

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Table
            </label>
            <select
              value={tableFilter}
              onChange={(e) => setTableFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Tables</option>
              {tables.map((table) => (
                <option key={table.id} value={table.id}>
                  {table.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          
          <div className="flex items-end gap-2">
            <button
              onClick={() => {
                setTableFilter('all')
                setStatusFilter('all')
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
        
        {/* Sorting Controls */}
        <div className="mt-4 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'status' | 'table')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="date">Date & Time</option>
              <option value="status">Status</option>
              <option value="table">Table</option>
            </select>
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort Order
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => {
                setSortBy('date')
                setSortOrder('asc')
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Reset Sort
            </button>
          </div>
        </div>
        
        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredMatches.length} of {matches.length} matches
        </div>
      </div>

      {/* Matches Management */}
      <div className="space-y-6">
        {/* Group Stage Matches */}
        {groupStageMatches.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-hidden border border-blue-200">
            <div className="px-6 py-4 border-b border-blue-200 bg-blue-50">
              <div className="flex items-center gap-3">
                <Trophy className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-medium text-blue-900">Group Stage Matches</h3>
                <span className="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                  Round Robin
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-blue-100">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                      Match
                    </th>
                    <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                      Table
                    </th>
                                         <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                       Date/Time
                     </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                      Result
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-blue-100">
                  {groupStageMatches.map((match) => (
                    <tr key={match.id} className="hover:bg-blue-50">
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="flex -space-x-1">
                              {match.homeTeam.member1Image && (
                                <img 
                                  src={match.homeTeam.member1Image} 
                                  alt="Player 1" 
                                  className="w-6 h-6 rounded-full border border-white object-cover shadow-sm bg-gray-100"
                                  onError={(e) => { 
                                    const target = e.target as HTMLImageElement
                                    target.src = '/api/placeholder/24/24'
                                  }}
                                />
                              )}
                              {match.homeTeam.member2Image && (
                                <img 
                                  src={match.homeTeam.member2Image} 
                                  alt="Player 2" 
                                  className="w-6 h-6 rounded-full border border-white object-cover shadow-sm bg-gray-100"
                                  onError={(e) => { 
                                    const target = e.target as HTMLImageElement
                                    target.src = '/api/placeholder/24/24'
                                  }}
                                />
                              )}
                              {(!match.homeTeam.member1Image && !match.homeTeam.member2Image) && (
                                <div className="w-6 h-6 rounded-full border border-white bg-gray-200 flex items-center justify-center">
                                  <Users className="w-3 h-3 text-gray-600" />
                                </div>
                              )}
                            </div>
                            <span className="font-medium">{match.homeTeam.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex -space-x-1">
                              {match.awayTeam.member1Image && (
                                <img 
                                  src={match.awayTeam.member1Image} 
                                  alt="Player 1" 
                                  className="w-6 h-6 rounded-full border border-white object-cover shadow-sm bg-gray-100"
                                  onError={(e) => { 
                                    const target = e.target as HTMLImageElement
                                    target.src = '/api/placeholder/24/24'
                                  }}
                                />
                              )}
                              {match.awayTeam.member2Image && (
                                <img 
                                  src={match.awayTeam.member2Image} 
                                  alt="Player 2" 
                                  className="w-6 h-6 rounded-full border border-white object-cover shadow-sm bg-gray-100"
                                  onError={(e) => { 
                                    const target = e.target as HTMLImageElement
                                    target.src = '/api/placeholder/24/24'
                                  }}
                                />
                              )}
                              {(!match.awayTeam.member1Image && !match.awayTeam.member2Image) && (
                                <div className="w-6 h-6 rounded-full border border-white bg-gray-200 flex items-center justify-center">
                                  <Users className="w-3 h-3 text-gray-600" />
                                </div>
                              )}
                            </div>
                            <span className="font-medium">{match.awayTeam.name}</span>
                          </div>
                          <div className="text-xs text-gray-500 sm:hidden mt-1">
                            {match.tournamentTable?.name} • {formatTimeForDisplay(match.scheduledAt)}
                          </div>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {match.tournamentTable?.name}
                      </td>
                      <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {editingMatch === match.id ? (
                          <div className="flex gap-1">
                            <input
                              type="date"
                              value={editForm.scheduledDate}
                              onChange={(e) => setEditForm({ ...editForm, scheduledDate: e.target.value })}
                              className="border border-gray-300 rounded px-2 py-1 text-xs w-24"
                            />
                            <select
                              value={editForm.scheduledTime}
                              onChange={(e) => setEditForm({ ...editForm, scheduledTime: e.target.value })}
                              className="border border-gray-300 rounded px-2 py-1 text-xs w-20"
                            >
                              {getTimeSlots().map((slot) => (
                                <option key={slot.value} value={slot.value}>
                                  {slot.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          formatTimeForDisplay(match.scheduledAt)
                        )}
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
        )}

        {/* Knockout Stage Matches */}
        {knockoutMatches.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-hidden border border-purple-200">
            <div className="px-6 py-4 border-b border-purple-200 bg-purple-50">
              <div className="flex items-center gap-3">
                <Crown className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-medium text-purple-900">Knockout Stage Matches</h3>
                <span className="text-sm text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                  Single Elimination
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-purple-100">
                <thead className="bg-purple-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">
                      Match
                    </th>
                    <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">
                      Round
                    </th>
                                         <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">
                       Date/Time
                     </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">
                      Result
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-purple-100">
                  {knockoutMatches.map((match) => {
                    const matchTypeInfo = getMatchTypeInfo(match.matchType, match.round)
                    return (
                      <tr key={match.id} className="hover:bg-purple-50">
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="flex -space-x-1">
                                {match.homeTeam.member1Image && (
                                  <img 
                                    src={match.homeTeam.member1Image} 
                                    alt="Player 1" 
                                    className="w-6 h-6 rounded-full border border-white object-cover shadow-sm bg-gray-100"
                                    onError={(e) => { 
                                      const target = e.target as HTMLImageElement
                                      target.src = '/api/placeholder/24/24'
                                    }}
                                  />
                                )}
                                {match.homeTeam.member2Image && (
                                  <img 
                                    src={match.homeTeam.member2Image} 
                                    alt="Player 2" 
                                    className="w-6 h-6 rounded-full border border-white object-cover shadow-sm bg-gray-100"
                                    onError={(e) => { 
                                      const target = e.target as HTMLImageElement
                                      target.src = '/api/placeholder/24/24'
                                    }}
                                  />
                                )}
                                {(!match.homeTeam.member1Image && !match.homeTeam.member2Image) && (
                                  <div className="w-6 h-6 rounded-full border border-white bg-gray-200 flex items-center justify-center">
                                    <Users className="w-3 h-3 text-gray-600" />
                                  </div>
                                )}
                              </div>
                              <span className="font-medium">{match.homeTeam.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex -space-x-1">
                                {match.awayTeam.member1Image && (
                                  <img 
                                    src={match.awayTeam.member1Image} 
                                    alt="Player 1" 
                                    className="w-6 h-6 rounded-full border border-white object-cover shadow-sm bg-gray-100"
                                    onError={(e) => { 
                                      const target = e.target as HTMLImageElement
                                      target.src = '/api/placeholder/24/24'
                                    }}
                                  />
                                )}
                                {match.awayTeam.member2Image && (
                                  <img 
                                    src={match.awayTeam.member2Image} 
                                    alt="Player 2" 
                                    className="w-6 h-6 rounded-full border border-white object-cover shadow-sm bg-gray-100"
                                    onError={(e) => { 
                                      const target = e.target as HTMLImageElement
                                      target.src = '/api/placeholder/24/24'
                                    }}
                                  />
                                )}
                                {(!match.awayTeam.member1Image && !match.awayTeam.member2Image) && (
                                  <div className="w-6 h-6 rounded-full border border-white bg-gray-200 flex items-center justify-center">
                                    <Users className="w-3 h-3 text-gray-600" />
                                  </div>
                                )}
                              </div>
                              <span className="font-medium">{match.awayTeam.name}</span>
                            </div>
                            <div className="text-xs text-gray-500 sm:hidden mt-1">
                              {matchTypeInfo.label} • {formatTimeForDisplay(match.scheduledAt)}
                            </div>
                          </div>
                        </td>
                        <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <matchTypeInfo.icon className="w-3 h-3 text-purple-600" />
                            <span>{matchTypeInfo.label}</span>
                          </div>
                        </td>
                        <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {editingMatch === match.id ? (
                            <div className="flex gap-1">
                              <input
                                type="date"
                                value={editForm.scheduledDate}
                                onChange={(e) => setEditForm({ ...editForm, scheduledDate: e.target.value })}
                                className="border border-gray-300 rounded px-2 py-1 text-xs w-24"
                              />
                              <select
                                value={editForm.scheduledTime}
                                onChange={(e) => setEditForm({ ...editForm, scheduledTime: e.target.value })}
                                className="border border-gray-300 rounded px-2 py-1 text-xs w-20"
                              >
                                {getTimeSlots().map((slot) => (
                                  <option key={slot.value} value={slot.value}>
                                    {slot.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            formatTimeForDisplay(match.scheduledAt)
                          )}
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
                              className="text-purple-600 hover:text-purple-900"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* No Matches Message */}
        {matches.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">No Matches Found</h3>
            <p className="text-gray-500">No matches have been scheduled yet.</p>
          </div>
        )}

        {/* Quarter-Final Selection Modal */}
        {showQuarterFinalSelection && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <QuarterFinalSelection
                  onGenerateBracket={handleManualBracketGeneration}
                  onCancel={() => setShowQuarterFinalSelection(false)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tie-Break Modal */}
        {showTieBreakModal && tieBreakData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center gap-3 mb-4">
                <Trophy className="w-6 h-6 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">Tie-Break Required</h3>
              </div>
              
              <p className="text-gray-600 mb-4">
                Two third-place teams are tied and need manual selection for quarter-final qualification.
                Please select exactly 2 teams to advance:
              </p>

              <div className="space-y-3 mb-6">
                {tieBreakData.tiedTeams.map((team: any) => (
                  <label key={team.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedTieBreakTeams.includes(team.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          if (selectedTieBreakTeams.length < 2) {
                            setSelectedTieBreakTeams([...selectedTieBreakTeams, team.id])
                          }
                        } else {
                          setSelectedTieBreakTeams(selectedTieBreakTeams.filter(id => id !== team.id))
                        }
                      }}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <div className="flex items-center gap-2">
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
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleTieBreakSelection}
                  disabled={selectedTieBreakTeams.length !== 2}
                  className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Generate Knockout ({selectedTieBreakTeams.length}/2 selected)
                </button>
                <button
                  onClick={() => {
                    setShowTieBreakModal(false)
                    setTieBreakData(null)
                    setSelectedTieBreakTeams([])
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminDashboard