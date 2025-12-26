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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Weekly reality checks
CREATE TABLE IF NOT EXISTS public.weekly_reality (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
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

-- Row Level Security (RLS)
ALTER TABLE public.study_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verdicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.micro_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_reality ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cohort_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gaming_detections ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only access their own data
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
CREATE TRIGGER update_study_users_updated_at BEFORE UPDATE ON public.study_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cohort_stats_updated_at BEFORE UPDATE ON public.cohort_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
