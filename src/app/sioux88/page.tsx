import { DollarSign, Star, Clock } from 'lucide-react'

export default function Sioux88Page() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
          <DollarSign className="w-8 h-8" style={{ color: '#F15D03' }} />
          Sioux88
        </h1>
        <p className="text-sm sm:text-base text-gray-600 px-4">
          Official predictions platform for the Sioux Ping Pong Tournament 2025
        </p>
      </div>

      {/* Betting Content */}
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Platform Overview */}
        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Star className="w-6 h-6" style={{ color: '#F15D03' }} />
            🎯 Platform Overview
          </h2>
          <p className="text-gray-700">
            Sioux88 is the official predictions partner of the Sioux Ping Pong Tournament 2025. 
            Make your predictions on match outcomes, tournament winners, and special events throughout the competition.
          </p>
        </div>

        {/* Coming Soon Indicator */}
        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border-2 border-orange-300 p-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ backgroundColor: '#F15D03' }}>
              <Clock className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: '#F15D03' }}>
              🚀 Coming Soon
            </h2>
            <p className="text-lg mb-4" style={{ color: '#F15D03' }}>
              The Sioux88 predictions platform is currently under preparation
            </p>
            <div className="border rounded-md p-3" style={{ backgroundColor: '#F15D03', borderColor: '#F15D03' }}>
              <p className="text-white font-medium">
                📅 <strong>Expected Launch:</strong> Tournament Week (August 11-18, 2025)
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
} 