'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

const BracketRedirect = () => {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to home page (which now shows the bracket)
    router.push('/')
  }, [router])

  return (
    <div className="flex justify-center items-center h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to bracket...</p>
      </div>
    </div>
  )
}

export default BracketRedirect