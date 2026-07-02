import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { useApp } from '@/lib/app-context';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { BRAND } from '@/lib/brand';
import { Flame, Zap, Trophy, ArrowRight, Sparkles, BookOpen, Target, Clock, Award } from 'lucide-react';

interface Module { id: string; title: string; description: string | null; color: string | null; icon: string | null }
interface Task { id: string; title: string; module_id: string }
interface Attempt { id: string; task_id: string; percentage: number; completed: boolean; completed_at: string | null }
interface LB { user_id: string; xp_total: number; streak_current: number; name: string | null }

export default function Dashboard() {
  const { user } = useApp();
  const navigate = useNavigate();
  const [modules, setModules] = useState<Module[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [stats, setStats] = useState({ xp: 0, streak: 0, best: 0 });
  const [rank, setRank] = useState<number | null>(null);
  const [top, setTop] = useState<LB[]>([]);
  const [ann, setAnn] = useState<{ title: string; body: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [mods, tks, atts, st, lb, an] = await Promise.all([
        supabase.from('modules').select('*').eq('published', true).order('sort_order'),
        supabase.from('module_tasks').select('id, title, module_id').order('sort_order'),
        supabase.from('task_attempts').select('id, task_id, percentage, completed, completed_at').eq('user_id', user.id),
        supabase.from('user_stats').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('user_stats').select('user_id, xp_total, streak_current').order('xp_total', { ascending: false }).limit(50),
        supabase.from('announcements').select('title, body').eq('published', true).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      ]);
      setModules(mods.data || []);
      setTasks(tks.data || []);
      setAttempts(atts.data || []);
      setStats({ xp: st.data?.xp_total || 0, streak: st.data?.streak_current || 0, best: st.data?.streak_best || 0 });
      const lbData = lb.data || [];
      if (lbData.length) {
        const ids = lbData.map((r: any) => r.user_id);
        const { data: profs } = await supabase.from('profiles').select('id, name').in('id', ids);
        const nameMap = new Map((profs || []).map((p: any) => [p.id, p.name]));
        const enriched = lbData.map((r: any) => ({ ...r, name: nameMap.get(r.user_id) || 'Student' }));
        setTop(enriched.slice(0, 5));
        const idx = enriched.findIndex((r) => r.user_id === user.id);
        setRank(idx >= 0 ? idx + 1 : null);
      }
      setAnn(an.data as any);
    })();
  }, [user?.id]);

  const totalTasks = tasks.length;
  const completedTasks = attempts.filter((a) => a.completed).length;
  const overallPct = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const avgScore = attempts.length ? Math.round(attempts.reduce((s, a) => s + Number(a.percentage || 0), 0) / attempts.length) : 0;

  // continue learning: first incomplete task
  const nextTask = tasks.find((t) => !attempts.some((a) => a.task_id === t.id && a.completed));
  const nextModule = nextTask ? modules.find((m) => m.id === nextTask.module_id) : null;

  return (
    <AppLayout>
      <div className="container py-8 space-y-8">
        <motion.section
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-brand-gradient text-white p-8 md:p-10 glow-shadow"
        >
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,white_0%,transparent_40%)]" />
          <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <p className="text-white/70 text-sm uppercase tracking-widest">{BRAND.tagline}</p>
              <h1 className="font-display text-3xl md:text-4xl font-extrabold mt-2">
                Welcome back, {user?.name?.split(' ')[0] || 'Student'} 👋
              </h1>
              <p className="text-white/80 mt-2 max-w-xl">
                {completedTasks === 0
                  ? 'Kickstart your journey — pick a module and complete your first task today.'
                  : `You've completed ${completedTasks} of ${totalTasks} tasks. Keep the momentum going.`}
              </p>
            </div>
            {nextTask && nextModule && (
              <Link
                to={`/tasks/${nextTask.id}`}
                className="inline-flex items-center gap-2 bg-white text-primary font-semibold px-5 py-3 rounded-xl hover:scale-[1.02] transition-transform shadow-lg"
              >
                Continue: {nextTask.title} <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </motion.section>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Zap} label="XP Points" value={stats.xp} tint="primary" />
          <StatCard icon={Flame} label="Day Streak" value={stats.streak} sub={`Best ${stats.best}`} tint="warning" />
          <StatCard icon={Target} label="Avg Score" value={`${avgScore}%`} tint="accent" />
          <StatCard icon={Trophy} label="Rank" value={rank ? `#${rank}` : '—'} tint="primary" />
        </section>

        {ann && (
          <div className="rounded-2xl border bg-primary-soft border-primary/20 p-4 md:p-5 flex gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="font-display font-semibold">{ann.title}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{ann.body}</p>
            </div>
          </div>
        )}

        <section className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold">Your Modules</h2>
              <Link to="/modules" className="text-sm text-primary font-medium hover:underline">See all</Link>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {modules.map((m, i) => {
                const mTasks = tasks.filter((t) => t.module_id === m.id);
                const done = mTasks.filter((t) => attempts.some((a) => a.task_id === t.id && a.completed)).length;
                const pct = mTasks.length ? Math.round((done / mTasks.length) * 100) : 0;
                return (
                  <motion.button
                    key={m.id}
                    onClick={() => navigate(`/modules/${m.id}`)}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="text-left p-5 rounded-2xl border bg-card shadow-card hover:shadow-cardHover transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-white"
                        style={{ background: m.color || 'hsl(var(--primary))' }}
                      >
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-semibold text-muted-foreground">{done}/{mTasks.length}</span>
                    </div>
                    <p className="font-display font-semibold">{m.title}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{m.description}</p>
                    <div className="mt-4 h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full bg-brand-gradient" style={{ width: `${pct}%` }} />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border bg-card p-5 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold">Leaderboard</h3>
                <Link to="/leaderboard" className="text-xs text-primary hover:underline">View all</Link>
              </div>
              <ol className="space-y-2">
                {top.length === 0 && <p className="text-sm text-muted-foreground">Be the first on the board!</p>}
                {top.map((r, i) => (
                  <li key={r.user_id} className={`flex items-center gap-3 p-2 rounded-xl ${r.user_id === user?.id ? 'bg-primary-soft' : ''}`}>
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-warning text-warning-foreground' : i === 1 ? 'bg-muted text-foreground' : i === 2 ? 'bg-accent/40 text-foreground' : 'bg-secondary text-muted-foreground'}`}>
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium truncate flex-1">{r.name}</span>
                    <span className="text-sm font-semibold tabular-nums text-primary">{r.xp_total}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-2xl border bg-card p-5 shadow-card">
              <h3 className="font-display font-semibold mb-3">Overall Progress</h3>
              <div className="flex items-center gap-4">
                <ProgressRing pct={overallPct} />
                <div className="text-sm text-muted-foreground">
                  <p><span className="font-semibold text-foreground">{completedTasks}</span> tasks completed</p>
                  <p><span className="font-semibold text-foreground">{totalTasks - completedTasks}</span> remaining</p>
                </div>
              </div>
            </div>

            <Link to="/certificates" className="block rounded-2xl border bg-card p-5 shadow-card hover:shadow-cardHover transition">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-accent/15 text-accent flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-display font-semibold">Certificates</p>
                  <p className="text-xs text-muted-foreground">Earned when you complete a module</p>
                </div>
              </div>
            </Link>
          </aside>
        </section>
      </div>
    </AppLayout>
  );
}

function StatCard({ icon: Icon, label, value, sub, tint }: any) {
  const tints: Record<string, string> = {
    primary: 'bg-primary-soft text-primary',
    warning: 'bg-warning/15 text-warning',
    accent: 'bg-accent-soft text-accent',
  };
  return (
    <div className="rounded-2xl border bg-card p-4 md:p-5 shadow-card">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tints[tint]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-xs text-muted-foreground mt-3">{label}</p>
      <p className="font-display text-2xl font-bold tabular-nums">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function ProgressRing({ pct }: { pct: number }) {
  const r = 32; const c = 2 * Math.PI * r;
  const off = c - (pct / 100) * c;
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" className="-rotate-90">
      <circle cx="40" cy="40" r={r} strokeWidth="8" className="stroke-secondary" fill="none" />
      <circle cx="40" cy="40" r={r} strokeWidth="8" className="stroke-primary" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={off} fill="none" />
      <text x="40" y="44" textAnchor="middle" className="rotate-90 fill-foreground font-bold text-sm" style={{ transformOrigin: 'center' }}>
        {pct}%
      </text>
    </svg>
  );
}
