
CREATE TABLE public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  cover_url text DEFAULT '',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  video_url text DEFAULT '',
  pdf_url text DEFAULT '',
  external_url text DEFAULT '',
  order_index int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.course_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id uuid,
  assigned_to_all boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (course_id, user_id)
);

CREATE INDEX idx_lessons_course ON public.lessons(course_id);
CREATE INDEX idx_assignments_user ON public.course_assignments(user_id);
CREATE INDEX idx_assignments_course ON public.course_assignments(course_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.courses TO authenticated;
GRANT ALL ON public.courses TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lessons TO authenticated;
GRANT ALL ON public.lessons TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_assignments TO authenticated;
GRANT ALL ON public.course_assignments TO service_role;

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_assignments ENABLE ROW LEVEL SECURITY;

-- Courses
CREATE POLICY "Admins manage courses" ON public.courses
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Students view assigned courses" ON public.courses
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.course_assignments ca
      WHERE ca.course_id = courses.id
        AND (ca.assigned_to_all = true OR ca.user_id = auth.uid())
    )
  );

-- Lessons
CREATE POLICY "Admins manage lessons" ON public.lessons
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Students view lessons of assigned courses" ON public.lessons
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.course_assignments ca
      WHERE ca.course_id = lessons.course_id
        AND (ca.assigned_to_all = true OR ca.user_id = auth.uid())
    )
  );

-- Assignments
CREATE POLICY "Admins manage assignments" ON public.course_assignments
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users view own assignments" ON public.course_assignments
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR assigned_to_all = true);

CREATE TRIGGER trg_courses_updated BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_lessons_updated BEFORE UPDATE ON public.lessons
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
