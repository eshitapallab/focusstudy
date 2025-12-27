import Link from 'next/link'
import AppNav from '@/components/Navigation/AppNav'
import QuickStats from '@/components/Home/QuickStats'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-950 relative overflow-hidden pb-20">
      <AppNav showAuthButton={true} transparent={true} />
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-primary-200/40 to-accent-200/40 dark:from-primary-900/20 dark:to-accent-900/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-accent-200/40 to-primary-200/40 dark:from-accent-900/20 dark:to-primary-900/20 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-10 max-w-4xl relative">
        <div className="text-center mb-12 pt-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-purple-500 to-accent bg-clip-text text-transparent mb-4">
            Welcome to FocusStudy
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Your all-in-one study companion. Track your focus sessions, monitor your progress, and stay accountable with daily check-ins.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Link
            href="/focus"
            className="group block bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/50 dark:border-gray-700/50 hover:shadow-2xl hover:scale-[1.02] transition-all"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-3xl shadow-lg group-hover:scale-110 transition-transform">
                ⏱
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Focus Timer</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Pomodoro-style sessions with distraction tracking, streaks, and detailed analytics. Stay focused and build momentum.
            </p>
            <div className="flex items-center gap-2 text-primary font-semibold">
              Start a session
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </Link>

          <Link
            href="/track"
            className="group block bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/50 dark:border-gray-700/50 hover:shadow-2xl hover:scale-[1.02] transition-all"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-primary flex items-center justify-center text-white text-3xl shadow-lg group-hover:scale-110 transition-transform">
                ✅
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">StudyTrack</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Daily check-ins with honest recall assessment. Get your verdict, next micro-action, and reality check weekly.
            </p>
            <div className="flex items-center gap-2 text-accent font-semibold">
              Check in today
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </Link>

          <Link
            href="/analytics"
            className="group block bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/50 dark:border-gray-700/50 hover:shadow-2xl hover:scale-[1.02] transition-all"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-3xl shadow-lg group-hover:scale-110 transition-transform">
                📊
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Analytics</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Heatmaps, trends, subject breakdowns, and comparison insights. See your progress over time.
            </p>
            <div className="flex items-center gap-2 text-purple-600 font-semibold">
              View stats
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </Link>

          <Link
            href="/settings"
            className="group block bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/50 dark:border-gray-700/50 hover:shadow-2xl hover:scale-[1.02] transition-all"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-3xl shadow-lg group-hover:scale-110 transition-transform">
                ⚙️
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Settings & Pods</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Customize your experience, manage notifications, join accountability pods, and more.
            </p>
            <div className="flex items-center gap-2 text-emerald-600 font-semibold">
              Customize
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </Link>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            ✨ New Features
          </h3>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Confidence vs Reality gap, Tomorrow Lock, Weak-subject detection, Emotional check-ins, Monthly snapshots, and Micro accountability pods!
          </p>
        </div>

        {/* Quick Stats Widget */}
        <QuickStats />
      </div>
    </main>
  )
}
