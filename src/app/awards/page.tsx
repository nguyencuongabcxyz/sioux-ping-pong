import { Trophy, Medal, Award, Star, Gift } from 'lucide-react'

export default function AwardsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
          <Trophy className="w-8 h-8 text-yellow-500" />
          Tournament Awards
        </h1>
        <p className="text-sm sm:text-base text-gray-600 px-4">
          Prize scheme for the Sioux Ping Pong Tournament 2025
        </p>
      </div>

      {/* Awards Content */}
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Prize Overview */}
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Gift className="w-6 h-6 text-orange-500" />
            🏆 Prize Overview
          </h2>
          <p className="text-gray-700">
            The tournament features a total prize pool of <strong>2,000,000 VND</strong> distributed among the top 3 teams.
            All prizes are awarded in Vietnamese Dong (VND).
          </p>
        </div>

        {/* 1st Place - Champion */}
        <div className="bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-lg border-2 border-yellow-300 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-yellow-500 rounded-full p-3">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  🥇 1st Place - Champion
                </h2>
                <p className="text-lg text-gray-700">Tournament Winner</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-yellow-600">
                1,000,000 VND
              </div>
              <div className="text-sm text-gray-600">One Million Dong</div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-yellow-50 rounded-md">
            <p className="text-yellow-800 font-medium">
              🏆 The champion team will receive the prestigious tournament trophy and the highest prize money.
            </p>
          </div>
        </div>

        {/* 2nd Place - Runner Up */}
        <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg border-2 border-gray-300 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-gray-500 rounded-full p-3">
                <Medal className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  🥈 2nd Place - Runner Up
                </h2>
                <p className="text-lg text-gray-700">Tournament Finalist</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-600">
                600,000 VND
              </div>
              <div className="text-sm text-gray-600">Six Hundred Thousand Dong</div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <p className="text-gray-800 font-medium">
              🎯 The runner-up team will receive a silver medal and the second highest prize.
            </p>
          </div>
        </div>

        {/* 3rd Place - Bronze */}
        <div className="bg-gradient-to-r from-orange-100 to-orange-200 rounded-lg border-2 border-orange-300 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-orange-500 rounded-full p-3">
                <Award className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  🥉 3rd Place - Bronze
                </h2>
                <p className="text-lg text-gray-700">Tournament Semi-Finalist</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-orange-600">
                400,000 VND
              </div>
              <div className="text-sm text-gray-600">Four Hundred Thousand Dong</div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-orange-50 rounded-md">
            <p className="text-orange-800 font-medium">
              🎖️ The third-place team will receive a bronze medal and the final prize.
            </p>
          </div>
        </div>

        {/* Prize Distribution Summary */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Star className="w-6 h-6 text-blue-500" />
            💰 Prize Distribution Summary
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">1,000,000 VND</div>
              <div className="text-sm text-gray-600">50% of Prize Pool</div>
              <div className="text-xs text-gray-500 mt-1">🥇 Champion</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">600,000 VND</div>
              <div className="text-sm text-gray-600">30% of Prize Pool</div>
              <div className="text-xs text-gray-500 mt-1">🥈 Runner Up</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">400,000 VND</div>
              <div className="text-sm text-gray-600">20% of Prize Pool</div>
              <div className="text-xs text-orange-500 mt-1">🥉 Third Place</div>
            </div>
          </div>
        </div>

        {/* Award Ceremony Information */}
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
          <h2 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-blue-600" />
            🎉 Award Ceremony
          </h2>
          <div className="space-y-3 text-blue-800">
            <p>
              <strong>When:</strong> Immediately following the final match
            </p>
            <p>
              <strong>Where:</strong> Tournament venue
            </p>
            <p>
              <strong>Format:</strong> Official presentation with trophies, medals, and prize money
            </p>
            <p>
              <strong>Payment:</strong> All prizes will be paid in cash (Vietnamese Dong)
            </p>
            <p>
              <strong>Documentation:</strong> Winners must provide identification for prize collection
            </p>
          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-green-50 rounded-lg border border-green-200 p-6">
          <h2 className="text-xl font-bold text-green-900 mb-4">📋 Important Notes</h2>
          <ul className="list-disc list-inside space-y-2 text-green-800">
            <li>All team members will share the prize money equally</li>
            <li>Prizes are subject to Vietnamese tax regulations</li>
            <li>Tournament organizers reserve the right to modify prize distribution if necessary</li>
            <li>Participation in the award ceremony is mandatory for prize collection</li>
            <li>Photographs and videos may be taken during the ceremony for promotional purposes</li>
          </ul>
        </div>

      </div>
    </div>
  )
} 