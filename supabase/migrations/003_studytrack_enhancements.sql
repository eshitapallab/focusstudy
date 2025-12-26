-- StudyTrack Enhancements - Layer 1-5 Features
-- Run this after 002_studytrack_schema.sql

-- LAYER 1: Attractiveness Features

-- Add tone preference to users
ALTER TABLE public.study_users
  ADD COLUMN IF NOT EXISTS tone_preference TEXT NOT NULL DEFAULT 'calm' CHECK (tone_preference IN ('calm', 'direct', 'coach'));

-- Add pause/exit respect tracking
ALTER TABLE public.study_users
  ADD COLUMN IF NOT EXISTS paused_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pause_reason TEXT;

-- Add narrative to weekly reality
ALTER TABLE public.weekly_reality
  ADD COLUMN IF NOT EXISTS summary_narrative TEXT,
  ADD COLUMN IF NOT EXISTS progress_metaphor TEXT;

-- LAYER 2: Useful Features

-- Focus quality checks (time honesty calibration)
CREATE TABLE IF NOT EXISTS public.focus_quality_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  stated_hours DECIMAL(4,2) NOT NULL,
  focus_level TEXT NOT NULL CHECK (focus_level IN ('deep', 'mixed', 'distracted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Recovery paths (after inactivity)
CREATE TABLE IF NOT EXISTS public.recovery_paths (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  days_inactive INTEGER NOT NULL,
  recommended_days INTEGER NOT NULL,
  daily_minutes INTEGER NOT NULL,
  accepted BOOLEAN NOT NULL DEFAULT false
);

-- Decision relief mode tracking
ALTER TABLE public.micro_actions
  ADD COLUMN IF NOT EXISTS decision_relief_mode BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cognitive_load TEXT CHECK (cognitive_load IN ('low', 'medium', 'high'));

-- LAYER 3: Feature Richness

-- Truth Index tracking
ALTER TABLE public.study_users
  ADD COLUMN IF NOT EXISTS truth_index INTEGER DEFAULT 100 CHECK (truth_index >= 0 AND truth_index <= 100),
  ADD COLUMN IF NOT EXISTS truth_index_updated_at TIMESTAMPTZ;

-- Verdict change explanations
CREATE TABLE IF NOT EXISTS public.verdict_changes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  from_status TEXT NOT NULL,
  to_status TEXT NOT NULL,
  reasons TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Silent wins tracking
CREATE TABLE IF NOT EXISTS public.silent_wins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  win_type TEXT NOT NULL,
  description TEXT NOT NULL,
  shown BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- LAYER 4: Social Features

-- Mentor sharing (read-only)
CREATE TABLE IF NOT EXISTS public.mentor_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_code TEXT NOT NULL UNIQUE,
  mentor_name TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  last_viewed_at TIMESTAMPTZ
);

-- Benchmark tracking (anonymous)
CREATE TABLE IF NOT EXISTS public.cohort_benchmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam TEXT NOT NULL,
  month_start DATE NOT NULL,
  avg_recall_improvement DECIMAL(5,2),
  avg_consistency_improvement DECIMAL(5,2),
  participant_count INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(exam, month_start)
);

-- LAYER 5: Polish Features

-- Onboarding progress
ALTER TABLE public.study_users
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS zero_state_viewed BOOLEAN NOT NULL DEFAULT false;

-- Create indexes for new tables
CREATE INDEX IF NOT EXISTS idx_focus_quality_user_date ON public.focus_quality_checks(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_recovery_paths_user ON public.recovery_paths(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_verdict_changes_user_date ON public.verdict_changes(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_silent_wins_user_shown ON public.silent_wins(user_id, shown, date DESC);
CREATE INDEX IF NOT EXISTS idx_mentor_shares_code ON public.mentor_shares(share_code) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_cohort_benchmarks_exam_month ON public.cohort_benchmarks(exam, month_start DESC);

-- Row Level Security for new tables
ALTER TABLE public.focus_quality_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recovery_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verdict_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.silent_wins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cohort_benchmarks ENABLE ROW LEVEL SECURITY;

-- Policies for new tables
DROP POLICY IF EXISTS "Users can view own focus quality checks" ON public.focus_quality_checks;
DROP POLICY IF EXISTS "Users can insert own focus quality checks" ON public.focus_quality_checks;
DROP POLICY IF EXISTS "Users can view own recovery paths" ON public.recovery_paths;
DROP POLICY IF EXISTS "Users can insert own recovery paths" ON public.recovery_paths;
DROP POLICY IF EXISTS "Users can update own recovery paths" ON public.recovery_paths;
DROP POLICY IF EXISTS "Users can view own verdict changes" ON public.verdict_changes;
DROP POLICY IF EXISTS "Users can insert own verdict changes" ON public.verdict_changes;
DROP POLICY IF EXISTS "Users can view own silent wins" ON public.silent_wins;
DROP POLICY IF EXISTS "Users can insert own silent wins" ON public.silent_wins;
DROP POLICY IF EXISTS "Users can update own silent wins" ON public.silent_wins;
DROP POLICY IF EXISTS "Users can view own mentor shares" ON public.mentor_shares;
DROP POLICY IF EXISTS "Users can manage own mentor shares" ON public.mentor_shares;
DROP POLICY IF EXISTS "Anyone can view cohort benchmarks" ON public.cohort_benchmarks;

CREATE POLICY "Users can view own focus quality checks"
  ON public.focus_quality_checks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own focus quality checks"
  ON public.focus_quality_checks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own recovery paths"
  ON public.recovery_paths FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recovery paths"
  ON public.recovery_paths FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recovery paths"
  ON public.recovery_paths FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own verdict changes"
  ON public.verdict_changes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own verdict changes"
  ON public.verdict_changes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own silent wins"
  ON public.silent_wins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own silent wins"
  ON public.silent_wins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own silent wins"
  ON public.silent_wins FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own mentor shares"
  ON public.mentor_shares FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own mentor shares"
  ON public.mentor_shares FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view cohort benchmarks"
  ON public.cohort_benchmarks FOR SELECT
  TO authenticated
  USING (true);

-- Helper functions

-- Generate mentor share code
CREATE OR REPLACE FUNCTION public.create_mentor_share(p_mentor_name TEXT, p_expires_days INTEGER DEFAULT 90)
RETURNS TABLE(share_code TEXT, expires_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  code TEXT;
  exp_date TIMESTAMPTZ;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Generate unique 12-char code
  code := substring(replace(uuid_generate_v4()::text, '-', ''), 1, 12);
  code := 'M-' || upper(code);
  
  exp_date := NOW() + (p_expires_days || ' days')::INTERVAL;

  INSERT INTO public.mentor_shares (user_id, share_code, mentor_name, expires_at)
  VALUES (auth.uid(), code, p_mentor_name, exp_date);

  share_code := code;
  expires_at := exp_date;
  RETURN NEXT;
END;
$$;

-- Get mentor view (read-only summary)
CREATE OR REPLACE FUNCTION public.get_mentor_view(p_share_code TEXT)
RETURNS TABLE(
  exam TEXT,
  exam_date TIMESTAMPTZ,
  current_streak INTEGER,
  last_30_days_consistency INTEGER,
  last_verdict_status TEXT,
  last_verdict_date DATE,
  truth_index INTEGER,
  share_active BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id UUID;
  share_active BOOLEAN;
BEGIN
  -- Verify share code exists and is active
  SELECT user_id, active INTO target_user_id, share_active
  FROM public.mentor_shares
  WHERE share_code = upper(trim(p_share_code))
    AND (expires_at IS NULL OR expires_at > NOW())
  LIMIT 1;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired share code';
  END IF;

  -- Update last viewed
  UPDATE public.mentor_shares
  SET last_viewed_at = NOW()
  WHERE share_code = upper(trim(p_share_code));

  -- Return summary data
  RETURN QUERY
  SELECT
    su.exam,
    su.exam_date,
    COALESCE((SELECT v.streak FROM public.verdicts v WHERE v.user_id = target_user_id ORDER BY v.date DESC LIMIT 1), 0),
    (SELECT COUNT(DISTINCT date)::INTEGER FROM public.daily_check_ins WHERE user_id = target_user_id AND date >= CURRENT_DATE - INTERVAL '30 days'),
    (SELECT v.status FROM public.verdicts v WHERE v.user_id = target_user_id ORDER BY v.date DESC LIMIT 1),
    (SELECT v.date FROM public.verdicts v WHERE v.user_id = target_user_id ORDER BY v.date DESC LIMIT 1),
    su.truth_index,
    share_active
  FROM public.study_users su
  WHERE su.id = target_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_mentor_share(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_mentor_view(TEXT) TO authenticated;
