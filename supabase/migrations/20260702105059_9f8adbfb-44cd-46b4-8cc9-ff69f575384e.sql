
-- ============ MODULES ============
CREATE TABLE public.modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  icon text,
  color text,
  sort_order integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.modules TO anon, authenticated;
GRANT ALL ON public.modules TO service_role;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "modules readable by all" ON public.modules FOR SELECT USING (true);
CREATE POLICY "modules admin write" ON public.modules FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ MODULE TASKS ============
CREATE TABLE public.module_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  task_type text NOT NULL DEFAULT 'quiz',
  sort_order integer NOT NULL DEFAULT 0,
  time_limit_seconds integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.module_tasks(module_id);
GRANT SELECT ON public.module_tasks TO anon, authenticated;
GRANT ALL ON public.module_tasks TO service_role;
ALTER TABLE public.module_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tasks readable by all" ON public.module_tasks FOR SELECT USING (true);
CREATE POLICY "tasks admin write" ON public.module_tasks FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ TASK QUESTIONS ============
CREATE TABLE public.task_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.module_tasks(id) ON DELETE CASCADE,
  qtype text NOT NULL,
  prompt text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  correct jsonb NOT NULL DEFAULT '{}'::jsonb,
  explanation text,
  marks integer NOT NULL DEFAULT 1,
  difficulty text NOT NULL DEFAULT 'easy',
  sort_order integer NOT NULL DEFAULT 0,
  media_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.task_questions(task_id);
GRANT SELECT ON public.task_questions TO anon, authenticated;
GRANT ALL ON public.task_questions TO service_role;
ALTER TABLE public.task_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "questions readable by all" ON public.task_questions FOR SELECT USING (true);
CREATE POLICY "questions admin write" ON public.task_questions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ TASK ATTEMPTS ============
CREATE TABLE public.task_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES public.module_tasks(id) ON DELETE CASCADE,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  score integer NOT NULL DEFAULT 0,
  total_marks integer NOT NULL DEFAULT 0,
  percentage numeric(5,2) NOT NULL DEFAULT 0,
  time_spent_seconds integer NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.task_attempts(user_id);
CREATE INDEX ON public.task_attempts(task_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_attempts TO authenticated;
GRANT ALL ON public.task_attempts TO service_role;
ALTER TABLE public.task_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own attempts select" ON public.task_attempts FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own attempts insert" ON public.task_attempts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own attempts update" ON public.task_attempts FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own attempts delete" ON public.task_attempts FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============ USER STATS ============
CREATE TABLE public.user_stats (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  xp_total integer NOT NULL DEFAULT 0,
  streak_current integer NOT NULL DEFAULT 0,
  streak_best integer NOT NULL DEFAULT 0,
  last_active_date date,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.user_stats TO authenticated;
GRANT ALL ON public.user_stats TO service_role;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stats select all authed" ON public.user_stats FOR SELECT TO authenticated USING (true); -- leaderboard
CREATE POLICY "stats own upsert" ON public.user_stats FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "stats own update" ON public.user_stats FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ XP EVENTS ============
CREATE TABLE public.xp_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source text NOT NULL,
  amount integer NOT NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.xp_events(user_id);
GRANT SELECT, INSERT ON public.xp_events TO authenticated;
GRANT ALL ON public.xp_events TO service_role;
ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "xp own select" ON public.xp_events FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "xp own insert" ON public.xp_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ============ BADGES ============
CREATE TABLE public.badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  icon text,
  criteria jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.badges TO anon, authenticated;
GRANT ALL ON public.badges TO service_role;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "badges readable" ON public.badges FOR SELECT USING (true);
CREATE POLICY "badges admin write" ON public.badges FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, badge_id)
);
GRANT SELECT, INSERT ON public.user_badges TO authenticated;
GRANT ALL ON public.user_badges TO service_role;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user badges select" ON public.user_badges FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "user badges insert" ON public.user_badges FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============ CERTIFICATES ============
CREATE TABLE public.certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  cert_number text UNIQUE NOT NULL,
  student_name text NOT NULL,
  module_title text NOT NULL,
  issued_at timestamptz NOT NULL DEFAULT now(),
  score integer,
  UNIQUE (user_id, module_id)
);
CREATE INDEX ON public.certificates(user_id);
GRANT SELECT ON public.certificates TO anon, authenticated;
GRANT INSERT ON public.certificates TO authenticated;
GRANT ALL ON public.certificates TO service_role;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "certs public verify" ON public.certificates FOR SELECT USING (true);
CREATE POLICY "certs own insert" ON public.certificates FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============ NOTIFICATIONS ============
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.notifications(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif own" ON public.notifications FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

-- ============ ANNOUNCEMENTS ============
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  published boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.announcements TO anon, authenticated;
GRANT ALL ON public.announcements TO service_role;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ann readable" ON public.announcements FOR SELECT USING (published = true OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "ann admin write" ON public.announcements FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ updated_at triggers ============
CREATE TRIGGER trg_modules_updated BEFORE UPDATE ON public.modules FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_tasks_updated BEFORE UPDATE ON public.module_tasks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_questions_updated BEFORE UPDATE ON public.task_questions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_attempts_updated BEFORE UPDATE ON public.task_attempts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_stats_updated BEFORE UPDATE ON public.user_stats FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_ann_updated BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ Award XP + streak RPC ============
CREATE OR REPLACE FUNCTION public.award_xp(_amount integer, _source text, _meta jsonb DEFAULT '{}'::jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  today date := (now() AT TIME ZONE 'UTC')::date;
  existing public.user_stats%ROWTYPE;
  new_streak int;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  INSERT INTO public.xp_events (user_id, amount, source, meta) VALUES (uid, _amount, _source, _meta);
  SELECT * INTO existing FROM public.user_stats WHERE user_id = uid;
  IF NOT FOUND THEN
    INSERT INTO public.user_stats (user_id, xp_total, streak_current, streak_best, last_active_date)
    VALUES (uid, GREATEST(_amount,0), 1, 1, today);
  ELSE
    IF existing.last_active_date = today THEN
      new_streak := existing.streak_current;
    ELSIF existing.last_active_date = today - 1 THEN
      new_streak := existing.streak_current + 1;
    ELSE
      new_streak := 1;
    END IF;
    UPDATE public.user_stats
       SET xp_total = xp_total + GREATEST(_amount,0),
           streak_current = new_streak,
           streak_best = GREATEST(streak_best, new_streak),
           last_active_date = today,
           updated_at = now()
     WHERE user_id = uid;
  END IF;
END;
$$;

-- ============ Issue certificate RPC ============
CREATE OR REPLACE FUNCTION public.issue_certificate(_module_id uuid)
RETURNS public.certificates
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  cert public.certificates%ROWTYPE;
  sname text;
  mtitle text;
  cnum text;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO cert FROM public.certificates WHERE user_id = uid AND module_id = _module_id;
  IF FOUND THEN RETURN cert; END IF;
  SELECT COALESCE(name, email, 'Student') INTO sname FROM public.profiles WHERE id = uid;
  SELECT title INTO mtitle FROM public.modules WHERE id = _module_id;
  cnum := 'CE-' || to_char(now(),'YYYY') || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8));
  INSERT INTO public.certificates (user_id, module_id, cert_number, student_name, module_title)
  VALUES (uid, _module_id, cnum, COALESCE(sname,'Student'), COALESCE(mtitle,'Module'))
  RETURNING * INTO cert;
  RETURN cert;
END;
$$;

-- ============ Seed 4 modules + 12 tasks ============
INSERT INTO public.modules (id, title, description, icon, color, sort_order) VALUES
  ('11111111-1111-1111-1111-111111111111','Communication Skills','Master everyday and professional communication.','MessageCircle','#2563EB',1),
  ('22222222-2222-2222-2222-222222222222','Vocabulary','Build a powerful, precise English vocabulary.','BookOpen','#22C55E',2),
  ('33333333-3333-3333-3333-333333333333','Interview Skills','Ace HR and technical interview rounds.','Briefcase','#F59E0B',3),
  ('44444444-4444-4444-4444-444444444444','Professional English','Grammar, listening and workplace English.','GraduationCap','#8B5CF6',4);

INSERT INTO public.module_tasks (module_id, title, task_type, sort_order) VALUES
  ('11111111-1111-1111-1111-111111111111','Communication MCQs','mcq',1),
  ('11111111-1111-1111-1111-111111111111','Fill in the Blanks','fill',2),
  ('11111111-1111-1111-1111-111111111111','Paragraph Reading','reading',3),
  ('22222222-2222-2222-2222-222222222222','Vocabulary MCQs','mcq',1),
  ('22222222-2222-2222-2222-222222222222','Word Matching','match',2),
  ('22222222-2222-2222-2222-222222222222','Sentence Formation','rearrange',3),
  ('33333333-3333-3333-3333-333333333333','Situation Based Questions','mcq',1),
  ('33333333-3333-3333-3333-333333333333','Voice to Text','speech',2),
  ('33333333-3333-3333-3333-333333333333','Video / Audio Response','recording',3),
  ('44444444-4444-4444-4444-444444444444','Listening','listening',1),
  ('44444444-4444-4444-4444-444444444444','Speech to Text','speech',2),
  ('44444444-4444-4444-4444-444444444444','Grammar Correction','fill',3);

-- Seed badges
INSERT INTO public.badges (code, title, description, icon) VALUES
  ('first_task','First Steps','Complete your first task.','Sparkles'),
  ('streak_7','Week Warrior','Maintain a 7-day learning streak.','Flame'),
  ('perfect_task','Perfect Score','Score 100% on any task.','Trophy'),
  ('module_master','Module Master','Complete all tasks in a module.','Award'),
  ('xp_1000','Rising Star','Earn 1000 XP.','Star')
ON CONFLICT (code) DO NOTHING;
