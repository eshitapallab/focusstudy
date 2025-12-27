/**
 * Real exam syllabi data - based on actual competitive exam structures
 * No dummy data - these are the actual subjects/topics tested
 * 
 * PHILOSOPHY: StudyTrack doesn't teach. It constrains decisions, flags risk,
 * nudges behavior, and protects marks. No coaching content - only contextual
 * micro-guidance tied to exam phase and mistake patterns.
 */

// Subject-level metadata for contextual guidance
export interface SubjectMeta {
  weight: 'high' | 'medium' | 'low'
  typicalMistakes: string[]      // Risk patterns that lose marks
  examTips: string[]             // Decision rules during revision
  lastPhaseAdvice: string[]      // Final 10-day constraints
}

// Exam-day decision rules (shown only when exam ≤7 days)
export interface ExamDayRule {
  trigger: string                // Situation description
  rule: string                   // What to do
  appliesTo?: string[]           // Specific subjects (optional)
}

// Exam-specific strategy configuration
export interface ExamStrategy {
  // Pacing thresholds (days remaining)
  criticalPhase: number          // When to enter "protect marks" mode
  consolidationPhase: number     // When to stop new topics
  expansionCutoff: number        // Last day to learn new material
  
  // Time allocation per session (minutes)
  idealSessionLength: number
  minEffectiveSession: number
  
  // Recall-based adjustments
  strongRecallAction: 'increase-pace' | 'expand-coverage' | 'attempt-harder' | 'maintain'
  weakRecallAction: 'consolidate' | 'reduce-scope' | 'focus-basics' | 'repeat-revision'
  
  // Risk tolerance
  negativeMarking: boolean
  skipThreshold: number          // Confidence % below which to skip
  
  // Subject rotation strategy
  rotationStyle: 'daily' | 'session' | 'weekly' | 'block'
  
  // Exam nature
  examNature: 'objective' | 'subjective' | 'mixed'
  timePerQuestion: number        // Average seconds per question
}

// Performance-based guidance triggers
export interface PerformanceTrigger {
  condition: 'strong-recall' | 'weak-recall' | 'below-target' | 'above-target' | 'stagnant'
  daysRange: [number, number]    // [min, max] days to exam
  guidance: string
  action: string
}

export interface ExamSyllabus {
  exam: string
  subjects: string[]
  marksDistribution?: { [subject: string]: number }
  totalMarks?: number
  subjectMeta?: { [subject: string]: SubjectMeta }
  examDayRules?: ExamDayRule[]
  lastPhaseGuidance?: string[]   // General final-phase rules
  strategy?: ExamStrategy        // Exam-specific strategy config
  performanceTriggers?: PerformanceTrigger[]  // Condition-based guidance
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
    totalMarks: 400,
    subjectMeta: {
      'History': {
        weight: 'high',
        typicalMistakes: [
          'Confusing similar-sounding dynasties/events',
          'Mixing up chronological order',
          'Overlooking cause-effect links'
        ],
        examTips: [
          'Focus on frequently asked themes, not obscure facts',
          'Link events to their consequences',
          'Verify timeline before marking'
        ],
        lastPhaseAdvice: [
          'Revise only high-frequency topics',
          'Avoid starting new chapters now',
          'Focus on post-independence themes'
        ]
      },
      'Geography': {
        weight: 'high',
        typicalMistakes: [
          'Confusing similar geographical features',
          'Wrong climate-region associations',
          'Map-based location errors'
        ],
        examTips: [
          'Visualize map locations before answering',
          'Link physical features to human geography',
          'Check direction references carefully'
        ],
        lastPhaseAdvice: [
          'Revise India maps daily',
          'Focus on current events + geography links',
          'Skip obscure world geography'
        ]
      },
      'Polity': {
        weight: 'high',
        typicalMistakes: [
          'Confusing similar constitutional provisions',
          'Wrong article numbers',
          'Mixing state vs central powers'
        ],
        examTips: [
          'Focus on logic of provisions, not just memorization',
          'Link amendments to their context',
          'Verify jurisdiction before answering'
        ],
        lastPhaseAdvice: [
          'Revise fundamental rights & DPSP',
          'Focus on recent judgments in news',
          'Skip obscure constitutional bodies'
        ]
      },
      'Economics': {
        weight: 'high',
        typicalMistakes: [
          'Confusing similar economic terms',
          'Wrong organization-function mapping',
          'Outdated data references'
        ],
        examTips: [
          'Link concepts to current economic events',
          'Focus on Budget and Economic Survey themes',
          'Verify institutional details'
        ],
        lastPhaseAdvice: [
          'Revise latest Budget highlights',
          'Focus on government schemes',
          'Skip detailed mathematical economics'
        ]
      },
      'Environment': {
        weight: 'medium',
        typicalMistakes: [
          'Confusing similar species/ecosystems',
          'Wrong protected area categorization',
          'Mixing up international conventions'
        ],
        examTips: [
          'Focus on India-specific biodiversity',
          'Link environment to current affairs',
          'Verify convention details'
        ],
        lastPhaseAdvice: [
          'Revise national parks in news',
          'Focus on climate-related current affairs',
          'Skip obscure species details'
        ]
      },
      'Science & Tech': {
        weight: 'medium',
        typicalMistakes: [
          'Confusing similar technologies',
          'Wrong organization-mission mapping',
          'Outdated tech developments'
        ],
        examTips: [
          'Focus on Indian space and defense programs',
          'Link tech to government initiatives',
          'Verify recent achievements'
        ],
        lastPhaseAdvice: [
          'Revise ISRO/DRDO recent missions',
          'Focus on tech in news',
          'Skip deep technical details'
        ]
      },
      'Current Affairs': {
        weight: 'high',
        typicalMistakes: [
          'Mixing up similar events/dates',
          'Wrong person-position associations',
          'Outdated information'
        ],
        examTips: [
          'Focus on last 12 months only',
          'Link current events to static syllabus',
          'Verify recent updates'
        ],
        lastPhaseAdvice: [
          'Revise last 6 months intensively',
          'Focus on government schemes and awards',
          'Skip minor international news'
        ]
      }
    },
    examDayRules: [
      { trigger: 'Unsure between two similar options', rule: 'Eliminate based on logic, not memory' },
      { trigger: 'Question on obscure topic', rule: 'Skip if negative marking applies' },
      { trigger: 'Feeling time pressure', rule: 'Attempt factual questions first, skip analytical ones' }
    ],
    lastPhaseGuidance: [
      'Do not start new topics now',
      'Revise only what you have already covered',
      'Focus on consolidation, not expansion'
    ],
    strategy: {
      criticalPhase: 7,
      consolidationPhase: 15,
      expansionCutoff: 30,
      idealSessionLength: 45,
      minEffectiveSession: 25,
      strongRecallAction: 'expand-coverage',
      weakRecallAction: 'consolidate',
      negativeMarking: true,
      skipThreshold: 60,
      rotationStyle: 'daily',
      examNature: 'objective',
      timePerQuestion: 72  // 2 hours for 100 questions
    },
    performanceTriggers: [
      { condition: 'strong-recall', daysRange: [30, 90], guidance: 'Strong retention — expand to adjacent topics', action: 'expand-coverage' },
      { condition: 'strong-recall', daysRange: [15, 30], guidance: 'Strong recall — maintain pace, add current affairs depth', action: 'maintain' },
      { condition: 'strong-recall', daysRange: [0, 15], guidance: 'Strong recall — protect what you know, no new topics', action: 'consolidate' },
      { condition: 'weak-recall', daysRange: [30, 90], guidance: 'Weak retention — reduce scope, deepen fewer topics', action: 'reduce-scope' },
      { condition: 'weak-recall', daysRange: [15, 30], guidance: 'Weak recall — focus on high-weight subjects only', action: 'focus-basics' },
      { condition: 'weak-recall', daysRange: [0, 15], guidance: 'Weak recall — revise only what you\'ve covered well', action: 'repeat-revision' },
      { condition: 'below-target', daysRange: [30, 90], guidance: 'Below target — increase daily hours if possible', action: 'increase-pace' },
      { condition: 'below-target', daysRange: [0, 30], guidance: 'Below target — prioritize high-weight subjects ruthlessly', action: 'focus-basics' },
      { condition: 'stagnant', daysRange: [0, 90], guidance: 'Progress stagnant — change revision method, not content', action: 'maintain' }
    ]
  },

  'JEE Main/Advanced': {
    exam: 'JEE Main/Advanced',
    subjects: ['Physics', 'Chemistry', 'Mathematics'],
    marksDistribution: { 'Physics': 100, 'Chemistry': 100, 'Mathematics': 100 },
    totalMarks: 300,
    subjectMeta: {
      'Physics': {
        weight: 'high',
        typicalMistakes: [
          'Sign errors in vector problems',
          'Wrong unit conversions',
          'Skipping free body diagrams'
        ],
        examTips: [
          'Draw diagrams before calculating',
          'Check units at every step',
          'Verify sign conventions'
        ],
        lastPhaseAdvice: [
          'Focus on Mechanics and Electromagnetism',
          'Revise formulas, not derivations',
          'Practice numerical accuracy'
        ]
      },
      'Chemistry': {
        weight: 'high',
        typicalMistakes: [
          'Organic reaction mechanism errors',
          'Wrong balancing in equations',
          'Periodic table trend confusion'
        ],
        examTips: [
          'Verify oxidation states before balancing',
          'Focus on reaction conditions',
          'Check stereochemistry in organic'
        ],
        lastPhaseAdvice: [
          'Revise Inorganic facts daily',
          'Focus on named reactions in Organic',
          'Skip obscure Physical Chemistry derivations'
        ]
      },
      'Mathematics': {
        weight: 'high',
        typicalMistakes: [
          'Calculation errors in algebra',
          'Domain/range mistakes in functions',
          'Integration limits errors'
        ],
        examTips: [
          'Verify boundary conditions',
          'Check for extraneous solutions',
          'Recheck calculations in complex problems'
        ],
        lastPhaseAdvice: [
          'Focus on Calculus and Coordinate Geometry',
          'Revise standard forms and identities',
          'Avoid new problem types'
        ]
      }
    },
    examDayRules: [
      { trigger: 'Stuck on calculation for >2 minutes', rule: 'Mark and return later' },
      { trigger: 'Numerical answer not matching options', rule: 'Recheck units and sign' },
      { trigger: 'Time running low', rule: 'Attempt Chemistry theory questions first' }
    ],
    lastPhaseGuidance: [
      'Accuracy matters more than attempting all',
      'Do not try new problem-solving techniques',
      'Protect your strong topics first'
    ],
    strategy: {
      criticalPhase: 5,
      consolidationPhase: 10,
      expansionCutoff: 20,
      idealSessionLength: 60,
      minEffectiveSession: 30,
      strongRecallAction: 'attempt-harder',
      weakRecallAction: 'focus-basics',
      negativeMarking: true,
      skipThreshold: 70,
      rotationStyle: 'session',
      examNature: 'objective',
      timePerQuestion: 180  // 3 hours for 90 questions (Main)
    },
    performanceTriggers: [
      { condition: 'strong-recall', daysRange: [20, 90], guidance: 'Strong recall — attempt harder problem sets', action: 'attempt-harder' },
      { condition: 'strong-recall', daysRange: [10, 20], guidance: 'Strong recall — focus on accuracy, not speed', action: 'maintain' },
      { condition: 'strong-recall', daysRange: [0, 10], guidance: 'Strong recall — revise formulas only, no new problems', action: 'consolidate' },
      { condition: 'weak-recall', daysRange: [20, 90], guidance: 'Weak recall — master basics before harder problems', action: 'focus-basics' },
      { condition: 'weak-recall', daysRange: [10, 20], guidance: 'Weak recall — focus on your strongest 2 subjects', action: 'reduce-scope' },
      { condition: 'weak-recall', daysRange: [0, 10], guidance: 'Weak recall — protect strong chapters, skip weak ones', action: 'repeat-revision' },
      { condition: 'below-target', daysRange: [20, 90], guidance: 'Below target — increase problem-solving hours', action: 'increase-pace' },
      { condition: 'below-target', daysRange: [0, 20], guidance: 'Below target — focus on high-yield chapters only', action: 'focus-basics' },
      { condition: 'stagnant', daysRange: [0, 90], guidance: 'Progress stagnant — try timed mock tests', action: 'attempt-harder' }
    ]
  },

  'NEET UG': {
    exam: 'NEET UG',
    subjects: ['Physics', 'Chemistry', 'Biology'],
    marksDistribution: { 'Physics': 180, 'Chemistry': 180, 'Biology': 360 },
    totalMarks: 720,
    subjectMeta: {
      'Physics': {
        weight: 'medium',
        typicalMistakes: [
          'Unit conversion errors',
          'Sign mistakes in optics',
          'Wrong formula application'
        ],
        examTips: [
          'Start with familiar question types',
          'Verify units before final answer',
          'Skip lengthy calculations initially'
        ],
        lastPhaseAdvice: [
          'Focus on NCERT-based concepts only',
          'Revise formulas daily',
          'Skip advanced problem types'
        ]
      },
      'Chemistry': {
        weight: 'medium',
        typicalMistakes: [
          'Organic mechanism errors',
          'Wrong IUPAC naming',
          'Inorganic exception confusion'
        ],
        examTips: [
          'Focus on NCERT examples',
          'Verify reaction conditions',
          'Check for exceptions in Inorganic'
        ],
        lastPhaseAdvice: [
          'Revise NCERT Inorganic thoroughly',
          'Focus on named reactions',
          'Skip advanced Physical Chemistry'
        ]
      },
      'Biology': {
        weight: 'high',
        typicalMistakes: [
          'Confusing similar biological terms',
          'Wrong diagram labels',
          'Mixing up processes'
        ],
        examTips: [
          'Read questions carefully - exact NCERT wording',
          'Focus on diagrams and flowcharts',
          'Verify specific terms before marking'
        ],
        lastPhaseAdvice: [
          'Revise NCERT line by line',
          'Focus on diagrams and tables',
          'Human Physiology and Genetics are high-yield'
        ]
      }
    },
    examDayRules: [
      { trigger: 'Question wording unfamiliar', rule: 'Match with NCERT terminology' },
      { trigger: 'Two options seem correct', rule: 'Choose the more specific NCERT answer' },
      { trigger: 'Time pressure', rule: 'Complete Biology first - highest marks' }
    ],
    lastPhaseGuidance: [
      'NCERT is the only source now',
      'Do not attempt questions from coaching material',
      'Biology accuracy protects your score'
    ],
    strategy: {
      criticalPhase: 7,
      consolidationPhase: 15,
      expansionCutoff: 30,
      idealSessionLength: 45,
      minEffectiveSession: 20,
      strongRecallAction: 'expand-coverage',
      weakRecallAction: 'repeat-revision',
      negativeMarking: true,
      skipThreshold: 65,
      rotationStyle: 'daily',
      examNature: 'objective',
      timePerQuestion: 96  // 200 min for 200 questions
    },
    performanceTriggers: [
      { condition: 'strong-recall', daysRange: [30, 90], guidance: 'Strong NCERT recall — add assertion-reason practice', action: 'expand-coverage' },
      { condition: 'strong-recall', daysRange: [15, 30], guidance: 'Strong recall — focus on Biology diagrams and tables', action: 'maintain' },
      { condition: 'strong-recall', daysRange: [0, 15], guidance: 'Strong recall — NCERT revision only, nothing new', action: 'consolidate' },
      { condition: 'weak-recall', daysRange: [30, 90], guidance: 'Weak recall — re-read NCERT chapters slowly', action: 'repeat-revision' },
      { condition: 'weak-recall', daysRange: [15, 30], guidance: 'Weak recall — focus on Biology only (50% marks)', action: 'focus-basics' },
      { condition: 'weak-recall', daysRange: [0, 15], guidance: 'Weak recall — protect Biology score, it carries you', action: 'reduce-scope' },
      { condition: 'below-target', daysRange: [30, 90], guidance: 'Below target — Biology needs more NCERT time', action: 'increase-pace' },
      { condition: 'below-target', daysRange: [0, 30], guidance: 'Below target — maximize Biology accuracy first', action: 'focus-basics' },
      { condition: 'stagnant', daysRange: [0, 90], guidance: 'Progress stagnant — try previous year NEET papers', action: 'attempt-harder' }
    ]
  },

  'SSC CGL/CHSL': {
    exam: 'SSC CGL/CHSL',
    subjects: ['Reasoning', 'General Awareness', 'Quantitative Aptitude', 'English', 'Computer Awareness'],
    marksDistribution: { 'Reasoning': 50, 'General Awareness': 50, 'Quantitative Aptitude': 50, 'English': 50, 'Computer Awareness': 25 },
    totalMarks: 200,
    subjectMeta: {
      'Reasoning': {
        weight: 'high',
        typicalMistakes: [
          'Direction sense errors',
          'Blood relation confusion',
          'Coding pattern misread'
        ],
        examTips: [
          'Draw diagrams for blood relations',
          'Use elimination in coding',
          'Verify direction at each step'
        ],
        lastPhaseAdvice: [
          'Practice only familiar patterns',
          'Focus on speed, not new types',
          'Skip unfamiliar puzzle formats'
        ]
      },
      'General Awareness': {
        weight: 'high',
        typicalMistakes: [
          'Confusing similar facts',
          'Outdated information',
          'Wrong association errors'
        ],
        examTips: [
          'Focus on static GK first',
          'Link facts to categories',
          'Skip if completely unsure'
        ],
        lastPhaseAdvice: [
          'Revise current affairs last 6 months',
          'Focus on government schemes',
          'Skip obscure historical dates'
        ]
      },
      'Quantitative Aptitude': {
        weight: 'high',
        typicalMistakes: [
          'Calculation errors under time pressure',
          'Wrong base in percentage problems',
          'Skipping unit conversion checks'
        ],
        examTips: [
          'Skip lengthy arithmetic in first pass',
          'Mark approximation-friendly questions',
          'Verify last step in multi-step problems'
        ],
        lastPhaseAdvice: [
          'Focus on accuracy over speed',
          'Revise formulas daily in short bursts',
          'Avoid learning new shortcut methods'
        ]
      },
      'English': {
        weight: 'high',
        typicalMistakes: [
          'Idiom meaning confusion',
          'Subject-verb agreement errors',
          'Wrong preposition usage'
        ],
        examTips: [
          'Read the sentence aloud mentally',
          'Check for common error patterns',
          'Focus on context for vocabulary'
        ],
        lastPhaseAdvice: [
          'Revise common idioms and phrases',
          'Focus on error spotting patterns',
          'Skip advanced vocabulary'
        ]
      },
      'Computer Awareness': {
        weight: 'low',
        typicalMistakes: [
          'Confusing similar shortcuts',
          'Wrong terminology',
          'Outdated software information'
        ],
        examTips: [
          'Focus on basic concepts',
          'MS Office shortcuts are high-yield',
          'Skip advanced networking'
        ],
        lastPhaseAdvice: [
          'Revise basic shortcuts only',
          'Focus on frequently asked terms',
          'Skip advanced topics'
        ]
      }
    },
    examDayRules: [
      { trigger: 'Stuck on a question for >60 seconds', rule: 'Mark and move on — return only if time permits' },
      { trigger: 'Calculation-heavy question', rule: 'Check if approximation can eliminate options' },
      { trigger: 'Confident but time is low', rule: 'Attempt only direct-answer questions' },
      { trigger: 'GK question completely unknown', rule: 'Skip — negative marking will hurt' }
    ],
    lastPhaseGuidance: [
      'Speed matters but accuracy matters more',
      'Do not attempt unfamiliar question types',
      'Protect your strong sections first'
    ],
    strategy: {
      criticalPhase: 3,
      consolidationPhase: 7,
      expansionCutoff: 15,
      idealSessionLength: 30,
      minEffectiveSession: 15,
      strongRecallAction: 'increase-pace',
      weakRecallAction: 'focus-basics',
      negativeMarking: true,
      skipThreshold: 50,
      rotationStyle: 'session',
      examNature: 'objective',
      timePerQuestion: 36  // 60 min for 100 questions
    },
    performanceTriggers: [
      { condition: 'strong-recall', daysRange: [15, 90], guidance: 'Strong recall — increase daily mock tests', action: 'increase-pace' },
      { condition: 'strong-recall', daysRange: [7, 15], guidance: 'Strong recall — focus on speed now', action: 'attempt-harder' },
      { condition: 'strong-recall', daysRange: [0, 7], guidance: 'Strong recall — maintain rhythm, no new patterns', action: 'maintain' },
      { condition: 'weak-recall', daysRange: [15, 90], guidance: 'Weak recall — master one section at a time', action: 'focus-basics' },
      { condition: 'weak-recall', daysRange: [7, 15], guidance: 'Weak recall — focus on Quant + Reasoning only', action: 'reduce-scope' },
      { condition: 'weak-recall', daysRange: [0, 7], guidance: 'Weak recall — revise only what you know well', action: 'repeat-revision' },
      { condition: 'below-target', daysRange: [15, 90], guidance: 'Below target — add 30 min daily to weak section', action: 'increase-pace' },
      { condition: 'below-target', daysRange: [0, 15], guidance: 'Below target — maximize accuracy in strong sections', action: 'focus-basics' },
      { condition: 'stagnant', daysRange: [0, 90], guidance: 'Progress stagnant — take a full mock test', action: 'attempt-harder' }
    ]
  },

  'GATE': {
    exam: 'GATE',
    subjects: ['Engineering Mathematics', 'General Aptitude', 'Core (CS)'],
    marksDistribution: { 'Engineering Mathematics': 15, 'General Aptitude': 15, 'Core (CS)': 70 },
    totalMarks: 100,
    subjectMeta: {
      'Engineering Mathematics': {
        weight: 'medium',
        typicalMistakes: [
          'Matrix operation errors',
          'Probability distribution confusion',
          'Calculus boundary mistakes'
        ],
        examTips: [
          'Verify matrix dimensions',
          'Check probability sums to 1',
          'Recheck integration limits'
        ],
        lastPhaseAdvice: [
          'Focus on Linear Algebra and Probability',
          'Revise standard formulas',
          'Skip advanced calculus topics'
        ]
      },
      'General Aptitude': {
        weight: 'medium',
        typicalMistakes: [
          'Verbal reasoning misinterpretation',
          'Percentage calculation errors',
          'Data interpretation mistakes'
        ],
        examTips: [
          'Read questions twice',
          'Verify percentage base',
          'Check graph scales carefully'
        ],
        lastPhaseAdvice: [
          'Focus on easy 2-mark questions',
          'Practice verbal interpretation',
          'These are scoring - do not neglect'
        ]
      },
      'Core (CS)': {
        weight: 'high',
        typicalMistakes: [
          'Algorithm complexity miscalculation',
          'Database normalization errors',
          'OS concept confusion'
        ],
        examTips: [
          'Verify base cases in recursion',
          'Check for edge cases in algorithms',
          'Focus on standard problems first'
        ],
        lastPhaseAdvice: [
          'DSA and DBMS are highest yield',
          'Revise previous year patterns',
          'Skip theoretical proofs'
        ]
      }
    },
    examDayRules: [
      { trigger: 'NAT question with complex calculation', rule: 'Double-check before submitting' },
      { trigger: 'MCQ with close options', rule: 'Use elimination, verify with calculation' },
      { trigger: 'Running behind schedule', rule: 'Attempt 1-mark questions first' }
    ],
    lastPhaseGuidance: [
      'Previous year questions are your best prep',
      'Focus on understanding, not memorization',
      'Manage time across sections'
    ],
    strategy: {
      criticalPhase: 7,
      consolidationPhase: 14,
      expansionCutoff: 30,
      idealSessionLength: 60,
      minEffectiveSession: 30,
      strongRecallAction: 'attempt-harder',
      weakRecallAction: 'focus-basics',
      negativeMarking: true,
      skipThreshold: 60,
      rotationStyle: 'block',
      examNature: 'objective',
      timePerQuestion: 108  // 3 hours for 65 questions
    },
    performanceTriggers: [
      { condition: 'strong-recall', daysRange: [30, 90], guidance: 'Strong recall — attempt previous year GATE papers', action: 'attempt-harder' },
      { condition: 'strong-recall', daysRange: [14, 30], guidance: 'Strong recall — focus on Core CS (70% weightage)', action: 'expand-coverage' },
      { condition: 'strong-recall', daysRange: [0, 14], guidance: 'Strong recall — revise DSA and DBMS only', action: 'consolidate' },
      { condition: 'weak-recall', daysRange: [30, 90], guidance: 'Weak recall — master fundamentals before PYQs', action: 'focus-basics' },
      { condition: 'weak-recall', daysRange: [14, 30], guidance: 'Weak recall — focus on high-frequency topics', action: 'reduce-scope' },
      { condition: 'weak-recall', daysRange: [0, 14], guidance: 'Weak recall — protect GA + Math (30 easy marks)', action: 'repeat-revision' },
      { condition: 'below-target', daysRange: [30, 90], guidance: 'Below target — increase Core CS practice', action: 'increase-pace' },
      { condition: 'below-target', daysRange: [0, 30], guidance: 'Below target — focus on NAT questions (no negative)', action: 'focus-basics' },
      { condition: 'stagnant', daysRange: [0, 90], guidance: 'Progress stagnant — analyze weak areas in mock tests', action: 'attempt-harder' }
    ]
  },

  'CAT': {
    exam: 'CAT',
    subjects: ['VARC', 'DILR', 'Quant'],
    marksDistribution: { 'VARC': 66, 'DILR': 66, 'Quant': 66 },
    totalMarks: 198,
    subjectMeta: {
      'VARC': {
        weight: 'high',
        typicalMistakes: [
          'Over-inference in RC',
          'Missing tone/purpose',
          'Para-jumble logic errors'
        ],
        examTips: [
          'Stick to passage evidence only',
          'Identify author tone first',
          'Find mandatory opening/closing sentences'
        ],
        lastPhaseAdvice: [
          'Focus on reading speed',
          'Practice only standard RC types',
          'Skip obscure verbal formats'
        ]
      },
      'DILR': {
        weight: 'high',
        typicalMistakes: [
          'Missing constraints in sets',
          'Assumption errors',
          'Time sink on complex sets'
        ],
        examTips: [
          'Read all questions before solving',
          'Abandon set if stuck for >10 min',
          'Verify constraints at each step'
        ],
        lastPhaseAdvice: [
          'Practice set selection',
          'Focus on doable sets, not all sets',
          'Time management is everything'
        ]
      },
      'Quant': {
        weight: 'high',
        typicalMistakes: [
          'Calculation errors in Arithmetic',
          'Wrong formula in Geometry',
          'Algebra sign errors'
        ],
        examTips: [
          'Identify question type before solving',
          'Use options to backsolve',
          'Skip lengthy calculations'
        ],
        lastPhaseAdvice: [
          'Focus on Arithmetic - highest frequency',
          'Revise formulas daily',
          'Skip advanced Number Theory'
        ]
      }
    },
    examDayRules: [
      { trigger: 'RC passage seems difficult', rule: 'Skip to next, return if time permits' },
      { trigger: 'DILR set taking >12 minutes', rule: 'Move on - better to attempt more sets' },
      { trigger: 'Quant question needs >2 min calculation', rule: 'Mark and move - return later' }
    ],
    lastPhaseGuidance: [
      'Selection of questions is more important than solving',
      'Do not attempt all questions',
      'Maximize accuracy in attempted questions'
    ],
    strategy: {
      criticalPhase: 5,
      consolidationPhase: 10,
      expansionCutoff: 20,
      idealSessionLength: 40,
      minEffectiveSession: 20,
      strongRecallAction: 'attempt-harder',
      weakRecallAction: 'reduce-scope',
      negativeMarking: true,
      skipThreshold: 75,
      rotationStyle: 'session',
      examNature: 'objective',
      timePerQuestion: 120  // 2 hours for 66 questions per section
    },
    performanceTriggers: [
      { condition: 'strong-recall', daysRange: [20, 90], guidance: 'Strong recall — focus on DILR set selection', action: 'attempt-harder' },
      { condition: 'strong-recall', daysRange: [10, 20], guidance: 'Strong recall — practice under time pressure', action: 'maintain' },
      { condition: 'strong-recall', daysRange: [0, 10], guidance: 'Strong recall — only mock tests now', action: 'consolidate' },
      { condition: 'weak-recall', daysRange: [20, 90], guidance: 'Weak recall — master one section deeply', action: 'focus-basics' },
      { condition: 'weak-recall', daysRange: [10, 20], guidance: 'Weak recall — focus on Quant (most predictable)', action: 'reduce-scope' },
      { condition: 'weak-recall', daysRange: [0, 10], guidance: 'Weak recall — attempt fewer questions with high accuracy', action: 'repeat-revision' },
      { condition: 'below-target', daysRange: [20, 90], guidance: 'Below target — selection strategy > solving skill', action: 'attempt-harder' },
      { condition: 'below-target', daysRange: [0, 20], guidance: 'Below target — focus on doable questions only', action: 'reduce-scope' },
      { condition: 'stagnant', daysRange: [0, 90], guidance: 'Progress stagnant — analyze mock test selection patterns', action: 'attempt-harder' }
    ]
  },

  'Banking (IBPS/SBI)': {
    exam: 'Banking (IBPS/SBI)',
    subjects: ['Reasoning', 'Quantitative Aptitude', 'English', 'General Awareness', 'Computer Awareness'],
    marksDistribution: { 'Reasoning': 50, 'Quantitative Aptitude': 50, 'English': 40, 'General Awareness': 40, 'Computer Awareness': 20 },
    totalMarks: 200,
    subjectMeta: {
      'Reasoning': {
        weight: 'high',
        typicalMistakes: [
          'Seating arrangement errors',
          'Syllogism conclusion mistakes',
          'Puzzle constraint misses'
        ],
        examTips: [
          'Draw diagrams for seating',
          'Check all syllogism possibilities',
          'Verify puzzle constraints step by step'
        ],
        lastPhaseAdvice: [
          'Focus on puzzle patterns from recent exams',
          'Practice seating daily',
          'Skip new puzzle formats'
        ]
      },
      'Quantitative Aptitude': {
        weight: 'high',
        typicalMistakes: [
          'DI calculation errors',
          'Percentage base confusion',
          'Wrong simplification'
        ],
        examTips: [
          'Verify DI data before calculating',
          'Use approximation for large numbers',
          'Check simplification step by step'
        ],
        lastPhaseAdvice: [
          'Focus on DI - highest weightage',
          'Practice calculation speed',
          'Revise basic formulas'
        ]
      },
      'English': {
        weight: 'medium',
        typicalMistakes: [
          'Cloze test context misses',
          'Error detection confusion',
          'RC inference errors'
        ],
        examTips: [
          'Read full sentence for cloze',
          'Check grammar rules systematically',
          'Stick to RC passage evidence'
        ],
        lastPhaseAdvice: [
          'Practice reading speed',
          'Focus on error patterns',
          'Skip advanced vocabulary'
        ]
      },
      'General Awareness': {
        weight: 'medium',
        typicalMistakes: [
          'Banking terms confusion',
          'Outdated current affairs',
          'Wrong abbreviation expansion'
        ],
        examTips: [
          'Focus on banking terminology',
          'Recent RBI policies are important',
          'Verify before marking'
        ],
        lastPhaseAdvice: [
          'Current affairs last 3 months',
          'Banking awareness is must-do',
          'Skip ancient history'
        ]
      },
      'Computer Awareness': {
        weight: 'low',
        typicalMistakes: [
          'Shortcut key errors',
          'Terminology confusion',
          'Hardware/software mix-up'
        ],
        examTips: [
          'Focus on basic operations',
          'MS Office is high-yield',
          'Skip networking details'
        ],
        lastPhaseAdvice: [
          'Revise basic shortcuts',
          'Focus on frequently asked terms',
          'Easy scoring - do not skip'
        ]
      }
    },
    examDayRules: [
      { trigger: 'Puzzle taking too long', rule: 'Move to next - return if time permits' },
      { trigger: 'DI calculation seems off', rule: 'Recheck data reading first' },
      { trigger: 'English question unclear', rule: 'Trust grammar rules over intuition' }
    ],
    lastPhaseGuidance: [
      'Sectional cutoffs matter - balance attempts',
      'Do not neglect any section completely',
      'Accuracy over speed in reasoning'
    ],
    strategy: {
      criticalPhase: 3,
      consolidationPhase: 7,
      expansionCutoff: 15,
      idealSessionLength: 30,
      minEffectiveSession: 15,
      strongRecallAction: 'increase-pace',
      weakRecallAction: 'focus-basics',
      negativeMarking: true,
      skipThreshold: 50,
      rotationStyle: 'session',
      examNature: 'objective',
      timePerQuestion: 30  // Sectional time limits
    },
    performanceTriggers: [
      { condition: 'strong-recall', daysRange: [15, 90], guidance: 'Strong recall — add sectional mock tests', action: 'increase-pace' },
      { condition: 'strong-recall', daysRange: [7, 15], guidance: 'Strong recall — focus on puzzle speed', action: 'attempt-harder' },
      { condition: 'strong-recall', daysRange: [0, 7], guidance: 'Strong recall — maintain sectional balance', action: 'maintain' },
      { condition: 'weak-recall', daysRange: [15, 90], guidance: 'Weak recall — master sectional basics first', action: 'focus-basics' },
      { condition: 'weak-recall', daysRange: [7, 15], guidance: 'Weak recall — focus on GA (quick scoring)', action: 'reduce-scope' },
      { condition: 'weak-recall', daysRange: [0, 7], guidance: 'Weak recall — clear sectional cutoffs first', action: 'repeat-revision' },
      { condition: 'below-target', daysRange: [15, 90], guidance: 'Below target — sectional cutoffs are priority', action: 'focus-basics' },
      { condition: 'below-target', daysRange: [0, 15], guidance: 'Below target — balance attempts across sections', action: 'maintain' },
      { condition: 'stagnant', daysRange: [0, 90], guidance: 'Progress stagnant — take full-length prelims mock', action: 'attempt-harder' }
    ]
  },

  'CA Foundation/Inter/Final': {
    exam: 'CA Foundation/Inter/Final',
    subjects: ['Accounting', 'Law', 'Economics', 'Quantitative Aptitude'],
    marksDistribution: { 'Accounting': 100, 'Law': 100, 'Economics': 100, 'Quantitative Aptitude': 100 },
    totalMarks: 300,
    subjectMeta: {
      'Accounting': {
        weight: 'high',
        typicalMistakes: [
          'Journal entry errors',
          'Wrong account classification',
          'Calculation mistakes in adjustments'
        ],
        examTips: [
          'Verify debit-credit balance',
          'Check account nature before posting',
          'Review adjustments twice'
        ],
        lastPhaseAdvice: [
          'Focus on practical problems',
          'Revise standard formats',
          'Practice adjustments daily'
        ]
      },
      'Law': {
        weight: 'high',
        typicalMistakes: [
          'Section number confusion',
          'Case law misattribution',
          'Exception clause misses'
        ],
        examTips: [
          'Focus on principles, not just sections',
          'Link sections to their purpose',
          'Check for exceptions'
        ],
        lastPhaseAdvice: [
          'Revise important sections',
          'Focus on case law principles',
          'Skip obscure provisions'
        ]
      },
      'Economics': {
        weight: 'medium',
        typicalMistakes: [
          'Graph interpretation errors',
          'Theory application mistakes',
          'Numerical calculation errors'
        ],
        examTips: [
          'Draw graphs while answering',
          'Link theory to practical examples',
          'Verify numerical calculations'
        ],
        lastPhaseAdvice: [
          'Focus on diagrams and graphs',
          'Revise basic theories',
          'Skip advanced mathematical economics'
        ]
      },
      'Quantitative Aptitude': {
        weight: 'medium',
        typicalMistakes: [
          'Formula application errors',
          'Statistical calculation mistakes',
          'Probability confusion'
        ],
        examTips: [
          'Write formulas before solving',
          'Verify statistical calculations',
          'Check probability constraints'
        ],
        lastPhaseAdvice: [
          'Revise formulas daily',
          'Practice standard problems',
          'Focus on accuracy'
        ]
      }
    },
    examDayRules: [
      { trigger: 'Numerical question complex', rule: 'Attempt theory questions first' },
      { trigger: 'Section number forgotten', rule: 'Focus on principle - partial marks possible' },
      { trigger: 'Time running short', rule: 'Attempt questions you know well completely' }
    ],
    lastPhaseGuidance: [
      'Presentation matters in descriptive answers',
      'Attempt all questions - no negative marking',
      'Time management across papers is key'
    ],
    strategy: {
      criticalPhase: 10,
      consolidationPhase: 20,
      expansionCutoff: 45,
      idealSessionLength: 60,
      minEffectiveSession: 30,
      strongRecallAction: 'expand-coverage',
      weakRecallAction: 'consolidate',
      negativeMarking: false,
      skipThreshold: 0,  // No negative marking - attempt all
      rotationStyle: 'daily',
      examNature: 'mixed',
      timePerQuestion: 0  // Subjective - varies
    },
    performanceTriggers: [
      { condition: 'strong-recall', daysRange: [45, 120], guidance: 'Strong recall — attempt previous year papers', action: 'expand-coverage' },
      { condition: 'strong-recall', daysRange: [20, 45], guidance: 'Strong recall — practice presentation quality', action: 'attempt-harder' },
      { condition: 'strong-recall', daysRange: [0, 20], guidance: 'Strong recall — revise formats and standards only', action: 'consolidate' },
      { condition: 'weak-recall', daysRange: [45, 120], guidance: 'Weak recall — focus on high-weight subjects', action: 'focus-basics' },
      { condition: 'weak-recall', daysRange: [20, 45], guidance: 'Weak recall — master Accounting (highest yield)', action: 'reduce-scope' },
      { condition: 'weak-recall', daysRange: [0, 20], guidance: 'Weak recall — attempt all questions (no negative)', action: 'repeat-revision' },
      { condition: 'below-target', daysRange: [45, 120], guidance: 'Below target — increase practical problem practice', action: 'increase-pace' },
      { condition: 'below-target', daysRange: [0, 45], guidance: 'Below target — presentation can recover marks', action: 'maintain' },
      { condition: 'stagnant', daysRange: [0, 120], guidance: 'Progress stagnant — focus on answer writing practice', action: 'attempt-harder' }
    ]
  },

  'CLAT': {
    exam: 'CLAT',
    subjects: ['English', 'Current Affairs', 'Legal Reasoning', 'Logical Reasoning', 'Quant'],
    marksDistribution: { 'English': 40, 'Current Affairs': 50, 'Legal Reasoning': 50, 'Logical Reasoning': 40, 'Quant': 20 },
    totalMarks: 200,
    subjectMeta: {
      'English': {
        weight: 'medium',
        typicalMistakes: [
          'RC inference errors',
          'Vocabulary context misses',
          'Grammar rule confusion'
        ],
        examTips: [
          'Stick to passage for answers',
          'Use context for vocabulary',
          'Check grammar systematically'
        ],
        lastPhaseAdvice: [
          'Practice reading speed',
          'Focus on comprehension accuracy',
          'Skip advanced vocabulary prep'
        ]
      },
      'Current Affairs': {
        weight: 'high',
        typicalMistakes: [
          'Date/event confusion',
          'Wrong attribution',
          'Outdated information'
        ],
        examTips: [
          'Focus on legal current affairs',
          'Link events to their significance',
          'Verify before marking'
        ],
        lastPhaseAdvice: [
          'Last 6 months intensively',
          'Legal news is most important',
          'Skip minor international events'
        ]
      },
      'Legal Reasoning': {
        weight: 'high',
        typicalMistakes: [
          'Principle misapplication',
          'Fact pattern confusion',
          'Over-inference'
        ],
        examTips: [
          'Apply principle exactly as stated',
          'Do not import external legal knowledge',
          'Focus on facts given'
        ],
        lastPhaseAdvice: [
          'Practice principle application',
          'Focus on common legal principles',
          'Avoid external legal reading'
        ]
      },
      'Logical Reasoning': {
        weight: 'medium',
        typicalMistakes: [
          'Assumption errors',
          'Argument structure confusion',
          'Strengthening vs weakening'
        ],
        examTips: [
          'Identify argument structure first',
          'Check all options carefully',
          'Focus on what is asked'
        ],
        lastPhaseAdvice: [
          'Practice critical reasoning',
          'Focus on argument analysis',
          'Skip puzzle-heavy questions'
        ]
      },
      'Quant': {
        weight: 'low',
        typicalMistakes: [
          'DI reading errors',
          'Percentage base confusion',
          'Calculation mistakes'
        ],
        examTips: [
          'Verify data before calculating',
          'Use approximation',
          'Check percentage base'
        ],
        lastPhaseAdvice: [
          'Focus on DI only',
          'Skip advanced math',
          'Easy marks - do not neglect'
        ]
      }
    },
    examDayRules: [
      { trigger: 'Legal reasoning passage confusing', rule: 'Re-read principle carefully first' },
      { trigger: 'Current affairs question unknown', rule: 'Skip - negative marking applies' },
      { trigger: 'Time running low', rule: 'Attempt Quant - usually straightforward' }
    ],
    lastPhaseGuidance: [
      'Legal reasoning and current affairs are key',
      'Do not guess when unsure - negative marking',
      'Passage-based format requires reading speed'
    ],
    strategy: {
      criticalPhase: 5,
      consolidationPhase: 10,
      expansionCutoff: 20,
      idealSessionLength: 45,
      minEffectiveSession: 20,
      strongRecallAction: 'increase-pace',
      weakRecallAction: 'focus-basics',
      negativeMarking: true,
      skipThreshold: 65,
      rotationStyle: 'session',
      examNature: 'objective',
      timePerQuestion: 60  // 2 hours for 150 questions
    },
    performanceTriggers: [
      { condition: 'strong-recall', daysRange: [20, 90], guidance: 'Strong recall — practice passage-based questions', action: 'increase-pace' },
      { condition: 'strong-recall', daysRange: [10, 20], guidance: 'Strong recall — focus on Legal Reasoning (50 marks)', action: 'expand-coverage' },
      { condition: 'strong-recall', daysRange: [0, 10], guidance: 'Strong recall — reading speed drills only', action: 'maintain' },
      { condition: 'weak-recall', daysRange: [20, 90], guidance: 'Weak recall — master passage reading technique', action: 'focus-basics' },
      { condition: 'weak-recall', daysRange: [10, 20], guidance: 'Weak recall — focus on Current Affairs (50 marks)', action: 'reduce-scope' },
      { condition: 'weak-recall', daysRange: [0, 10], guidance: 'Weak recall — skip if unsure (negative marking)', action: 'repeat-revision' },
      { condition: 'below-target', daysRange: [20, 90], guidance: 'Below target — add daily passage practice', action: 'increase-pace' },
      { condition: 'below-target', daysRange: [0, 20], guidance: 'Below target — focus on high-weight Legal + CA', action: 'focus-basics' },
      { condition: 'stagnant', daysRange: [0, 90], guidance: 'Progress stagnant — practice timed passage reading', action: 'attempt-harder' }
    ]
  },

  'NDA': {
    exam: 'NDA',
    subjects: ['Mathematics', 'English', 'General Knowledge'],
    marksDistribution: { 'Mathematics': 300, 'English': 100, 'General Knowledge': 500 },
    totalMarks: 900,
    subjectMeta: {
      'Mathematics': {
        weight: 'high',
        typicalMistakes: [
          'Trigonometry formula errors',
          'Integration calculation mistakes',
          'Vector operation confusion'
        ],
        examTips: [
          'Verify formulas before applying',
          'Check calculations step by step',
          'Use diagrams for geometry'
        ],
        lastPhaseAdvice: [
          'Focus on Algebra and Trigonometry',
          'Revise formulas daily',
          'Skip advanced calculus'
        ]
      },
      'English': {
        weight: 'medium',
        typicalMistakes: [
          'Grammar rule confusion',
          'Vocabulary context errors',
          'Comprehension inference mistakes'
        ],
        examTips: [
          'Read questions carefully',
          'Use context for vocabulary',
          'Stick to passage for RC'
        ],
        lastPhaseAdvice: [
          'Focus on grammar rules',
          'Practice comprehension speed',
          'Revise common idioms'
        ]
      },
      'General Knowledge': {
        weight: 'high',
        typicalMistakes: [
          'History date confusion',
          'Geography location errors',
          'Science fact mix-ups'
        ],
        examTips: [
          'Focus on Indian geography and history',
          'Link current affairs to static GK',
          'Verify before marking'
        ],
        lastPhaseAdvice: [
          'Defense-related current affairs',
          'Indian geography is high-yield',
          'Skip obscure world events'
        ]
      }
    },
    examDayRules: [
      { trigger: 'Math problem seems lengthy', rule: 'Check if shortcut formula exists' },
      { trigger: 'GK question completely unknown', rule: 'Skip - do not guess' },
      { trigger: 'English grammar confusing', rule: 'Apply basic rules, not exceptions' }
    ],
    lastPhaseGuidance: [
      'Mathematics requires consistent practice',
      'GK is vast - focus on high-frequency topics',
      'Physical fitness prep alongside studies'
    ],
    strategy: {
      criticalPhase: 7,
      consolidationPhase: 15,
      expansionCutoff: 30,
      idealSessionLength: 45,
      minEffectiveSession: 20,
      strongRecallAction: 'expand-coverage',
      weakRecallAction: 'focus-basics',
      negativeMarking: true,
      skipThreshold: 60,
      rotationStyle: 'daily',
      examNature: 'objective',
      timePerQuestion: 90  // 2.5 hours for 150 questions (Math paper)
    },
    performanceTriggers: [
      { condition: 'strong-recall', daysRange: [30, 90], guidance: 'Strong recall — add GK breadth (55% of marks)', action: 'expand-coverage' },
      { condition: 'strong-recall', daysRange: [15, 30], guidance: 'Strong recall — focus on Math accuracy', action: 'attempt-harder' },
      { condition: 'strong-recall', daysRange: [0, 15], guidance: 'Strong recall — maintain balance, no new topics', action: 'maintain' },
      { condition: 'weak-recall', daysRange: [30, 90], guidance: 'Weak recall — master Math basics (33% of marks)', action: 'focus-basics' },
      { condition: 'weak-recall', daysRange: [15, 30], guidance: 'Weak recall — focus on high-frequency GK', action: 'reduce-scope' },
      { condition: 'weak-recall', daysRange: [0, 15], guidance: 'Weak recall — protect strong areas, skip weak', action: 'repeat-revision' },
      { condition: 'below-target', daysRange: [30, 90], guidance: 'Below target — Math practice needs more time', action: 'increase-pace' },
      { condition: 'below-target', daysRange: [0, 30], guidance: 'Below target — focus on Indian geography + defense GK', action: 'focus-basics' },
      { condition: 'stagnant', daysRange: [0, 90], guidance: 'Progress stagnant — take NDA mock test', action: 'attempt-harder' }
    ]
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

/**
 * Get subject-level metadata for contextual guidance
 */
export function getSubjectMeta(exam: string, subject: string): SubjectMeta | null {
  const syllabus = EXAM_SYLLABI[exam]
  return syllabus?.subjectMeta?.[subject] || null
}

/**
 * Get exam-day decision rules (to show when exam ≤7 days)
 */
export function getExamDayRules(exam: string): ExamDayRule[] | null {
  const syllabus = EXAM_SYLLABI[exam]
  return syllabus?.examDayRules || null
}

/**
 * Get last-phase guidance (to show when exam ≤10 days)
 */
export function getLastPhaseGuidance(exam: string): string[] | null {
  const syllabus = EXAM_SYLLABI[exam]
  return syllabus?.lastPhaseGuidance || null
}

/**
 * Calculate days remaining to exam
 */
export function getDaysToExam(examDateStr: string): number | null {
  try {
    const examDate = new Date(examDateStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    examDate.setHours(0, 0, 0, 0)
    const diffTime = examDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays >= 0 ? diffDays : null
  } catch {
    return null
  }
}

/**
 * Get typical mistakes for a subject (for MIS integration)
 */
export function getTypicalMistakes(exam: string, subject: string): string[] {
  const meta = getSubjectMeta(exam, subject)
  return meta?.typicalMistakes || []
}

/**
 * Check if a mistake matches known typical mistakes for the subject
 * Returns the matching typical mistake pattern if found
 */
export function matchTypicalMistake(exam: string, subject: string, mistakeDescription: string): string | null {
  const typicalMistakes = getTypicalMistakes(exam, subject)
  const lowerMistake = mistakeDescription.toLowerCase()
  
  for (const typical of typicalMistakes) {
    // Simple keyword matching - can be enhanced with NLP
    const keywords = typical.toLowerCase().split(/\s+/)
    const matchCount = keywords.filter(k => k.length > 3 && lowerMistake.includes(k)).length
    if (matchCount >= 2) {
      return typical
    }
  }
  return null
}

/**
 * Get exam strategy configuration
 */
export function getExamStrategy(exam: string): ExamStrategy | null {
  const syllabus = EXAM_SYLLABI[exam]
  return syllabus?.strategy || null
}

/**
 * Get performance-based guidance for current situation
 */
export function getPerformanceGuidance(
  exam: string,
  condition: 'strong-recall' | 'weak-recall' | 'below-target' | 'above-target' | 'stagnant',
  daysToExam: number
): { guidance: string; action: string } | null {
  const syllabus = EXAM_SYLLABI[exam]
  if (!syllabus?.performanceTriggers) return null
  
  const trigger = syllabus.performanceTriggers.find(t => 
    t.condition === condition && 
    daysToExam >= t.daysRange[0] && 
    daysToExam <= t.daysRange[1]
  )
  
  return trigger ? { guidance: trigger.guidance, action: trigger.action } : null
}

/**
 * Determine current exam phase
 */
export function getExamPhase(exam: string, daysToExam: number): 'critical' | 'consolidation' | 'expansion' | 'early' {
  const strategy = getExamStrategy(exam)
  if (!strategy) {
    // Default thresholds
    if (daysToExam <= 7) return 'critical'
    if (daysToExam <= 15) return 'consolidation'
    if (daysToExam <= 30) return 'expansion'
    return 'early'
  }
  
  if (daysToExam <= strategy.criticalPhase) return 'critical'
  if (daysToExam <= strategy.consolidationPhase) return 'consolidation'
  if (daysToExam <= strategy.expansionCutoff) return 'expansion'
  return 'early'
}

/**
 * Get recommended action based on performance and exam phase
 */
export function getRecommendedAction(
  exam: string,
  daysToExam: number,
  recallStrength: 'strong' | 'weak' | 'average',
  targetStatus: 'above' | 'below' | 'on-track' | 'stagnant'
): { action: string; guidance: string; phase: string } {
  const phase = getExamPhase(exam, daysToExam)
  const strategy = getExamStrategy(exam)
  
  // Determine condition
  let condition: 'strong-recall' | 'weak-recall' | 'below-target' | 'above-target' | 'stagnant'
  if (targetStatus === 'stagnant') {
    condition = 'stagnant'
  } else if (targetStatus === 'below') {
    condition = 'below-target'
  } else if (recallStrength === 'strong') {
    condition = 'strong-recall'
  } else if (recallStrength === 'weak') {
    condition = 'weak-recall'
  } else {
    condition = 'strong-recall' // Default to strong for average
  }
  
  // Get performance-based guidance
  const perfGuidance = getPerformanceGuidance(exam, condition, daysToExam)
  
  if (perfGuidance) {
    return {
      action: perfGuidance.action,
      guidance: perfGuidance.guidance,
      phase
    }
  }
  
  // Fallback based on strategy defaults
  if (strategy) {
    if (recallStrength === 'strong') {
      return {
        action: strategy.strongRecallAction,
        guidance: getActionDescription(strategy.strongRecallAction, phase),
        phase
      }
    } else {
      return {
        action: strategy.weakRecallAction,
        guidance: getActionDescription(strategy.weakRecallAction, phase),
        phase
      }
    }
  }
  
  // Generic fallback
  return {
    action: 'maintain',
    guidance: 'Continue with current pace',
    phase
  }
}

/**
 * Get human-readable description for action type
 */
function getActionDescription(action: string, phase: string): string {
  const descriptions: { [key: string]: string } = {
    'increase-pace': 'Consider increasing daily study hours',
    'expand-coverage': 'You can expand to related topics',
    'attempt-harder': 'Try more challenging practice problems',
    'maintain': 'Maintain current pace and depth',
    'consolidate': 'Focus on consolidating what you know',
    'reduce-scope': 'Focus on fewer high-yield topics',
    'focus-basics': 'Strengthen fundamentals before advancing',
    'repeat-revision': 'Revise covered material before new content'
  }
  
  return descriptions[action] || 'Continue with current strategy'
}

/**
 * Get session length recommendation
 */
export function getRecommendedSessionLength(exam: string, availableMinutes: number): number {
  const strategy = getExamStrategy(exam)
  
  if (!strategy) {
    // Default: 30 min sessions
    return Math.min(availableMinutes, 30)
  }
  
  if (availableMinutes >= strategy.idealSessionLength) {
    return strategy.idealSessionLength
  }
  
  if (availableMinutes >= strategy.minEffectiveSession) {
    return availableMinutes
  }
  
  // Below minimum - still return available time but flag it
  return availableMinutes
}

/**
 * Check if session length is effective for this exam
 */
export function isEffectiveSessionLength(exam: string, minutes: number): boolean {
  const strategy = getExamStrategy(exam)
  if (!strategy) return minutes >= 15 // Default minimum
  return minutes >= strategy.minEffectiveSession
}

/**
 * Get skip threshold for this exam (confidence below which to skip)
 */
export function getSkipThreshold(exam: string): number {
  const strategy = getExamStrategy(exam)
  return strategy?.skipThreshold || 50
}

// Study pattern analysis result
export interface StudyPatternAnalysis {
  totalMinutes: number
  subjectMinutes: Map<string, number>
  subjectRecallRate: Map<string, number>  // 0-1, higher = better recall
  neglectedSubjects: string[]              // Subjects not studied in 5+ days
  weakRecallSubjects: string[]             // Subjects with <50% recall
  strongRecallSubjects: string[]           // Subjects with >70% recall
  dominantSubject: string | null           // Most studied subject
  leastStudiedSubject: string | null       // Least studied (but has some time)
  averageRecallRate: number                // Overall recall rate
  studyDaysCount: number                   // How many days had study
  consistencyScore: number                 // 0-1, higher = more consistent
}

/**
 * Analyze study patterns from check-in data
 * @param checkIns Recent check-ins (typically 14-30 days)
 * @param examSubjects Optional list of exam subjects to check coverage
 */
export function analyzeStudyPatterns(
  checkIns: Array<{ subject: string; minutesStudied: number; couldRevise: boolean; date: string }>,
  examSubjects?: string[]
): StudyPatternAnalysis {
  const subjectMinutes = new Map<string, number>()
  const subjectRecallYes = new Map<string, number>()
  const subjectRecallTotal = new Map<string, number>()
  const subjectLastSeen = new Map<string, Date>()
  const studyDates = new Set<string>()
  
  let totalMinutes = 0
  let totalRecallYes = 0
  let totalRecallCount = 0
  
  for (const checkIn of checkIns) {
    const { subject, minutesStudied, couldRevise, date } = checkIn
    
    // Track totals
    totalMinutes += minutesStudied
    totalRecallCount++
    if (couldRevise) totalRecallYes++
    
    // Track per subject
    subjectMinutes.set(subject, (subjectMinutes.get(subject) || 0) + minutesStudied)
    subjectRecallTotal.set(subject, (subjectRecallTotal.get(subject) || 0) + 1)
    if (couldRevise) {
      subjectRecallYes.set(subject, (subjectRecallYes.get(subject) || 0) + 1)
    }
    
    // Track last seen
    const checkInDate = new Date(date)
    const existing = subjectLastSeen.get(subject)
    if (!existing || checkInDate > existing) {
      subjectLastSeen.set(subject, checkInDate)
    }
    
    studyDates.add(date)
  }
  
  // Calculate recall rates per subject
  const subjectRecallRate = new Map<string, number>()
  for (const [subject, total] of subjectRecallTotal.entries()) {
    const yes = subjectRecallYes.get(subject) || 0
    subjectRecallRate.set(subject, total > 0 ? yes / total : 0)
  }
  
  // Identify weak/strong recall subjects (need at least 2 data points)
  const weakRecallSubjects: string[] = []
  const strongRecallSubjects: string[] = []
  for (const [subject, rate] of subjectRecallRate.entries()) {
    const total = subjectRecallTotal.get(subject) || 0
    if (total < 2) continue // Need enough data
    if (rate < 0.5) weakRecallSubjects.push(subject)
    if (rate >= 0.7) strongRecallSubjects.push(subject)
  }
  
  // Identify neglected subjects (not studied in 5+ days)
  const now = new Date()
  const neglectedSubjects: string[] = []
  
  // Check all exam subjects if provided
  const subjectsToCheck = examSubjects || Array.from(subjectMinutes.keys())
  for (const subject of subjectsToCheck) {
    const lastSeen = subjectLastSeen.get(subject)
    if (!lastSeen) {
      // Never studied this exam subject
      if (examSubjects?.includes(subject)) {
        neglectedSubjects.push(subject)
      }
    } else {
      const daysSince = Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 60 * 60 * 24))
      if (daysSince >= 5) {
        neglectedSubjects.push(subject)
      }
    }
  }
  
  // Find dominant and least studied subjects
  let dominantSubject: string | null = null
  let leastStudiedSubject: string | null = null
  let maxMinutes = 0
  let minMinutes = Infinity
  
  for (const [subject, minutes] of subjectMinutes.entries()) {
    if (minutes > maxMinutes) {
      maxMinutes = minutes
      dominantSubject = subject
    }
    if (minutes > 0 && minutes < minMinutes) {
      minMinutes = minutes
      leastStudiedSubject = subject
    }
  }
  
  // Calculate consistency (study days / total days in period)
  const dayRange = checkIns.length > 0 
    ? Math.max(1, Math.ceil((now.getTime() - new Date(checkIns[checkIns.length - 1].date).getTime()) / (1000 * 60 * 60 * 24)))
    : 1
  const consistencyScore = Math.min(1, studyDates.size / dayRange)
  
  return {
    totalMinutes,
    subjectMinutes,
    subjectRecallRate,
    neglectedSubjects,
    weakRecallSubjects,
    strongRecallSubjects,
    dominantSubject,
    leastStudiedSubject,
    averageRecallRate: totalRecallCount > 0 ? totalRecallYes / totalRecallCount : 0,
    studyDaysCount: studyDates.size,
    consistencyScore
  }
}

/**
 * Get personalized guidance based on actual study patterns
 */
export function getPatternBasedGuidance(
  exam: string,
  daysToExam: number,
  patterns: StudyPatternAnalysis
): { guidance: string; action: string; priority: 'high' | 'medium' | 'low' } {
  const phase = getExamPhase(exam, daysToExam)
  const strategy = getExamStrategy(exam)
  
  // Priority 1: Critical phase with weak recall - highest urgency
  if (phase === 'critical' && patterns.weakRecallSubjects.length > 0) {
    const weakSubject = patterns.weakRecallSubjects[0]
    return {
      guidance: `⚠️ ${weakSubject} has weak recall — revise only what you've covered`,
      action: 'repeat-revision',
      priority: 'high'
    }
  }
  
  // Priority 2: Neglected high-weight subjects
  if (patterns.neglectedSubjects.length > 0) {
    const examSubjects = getExamSubjects(exam)
    // Find highest-weight neglected subject
    const neglectedWithMarks = patterns.neglectedSubjects
      .filter(s => examSubjects.includes(s))
      .map(s => ({ subject: s, marks: getSubjectMarks(exam, s) }))
      .sort((a, b) => b.marks - a.marks)
    
    if (neglectedWithMarks.length > 0) {
      const top = neglectedWithMarks[0]
      if (phase === 'critical') {
        return {
          guidance: `${top.subject} (${top.marks} marks) untouched — quick revision if already covered`,
          action: 'focus-basics',
          priority: 'high'
        }
      }
      return {
        guidance: `${top.subject} (${top.marks} marks) hasn't been studied in 5+ days`,
        action: 'expand-coverage',
        priority: 'medium'
      }
    }
  }
  
  // Priority 3: Imbalanced study time
  if (patterns.dominantSubject && patterns.leastStudiedSubject && 
      patterns.dominantSubject !== patterns.leastStudiedSubject) {
    const dominantTime = patterns.subjectMinutes.get(patterns.dominantSubject) || 0
    const leastTime = patterns.subjectMinutes.get(patterns.leastStudiedSubject) || 0
    
    if (dominantTime > leastTime * 3) { // More than 3x imbalance
      const leastMarks = getSubjectMarks(exam, patterns.leastStudiedSubject)
      if (leastMarks > 0) {
        return {
          guidance: `${patterns.leastStudiedSubject} (${leastMarks} marks) needs more time — currently underweighted`,
          action: 'focus-basics',
          priority: 'medium'
        }
      }
    }
  }
  
  // Priority 4: Low consistency
  if (patterns.consistencyScore < 0.5 && patterns.studyDaysCount < 5) {
    return {
      guidance: `Consistency is low — aim for shorter daily sessions over longer gaps`,
      action: 'maintain',
      priority: 'medium'
    }
  }
  
  // Priority 5: Strong recall - can expand
  if (patterns.strongRecallSubjects.length >= 2 && patterns.averageRecallRate >= 0.7) {
    if (phase === 'expansion' || phase === 'early') {
      return {
        guidance: `Strong recall across subjects — consider expanding to tougher areas`,
        action: strategy?.strongRecallAction || 'expand-coverage',
        priority: 'low'
      }
    }
    return {
      guidance: `Strong retention — maintain current pace and protect what you know`,
      action: 'maintain',
      priority: 'low'
    }
  }
  
  // Default: based on overall recall
  if (patterns.averageRecallRate >= 0.6) {
    return {
      guidance: `Good recall rate (${Math.round(patterns.averageRecallRate * 100)}%) — stay consistent`,
      action: 'maintain',
      priority: 'low'
    }
  }
  
  return {
    guidance: `Recall rate is ${Math.round(patterns.averageRecallRate * 100)}% — prioritize revision over new topics`,
    action: 'repeat-revision',
    priority: 'medium'
  }
}

/**
 * Get contextual tip based on exam phase and subject
 * Enforces the "max 1 tip per session" guardrail via session tracking
 */
export function getContextualTip(
  exam: string,
  subject: string,
  examDate?: string,
  sessionId?: string
): { tip: string; type: 'exam-tip' | 'last-phase' | 'exam-rule' } | null {
  const daysToExam = examDate ? getDaysToExam(examDate) : null
  
  // Priority 1: Exam-day rules (≤7 days)
  if (daysToExam !== null && daysToExam <= 7) {
    const rules = getExamDayRules(exam)
    if (rules && rules.length > 0) {
      // One rule per day
      const ruleIndex = (7 - daysToExam) % rules.length
      return { tip: `${rules[ruleIndex].trigger} → ${rules[ruleIndex].rule}`, type: 'exam-rule' }
    }
  }
  
  // Priority 2: Last-phase guidance (≤10 days)
  if (daysToExam !== null && daysToExam <= 10) {
    const guidance = getLastPhaseGuidance(exam)
    if (guidance && guidance.length > 0) {
      // Rotate based on day
      const guidanceIndex = daysToExam % guidance.length
      return { tip: guidance[guidanceIndex], type: 'last-phase' }
    }
  }
  
  // Priority 3: Subject-specific exam tip
  const meta = getSubjectMeta(exam, subject)
  if (meta?.examTips && meta.examTips.length > 0) {
    // One tip per session (use hour as simple session proxy)
    const tipIndex = new Date().getHours() % meta.examTips.length
    return { tip: meta.examTips[tipIndex], type: 'exam-tip' }
  }
  
  return null
}
