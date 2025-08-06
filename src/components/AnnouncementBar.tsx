'use client'

import { Megaphone } from 'lucide-react'

const AnnouncementBar = () => {
  return (
    <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white relative overflow-hidden">
      {/* Animated running text */}
      <div className="flex items-center justify-center py-2 sm:py-3 px-3 sm:px-4">
        <div className="flex items-center gap-1 sm:gap-2 mr-2 sm:mr-4">
          <Megaphone className="w-3 h-3 sm:w-4 sm:h-4 animate-pulse" />
          <span className="font-semibold text-xs sm:text-sm">ANNOUNCEMENT</span>
        </div>
        
        <div className="flex-1 overflow-hidden">
          <div className="animate-marquee whitespace-nowrap">
            <span className="inline-block mr-4 sm:mr-8 text-xs sm:text-sm">
              🏓 Sioux is hiring Android System Engineers and Embedded Linux Kernel Engineers! 🏓
            </span>
            <span className="inline-block mr-4 sm:mr-8 text-xs sm:text-sm">
              🏓 Sioux is hiring Android System Engineers and Embedded Linux Kernel Engineers! 🏓
            </span>
            <span className="inline-block mr-4 sm:mr-8 text-xs sm:text-sm">
              🏓 Sioux is hiring Android System Engineers and Embedded Linux Kernel Engineers! 🏓
            </span>
            <span className="inline-block text-xs sm:text-sm">
              🏓 Sioux is hiring Android System Engineers and Embedded Linux Kernel Engineers! 🏓
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnnouncementBar 