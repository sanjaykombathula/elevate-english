import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { useApp } from '@/lib/app-context';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen, ArrowRight, CheckCircle2 } from 'lucide-react';

interface Module { id: string; title: string; description: string | null }
interface Task { id: string; module_id: string }
interface Attempt { task_id: string; completed: boolean }

export default function ModulesPage() {
  const { user } = useApp();
  const [modules, setModules] = useState<Module[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);

  useEffect(() => {
    (async () => {
      const [m, t] = await Promise.all([
        supabase.from('modules').select('id, title, description').eq('published', true).order('sort_order'),
        supabase.from('module_tasks').select('id, module_id').order('sort_order'),
      ]);
      setModules(m.data || []);
      setTasks(t.data || []);
      if (user) {
        const { data: a } = await supabase.from('task_attempts')
          .select('task_id, completed').eq('user_id', user.id);
        setAttempts(a || []);
      }
    })();
  }, [user?.id]);

  return (
    <AppLayout>
      <div className="container py-10 max-w-5xl">
        <header className="mb-8">
          <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-tight">Learning modules</h1>
          <p className="mt-1.5 text-muted-foreground text-sm">
            Four focused tracks to build the skills that matter most.
          </p>
        </header>

        <div className="grid sm:grid-cols-2 gap-4">
          {modules.map((m) => {
            const mTasks = tasks.filter((t) => t.module_id === m.id);
            const done = mTasks.filter((t) => attempts.some((a) => a.task_id === t.id && a.completed)).length;
            const pct = mTasks.length ? Math.round((done / mTasks.length) * 100) : 0;
            return (
              <div
                key={m.id}
                className="rounded-xl border border-border bg-card p-6 card-shadow hover:card-shadow-hover transition-[box-shadow]"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary-soft text-primary flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="font-display text-base font-semibold">{m.title}</h2>
                      {pct === 100 && <CheckCircle2 className="w-4 h-4 text-success" />}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{m.description}</p>
                    <div className="mt-4 flex items-center gap-3">
                      <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-medium tabular-nums text-muted-foreground">
                        {done}/{mTasks.length}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-5 flex justify-end">
                  <Link
                    to={`/modules/${m.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-colors"
                  >
                    Open Module <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
