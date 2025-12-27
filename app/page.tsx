import Link from 'next/link'
import AppNav from '@/components/Navigation/AppNav'
import QuickStats from '@/components/Home/QuickStats'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-950 relative overflow-hidden">
      <AppNav showAuthButton={true} transparent={true} />
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-72 sm:w-96 h-72 sm:h-96 bg-gradient-to-br from-primary-200/40 to-accent-200/40 dark:from-primary-900/20 dark:to-accent-900/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-72 sm:w-96 h-72 sm:h-96 bg-gradient-to-tr from-accent-200/40 to-primary-200/40 dark:from-accent-900/20 dark:to-primary-900/20 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-10 max-w-4xl relative pb-44 md:pb-8">
        <div className="text-center mb-6 sm:mb-12 pt-4 sm:pt-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-purple-500 to-accent bg-clip-text text-transparent mb-2 sm:mb-4">
            Welcome to FocusStudy
          </h1>
          <p className="text-sm sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto px-2">
            Your all-in-one study companion. Track focus sessions and stay accountable.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <Link
            href="/focus"
            className="group block bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl border border-white/50 dark:border-gray-700/50 hover:shadow-2xl active:scale-[0.98] sm:hover:scale-[1.02] transition-all"
          >
            <div className="flex items-start justify-between gap-2 sm:gap-4 mb-2 sm:mb-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-2xl sm:text-3xl shadow-lg">
                ⏱
              </div>
            </div>
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">Focus Timer</h2>
            <p className="text-xs sm:text-base text-gray-600 dark:text-gray-300 mb-2 sm:mb-4 line-clamp-2 sm:line-clamp-none">
              Pomodoro sessions with streaks & analytics.
            </p>
            <div className="flex items-center gap-1 sm:gap-2 text-primary font-semibold text-sm sm:text-base">
              Start
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </Link>

          <Link
            href="/track"
            className="group block bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl border border-white/50 dark:border-gray-700/50 hover:shadow-2xl active:scale-[0.98] sm:hover:scale-[1.02] transition-all"
          >
            <div className="flex items-start justify-between gap-2 sm:gap-4 mb-2 sm:mb-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-accent to-primary flex items-center justify-center text-white text-2xl sm:text-3xl shadow-lg">
                ✅
              </div>
            </div>
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">StudyTrack</h2>
            <p className="text-xs sm:text-base text-gray-600 dark:text-gray-300 mb-2 sm:mb-4 line-clamp-2 sm:line-clamp-none">
              Daily check-ins & recall assessment.
            </p>
            <div className="flex items-center gap-1 sm:gap-2 text-accent font-semibold text-sm sm:text-base">
              Check in
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </Link>

          <Link
            href="/analytics"
            className="group block bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl border border-white/50 dark:border-gray-700/50 hover:shadow-2xl active:scale-[0.98] sm:hover:scale-[1.02] transition-all"
          >
            <div className="flex items-start justify-between gap-2 sm:gap-4 mb-2 sm:mb-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl sm:text-3xl shadow-lg">
                📊
              </div>
            </div>
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">Analytics</h2>
            <p className="text-xs sm:text-base text-gray-600 dark:text-gray-300 mb-2 sm:mb-4 line-clamp-2 sm:line-clamp-none">
              Heatmaps, trends & insights.
            </p>
            <div className="flex items-center gap-1 sm:gap-2 text-purple-600 font-semibold text-sm sm:text-base">
              View
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </Link>

          <Link
            href="/settings"
            className="group block bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl border border-white/50 dark:border-gray-700/50 hover:shadow-2xl active:scale-[0.98] sm:hover:scale-[1.02] transition-all"
          >
            <div className="flex items-start justify-between gap-2 sm:gap-4 mb-2 sm:mb-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-2xl sm:text-3xl shadow-lg">
                ⚙️
              </div>
            </div>
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">Settings</h2>
            <p className="text-xs sm:text-base text-gray-600 dark:text-gray-300 mb-2 sm:mb-4 line-clamp-2 sm:line-clamp-none">
              Customize & join pods.
            </p>
            <div className="flex items-center gap-1 sm:gap-2 text-emerald-600 font-semibold text-sm sm:text-base">
              Open
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </Link>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">
            ✨ New Features
          </h3>
          <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
            Ambient sounds, achievements, motivational quotes, and accountability pods!
          </p>
        </div>

        {/* Quick Stats Widget */}
        <QuickStats />
      </div>
    </main>
  )
}
