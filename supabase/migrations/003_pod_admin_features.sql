-- Pod Admin Features Migration
-- Adds: member approval system, admin controls, pod destruction on owner leave

-- Add status column to pod_members for approval workflow
ALTER TABLE public.pod_members
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'approved'
  CHECK (status IN ('pending', 'approved', 'rejected'));

-- Add name to pods for better identification
ALTER TABLE public.pods
  ADD COLUMN IF NOT EXISTS name TEXT;

-- Update existing members to be approved
UPDATE public.pod_members SET status = 'approved' WHERE status IS NULL;

-- Function to get pod info including creation date and owner status
CREATE OR REPLACE FUNCTION public.get_pod_info(p_pod_id UUID)
RETURNS TABLE(
  pod_id UUID,
  pod_name TEXT,
  owner_id UUID,
  invite_code TEXT,
  weekly_goal_minutes INTEGER,
  created_at TIMESTAMPTZ,
  is_owner BOOLEAN,
  member_count INTEGER,
  pending_count INTEGER
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
    p.id AS pod_id,
    p.name AS pod_name,
    p.owner_id,
    p.invite_code,
    p.weekly_goal_minutes,
    p.created_at,
    (p.owner_id = auth.uid()) AS is_owner,
    (SELECT COUNT(*)::INTEGER FROM public.pod_members pm WHERE pm.pod_id = p.id AND pm.status = 'approved') AS member_count,
    (SELECT COUNT(*)::INTEGER FROM public.pod_members pm WHERE pm.pod_id = p.id AND pm.status = 'pending') AS pending_count
  FROM public.pods p
  WHERE p.id = p_pod_id;
END;
$$;

-- Update join_pod to set status as 'pending' for non-owners
CREATE OR REPLACE FUNCTION public.join_pod(p_invite_code TEXT, p_display_name TEXT DEFAULT 'Anonymous')
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_pod_id UUID;
  target_owner_id UUID;
  member_count INTEGER;
  safe_name TEXT;
  is_already_member BOOLEAN;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Sanitize display name
  safe_name := COALESCE(NULLIF(trim(p_display_name), ''), 'Anonymous');
  IF length(safe_name) > 20 THEN
    safe_name := substring(safe_name, 1, 20);
  END IF;

  SELECT id, owner_id INTO target_pod_id, target_owner_id
  FROM public.pods
  WHERE invite_code = upper(trim(p_invite_code))
  LIMIT 1;

  IF target_pod_id IS NULL THEN
    RAISE EXCEPTION 'Invalid invite code';
  END IF;

  -- Check if already a member
  SELECT EXISTS(
    SELECT 1 FROM public.pod_members 
    WHERE pod_id = target_pod_id AND user_id = auth.uid()
  ) INTO is_already_member;

  IF is_already_member THEN
    -- Update display name if already member
    UPDATE public.pod_members
    SET display_name = safe_name
    WHERE pod_id = target_pod_id AND user_id = auth.uid();
    RETURN target_pod_id;
  END IF;

  -- Count approved members only
  SELECT count(*) INTO member_count
  FROM public.pod_members
  WHERE pod_id = target_pod_id AND status = 'approved';

  IF member_count >= 5 THEN
    RAISE EXCEPTION 'Pod is full (max 5 members)';
  END IF;

  -- Insert as pending (owner will need to approve)
  INSERT INTO public.pod_members (pod_id, user_id, display_name, status)
  VALUES (target_pod_id, auth.uid(), safe_name, 'pending');

  RETURN target_pod_id;
END;
$$;

-- Function for admin to approve a pending member
CREATE OR REPLACE FUNCTION public.approve_pod_member(p_pod_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  approved_count INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if current user is the pod owner
  IF NOT EXISTS (SELECT 1 FROM public.pods WHERE id = p_pod_id AND owner_id = auth.uid()) THEN
    RAISE EXCEPTION 'Only pod owner can approve members';
  END IF;

  -- Check current approved member count
  SELECT COUNT(*) INTO approved_count
  FROM public.pod_members
  WHERE pod_id = p_pod_id AND status = 'approved';

  IF approved_count >= 5 THEN
    RAISE EXCEPTION 'Pod is full (max 5 members)';
  END IF;

  -- Approve the member
  UPDATE public.pod_members
  SET status = 'approved', joined_at = NOW()
  WHERE pod_id = p_pod_id AND user_id = p_user_id AND status = 'pending';

  RETURN FOUND;
END;
$$;

-- Function for admin to reject a pending member
CREATE OR REPLACE FUNCTION public.reject_pod_member(p_pod_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if current user is the pod owner
  IF NOT EXISTS (SELECT 1 FROM public.pods WHERE id = p_pod_id AND owner_id = auth.uid()) THEN
    RAISE EXCEPTION 'Only pod owner can reject members';
  END IF;

  -- Remove the pending member
  DELETE FROM public.pod_members
  WHERE pod_id = p_pod_id AND user_id = p_user_id AND status = 'pending';

  RETURN FOUND;
END;
$$;

-- Function for admin to remove an approved member
CREATE OR REPLACE FUNCTION public.remove_pod_member(p_pod_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if current user is the pod owner
  IF NOT EXISTS (SELECT 1 FROM public.pods WHERE id = p_pod_id AND owner_id = auth.uid()) THEN
    RAISE EXCEPTION 'Only pod owner can remove members';
  END IF;

  -- Cannot remove yourself (use leave_pod instead)
  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot remove yourself. Use leave pod instead.';
  END IF;

  -- Remove the member's study session if active
  DELETE FROM public.pod_study_sessions WHERE pod_id = p_pod_id AND user_id = p_user_id;
  
  -- Remove the member
  DELETE FROM public.pod_members
  WHERE pod_id = p_pod_id AND user_id = p_user_id;

  RETURN FOUND;
END;
$$;

-- Update leave_pod to ALWAYS destroy pod when owner leaves
CREATE OR REPLACE FUNCTION public.leave_pod(p_pod_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_owner BOOLEAN;
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

  -- If owner leaves, destroy the entire pod
  IF is_owner THEN
    -- Delete all related data
    DELETE FROM public.pod_study_sessions WHERE pod_id = p_pod_id;
    DELETE FROM public.pod_messages WHERE pod_id = p_pod_id;
    DELETE FROM public.pod_kudos WHERE pod_id = p_pod_id;
    DELETE FROM public.pod_achievements WHERE pod_id = p_pod_id;
    DELETE FROM public.pod_daily_stats WHERE pod_id = p_pod_id;
    DELETE FROM public.pod_members WHERE pod_id = p_pod_id;
    DELETE FROM public.pods WHERE id = p_pod_id;
    RETURN true;
  END IF;

  -- Regular member leaving: just remove their data
  DELETE FROM public.pod_study_sessions WHERE pod_id = p_pod_id AND user_id = auth.uid();
  DELETE FROM public.pod_members WHERE pod_id = p_pod_id AND user_id = auth.uid();

  RETURN true;
END;
$$;

-- Update get_pod_status_enhanced to include status and joined_at
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
  kudos_from_me BOOLEAN,
  member_status TEXT,
  joined_at TIMESTAMPTZ,
  is_owner BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  first_check_in_user UUID;
  week_start DATE;
  pod_owner_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public._is_pod_member(p_pod_id, auth.uid()) THEN
    RAISE EXCEPTION 'Not a pod member';
  END IF;

  week_start := date_trunc('week', p_date)::DATE;

  -- Get pod owner
  SELECT p.owner_id INTO pod_owner_id FROM public.pods p WHERE p.id = p_pod_id;

  -- Find who checked in first today (among approved members only)
  SELECT d.user_id INTO first_check_in_user
  FROM public.daily_check_ins d
  INNER JOIN public.pod_members pm ON pm.user_id = d.user_id AND pm.pod_id = p_pod_id AND pm.status = 'approved'
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
    ) AS kudos_from_me,
    pm.status AS member_status,
    pm.joined_at,
    (pm.user_id = pod_owner_id) AS is_owner
  FROM public.pod_members pm
  WHERE pm.pod_id = p_pod_id
  -- Show all members to owner, but only approved to regular members
  AND (
    pm.status = 'approved' 
    OR (auth.uid() = pod_owner_id AND pm.status = 'pending')
  );
END;
$$;

-- Update _is_pod_member to only consider approved members for most checks
-- But keep allowing pending members to see the pod (for status page)
CREATE OR REPLACE FUNCTION public._is_pod_member(p_pod_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.pod_members
    WHERE pod_id = p_pod_id AND user_id = p_user_id
    AND status IN ('approved', 'pending')
  );
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_pod_info(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_pod_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_pod_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_pod_member(UUID, UUID) TO authenticated;
