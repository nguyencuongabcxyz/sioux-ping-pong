'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Trophy, Calendar, Menu, X, Target, BookOpen, Gift, DollarSign } from 'lucide-react'

const Navigation = () => {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    {
      name: 'Standings',
      href: '/',
      icon: Trophy,
    },
    {
      name: 'Schedules',
      href: '/schedules',
      icon: Calendar,
    },
    {
      name: 'Bracket',
      href: '/bracket',
      icon: Target,
    },
    {
      name: 'Rules',
      href: '/rules',
      icon: BookOpen,
    },
    {
      name: 'Awards',
      href: '/awards',
      icon: Gift,
    },
    {
      name: 'Sioux88',
      href: '/sioux88',
      icon: DollarSign,
    },
  ]

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50" style={{ borderColor: '#F15D03' }}>
      <div className="container mx-auto px-2 sm:px-4">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-base sm:text-lg lg:text-xl font-bold">
                🏓 <span className="hidden sm:inline" style={{ color: '#F15D03' }}>Sioux Ping Pong Tournament 2025</span>
                <span className="sm:hidden" style={{ color: '#F15D03' }}>Sioux Tournament</span>
              </h1>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="flex items-baseline space-x-2 lg:space-x-4">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-2 lg:px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1 lg:space-x-2 transition-colors ${
                      isActive
                        ? 'text-white'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                    style={{
                      backgroundColor: isActive ? '#F15D03' : 'transparent'
                    }}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              {mobileMenuOpen ? (
                <X className="block h-5 w-5 sm:h-6 sm:w-6" />
              ) : (
                <Menu className="block h-5 w-5 sm:h-6 sm:w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-3 py-3 rounded-md text-base font-medium flex items-center space-x-3 transition-colors ${
                      isActive
                        ? 'text-white'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                    style={{
                      backgroundColor: isActive ? '#F15D03' : 'transparent'
                    }}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navigation