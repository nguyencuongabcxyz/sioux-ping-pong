'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import ScoreboardComponent from '@/components/ScoreboardComponent'

export default function ScoreboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return // Still loading

    if (!session) {
      router.push('/assmin/login')
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2" style={{ borderColor: '#F15D03' }}></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-120px)] overflow-hidden">
      <div className="text-center flex-shrink-0">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1" style={{ color: '#F15D03' }}>
          🏓 Scoreboard
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 px-4">
          Record and manage match results for the Sioux Ping Pong Tournament
        </p>
      </div>
      <div className="flex-1 min-h-0">
        <ScoreboardComponent />
      </div>
    </div>
  )
}
