// Motivational quotes for focus sessions
export const FOCUS_QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "It's not about having time, it's about making time.", author: "Unknown" },
  { text: "Small daily improvements are the key to staggering long-term results.", author: "Unknown" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
  { text: "Your future is created by what you do today, not tomorrow.", author: "Robert Kiyosaki" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "A little progress each day adds up to big results.", author: "Unknown" },
  { text: "The harder you work for something, the greater you'll feel when you achieve it.", author: "Unknown" },
  { text: "Dream big. Start small. Act now.", author: "Robin Sharma" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { text: "What you do today can improve all your tomorrows.", author: "Ralph Marston" },
  { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
  { text: "Great things never come from comfort zones.", author: "Unknown" },
  { text: "Don't stop when you're tired. Stop when you're done.", author: "Unknown" },
]

export const BREAK_QUOTES = [
  { text: "Rest when you're weary. Refresh and renew yourself.", author: "Ralph Marston" },
  { text: "Almost everything will work again if you unplug it for a few minutes.", author: "Anne Lamott" },
  { text: "Take a break. Your brain will thank you.", author: "Unknown" },
  { text: "The time to relax is when you don't have time for it.", author: "Sydney J. Harris" },
  { text: "Stretch. Breathe. Hydrate. You've earned this break.", author: "Unknown" },
]

export const STREAK_MESSAGES = [
  { minDays: 1, message: "🔥 First day! Every journey starts with a single step." },
  { minDays: 3, message: "🔥 3 day streak! You're building momentum!" },
  { minDays: 7, message: "🔥 1 week streak! Consistency is key!" },
  { minDays: 14, message: "🔥 2 week streak! You're unstoppable!" },
  { minDays: 21, message: "🔥 3 weeks! They say it takes 21 days to form a habit!" },
  { minDays: 30, message: "🔥 30 days! You're a focus master!" },
  { minDays: 60, message: "🔥 60 days! Your dedication is inspiring!" },
  { minDays: 90, message: "🔥 90 days! Legendary focus streak!" },
  { minDays: 100, message: "💯 100 days! You're in the 1%!" },
  { minDays: 365, message: "🏆 1 YEAR! Absolute champion!" },
]

export function getRandomQuote(type: 'focus' | 'break' = 'focus'): { text: string; author: string } {
  const quotes = type === 'focus' ? FOCUS_QUOTES : BREAK_QUOTES
  return quotes[Math.floor(Math.random() * quotes.length)]
}

export function getStreakMessage(days: number): string {
  const sorted = [...STREAK_MESSAGES].sort((a, b) => b.minDays - a.minDays)
  const milestone = sorted.find(m => days >= m.minDays)
  return milestone?.message || "Start your streak today! 🌟"
}

// Achievement badges
export const ACHIEVEMENTS = [
  { id: 'first_session', name: 'First Step', description: 'Complete your first focus session', icon: '🌱', requirement: { type: 'sessions', count: 1 } },
  { id: 'ten_sessions', name: 'Getting Started', description: 'Complete 10 focus sessions', icon: '🎯', requirement: { type: 'sessions', count: 10 } },
  { id: 'fifty_sessions', name: 'Focus Warrior', description: 'Complete 50 focus sessions', icon: '⚔️', requirement: { type: 'sessions', count: 50 } },
  { id: 'hundred_sessions', name: 'Centurion', description: 'Complete 100 focus sessions', icon: '🏛️', requirement: { type: 'sessions', count: 100 } },
  { id: 'one_hour', name: 'Hour Hero', description: 'Study for 1 hour in a day', icon: '⏰', requirement: { type: 'daily_minutes', count: 60 } },
  { id: 'two_hours', name: 'Double Down', description: 'Study for 2 hours in a day', icon: '✌️', requirement: { type: 'daily_minutes', count: 120 } },
  { id: 'four_hours', name: 'Marathon Mind', description: 'Study for 4 hours in a day', icon: '🏃', requirement: { type: 'daily_minutes', count: 240 } },
  { id: 'streak_3', name: 'Spark', description: '3 day study streak', icon: '✨', requirement: { type: 'streak', count: 3 } },
  { id: 'streak_7', name: 'Week Warrior', description: '7 day study streak', icon: '🔥', requirement: { type: 'streak', count: 7 } },
  { id: 'streak_14', name: 'Fortnight Fighter', description: '14 day study streak', icon: '💪', requirement: { type: 'streak', count: 14 } },
  { id: 'streak_30', name: 'Monthly Master', description: '30 day study streak', icon: '👑', requirement: { type: 'streak', count: 30 } },
  { id: 'early_bird', name: 'Early Bird', description: 'Start a session before 7 AM', icon: '🐦', requirement: { type: 'special', condition: 'early_session' } },
  { id: 'night_owl', name: 'Night Owl', description: 'Study after 10 PM', icon: '🦉', requirement: { type: 'special', condition: 'late_session' } },
  { id: 'weekend_warrior', name: 'Weekend Warrior', description: 'Study on both Saturday and Sunday', icon: '🗓️', requirement: { type: 'special', condition: 'weekend_study' } },
  { id: 'pod_pioneer', name: 'Pod Pioneer', description: 'Join or create a study pod', icon: '🤝', requirement: { type: 'special', condition: 'joined_pod' } },
  { id: 'distraction_free', name: 'Laser Focus', description: 'Complete a 30+ min session with 0 distractions', icon: '🎯', requirement: { type: 'special', condition: 'distraction_free' } },
]

export type Achievement = typeof ACHIEVEMENTS[number]
