import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { useApp } from '@/lib/app-context';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { BookOpen, ArrowRight, CheckCircle2 } from 'lucide-react';

interface Module { id: string; title: string; description: string | null; color: string | null }
interface Task { id: string; module_id: string }
interface Attempt { task_id: string; completed: boolean; percentage: number }

export default function ModulesPage() {
  const { user } = useApp();
  const [modules, setModules] = useState<Module[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);

  useEffect(() => {
    (async () => {
      const [m, t] = await Promise.all([
        supabase.from('modules').select('*').eq('published', true).order('sort_order'),
        supabase.from('module_tasks').select('id, module_id').order('sort_order'),
      ]);
      setModules(m.data || []);
      setTasks(t.data || []);
      if (user) {
        const { data: a } = await supabase.from('task_attempts').select('task_id, completed, percentage').eq('user_id', user.id);
        setAttempts(a || []);
      }
    })();
  }, [user?.id]);

  return (
    <AppLayout>
      <div className="container py-8 space-y-6">
        <header>
          <h1 className="font-display text-3xl font-bold">Learning Modules</h1>
          <p className="text-muted-foreground mt-1">Four modules · Twelve tasks · Personalised feedback</p>
        </header>

        <div className="grid md:grid-cols-2 gap-5">
          {modules.map((m, i) => {
            const mTasks = tasks.filter((t) => t.module_id === m.id);
            const done = mTasks.filter((t) => attempts.some((a) => a.task_id === t.id && a.completed)).length;
            const pct = mTasks.length ? Math.round((done / mTasks.length) * 100) : 0;
            return (
              <motion.div key={m.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Link to={`/modules/${m.id}`} className="block rounded-3xl border bg-card p-6 shadow-card hover:shadow-cardHover transition-shadow group">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shrink-0"
                      style={{ background: m.color || 'hsl(var(--primary))' }}>
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="font-display text-xl font-bold">{m.title}</h2>
                        {pct === 100 && <CheckCircle2 className="w-4 h-4 text-success" />}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{m.description}</p>
                      <div className="mt-4 flex items-center gap-3">
                        <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                          <div className="h-full bg-brand-gradient" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs font-semibold tabular-nums text-muted-foreground">{done}/{mTasks.length}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
