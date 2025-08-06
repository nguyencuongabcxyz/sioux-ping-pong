import { BookOpen, Trophy, Users, Clock, Target, Star } from 'lucide-react'

export default function RulesPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 flex items-center justify-center gap-2" style={{ color: '#F15D03' }}>
          <BookOpen className="w-8 h-8" style={{ color: '#F15D03' }} />
          Tournament Rules
        </h1>
        <p className="text-sm sm:text-base text-gray-600 px-4">
          Official rules and regulations for the Sioux Ping Pong Tournament 2025
        </p>
      </div>

      {/* Rules Content */}
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* General Tournament Structure */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Tournament Structure
          </h2>
          <div className="space-y-3 text-gray-700">
            <p><strong>Format:</strong> Two-stage tournament with Group Stage followed by Knockout Stage</p>
            <p><strong>Group Stage:</strong> 3 groups of 4 teams each playing round-robin format</p>
            <p><strong>Knockout Stage:</strong> Top 8 teams advance to quarter-finals, semi-finals, and final</p>
            <p><strong>Team Composition:</strong> Each team consists of 2 players</p>
          </div>
        </div>

        {/* Match Format */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Target className="w-6 h-6 text-green-500" />
            Match Format
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Group Stage Matches</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                <li><strong>Best of 3 (BO3)</strong> format</li>
                <li>First team to win 2 games wins the match</li>
                <li>Each game played to 11 points</li>
                <li>Must win by at least 2 points</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Knockout Stage Matches</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                <li><strong>Best of 5 (BO5)</strong> format</li>
                <li>First team to win 3 games wins the match</li>
                <li>Each game played to 11 points</li>
                <li>Must win by at least 2 points</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Game Rules */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-500" />
            Game Rules
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Service Rules</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                <li>Service alternates every 2 points</li>
                <li>Ball must bounce once on server&apos;s side, then opponent&apos;s side</li>
                <li>Service must be diagonal (cross-court)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Scoring</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                <li>Games played to 11 points (win by 2)</li>
                <li>If score reaches 10-10, play continues until one team leads by 2</li>
                <li>Service alternates every point after 10-10</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Team Play</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                <li>Both players must alternate hitting the ball</li>
                <li>Players alternate serves within each game</li>
                <li>Teams can decide their hitting order at the start of each game</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Group Stage Rules */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Star className="w-6 h-6 text-purple-500" />
            🧮 Group Stage Rules
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Format</h3>
              <p className="text-gray-700">Round-robin within each group (each team plays 3 matches).</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Scoring</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                <li><strong>Match Win = 1 point</strong></li>
                <li><strong>Loss = 0 points</strong></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Group Ranking Criteria</h3>
              <ol className="list-decimal list-inside space-y-1 text-gray-700 ml-4">
                <li>Total points (match wins)</li>
                <li>Head-to-head result (if 2 teams are tied)</li>
                <li>Game difference (games won - lost)</li>
                <li>Point difference (points scored - conceded)</li>
                <li>Random draw (if all else tied)</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Qualification to Knockout Stage */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Target className="w-6 h-6 text-green-500" />
            🎯 Qualification to Knockout Stage
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Automatic Qualification</h3>
              <p className="text-gray-700 mb-2">
                <strong>Top 2 teams from each group</strong> automatically advance → <strong>6 teams</strong>
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Wild Card Qualification</h3>
              <p className="text-gray-700 mb-2">
                <strong>Best 2 third-placed teams</strong> (across all groups) also advance → based on:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-gray-700 ml-4">
                <li>Total match points</li>
                <li>Game difference</li>
                <li>Point difference</li>
                <li>Draw (if needed)</li>
              </ol>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-md p-3 mt-4">
              <p className="text-green-800 font-semibold">
                ✅ Total: <strong>8 teams</strong> proceed to quarterfinals
              </p>
            </div>
          </div>
        </div>

        {/* Quarterfinal Match Draw */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            🎲 5. Quarterfinal Match Draw (Group Separation Rule)
          </h2>
          <div className="space-y-4">
            <p className="text-gray-700">
              To ensure diversity and fairness, <strong>teams from the same original table will not face each other</strong> in the quarterfinals.
            </p>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">✅ Draw Rules</h3>
              <div className="space-y-3 text-gray-700">
                <p>
                  The 8 qualified teams (6 from top 2 of each table + 2 best third-placed teams) are split by their original groups.
                </p>
                <p>
                  Each quarterfinal match will be formed with <strong>teams from different tables</strong>.
                </p>
                <p>
                  The 2 best third-placed teams will be treated as <strong>unseeded</strong> and randomly drawn to match against group winners or runners-up, ensuring they don&apos;t face teams from their own original table.
                </p>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mt-4">
              <p className="text-blue-800 font-semibold">
                🛡️ <strong>Fairness Guarantee:</strong> No team will face an opponent from their original group table in the quarterfinals.
              </p>
            </div>
          </div>
        </div>

        {/* Tournament Schedule */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-6 h-6 text-orange-500" />
            Tournament Schedule
          </h2>
          <div className="space-y-3 text-gray-700">
            <p><strong>Group Stage:</strong> August 11-18, 2025</p>
            <p><strong>Knockout Stage:</strong> To be scheduled after group completion</p>
            <p><strong>Match Times:</strong> 12:30 PM and 5:30 PM daily</p>
            <p><strong>Arrival Time:</strong> Teams must arrive 5 minutes before scheduled time</p>
          </div>
        </div>

        {/* Conduct & Sportsmanship */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-6 h-6 text-red-500" />
            Conduct & Sportsmanship
          </h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Respect opponents, officials, and equipment at all times</li>
            <li>Disputes should be resolved through discussion or referee decision</li>
            <li>Unsportsmanlike conduct may result in warnings or disqualification</li>
            <li>Players are responsible for their own equipment</li>
            <li>Tournament organizers&apos; decisions are final</li>
          </ul>
        </div>

        {/* Contact Information */}
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
          <h2 className="text-xl font-bold text-blue-900 mb-4">Questions?</h2>
          <p className="text-blue-800">
            For rule clarifications or tournament questions, please contact the tournament organizers 
            or refer to the official table tennis rules (ITTF regulations apply for situations not 
            covered in these tournament-specific rules).
          </p>
        </div>

      </div>
    </div>
  )
}