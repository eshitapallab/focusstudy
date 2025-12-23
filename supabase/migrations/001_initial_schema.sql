-- Create users profile table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can only read/update their own profile
CREATE POLICY "Users can view own profile" 
  ON public.users FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON public.users FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON public.users FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Sessions table
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  device_id TEXT NOT NULL,
  start_ts TIMESTAMPTZ NOT NULL,
  end_ts TIMESTAMPTZ,
  paused_ms BIGINT DEFAULT 0,
  mode TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for sessions
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON public.sessions(user_id, start_ts DESC);
CREATE INDEX IF NOT EXISTS sessions_device_id_idx ON public.sessions(device_id, start_ts DESC);

-- Enable RLS
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Users can access their own sessions
CREATE POLICY "Users can view own sessions" 
  ON public.sessions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" 
  ON public.sessions FOR INSERT 
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own sessions" 
  ON public.sessions FOR UPDATE 
  USING (auth.uid() = user_id);

-- Session metadata table
CREATE TABLE IF NOT EXISTS public.session_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  subject TEXT,
  planned BOOLEAN DEFAULT false,
  focus_rating INTEGER CHECK (focus_rating >= 1 AND focus_rating <= 5),
  note TEXT,
  labeled_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.session_metadata ENABLE ROW LEVEL SECURITY;

-- Users can access metadata for their own sessions
CREATE POLICY "Users can view own session metadata" 
  ON public.session_metadata FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions 
      WHERE sessions.id = session_metadata.session_id 
      AND sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own session metadata" 
  ON public.session_metadata FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sessions 
      WHERE sessions.id = session_metadata.session_id 
      AND (sessions.user_id = auth.uid() OR sessions.user_id IS NULL)
    )
  );

CREATE POLICY "Users can update own session metadata" 
  ON public.session_metadata FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions 
      WHERE sessions.id = session_metadata.session_id 
      AND sessions.user_id = auth.uid()
    )
  );

-- Planned sessions table
CREATE TABLE IF NOT EXISTS public.planned_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  device_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  planned_date DATE NOT NULL,
  goal TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for planned sessions
CREATE INDEX IF NOT EXISTS planned_sessions_user_date_idx ON public.planned_sessions(user_id, planned_date);

-- Enable RLS
ALTER TABLE public.planned_sessions ENABLE ROW LEVEL SECURITY;

-- Users can access their own planned sessions
CREATE POLICY "Users can view own planned sessions" 
  ON public.planned_sessions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own planned sessions" 
  ON public.planned_sessions FOR INSERT 
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own planned sessions" 
  ON public.planned_sessions FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own planned sessions" 
  ON public.planned_sessions FOR DELETE 
  USING (auth.uid() = user_id);

-- Device backups table (for recovery)
CREATE TABLE IF NOT EXISTS public.device_backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  last_synced TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.device_backups ENABLE ROW LEVEL SECURITY;

-- Users can access their own device backups
CREATE POLICY "Users can view own device backups" 
  ON public.device_backups FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own device backups" 
  ON public.device_backups FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own device backups" 
  ON public.device_backups FOR UPDATE 
  USING (auth.uid() = user_id);

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, display_name, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
