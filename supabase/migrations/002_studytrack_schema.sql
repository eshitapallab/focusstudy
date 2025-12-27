-- StudyTrack Tables for Supabase
-- Run this in Supabase SQL Editor

-- pgcrypto provides gen_random_uuid() which is preferred over uuid-ossp
-- Note: gen_random_uuid() is built-in on Supabase, but we ensure pgcrypto for compatibility
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  feeling TEXT NOT NULL CHECK (feeling IN ('calm', 'neutral', 'draining')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- "If Exam Were Tomorrow" mode (biweekly)
CREATE TABLE IF NOT EXISTS public.exam_tomorrow_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  response TEXT NOT NULL CHECK (response IN ('yes', 'maybe', 'no')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Monthly memory snapshots
CREATE TABLE IF NOT EXISTS public.monthly_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_code TEXT NOT NULL UNIQUE,
  weekly_goal_minutes INTEGER DEFAULT 600, -- Pod's weekly collective goal (default 10 hours)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pod_members (
  pod_id UUID NOT NULL REFERENCES public.pods(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT 'Anonymous',
  current_streak INTEGER NOT NULL DEFAULT 0,
  best_streak INTEGER NOT NULL DEFAULT 0,
  total_kudos_received INTEGER NOT NULL DEFAULT 0,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (pod_id, user_id)
);

-- Pod kudos/encouragements (one per sender per recipient per day)
CREATE TABLE IF NOT EXISTS public.pod_kudos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pod_id UUID NOT NULL REFERENCES public.pods(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL DEFAULT '👏', -- 👏 🔥 💪 ⭐ 🎯
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(pod_id, from_user_id, to_user_id, date)
);

-- Pod daily snapshots (for tracking collective progress)
CREATE TABLE IF NOT EXISTS public.pod_daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pod_id UUID NOT NULL REFERENCES public.pods(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_study_minutes INTEGER NOT NULL DEFAULT 0,
  members_checked_in INTEGER NOT NULL DEFAULT 0,
  all_members_checked_in BOOLEAN NOT NULL DEFAULT false,
  first_to_check_in UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(pod_id, date)
);

-- Pod achievements/badges
CREATE TABLE IF NOT EXISTS public.pod_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pod_id UUID NOT NULL REFERENCES public.pods(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  achievement_data JSONB DEFAULT '{}',
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(pod_id, user_id, achievement_type)
);

-- Pod motivational messages (quick pre-set messages)
CREATE TABLE IF NOT EXISTS public.pod_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pod_id UUID NOT NULL REFERENCES public.pods(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL means to whole pod
  message_type TEXT NOT NULL, -- 'motivation', 'challenge', 'celebration'
  message_key TEXT NOT NULL, -- predefined message key
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Currently studying status
CREATE TABLE IF NOT EXISTS public.pod_study_sessions (
  pod_id UUID NOT NULL REFERENCES public.pods(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  subject TEXT,
  target_minutes INTEGER,
  PRIMARY KEY (pod_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_pod_kudos_recipient ON public.pod_kudos(to_user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_pod_daily_stats_pod_date ON public.pod_daily_stats(pod_id, date DESC);

-- Cohort statistics (anonymous aggregates)
CREATE TABLE IF NOT EXISTS public.cohort_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam TEXT NOT NULL,
  date DATE NOT NULL,
  median_study_minutes INTEGER NOT NULL,
  participant_count INTEGER NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(exam, date)
);

-- Gaming detection
CREATE TABLE IF NOT EXISTS public.gaming_detections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Pod kudos policies
ALTER TABLE public.pod_kudos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Pod members can view kudos" ON public.pod_kudos;
DROP POLICY IF EXISTS "Pod members can send kudos" ON public.pod_kudos;

CREATE POLICY "Pod members can view kudos"
  ON public.pod_kudos FOR SELECT
  USING (public._is_pod_member(pod_id, auth.uid()));

CREATE POLICY "Pod members can send kudos"
  ON public.pod_kudos FOR INSERT
  WITH CHECK (
    public._is_pod_member(pod_id, auth.uid()) 
    AND from_user_id = auth.uid()
    AND from_user_id != to_user_id
  );

-- Pod daily stats policies
ALTER TABLE public.pod_daily_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Pod members can view daily stats" ON public.pod_daily_stats;
DROP POLICY IF EXISTS "System can update daily stats" ON public.pod_daily_stats;

CREATE POLICY "Pod members can view daily stats"
  ON public.pod_daily_stats FOR SELECT
  USING (public._is_pod_member(pod_id, auth.uid()));

-- Pod achievements policies
ALTER TABLE public.pod_achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Pod members can view achievements" ON public.pod_achievements;
CREATE POLICY "Pod members can view achievements"
  ON public.pod_achievements FOR SELECT
  USING (public._is_pod_member(pod_id, auth.uid()));

-- Pod messages policies
ALTER TABLE public.pod_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Pod members can view messages" ON public.pod_messages;
DROP POLICY IF EXISTS "Pod members can send messages" ON public.pod_messages;
CREATE POLICY "Pod members can view messages"
  ON public.pod_messages FOR SELECT
  USING (public._is_pod_member(pod_id, auth.uid()));
CREATE POLICY "Pod members can send messages"
  ON public.pod_messages FOR INSERT
  WITH CHECK (public._is_pod_member(pod_id, auth.uid()) AND from_user_id = auth.uid());

-- Pod study sessions policies
ALTER TABLE public.pod_study_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Pod members can view study sessions" ON public.pod_study_sessions;
DROP POLICY IF EXISTS "Users can manage own study session" ON public.pod_study_sessions;
CREATE POLICY "Pod members can view study sessions"
  ON public.pod_study_sessions FOR SELECT
  USING (public._is_pod_member(pod_id, auth.uid()));
CREATE POLICY "Users can manage own study session"
  ON public.pod_study_sessions FOR ALL
  USING (user_id = auth.uid());

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

-- Add display_name to pod_members for existing tables
ALTER TABLE public.pod_members
  ADD COLUMN IF NOT EXISTS display_name TEXT NOT NULL DEFAULT 'Anonymous';

-- Add streak tracking columns to pod_members
ALTER TABLE public.pod_members
  ADD COLUMN IF NOT EXISTS current_streak INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.pod_members
  ADD COLUMN IF NOT EXISTS best_streak INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.pod_members
  ADD COLUMN IF NOT EXISTS total_kudos_received INTEGER NOT NULL DEFAULT 0;

-- Add weekly goal to pods
ALTER TABLE public.pods
  ADD COLUMN IF NOT EXISTS weekly_goal_minutes INTEGER DEFAULT 600;

-- Pods helpers (secure minimal data access)
CREATE OR REPLACE FUNCTION public._generate_invite_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  code TEXT;
BEGIN
  code := substring(replace(gen_random_uuid()::text, '-', ''), 1, 8);
  RETURN upper(code);
END;
$$;

CREATE OR REPLACE FUNCTION public.create_pod(p_display_name TEXT DEFAULT 'Anonymous')
RETURNS TABLE(pod_id UUID, invite_code TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  code TEXT;
  new_pod_id UUID;
  attempts INTEGER := 0;
  safe_name TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Sanitize display name
  safe_name := COALESCE(NULLIF(trim(p_display_name), ''), 'Anonymous');
  IF length(safe_name) > 20 THEN
    safe_name := substring(safe_name, 1, 20);
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

  INSERT INTO public.pod_members (pod_id, user_id, display_name)
  VALUES (new_pod_id, auth.uid(), safe_name)
  ON CONFLICT DO NOTHING;

  pod_id := new_pod_id;
  invite_code := code;
  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.join_pod(p_invite_code TEXT, p_display_name TEXT DEFAULT 'Anonymous')
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_pod_id UUID;
  member_count INTEGER;
  safe_name TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Sanitize display name
  safe_name := COALESCE(NULLIF(trim(p_display_name), ''), 'Anonymous');
  IF length(safe_name) > 20 THEN
    safe_name := substring(safe_name, 1, 20);
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

  INSERT INTO public.pod_members (pod_id, user_id, display_name)
  VALUES (target_pod_id, auth.uid(), safe_name)
  ON CONFLICT (pod_id, user_id) DO UPDATE SET display_name = safe_name;

  RETURN target_pod_id;
END;
$$;

-- Function to update display name in a pod
CREATE OR REPLACE FUNCTION public.update_pod_display_name(p_pod_id UUID, p_display_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  safe_name TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  safe_name := COALESCE(NULLIF(trim(p_display_name), ''), 'Anonymous');
  IF length(safe_name) > 20 THEN
    safe_name := substring(safe_name, 1, 20);
  END IF;

  UPDATE public.pod_members
  SET display_name = safe_name
  WHERE pod_id = p_pod_id AND user_id = auth.uid();

  RETURN FOUND;
END;
$$;

-- Drop existing function first if return type changed
DROP FUNCTION IF EXISTS public.get_pod_status(UUID, DATE);

CREATE OR REPLACE FUNCTION public.get_pod_status(p_pod_id UUID, p_date DATE)
RETURNS TABLE(user_id UUID, display_name TEXT, checked_in BOOLEAN, verdict_status TEXT)
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
    pm.display_name,
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

GRANT EXECUTE ON FUNCTION public.create_pod(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_pod(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pod_status(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_pod_display_name(UUID, TEXT) TO authenticated;

-- Function to leave a pod (remove membership)
CREATE OR REPLACE FUNCTION public.leave_pod(p_pod_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_owner BOOLEAN;
  member_count INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if user is in this pod
  IF NOT public._is_pod_member(p_pod_id, auth.uid()) THEN
    RAISE EXCEPTION 'You are not in this pod';
  END IF;

  -- Check if user is the owner
  SELECT EXISTS(
    SELECT 1 FROM public.pods WHERE id = p_pod_id AND owner_id = auth.uid()
  ) INTO is_owner;

  -- Count remaining members
  SELECT COUNT(*) INTO member_count FROM public.pod_members WHERE pod_id = p_pod_id;

  -- If owner and only member, delete the entire pod
  IF is_owner AND member_count = 1 THEN
    -- Delete all related data first
    DELETE FROM public.pod_study_sessions WHERE pod_id = p_pod_id;
    DELETE FROM public.pod_messages WHERE pod_id = p_pod_id;
    DELETE FROM public.pod_kudos WHERE pod_id = p_pod_id;
    DELETE FROM public.pod_achievements WHERE pod_id = p_pod_id;
    DELETE FROM public.pod_daily_stats WHERE pod_id = p_pod_id;
    DELETE FROM public.pod_members WHERE pod_id = p_pod_id;
    DELETE FROM public.pods WHERE id = p_pod_id;
    RETURN true;
  END IF;

  -- If owner but others exist, transfer ownership to longest member
  IF is_owner THEN
    UPDATE public.pods
    SET owner_id = (
      SELECT user_id FROM public.pod_members 
      WHERE pod_id = p_pod_id AND user_id != auth.uid()
      ORDER BY joined_at ASC
      LIMIT 1
    )
    WHERE id = p_pod_id;
  END IF;

  -- Remove the user's study session if active
  DELETE FROM public.pod_study_sessions WHERE pod_id = p_pod_id AND user_id = auth.uid();
  
  -- Remove membership
  DELETE FROM public.pod_members WHERE pod_id = p_pod_id AND user_id = auth.uid();

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.leave_pod(UUID) TO authenticated;

-- Function to send kudos to a pod member
CREATE OR REPLACE FUNCTION public.send_pod_kudos(
  p_pod_id UUID, 
  p_to_user_id UUID, 
  p_emoji TEXT DEFAULT '👏'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  valid_emojis TEXT[] := ARRAY['👏', '🔥', '💪', '⭐', '🎯', '🚀', '💯', '🏆'];
  safe_emoji TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Can't send kudos to yourself
  IF auth.uid() = p_to_user_id THEN
    RAISE EXCEPTION 'Cannot send kudos to yourself';
  END IF;

  -- Check both users are in the pod
  IF NOT public._is_pod_member(p_pod_id, auth.uid()) THEN
    RAISE EXCEPTION 'You are not in this pod';
  END IF;

  IF NOT public._is_pod_member(p_pod_id, p_to_user_id) THEN
    RAISE EXCEPTION 'Target user is not in this pod';
  END IF;

  -- Validate emoji
  IF p_emoji = ANY(valid_emojis) THEN
    safe_emoji := p_emoji;
  ELSE
    safe_emoji := '👏';
  END IF;

  -- Insert kudos (or update if already sent today)
  INSERT INTO public.pod_kudos (pod_id, from_user_id, to_user_id, emoji, date)
  VALUES (p_pod_id, auth.uid(), p_to_user_id, safe_emoji, CURRENT_DATE)
  ON CONFLICT (pod_id, from_user_id, to_user_id, date) 
  DO UPDATE SET emoji = safe_emoji;

  -- Update kudos count for recipient
  UPDATE public.pod_members
  SET total_kudos_received = (
    SELECT count(*) FROM public.pod_kudos k 
    WHERE k.to_user_id = p_to_user_id AND k.pod_id = p_pod_id
  )
  WHERE pod_id = p_pod_id AND user_id = p_to_user_id;

  RETURN true;
END;
$$;

-- Function to update member streaks (call this when user checks in)
CREATE OR REPLACE FUNCTION public.update_pod_streak(p_user_id UUID, p_date DATE)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  yesterday_checked BOOLEAN;
  member_record RECORD;
BEGIN
  -- Check if user checked in yesterday
  SELECT EXISTS(
    SELECT 1 FROM public.daily_check_ins 
    WHERE user_id = p_user_id AND date = p_date - INTERVAL '1 day'
  ) INTO yesterday_checked;

  -- Update all pod memberships for this user
  FOR member_record IN 
    SELECT pod_id FROM public.pod_members WHERE user_id = p_user_id
  LOOP
    IF yesterday_checked THEN
      -- Increment streak
      UPDATE public.pod_members
      SET 
        current_streak = current_streak + 1,
        best_streak = GREATEST(best_streak, current_streak + 1)
      WHERE pod_id = member_record.pod_id AND user_id = p_user_id;
    ELSE
      -- Reset streak to 1
      UPDATE public.pod_members
      SET 
        current_streak = 1,
        best_streak = GREATEST(best_streak, 1)
      WHERE pod_id = member_record.pod_id AND user_id = p_user_id;
    END IF;
  END LOOP;
END;
$$;

-- Enhanced pod status with more data
DROP FUNCTION IF EXISTS public.get_pod_status_enhanced(UUID, DATE);

CREATE OR REPLACE FUNCTION public.get_pod_status_enhanced(p_pod_id UUID, p_date DATE)
RETURNS TABLE(
  user_id UUID, 
  display_name TEXT, 
  checked_in BOOLEAN, 
  verdict_status TEXT,
  current_streak INTEGER,
  best_streak INTEGER,
  total_kudos INTEGER,
  check_in_time TIMESTAMPTZ,
  is_first_today BOOLEAN,
  week_minutes INTEGER,
  kudos_from_me BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  first_check_in_user UUID;
  week_start DATE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public._is_pod_member(p_pod_id, auth.uid()) THEN
    RAISE EXCEPTION 'Not a pod member';
  END IF;

  week_start := date_trunc('week', p_date)::DATE;

  -- Find who checked in first today
  SELECT d.user_id INTO first_check_in_user
  FROM public.daily_check_ins d
  INNER JOIN public.pod_members pm ON pm.user_id = d.user_id AND pm.pod_id = p_pod_id
  WHERE d.date = p_date
  ORDER BY d.created_at ASC
  LIMIT 1;

  RETURN QUERY
  SELECT
    pm.user_id,
    pm.display_name,
    EXISTS(
      SELECT 1 FROM public.daily_check_ins d
      WHERE d.user_id = pm.user_id AND d.date = p_date
    ) AS checked_in,
    (
      SELECT v.status FROM public.verdicts v
      WHERE v.user_id = pm.user_id AND v.date = p_date
      LIMIT 1
    ) AS verdict_status,
    pm.current_streak,
    pm.best_streak,
    pm.total_kudos_received AS total_kudos,
    (
      SELECT d.created_at FROM public.daily_check_ins d
      WHERE d.user_id = pm.user_id AND d.date = p_date
      LIMIT 1
    ) AS check_in_time,
    (pm.user_id = first_check_in_user) AS is_first_today,
    COALESCE((
      SELECT SUM(d.minutes_studied)::INTEGER 
      FROM public.daily_check_ins d
      WHERE d.user_id = pm.user_id 
      AND d.date >= week_start 
      AND d.date <= p_date
    ), 0) AS week_minutes,
    EXISTS(
      SELECT 1 FROM public.pod_kudos k
      WHERE k.from_user_id = auth.uid() 
      AND k.to_user_id = pm.user_id 
      AND k.pod_id = p_pod_id
      AND k.date = p_date
    ) AS kudos_from_me
  FROM public.pod_members pm
  WHERE pm.pod_id = p_pod_id;
END;
$$;

-- Get pod weekly summary
CREATE OR REPLACE FUNCTION public.get_pod_weekly_summary(p_pod_id UUID)
RETURNS TABLE(
  total_minutes INTEGER,
  weekly_goal INTEGER,
  goal_progress_pct INTEGER,
  pod_streak INTEGER,
  top_performer_name TEXT,
  top_performer_minutes INTEGER,
  avg_daily_check_ins NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  week_start DATE;
  week_end DATE;
  consecutive_days INTEGER := 0;
  check_date DATE;
  all_checked BOOLEAN;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public._is_pod_member(p_pod_id, auth.uid()) THEN
    RAISE EXCEPTION 'Not a pod member';
  END IF;

  week_start := date_trunc('week', CURRENT_DATE)::DATE;
  week_end := week_start + INTERVAL '6 days';

  -- Calculate pod streak (consecutive days ALL members checked in)
  check_date := CURRENT_DATE - INTERVAL '1 day';
  LOOP
    SELECT NOT EXISTS (
      SELECT pm.user_id FROM public.pod_members pm
      WHERE pm.pod_id = p_pod_id
      AND NOT EXISTS (
        SELECT 1 FROM public.daily_check_ins d 
        WHERE d.user_id = pm.user_id AND d.date = check_date
      )
    ) INTO all_checked;

    IF all_checked THEN
      consecutive_days := consecutive_days + 1;
      check_date := check_date - INTERVAL '1 day';
    ELSE
      EXIT;
    END IF;

    -- Safety limit
    IF consecutive_days > 365 THEN EXIT; END IF;
  END LOOP;

  RETURN QUERY
  SELECT
    COALESCE((
      SELECT SUM(d.minutes_studied)::INTEGER
      FROM public.daily_check_ins d
      INNER JOIN public.pod_members pm ON pm.user_id = d.user_id AND pm.pod_id = p_pod_id
      WHERE d.date >= week_start AND d.date <= week_end
    ), 0) AS total_minutes,
    COALESCE((SELECT p.weekly_goal_minutes FROM public.pods p WHERE p.id = p_pod_id), 600) AS weekly_goal,
    LEAST(100, COALESCE((
      SELECT (SUM(d.minutes_studied)::INTEGER * 100) / NULLIF((SELECT p.weekly_goal_minutes FROM public.pods p WHERE p.id = p_pod_id), 0)
      FROM public.daily_check_ins d
      INNER JOIN public.pod_members pm ON pm.user_id = d.user_id AND pm.pod_id = p_pod_id
      WHERE d.date >= week_start AND d.date <= week_end
    ), 0)) AS goal_progress_pct,
    consecutive_days AS pod_streak,
    (
      SELECT pm.display_name 
      FROM public.pod_members pm
      LEFT JOIN (
        SELECT d.user_id, SUM(d.minutes_studied) AS mins
        FROM public.daily_check_ins d
        WHERE d.date >= week_start AND d.date <= week_end
        GROUP BY d.user_id
      ) stats ON stats.user_id = pm.user_id
      WHERE pm.pod_id = p_pod_id
      ORDER BY COALESCE(stats.mins, 0) DESC
      LIMIT 1
    ) AS top_performer_name,
    COALESCE((
      SELECT MAX(mins)::INTEGER FROM (
        SELECT SUM(d.minutes_studied) AS mins
        FROM public.daily_check_ins d
        INNER JOIN public.pod_members pm ON pm.user_id = d.user_id AND pm.pod_id = p_pod_id
        WHERE d.date >= week_start AND d.date <= week_end
        GROUP BY d.user_id
      ) sub
    ), 0) AS top_performer_minutes,
    COALESCE((
      SELECT AVG(cnt)::NUMERIC(3,1) FROM (
        SELECT COUNT(*) AS cnt
        FROM public.daily_check_ins d
        INNER JOIN public.pod_members pm ON pm.user_id = d.user_id AND pm.pod_id = p_pod_id
        WHERE d.date >= week_start AND d.date <= week_end
        GROUP BY d.date
      ) sub
    ), 0) AS avg_daily_check_ins;
END;
$$;

-- Get today's kudos for a user in a pod
CREATE OR REPLACE FUNCTION public.get_pod_kudos_today(p_pod_id UUID)
RETURNS TABLE(
  to_user_id UUID,
  from_display_name TEXT,
  emoji TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public._is_pod_member(p_pod_id, auth.uid()) THEN
    RAISE EXCEPTION 'Not a pod member';
  END IF;

  RETURN QUERY
  SELECT
    k.to_user_id,
    pm.display_name AS from_display_name,
    k.emoji
  FROM public.pod_kudos k
  INNER JOIN public.pod_members pm ON pm.user_id = k.from_user_id AND pm.pod_id = k.pod_id
  WHERE k.pod_id = p_pod_id AND k.date = CURRENT_DATE;
END;
$$;

-- Update pod weekly goal (owner only)
CREATE OR REPLACE FUNCTION public.update_pod_weekly_goal(p_pod_id UUID, p_goal_minutes INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if user is the pod owner
  IF NOT EXISTS (SELECT 1 FROM public.pods WHERE id = p_pod_id AND owner_id = auth.uid()) THEN
    RAISE EXCEPTION 'Only pod owner can update weekly goal';
  END IF;

  -- Validate goal (between 1 hour and 50 hours)
  IF p_goal_minutes < 60 OR p_goal_minutes > 3000 THEN
    RAISE EXCEPTION 'Weekly goal must be between 60 and 3000 minutes';
  END IF;

  UPDATE public.pods
  SET weekly_goal_minutes = p_goal_minutes
  WHERE id = p_pod_id;

  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.send_pod_kudos(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_pod_streak(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pod_status_enhanced(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pod_weekly_summary(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pod_kudos_today(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_pod_weekly_goal(UUID, INTEGER) TO authenticated;

-- Start a study session (visible to pod members)
CREATE OR REPLACE FUNCTION public.start_pod_study_session(
  p_pod_id UUID,
  p_subject TEXT DEFAULT NULL,
  p_target_minutes INTEGER DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public._is_pod_member(p_pod_id, auth.uid()) THEN
    RAISE EXCEPTION 'Not a pod member';
  END IF;

  INSERT INTO public.pod_study_sessions (pod_id, user_id, subject, target_minutes)
  VALUES (p_pod_id, auth.uid(), p_subject, p_target_minutes)
  ON CONFLICT (pod_id, user_id) 
  DO UPDATE SET started_at = NOW(), subject = p_subject, target_minutes = p_target_minutes;

  RETURN true;
END;
$$;

-- End a study session
CREATE OR REPLACE FUNCTION public.end_pod_study_session(p_pod_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  DELETE FROM public.pod_study_sessions
  WHERE pod_id = p_pod_id AND user_id = auth.uid();

  RETURN true;
END;
$$;

-- Get who's currently studying in the pod
-- Drop first to allow changing return type
DROP FUNCTION IF EXISTS public.get_pod_studying_now(UUID);

CREATE OR REPLACE FUNCTION public.get_pod_studying_now(p_pod_id UUID)
RETURNS TABLE(
  out_user_id UUID,
  out_display_name TEXT,
  out_subject TEXT,
  out_started_at TIMESTAMPTZ,
  out_minutes_elapsed INTEGER,
  out_target_minutes INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public._is_pod_member(p_pod_id, auth.uid()) THEN
    RAISE EXCEPTION 'Not a pod member';
  END IF;

  -- Clean up stale sessions (older than 4 hours)
  DELETE FROM public.pod_study_sessions pss_del
  WHERE pss_del.pod_id = p_pod_id AND pss_del.started_at < NOW() - INTERVAL '4 hours';

  RETURN QUERY
  SELECT
    pss.user_id AS out_user_id,
    pm.display_name AS out_display_name,
    pss.subject AS out_subject,
    pss.started_at AS out_started_at,
    (EXTRACT(EPOCH FROM (NOW() - pss.started_at))::INTEGER / 60) AS out_minutes_elapsed,
    pss.target_minutes AS out_target_minutes
  FROM public.pod_study_sessions pss
  INNER JOIN public.pod_members pm ON pm.user_id = pss.user_id AND pm.pod_id = pss.pod_id
  WHERE pss.pod_id = p_pod_id
  ORDER BY pss.started_at ASC;
END;
$$;

-- Send a motivational message
CREATE OR REPLACE FUNCTION public.send_pod_message(
  p_pod_id UUID,
  p_to_user_id UUID,
  p_message_type TEXT,
  p_message_key TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  valid_types TEXT[] := ARRAY['motivation', 'challenge', 'celebration', 'nudge'];
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public._is_pod_member(p_pod_id, auth.uid()) THEN
    RAISE EXCEPTION 'Not a pod member';
  END IF;

  IF p_to_user_id IS NOT NULL AND NOT public._is_pod_member(p_pod_id, p_to_user_id) THEN
    RAISE EXCEPTION 'Target user is not in this pod';
  END IF;

  IF NOT (p_message_type = ANY(valid_types)) THEN
    p_message_type := 'motivation';
  END IF;

  INSERT INTO public.pod_messages (pod_id, from_user_id, to_user_id, message_type, message_key)
  VALUES (p_pod_id, auth.uid(), p_to_user_id, p_message_type, p_message_key);

  RETURN true;
END;
$$;

-- Get recent messages for the pod (last 24 hours)
CREATE OR REPLACE FUNCTION public.get_pod_messages_recent(p_pod_id UUID)
RETURNS TABLE(
  from_user_id UUID,
  from_display_name TEXT,
  to_user_id UUID,
  to_display_name TEXT,
  message_type TEXT,
  message_key TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public._is_pod_member(p_pod_id, auth.uid()) THEN
    RAISE EXCEPTION 'Not a pod member';
  END IF;

  RETURN QUERY
  SELECT
    m.from_user_id,
    pm_from.display_name AS from_display_name,
    m.to_user_id,
    pm_to.display_name AS to_display_name,
    m.message_type,
    m.message_key,
    m.created_at
  FROM public.pod_messages m
  INNER JOIN public.pod_members pm_from ON pm_from.user_id = m.from_user_id AND pm_from.pod_id = m.pod_id
  LEFT JOIN public.pod_members pm_to ON pm_to.user_id = m.to_user_id AND pm_to.pod_id = m.pod_id
  WHERE m.pod_id = p_pod_id 
    AND m.created_at > NOW() - INTERVAL '24 hours'
  ORDER BY m.created_at DESC
  LIMIT 20;
END;
$$;

-- Unlock an achievement
CREATE OR REPLACE FUNCTION public.unlock_pod_achievement(
  p_pod_id UUID,
  p_achievement_type TEXT,
  p_achievement_data JSONB DEFAULT '{}'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public._is_pod_member(p_pod_id, auth.uid()) THEN
    RAISE EXCEPTION 'Not a pod member';
  END IF;

  INSERT INTO public.pod_achievements (pod_id, user_id, achievement_type, achievement_data)
  VALUES (p_pod_id, auth.uid(), p_achievement_type, p_achievement_data)
  ON CONFLICT (pod_id, user_id, achievement_type) DO NOTHING;

  RETURN true;
END;
$$;

-- Get achievements for pod members
CREATE OR REPLACE FUNCTION public.get_pod_achievements(p_pod_id UUID)
RETURNS TABLE(
  user_id UUID,
  display_name TEXT,
  achievement_type TEXT,
  achievement_data JSONB,
  unlocked_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public._is_pod_member(p_pod_id, auth.uid()) THEN
    RAISE EXCEPTION 'Not a pod member';
  END IF;

  RETURN QUERY
  SELECT
    a.user_id,
    pm.display_name,
    a.achievement_type,
    a.achievement_data,
    a.unlocked_at
  FROM public.pod_achievements a
  INNER JOIN public.pod_members pm ON pm.user_id = a.user_id AND pm.pod_id = a.pod_id
  WHERE a.pod_id = p_pod_id
  ORDER BY a.unlocked_at DESC;
END;
$$;

-- Get daily challenge for the pod
CREATE OR REPLACE FUNCTION public.get_pod_daily_challenge(p_pod_id UUID)
RETURNS TABLE(
  challenge_type TEXT,
  challenge_title TEXT,
  challenge_description TEXT,
  challenge_target INTEGER,
  current_progress INTEGER,
  is_completed BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  day_of_week INTEGER;
  member_count INTEGER;
  checked_in_count INTEGER;
  total_minutes INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public._is_pod_member(p_pod_id, auth.uid()) THEN
    RAISE EXCEPTION 'Not a pod member';
  END IF;

  day_of_week := EXTRACT(DOW FROM CURRENT_DATE)::INTEGER;
  
  SELECT COUNT(*) INTO member_count FROM public.pod_members WHERE pod_id = p_pod_id;
  
  SELECT COUNT(*) INTO checked_in_count
  FROM public.pod_members pm
  WHERE pm.pod_id = p_pod_id
  AND EXISTS (
    SELECT 1 FROM public.daily_check_ins d 
    WHERE d.user_id = pm.user_id AND d.date = CURRENT_DATE
  );

  SELECT COALESCE(SUM(d.minutes_studied), 0) INTO total_minutes
  FROM public.daily_check_ins d
  INNER JOIN public.pod_members pm ON pm.user_id = d.user_id AND pm.pod_id = p_pod_id
  WHERE d.date = CURRENT_DATE;

  -- Rotate challenges based on day of week
  CASE day_of_week
    WHEN 0 THEN -- Sunday: Rest & Review
      RETURN QUERY SELECT 
        'collective_checkin'::TEXT,
        '🌟 Sunday Squad Goal'::TEXT,
        'Get everyone to check in today!'::TEXT,
        member_count,
        checked_in_count,
        checked_in_count >= member_count;
    WHEN 1 THEN -- Monday: Strong Start
      RETURN QUERY SELECT 
        'early_birds'::TEXT,
        '🌅 Monday Momentum'::TEXT,
        'Collective 2 hours of study before noon'::TEXT,
        120,
        total_minutes,
        total_minutes >= 120;
    WHEN 2 THEN -- Tuesday: Team Target
      RETURN QUERY SELECT 
        'collective_minutes'::TEXT,
        '🎯 Team Target Tuesday'::TEXT,
        'Hit 3 hours of combined study time'::TEXT,
        180,
        total_minutes,
        total_minutes >= 180;
    WHEN 3 THEN -- Wednesday: Halfway Hero
      RETURN QUERY SELECT 
        'all_checkin'::TEXT,
        '💪 Halfway Hero Wednesday'::TEXT,
        '100% pod check-in rate!'::TEXT,
        member_count,
        checked_in_count,
        checked_in_count >= member_count;
    WHEN 4 THEN -- Thursday: Thunder
      RETURN QUERY SELECT 
        'collective_minutes'::TEXT,
        '⚡ Thunder Thursday'::TEXT,
        'Hit 4 hours combined - you can do it!'::TEXT,
        240,
        total_minutes,
        total_minutes >= 240;
    WHEN 5 THEN -- Friday: Finish Strong
      RETURN QUERY SELECT 
        'collective_minutes'::TEXT,
        '🏁 Finish Strong Friday'::TEXT,
        'End the week with 3 hours combined'::TEXT,
        180,
        total_minutes,
        total_minutes >= 180;
    WHEN 6 THEN -- Saturday: Super Study
      RETURN QUERY SELECT 
        'collective_minutes'::TEXT,
        '🚀 Super Saturday'::TEXT,
        'Weekend warriors: 5 hours combined!'::TEXT,
        300,
        total_minutes,
        total_minutes >= 300;
  END CASE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.start_pod_study_session(UUID, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.end_pod_study_session(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pod_studying_now(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_pod_message(UUID, UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pod_messages_recent(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unlock_pod_achievement(UUID, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pod_achievements(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pod_daily_challenge(UUID) TO authenticated;

-- Enable Realtime for pod tables (for live updates)
-- Note: You may need to enable Realtime in Supabase Dashboard > Database > Replication
-- These commands add tables to the supabase_realtime publication

DO $$ 
BEGIN
  -- Check if publication exists and add tables
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    -- Add pod tables to realtime publication (safe if already added)
    ALTER PUBLICATION supabase_realtime ADD TABLE public.pod_study_sessions;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.pod_messages;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.pod_kudos;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_check_ins;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    -- Table already in publication, ignore
    NULL;
END $$;
