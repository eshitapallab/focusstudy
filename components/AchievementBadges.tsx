'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { db, LocalSession } from '@/lib/dexieClient';
import { ACHIEVEMENTS, Achievement } from '@/lib/motivationalQuotes';
import { calculateActualDuration } from '@/lib/timer';

interface UserStats {
  totalSessions: number;
  totalMinutes: number;
  currentStreak: number;
  longestStreak: number;
  subjectCount: number;
  maxDailyMinutes: number;
  hasEarlySession: boolean;
  hasLateSession: boolean;
  hasWeekendStudy: boolean;
  hasDistractionFreeSession: boolean;
}

interface AchievementBadgeProps {
  achievement: Achievement;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
}

function AchievementBadge({ achievement, unlocked, progress, maxProgress }: AchievementBadgeProps) {
  const progressPercent = Math.min((progress / maxProgress) * 100, 100);
  
  return (
    <div
      className={`relative group p-3 sm:p-4 rounded-xl border transition-all duration-300 ${
        unlocked
          ? 'bg-gradient-to-br from-amber-500/10 via-yellow-500/10 to-orange-500/10 border-amber-500/30 shadow-lg shadow-amber-500/10'
          : 'bg-slate-800/30 border-slate-700/50 opacity-60 grayscale'
      }`}
    >
      {/* Glow effect for unlocked */}
      {unlocked && (
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-orange-500/5 rounded-xl animate-pulse pointer-events-none" />
      )}
      
      {/* Badge icon */}
      <div className="relative">
        <div
          className={`w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-2 sm:mb-3 rounded-full flex items-center justify-center text-2xl sm:text-3xl ${
            unlocked
              ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/30'
              : 'bg-slate-700'
          }`}
        >
          {achievement.icon}
        </div>
        
        {/* Lock overlay */}
        {!unlocked && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-slate-900/50 flex items-center justify-center">
              <span className="text-xl sm:text-2xl">🔒</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Badge name */}
      <h4 className={`text-center font-semibold mb-1 text-xs sm:text-sm ${unlocked ? 'text-amber-300' : 'text-slate-400'}`}>
        {achievement.name}
      </h4>
      
      {/* Description - hidden on small screens */}
      <p className="hidden sm:block text-xs text-center text-slate-500 mb-3">
        {achievement.description}
      </p>
      
      {/* Progress bar for countable achievements */}
      {!unlocked && maxProgress > 1 && (
        <div className="mt-1 sm:mt-2">
          <div className="h-1 sm:h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-[9px] sm:text-[10px] text-slate-500 text-center mt-0.5 sm:mt-1">
            {progress} / {maxProgress}
          </p>
        </div>
      )}
      
      {/* Unlocked badge */}
      {unlocked && (
        <div className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 bg-amber-500 text-white text-[10px] sm:text-xs font-bold w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full shadow-lg">
          ✓
        </div>
      )}
    </div>
  );
}

export default function AchievementBadges() {
  const [stats, setStats] = useState<UserStats>({
    totalSessions: 0,
    totalMinutes: 0,
    currentStreak: 0,
    longestStreak: 0,
    subjectCount: 0,
    maxDailyMinutes: 0,
    hasEarlySession: false,
    hasLateSession: false,
    hasWeekendStudy: false,
    hasDistractionFreeSession: false,
  });
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    async function loadStats() {
      try {
        const sessions = await db.sessions.where('endTs').above(0).toArray();
        
        if (sessions.length === 0) {
          return;
        }

        // Total sessions and minutes
        const totalSessions = sessions.length;
        const totalMinutes = sessions.reduce((sum: number, s: LocalSession) => {
          const duration = calculateActualDuration(s);
          return sum + Math.floor(duration / 1000 / 60);
        }, 0);

        // Get metadata for subjects
        const metadata = await db.sessionMetadata.toArray();
        const subjects = new Set(metadata.map(m => m.subject).filter(Boolean));
        const subjectCount = subjects.size;

        // Calculate daily minutes for max
        const dailyMinutes: { [key: string]: number } = {};
        sessions.forEach((s: LocalSession) => {
          const date = new Date(s.startTs).toISOString().split('T')[0];
          const duration = Math.floor(calculateActualDuration(s) / 1000 / 60);
          dailyMinutes[date] = (dailyMinutes[date] || 0) + duration;
        });
        const maxDailyMinutes = Math.max(0, ...Object.values(dailyMinutes));

        // Check special achievements
        let hasEarlySession = false;
        let hasLateSession = false;
        let hasWeekendStudy = { sat: false, sun: false };
        let hasDistractionFreeSession = false;

        sessions.forEach((s: LocalSession) => {
          const startDate = new Date(s.startTs);
          const hour = startDate.getHours();
          const day = startDate.getDay();
          const duration = Math.floor(calculateActualDuration(s) / 1000 / 60);
          
          if (hour < 7) hasEarlySession = true;
          if (hour >= 22) hasLateSession = true;
          if (day === 6) hasWeekendStudy.sat = true;
          if (day === 0) hasWeekendStudy.sun = true;
          if (duration >= 30 && (!s.distractions || s.distractions.length === 0)) {
            hasDistractionFreeSession = true;
          }
        });

        // Calculate streaks
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Get dates with sessions
        const sessionDates = new Set<string>();
        sessions.forEach((s: LocalSession) => {
          const date = new Date(s.startTs);
          date.setHours(0, 0, 0, 0);
          sessionDates.add(date.toISOString().split('T')[0]);
        });

        const sortedDates = Array.from(sessionDates).sort().reverse();
        
        // Current streak
        let currentStreak = 0;
        const todayStr = today.toISOString().split('T')[0];
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        if (sortedDates.includes(todayStr) || sortedDates.includes(yesterdayStr)) {
          let checkDate = sortedDates.includes(todayStr) ? new Date(today) : new Date(yesterday);
          
          for (const dateStr of sortedDates) {
            const checkDateStr = checkDate.toISOString().split('T')[0];
            if (dateStr === checkDateStr) {
              currentStreak++;
              checkDate.setDate(checkDate.getDate() - 1);
            } else if (dateStr < checkDateStr) {
              break;
            }
          }
        }

        // Longest streak (simplified calculation)
        let longestStreak = 0;
        let tempStreak = 0;
        let prevDate: Date | null = null;

        sortedDates.reverse().forEach(dateStr => {
          const date = new Date(dateStr);
          if (prevDate) {
            const diff = (date.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
            if (diff === 1) {
              tempStreak++;
            } else {
              longestStreak = Math.max(longestStreak, tempStreak);
              tempStreak = 1;
            }
          } else {
            tempStreak = 1;
          }
          prevDate = date;
        });
        longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

        setStats({
          totalSessions,
          totalMinutes,
          currentStreak,
          longestStreak,
          subjectCount,
          maxDailyMinutes,
          hasEarlySession,
          hasLateSession,
          hasWeekendStudy: hasWeekendStudy.sat && hasWeekendStudy.sun,
          hasDistractionFreeSession,
        });
      } catch (error) {
        console.error('Failed to load stats for achievements:', error);
      }
    }

    loadStats();
  }, []);

  // Check which achievements are unlocked
  const achievementsWithStatus = useMemo(() => {
    return ACHIEVEMENTS.map(achievement => {
      let progress = 0;
      let maxProgress = 1;
      let unlocked = false;

      const reqType = achievement.requirement.type;
      const reqCount = 'count' in achievement.requirement ? achievement.requirement.count : undefined;
      const reqCondition = 'condition' in achievement.requirement ? achievement.requirement.condition : undefined;

      switch (reqType) {
        case 'sessions':
          progress = stats.totalSessions;
          maxProgress = reqCount || 1;
          unlocked = progress >= maxProgress;
          break;
        case 'streak':
          progress = Math.max(stats.currentStreak, stats.longestStreak);
          maxProgress = reqCount || 1;
          unlocked = progress >= maxProgress;
          break;
        case 'daily_minutes':
          progress = stats.maxDailyMinutes;
          maxProgress = reqCount || 1;
          unlocked = progress >= maxProgress;
          break;
        case 'special':
          maxProgress = 1;
          switch (reqCondition) {
            case 'early_session':
              unlocked = stats.hasEarlySession;
              progress = unlocked ? 1 : 0;
              break;
            case 'late_session':
              unlocked = stats.hasLateSession;
              progress = unlocked ? 1 : 0;
              break;
            case 'weekend_study':
              unlocked = stats.hasWeekendStudy;
              progress = unlocked ? 1 : 0;
              break;
            case 'distraction_free':
              unlocked = stats.hasDistractionFreeSession;
              progress = unlocked ? 1 : 0;
              break;
            default:
              progress = 0;
          }
          break;
      }

      return { achievement, unlocked, progress, maxProgress };
    });
  }, [stats]);

  const unlockedCount = achievementsWithStatus.filter(a => a.unlocked).length;
  const displayAchievements = showAll 
    ? achievementsWithStatus 
    : achievementsWithStatus.slice(0, 6);

  return (
    <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl sm:rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div>
          <h3 className="font-semibold text-white flex items-center gap-2 text-sm sm:text-base">
            <span className="text-lg sm:text-xl">🏆</span> Achievements
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5 sm:mt-1">
            {unlockedCount} of {ACHIEVEMENTS.length} unlocked
          </p>
        </div>
        
        {/* Progress ring */}
        <div className="relative w-11 h-11 sm:w-14 sm:h-14">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="50%"
              cy="50%"
              r="40%"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-slate-700"
            />
            <circle
              cx="50%"
              cy="50%"
              r="40%"
              fill="none"
              stroke="url(#achievementGradient)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${(unlockedCount / ACHIEVEMENTS.length) * 100} 100`}
              className="origin-center"
            />
            <defs>
              <linearGradient id="achievementGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#f97316" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs sm:text-sm font-bold text-amber-400">
              {Math.round((unlockedCount / ACHIEVEMENTS.length) * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Achievement grid - 2 cols on mobile, 3 on larger */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
        {displayAchievements.map(({ achievement, unlocked, progress, maxProgress }) => (
          <AchievementBadge
            key={achievement.id}
            achievement={achievement}
            unlocked={unlocked}
            progress={progress}
            maxProgress={maxProgress}
          />
        ))}
      </div>

      {/* Show more/less button */}
      {ACHIEVEMENTS.length > 6 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full mt-3 sm:mt-4 py-2.5 text-xs sm:text-sm text-cyan-400 hover:text-cyan-300 transition-colors min-h-[44px] active:scale-95"
        >
          {showAll ? 'Show less ↑' : `Show all ${ACHIEVEMENTS.length} achievements ↓`}
        </button>
      )}
    </div>
  );
}
