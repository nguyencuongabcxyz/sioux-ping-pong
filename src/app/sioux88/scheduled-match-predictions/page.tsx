'use client'

import { useState } from 'react'
import { ArrowLeft, Calendar } from 'lucide-react'
import Link from 'next/link'
import MatchPredictionForm from '@/components/MatchPredictionForm'

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

      {/* Main Content - Side by Side Layout */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Match Prediction Form */}
          <div className="lg:col-span-2">
            <MatchPredictionForm onPredictionSubmitted={handlePredictionSubmitted} />
          </div>
          
          {/* Right Column - Payment Instructions */}
          <div className="lg:col-span-1">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 sticky top-4">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">💰 Payment Required</h3>
                <p className="text-sm text-blue-800 mb-4">
                  Send <strong>20,000 VND</strong> to participate in scheduled match predictions.
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-4 mb-4">
                <img 
                  src="/payment_qr_code.jpg" 
                  alt="Payment QR Code" 
                  className="w-full h-auto rounded-lg border border-gray-200"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = '/api/placeholder/200/200'
                  }}
                />
              </div>
              
              <p className="text-xs text-blue-700 text-center">
                After payment, you can make predictions for scheduled matches. The winner takes all fees collected from participants.
              </p>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  )
}
