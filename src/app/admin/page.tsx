'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import AdminDashboard from '@/components/AdminDashboard'

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return // Still loading

    if (!session) {
      router.push('/admin/login')
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
          Admin Dashboard
        </h1>
        <p className="text-sm sm:text-base text-gray-600 px-4">
          Manage tournament schedules and match results
        </p>
        <p className="text-xs sm:text-sm text-gray-500 mt-2">
          Welcome back, {session.user.email}
        </p>
      </div>
      
      <AdminDashboard />
    </div>
  )
}