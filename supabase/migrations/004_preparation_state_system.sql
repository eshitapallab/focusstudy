-- Preparation State System (The Real Value)
-- Run after 003_studytrack_enhancements.sql

-- ============================================================================
-- PART 1: CANONICAL SYLLABUS STRUCTURE (Exam-agnostic foundation)
-- ============================================================================

-- Master syllabus registry (one per exam)
CREATE TABLE IF NOT EXISTS public.syllabus_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam TEXT NOT NULL UNIQUE, -- 'UPSC Civil Services', 'JEE Main', etc.
  version TEXT NOT NULL DEFAULT '1.0',
  total_topics INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Atomic syllabus units (the decomposition)
CREATE TABLE IF NOT EXISTS public.syllabus_topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  syllabus_id UUID NOT NULL REFERENCES public.syllabus_templates(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.syllabus_topics(id) ON DELETE CASCADE, -- For hierarchical topics
  
  -- Topic identity
  code TEXT NOT NULL, -- 'POLITY_PARL_POWERS', 'JEE_MATH_CALC_LIMITS'
  name TEXT NOT NULL, -- 'Parliament Powers', 'Limits and Continuity'
  subject TEXT NOT NULL, -- 'Polity', 'Mathematics'
  
  -- Exam relevance (THIS IS KEY VALUE)
  exam_weight INTEGER NOT NULL DEFAULT 1, -- 1-10 scale (how often this appears)
  avg_questions_per_year DECIMAL(3,1) DEFAULT 0, -- Historical frequency
  last_asked_year INTEGER, -- Track recency
  
  -- Learning metadata
  estimated_hours DECIMAL(3,1) DEFAULT 1.0, -- Time to master
  difficulty TEXT CHECK (difficulty IN ('basic', 'moderate', 'advanced')),
  prerequisites TEXT[], -- Topic codes that should be done first
  
  -- Ordering
  display_order INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(syllabus_id, code)
);

-- ============================================================================
-- PART 2: STUDENT PREPAREDNESS MATRIX (Personal diagnosis)
-- ============================================================================

-- Student's preparation state for each topic
CREATE TABLE IF NOT EXISTS public.topic_preparedness (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES public.syllabus_topics(id) ON DELETE CASCADE,
  
  -- 4-state preparedness
  state TEXT NOT NULL CHECK (state IN ('strong', 'shaky', 'weak', 'untouched')),
  -- strong = 🟢 Can answer exam questions confidently
  -- shaky = 🟡 Understands but can't reproduce under pressure
  -- weak = 🔴 Read but weak/confused
  -- untouched = ⚪ Not covered yet
  
  -- Confidence tracking
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  last_revised_at TIMESTAMPTZ,
  revision_count INTEGER NOT NULL DEFAULT 0,
  
  -- Decay tracking (realistic forgetting) - computed at query time, not stored
  -- days_since_revision is calculated in RPC functions using EXTRACT(DAY FROM NOW() - last_revised_at)
  
  -- State change history
  state_changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  previous_state TEXT,
  
  -- Lock state during active revision
  locked_until TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id, topic_id)
);

-- ============================================================================
-- PART 3: MOCK TEST INTEGRATION (Learn from mistakes)
-- ============================================================================

-- Mock test tracking (external, we don't host)
CREATE TABLE IF NOT EXISTS public.mock_tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  test_name TEXT NOT NULL,
  test_date DATE NOT NULL,
  total_marks INTEGER,
  scored_marks INTEGER,
  percentile DECIMAL(5,2),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Mistakes mapped to topics
CREATE TABLE IF NOT EXISTS public.mock_mistakes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mock_id UUID NOT NULL REFERENCES public.mock_tests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES public.syllabus_topics(id) ON DELETE CASCADE,
  
  -- Mistake classification
  mistake_type TEXT NOT NULL CHECK (mistake_type IN ('concept', 'memory', 'silly', 'time-pressure', 'unknown')),
  
  -- Impact
  marks_lost INTEGER NOT NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- PART 4: DAILY ACTIVITY (Repurposed for topic updates, not time)
-- ============================================================================

-- Daily topic revision log (lightweight)
CREATE TABLE IF NOT EXISTS public.daily_topic_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES public.syllabus_topics(id) ON DELETE CASCADE,
  
  date DATE NOT NULL,
  
  -- Simple recall check
  could_recall BOOLEAN NOT NULL,
  
  -- Optional: time spent (de-emphasized)
  minutes_spent INTEGER,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id, topic_id, date)
);

-- ============================================================================
-- PART 5: INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_syllabus_topics_exam ON public.syllabus_topics(syllabus_id, subject);
CREATE INDEX IF NOT EXISTS idx_syllabus_topics_weight ON public.syllabus_topics(exam_weight DESC);
CREATE INDEX IF NOT EXISTS idx_topic_prep_user_state ON public.topic_preparedness(user_id, state);
CREATE INDEX IF NOT EXISTS idx_topic_prep_last_revised ON public.topic_preparedness(user_id, last_revised_at) WHERE last_revised_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mock_mistakes_topic ON public.mock_mistakes(user_id, topic_id);
CREATE INDEX IF NOT EXISTS idx_daily_topic_activity_user_date ON public.daily_topic_activity(user_id, date DESC);

-- ============================================================================
-- PART 6: ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.syllabus_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.syllabus_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_preparedness ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_mistakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_topic_activity ENABLE ROW LEVEL SECURITY;

-- Syllabus is public read (everyone can see canonical structure)
DROP POLICY IF EXISTS "Anyone can view syllabus templates" ON public.syllabus_templates;
DROP POLICY IF EXISTS "Anyone can view syllabus topics" ON public.syllabus_topics;

CREATE POLICY "Anyone can view syllabus templates"
  ON public.syllabus_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can view syllabus topics"
  ON public.syllabus_topics FOR SELECT
  TO authenticated
  USING (true);

-- Personal preparedness is private
DROP POLICY IF EXISTS "Users can view own preparedness" ON public.topic_preparedness;
DROP POLICY IF EXISTS "Users can manage own preparedness" ON public.topic_preparedness;

CREATE POLICY "Users can view own preparedness"
  ON public.topic_preparedness FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own preparedness"
  ON public.topic_preparedness FOR ALL
  USING (auth.uid() = user_id);

-- Mock tests and mistakes
DROP POLICY IF EXISTS "Users can manage own mocks" ON public.mock_tests;
DROP POLICY IF EXISTS "Users can manage own mistakes" ON public.mock_mistakes;

CREATE POLICY "Users can manage own mocks"
  ON public.mock_tests FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own mistakes"
  ON public.mock_mistakes FOR ALL
  USING (auth.uid() = user_id);

-- Daily activity
DROP POLICY IF EXISTS "Users can manage own topic activity" ON public.daily_topic_activity;

CREATE POLICY "Users can manage own topic activity"
  ON public.daily_topic_activity FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================================
-- PART 7: PREPARATION STATE ENGINE (RPC Functions for diagnostics)
-- ============================================================================

-- Function 1: Get True Syllabus Coverage
CREATE OR REPLACE FUNCTION public.get_syllabus_coverage(p_user_id UUID)
RETURNS TABLE(
  total_topics INTEGER,
  strong_count INTEGER,
  shaky_count INTEGER,
  weak_count INTEGER,
  untouched_count INTEGER,
  strong_pct DECIMAL(5,2),
  shaky_pct DECIMAL(5,2),
  weak_pct DECIMAL(5,2),
  untouched_pct DECIMAL(5,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total INTEGER;
  strong INTEGER;
  shaky INTEGER;
  weak INTEGER;
  untouched INTEGER;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT 
    COUNT(*) INTO total
  FROM public.topic_preparedness
  WHERE user_id = p_user_id;

  IF total = 0 THEN
    RETURN QUERY SELECT 0, 0, 0, 0, 0, 0.0, 0.0, 0.0, 0.0;
    RETURN;
  END IF;

  SELECT
    COUNT(*) FILTER (WHERE state = 'strong'),
    COUNT(*) FILTER (WHERE state = 'shaky'),
    COUNT(*) FILTER (WHERE state = 'weak'),
    COUNT(*) FILTER (WHERE state = 'untouched')
  INTO strong, shaky, weak, untouched
  FROM public.topic_preparedness
  WHERE user_id = p_user_id;

  RETURN QUERY SELECT
    total,
    strong,
    shaky,
    weak,
    untouched,
    ROUND((strong::DECIMAL / total) * 100, 2),
    ROUND((shaky::DECIMAL / total) * 100, 2),
    ROUND((weak::DECIMAL / total) * 100, 2),
    ROUND((untouched::DECIMAL / total) * 100, 2);
END;
$$;

-- Function 2: Get High-Yield Weaknesses (marks leak detector)
CREATE OR REPLACE FUNCTION public.get_high_yield_weaknesses(p_user_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE(
  topic_id UUID,
  topic_name TEXT,
  subject TEXT,
  state TEXT,
  exam_weight INTEGER,
  avg_questions DECIMAL(3,1),
  estimated_hours DECIMAL(3,1),
  priority_score DECIMAL(5,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    t.id,
    t.name,
    t.subject,
    tp.state,
    t.exam_weight,
    t.avg_questions_per_year,
    t.estimated_hours,
    -- Priority score: (exam_weight * weakness_multiplier) / time_cost
    ROUND(
      (t.exam_weight * 
        CASE tp.state
          WHEN 'weak' THEN 3.0
          WHEN 'shaky' THEN 2.0
          WHEN 'untouched' THEN 1.5
          ELSE 0.0
        END
      ) / NULLIF(t.estimated_hours, 0),
      2
    ) AS priority_score
  FROM public.topic_preparedness tp
  JOIN public.syllabus_topics t ON tp.topic_id = t.id
  WHERE tp.user_id = p_user_id
    AND tp.state IN ('weak', 'shaky', 'untouched')
  ORDER BY priority_score DESC
  LIMIT p_limit;
END;
$$;

-- Function 3: Get Revision ROI Ranking (fastest mark gains)
CREATE OR REPLACE FUNCTION public.get_revision_roi_ranking(p_user_id UUID, p_available_hours DECIMAL DEFAULT 20)
RETURNS TABLE(
  topic_id UUID,
  topic_name TEXT,
  subject TEXT,
  current_state TEXT,
  exam_weight INTEGER,
  estimated_hours DECIMAL(3,1),
  potential_marks_gain DECIMAL(5,2),
  roi_score DECIMAL(5,2),
  fits_in_time BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    t.id,
    t.name,
    t.subject,
    tp.state,
    t.exam_weight,
    t.estimated_hours,
    -- Potential marks = exam_weight * avg_questions * state_multiplier
    ROUND(
      t.exam_weight * t.avg_questions_per_year *
      CASE tp.state
        WHEN 'weak' THEN 0.8
        WHEN 'shaky' THEN 0.5
        WHEN 'untouched' THEN 0.3
        ELSE 0.0
      END,
      2
    ) AS potential_marks_gain,
    -- ROI = potential_marks / hours_needed
    ROUND(
      (t.exam_weight * t.avg_questions_per_year *
        CASE tp.state
          WHEN 'weak' THEN 0.8
          WHEN 'shaky' THEN 0.5
          WHEN 'untouched' THEN 0.3
          ELSE 0.0
        END
      ) / NULLIF(t.estimated_hours, 0),
      2
    ) AS roi_score,
    t.estimated_hours <= p_available_hours AS fits_in_time
  FROM public.topic_preparedness tp
  JOIN public.syllabus_topics t ON tp.topic_id = t.id
  WHERE tp.user_id = p_user_id
    AND tp.state != 'strong'
  ORDER BY roi_score DESC;
END;
$$;

-- Function 4: Update topic state with decay logic
CREATE OR REPLACE FUNCTION public.update_topic_state(
  p_user_id UUID,
  p_topic_id UUID,
  p_new_state TEXT,
  p_could_recall BOOLEAN DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_state TEXT;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Get current state
  SELECT state INTO current_state
  FROM public.topic_preparedness
  WHERE user_id = p_user_id AND topic_id = p_topic_id;

  -- If recall check provided, auto-adjust state
  IF p_could_recall IS NOT NULL THEN
    IF p_could_recall = true THEN
      -- Good recall: upgrade state
      p_new_state := CASE current_state
        WHEN 'weak' THEN 'shaky'
        WHEN 'shaky' THEN 'strong'
        WHEN 'untouched' THEN 'shaky'
        ELSE current_state
      END;
    ELSE
      -- Bad recall: downgrade state
      p_new_state := CASE current_state
        WHEN 'strong' THEN 'shaky'
        WHEN 'shaky' THEN 'weak'
        ELSE current_state
      END;
    END IF;
  END IF;

  -- Update state
  UPDATE public.topic_preparedness
  SET
    state = p_new_state,
    previous_state = current_state,
    state_changed_at = NOW(),
    last_revised_at = NOW(),
    revision_count = revision_count + 1,
    updated_at = NOW()
  WHERE user_id = p_user_id AND topic_id = p_topic_id;

  -- Log activity
  INSERT INTO public.daily_topic_activity (user_id, topic_id, date, could_recall)
  VALUES (p_user_id, p_topic_id, CURRENT_DATE, p_could_recall)
  ON CONFLICT (user_id, topic_id, date) DO UPDATE
  SET could_recall = EXCLUDED.could_recall;
END;
$$;

-- Function 5: Apply confidence decay (run daily via cron)
CREATE OR REPLACE FUNCTION public.apply_confidence_decay()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Decay logic: topics not revised in X days lose confidence
  -- Compute days_since_revision on the fly
  UPDATE public.topic_preparedness
  SET
    state = CASE
      WHEN state = 'strong' AND last_revised_at IS NOT NULL 
        AND EXTRACT(DAY FROM NOW() - last_revised_at) > 30 THEN 'shaky'
      WHEN state = 'shaky' AND last_revised_at IS NOT NULL 
        AND EXTRACT(DAY FROM NOW() - last_revised_at) > 21 THEN 'weak'
      ELSE state
    END,
    updated_at = NOW()
  WHERE last_revised_at IS NOT NULL
    AND (
      (state = 'strong' AND EXTRACT(DAY FROM NOW() - last_revised_at) > 30) OR
      (state = 'shaky' AND EXTRACT(DAY FROM NOW() - last_revised_at) > 21)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_syllabus_coverage(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_high_yield_weaknesses(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_revision_roi_ranking(UUID, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_topic_state(UUID, UUID, TEXT, BOOLEAN) TO authenticated;

-- Helper function to compute days since revision for UI display
CREATE OR REPLACE FUNCTION public.get_days_since_revision(p_last_revised_at TIMESTAMPTZ)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT 
    CASE 
      WHEN p_last_revised_at IS NULL THEN NULL
      ELSE EXTRACT(DAY FROM NOW() - p_last_revised_at)::INTEGER
    END;
$$;

GRANT EXECUTE ON FUNCTION public.get_days_since_revision(TIMESTAMPTZ) TO authenticated;

-- ============================================================================
-- PART 8: INTEGRATION WITH EXISTING SYSTEM
-- ============================================================================

-- Link old daily_check_ins to new topic system (backward compatibility)
ALTER TABLE public.daily_check_ins
  ADD COLUMN IF NOT EXISTS topic_id UUID REFERENCES public.syllabus_topics(id);

-- Link old verdicts to preparedness state
ALTER TABLE public.verdicts
  ADD COLUMN IF NOT EXISTS preparedness_snapshot JSONB; -- Store coverage at time of verdict

-- Deprecate columns (but keep for migration period)
-- We're shifting from time-tracking to state-tracking
-- Keep study_minutes but make it optional
ALTER TABLE public.daily_check_ins
  ALTER COLUMN minutes_studied DROP NOT NULL;
