-- Mistake Intelligence System (MIS)
-- Run after 004_preparation_state_system.sql
-- Goal: turn test mistakes into ranked score-recovery opportunities.

-- ============================================================================
-- PART 1: Extend mock_tests / mock_mistakes to match MIS spec
-- ============================================================================

-- Tests: add test_type
ALTER TABLE public.mock_tests
  ADD COLUMN IF NOT EXISTS test_type TEXT;

ALTER TABLE public.mock_tests
  DROP CONSTRAINT IF EXISTS mock_tests_test_type_check;

ALTER TABLE public.mock_tests
  ADD CONSTRAINT mock_tests_test_type_check
  CHECK (test_type IS NULL OR test_type IN ('mock', 'sectional', 'pyq'));

CREATE INDEX IF NOT EXISTS idx_mock_tests_user_date ON public.mock_tests(user_id, test_date DESC);

-- Mistakes: add avoidability + optional fields
ALTER TABLE public.mock_mistakes
  ADD COLUMN IF NOT EXISTS avoidability TEXT;

ALTER TABLE public.mock_mistakes
  ADD COLUMN IF NOT EXISTS confidence_level TEXT;

ALTER TABLE public.mock_mistakes
  ADD COLUMN IF NOT EXISTS repeated BOOLEAN;

ALTER TABLE public.mock_mistakes
  DROP CONSTRAINT IF EXISTS mock_mistakes_avoidability_check;

ALTER TABLE public.mock_mistakes
  ADD CONSTRAINT mock_mistakes_avoidability_check
  CHECK (avoidability IS NULL OR avoidability IN ('easily', 'possibly', 'hard'));

ALTER TABLE public.mock_mistakes
  DROP CONSTRAINT IF EXISTS mock_mistakes_confidence_level_check;

ALTER TABLE public.mock_mistakes
  ADD CONSTRAINT mock_mistakes_confidence_level_check
  CHECK (confidence_level IS NULL OR confidence_level IN ('high', 'medium', 'low'));

-- Expand mistake_type to MIS list (keeping existing values for backward compat)
ALTER TABLE public.mock_mistakes
  DROP CONSTRAINT IF EXISTS mock_mistakes_mistake_type_check;

ALTER TABLE public.mock_mistakes
  ADD CONSTRAINT mock_mistakes_mistake_type_check
  CHECK (mistake_type IN (
    'concept',
    'memory',
    'calculation',
    'misread',
    'time-pressure',
    'strategy',
    'silly',
    'unknown'
  ));

CREATE INDEX IF NOT EXISTS idx_mock_mistakes_user_created ON public.mock_mistakes(user_id, created_at DESC);

-- ============================================================================
-- PART 2: Derived views (patterns + mark leaks)
-- ============================================================================

-- IMPORTANT: Postgres does not allow CREATE OR REPLACE VIEW to rename/reorder columns.
-- When iterating on MIS locally (or re-running in SQL editor), drop dependent views first.
DROP VIEW IF EXISTS public.mark_leak_estimates;
DROP VIEW IF EXISTS public.mistake_patterns;

-- View: mistake_patterns
-- Aggregates by (user, subject, topic, mistake_type) with fixability and recency.
CREATE OR REPLACE VIEW public.mistake_patterns
WITH (security_invoker = true)
AS
WITH ranked_tests AS (
  SELECT
    t.*,
    ROW_NUMBER() OVER (PARTITION BY t.user_id ORDER BY t.test_date DESC, t.created_at DESC) AS rn
  FROM public.mock_tests t
),
recent_tests AS (
  -- Last N tests per user (N=10; tweakable without schema change)
  SELECT * FROM ranked_tests WHERE rn <= 10
),
base AS (
  SELECT
    m.user_id,
    st.subject,
    st.name AS topic,
    m.mistake_type,
    t.test_date,
    m.avoidability,
    m.marks_lost,
    m.created_at
  FROM public.mock_mistakes m
  JOIN recent_tests t ON t.id = m.mock_id
  JOIN public.syllabus_topics st ON st.id = m.topic_id
)
SELECT
  user_id,
  subject,
  topic,
  mistake_type,
  COUNT(*)::int AS frequency,
  COUNT(*) FILTER (WHERE avoidability IN ('easily', 'possibly'))::int AS avoidable_count,
  MAX(test_date)::timestamptz AS last_seen_at,
  SUM(marks_lost)::numeric AS total_marks_lost,
  -- Fixability score: avg avoidability weights
  COALESCE(AVG(
    CASE avoidability
      WHEN 'easily' THEN 1.0
      WHEN 'possibly' THEN 0.6
      WHEN 'hard' THEN 0.2
      ELSE 0.6
    END
  )::numeric, 0.6) AS fixability_score,
  -- Recency multiplier: sharper emphasis near the end
  CASE
    WHEN (CURRENT_DATE - MAX(test_date)) <= 7 THEN 1.30
    WHEN (CURRENT_DATE - MAX(test_date)) <= 14 THEN 1.15
    ELSE 1.00
  END::numeric AS recency_multiplier
FROM base
GROUP BY user_id, subject, topic, mistake_type;

-- View: mark_leak_estimates
-- Converts patterns into estimated marks lost + ranks by priority score.
CREATE OR REPLACE VIEW public.mark_leak_estimates
WITH (security_invoker = true)
AS
WITH scored AS (
  SELECT
    mp.user_id,
    mp.subject,
    mp.topic,
    mp.mistake_type,
    mp.frequency,
    mp.avoidable_count,
    mp.last_seen_at,
    mp.fixability_score,
    COALESCE(mp.total_marks_lost, 0)::numeric AS estimated_marks_lost,
    COALESCE(mp.total_marks_lost, 0)
      * mp.fixability_score
      * mp.recency_multiplier AS priority_score
  FROM public.mistake_patterns mp
)
SELECT
  user_id,
  subject,
  topic,
  mistake_type,
  frequency,
  avoidable_count,
  last_seen_at,
  estimated_marks_lost,
  fixability_score,
  DENSE_RANK() OVER (PARTITION BY user_id ORDER BY priority_score DESC) AS priority_rank
FROM scored;

GRANT SELECT ON public.mistake_patterns TO authenticated;
GRANT SELECT ON public.mark_leak_estimates TO authenticated;
