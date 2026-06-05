import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/lib/app-context';
import { Lightbulb, ArrowRight, AlertTriangle, BookOpen, Loader2 } from 'lucide-react';

interface Recommendation {
  assessmentId: string;
  assessmentTitle: string;
  percentage: number;
  passingMarks: number;
  totalMarks: number;
  score: number;
  courseId: string;
  courseTitle: string;
  lessonCount: number;
  reason: string;
}

const WEAK_THRESHOLD = 60; // recommend when below 60% even if no passing mark set

export default function Recommendations() {
  const { session } = useApp();
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user) { setLoading(false); return; }
    const userId = session.user.id;

    const load = async () => {
      setLoading(true);
      // Fetch the user's most recent attempts
      const { data: attempts } = await supabase
        .from('assessment_attempts')
        .select('assessment_id, score, total_marks, percentage, passed, submitted_at')
        .eq('user_id', userId)
        .order('submitted_at', { ascending: false });

      if (!attempts || attempts.length === 0) { setRecs([]); setLoading(false); return; }

      // Keep latest attempt per assessment
      const latest = new Map<string, any>();
      for (const a of attempts) if (!latest.has(a.assessment_id)) latest.set(a.assessment_id, a);

      const weakIds = Array.from(latest.values())
        .filter(a => !a.passed || Number(a.percentage) < WEAK_THRESHOLD)
        .map(a => a.assessment_id);

      if (weakIds.length === 0) { setRecs([]); setLoading(false); return; }

      const { data: assessments } = await supabase
        .from('assessments')
        .select('id, title, passing_marks, recommended_course_id')
        .in('id', weakIds);

      const courseIds = Array.from(new Set(
        (assessments || []).map((a: any) => a.recommended_course_id).filter(Boolean)
      ));
      if (courseIds.length === 0) { setRecs([]); setLoading(false); return; }

      const [{ data: courses }, { data: lessons }] = await Promise.all([
        supabase.from('courses').select('id, title').in('id', courseIds),
        supabase.from('lessons').select('id, course_id').in('course_id', courseIds),
      ]);
      const courseMap = new Map((courses || []).map((c: any) => [c.id, c]));
      const lessonCountByCourse = new Map<string, number>();
      (lessons || []).forEach((l: any) => {
        lessonCountByCourse.set(l.course_id, (lessonCountByCourse.get(l.course_id) || 0) + 1);
      });

      const out: Recommendation[] = [];
      for (const a of assessments || []) {
        if (!a.recommended_course_id) continue;
        const course: any = courseMap.get(a.recommended_course_id);
        if (!course) continue; // student may not be assigned to this course
        const att = latest.get(a.id);
        out.push({
          assessmentId: a.id,
          assessmentTitle: a.title,
          percentage: Number(att.percentage),
          passingMarks: a.passing_marks,
          totalMarks: att.total_marks,
          score: att.score,
          courseId: course.id,
          courseTitle: course.title,
          lessonCount: lessonCountByCourse.get(course.id) || 0,
          reason: !att.passed
            ? `Scored ${att.percentage}% (below passing ${a.passing_marks}/${att.total_marks})`
            : `Scored ${att.percentage}% — strengthen the fundamentals`,
        });
      }
      // Dedupe by course, keep weakest first
      const seen = new Set<string>();
      const deduped = out
        .sort((a, b) => a.percentage - b.percentage)
        .filter(r => (seen.has(r.courseId) ? false : (seen.add(r.courseId), true)))
        .slice(0, 4);

      setRecs(deduped);
      setLoading(false);
    };

    load();

    const channel = supabase
      .channel(`recs-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assessment_attempts', filter: `user_id=eq.${userId}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session?.user?.id]);

  if (loading) {
    return (
      <div className="bg-card rounded-2xl p-5 card-shadow">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-4 h-4 text-accent" />
          <h2 className="font-display text-lg font-bold">Recommended for You</h2>
        </div>
        <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      </div>
    );
  }

  if (recs.length === 0) return null;

  return (
    <div className="bg-card rounded-2xl p-5 card-shadow">
      <div className="flex items-center gap-2 mb-1">
        <Lightbulb className="w-4 h-4 text-accent" />
        <h2 className="font-display text-lg font-bold">Recommended for You</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-4">Based on your recent assessment scores</p>
      <div className="space-y-3">
        {recs.map(r => (
          <div key={r.assessmentId} className="border border-border rounded-xl p-4 hover:bg-secondary/40 transition-colors">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">From: {r.assessmentTitle}</p>
                <p className="text-sm font-medium mt-0.5">{r.reason}</p>
                <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 text-sm">
                    <BookOpen className="w-4 h-4 text-primary" />
                    <span className="font-semibold">{r.courseTitle}</span>
                    <span className="text-xs text-muted-foreground">· {r.lessonCount} lesson{r.lessonCount === 1 ? '' : 's'}</span>
                  </div>
                  <Link
                    to={`/courses?course=${r.courseId}`}
                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    Start lessons <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
