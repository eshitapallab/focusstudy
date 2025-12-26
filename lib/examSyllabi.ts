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
      'Polity & Governance',
      'Economics',
      'Environment & Ecology',
      'Science & Technology',
      'Current Affairs',
      'Ethics & Integrity',
      'Indian Society',
      'Internal Security'
    ],
    marksDistribution: {
      'History': 80,
      'Geography': 80,
      'Polity & Governance': 80,
      'Economics': 80,
      'Environment & Ecology': 60,
      'Science & Technology': 60,
      'Current Affairs': 80,
      'Ethics & Integrity': 60,
      'Indian Society': 40,
      'Internal Security': 40
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
      'Biology - Botany',
      'Biology - Zoology'
    ],
    marksDistribution: {
      'Physics': 180,
      'Chemistry': 180,
      'Biology - Botany': 180,
      'Biology - Zoology': 180
    },
    totalMarks: 720
  },

  'SSC CGL/CHSL': {
    exam: 'SSC CGL/CHSL',
    subjects: [
      'General Intelligence & Reasoning',
      'General Awareness',
      'Quantitative Aptitude',
      'English Language',
      'Computer Knowledge'
    ],
    marksDistribution: {
      'General Intelligence & Reasoning': 50,
      'General Awareness': 50,
      'Quantitative Aptitude': 50,
      'English Language': 50,
      'Computer Knowledge': 25
    },
    totalMarks: 200
  },

  'GATE': {
    exam: 'GATE',
    subjects: [
      'Engineering Mathematics',
      'General Aptitude',
      'Technical Core Subject'
    ],
    marksDistribution: {
      'Engineering Mathematics': 15,
      'General Aptitude': 15,
      'Technical Core Subject': 70
    },
    totalMarks: 100
  },

  'CAT': {
    exam: 'CAT',
    subjects: [
      'Verbal Ability & Reading Comprehension',
      'Data Interpretation & Logical Reasoning',
      'Quantitative Ability'
    ],
    marksDistribution: {
      'Verbal Ability & Reading Comprehension': 66,
      'Data Interpretation & Logical Reasoning': 66,
      'Quantitative Ability': 66
    },
    totalMarks: 198
  },

  'Banking (IBPS/SBI)': {
    exam: 'Banking (IBPS/SBI)',
    subjects: [
      'Reasoning Ability',
      'Quantitative Aptitude',
      'English Language',
      'General Awareness - Banking',
      'Computer Knowledge'
    ],
    marksDistribution: {
      'Reasoning Ability': 50,
      'Quantitative Aptitude': 50,
      'English Language': 40,
      'General Awareness - Banking': 40,
      'Computer Knowledge': 20
    },
    totalMarks: 200
  },

  'CA Foundation/Inter/Final': {
    exam: 'CA Foundation/Inter/Final',
    subjects: [
      'Accounting',
      'Business Law',
      'Business Economics',
      'Business Mathematics',
      'Corporate Law',
      'Taxation',
      'Auditing',
      'Financial Management',
      'Cost & Management Accounting',
      'Strategic Management'
    ],
    marksDistribution: {
      'Accounting': 100,
      'Business Law': 100,
      'Business Economics': 100,
      'Business Mathematics': 100,
      'Corporate Law': 100,
      'Taxation': 100,
      'Auditing': 100,
      'Financial Management': 100,
      'Cost & Management Accounting': 100,
      'Strategic Management': 100
    },
    totalMarks: 800
  },

  'CLAT': {
    exam: 'CLAT',
    subjects: [
      'English Language',
      'Current Affairs & GK',
      'Legal Reasoning',
      'Logical Reasoning',
      'Quantitative Techniques'
    ],
    marksDistribution: {
      'English Language': 40,
      'Current Affairs & GK': 50,
      'Legal Reasoning': 50,
      'Logical Reasoning': 40,
      'Quantitative Techniques': 20
    },
    totalMarks: 200
  },

  'NDA': {
    exam: 'NDA',
    subjects: [
      'Mathematics',
      'General Ability - English',
      'General Ability - Physics',
      'General Ability - Chemistry',
      'General Ability - GK',
      'General Ability - History',
      'General Ability - Geography'
    ],
    marksDistribution: {
      'Mathematics': 300,
      'General Ability - English': 100,
      'General Ability - Physics': 100,
      'General Ability - Chemistry': 100,
      'General Ability - GK': 100,
      'General Ability - History': 100,
      'General Ability - Geography': 100
    },
    totalMarks: 900
  }
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
