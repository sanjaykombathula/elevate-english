import React, { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/lib/app-context';
import { FileDown, Loader2, ClipboardCheck, Upload, BookOpen, Lightbulb, TrendingUp } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface AttemptRow {
  id: string; assessment_id: string; score: number; total_marks: number;
  percentage: number; passed: boolean; submitted_at: string;
  assessment_title?: string;
}
interface SubmissionRow {
  id: string; submission_type: string; status: string; score: number | null;
  admin_comments: string | null; created_at: string; title: string | null;
}
interface RecRow { assessmentTitle: string; percentage: number; courseTitle: string; }

export default function ReportPage() {
  const { session, user } = useApp();
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState<AttemptRow[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [recs, setRecs] = useState<RecRow[]>([]);
  const [courseStats, setCourseStats] = useState({ completed: 0, total: 0 });

  useEffect(() => {
    const uid = session?.user?.id;
    if (!uid) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      const [attRes, subRes, lessonsRes, progressRes] = await Promise.all([
        supabase.from('assessment_attempts').select('id, assessment_id, score, total_marks, percentage, passed, submitted_at').eq('user_id', uid).order('submitted_at', { ascending: false }),
        supabase.from('task_submissions').select('id, submission_type, status, score, admin_comments, created_at, title').eq('user_id', uid).order('created_at', { ascending: false }),
        supabase.from('lessons').select('id'),
        supabase.from('lesson_progress').select('lesson_id, completed').eq('user_id', uid),
      ]);

      const attData = attRes.data || [];
      const assessmentIds = Array.from(new Set(attData.map(a => a.assessment_id)));
      let assessMap = new Map<string, any>();
      if (assessmentIds.length) {
        const { data: aRows } = await supabase.from('assessments').select('id, title, recommended_course_id, passing_marks').in('id', assessmentIds);
        assessMap = new Map((aRows || []).map(a => [a.id, a]));
      }
      setAttempts(attData.map(a => ({ ...a, assessment_title: assessMap.get(a.assessment_id)?.title || 'Assessment' })));
      setSubmissions(subRes.data || []);

      const totalLessons = (lessonsRes.data || []).length;
      const completedLessons = (progressRes.data || []).filter((p: any) => p.completed).length;
      setCourseStats({ completed: completedLessons, total: totalLessons });

      // Recommendations
      const latest = new Map<string, any>();
      for (const a of attData) if (!latest.has(a.assessment_id)) latest.set(a.assessment_id, a);
      const weak = Array.from(latest.values()).filter(a => !a.passed || Number(a.percentage) < 60);
      const courseIds = Array.from(new Set(weak.map(a => assessMap.get(a.assessment_id)?.recommended_course_id).filter(Boolean)));
      let courseMap = new Map<string, any>();
      if (courseIds.length) {
        const { data: courses } = await supabase.from('courses').select('id, title').in('id', courseIds);
        courseMap = new Map((courses || []).map(c => [c.id, c]));
      }
      const recList: RecRow[] = [];
      const seen = new Set<string>();
      for (const a of weak) {
        const meta = assessMap.get(a.assessment_id);
        const c = meta?.recommended_course_id ? courseMap.get(meta.recommended_course_id) : null;
        if (!c || seen.has(c.id)) continue;
        seen.add(c.id);
        recList.push({ assessmentTitle: meta.title, percentage: Number(a.percentage), courseTitle: c.title });
      }
      setRecs(recList);
      setLoading(false);
    })();
  }, [session?.user?.id]);

  const avgAssessment = attempts.length ? Math.round(attempts.reduce((s, a) => s + Number(a.percentage), 0) / attempts.length) : 0;
  const reviewedSubs = submissions.filter(s => s.status === 'reviewed' && s.score != null);
  const avgSubmission = reviewedSubs.length ? Math.round(reviewedSubs.reduce((s, x) => s + (x.score || 0), 0) / reviewedSubs.length) : 0;
  const completionPct = courseStats.total ? Math.round((courseStats.completed / courseStats.total) * 100) : 0;

  const exportPdf = () => {
    const doc = new jsPDF();
    const name = user?.name || session?.user?.email || 'Student';
    const today = new Date().toLocaleDateString();

    doc.setFontSize(18);
    doc.text('Student Performance Report', 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Student: ${name}`, 14, 26);
    doc.text(`Email: ${session?.user?.email || ''}`, 14, 31);
    doc.text(`Generated: ${today}`, 14, 36);

    doc.setTextColor(0);
    doc.setFontSize(12);
    doc.text('Summary', 14, 46);
    autoTable(doc, {
      startY: 50,
      head: [['Metric', 'Value']],
      body: [
        ['Average Assessment Score', `${avgAssessment}%`],
        ['Assessments Attempted', `${attempts.length}`],
        ['Average Task Score', reviewedSubs.length ? `${avgSubmission}/100` : 'N/A'],
        ['Tasks Submitted', `${submissions.length}`],
        ['Lesson Completion', `${courseStats.completed}/${courseStats.total} (${completionPct}%)`],
      ],
      theme: 'striped',
      headStyles: { fillColor: [34, 87, 53] },
    });

    let y = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text('Assessment Scores', 14, y);
    autoTable(doc, {
      startY: y + 4,
      head: [['Assessment', 'Score', 'Total', 'Percentage', 'Result', 'Date']],
      body: attempts.length ? attempts.map(a => [
        a.assessment_title || '', String(a.score), String(a.total_marks),
        `${a.percentage}%`, a.passed ? 'Passed' : 'Failed',
        new Date(a.submitted_at).toLocaleDateString(),
      ]) : [['No attempts yet', '', '', '', '', '']],
      theme: 'grid',
      headStyles: { fillColor: [34, 87, 53] },
      styles: { fontSize: 9 },
    });

    y = (doc as any).lastAutoTable.finalY + 10;
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFontSize(12);
    doc.text('Task Submission Scores', 14, y);
    autoTable(doc, {
      startY: y + 4,
      head: [['Type', 'Title', 'Status', 'Score', 'Feedback', 'Date']],
      body: submissions.length ? submissions.map(s => [
        s.submission_type, s.title || '-', s.status,
        s.score != null ? `${s.score}/100` : '-',
        (s.admin_comments || '-').slice(0, 60),
        new Date(s.created_at).toLocaleDateString(),
      ]) : [['No submissions yet', '', '', '', '', '']],
      theme: 'grid',
      headStyles: { fillColor: [34, 87, 53] },
      styles: { fontSize: 9 },
    });

    y = (doc as any).lastAutoTable.finalY + 10;
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFontSize(12);
    doc.text('Recommendations', 14, y);
    autoTable(doc, {
      startY: y + 4,
      head: [['Weak Area', 'Score', 'Recommended Course']],
      body: recs.length ? recs.map(r => [r.assessmentTitle, `${r.percentage}%`, r.courseTitle])
        : [['No recommendations — keep up the great work!', '', '']],
      theme: 'grid',
      headStyles: { fillColor: [217, 138, 36] },
      styles: { fontSize: 9 },
    });

    doc.save(`student-report-${name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.pdf`);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="container py-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container py-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold">Student Report</h1>
            <p className="text-sm text-muted-foreground">A complete summary of your learning performance</p>
          </div>
          <button onClick={exportPdf} className="bg-primary text-primary-foreground hover:opacity-90 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-opacity">
            <FileDown className="w-4 h-4" /> Export as PDF
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-card rounded-2xl p-5 card-shadow">
            <div className="flex items-center gap-2 text-muted-foreground"><ClipboardCheck className="w-4 h-4" /><span className="text-xs">Avg Assessment</span></div>
            <p className="font-display text-2xl font-bold mt-2 tabular-nums">{avgAssessment}%</p>
            <p className="text-xs text-muted-foreground mt-1">{attempts.length} attempt{attempts.length === 1 ? '' : 's'}</p>
          </div>
          <div className="bg-card rounded-2xl p-5 card-shadow">
            <div className="flex items-center gap-2 text-muted-foreground"><Upload className="w-4 h-4" /><span className="text-xs">Avg Task Score</span></div>
            <p className="font-display text-2xl font-bold mt-2 tabular-nums">{reviewedSubs.length ? `${avgSubmission}/100` : '—'}</p>
            <p className="text-xs text-muted-foreground mt-1">{submissions.length} submission{submissions.length === 1 ? '' : 's'}</p>
          </div>
          <div className="bg-card rounded-2xl p-5 card-shadow">
            <div className="flex items-center gap-2 text-muted-foreground"><BookOpen className="w-4 h-4" /><span className="text-xs">Lesson Completion</span></div>
            <p className="font-display text-2xl font-bold mt-2 tabular-nums">{completionPct}%</p>
            <p className="text-xs text-muted-foreground mt-1">{courseStats.completed}/{courseStats.total} lessons</p>
          </div>
          <div className="bg-card rounded-2xl p-5 card-shadow">
            <div className="flex items-center gap-2 text-muted-foreground"><TrendingUp className="w-4 h-4" /><span className="text-xs">Recommendations</span></div>
            <p className="font-display text-2xl font-bold mt-2 tabular-nums">{recs.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Suggested courses</p>
          </div>
        </div>

        {/* Assessment Scores */}
        <div className="bg-card rounded-2xl p-5 card-shadow">
          <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2"><ClipboardCheck className="w-4 h-4 text-primary" /> Assessment Scores</h2>
          {attempts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No assessments attempted yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground border-b">
                  <tr><th className="text-left py-2">Assessment</th><th className="text-left py-2">Score</th><th className="text-left py-2">%</th><th className="text-left py-2">Result</th><th className="text-left py-2">Date</th></tr>
                </thead>
                <tbody>
                  {attempts.map(a => (
                    <tr key={a.id} className="border-b last:border-0">
                      <td className="py-2 font-medium">{a.assessment_title}</td>
                      <td className="py-2 tabular-nums">{a.score}/{a.total_marks}</td>
                      <td className="py-2 tabular-nums">{a.percentage}%</td>
                      <td className="py-2"><span className={`text-xs px-2 py-0.5 rounded-full ${a.passed ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'}`}>{a.passed ? 'Passed' : 'Failed'}</span></td>
                      <td className="py-2 text-muted-foreground">{new Date(a.submitted_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Task Scores */}
        <div className="bg-card rounded-2xl p-5 card-shadow">
          <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2"><Upload className="w-4 h-4 text-primary" /> Task Submission Scores</h2>
          {submissions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No submissions yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground border-b">
                  <tr><th className="text-left py-2">Type</th><th className="text-left py-2">Title</th><th className="text-left py-2">Status</th><th className="text-left py-2">Score</th><th className="text-left py-2">Feedback</th><th className="text-left py-2">Date</th></tr>
                </thead>
                <tbody>
                  {submissions.map(s => (
                    <tr key={s.id} className="border-b last:border-0">
                      <td className="py-2 capitalize">{s.submission_type}</td>
                      <td className="py-2 font-medium">{s.title || '—'}</td>
                      <td className="py-2"><span className={`text-xs px-2 py-0.5 rounded-full ${s.status === 'reviewed' ? 'bg-success/15 text-success' : 'bg-accent/20 text-accent-foreground'}`}>{s.status}</span></td>
                      <td className="py-2 tabular-nums">{s.score != null ? `${s.score}/100` : '—'}</td>
                      <td className="py-2 text-muted-foreground truncate max-w-[260px]">{s.admin_comments || '—'}</td>
                      <td className="py-2 text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recommendations */}
        <div className="bg-card rounded-2xl p-5 card-shadow">
          <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2"><Lightbulb className="w-4 h-4 text-accent" /> Recommendations</h2>
          {recs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recommendations — keep up the great work!</p>
          ) : (
            <div className="space-y-2">
              {recs.map((r, i) => (
                <div key={i} className="border border-border rounded-xl p-3 flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-xs text-muted-foreground">Weak area: {r.assessmentTitle} ({r.percentage}%)</p>
                    <p className="text-sm font-semibold mt-0.5">{r.courseTitle}</p>
                  </div>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-md font-medium">Recommended course</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
