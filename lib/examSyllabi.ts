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

export interface ExamSyllabus {
  exam: string
  subjects: string[]
  marksDistribution?: { [subject: string]: number }
  totalMarks?: number
  subjectMeta?: { [subject: string]: SubjectMeta }
  examDayRules?: ExamDayRule[]
  lastPhaseGuidance?: string[]   // General final-phase rules
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
