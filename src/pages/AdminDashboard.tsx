import React, { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { useApp } from '@/lib/app-context';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Users, BookOpen, ClipboardCheck, Upload, FileText, TrendingUp, Clock,
  CheckCircle2, AlertCircle, ShieldCheck, Loader2, ArrowRight,
} from 'lucide-react';

interface DashboardStats {
  totalStudents: number;
  activeStudents: number;
  inactiveStudents: number;
  totalLessons: number;
  completedLessons: number;
  totalAssessments: number;
  totalAttempts: number;
  avgPassRate: number;
  totalSubmissions: number;
  pendingSubmissions: number;
  reviewedSubmissions: number;
}

interface RecentStudent {
  id: string;
  name: string;
  email: string;
  college: string | null;
  created_at: string;
  total_marks: number | null;
}

interface RecentAttempt {
  id: string;
  user_name: string;
  assessment_title: string;
  score: number;
  total_marks: number;
  passed: boolean;
  created_at: string;
}

interface RecentSubmission {
  id: string;
  user_name: string;
  title: string;
  submission_type: string;
  status: string;
  created_at: string;
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

export default function AdminDashboardPage() {
  const { isAdmin } = useApp();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0, activeStudents: 0, inactiveStudents: 0,
    totalLessons: 0, completedLessons: 0,
    totalAssessments: 0, totalAttempts: 0, avgPassRate: 0,
    totalSubmissions: 0, pendingSubmissions: 0, reviewedSubmissions: 0,
  });
  const [recentStudents, setRecentStudents] = useState<RecentStudent[]>([]);
  const [recentAttempts, setRecentAttempts] = useState<RecentAttempt[]>([]);
  const [recentSubmissions, setRecentSubmissions] = useState<RecentSubmission[]>([]);
  const [topStudents, setTopStudents] = useState<RecentStudent[]>([]);

  useEffect(() => {
    if (!isAdmin) return;
    loadDashboard();
  }, [isAdmin]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      // Students
      const { data: students, error: sErr } = await supabase
        .from('profiles')
        .select('id, active, total_marks, name, email, college, created_at')
        .order('created_at', { ascending: false });
      if (sErr) throw sErr;
      const allStudents = (students as any[]) || [];
      const activeStudents = allStudents.filter(s => s.active !== false).length;
      setStats(prev => ({
        ...prev,
        totalStudents: allStudents.length,
        activeStudents,
        inactiveStudents: allStudents.length - activeStudents,
      }));
      setRecentStudents(allStudents.slice(0, 5).map(s => ({
        id: s.id,
        name: s.name || 'Unnamed',
        email: s.email || '',
        college: s.college,
        created_at: s.created_at,
        total_marks: s.total_marks,
      })));
      setTopStudents(
        [...allStudents]
          .sort((a, b) => (b.total_marks || 0) - (a.total_marks || 0))
          .slice(0, 5)
          .map(s => ({
            id: s.id,
            name: s.name || 'Unnamed',
            email: s.email || '',
            college: s.college,
            created_at: s.created_at,
            total_marks: s.total_marks,
          }))
      );

      // Lessons
      const { count: lessonCount, error: lErr } = await supabase
        .from('lessons').select('*', { count: 'exact', head: true });
      if (lErr) throw lErr;
      const { count: completedCount, error: lcErr } = await supabase
        .from('lesson_progress').select('*', { count: 'exact', head: true }).eq('completed', true);
      if (lcErr) throw lcErr;
      setStats(prev => ({
        ...prev,
        totalLessons: lessonCount || 0,
        completedLessons: completedCount || 0,
      }));

      // Assessments
      const { count: assessmentCount, error: aErr } = await supabase
        .from('assessments').select('*', { count: 'exact', head: true });
      if (aErr) throw aErr;
      const { data: attempts, error: atErr } = await supabase
        .from('assessment_attempts')
        .select('id, score, total_marks, passed, created_at, user_id, assessment_id')
        .order('created_at', { ascending: false })
        .limit(100);
      if (atErr) throw atErr;
      const allAttempts = (attempts as any[]) || [];
      const passedCount = allAttempts.filter(a => a.passed).length;
      setStats(prev => ({
        ...prev,
        totalAssessments: assessmentCount || 0,
        totalAttempts: allAttempts.length,
        avgPassRate: allAttempts.length ? Math.round((passedCount / allAttempts.length) * 100) : 0,
      }));

      // Fetch assessment titles & user names for recent attempts
      const assessmentIds = Array.from(new Set(allAttempts.slice(0, 5).map(a => a.assessment_id)));
      const userIds = Array.from(new Set(allAttempts.slice(0, 5).map(a => a.user_id)));
      const [{ data: assessmentsData }, { data: profilesData }] = await Promise.all([
        assessmentIds.length ? supabase.from('assessments').select('id,title').in('id', assessmentIds) : Promise.resolve({ data: [] }),
        userIds.length ? supabase.from('profiles').select('id,name').in('id', userIds) : Promise.resolve({ data: [] }),
      ]);
      const assessmentMap = new Map((assessmentsData as any[] || []).map(a => [a.id, a.title]));
      const profileMap = new Map((profilesData as any[] || []).map(p => [p.id, p.name]));
      setRecentAttempts(allAttempts.slice(0, 5).map(a => ({
        id: a.id,
        user_name: profileMap.get(a.user_id) || 'Unknown',
        assessment_title: assessmentMap.get(a.assessment_id) || 'Unknown',
        score: a.score,
        total_marks: a.total_marks,
        passed: a.passed,
        created_at: a.created_at,
      })));

      // Task Submissions
      const { data: subs, error: subErr } = await supabase
        .from('task_submissions')
        .select('id, title, status, submission_type, created_at, user_id')
        .order('created_at', { ascending: false })
        .limit(100);
      if (subErr) throw subErr;
      const allSubs = (subs as any[]) || [];
      const pending = allSubs.filter(s => s.status === 'pending').length;
      setStats(prev => ({
        ...prev,
        totalSubmissions: allSubs.length,
        pendingSubmissions: pending,
        reviewedSubmissions: allSubs.length - pending,
      }));

      // Names for recent submissions
      const subUserIds = Array.from(new Set(allSubs.slice(0, 5).map(s => s.user_id)));
      const { data: subProfiles } = await supabase.from('profiles').select('id,name').in('id', subUserIds);
      const subProfileMap = new Map((subProfiles as any[] || []).map(p => [p.id, p.name]));
      setRecentSubmissions(allSubs.slice(0, 5).map(s => ({
        id: s.id,
        user_name: subProfileMap.get(s.user_id) || 'Unknown',
        title: s.title,
        submission_type: s.submission_type,
        status: s.status,
        created_at: s.created_at,
      })));
    } catch (err: any) {
      toast.error(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="container py-10 max-w-lg">
          <div className="bg-card rounded-2xl p-8 card-shadow text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-7 h-7 text-primary" />
            </div>
            <h1 className="font-display text-2xl font-bold">Admin access required</h1>
            <p className="text-sm text-muted-foreground mt-2">Only administrators can view the admin dashboard.</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container py-6 space-y-6 max-w-7xl">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Overview of students, lessons, assessments, tasks and reports.</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin inline text-muted-foreground" /></div>
        ) : (
          <>
            {/* Stats Grid */}
            <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <motion.div variants={item}>
                <div className="bg-card rounded-xl p-4 card-shadow hover:card-shadow-hover transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div className="p-2 rounded-lg bg-secondary"><Users className="w-4 h-4 text-primary" /></div>
                    <span className="text-[10px] font-semibold uppercase text-success bg-success/10 px-2 py-0.5 rounded-full">{stats.activeStudents} active</span>
                  </div>
                  <p className="text-2xl font-bold">{stats.totalStudents}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Total Students</p>
                </div>
              </motion.div>
              <motion.div variants={item}>
                <div className="bg-card rounded-xl p-4 card-shadow hover:card-shadow-hover transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div className="p-2 rounded-lg bg-secondary"><BookOpen className="w-4 h-4 text-primary" /></div>
                  </div>
                  <p className="text-2xl font-bold">{stats.totalLessons}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Total Lessons</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{stats.completedLessons} completed</p>
                </div>
              </motion.div>
              <motion.div variants={item}>
                <div className="bg-card rounded-xl p-4 card-shadow hover:card-shadow-hover transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div className="p-2 rounded-lg bg-secondary"><ClipboardCheck className="w-4 h-4 text-primary" /></div>
                    <span className="text-[10px] font-semibold uppercase text-accent bg-accent/10 px-2 py-0.5 rounded-full">{stats.avgPassRate}% pass</span>
                  </div>
                  <p className="text-2xl font-bold">{stats.totalAssessments}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Assessments</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{stats.totalAttempts} attempts</p>
                </div>
              </motion.div>
              <motion.div variants={item}>
                <div className="bg-card rounded-xl p-4 card-shadow hover:card-shadow-hover transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div className="p-2 rounded-lg bg-secondary"><Upload className="w-4 h-4 text-primary" /></div>
                    {stats.pendingSubmissions > 0 && (
                      <span className="text-[10px] font-semibold uppercase text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">{stats.pendingSubmissions} pending</span>
                    )}
                  </div>
                  <p className="text-2xl font-bold">{stats.totalSubmissions}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Task Submissions</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{stats.reviewedSubmissions} reviewed</p>
                </div>
              </motion.div>
              <motion.div variants={item}>
                <div className="bg-card rounded-xl p-4 card-shadow hover:card-shadow-hover transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div className="p-2 rounded-lg bg-secondary"><FileText className="w-4 h-4 text-primary" /></div>
                  </div>
                  <p className="text-2xl font-bold">{stats.totalAttempts}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Total Reports</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Assessment attempts tracked</p>
                </div>
              </motion.div>
            </motion.div>

            {/* Tables Grid */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Recent Students */}
              <div className="bg-card rounded-2xl p-5 card-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-lg font-bold flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> Recent Students</h2>
                  <a href="#/admin" className="text-xs text-primary font-medium hover:underline flex items-center gap-0.5">View all <ArrowRight className="w-3 h-3" /></a>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[11px] uppercase font-semibold text-muted-foreground border-b">
                        <th className="pb-2">Name</th>
                        <th className="pb-2">College</th>
                        <th className="pb-2 text-right">Marks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {recentStudents.length === 0 ? (
                        <tr><td colSpan={3} className="py-6 text-center text-muted-foreground text-xs">No students yet</td></tr>
                      ) : recentStudents.map(s => (
                        <tr key={s.id} className="group">
                          <td className="py-2.5">
                            <p className="font-medium">{s.name}</p>
                            <p className="text-[11px] text-muted-foreground">{s.email}</p>
                          </td>
                          <td className="py-2.5 text-muted-foreground">{s.college || '—'}</td>
                          <td className="py-2.5 text-right font-semibold tabular-nums">{s.total_marks ?? 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Top Performers */}
              <div className="bg-card rounded-2xl p-5 card-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-lg font-bold flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /> Top Performers</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[11px] uppercase font-semibold text-muted-foreground border-b">
                        <th className="pb-2">Name</th>
                        <th className="pb-2">College</th>
                        <th className="pb-2 text-right">Total Marks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {topStudents.length === 0 ? (
                        <tr><td colSpan={3} className="py-6 text-center text-muted-foreground text-xs">No data yet</td></tr>
                      ) : topStudents.map((s, i) => (
                        <tr key={s.id} className="group">
                          <td className="py-2.5">
                            <div className="flex items-center gap-2">
                              <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${i === 0 ? 'bg-accent text-accent-foreground' : 'bg-secondary text-muted-foreground'}`}>{i + 1}</span>
                              <p className="font-medium">{s.name}</p>
                            </div>
                          </td>
                          <td className="py-2.5 text-muted-foreground">{s.college || '—'}</td>
                          <td className="py-2.5 text-right font-semibold tabular-nums">{s.total_marks ?? 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent Assessments */}
              <div className="bg-card rounded-2xl p-5 card-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-lg font-bold flex items-center gap-2"><ClipboardCheck className="w-4 h-4 text-primary" /> Recent Assessment Attempts</h2>
                  <a href="#/admin/assessments" className="text-xs text-primary font-medium hover:underline flex items-center gap-0.5">View all <ArrowRight className="w-3 h-3" /></a>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[11px] uppercase font-semibold text-muted-foreground border-b">
                        <th className="pb-2">Student</th>
                        <th className="pb-2">Assessment</th>
                        <th className="pb-2 text-right">Score</th>
                        <th className="pb-2 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {recentAttempts.length === 0 ? (
                        <tr><td colSpan={4} className="py-6 text-center text-muted-foreground text-xs">No attempts yet</td></tr>
                      ) : recentAttempts.map(a => (
                        <tr key={a.id}>
                          <td className="py-2.5 font-medium">{a.user_name}</td>
                          <td className="py-2.5 text-muted-foreground truncate max-w-[160px]">{a.assessment_title}</td>
                          <td className="py-2.5 text-right font-semibold tabular-nums">{a.score}/{a.total_marks}</td>
                          <td className="py-2.5 text-center">
                            {a.passed ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-success bg-success/10 px-2 py-0.5 rounded-full"><CheckCircle2 className="w-3 h-3" /> Pass</span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-destructive bg-destructive/10 px-2 py-0.5 rounded-full"><AlertCircle className="w-3 h-3" /> Fail</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent Submissions */}
              <div className="bg-card rounded-2xl p-5 card-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-lg font-bold flex items-center gap-2"><Upload className="w-4 h-4 text-primary" /> Recent Task Submissions</h2>
                  <a href="#/admin/submissions" className="text-xs text-primary font-medium hover:underline flex items-center gap-0.5">Review all <ArrowRight className="w-3 h-3" /></a>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[11px] uppercase font-semibold text-muted-foreground border-b">
                        <th className="pb-2">Student</th>
                        <th className="pb-2">Task</th>
                        <th className="pb-2">Type</th>
                        <th className="pb-2 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {recentSubmissions.length === 0 ? (
                        <tr><td colSpan={4} className="py-6 text-center text-muted-foreground text-xs">No submissions yet</td></tr>
                      ) : recentSubmissions.map(s => (
                        <tr key={s.id}>
                          <td className="py-2.5 font-medium">{s.user_name}</td>
                          <td className="py-2.5 text-muted-foreground truncate max-w-[160px]">{s.title}</td>
                          <td className="py-2.5"><span className="text-[10px] uppercase font-bold bg-secondary px-2 py-0.5 rounded-full">{s.submission_type}</span></td>
                          <td className="py-2.5 text-center">
                            {s.status === 'reviewed' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-success bg-success/10 px-2 py-0.5 rounded-full"><CheckCircle2 className="w-3 h-3" /> Reviewed</span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-accent bg-accent/10 px-2 py-0.5 rounded-full"><Clock className="w-3 h-3" /> Pending</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
