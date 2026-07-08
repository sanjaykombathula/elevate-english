
CREATE TABLE public.course_modules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_course_modules_course ON public.course_modules(course_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_modules TO authenticated;
GRANT ALL ON public.course_modules TO service_role;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage course_modules" ON public.course_modules
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Students view modules of assigned courses" ON public.course_modules
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.course_assignments ca
    WHERE ca.course_id = course_modules.course_id
      AND (ca.assigned_to_all = true OR ca.user_id = auth.uid())
  ));

CREATE TRIGGER trg_course_modules_updated BEFORE UPDATE ON public.course_modules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.lessons ADD COLUMN module_id uuid REFERENCES public.course_modules(id) ON DELETE SET NULL;
CREATE INDEX idx_lessons_module ON public.lessons(module_id);
