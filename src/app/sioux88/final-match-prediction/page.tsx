'use client'

import { useState } from 'react'
import { ArrowLeft, Trophy } from 'lucide-react'
import Link from 'next/link'
import FinalMatchPredictionForm from '@/components/FinalMatchPredictionForm'
import FinalMatchPredictionsDisplay from '@/components/FinalMatchPredictionsDisplay'

export default function FinalMatchPredictionPage() {
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
          <Trophy className="w-8 h-8 text-orange-600" />
          <h1 className="text-3xl font-bold text-gray-900">Final Match Prediction</h1>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Predict who will win the championship and the exact final match score! 
          Enter your name and company email to make your prediction. All predictions are public.
        </p>
      </div>

      {/* Main Content Grid */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column - Prediction Form */}
          <div>
            <FinalMatchPredictionForm onPredictionSubmitted={handlePredictionSubmitted} />
          </div>
          
          {/* Right Column - Predictions Display */}
          <div>
            <div className="sticky top-4">
              <FinalMatchPredictionsDisplay refreshTrigger={refreshTrigger} />
            </div>
          </div>
          
        </div>
      </div>
    </div>
  )
}
