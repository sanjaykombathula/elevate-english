
CREATE TABLE public.assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  duration_minutes integer NOT NULL DEFAULT 30,
  total_marks integer NOT NULL DEFAULT 0,
  passing_marks integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assessments TO authenticated;
GRANT ALL ON public.assessments TO service_role;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage assessments" ON public.assessments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Students view published assessments" ON public.assessments FOR SELECT TO authenticated
  USING (published = true);
CREATE TRIGGER assessments_updated BEFORE UPDATE ON public.assessments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.assessment_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  question_type text NOT NULL DEFAULT 'mcq',
  options jsonb,
  correct_answer text NOT NULL,
  marks integer NOT NULL DEFAULT 1,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assessment_questions TO authenticated;
GRANT ALL ON public.assessment_questions TO service_role;
ALTER TABLE public.assessment_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage questions" ON public.assessment_questions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Students view questions of published assessments" ON public.assessment_questions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.assessments a WHERE a.id = assessment_id AND a.published = true));

CREATE TABLE public.assessment_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  score integer NOT NULL DEFAULT 0,
  total_marks integer NOT NULL DEFAULT 0,
  percentage numeric(5,2) NOT NULL DEFAULT 0,
  passed boolean NOT NULL DEFAULT false,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assessment_attempts TO authenticated;
GRANT ALL ON public.assessment_attempts TO service_role;
ALTER TABLE public.assessment_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students manage own attempts" ON public.assessment_attempts FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all attempts" ON public.assessment_attempts FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.submit_assessment(_assessment_id uuid, _answers jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  q record;
  user_ans text;
  earned integer := 0;
  total integer := 0;
  pass_marks integer;
  pct numeric(5,2);
  passed_flag boolean;
  attempt_id uuid;
  details jsonb := '[]'::jsonb;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT passing_marks INTO pass_marks FROM public.assessments WHERE id = _assessment_id AND published = true;
  IF pass_marks IS NULL THEN RAISE EXCEPTION 'Assessment not available'; END IF;

  FOR q IN SELECT id, correct_answer, marks, question_text FROM public.assessment_questions WHERE assessment_id = _assessment_id LOOP
    total := total + q.marks;
    user_ans := _answers ->> q.id::text;
    IF user_ans IS NOT NULL AND lower(btrim(user_ans)) = lower(btrim(q.correct_answer)) THEN
      earned := earned + q.marks;
      details := details || jsonb_build_object('question_id', q.id, 'correct', true, 'user_answer', user_ans, 'correct_answer', q.correct_answer);
    ELSE
      details := details || jsonb_build_object('question_id', q.id, 'correct', false, 'user_answer', user_ans, 'correct_answer', q.correct_answer);
    END IF;
  END LOOP;

  pct := CASE WHEN total > 0 THEN ROUND((earned::numeric / total) * 100, 2) ELSE 0 END;
  passed_flag := earned >= pass_marks;

  INSERT INTO public.assessment_attempts (assessment_id, user_id, answers, score, total_marks, percentage, passed)
  VALUES (_assessment_id, uid, _answers, earned, total, pct, passed_flag)
  RETURNING id INTO attempt_id;

  RETURN jsonb_build_object('attempt_id', attempt_id, 'score', earned, 'total', total, 'percentage', pct, 'passed', passed_flag, 'details', details);
END;
$$;
