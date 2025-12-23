/**
 * Comparison Mode Analytics
 * Compare study sessions across different time periods
 */

import { db } from './dexieClient'
import { calculateActualDuration } from './timer'

export interface PeriodStats {
  totalMinutes: number
  sessionCount: number
  avgSessionMinutes: number
  longestSessionMinutes: number
  totalDistractions: number
  avgDistractionsPerSession: number
  focusScore: number // 0-100
}

export interface ComparisonData {
  current: PeriodStats
  previous: PeriodStats
  change: {
    totalMinutes: number // percentage change
    sessionCount: number
    avgSessionMinutes: number
    focusScore: number
  }
}

/**
 * Calculate stats for a time period
 */
async function calculatePeriodStats(startTs: number, endTs: number): Promise<PeriodStats> {
  const sessions = await db.sessions
    .where('startTs')
    .between(startTs, endTs, true, false)
    .toArray()
  
  const completedSessions = sessions.filter(s => s.endTs)
  
  if (completedSessions.length === 0) {
    return {
      totalMinutes: 0,
      sessionCount: 0,
      avgSessionMinutes: 0,
      longestSessionMinutes: 0,
      totalDistractions: 0,
      avgDistractionsPerSession: 0,
      focusScore: 0
    }
  }
  
  const totalMs = completedSessions.reduce((sum, s) => sum + calculateActualDuration(s), 0)
  const totalMinutes = totalMs / 60000
  
  const longestMs = Math.max(...completedSessions.map(s => calculateActualDuration(s)))
  const longestMinutes = longestMs / 60000
  
  const totalDistractions = completedSessions.reduce((sum, s) => {
    return sum + (s.distractions?.length || 0)
  }, 0)
  
  const avgDistractionsPerSession = totalDistractions / completedSessions.length
  
  // Focus score: weighted combination of factors
  // - Session completion (baseline 50)
  // - Low distractions (0-25 points, inversely proportional)
  // - Consistency (0-25 points based on session frequency)
  const distractionPenalty = Math.min(avgDistractionsPerSession * 5, 25)
  const consistencyBonus = Math.min((completedSessions.length / 7) * 25, 25) // 1 session/day = 25 points
  const focusScore = Math.round(50 - distractionPenalty + consistencyBonus)
  
  return {
    totalMinutes: Math.round(totalMinutes),
    sessionCount: completedSessions.length,
    avgSessionMinutes: Math.round(totalMinutes / completedSessions.length),
    longestSessionMinutes: Math.round(longestMinutes),
    totalDistractions,
    avgDistractionsPerSession: Math.round(avgDistractionsPerSession * 10) / 10,
    focusScore: Math.max(0, Math.min(100, focusScore))
  }
}

/**
 * Compare this week vs last week
 */
export async function compareWeeks(): Promise<ComparisonData> {
  const now = Date.now()
  const dayMs = 24 * 60 * 60 * 1000
  const weekMs = 7 * dayMs
  
  // This week: last 7 days
  const thisWeekStart = now - weekMs
  const thisWeekEnd = now
  
  // Last week: 7 days before that
  const lastWeekStart = thisWeekStart - weekMs
  const lastWeekEnd = thisWeekStart
  
  const current = await calculatePeriodStats(thisWeekStart, thisWeekEnd)
  const previous = await calculatePeriodStats(lastWeekStart, lastWeekEnd)
  
  return {
    current,
    previous,
    change: {
      totalMinutes: calculatePercentageChange(previous.totalMinutes, current.totalMinutes),
      sessionCount: calculatePercentageChange(previous.sessionCount, current.sessionCount),
      avgSessionMinutes: calculatePercentageChange(previous.avgSessionMinutes, current.avgSessionMinutes),
      focusScore: calculatePercentageChange(previous.focusScore, current.focusScore)
    }
  }
}

/**
 * Compare this month vs last month
 */
export async function compareMonths(): Promise<ComparisonData> {
  const now = new Date()
  
  // This month
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  const thisMonthEnd = Date.now()
  
  // Last month
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime()
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  
  const current = await calculatePeriodStats(thisMonthStart, thisMonthEnd)
  const previous = await calculatePeriodStats(lastMonthStart, lastMonthEnd)
  
  return {
    current,
    previous,
    change: {
      totalMinutes: calculatePercentageChange(previous.totalMinutes, current.totalMinutes),
      sessionCount: calculatePercentageChange(previous.sessionCount, current.sessionCount),
      avgSessionMinutes: calculatePercentageChange(previous.avgSessionMinutes, current.avgSessionMinutes),
      focusScore: calculatePercentageChange(previous.focusScore, current.focusScore)
    }
  }
}

/**
 * Compare custom date ranges
 */
export async function compareCustomPeriods(
  period1Start: number,
  period1End: number,
  period2Start: number,
  period2End: number
): Promise<ComparisonData> {
  const previous = await calculatePeriodStats(period1Start, period1End)
  const current = await calculatePeriodStats(period2Start, period2End)
  
  return {
    current,
    previous,
    change: {
      totalMinutes: calculatePercentageChange(previous.totalMinutes, current.totalMinutes),
      sessionCount: calculatePercentageChange(previous.sessionCount, current.sessionCount),
      avgSessionMinutes: calculatePercentageChange(previous.avgSessionMinutes, current.avgSessionMinutes),
      focusScore: calculatePercentageChange(previous.focusScore, current.focusScore)
    }
  }
}

/**
 * Calculate percentage change
 */
function calculatePercentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) {
    return newValue > 0 ? 100 : 0
  }
  
  return Math.round(((newValue - oldValue) / oldValue) * 100)
}

/**
 * Get insights from comparison data
 */
export function getComparisonInsights(data: ComparisonData): string[] {
  const insights: string[] = []
  
  // Study time insights
  if (data.change.totalMinutes > 20) {
    insights.push(`🔥 Study time up ${data.change.totalMinutes}% — you're crushing it!`)
  } else if (data.change.totalMinutes < -20) {
    insights.push(`📉 Study time down ${Math.abs(data.change.totalMinutes)}% — let's get back on track`)
  }
  
  // Focus score insights
  if (data.change.focusScore > 10) {
    insights.push(`✨ Focus improved ${data.change.focusScore}% — fewer distractions!`)
  } else if (data.change.focusScore < -10) {
    insights.push(`⚠️ Focus down ${Math.abs(data.change.focusScore)}% — try shorter sessions?`)
  }
  
  // Session length insights
  if (data.current.avgSessionMinutes > data.previous.avgSessionMinutes + 10) {
    insights.push(`⏱️ Longer sessions (${data.current.avgSessionMinutes}min avg) — building stamina!`)
  }
  
  // Consistency insights
  if (data.change.sessionCount > 30) {
    insights.push(`🎯 ${data.change.sessionCount}% more sessions — consistency is key!`)
  }
  
  // Distraction insights
  if (data.current.totalDistractions < data.previous.totalDistractions / 2) {
    insights.push(`🧘 Distractions cut in half — your focus is strengthening`)
  }
  
  // Add at least one positive insight
  if (insights.length === 0) {
    if (data.current.sessionCount > 0) {
      insights.push(`📚 ${data.current.sessionCount} sessions this period — keep it up!`)
    } else {
      insights.push(`🌱 Time to start fresh — every journey begins with one session`)
    }
  }
  
  return insights
}
