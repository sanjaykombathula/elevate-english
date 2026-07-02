import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/lib/app-context';
import { toast } from 'sonner';
import { Plus, Trash2, Save, ClipboardList } from 'lucide-react';

interface Module { id: string; title: string }
interface Task { id: string; title: string; module_id: string }
interface Question { id: string; task_id: string; qtype: string; prompt: string; payload: any; correct: any; marks: number; explanation: string | null }

const QTYPES = ['mcq', 'mcq_multi', 'truefalse', 'fill', 'short', 'long', 'reading', 'listening', 'speech', 'recording', 'match', 'rearrange', 'image', 'typing'];

export default function AdminQuestionsPage() {
  const { isAdmin } = useApp();
  const [modules, setModules] = useState<Module[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selTask, setSelTask] = useState<string>('');
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    (async () => {
      const [m, t] = await Promise.all([
        supabase.from('modules').select('id, title').order('sort_order'),
        supabase.from('module_tasks').select('id, title, module_id').order('sort_order'),
      ]);
      setModules(m.data || []); setTasks(t.data || []);
      if ((t.data || []).length && !selTask) setSelTask(t.data![0].id);
    })();
  }, []);

  useEffect(() => {
    if (!selTask) return;
    (async () => {
      const { data } = await supabase.from('task_questions').select('*').eq('task_id', selTask).order('sort_order');
      setQuestions((data as any) || []);
    })();
  }, [selTask]);

  if (!isAdmin) return <AppLayout><div className="container py-10">Admins only.</div></AppLayout>;

  const addQuestion = async () => {
    const { data, error } = await supabase.from('task_questions').insert({
      task_id: selTask, qtype: 'mcq', prompt: 'New question',
      payload: { options: ['Option A', 'Option B', 'Option C', 'Option D'] },
      correct: { answer: 'Option A' }, marks: 1, sort_order: questions.length + 1,
    }).select().single();
    if (error) return toast.error(error.message);
    setQuestions([...questions, data as any]);
  };

  const update = (id: string, patch: Partial<Question>) => setQuestions(qs => qs.map(q => q.id === id ? { ...q, ...patch } : q));

  const save = async (q: Question) => {
    const { error } = await supabase.from('task_questions').update({
      qtype: q.qtype, prompt: q.prompt, payload: q.payload, correct: q.correct, marks: q.marks, explanation: q.explanation,
    }).eq('id', q.id);
    if (error) toast.error(error.message); else toast.success('Saved');
  };

  const del = async (id: string) => {
    if (!confirm('Delete this question?')) return;
    const { error } = await supabase.from('task_questions').delete().eq('id', id);
    if (error) return toast.error(error.message);
    setQuestions(qs => qs.filter(q => q.id !== id));
  };

  return (
    <AppLayout>
      <div className="container py-8 max-w-5xl space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold flex items-center gap-2"><ClipboardList className="w-7 h-7" /> Question Manager</h1>
            <p className="text-muted-foreground mt-1">Create and manage questions per task.</p>
          </div>
          <button onClick={addQuestion} disabled={!selTask} className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm inline-flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Add Question
          </button>
        </header>

        <div className="rounded-2xl border bg-card p-4">
          <label className="text-xs uppercase tracking-widest text-muted-foreground">Task</label>
          <select value={selTask} onChange={(e) => setSelTask(e.target.value)} className="w-full p-3 mt-1 rounded-xl border bg-background text-sm">
            {modules.map((m) => (
              <optgroup key={m.id} label={m.title}>
                {tasks.filter((t) => t.module_id === m.id).map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
              </optgroup>
            ))}
          </select>
        </div>

        <div className="space-y-4">
          {questions.map((q, i) => (
            <div key={q.id} className="rounded-2xl border bg-card p-5 shadow-card space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground">Q{i + 1}</span>
                <select value={q.qtype} onChange={(e) => update(q.id, { qtype: e.target.value })} className="p-2 rounded-lg border bg-background text-xs">
                  {QTYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <input type="number" value={q.marks} min={1} onChange={(e) => update(q.id, { marks: Number(e.target.value) })}
                  className="w-20 p-2 rounded-lg border bg-background text-xs" placeholder="marks" />
                <div className="flex-1" />
                <button onClick={() => save(q)} className="p-2 rounded-lg border hover:bg-secondary" aria-label="Save"><Save className="w-4 h-4" /></button>
                <button onClick={() => del(q.id)} className="p-2 rounded-lg border text-destructive hover:bg-destructive/10" aria-label="Delete"><Trash2 className="w-4 h-4" /></button>
              </div>
              <textarea value={q.prompt} onChange={(e) => update(q.id, { prompt: e.target.value })} rows={2}
                className="w-full p-3 rounded-xl border bg-background text-sm" placeholder="Question prompt" />
              <textarea value={JSON.stringify(q.payload, null, 2)} onChange={(e) => { try { update(q.id, { payload: JSON.parse(e.target.value) }); } catch {} }} rows={3}
                className="w-full p-3 rounded-xl border bg-background text-xs font-mono" placeholder='Payload JSON (e.g. {"options": ["A","B"]})' />
              <textarea value={JSON.stringify(q.correct, null, 2)} onChange={(e) => { try { update(q.id, { correct: JSON.parse(e.target.value) }); } catch {} }} rows={2}
                className="w-full p-3 rounded-xl border bg-background text-xs font-mono" placeholder='Correct JSON (e.g. {"answer":"A"})' />
              <input value={q.explanation || ''} onChange={(e) => update(q.id, { explanation: e.target.value })}
                className="w-full p-3 rounded-xl border bg-background text-sm" placeholder="Explanation (optional)" />
            </div>
          ))}
          {questions.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No questions yet for this task.</p>}
        </div>
      </div>
    </AppLayout>
  );
}
