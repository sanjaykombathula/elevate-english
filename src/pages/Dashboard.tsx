import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { useApp } from '@/lib/app-context';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen, ArrowRight, CheckCircle2 } from 'lucide-react';

interface Module { id: string; title: string; description: string | null }
interface Task { id: string; title: string; module_id: string }
interface Attempt { id: string; task_id: string; completed: boolean }

export default function Dashboard() {
  const { user } = useApp();
  const [modules, setModules] = useState<Module[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);

  useEffect(() => {
    (async () => {
      const [mods, tks] = await Promise.all([
        supabase.from('modules').select('id, title, description').eq('published', true).order('sort_order'),
        supabase.from('module_tasks').select('id, title, module_id').order('sort_order'),
      ]);
      setModules(mods.data || []);
      setTasks(tks.data || []);
      if (user) {
        const { data } = await supabase.from('task_attempts')
          .select('id, task_id, completed').eq('user_id', user.id);
        setAttempts(data || []);
      }
    })();
  }, [user?.id]);

  const totalTasks = tasks.length;
  const completedTasks = attempts.filter((a) => a.completed).length;
  const overallPct = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const nextTask = tasks.find((t) => !attempts.some((a) => a.task_id === t.id && a.completed));

  return (
    <AppLayout>
      <div className="container py-10 max-w-5xl">
        {/* Welcome */}
        <header className="mb-8">
          <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-tight">
            Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
          </h1>
          <p className="mt-1.5 text-muted-foreground text-sm">
            Pick up where you left off, or start a new module.
          </p>
        </header>

        {/* Progress summary + Continue */}
        <section className="grid md:grid-cols-3 gap-4 mb-10">
          <div className="md:col-span-2 rounded-xl border border-border bg-card p-6 card-shadow">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Continue learning</p>
                <p className="mt-2 font-display text-lg font-semibold">
                  {nextTask ? nextTask.title : 'You have completed every task. Great work.'}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {completedTasks} of {totalTasks} tasks completed
                </p>
              </div>
              {nextTask && (
                <Link
                  to={`/tasks/${nextTask.id}`}
                  className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-colors"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
            <div className="mt-6">
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full bg-primary transition-[width] duration-500"
                  style={{ width: `${overallPct}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground tabular-nums">{overallPct}% complete</p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 card-shadow">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Progress</p>
            <p className="mt-2 font-display text-3xl font-semibold tabular-nums">{overallPct}%</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {totalTasks - completedTasks} tasks remaining
            </p>
          </div>
        </section>

        {/* Modules */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold">Your modules</h2>
            <Link to="/modules" className="text-sm font-medium text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {modules.map((m) => {
              const mTasks = tasks.filter((t) => t.module_id === m.id);
              const done = mTasks.filter((t) => attempts.some((a) => a.task_id === t.id && a.completed)).length;
              const pct = mTasks.length ? Math.round((done / mTasks.length) * 100) : 0;
              return (
                <Link
                  key={m.id}
                  to={`/modules/${m.id}`}
                  className="group block rounded-xl border border-border bg-card p-5 card-shadow hover:card-shadow-hover transition-[box-shadow]"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary-soft text-primary flex items-center justify-center shrink-0">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold truncate">{m.title}</p>
                        {pct === 100 && <CheckCircle2 className="w-4 h-4 text-success shrink-0" />}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{m.description}</p>
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
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
