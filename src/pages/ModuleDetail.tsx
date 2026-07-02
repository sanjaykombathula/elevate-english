import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { useApp } from '@/lib/app-context';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { issueCertificate } from '@/lib/gamification';
import { ArrowLeft, Play, CheckCircle2, Lock, Award, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface Module { id: string; title: string; description: string | null; color: string | null }
interface Task { id: string; title: string; description: string | null; task_type: string; sort_order: number }
interface Attempt { task_id: string; completed: boolean; percentage: number; score: number }

export default function ModuleDetailPage() {
  const { id } = useParams();
  const { user } = useApp();
  const navigate = useNavigate();
  const [mod, setMod] = useState<Module | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [issuing, setIssuing] = useState(false);
  const [cert, setCert] = useState<{ cert_number: string } | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [m, t, c] = await Promise.all([
        supabase.from('modules').select('*').eq('id', id).maybeSingle(),
        supabase.from('module_tasks').select('*').eq('module_id', id).order('sort_order'),
        user ? supabase.from('certificates').select('cert_number').eq('user_id', user.id).eq('module_id', id).maybeSingle() : Promise.resolve({ data: null } as any),
      ]);
      setMod(m.data as any);
      setTasks(t.data || []);
      setCert(c.data as any);
      if (user) {
        const ids = (t.data || []).map((x: any) => x.id);
        if (ids.length) {
          const { data: a } = await supabase.from('task_attempts').select('task_id, completed, percentage, score').eq('user_id', user.id).in('task_id', ids);
          setAttempts(a || []);
        }
      }
    })();
  }, [id, user?.id]);

  const done = tasks.filter((t) => attempts.some((a) => a.task_id === t.id && a.completed)).length;
  const allDone = tasks.length > 0 && done === tasks.length;

  const claim = async () => {
    if (!id || !allDone) return;
    setIssuing(true);
    try {
      const c: any = await issueCertificate(id);
      setCert({ cert_number: c.cert_number });
      toast.success('Certificate issued!');
      navigate('/certificates');
    } catch (e: any) {
      toast.error(e.message || 'Could not issue certificate');
    } finally {
      setIssuing(false);
    }
  };

  if (!mod) return <AppLayout><div className="container py-10 text-muted-foreground">Loading…</div></AppLayout>;

  return (
    <AppLayout>
      <div className="container py-8 space-y-6 max-w-4xl">
        <Link to="/modules" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Back to Modules
        </Link>

        <motion.header
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl p-8 text-white glow-shadow"
          style={{ background: `linear-gradient(135deg, ${mod.color || '#2563EB'} 0%, hsl(221 83% 30%) 100%)` }}
        >
          <p className="text-xs uppercase tracking-widest opacity-80">Module</p>
          <h1 className="font-display text-3xl md:text-4xl font-extrabold mt-1">{mod.title}</h1>
          <p className="mt-2 opacity-90 max-w-xl">{mod.description}</p>
          <div className="mt-6 flex items-center gap-4">
            <div className="flex-1 h-2 rounded-full bg-white/20 overflow-hidden max-w-sm">
              <div className="h-full bg-white" style={{ width: `${tasks.length ? (done / tasks.length) * 100 : 0}%` }} />
            </div>
            <span className="text-sm font-semibold">{done}/{tasks.length}</span>
          </div>
        </motion.header>

        <section className="space-y-3">
          {tasks.map((t, i) => {
            const a = attempts.find((x) => x.task_id === t.id);
            const completed = a?.completed;
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                className="flex items-center gap-4 p-5 rounded-2xl border bg-card shadow-card"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${completed ? 'bg-success/15 text-success' : 'bg-primary-soft text-primary'}`}>
                  {completed ? <CheckCircle2 className="w-5 h-5" /> : <span className="font-bold">{i + 1}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-semibold">{t.title}</p>
                  <p className="text-xs text-muted-foreground capitalize">{t.task_type}{a ? ` · Last score ${Math.round(Number(a.percentage))}%` : ''}</p>
                </div>
                <button
                  onClick={() => navigate(`/tasks/${t.id}`)}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-colors inline-flex items-center gap-1.5"
                >
                  <Play className="w-4 h-4" /> {completed ? 'Retry' : 'Start'}
                </button>
              </motion.div>
            );
          })}
        </section>

        {allDone && (
          <div className="rounded-2xl border-2 border-dashed border-accent bg-accent-soft p-6 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-accent text-accent-foreground flex items-center justify-center">
              <Award className="w-7 h-7" />
            </div>
            <div className="flex-1">
              <p className="font-display font-bold text-lg">Module complete!</p>
              <p className="text-sm text-muted-foreground">{cert ? `Certificate #${cert.cert_number}` : 'Claim your certificate to celebrate this milestone.'}</p>
            </div>
            {!cert ? (
              <button onClick={claim} disabled={issuing} className="px-5 py-2.5 rounded-xl bg-accent text-accent-foreground font-semibold disabled:opacity-50">
                {issuing ? 'Issuing…' : 'Claim Certificate'}
              </button>
            ) : (
              <Link to="/certificates" className="px-5 py-2.5 rounded-xl bg-accent text-accent-foreground font-semibold">View</Link>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
