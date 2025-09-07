'use client'

import { useState } from 'react'
import { DollarSign, Star, Trophy, ArrowRight, Plus, Calendar } from 'lucide-react'
import Link from 'next/link'

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

      {/* Prediction Games */}
      <div className="max-w-6xl mx-auto">
        
        {/* Platform Overview */}
        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Star className="w-6 h-6" style={{ color: '#F15D03' }} />
            🎯 Sioux88 Prediction Games
          </h2>
          <p className="text-gray-700">
            Choose from our selection of prediction games! Test your knowledge and make predictions about the tournament outcomes. 
            All predictions are public and you can see how others are thinking.
          </p>
        </div>

        {/* Prediction Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Final Match Prediction Card */}
          <Link 
            href="/sioux88/final-match-prediction"
            className="group bg-white rounded-xl shadow-lg border border-orange-200 hover:shadow-xl hover:border-orange-300 transition-all duration-300 overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                    Final Match Prediction
                  </h3>
                  <p className="text-sm text-gray-600">Champion & Score</p>
                </div>
              </div>
              
              <p className="text-gray-700 text-sm mb-4">
                Predict who will win the championship and the exact final match score. 
                Enter the losing team's final game points for extra precision!
              </p>
              
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  🎁 Free to Play • Gift Award
                </div>
                <div className="text-orange-600 group-hover:text-orange-700 transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </Link>

          {/* Scheduled Match Predictions Card */}
          <Link 
            href="/sioux88/scheduled-match-predictions"
            className="group bg-white rounded-xl shadow-lg border border-blue-200 hover:shadow-xl hover:border-blue-300 transition-all duration-300 overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                    Scheduled Match Predictions
                  </h3>
                  <p className="text-sm text-gray-600">Match Outcomes</p>
                </div>
              </div>
              
              <p className="text-gray-700 text-sm mb-4">
                Predict the outcomes of scheduled matches! Choose winning teams, 
                final scores, and losing team's final game points.
              </p>
              
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  💰 20k VND Fee • Pool Award
                </div>
                <div className="text-blue-600 group-hover:text-blue-700 transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </Link>

          {/* Placeholder for Future Prediction Games */}
          <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 p-6 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Plus className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-500 mb-2">More Games Coming Soon</h3>
              <p className="text-sm text-gray-400">
                New prediction games will be added here
              </p>
            </div>
          </div>

          {/* Additional Placeholder Cards */}
          <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 p-6 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Plus className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-500 mb-2">Future Games</h3>
              <p className="text-sm text-gray-400">
                Stay tuned for more predictions
              </p>
            </div>
          </div>

        </div>

        {/* How It Works Section */}
        <div className="mt-12 bg-white rounded-lg shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">How Prediction Games Work</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Choose a Game</h4>
              <p className="text-sm text-gray-600">
                Select from our available prediction games
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Make Your Prediction</h4>
              <p className="text-sm text-gray-600">
                Fill out the form with your predictions
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">See Results</h4>
              <p className="text-sm text-gray-600">
                View all predictions and see how you compare
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
} 