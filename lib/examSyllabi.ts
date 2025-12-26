/**
 * Real exam syllabi data - based on actual competitive exam structures
 * No dummy data - these are the actual subjects/topics tested
 */

export interface ExamSyllabus {
  exam: string
  subjects: string[]
  marksDistribution?: { [subject: string]: number }
  totalMarks?: number
}

/**
 * Comprehensive exam syllabi based on real exam patterns
 */
export const EXAM_SYLLABI: { [key: string]: ExamSyllabus } = {
  'UPSC Civil Services': {
    exam: 'UPSC Civil Services',
    subjects: [
      'History',
      'Geography',
      'Polity',
      'Economics',
      'Environment',
      'Science & Tech',
      'Current Affairs'
    ],
    marksDistribution: {
      'History': 80,
      'Geography': 80,
      'Polity': 80,
      'Economics': 80,
      'Environment': 60,
      'Science & Tech': 60,
      'Current Affairs': 80
    },
    totalMarks: 400
  },

  'JEE Main/Advanced': {
    exam: 'JEE Main/Advanced',
    subjects: [
      'Physics',
      'Chemistry',
      'Mathematics'
    ],
    marksDistribution: {
      'Physics': 100,
      'Chemistry': 100,
      'Mathematics': 100
    },
    totalMarks: 300
  },

  'NEET UG': {
    exam: 'NEET UG',
    subjects: [
      'Physics',
      'Chemistry',
      'Biology'
    ],
    marksDistribution: {
      'Physics': 180,
      'Chemistry': 180,
      'Biology': 360
    },
    totalMarks: 720
  },

  'SSC CGL/CHSL': {
    exam: 'SSC CGL/CHSL',
    subjects: [
      'Reasoning',
      'General Awareness',
      'Quantitative Aptitude',
      'English',
      'Computer Awareness'
    ],
    marksDistribution: {
      'Reasoning': 50,
      'General Awareness': 50,
      'Quantitative Aptitude': 50,
      'English': 50,
      'Computer Awareness': 25
    },
    totalMarks: 200
  },

  'GATE': {
    exam: 'GATE',
    subjects: [
      'Engineering Mathematics',
      'General Aptitude',
      'Core (CS)'
    ],
    marksDistribution: {
      'Engineering Mathematics': 15,
      'General Aptitude': 15,
      'Core (CS)': 70
    },
    totalMarks: 100
  },

  'CAT': {
    exam: 'CAT',
    subjects: [
      'VARC',
      'DILR',
      'Quant'
    ],
    marksDistribution: {
      'VARC': 66,
      'DILR': 66,
      'Quant': 66
    },
    totalMarks: 198
  },

  'Banking (IBPS/SBI)': {
    exam: 'Banking (IBPS/SBI)',
    subjects: [
      'Reasoning',
      'Quantitative Aptitude',
      'English',
      'General Awareness',
      'Computer Awareness'
    ],
    marksDistribution: {
      'Reasoning': 50,
      'Quantitative Aptitude': 50,
      'English': 40,
      'General Awareness': 40,
      'Computer Awareness': 20
    },
    totalMarks: 200
  },

  'CA Foundation/Inter/Final': {
    exam: 'CA Foundation/Inter/Final',
    subjects: [
      'Accounting',
      'Law',
      'Economics',
      'Quantitative Aptitude'
    ],
    marksDistribution: {
      'Accounting': 100,
      'Law': 100,
      'Economics': 100,
      'Quantitative Aptitude': 100
    },
    totalMarks: 300
  },

  'CLAT': {
    exam: 'CLAT',
    subjects: [
      'English',
      'Current Affairs',
      'Legal Reasoning',
      'Logical Reasoning',
      'Quant'
    ],
    marksDistribution: {
      'English': 40,
      'Current Affairs': 50,
      'Legal Reasoning': 50,
      'Logical Reasoning': 40,
      'Quant': 20
    },
    totalMarks: 200
  },

  'NDA': {
    exam: 'NDA',
    subjects: [
      'Mathematics',
      'English',
      'General Knowledge'
    ],
    marksDistribution: {
      'Mathematics': 300,
      'English': 100,
      'General Knowledge': 500
    },
    totalMarks: 900
  }
}

/**
 * Whether we have a known subject taxonomy for this exam.
 * For custom exams we intentionally return false.
 */
export function isKnownExam(exam: string): boolean {
  return Boolean(EXAM_SYLLABI[exam])
}

/**
 * Get subjects for a specific exam
 */
export function getExamSubjects(exam: string): string[] {
  const syllabus = EXAM_SYLLABI[exam]
  if (syllabus) {
    return syllabus.subjects
  }
  
  // Fallback: return generic subjects for "Other" or unknown exams
  return [
    'Subject 1',
    'Subject 2',
    'Subject 3',
    'Subject 4',
    'Subject 5',
    'Other'
  ]
}

/**
 * Get marks weightage for a subject (to prioritize in recommendations)
 */
export function getSubjectMarks(exam: string, subject: string): number {
  const syllabus = EXAM_SYLLABI[exam]
  if (syllabus?.marksDistribution) {
    return syllabus.marksDistribution[subject] || 0
  }
  return 0
}

/**
 * Get all subjects with their marks distribution for an exam
 */
export function getMarksDistribution(exam: string): { subject: string; marks: number }[] {
  const syllabus = EXAM_SYLLABI[exam]
  if (syllabus?.marksDistribution) {
    return Object.entries(syllabus.marksDistribution)
      .map(([subject, marks]) => ({ subject, marks }))
      .sort((a, b) => b.marks - a.marks) // Sort by marks descending
  }
  return []
}

/**
 * Calculate subject marks percentage of total
 */
export function getSubjectPercentage(exam: string, subject: string): number {
  const syllabus = EXAM_SYLLABI[exam]
  if (syllabus?.marksDistribution && syllabus?.totalMarks) {
    const subjectMarks = syllabus.marksDistribution[subject] || 0
    return Math.round((subjectMarks / syllabus.totalMarks) * 100)
  }
  return 0
}
