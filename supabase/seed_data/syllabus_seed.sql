-- Canonical syllabus seed data (FocusFlow)
-- Uses schema from: supabase/migrations/004_preparation_state_system.sql
--
-- Goal:
-- - Provide usable, exam-specific topic lists for ALL exam presets in the app
-- - Keep the script idempotent (safe to re-run)
--
-- Notes:
-- - Syllabi can change by year/authority; treat these as a strong baseline.
-- - We keep `avg_questions_per_year` as 0.0 unless you want to backfill historical stats.

BEGIN;

-- ============================================================================
-- PART 0: Create templates (upsert)
-- ============================================================================

INSERT INTO public.syllabus_templates (exam, version, total_topics)
VALUES
	('UPSC Civil Services', '1.0', 0),
	('JEE Main/Advanced', '1.0', 0),
	('NEET UG', '1.0', 0),
	('SSC CGL/CHSL', '1.0', 0),
	('GATE', '1.0', 0),
	('CAT', '1.0', 0),
	('Banking (IBPS/SBI)', '1.0', 0),
	('CA Foundation/Inter/Final', '1.0', 0),
	('CLAT', '1.0', 0),
	('NDA', '1.0', 0),
	('Other', '1.0', 0)
ON CONFLICT (exam)
DO UPDATE SET
	updated_at = NOW();

-- Helper macro:
--   (SELECT id FROM public.syllabus_templates WHERE exam = '<EXAM>' LIMIT 1)

-- ============================================================================
-- UPSC CIVIL SERVICES (Prelims GS + core overlap)
-- ============================================================================

INSERT INTO public.syllabus_topics (
	syllabus_id, code, name, subject,
	exam_weight, avg_questions_per_year,
	estimated_hours, difficulty, display_order
)
VALUES
	-- Polity
	((SELECT id FROM public.syllabus_templates WHERE exam = 'UPSC Civil Services' LIMIT 1), 'UPSC_POLITY_CONSTITUTION', 'Constitution: Preamble, Basic Structure, Salient Features', 'Polity', 9, 0.0, 6.0, 'moderate', 10),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'UPSC Civil Services' LIMIT 1), 'UPSC_POLITY_FUNDAMENTAL_RIGHTS', 'Fundamental Rights, Duties, DPSP', 'Polity', 10, 0.0, 7.0, 'moderate', 11),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'UPSC Civil Services' LIMIT 1), 'UPSC_POLITY_UNION_GOVT', 'Union Government: President, PM, Council, Parliament', 'Polity', 9, 0.0, 7.0, 'moderate', 12),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'UPSC Civil Services' LIMIT 1), 'UPSC_POLITY_JUDICIARY', 'Judiciary: SC/HC, judicial review, PIL', 'Polity', 8, 0.0, 5.0, 'moderate', 13),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'UPSC Civil Services' LIMIT 1), 'UPSC_POLITY_FEDERALISM', 'Federalism: Centre-State relations, schedules', 'Polity', 8, 0.0, 5.0, 'moderate', 14),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'UPSC Civil Services' LIMIT 1), 'UPSC_POLITY_LOCAL_GOVT', 'Local Government: Panchayati Raj, municipalities', 'Polity', 7, 0.0, 4.0, 'basic', 15),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'UPSC Civil Services' LIMIT 1), 'UPSC_POLITY_BODIES', 'Constitutional/Statutory Bodies: EC, CAG, UPSC, etc.', 'Polity', 8, 0.0, 5.0, 'moderate', 16),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'UPSC Civil Services' LIMIT 1), 'UPSC_POLITY_AMENDMENTS', 'Important Amendments + landmark cases (overview)', 'Polity', 7, 0.0, 4.0, 'advanced', 17),

	-- History & Culture
	((SELECT id FROM public.syllabus_templates WHERE exam = 'UPSC Civil Services' LIMIT 1), 'UPSC_HIST_ANCIENT', 'Ancient India (overview)', 'History', 7, 0.0, 6.0, 'moderate', 30),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'UPSC Civil Services' LIMIT 1), 'UPSC_HIST_MEDIEVAL', 'Medieval India (overview)', 'History', 6, 0.0, 5.0, 'moderate', 31),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'UPSC Civil Services' LIMIT 1), 'UPSC_HIST_MODERN', 'Modern India: 1757–1947, freedom struggle', 'History', 9, 0.0, 7.0, 'moderate', 32),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'UPSC Civil Services' LIMIT 1), 'UPSC_CULTURE_ART', 'Indian Art & Culture: architecture, literature, religion', 'History', 6, 0.0, 5.0, 'moderate', 33),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'UPSC Civil Services' LIMIT 1), 'UPSC_POST_INDEPENDENCE', 'Post-independence India (overview)', 'History', 5, 0.0, 3.0, 'basic', 34),

	-- Geography
	((SELECT id FROM public.syllabus_templates WHERE exam = 'UPSC Civil Services' LIMIT 1), 'UPSC_GEO_PHYSICAL', 'Physical Geography: geomorphology, climatology, oceanography', 'Geography', 8, 0.0, 7.0, 'moderate', 50),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'UPSC Civil Services' LIMIT 1), 'UPSC_GEO_INDIAN', 'Indian Geography: rivers, mountains, climate, resources', 'Geography', 9, 0.0, 7.0, 'moderate', 51),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'UPSC Civil Services' LIMIT 1), 'UPSC_GEO_AGRI', 'Agriculture + soils + irrigation (overview)', 'Geography', 7, 0.0, 5.0, 'moderate', 52),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'UPSC Civil Services' LIMIT 1), 'UPSC_GEO_MAPS', 'Mapping: India/world (locations, passes, currents, ports)', 'Geography', 7, 0.0, 4.0, 'basic', 53),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'UPSC Civil Services' LIMIT 1), 'UPSC_GEO_DISASTERS', 'Disaster management basics', 'Geography', 5, 0.0, 3.0, 'basic', 54),

	-- Economy
	((SELECT id FROM public.syllabus_templates WHERE exam = 'UPSC Civil Services' LIMIT 1), 'UPSC_ECO_MACRO', 'Macro basics: GDP, inflation, fiscal/monetary policy', 'Economics', 9, 0.0, 6.0, 'moderate', 70),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'UPSC Civil Services' LIMIT 1), 'UPSC_ECO_BANKING', 'Banking & monetary policy instruments', 'Economics', 8, 0.0, 5.0, 'moderate', 71),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'UPSC Civil Services' LIMIT 1), 'UPSC_ECO_BUDGET_TAX', 'Budget + taxation (overview)', 'Economics', 8, 0.0, 5.0, 'moderate', 72),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'UPSC Civil Services' LIMIT 1), 'UPSC_ECO_GROWTH_DEV', 'Growth & development, poverty, unemployment', 'Economics', 8, 0.0, 5.0, 'moderate', 73),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'UPSC Civil Services' LIMIT 1), 'UPSC_ECO_EXTERNAL', 'External sector: BoP, trade, forex, FDI/FPI', 'Economics', 6, 0.0, 4.0, 'moderate', 74),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'UPSC Civil Services' LIMIT 1), 'UPSC_ECO_SCHEMES', 'Government schemes & flagship programs (current)', 'Economics', 7, 0.0, 4.0, 'basic', 75),

	-- Environment
	((SELECT id FROM public.syllabus_templates WHERE exam = 'UPSC Civil Services' LIMIT 1), 'UPSC_ENV_ECOLOGY', 'Ecology basics: ecosystem, food chain, biodiversity', 'Environment', 9, 0.0, 6.0, 'moderate', 90),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'UPSC Civil Services' LIMIT 1), 'UPSC_ENV_CONSERVATION', 'Conservation: protected areas, species, conventions', 'Environment', 8, 0.0, 6.0, 'moderate', 91),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'UPSC Civil Services' LIMIT 1), 'UPSC_ENV_CLIMATE', 'Climate change: greenhouse effect, agreements, impacts', 'Environment', 8, 0.0, 5.0, 'moderate', 92),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'UPSC Civil Services' LIMIT 1), 'UPSC_ENV_POLLUTION', 'Pollution: air/water/soil, waste management', 'Environment', 7, 0.0, 4.0, 'basic', 93),

	-- Science & Tech
	((SELECT id FROM public.syllabus_templates WHERE exam = 'UPSC Civil Services' LIMIT 1), 'UPSC_SCI_BASIC', 'Basic Science (Physics/Chem/Bio) for prelims', 'Science & Tech', 6, 0.0, 5.0, 'basic', 110),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'UPSC Civil Services' LIMIT 1), 'UPSC_SCI_SPACE', 'Space tech: satellites, ISRO missions (overview)', 'Science & Tech', 6, 0.0, 3.5, 'basic', 111),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'UPSC Civil Services' LIMIT 1), 'UPSC_SCI_IT', 'IT: AI, cyber security, emerging tech (overview)', 'Science & Tech', 6, 0.0, 3.5, 'basic', 112),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'UPSC Civil Services' LIMIT 1), 'UPSC_SCI_BIOTECH', 'Biotech & health: vaccines, genetics (overview)', 'Science & Tech', 6, 0.0, 3.5, 'basic', 113),

	-- Current Affairs / IR (kept as topics so MIS can tag mistakes)
	((SELECT id FROM public.syllabus_templates WHERE exam = 'UPSC Civil Services' LIMIT 1), 'UPSC_CA_NATIONAL', 'Current Affairs: National issues (policy, economy, society)', 'Current Affairs', 8, 0.0, 6.0, 'moderate', 130),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'UPSC Civil Services' LIMIT 1), 'UPSC_CA_INTERNATIONAL', 'Current Affairs: International relations (overview)', 'Current Affairs', 6, 0.0, 4.0, 'moderate', 131)
ON CONFLICT (syllabus_id, code)
DO UPDATE SET
	name = EXCLUDED.name,
	subject = EXCLUDED.subject,
	exam_weight = EXCLUDED.exam_weight,
	avg_questions_per_year = EXCLUDED.avg_questions_per_year,
	estimated_hours = EXCLUDED.estimated_hours,
	difficulty = EXCLUDED.difficulty,
	display_order = EXCLUDED.display_order;

-- ============================================================================
-- JEE MAIN/ADVANCED (baseline)
-- ============================================================================

INSERT INTO public.syllabus_topics (syllabus_id, code, name, subject, exam_weight, avg_questions_per_year, estimated_hours, difficulty, display_order)
VALUES
	-- Physics
	((SELECT id FROM public.syllabus_templates WHERE exam = 'JEE Main/Advanced' LIMIT 1), 'JEE_PHY_KINEMATICS', 'Kinematics', 'Physics', 9, 0.0, 8.0, 'moderate', 10),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'JEE Main/Advanced' LIMIT 1), 'JEE_PHY_NLM', 'Laws of Motion', 'Physics', 9, 0.0, 8.0, 'moderate', 11),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'JEE Main/Advanced' LIMIT 1), 'JEE_PHY_WEP', 'Work, Energy, Power', 'Physics', 9, 0.0, 7.0, 'moderate', 12),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'JEE Main/Advanced' LIMIT 1), 'JEE_PHY_ROTATION', 'Rotational Motion', 'Physics', 9, 0.0, 9.0, 'advanced', 13),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'JEE Main/Advanced' LIMIT 1), 'JEE_PHY_GRAVITATION', 'Gravitation', 'Physics', 7, 0.0, 5.0, 'moderate', 14),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'JEE Main/Advanced' LIMIT 1), 'JEE_PHY_THERMODYNAMICS', 'Thermodynamics + KTG', 'Physics', 8, 0.0, 7.0, 'moderate', 15),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'JEE Main/Advanced' LIMIT 1), 'JEE_PHY_SHM_WAVES', 'SHM + Waves', 'Physics', 8, 0.0, 7.0, 'moderate', 16),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'JEE Main/Advanced' LIMIT 1), 'JEE_PHY_ELECTROSTATICS', 'Electrostatics', 'Physics', 9, 0.0, 8.0, 'moderate', 17),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'JEE Main/Advanced' LIMIT 1), 'JEE_PHY_CURRENT', 'Current Electricity', 'Physics', 9, 0.0, 8.0, 'moderate', 18),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'JEE Main/Advanced' LIMIT 1), 'JEE_PHY_MAGNETISM', 'Magnetism + EMI + AC', 'Physics', 9, 0.0, 9.0, 'advanced', 19),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'JEE Main/Advanced' LIMIT 1), 'JEE_PHY_OPTICS', 'Optics (Ray + Wave)', 'Physics', 8, 0.0, 7.0, 'moderate', 20),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'JEE Main/Advanced' LIMIT 1), 'JEE_PHY_MODERN', 'Modern Physics (Photoelectric, Atom, Nucleus, Semiconductor)', 'Physics', 9, 0.0, 8.0, 'moderate', 21),

	-- Chemistry
	((SELECT id FROM public.syllabus_templates WHERE exam = 'JEE Main/Advanced' LIMIT 1), 'JEE_CHEM_MOLE', 'Mole Concept + Stoichiometry', 'Chemistry', 9, 0.0, 6.0, 'moderate', 40),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'JEE Main/Advanced' LIMIT 1), 'JEE_CHEM_ATOMIC', 'Atomic Structure + Periodicity', 'Chemistry', 8, 0.0, 6.0, 'moderate', 41),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'JEE Main/Advanced' LIMIT 1), 'JEE_CHEM_BONDING', 'Chemical Bonding', 'Chemistry', 9, 0.0, 8.0, 'moderate', 42),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'JEE Main/Advanced' LIMIT 1), 'JEE_CHEM_THERMO', 'Thermodynamics (Chem) + Equilibrium', 'Chemistry', 9, 0.0, 8.0, 'advanced', 43),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'JEE Main/Advanced' LIMIT 1), 'JEE_CHEM_ELECTRO', 'Electrochemistry + Solutions', 'Chemistry', 8, 0.0, 7.0, 'advanced', 44),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'JEE Main/Advanced' LIMIT 1), 'JEE_CHEM_KINETICS', 'Chemical Kinetics', 'Chemistry', 7, 0.0, 5.0, 'moderate', 45),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'JEE Main/Advanced' LIMIT 1), 'JEE_CHEM_COORD', 'Coordination Compounds', 'Chemistry', 8, 0.0, 7.0, 'advanced', 46),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'JEE Main/Advanced' LIMIT 1), 'JEE_CHEM_PBLOCK', 'p-Block + d/f Block (overview)', 'Chemistry', 8, 0.0, 9.0, 'advanced', 47),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'JEE Main/Advanced' LIMIT 1), 'JEE_CHEM_GOC', 'GOC (basic + reaction intermediates)', 'Chemistry', 9, 0.0, 8.0, 'advanced', 48),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'JEE Main/Advanced' LIMIT 1), 'JEE_CHEM_HC', 'Hydrocarbons + Aromatics', 'Chemistry', 8, 0.0, 7.0, 'moderate', 49),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'JEE Main/Advanced' LIMIT 1), 'JEE_CHEM_CARBONYL', 'Carbonyls + Carboxylic acids + derivatives', 'Chemistry', 8, 0.0, 8.0, 'advanced', 50),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'JEE Main/Advanced' LIMIT 1), 'JEE_CHEM_BIOMOLE', 'Biomolecules + Polymers + Practical', 'Chemistry', 6, 0.0, 5.0, 'basic', 51),

	-- Mathematics
	((SELECT id FROM public.syllabus_templates WHERE exam = 'JEE Main/Advanced' LIMIT 1), 'JEE_MATH_SETS', 'Sets, Relations & Functions', 'Mathematics', 7, 0.0, 6.0, 'moderate', 70),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'JEE Main/Advanced' LIMIT 1), 'JEE_MATH_QUADRATIC', 'Quadratic equations + inequalities', 'Mathematics', 8, 0.0, 7.0, 'moderate', 71),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'JEE Main/Advanced' LIMIT 1), 'JEE_MATH_SEQUENCE', 'Sequences & Series', 'Mathematics', 8, 0.0, 7.0, 'moderate', 72),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'JEE Main/Advanced' LIMIT 1), 'JEE_MATH_TRIG', 'Trigonometry', 'Mathematics', 9, 0.0, 8.0, 'moderate', 73),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'JEE Main/Advanced' LIMIT 1), 'JEE_MATH_COORD', 'Coordinate Geometry (line, circle, conics)', 'Mathematics', 9, 0.0, 10.0, 'advanced', 74),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'JEE Main/Advanced' LIMIT 1), 'JEE_MATH_LIMITS', 'Limits, Continuity & Differentiability', 'Mathematics', 9, 0.0, 8.0, 'advanced', 75),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'JEE Main/Advanced' LIMIT 1), 'JEE_MATH_INTEGRAL', 'Integral Calculus', 'Mathematics', 9, 0.0, 10.0, 'advanced', 76),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'JEE Main/Advanced' LIMIT 1), 'JEE_MATH_DIFFEQ', 'Differential Equations', 'Mathematics', 7, 0.0, 6.0, 'advanced', 77),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'JEE Main/Advanced' LIMIT 1), 'JEE_MATH_VECTOR3D', 'Vectors & 3D Geometry', 'Mathematics', 8, 0.0, 7.0, 'moderate', 78),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'JEE Main/Advanced' LIMIT 1), 'JEE_MATH_PROB', 'Probability + Statistics', 'Mathematics', 8, 0.0, 7.0, 'moderate', 79),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'JEE Main/Advanced' LIMIT 1), 'JEE_MATH_MATRICES', 'Matrices & Determinants', 'Mathematics', 8, 0.0, 7.0, 'moderate', 80)
ON CONFLICT (syllabus_id, code)
DO UPDATE SET
	name = EXCLUDED.name,
	subject = EXCLUDED.subject,
	exam_weight = EXCLUDED.exam_weight,
	avg_questions_per_year = EXCLUDED.avg_questions_per_year,
	estimated_hours = EXCLUDED.estimated_hours,
	difficulty = EXCLUDED.difficulty,
	display_order = EXCLUDED.display_order;

-- ============================================================================
-- NEET UG (baseline)
-- ============================================================================

INSERT INTO public.syllabus_topics (syllabus_id, code, name, subject, exam_weight, avg_questions_per_year, estimated_hours, difficulty, display_order)
VALUES
	-- Physics
	((SELECT id FROM public.syllabus_templates WHERE exam = 'NEET UG' LIMIT 1), 'NEET_PHY_MECH', 'Mechanics (kinematics, NLM, WEP, rotation, gravitation)', 'Physics', 9, 0.0, 10.0, 'advanced', 10),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'NEET UG' LIMIT 1), 'NEET_PHY_FLUID', 'Fluids + Properties of Matter', 'Physics', 7, 0.0, 6.0, 'moderate', 11),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'NEET UG' LIMIT 1), 'NEET_PHY_THERMO', 'Thermodynamics + KTG', 'Physics', 8, 0.0, 7.0, 'moderate', 12),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'NEET UG' LIMIT 1), 'NEET_PHY_SHM_WAVE', 'SHM + Waves', 'Physics', 7, 0.0, 6.0, 'moderate', 13),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'NEET UG' LIMIT 1), 'NEET_PHY_ELEC', 'Electrostatics + Current Electricity', 'Physics', 9, 0.0, 9.0, 'advanced', 14),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'NEET UG' LIMIT 1), 'NEET_PHY_MAG', 'Magnetism + EMI + AC', 'Physics', 8, 0.0, 8.0, 'advanced', 15),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'NEET UG' LIMIT 1), 'NEET_PHY_OPTICS', 'Optics', 'Physics', 8, 0.0, 7.0, 'moderate', 16),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'NEET UG' LIMIT 1), 'NEET_PHY_MODERN', 'Modern Physics + Semiconductors', 'Physics', 9, 0.0, 8.0, 'moderate', 17),

	-- Chemistry
	((SELECT id FROM public.syllabus_templates WHERE exam = 'NEET UG' LIMIT 1), 'NEET_CHEM_BASIC', 'Basic concepts: mole, atomic structure, periodicity', 'Chemistry', 8, 0.0, 7.0, 'moderate', 40),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'NEET UG' LIMIT 1), 'NEET_CHEM_BONDING', 'Chemical bonding', 'Chemistry', 9, 0.0, 8.0, 'moderate', 41),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'NEET UG' LIMIT 1), 'NEET_CHEM_THERMO_EQ', 'Thermo (chem) + equilibrium', 'Chemistry', 9, 0.0, 8.0, 'advanced', 42),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'NEET UG' LIMIT 1), 'NEET_CHEM_REDOX_ELECRO', 'Redox + electrochemistry', 'Chemistry', 8, 0.0, 7.0, 'advanced', 43),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'NEET UG' LIMIT 1), 'NEET_CHEM_ORG_BASIC', 'Organic basics: GOC + hydrocarbons', 'Chemistry', 9, 0.0, 8.0, 'advanced', 44),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'NEET UG' LIMIT 1), 'NEET_CHEM_ORG_FUNC', 'Organic functional groups (overview)', 'Chemistry', 8, 0.0, 9.0, 'advanced', 45),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'NEET UG' LIMIT 1), 'NEET_CHEM_INORG', 'Inorganic (p-block, d/f block, coordination overview)', 'Chemistry', 8, 0.0, 10.0, 'advanced', 46),

	-- Biology (kept as a single subject to match app UI)
	((SELECT id FROM public.syllabus_templates WHERE exam = 'NEET UG' LIMIT 1), 'NEET_BIO_CELL', 'Cell: structure & function', 'Biology', 9, 0.0, 6.0, 'moderate', 70),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'NEET UG' LIMIT 1), 'NEET_BIO_GENETICS', 'Genetics + molecular basis', 'Biology', 10, 0.0, 9.0, 'advanced', 71),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'NEET UG' LIMIT 1), 'NEET_BIO_HUMAN_PHYS', 'Human physiology (overview)', 'Biology', 10, 0.0, 10.0, 'advanced', 72),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'NEET UG' LIMIT 1), 'NEET_BIO_PLANT_PHYS', 'Plant physiology (overview)', 'Biology', 9, 0.0, 9.0, 'advanced', 73),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'NEET UG' LIMIT 1), 'NEET_BIO_ECOLOGY', 'Ecology + environment', 'Biology', 8, 0.0, 7.0, 'moderate', 74),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'NEET UG' LIMIT 1), 'NEET_BIO_DIVERSITY', 'Diversity in living world + taxonomy', 'Biology', 7, 0.0, 7.0, 'moderate', 75),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'NEET UG' LIMIT 1), 'NEET_BIO_BIOTECH', 'Biotechnology (overview)', 'Biology', 7, 0.0, 5.0, 'moderate', 76)
ON CONFLICT (syllabus_id, code)
DO UPDATE SET
	name = EXCLUDED.name,
	subject = EXCLUDED.subject,
	exam_weight = EXCLUDED.exam_weight,
	avg_questions_per_year = EXCLUDED.avg_questions_per_year,
	estimated_hours = EXCLUDED.estimated_hours,
	difficulty = EXCLUDED.difficulty,
	display_order = EXCLUDED.display_order;

-- ============================================================================
-- SSC CGL/CHSL (baseline)
-- ============================================================================

INSERT INTO public.syllabus_topics (syllabus_id, code, name, subject, exam_weight, avg_questions_per_year, estimated_hours, difficulty, display_order)
VALUES
	-- Quantitative Aptitude
	((SELECT id FROM public.syllabus_templates WHERE exam = 'SSC CGL/CHSL' LIMIT 1), 'SSC_QUANT_ARITH', 'Arithmetic: ratio, percentage, profit-loss, SI/CI', 'Quantitative Aptitude', 10, 0.0, 8.0, 'moderate', 10),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'SSC CGL/CHSL' LIMIT 1), 'SSC_QUANT_TSD', 'Time & work, pipes, time-speed-distance', 'Quantitative Aptitude', 9, 0.0, 7.0, 'moderate', 11),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'SSC CGL/CHSL' LIMIT 1), 'SSC_QUANT_ALG', 'Algebra basics', 'Quantitative Aptitude', 6, 0.0, 4.0, 'basic', 12),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'SSC CGL/CHSL' LIMIT 1), 'SSC_QUANT_GEO', 'Geometry + Mensuration', 'Quantitative Aptitude', 8, 0.0, 7.0, 'moderate', 13),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'SSC CGL/CHSL' LIMIT 1), 'SSC_QUANT_DATA', 'Data Interpretation (tables/graphs)', 'Quantitative Aptitude', 7, 0.0, 5.0, 'moderate', 14),

	-- Reasoning
	((SELECT id FROM public.syllabus_templates WHERE exam = 'SSC CGL/CHSL' LIMIT 1), 'SSC_REASONING_ANALOGY', 'Analogy, classification, series', 'Reasoning', 8, 0.0, 5.0, 'basic', 30),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'SSC CGL/CHSL' LIMIT 1), 'SSC_REASONING_CODING', 'Coding-decoding', 'Reasoning', 8, 0.0, 5.0, 'basic', 31),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'SSC CGL/CHSL' LIMIT 1), 'SSC_REASONING_BLOOD', 'Blood relations, direction, order/rank', 'Reasoning', 7, 0.0, 4.0, 'basic', 32),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'SSC CGL/CHSL' LIMIT 1), 'SSC_REASONING_SEATING', 'Seating arrangement (linear/circular)', 'Reasoning', 9, 0.0, 7.0, 'moderate', 33),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'SSC CGL/CHSL' LIMIT 1), 'SSC_REASONING_SYLLOGISM', 'Syllogism + inequalities', 'Reasoning', 8, 0.0, 6.0, 'moderate', 34),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'SSC CGL/CHSL' LIMIT 1), 'SSC_REASONING_PUZZLES', 'Puzzles + statement-based reasoning', 'Reasoning', 8, 0.0, 6.0, 'moderate', 35),

	-- English
	((SELECT id FROM public.syllabus_templates WHERE exam = 'SSC CGL/CHSL' LIMIT 1), 'SSC_ENG_GRAMMAR', 'Grammar: tenses, subject-verb, modifiers', 'English', 10, 0.0, 6.0, 'basic', 50),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'SSC CGL/CHSL' LIMIT 1), 'SSC_ENG_VOCAB', 'Vocabulary: synonyms/antonyms/one-word', 'English', 9, 0.0, 6.0, 'basic', 51),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'SSC CGL/CHSL' LIMIT 1), 'SSC_ENG_RC', 'Reading comprehension', 'English', 8, 0.0, 6.0, 'moderate', 52),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'SSC CGL/CHSL' LIMIT 1), 'SSC_ENG_ERROR', 'Error spotting + sentence improvement', 'English', 9, 0.0, 6.0, 'moderate', 53),

	-- General Awareness
	((SELECT id FROM public.syllabus_templates WHERE exam = 'SSC CGL/CHSL' LIMIT 1), 'SSC_GA_HISTORY', 'Static GK: History (overview)', 'General Awareness', 7, 0.0, 6.0, 'basic', 70),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'SSC CGL/CHSL' LIMIT 1), 'SSC_GA_GEO', 'Static GK: Geography (overview)', 'General Awareness', 7, 0.0, 6.0, 'basic', 71),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'SSC CGL/CHSL' LIMIT 1), 'SSC_GA_POLITY', 'Static GK: Polity (overview)', 'General Awareness', 7, 0.0, 6.0, 'basic', 72),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'SSC CGL/CHSL' LIMIT 1), 'SSC_GA_SCI', 'General Science (overview)', 'General Awareness', 8, 0.0, 7.0, 'basic', 73),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'SSC CGL/CHSL' LIMIT 1), 'SSC_GA_CURRENT', 'Current Affairs (overview)', 'General Awareness', 8, 0.0, 6.0, 'basic', 74)
ON CONFLICT (syllabus_id, code)
DO UPDATE SET
	name = EXCLUDED.name,
	subject = EXCLUDED.subject,
	exam_weight = EXCLUDED.exam_weight,
	avg_questions_per_year = EXCLUDED.avg_questions_per_year,
	estimated_hours = EXCLUDED.estimated_hours,
	difficulty = EXCLUDED.difficulty,
	display_order = EXCLUDED.display_order;

-- ============================================================================
-- GATE (generic baseline; stream-specific portions can be extended later)
-- ============================================================================

INSERT INTO public.syllabus_topics (syllabus_id, code, name, subject, exam_weight, avg_questions_per_year, estimated_hours, difficulty, display_order)
VALUES
	((SELECT id FROM public.syllabus_templates WHERE exam = 'GATE' LIMIT 1), 'GATE_APTITUDE_VERBAL', 'General Aptitude: Verbal ability', 'General Aptitude', 9, 0.0, 4.0, 'basic', 10),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'GATE' LIMIT 1), 'GATE_APTITUDE_QUANT', 'General Aptitude: Quantitative ability', 'General Aptitude', 9, 0.0, 4.0, 'basic', 11),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'GATE' LIMIT 1), 'GATE_APTITUDE_DI', 'General Aptitude: Data interpretation', 'General Aptitude', 8, 0.0, 3.5, 'basic', 12),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'GATE' LIMIT 1), 'GATE_MATH_LINEAR', 'Engineering Mathematics: Linear Algebra', 'Engineering Mathematics', 8, 0.0, 6.0, 'moderate', 30),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'GATE' LIMIT 1), 'GATE_MATH_CALC', 'Engineering Mathematics: Calculus', 'Engineering Mathematics', 8, 0.0, 6.0, 'moderate', 31),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'GATE' LIMIT 1), 'GATE_MATH_PROB', 'Engineering Mathematics: Probability & Statistics', 'Engineering Mathematics', 7, 0.0, 5.0, 'moderate', 32),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'GATE' LIMIT 1), 'GATE_MATH_DISCRETE', 'Engineering Mathematics: Discrete Mathematics', 'Engineering Mathematics', 7, 0.0, 5.0, 'moderate', 33),
	-- Core (defaults to a GATE-CS style baseline; extend if you want stream-specific templates)
	((SELECT id FROM public.syllabus_templates WHERE exam = 'GATE' LIMIT 1), 'GATE_CS_DS_ALGO', 'Data Structures & Algorithms', 'Core (CS)', 10, 0.0, 10.0, 'advanced', 50),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'GATE' LIMIT 1), 'GATE_CS_DISCRETE_CORE', 'Discrete Structures (logic, sets, graphs, combinatorics)', 'Core (CS)', 9, 0.0, 8.0, 'advanced', 51),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'GATE' LIMIT 1), 'GATE_CS_COA', 'Computer Organization & Architecture', 'Core (CS)', 8, 0.0, 7.0, 'advanced', 52),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'GATE' LIMIT 1), 'GATE_CS_OS', 'Operating Systems', 'Core (CS)', 9, 0.0, 8.0, 'advanced', 53),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'GATE' LIMIT 1), 'GATE_CS_DBMS', 'DBMS', 'Core (CS)', 9, 0.0, 8.0, 'advanced', 54),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'GATE' LIMIT 1), 'GATE_CS_CN', 'Computer Networks', 'Core (CS)', 8, 0.0, 7.0, 'advanced', 55),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'GATE' LIMIT 1), 'GATE_CS_TOC_COMPILERS', 'Theory of Computation + Compilers (overview)', 'Core (CS)', 7, 0.0, 7.0, 'advanced', 56)
ON CONFLICT (syllabus_id, code)
DO UPDATE SET
	name = EXCLUDED.name,
	subject = EXCLUDED.subject,
	exam_weight = EXCLUDED.exam_weight,
	avg_questions_per_year = EXCLUDED.avg_questions_per_year,
	estimated_hours = EXCLUDED.estimated_hours,
	difficulty = EXCLUDED.difficulty,
	display_order = EXCLUDED.display_order;

-- ============================================================================
-- CAT
-- ============================================================================

INSERT INTO public.syllabus_topics (syllabus_id, code, name, subject, exam_weight, avg_questions_per_year, estimated_hours, difficulty, display_order)
VALUES
	-- VARC
	((SELECT id FROM public.syllabus_templates WHERE exam = 'CAT' LIMIT 1), 'CAT_VARC_RC', 'Reading Comprehension', 'VARC', 10, 0.0, 10.0, 'advanced', 10),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'CAT' LIMIT 1), 'CAT_VARC_VA', 'Verbal Ability: parajumbles, summaries, odd-one-out', 'VARC', 9, 0.0, 8.0, 'advanced', 11),

	-- DILR
	((SELECT id FROM public.syllabus_templates WHERE exam = 'CAT' LIMIT 1), 'CAT_DILR_DI', 'Data Interpretation sets', 'DILR', 10, 0.0, 10.0, 'advanced', 30),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'CAT' LIMIT 1), 'CAT_DILR_LR', 'Logical Reasoning sets', 'DILR', 10, 0.0, 10.0, 'advanced', 31),

	-- Quant
	((SELECT id FROM public.syllabus_templates WHERE exam = 'CAT' LIMIT 1), 'CAT_QA_ARITH', 'Arithmetic: ratio/percentages/TSD/TW/mixtures', 'Quant', 10, 0.0, 10.0, 'advanced', 50),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'CAT' LIMIT 1), 'CAT_QA_ALG', 'Algebra: equations/inequalities/functions', 'Quant', 9, 0.0, 9.0, 'advanced', 51),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'CAT' LIMIT 1), 'CAT_QA_GEOM', 'Geometry + mensuration', 'Quant', 8, 0.0, 8.0, 'advanced', 52),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'CAT' LIMIT 1), 'CAT_QA_NT', 'Number system', 'Quant', 8, 0.0, 7.0, 'advanced', 53),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'CAT' LIMIT 1), 'CAT_QA_MODERN', 'Modern math: P&C, probability, logs, sequences', 'Quant', 8, 0.0, 8.0, 'advanced', 54)
ON CONFLICT (syllabus_id, code)
DO UPDATE SET
	name = EXCLUDED.name,
	subject = EXCLUDED.subject,
	exam_weight = EXCLUDED.exam_weight,
	avg_questions_per_year = EXCLUDED.avg_questions_per_year,
	estimated_hours = EXCLUDED.estimated_hours,
	difficulty = EXCLUDED.difficulty,
	display_order = EXCLUDED.display_order;

-- ============================================================================
-- Banking (IBPS/SBI)
-- ============================================================================

INSERT INTO public.syllabus_topics (syllabus_id, code, name, subject, exam_weight, avg_questions_per_year, estimated_hours, difficulty, display_order)
VALUES
	((SELECT id FROM public.syllabus_templates WHERE exam = 'Banking (IBPS/SBI)' LIMIT 1), 'BANK_QUANT_ARITH', 'Quant: arithmetic + DI', 'Quantitative Aptitude', 10, 0.0, 9.0, 'moderate', 10),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'Banking (IBPS/SBI)' LIMIT 1), 'BANK_REASONING_PUZZLES', 'Reasoning: puzzles + seating', 'Reasoning', 10, 0.0, 10.0, 'moderate', 30),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'Banking (IBPS/SBI)' LIMIT 1), 'BANK_REASONING_MISC', 'Reasoning: syllogism/inequality/blood relations/direction', 'Reasoning', 9, 0.0, 8.0, 'moderate', 31),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'Banking (IBPS/SBI)' LIMIT 1), 'BANK_ENG_RC', 'English: reading comprehension', 'English', 9, 0.0, 7.0, 'moderate', 50),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'Banking (IBPS/SBI)' LIMIT 1), 'BANK_ENG_GRAM', 'English: grammar + error spotting', 'English', 9, 0.0, 7.0, 'basic', 51),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'Banking (IBPS/SBI)' LIMIT 1), 'BANK_GA_CURRENT', 'General Awareness: current affairs', 'General Awareness', 10, 0.0, 8.0, 'basic', 70),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'Banking (IBPS/SBI)' LIMIT 1), 'BANK_GA_BANKING', 'Banking awareness (terms, RBI, basics)', 'General Awareness', 8, 0.0, 6.0, 'basic', 71),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'Banking (IBPS/SBI)' LIMIT 1), 'BANK_COMP', 'Computer awareness (basics)', 'Computer Awareness', 6, 0.0, 4.0, 'basic', 90)
ON CONFLICT (syllabus_id, code)
DO UPDATE SET
	name = EXCLUDED.name,
	subject = EXCLUDED.subject,
	exam_weight = EXCLUDED.exam_weight,
	avg_questions_per_year = EXCLUDED.avg_questions_per_year,
	estimated_hours = EXCLUDED.estimated_hours,
	difficulty = EXCLUDED.difficulty,
	display_order = EXCLUDED.display_order;

-- ============================================================================
-- CA Foundation/Inter/Final (baseline)
-- ============================================================================

INSERT INTO public.syllabus_topics (syllabus_id, code, name, subject, exam_weight, avg_questions_per_year, estimated_hours, difficulty, display_order)
VALUES
	((SELECT id FROM public.syllabus_templates WHERE exam = 'CA Foundation/Inter/Final' LIMIT 1), 'CA_ACC', 'Accounting (core concepts + practice)', 'Accounting', 10, 0.0, 12.0, 'advanced', 10),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'CA Foundation/Inter/Final' LIMIT 1), 'CA_LAW', 'Business Laws (overview)', 'Law', 9, 0.0, 10.0, 'advanced', 30),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'CA Foundation/Inter/Final' LIMIT 1), 'CA_ECO', 'Business Economics (overview)', 'Economics', 8, 0.0, 9.0, 'advanced', 50),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'CA Foundation/Inter/Final' LIMIT 1), 'CA_MATHS_STATS_LR', 'Maths/Stats/LR (overview)', 'Quantitative Aptitude', 8, 0.0, 9.0, 'advanced', 70)
ON CONFLICT (syllabus_id, code)
DO UPDATE SET
	name = EXCLUDED.name,
	subject = EXCLUDED.subject,
	exam_weight = EXCLUDED.exam_weight,
	avg_questions_per_year = EXCLUDED.avg_questions_per_year,
	estimated_hours = EXCLUDED.estimated_hours,
	difficulty = EXCLUDED.difficulty,
	display_order = EXCLUDED.display_order;

-- ============================================================================
-- CLAT
-- ============================================================================

INSERT INTO public.syllabus_topics (syllabus_id, code, name, subject, exam_weight, avg_questions_per_year, estimated_hours, difficulty, display_order)
VALUES
	((SELECT id FROM public.syllabus_templates WHERE exam = 'CLAT' LIMIT 1), 'CLAT_ENG_RC', 'English: reading comprehension', 'English', 10, 0.0, 10.0, 'advanced', 10),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'CLAT' LIMIT 1), 'CLAT_GK_CA', 'GK + Current Affairs', 'Current Affairs', 10, 0.0, 10.0, 'moderate', 30),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'CLAT' LIMIT 1), 'CLAT_LEGAL', 'Legal Reasoning', 'Legal Reasoning', 10, 0.0, 10.0, 'advanced', 50),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'CLAT' LIMIT 1), 'CLAT_LOGICAL', 'Logical Reasoning', 'Logical Reasoning', 9, 0.0, 9.0, 'advanced', 70),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'CLAT' LIMIT 1), 'CLAT_QUANT', 'Quantitative Techniques (basics + DI)', 'Quant', 7, 0.0, 6.0, 'moderate', 90)
ON CONFLICT (syllabus_id, code)
DO UPDATE SET
	name = EXCLUDED.name,
	subject = EXCLUDED.subject,
	exam_weight = EXCLUDED.exam_weight,
	avg_questions_per_year = EXCLUDED.avg_questions_per_year,
	estimated_hours = EXCLUDED.estimated_hours,
	difficulty = EXCLUDED.difficulty,
	display_order = EXCLUDED.display_order;

-- ============================================================================
-- NDA
-- ============================================================================

INSERT INTO public.syllabus_topics (syllabus_id, code, name, subject, exam_weight, avg_questions_per_year, estimated_hours, difficulty, display_order)
VALUES
	((SELECT id FROM public.syllabus_templates WHERE exam = 'NDA' LIMIT 1), 'NDA_MATH_ALG', 'Mathematics: algebra + functions', 'Mathematics', 9, 0.0, 8.0, 'moderate', 10),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'NDA' LIMIT 1), 'NDA_MATH_TRIG', 'Mathematics: trigonometry', 'Mathematics', 9, 0.0, 8.0, 'moderate', 11),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'NDA' LIMIT 1), 'NDA_MATH_CALC', 'Mathematics: calculus basics', 'Mathematics', 7, 0.0, 7.0, 'moderate', 12),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'NDA' LIMIT 1), 'NDA_GAT_ENG', 'General Ability: English', 'English', 8, 0.0, 6.0, 'moderate', 30),
	((SELECT id FROM public.syllabus_templates WHERE exam = 'NDA' LIMIT 1), 'NDA_GAT_GK', 'General Ability: GK (history, geo, polity, science)', 'General Knowledge', 9, 0.0, 9.0, 'basic', 31)
ON CONFLICT (syllabus_id, code)
DO UPDATE SET
	name = EXCLUDED.name,
	subject = EXCLUDED.subject,
	exam_weight = EXCLUDED.exam_weight,
	avg_questions_per_year = EXCLUDED.avg_questions_per_year,
	estimated_hours = EXCLUDED.estimated_hours,
	difficulty = EXCLUDED.difficulty,
	display_order = EXCLUDED.display_order;

-- ============================================================================
-- OTHER (empty skeleton)
-- ============================================================================

INSERT INTO public.syllabus_topics (syllabus_id, code, name, subject, exam_weight, avg_questions_per_year, estimated_hours, difficulty, display_order)
VALUES
	((SELECT id FROM public.syllabus_templates WHERE exam = 'Other' LIMIT 1), 'OTHER_DEFINE', 'Define your exam syllabus topics here', 'Other', 5, 0.0, 1.0, 'basic', 10)
ON CONFLICT (syllabus_id, code)
DO UPDATE SET
	name = EXCLUDED.name,
	subject = EXCLUDED.subject,
	exam_weight = EXCLUDED.exam_weight,
	avg_questions_per_year = EXCLUDED.avg_questions_per_year,
	estimated_hours = EXCLUDED.estimated_hours,
	difficulty = EXCLUDED.difficulty,
	display_order = EXCLUDED.display_order;

-- ============================================================================
-- PART Z: Recompute total_topics
-- ============================================================================

UPDATE public.syllabus_templates st
SET
	total_topics = (
		SELECT COUNT(*)
		FROM public.syllabus_topics t
		WHERE t.syllabus_id = st.id
	),
	updated_at = NOW()
WHERE st.exam IN (
	'UPSC Civil Services',
	'JEE Main/Advanced',
	'NEET UG',
	'SSC CGL/CHSL',
	'GATE',
	'CAT',
	'Banking (IBPS/SBI)',
	'CA Foundation/Inter/Final',
	'CLAT',
	'NDA',
	'Other'
);

COMMIT;
