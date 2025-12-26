-- Mistake Intelligence System (MIS)
-- Trend signals (lightweight, no charts)
-- Run after 005_mistake_intelligence_system.sql

-- This view highlights patterns getting worse in the most recent tests.
-- It compares the most recent 3 tests vs the prior 7 tests (within last 10).

DROP VIEW IF EXISTS public.mistake_trend_signals;

CREATE OR REPLACE VIEW public.mistake_trend_signals
WITH (security_invoker = true)
AS
WITH ranked_tests AS (
  SELECT
    t.id,
    t.user_id,
    t.test_date,
    ROW_NUMBER() OVER (PARTITION BY t.user_id ORDER BY t.test_date DESC, t.created_at DESC) AS rn
  FROM public.mock_tests t
),
recent_tests AS (
  SELECT * FROM ranked_tests WHERE rn <= 10
),
scoped_mistakes AS (
  SELECT
    m.user_id,
    st.subject,
    st.name AS topic,
    m.mistake_type,
    rt.rn,
    rt.test_date,
    m.avoidability,
    m.marks_lost
  FROM public.mock_mistakes m
  JOIN recent_tests rt ON rt.id = m.mock_id
  JOIN public.syllabus_topics st ON st.id = m.topic_id
),
aggr AS (
  SELECT
    user_id,
    subject,
    topic,
    mistake_type,
    COUNT(*) FILTER (WHERE rn <= 3)::int AS recent_count,
    COUNT(*) FILTER (WHERE rn > 3 AND rn <= 10)::int AS previous_count,
    SUM(marks_lost) FILTER (WHERE rn <= 3)::numeric AS recent_marks_lost,
    SUM(marks_lost) FILTER (WHERE rn > 3 AND rn <= 10)::numeric AS previous_marks_lost,
    COUNT(*) FILTER (WHERE rn <= 3 AND avoidability IN ('easily', 'possibly'))::int AS recent_avoidable,
    MAX(test_date)::timestamptz AS last_seen_at
  FROM scoped_mistakes
  GROUP BY user_id, subject, topic, mistake_type
)
SELECT
  user_id,
  subject,
  topic,
  mistake_type,
  recent_count,
  previous_count,
  COALESCE(recent_marks_lost, 0)::numeric AS recent_marks_lost,
  COALESCE(previous_marks_lost, 0)::numeric AS previous_marks_lost,
  (recent_count - previous_count)::int AS count_delta,
  (COALESCE(recent_marks_lost, 0) - COALESCE(previous_marks_lost, 0))::numeric AS marks_delta,
  recent_avoidable,
  last_seen_at,
  CASE
    WHEN recent_count >= 2 AND recent_count > previous_count THEN 'rising'
    WHEN recent_count = 0 AND previous_count > 0 THEN 'falling'
    ELSE 'flat'
  END AS trend
FROM aggr;

GRANT SELECT ON public.mistake_trend_signals TO authenticated;
