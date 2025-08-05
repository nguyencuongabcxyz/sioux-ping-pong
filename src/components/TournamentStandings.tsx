'use client'

import { useEffect, useState } from 'react'
import { Trophy, Target, TrendingUp, TrendingDown } from 'lucide-react'

interface Team {
  id: string
  name: string
  member1Image?: string
  member2Image?: string
  matchesPlayed: number
  wins: number
  losses: number
  points: number
  pointsAgainst: number
  tournamentPoints: number
  gameDifference: number
  pointDifferential: number
  winPercentage: number
  averagePointsScored: number
  averagePointsConceded: number
  advancedToKnockout?: boolean
}

interface TournamentTable {
  id: string
  name: string
  description?: string
  teams: Team[]
}

interface StandingsData {
  tables: TournamentTable[]
  knockoutGenerated: boolean
  advancedTeamIds: string[]
}

const TournamentStandings = () => {
  const [standingsData, setStandingsData] = useState<StandingsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStandings = async () => {
      try {
        const response = await fetch('/api/standings')
        if (!response.ok) {
          throw new Error('Failed to fetch standings')
        }
        const data = await response.json()
        console.log('Standings data received:', data)
        setStandingsData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchStandings()
  }, [])

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
        <p className="text-red-600">Error loading standings: {error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {standingsData?.tables.map((table, tableIndex) => (
        <div key={table.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              {table.name}
            </h2>
            {table.description && (
              <p className="text-blue-100 text-sm mt-1">{table.description}</p>
            )}
          </div>
          
          {/* Table View */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Team
                  </th>
                  <th className="px-2 lg:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pts
                  </th>
                  <th className="px-2 lg:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    MP
                  </th>
                  <th className="px-2 lg:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    W
                  </th>
                  <th className="px-2 lg:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    L
                  </th>
                  <th className="px-2 lg:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    GD
                  </th>
                  <th className="px-2 lg:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PF
                  </th>
                  <th className="px-2 lg:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PA
                  </th>
                  <th className="px-2 lg:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PD
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {table.teams.map((team, index) => (
                  <tr 
                    key={team.id} 
                    className={`hover:bg-gray-50 transition-colors ${
                      index === 0 ? 'bg-yellow-50' : ''
                    } ${
                      standingsData?.knockoutGenerated && !team.advancedToKnockout 
                        ? 'opacity-50 bg-gray-100' 
                        : ''
                    }`}
                  >
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                          index === 0 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : index === 1 
                            ? 'bg-gray-100 text-gray-800'
                            : index === 2
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-gray-50 text-gray-600'
                        }`}>
                          {index + 1}
                        </span>
                        {index === 0 && <Trophy className="w-4 h-4 text-yellow-500 ml-1" />}
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        {/* Player Images */}
                        <div className="flex -space-x-2">
                          {team.member1Image && (
                            <img 
                              src={team.member1Image} 
                              alt="Player 1" 
                              className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-sm bg-gray-100"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/api/placeholder/32/32';
                              }}
                            />
                          )}
                          {team.member2Image && (
                            <img 
                              src={team.member2Image} 
                              alt="Player 2" 
                              className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-sm bg-gray-100"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/api/placeholder/32/32';
                              }}
                            />
                          )}
                          {(!team.member1Image && !team.member2Image) && (
                            <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-600 text-xs">👥</span>
                            </div>
                          )}
                        </div>
                        <div className="text-sm font-medium text-gray-900">{team.name}</div>
                        {standingsData?.knockoutGenerated && team.advancedToKnockout && (
                          <div className="flex items-center gap-1 mt-1">
                            <Target className="w-3 h-3 text-green-600" />
                            <span className="text-xs text-green-600 font-medium">Advanced</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-2 lg:px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-blue-600">
                      {team.tournamentPoints}
                    </td>
                    <td className="px-2 lg:px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                      {team.matchesPlayed}
                    </td>
                    <td className="px-2 lg:px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-green-600">
                      {team.wins}
                    </td>
                    <td className="px-2 lg:px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-red-600">
                      {team.losses}
                    </td>
                    <td className="px-2 lg:px-6 py-4 whitespace-nowrap text-center text-sm">
                      <div className={`flex items-center justify-center ${
                        team.gameDifference > 0 
                          ? 'text-green-600' 
                          : team.gameDifference < 0 
                          ? 'text-red-600' 
                          : 'text-gray-500'
                      }`}>
                        {team.gameDifference > 0 && <TrendingUp className="w-4 h-4 mr-1" />}
                        {team.gameDifference < 0 && <TrendingDown className="w-4 h-4 mr-1" />}
                        {team.gameDifference > 0 ? '+' : ''}{team.gameDifference}
                      </div>
                    </td>
                    <td className="px-2 lg:px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                      {team.points}
                    </td>
                    <td className="px-2 lg:px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                      {team.pointsAgainst}
                    </td>
                    <td className="px-2 lg:px-6 py-4 whitespace-nowrap text-center text-sm">
                      <div className={`flex items-center justify-center ${
                        team.pointDifferential > 0 
                          ? 'text-green-600' 
                          : team.pointDifferential < 0 
                          ? 'text-red-600' 
                          : 'text-gray-500'
                      }`}>
                        {team.pointDifferential > 0 && <TrendingUp className="w-4 h-4 mr-1" />}
                        {team.pointDifferential < 0 && <TrendingDown className="w-4 h-4 mr-1" />}
                        {team.pointDifferential > 0 ? '+' : ''}{team.pointDifferential}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {table.teams.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No teams found in this table</p>
            </div>
          )}
        </div>
      ))}

      {standingsData?.knockoutGenerated && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-green-600" />
            <h3 className="text-sm font-medium text-green-800">Knockout Stage Active</h3>
          </div>
          <p className="text-xs text-green-700">
            Teams marked with "Advanced" have qualified for the knockout stage. 
            Eliminated teams are grayed out.
          </p>
        </div>
      )}
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
        <div>
          <h3 className="text-sm font-medium text-blue-800 mb-2">🏆 Ranking System</h3>
          <div className="text-xs text-blue-700 space-y-1">
            <div><strong>1.</strong> Tournament Points (Win = 1 point, Loss = 0 points)</div>
            <div><strong>2.</strong> Head-to-Head Result (if tied)</div>
            <div><strong>3.</strong> Game Difference (Wins - Losses)</div>
            <div><strong>4.</strong> Point Difference (Points Scored - Points Conceded)</div>
          </div>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-blue-800 mb-2">📊 Column Legend</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs text-blue-700">
            <div><strong>Pts:</strong> Tournament Points</div>
            <div><strong>MP:</strong> Matches Played</div>
            <div><strong>W:</strong> Wins</div>
            <div><strong>L:</strong> Losses</div>
            <div><strong>GD:</strong> Game Difference</div>
            <div><strong>PF:</strong> Points For</div>
            <div><strong>PA:</strong> Points Against</div>
            <div><strong>PD:</strong> Point Difference</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TournamentStandings