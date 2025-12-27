'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import FocusStudyLogo from '@/components/FocusStudyLogo'
import UserMenu from '@/components/Auth/UserMenu'

interface AppNavProps {
  user?: any
  showAuthButton?: boolean
  transparent?: boolean
}

export default function AppNav({ user, showAuthButton = false, transparent = false }: AppNavProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showTopNav, setShowTopNav] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  // Hide top nav on scroll down, show on scroll up (mobile only)
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      if (currentScrollY > lastScrollY && currentScrollY > 60) {
        setShowTopNav(false)
      } else {
        setShowTopNav(true)
      }
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  const navItems = [
    { href: '/', label: 'Home', icon: 'M3 10.5L12 3l9 7.5V21a1 1 0 01-1 1h-5v-7H9v7H4a1 1 0 01-1-1v-10.5z', emoji: '🏠' },
    { href: '/focus', label: 'Timer', icon: 'M12 8v4l3 3M12 21a8 8 0 100-16 8 8 0 000 16zM9 3h6', emoji: '⏱️' },
    { href: '/track', label: 'Track', icon: 'M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11', emoji: '✅' },
    { href: '/pod', label: 'Pod', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', emoji: '👥' },
    { href: '/planner', label: 'Plan', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', emoji: '📅' },
    { href: '/analytics', label: 'Stats', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', emoji: '📊' },
    { href: '/settings', label: 'More', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z', emoji: '⚙️' }
  ]

  // Bottom nav items (5 most important for mobile)
  const bottomNavItems = [
    navItems[0], // Home
    navItems[1], // Timer
    navItems[4], // Plan/Calendar
    navItems[5], // Stats
    navItems[6], // More/Settings
  ]

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Top Navigation Bar */}
      <nav className={`sticky top-0 z-50 transition-transform duration-300 ${showTopNav ? 'translate-y-0' : '-translate-y-full md:translate-y-0'} ${transparent ? 'bg-transparent' : 'bg-white/80 dark:bg-gray-900/80'} backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 shadow-sm`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-full blur-lg opacity-40" />
                <div className="relative bg-white dark:bg-gray-800 p-1.5 sm:p-2 rounded-full shadow-lg">
                  <FocusStudyLogo size={20} color="#6366F1" />
                </div>
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-bold bg-gradient-to-r from-primary via-purple-500 to-accent bg-clip-text text-transparent">
                  FocusStudy
                </h1>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-1 bg-gray-100/50 dark:bg-gray-800/50 rounded-2xl p-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive(item.href)
                      ? 'bg-white dark:bg-gray-700 text-primary shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Mobile - Auth/Menu button only */}
            <div className="flex md:hidden items-center gap-2">
              {showAuthButton && !user && (
                <Link
                  href="/auth"
                  className="px-3 py-1.5 bg-gradient-to-r from-primary to-accent text-white text-xs font-semibold rounded-lg shadow-md"
                >
                  Sign In
                </Link>
              )}
              {user && <UserMenu />}
            </div>

            {/* Desktop Right side actions */}
            <div className="hidden md:flex items-center gap-3">
              {showAuthButton && !user && (
                <Link
                  href="/auth"
                  className="px-4 py-2 bg-gradient-to-r from-primary to-accent hover:from-primary-600 hover:to-accent-600 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-primary/25 transform hover:scale-105 active:scale-95"
                >
                  Sign In ✨
                </Link>
              )}
              {user && <UserMenu />}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800 safe-area-pb">
        <div className="grid grid-cols-5 h-16">
          {bottomNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 py-2 transition-all active:scale-95 ${
                isActive(item.href)
                  ? 'text-primary'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <div className={`relative flex items-center justify-center w-10 h-7 rounded-xl transition-all ${
                isActive(item.href)
                  ? 'bg-primary/10'
                  : ''
              }`}>
                <span className="text-xl">{item.emoji}</span>
                {isActive(item.href) && (
                  <div className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full" />
                )}
              </div>
              <span className={`text-[10px] font-medium ${
                isActive(item.href) ? 'text-primary' : ''
              }`}>
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Mobile Menu Dropdown (when clicking More/Settings) */}
      {mobileMenuOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed bottom-20 right-4 left-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 md:hidden overflow-hidden safe-area-mb">
            <div className="p-2">
              {navItems.filter(item => !bottomNavItems.includes(item)).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive(item.href)
                      ? 'bg-primary/10 text-primary'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="text-xl">{item.emoji}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  )
}
