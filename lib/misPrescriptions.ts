import type { MarkLeakEstimate } from './types'

export function getMISPrescription(leak: MarkLeakEstimate): {
  title: string
  steps: string[]
  suggestedMinutes: number
  microActionTask: string
  relatedSubject: string
} {
  const relatedSubject = leak.subject

  const basePrefix = `${leak.subject}: ${leak.topic}`

  switch (leak.mistakeType) {
    case 'misread': {
      return {
        title: 'Slow-reading + constraint extraction drill',
        suggestedMinutes: 20,
        steps: [
          'Do 6 questions untimed for 2 minutes each: rewrite the question in your own words.',
          'Underline constraints (units, sign, “except”, “not”).',
          'Answer only after you can state what is being asked in 1 sentence.',
          'End: write 1 rule you’ll use next time (e.g., “read last line first”).'
        ],
        microActionTask: `${basePrefix} — misread-proof drill (6 Q)`,
        relatedSubject
      }
    }
    case 'calculation': {
      return {
        title: 'Calculation-error elimination drill',
        suggestedMinutes: 20,
        steps: [
          'Pick 8 medium questions from this topic.',
          'Do them with a strict “write every intermediate step” rule.',
          'After each question: quick check (sign, units, boundary cases).',
          'List your top 2 recurring slip types (e.g., carry, fraction, negative).'
        ],
        microActionTask: `${basePrefix} — calculation accuracy drill (8 Q)`,
        relatedSubject
      }
    }
    case 'time-pressure': {
      return {
        title: 'Time-pressure training: pacing + early exits',
        suggestedMinutes: 20,
        steps: [
          'Set a 12-minute timer for 6 questions.',
          'If stuck >45 seconds: mark and skip immediately.',
          'Second pass (8 minutes): return only to the 2 easiest marked questions.',
          'Write 1 “skip trigger” for this topic.'
        ],
        microActionTask: `${basePrefix} — pacing drill (6 Q / 20 min)`,
        relatedSubject
      }
    }
    case 'strategy': {
      return {
        title: 'Strategy correction: approach selection',
        suggestedMinutes: 20,
        steps: [
          'Pick 5 representative questions from this topic.',
          'Before solving each: write the approach (formula / method / shortcut) in 10 seconds.',
          'Solve. If wrong: write the correct approach in one line.',
          'Create a 5-line “approach checklist” for this topic.'
        ],
        microActionTask: `${basePrefix} — approach drill (5 Q)`,
        relatedSubject
      }
    }
    case 'memory': {
      return {
        title: 'Memory gap patch: recall-first revision',
        suggestedMinutes: 20,
        steps: [
          'Close notes. Write the key formulas/facts from memory for 5 minutes.',
          'Open notes and correct in a different color.',
          'Do 6 quick application questions to lock it in.',
          'Make 5 flash prompts you’ll re-test tomorrow.'
        ],
        microActionTask: `${basePrefix} — recall-first patch (facts + 6 Q)`,
        relatedSubject
      }
    }
    case 'concept': {
      return {
        title: 'Concept repair: teach-back + 6 questions',
        suggestedMinutes: 20,
        steps: [
          'Write a 6-line explanation of the concept as if teaching.',
          'List 3 common traps/misconceptions.',
          'Do 6 questions: 3 easy, 3 medium (focus on why each option is wrong/right).'
        ],
        microActionTask: `${basePrefix} — concept repair (teach-back + 6 Q)`,
        relatedSubject
      }
    }
    default: {
      return {
        title: 'Targeted repair drill',
        suggestedMinutes: 20,
        steps: ['Pick 6 questions in this topic and do a careful error review: why wrong + what rule fixes it.'],
        microActionTask: `${basePrefix} — targeted repair (6 Q)`,
        relatedSubject
      }
    }
  }
}
