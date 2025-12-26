import { VerdictStatus } from './types'

/**
 * LAYER 1: Tone Engine
 * Personalized language based on user preference (calm, direct, coach)
 */

export type ToneMode = 'calm' | 'direct' | 'coach'

export interface VerdictCopy {
  heading: string
  subtext: string
  actionPrompt: string
}

/**
 * Get verdict messaging based on tone preference
 */
export function getVerdictCopy(
  status: VerdictStatus,
  tone: ToneMode = 'calm'
): VerdictCopy {
  const copies: Record<ToneMode, Record<VerdictStatus, VerdictCopy>> = {
    calm: {
      'on-track': {
        heading: 'You are on track',
        subtext: 'Your pace is steady. Keep showing up.',
        actionPrompt: 'Continue your routine'
      },
      'at-risk': {
        heading: 'Gently adjust course',
        subtext: 'A small shift now prevents larger gaps later.',
        actionPrompt: 'Make one small change today'
      },
      'falling-behind': {
        heading: 'Time to recalibrate',
        subtext: 'This is not failure. It is data. Start where you are.',
        actionPrompt: 'Choose one simple task'
      }
    },
    direct: {
      'on-track': {
        heading: 'On track',
        subtext: 'You are meeting expectations. Stay consistent.',
        actionPrompt: 'Maintain current pace'
      },
      'at-risk': {
        heading: 'At risk',
        subtext: 'Course correction needed. Act now.',
        actionPrompt: 'Fix this today'
      },
      'falling-behind': {
        heading: 'Falling behind',
        subtext: 'Significant gap detected. Immediate action required.',
        actionPrompt: 'Start recovery plan'
      }
    },
    coach: {
      'on-track': {
        heading: 'Locked in',
        subtext: 'This is what discipline looks like. Do not blink.',
        actionPrompt: 'Keep the momentum'
      },
      'at-risk': {
        heading: 'Stay sharp',
        subtext: 'You have been here before. You know what to do.',
        actionPrompt: 'Course correct now'
      },
      'falling-behind': {
        heading: 'Get back up',
        subtext: 'Champions stumble. Quitters stay down. Which are you?',
        actionPrompt: 'Restart with intensity'
      }
    }
  }

  return copies[tone][status]
}

/**
 * Get micro-action intro based on tone
 */
export function getMicroActionIntro(tone: ToneMode = 'calm'): string {
  const intros: Record<ToneMode, string> = {
    calm: 'Here is one small step for today:',
    direct: 'Today\'s task:',
    coach: 'Your move today:'
  }
  return intros[tone]
}

/**
 * Get reality check intro based on tone
 */
export function getRealityCheckIntro(tone: ToneMode = 'calm'): string {
  const intros: Record<ToneMode, string> = {
    calm: 'Let\'s reflect on this week honestly:',
    direct: 'Weekly reality check:',
    coach: 'Time for truth. No excuses:'
  }
  return intros[tone]
}

/**
 * Get honesty prompt based on tone (for gaming detection)
 */
export function getHonestyPromptTone(tone: ToneMode = 'calm'): string {
  const prompts: Record<ToneMode, string> = {
    calm: 'Your data looks unusually consistent. Are these numbers accurate?',
    direct: 'Suspicious pattern detected. Confirm these entries are honest.',
    coach: 'Be real with yourself. Are you gaming the system or doing the work?'
  }
  return prompts[tone]
}

/**
 * Get reset prompt copy
 */
export function getResetPromptCopy(tone: ToneMode = 'calm'): VerdictCopy {
  const copies: Record<ToneMode, VerdictCopy> = {
    calm: {
      heading: 'Would you like to reset?',
      subtext: 'Resets are not failure. Sometimes starting fresh helps.',
      actionPrompt: 'Reset my journey'
    },
    direct: {
      heading: 'Reset available',
      subtext: 'If current trajectory is unsustainable, reset and restart.',
      actionPrompt: 'Reset now'
    },
    coach: {
      heading: 'Need a clean slate?',
      subtext: 'Champions adjust strategy. Reset if you must, but come back stronger.',
      actionPrompt: 'Reset and refocus'
    }
  }
  return copies[tone]
}

/**
 * Get recovery path messaging
 */
export function getRecoveryPathCopy(
  daysInactive: number,
  recommendedDays: number,
  tone: ToneMode = 'calm'
): string {
  const templates: Record<ToneMode, string> = {
    calm: `You have been away for ${daysInactive} days. You can realistically get back on track in ${recommendedDays} days. Start light.`,
    direct: `${daysInactive} days inactive. Recovery path: ${recommendedDays} days. Begin immediately.`,
    coach: `${daysInactive} days gone. You can fix this in ${recommendedDays} days if you commit right now. No excuses.`
  }
  return templates[tone]
}

/**
 * Get truth index messaging
 */
export function getTruthIndexCopy(truthIndex: number, tone: ToneMode = 'calm'): string {
  const level = truthIndex >= 85 ? 'high' : truthIndex >= 70 ? 'moderate' : 'low'
  
  const templates: Record<ToneMode, Record<string, string>> = {
    calm: {
      high: 'Your honesty signal is strong. This data feels real.',
      moderate: 'Your tracking looks genuine. Keep being honest.',
      low: 'Your data shows some inconsistencies. Check in with yourself.'
    },
    direct: {
      high: 'High honesty detected. Trust your data.',
      moderate: 'Decent honesty level. Stay consistent.',
      low: 'Low honesty signal. Verify your entries.'
    },
    coach: {
      high: 'You are tracking honestly. That is what separates winners from pretenders.',
      moderate: 'Honesty is decent. Push for complete transparency.',
      low: 'Be brutally honest or do not track at all. Half-truths do not build discipline.'
    }
  }
  
  return templates[tone][level]
}

/**
 * Get silent win messaging
 */
export function getSilentWinCopy(winType: string, tone: ToneMode = 'calm'): string {
  const baseMessages: Record<string, string> = {
    'recall-improved': 'Your recall improved this week',
    'reduced-overstudying': 'You found efficiency over volume',
    'returned-after-gap': 'You came back after a break',
    'consistency-restored': 'Your consistency is rebuilding',
    'stable-routine': 'You maintained a stable routine',
    'early-progress': 'You showed up early in your journey'
  }

  const message = baseMessages[winType] || 'Progress detected'

  const prefixes: Record<ToneMode, string> = {
    calm: 'Quiet win: ',
    direct: 'Win detected: ',
    coach: 'Small victory: '
  }

  return prefixes[tone] + message
}

/**
 * Get decision relief intro
 */
export function getDecisionReliefIntro(tone: ToneMode = 'calm'): string {
  const intros: Record<ToneMode, string> = {
    calm: 'Feeling overwhelmed? Let me choose for you today:',
    direct: 'Decision fatigue? Here is your task:',
    coach: 'Too tired to think? I will decide. You just execute:'
  }
  return intros[tone]
}

/**
 * Get exam pressure messaging
 */
export function getExamPressureCopy(
  daysRemaining: number,
  sessionsNeeded: number,
  tone: ToneMode = 'calm'
): string {
  const templates: Record<ToneMode, string> = {
    calm: `${daysRemaining} days left. You need approximately ${sessionsNeeded} solid sessions. Breathe and focus.`,
    direct: `${daysRemaining} days. ${sessionsNeeded} sessions required. No time to waste.`,
    coach: `${daysRemaining} days on the clock. ${sessionsNeeded} sessions to go. Time to execute like your life depends on it.`
  }
  return templates[tone]
}

/**
 * Get pause/exit messaging
 */
export function getPauseCopy(tone: ToneMode = 'calm'): VerdictCopy {
  const copies: Record<ToneMode, VerdictCopy> = {
    calm: {
      heading: 'Need a break?',
      subtext: 'You can pause without losing progress. Come back when ready.',
      actionPrompt: 'Pause my journey'
    },
    direct: {
      heading: 'Pause available',
      subtext: 'Your data stays. Leave when needed, return when ready.',
      actionPrompt: 'Pause now'
    },
    coach: {
      heading: 'Taking a break?',
      subtext: 'Real strength is knowing when to rest. Your progress is saved.',
      actionPrompt: 'Pause temporarily'
    }
  }
  return copies[tone]
}
