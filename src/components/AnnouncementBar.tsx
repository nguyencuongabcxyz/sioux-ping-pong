'use client'

import { Megaphone } from 'lucide-react'

const AnnouncementBar = () => {
  return (
    <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white relative overflow-hidden">
      {/* Animated running text */}
      <div className="flex items-center justify-center py-3 px-4">
        <div className="flex items-center gap-2 mr-4">
          <Megaphone className="w-4 h-4 animate-pulse" />
          <span className="font-semibold text-sm">ANNOUNCEMENT</span>
        </div>
        
        <div className="flex-1 overflow-hidden">
          <div className="animate-marquee whitespace-nowrap">
            <span className="inline-block mr-8">
              🏓 Sioux is hiring Android System Engineers and Embedded Linux Kernel Engineers! 🏓
            </span>
            <span className="inline-block mr-8">
              🏓 Sioux is hiring Android System Engineers and Embedded Linux Kernel Engineers! 🏓
            </span>
            <span className="inline-block mr-8">
              🏓 Sioux is hiring Android System Engineers and Embedded Linux Kernel Engineers! 🏓
            </span>
            <span className="inline-block">
              🏓 Sioux is hiring Android System Engineers and Embedded Linux Kernel Engineers! 🏓
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnnouncementBar 