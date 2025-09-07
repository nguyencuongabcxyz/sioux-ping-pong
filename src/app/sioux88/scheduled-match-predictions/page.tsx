'use client'

import { useState } from 'react'
import { ArrowLeft, Calendar, Users } from 'lucide-react'
import Link from 'next/link'
import MatchPredictionForm from '@/components/MatchPredictionForm'
import MatchPredictionsDisplay from '@/components/MatchPredictionsDisplay'

export default function ScheduledMatchPredictionsPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handlePredictionSubmitted = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Link 
          href="/sioux88"
          className="flex items-center gap-2 text-orange-600 hover:text-orange-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Sioux88</span>
        </Link>
      </div>

      {/* Page Title */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <Calendar className="w-8 h-8 text-orange-600" />
          <h1 className="text-3xl font-bold text-gray-900">Scheduled Match Predictions</h1>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Predict the outcomes of scheduled matches! This game has a <strong>20k VND fee</strong> to play and the award is the total fee collected from all other players. 
          Select from matches that are open for predictions, choose your winning team, and predict the final score and losing team&apos;s final game points.
        </p>
      </div>

      {/* Main Content - Full Width */}
      <div className="max-w-6xl mx-auto">
        <MatchPredictionForm onPredictionSubmitted={handlePredictionSubmitted} />
      </div>
    </div>
  )
}
