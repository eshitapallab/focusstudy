import Link from 'next/link'
import FocusStudyLogo from '@/components/FocusStudyLogo'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-950 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-primary-200/40 to-accent-200/40 dark:from-primary-900/20 dark:to-accent-900/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-accent-200/40 to-primary-200/40 dark:from-accent-900/20 dark:to-primary-900/20 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-10 max-w-2xl relative">
        <header className="mb-10">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-full blur-lg opacity-40" />
              <div className="relative bg-white dark:bg-gray-800 p-2 rounded-full shadow-lg">
                <FocusStudyLogo size={32} color="#6366F1" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-purple-500 to-accent bg-clip-text text-transparent">
                FocusStudy
              </h1>
              <p className="text-sm text-text-secondary dark:text-gray-400">
                Choose what you want to use today
              </p>
            </div>
          </div>
        </header>

        <div className="space-y-4">
          <Link
            href="/focus"
            className="block bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/50 dark:border-gray-700/50 hover:shadow-2xl transition-all"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Timer</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">Focus sessions, streaks, and local-first tracking.</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-semibold">
                ⏱
              </div>
            </div>
          </Link>

          <Link
            href="/track"
            className="block bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/50 dark:border-gray-700/50 hover:shadow-2xl transition-all"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">StudyTrack</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">Daily check-in, honest verdict, one next action.</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent to-primary flex items-center justify-center text-white font-semibold">
                ✅
              </div>
            </div>
          </Link>
        </div>
      </div>
    </main>
  )
}
