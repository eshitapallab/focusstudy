-- StudyTrack Tables for Supabase
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.study_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  exam TEXT NOT NULL,
  exam_date TIMESTAMPTZ,
  daily_target_minutes INTEGER NOT NULL DEFAULT 120,
  language TEXT NOT NULL DEFAULT 'English',
  is_anonymous BOOLEAN NOT NULL DEFAULT true,
  peer_comparison_enabled BOOLEAN NOT NULL DEFAULT true,
  notifications_enabled BOOLEAN NOT NULL DEFAULT false,
  last_weekly_reality_check TIMESTAMPTZ,
  last_weak_subject_nudge_at TIMESTAMPTZ,
  reset_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Daily check-ins
CREATE TABLE IF NOT EXISTS public.daily_check_ins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  subject TEXT NOT NULL,
  minutes_studied INTEGER NOT NULL,
  could_revise BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Verdicts
CREATE TABLE IF NOT EXISTS public.verdicts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('on-track', 'at-risk', 'falling-behind')),
  study_minutes INTEGER NOT NULL,
  target_minutes INTEGER NOT NULL,
  recall_ratio DECIMAL(3,2) NOT NULL,
  streak INTEGER NOT NULL DEFAULT 0,
  days_to_exam INTEGER,
  reasons TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Micro actions
CREATE TABLE IF NOT EXISTS public.micro_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verdict_id UUID NOT NULL REFERENCES public.verdicts(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  task TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  related_subjects TEXT[] NOT NULL DEFAULT '{}',
  completed BOOLEAN NOT NULL DEFAULT false,
  locked BOOLEAN NOT NULL DEFAULT false,
  locked_at TIMESTAMPTZ,
  lock_checked_at TIMESTAMPTZ,
  locked_done BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Weekly reality checks
CREATE TABLE IF NOT EXISTS public.weekly_reality (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  confidence_score INTEGER,
  avoided_weak_subjects BOOLEAN NOT NULL,
  revised_content BOOLEAN NOT NULL,
  ready_for_basics BOOLEAN NOT NULL,
  consistent_effort BOOLEAN NOT NULL,
  honest_with_self BOOLEAN NOT NULL,
  reality_score INTEGER NOT NULL,
  trajectory_message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, week_start_date)
);

-- Emotional check-ins (1 tap every few days)
CREATE TABLE IF NOT EXISTS public.emotional_check_ins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  feeling TEXT NOT NULL CHECK (feeling IN ('calm', 'neutral', 'draining')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- "If Exam Were Tomorrow" mode (biweekly)
CREATE TABLE IF NOT EXISTS public.exam_tomorrow_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  response TEXT NOT NULL CHECK (response IN ('yes', 'maybe', 'no')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Monthly memory snapshots
CREATE TABLE IF NOT EXISTS public.monthly_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month_start_date DATE NOT NULL,
  avg_daily_minutes INTEGER NOT NULL,
  consistency_days INTEGER NOT NULL,
  biggest_improvement TEXT NOT NULL,
  reflection TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, month_start_date)
);

-- Micro accountability pods (3–5 people, no chat)
CREATE TABLE IF NOT EXISTS public.pods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pod_members (
  pod_id UUID NOT NULL REFERENCES public.pods(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (pod_id, user_id)
);

-- Cohort statistics (anonymous aggregates)
CREATE TABLE IF NOT EXISTS public.cohort_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam TEXT NOT NULL,
  date DATE NOT NULL,
  median_study_minutes INTEGER NOT NULL,
  participant_count INTEGER NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(exam, date)
);

-- Gaming detection
CREATE TABLE IF NOT EXISTS public.gaming_detections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  same_minutes_daily BOOLEAN DEFAULT false,
  always_yes_recall BOOLEAN DEFAULT false,
  no_variance BOOLEAN DEFAULT false,
  prompted BOOLEAN NOT NULL DEFAULT false
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_check_ins_user_date ON public.daily_check_ins(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_verdicts_user_date ON public.verdicts(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_micro_actions_user_date ON public.micro_actions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_weekly_reality_user_week ON public.weekly_reality(user_id, week_start_date DESC);
CREATE INDEX IF NOT EXISTS idx_gaming_detections_user_date ON public.gaming_detections(user_id, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_cohort_stats_exam_date ON public.cohort_stats(exam, date DESC);
CREATE INDEX IF NOT EXISTS idx_emotional_check_ins_user_date ON public.emotional_check_ins(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_exam_tomorrow_checks_user_date ON public.exam_tomorrow_checks(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_monthly_snapshots_user_month ON public.monthly_snapshots(user_id, month_start_date DESC);
CREATE INDEX IF NOT EXISTS idx_pod_members_user ON public.pod_members(user_id);

-- Row Level Security (RLS)
ALTER TABLE public.study_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verdicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.micro_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_reality ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cohort_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gaming_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emotional_check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_tomorrow_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pod_members ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only access their own data
-- NOTE: Supabase SQL editor migrations are often re-run; make this script idempotent.
-- PostgreSQL does not support CREATE POLICY IF NOT EXISTS, so we DROP first.

DROP POLICY IF EXISTS "Users can view own study profile" ON public.study_users;
DROP POLICY IF EXISTS "Users can insert own study profile" ON public.study_users;
DROP POLICY IF EXISTS "Users can update own study profile" ON public.study_users;

DROP POLICY IF EXISTS "Users can view own check-ins" ON public.daily_check_ins;
DROP POLICY IF EXISTS "Users can insert own check-ins" ON public.daily_check_ins;

DROP POLICY IF EXISTS "Users can view own verdicts" ON public.verdicts;
DROP POLICY IF EXISTS "Users can insert own verdicts" ON public.verdicts;

DROP POLICY IF EXISTS "Users can view own micro-actions" ON public.micro_actions;
DROP POLICY IF EXISTS "Users can insert own micro-actions" ON public.micro_actions;
DROP POLICY IF EXISTS "Users can update own micro-actions" ON public.micro_actions;

DROP POLICY IF EXISTS "Users can view own emotional check-ins" ON public.emotional_check_ins;
DROP POLICY IF EXISTS "Users can insert own emotional check-ins" ON public.emotional_check_ins;

DROP POLICY IF EXISTS "Users can view own exam tomorrow checks" ON public.exam_tomorrow_checks;
DROP POLICY IF EXISTS "Users can insert own exam tomorrow checks" ON public.exam_tomorrow_checks;

DROP POLICY IF EXISTS "Users can view own monthly snapshots" ON public.monthly_snapshots;
DROP POLICY IF EXISTS "Users can insert own monthly snapshots" ON public.monthly_snapshots;

DROP POLICY IF EXISTS "Pod members can view pods" ON public.pods;
DROP POLICY IF EXISTS "Pod members can view pod members" ON public.pod_members;
DROP POLICY IF EXISTS "Pod owner can insert pods" ON public.pods;
DROP POLICY IF EXISTS "Pod members can insert pod members" ON public.pod_members;

DROP POLICY IF EXISTS "Users can view own reality checks" ON public.weekly_reality;
DROP POLICY IF EXISTS "Users can insert own reality checks" ON public.weekly_reality;

DROP POLICY IF EXISTS "Users can view own gaming detections" ON public.gaming_detections;
DROP POLICY IF EXISTS "Users can insert own gaming detections" ON public.gaming_detections;

DROP POLICY IF EXISTS "Anyone can view cohort stats" ON public.cohort_stats;

-- Helper function to check pod membership (must be created before policies that use it)
-- Uses SECURITY DEFINER to bypass RLS and avoid infinite recursion
CREATE OR REPLACE FUNCTION public._is_pod_member(p_pod_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.pod_members
    WHERE pod_id = p_pod_id AND user_id = p_user_id
  );
$$;

CREATE POLICY "Users can view own study profile"
  ON public.study_users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own study profile"
  ON public.study_users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own study profile"
  ON public.study_users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can view own check-ins"
  ON public.daily_check_ins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own check-ins"
  ON public.daily_check_ins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own verdicts"
  ON public.verdicts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own verdicts"
  ON public.verdicts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own micro-actions"
  ON public.micro_actions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own micro-actions"
  ON public.micro_actions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own micro-actions"
  ON public.micro_actions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own emotional check-ins"
  ON public.emotional_check_ins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own emotional check-ins"
  ON public.emotional_check_ins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own exam tomorrow checks"
  ON public.exam_tomorrow_checks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own exam tomorrow checks"
  ON public.exam_tomorrow_checks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own monthly snapshots"
  ON public.monthly_snapshots FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own monthly snapshots"
  ON public.monthly_snapshots FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Pod members can view pods"
  ON public.pods FOR SELECT
  USING (public._is_pod_member(id, auth.uid()));

-- Use user_id directly to avoid infinite recursion (no self-referential subquery)
CREATE POLICY "Pod members can view pod members"
  ON public.pod_members FOR SELECT
  USING (public._is_pod_member(pod_id, auth.uid()));

CREATE POLICY "Users can view own reality checks"
  ON public.weekly_reality FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reality checks"
  ON public.weekly_reality FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own gaming detections"
  ON public.gaming_detections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own gaming detections"
  ON public.gaming_detections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Cohort stats are public read-only
CREATE POLICY "Anyone can view cohort stats"
  ON public.cohort_stats FOR SELECT
  TO authenticated
  USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_study_users_updated_at ON public.study_users;
DROP TRIGGER IF EXISTS update_cohort_stats_updated_at ON public.cohort_stats;

CREATE TRIGGER update_study_users_updated_at BEFORE UPDATE ON public.study_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cohort_stats_updated_at BEFORE UPDATE ON public.cohort_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Backward-safe upgrades for existing projects
ALTER TABLE public.study_users
  ADD COLUMN IF NOT EXISTS last_weak_subject_nudge_at TIMESTAMPTZ;

ALTER TABLE public.study_users
  ADD COLUMN IF NOT EXISTS reset_at TIMESTAMPTZ;

ALTER TABLE public.micro_actions
  ADD COLUMN IF NOT EXISTS locked BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.micro_actions
  ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ;

ALTER TABLE public.micro_actions
  ADD COLUMN IF NOT EXISTS lock_checked_at TIMESTAMPTZ;

ALTER TABLE public.micro_actions
  ADD COLUMN IF NOT EXISTS locked_done BOOLEAN;

ALTER TABLE public.weekly_reality
  ADD COLUMN IF NOT EXISTS confidence_score INTEGER;

ALTER TABLE public.weekly_reality
  DROP CONSTRAINT IF EXISTS weekly_reality_confidence_score_range;

ALTER TABLE public.weekly_reality
  ADD CONSTRAINT weekly_reality_confidence_score_range
  CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 100));

-- Pods helpers (secure minimal data access)
CREATE OR REPLACE FUNCTION public._generate_invite_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  code TEXT;
BEGIN
  code := substring(replace(uuid_generate_v4()::text, '-', ''), 1, 8);
  RETURN upper(code);
END;
$$;

CREATE OR REPLACE FUNCTION public.create_pod()
RETURNS TABLE(pod_id UUID, invite_code TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  code TEXT;
  new_pod_id UUID;
  attempts INTEGER := 0;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  LOOP
    attempts := attempts + 1;
    IF attempts > 10 THEN
      RAISE EXCEPTION 'Could not generate unique invite code';
    END IF;

    code := public._generate_invite_code();
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.pods p WHERE p.invite_code = code);
  END LOOP;

  INSERT INTO public.pods (owner_id, invite_code)
  VALUES (auth.uid(), code)
  RETURNING id INTO new_pod_id;

  INSERT INTO public.pod_members (pod_id, user_id)
  VALUES (new_pod_id, auth.uid())
  ON CONFLICT DO NOTHING;

  pod_id := new_pod_id;
  invite_code := code;
  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.join_pod(p_invite_code TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_pod_id UUID;
  member_count INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT id INTO target_pod_id
  FROM public.pods
  WHERE invite_code = upper(trim(p_invite_code))
  LIMIT 1;

  IF target_pod_id IS NULL THEN
    RAISE EXCEPTION 'Invalid invite code';
  END IF;

  SELECT count(*) INTO member_count
  FROM public.pod_members
  WHERE pod_id = target_pod_id;

  IF member_count >= 5 THEN
    RAISE EXCEPTION 'Pod is full';
  END IF;

  INSERT INTO public.pod_members (pod_id, user_id)
  VALUES (target_pod_id, auth.uid())
  ON CONFLICT DO NOTHING;

  RETURN target_pod_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_pod_status(p_pod_id UUID, p_date DATE)
RETURNS TABLE(user_id UUID, checked_in BOOLEAN, verdict_status TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.pod_members pm
    WHERE pm.pod_id = p_pod_id AND pm.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not a pod member';
  END IF;

  RETURN QUERY
  SELECT
    pm.user_id,
    EXISTS(
      SELECT 1 FROM public.daily_check_ins d
      WHERE d.user_id = pm.user_id AND d.date = p_date
    ) AS checked_in,
    (
      SELECT v.status FROM public.verdicts v
      WHERE v.user_id = pm.user_id AND v.date = p_date
      LIMIT 1
    ) AS verdict_status
  FROM public.pod_members pm
  WHERE pm.pod_id = p_pod_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_pod() TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_pod(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pod_status(UUID, DATE) TO authenticated;
