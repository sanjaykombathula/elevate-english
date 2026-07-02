import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/lib/app-context';
import { awardXP, checkAndAwardBadges } from '@/lib/gamification';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Save, SkipForward, Timer, CheckCircle2, XCircle, RotateCcw, Sparkles, Mic, Square } from 'lucide-react';
import { toast } from 'sonner';

interface Question {
  id: string;
  qtype: string;
  prompt: string;
  payload: any;
  correct: any;
  explanation: string | null;
  marks: number;
  media_url: string | null;
}
interface Task {
  id: string; title: string; module_id: string; task_type: string; time_limit_seconds: number | null;
}

const TYPE_LABEL: Record<string, string> = {
  mcq: 'Multiple Choice', mcq_multi: 'Select all that apply', fill: 'Fill in the blank', truefalse: 'True or False',
  match: 'Match the following', rearrange: 'Rearrange', short: 'Short answer', long: 'Long answer',
  reading: 'Reading comprehension', listening: 'Listening', speech: 'Speech to text', recording: 'Voice / Video',
  typing: 'Typing test', image: 'Image based',
};

function normalize(s: any) { return String(s || '').trim().toLowerCase(); }
function isCorrect(q: Question, ans: any): boolean {
  if (ans == null || ans === '') return false;
  const c = q.correct;
  switch (q.qtype) {
    case 'mcq':
    case 'truefalse':
    case 'image':
      return normalize(ans) === normalize(c.answer);
    case 'mcq_multi': {
      const a = Array.isArray(ans) ? ans.map(normalize).sort() : [];
      const b = Array.isArray(c.answers) ? c.answers.map(normalize).sort() : [];
      return a.length === b.length && a.every((v, i) => v === b[i]);
    }
    case 'fill':
    case 'short':
    case 'speech':
    case 'typing':
    case 'long':
    case 'reading': {
      const accepted: string[] = Array.isArray(c.accepted) ? c.accepted : [c.answer];
      return accepted.map(normalize).includes(normalize(ans));
    }
    case 'match': {
      const a = ans || {};
      const b = c.pairs || {};
      const keys = Object.keys(b);
      if (!keys.length) return false;
      return keys.every((k) => normalize(a[k]) === normalize(b[k]));
    }
    case 'rearrange': {
      const a = Array.isArray(ans) ? ans.map(String) : [];
      const b = Array.isArray(c.order) ? c.order.map(String) : [];
      return a.length === b.length && a.every((v, i) => v === b[i]);
    }
    case 'recording':
      return !!ans; // presence-based
    default:
      return normalize(ans) === normalize(c.answer);
  }
}

export default function TaskPlayer() {
  const { taskId } = useParams();
  const { user } = useApp();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [idx, setIdx] = useState(0);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [startedAt] = useState<number>(Date.now());
  const [submitted, setSubmitted] = useState<{ score: number; total: number; pct: number } | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const timerRef = useRef<any>();

  useEffect(() => {
    if (!taskId) return;
    (async () => {
      const [t, q] = await Promise.all([
        supabase.from('module_tasks').select('*').eq('id', taskId).maybeSingle(),
        supabase.from('task_questions').select('*').eq('task_id', taskId).order('sort_order'),
      ]);
      setTask(t.data as any);
      setQuestions((q.data as any) || []);
      // create attempt
      if (user) {
        const { data } = await supabase.from('task_attempts').insert({ user_id: user.id, task_id: taskId, answers: {}, total_marks: (q.data || []).reduce((s: number, x: any) => s + x.marks, 0) }).select('id').single();
        setAttemptId(data?.id || null);
      }
      if (t.data?.time_limit_seconds) setRemaining(t.data.time_limit_seconds);
    })();
  }, [taskId, user?.id]);

  useEffect(() => {
    if (remaining == null) return;
    timerRef.current = setInterval(() => setRemaining((r) => (r == null ? r : r - 1)), 1000);
    return () => clearInterval(timerRef.current);
  }, [remaining != null]);
  useEffect(() => {
    if (remaining !== null && remaining <= 0 && !submitted) submit();
  }, [remaining]);

  const q = questions[idx];
  const totalMarks = useMemo(() => questions.reduce((s, x) => s + x.marks, 0), [questions]);

  const saveAnswer = async (val: any) => {
    if (!q) return;
    const next = { ...answers, [q.id]: val };
    setAnswers(next);
    if (attemptId) await supabase.from('task_attempts').update({ answers: next }).eq('id', attemptId);
  };

  const submit = async () => {
    if (!questions.length || submitted) return;
    let score = 0;
    questions.forEach((qq) => { if (isCorrect(qq, answers[qq.id])) score += qq.marks; });
    const pct = totalMarks ? Math.round((score / totalMarks) * 100) : 0;
    const timeSpent = Math.round((Date.now() - startedAt) / 1000);
    if (attemptId) {
      await supabase.from('task_attempts').update({
        answers, score, percentage: pct, completed: true, completed_at: new Date().toISOString(), time_spent_seconds: timeSpent,
      }).eq('id', attemptId);
    }
    const xp = 20 + score * 5 + (pct === 100 ? 30 : 0);
    await awardXP(xp, 'task_complete', { task_id: taskId, pct });
    if (user) await checkAndAwardBadges(user.id);
    setSubmitted({ score, total: totalMarks, pct });
  };

  if (!task || !questions.length) {
    return <AppLayout><div className="container py-10 text-muted-foreground">Loading task…</div></AppLayout>;
  }

  if (submitted) {
    const passed = submitted.pct >= 60;
    return (
      <AppLayout>
        <div className="container py-10 max-w-3xl">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl border bg-card p-8 md:p-10 text-center shadow-card">
            <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center ${passed ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'}`}>
              {passed ? <Sparkles className="w-8 h-8" /> : <RotateCcw className="w-8 h-8" />}
            </div>
            <h2 className="font-display text-3xl font-bold mt-4">
              {passed ? 'Great work!' : 'Good try — keep going!'}
            </h2>
            <p className="text-muted-foreground mt-1">You scored {submitted.score}/{submitted.total} ({submitted.pct}%)</p>
            <div className="mt-6 flex justify-center gap-3">
              <button onClick={() => { setSubmitted(null); setIdx(0); setAnswers({}); }} className="px-5 py-2.5 rounded-xl border font-semibold">Retry</button>
              <button onClick={() => navigate(`/modules/${task.module_id}`)} className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold">Continue</button>
            </div>
          </motion.div>

          <div className="mt-8 space-y-3">
            {questions.map((qq, i) => {
              const ok = isCorrect(qq, answers[qq.id]);
              return (
                <div key={qq.id} className={`p-4 rounded-2xl border ${ok ? 'border-success/30 bg-success/5' : 'border-destructive/30 bg-destructive/5'}`}>
                  <div className="flex items-start gap-2">
                    {ok ? <CheckCircle2 className="w-5 h-5 text-success shrink-0" /> : <XCircle className="w-5 h-5 text-destructive shrink-0" />}
                    <div className="flex-1">
                      <p className="font-medium">{i + 1}. {qq.prompt}</p>
                      {qq.explanation && <p className="text-sm text-muted-foreground mt-1">{qq.explanation}</p>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </AppLayout>
    );
  }

  const answered = questions.filter((qq) => answers[qq.id] != null && answers[qq.id] !== '').length;

  return (
    <AppLayout>
      <div className="container py-8 max-w-3xl">
        <Link to={`/modules/${task.module_id}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Exit task
        </Link>

        <div className="mt-4 rounded-3xl border bg-card shadow-card overflow-hidden">
          <div className="p-5 border-b flex items-center gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">{TYPE_LABEL[q.qtype] || q.qtype}</p>
              <p className="font-display font-semibold">{task.title}</p>
            </div>
            <div className="flex-1 mx-4">
              <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                <div className="h-full bg-brand-gradient transition-all" style={{ width: `${((idx + 1) / questions.length) * 100}%` }} />
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Question</p>
              <p className="font-mono font-bold tabular-nums">{idx + 1}/{questions.length}</p>
            </div>
            {remaining != null && (
              <div className="flex items-center gap-1.5 bg-warning/10 text-warning px-3 py-1.5 rounded-full">
                <Timer className="w-4 h-4" /> <span className="font-mono tabular-nums text-sm">{Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}</span>
              </div>
            )}
          </div>

          <div className="p-6 md:p-8 min-h-[280px]">
            <AnimatePresence mode="wait">
              <motion.div key={q.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                <QuestionRenderer q={q} answer={answers[q.id]} onChange={saveAnswer} />
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="p-5 border-t flex items-center gap-2">
            <button onClick={() => setIdx(Math.max(0, idx - 1))} disabled={idx === 0} className="px-4 py-2 rounded-xl border font-medium text-sm inline-flex items-center gap-1.5 disabled:opacity-40">
              <ArrowLeft className="w-4 h-4" /> Prev
            </button>
            <button onClick={() => saveAnswer(answers[q.id] ?? '')} className="px-4 py-2 rounded-xl border font-medium text-sm inline-flex items-center gap-1.5">
              <Save className="w-4 h-4" /> Save
            </button>
            <button onClick={() => setIdx(Math.min(questions.length - 1, idx + 1))} className="px-4 py-2 rounded-xl border font-medium text-sm inline-flex items-center gap-1.5">
              <SkipForward className="w-4 h-4" /> Skip
            </button>
            <div className="flex-1 text-xs text-muted-foreground text-center">
              {answered}/{questions.length} answered
            </div>
            {idx < questions.length - 1 ? (
              <button onClick={() => setIdx(idx + 1)} className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-sm inline-flex items-center gap-1.5">
                Next <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={submit} className="px-5 py-2 rounded-xl bg-accent text-accent-foreground font-semibold text-sm">
                Submit
              </button>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function QuestionRenderer({ q, answer, onChange }: { q: Question; answer: any; onChange: (v: any) => void }) {
  const opts: string[] = q.payload?.options || [];

  if (q.qtype === 'mcq' || q.qtype === 'image' || q.qtype === 'truefalse') {
    const choices = q.qtype === 'truefalse' ? ['True', 'False'] : opts;
    return (
      <div>
        {q.media_url && q.qtype === 'image' && <img src={q.media_url} alt="" className="rounded-2xl mb-4 max-h-64 object-contain w-full bg-secondary" />}
        <h3 className="font-display text-xl font-semibold mb-4">{q.prompt}</h3>
        <div className="grid gap-2">
          {choices.map((o) => (
            <button key={o} onClick={() => onChange(o)}
              className={`text-left p-4 rounded-xl border-2 transition-all ${answer === o ? 'border-primary bg-primary-soft' : 'border-border hover:border-primary/40'}`}>
              {o}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (q.qtype === 'mcq_multi') {
    const sel: string[] = Array.isArray(answer) ? answer : [];
    const toggle = (o: string) => onChange(sel.includes(o) ? sel.filter((x) => x !== o) : [...sel, o]);
    return (
      <div>
        <h3 className="font-display text-xl font-semibold mb-4">{q.prompt}</h3>
        <div className="grid gap-2">
          {opts.map((o) => (
            <button key={o} onClick={() => toggle(o)}
              className={`text-left p-4 rounded-xl border-2 ${sel.includes(o) ? 'border-primary bg-primary-soft' : 'border-border hover:border-primary/40'}`}>
              {o}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (q.qtype === 'fill' || q.qtype === 'short' || q.qtype === 'typing') {
    return (
      <div>
        <h3 className="font-display text-xl font-semibold mb-4">{q.prompt}</h3>
        <input value={answer || ''} onChange={(e) => onChange(e.target.value)}
          placeholder="Type your answer…"
          className="w-full p-4 rounded-xl border-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
      </div>
    );
  }

  if (q.qtype === 'long' || q.qtype === 'reading') {
    return (
      <div>
        {q.payload?.passage && <div className="mb-4 p-4 rounded-xl bg-secondary text-sm leading-relaxed">{q.payload.passage}</div>}
        <h3 className="font-display text-xl font-semibold mb-4">{q.prompt}</h3>
        <textarea value={answer || ''} onChange={(e) => onChange(e.target.value)} rows={5}
          className="w-full p-4 rounded-xl border-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
      </div>
    );
  }

  if (q.qtype === 'rearrange') {
    const items: string[] = Array.isArray(answer) && answer.length ? answer : (q.payload?.items || []);
    const move = (from: number, dir: -1 | 1) => {
      const arr = [...items];
      const to = from + dir; if (to < 0 || to >= arr.length) return;
      [arr[from], arr[to]] = [arr[to], arr[from]];
      onChange(arr);
    };
    return (
      <div>
        <h3 className="font-display text-xl font-semibold mb-4">{q.prompt}</h3>
        <p className="text-sm text-muted-foreground mb-3">Reorder to form a correct sentence.</p>
        <ol className="space-y-2">
          {items.map((it: string, i: number) => (
            <li key={i} className="flex items-center gap-2 p-3 rounded-xl border bg-background">
              <span className="font-mono text-xs text-muted-foreground w-6">{i + 1}</span>
              <span className="flex-1">{it}</span>
              <button aria-label="Move up" onClick={() => move(i, -1)} className="px-2 py-1 rounded border text-xs">↑</button>
              <button aria-label="Move down" onClick={() => move(i, 1)} className="px-2 py-1 rounded border text-xs">↓</button>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  if (q.qtype === 'match') {
    const lefts: string[] = q.payload?.left || [];
    const rights: string[] = q.payload?.right || [];
    const map: Record<string, string> = answer || {};
    return (
      <div>
        <h3 className="font-display text-xl font-semibold mb-4">{q.prompt}</h3>
        <div className="space-y-2">
          {lefts.map((l) => (
            <div key={l} className="flex items-center gap-3">
              <div className="flex-1 p-3 rounded-xl bg-secondary text-sm font-medium">{l}</div>
              <select value={map[l] || ''} onChange={(e) => onChange({ ...map, [l]: e.target.value })}
                className="flex-1 p-3 rounded-xl border bg-background text-sm">
                <option value="">Select…</option>
                {rights.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (q.qtype === 'listening') {
    return (
      <div>
        <h3 className="font-display text-xl font-semibold mb-4">{q.prompt}</h3>
        {q.media_url && <audio controls src={q.media_url} className="w-full mb-4" />}
        <input value={answer || ''} onChange={(e) => onChange(e.target.value)}
          placeholder="Write what you heard…"
          className="w-full p-4 rounded-xl border-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
      </div>
    );
  }

  if (q.qtype === 'speech') {
    return <SpeechInput q={q} answer={answer} onChange={onChange} />;
  }

  if (q.qtype === 'recording') {
    return <Recorder q={q} answer={answer} onChange={onChange} />;
  }

  return (
    <div>
      <h3 className="font-display text-xl font-semibold mb-4">{q.prompt}</h3>
      <input value={answer || ''} onChange={(e) => onChange(e.target.value)}
        className="w-full p-4 rounded-xl border-2 bg-background" />
    </div>
  );
}

function SpeechInput({ q, answer, onChange }: any) {
  const [listening, setListening] = useState(false);
  const recRef = useRef<any>(null);
  const supported = typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
  const start = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const R = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!R) return;
    const r = new R(); r.lang = 'en-US'; r.interimResults = true; r.continuous = true;
    r.onresult = (e: any) => {
      let text = '';
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript + ' ';
      onChange(text.trim());
    };
    r.onend = () => setListening(false);
    r.start(); recRef.current = r; setListening(true);
  };
  const stop = () => { recRef.current?.stop(); setListening(false); };
  return (
    <div>
      <h3 className="font-display text-xl font-semibold mb-4">{q.prompt}</h3>
      <div className="flex gap-2 mb-3">
        {!listening ? (
          <button onClick={start} disabled={!supported} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold inline-flex items-center gap-2 disabled:opacity-40">
            <Mic className="w-4 h-4" /> Start speaking
          </button>
        ) : (
          <button onClick={stop} className="px-4 py-2 rounded-xl bg-destructive text-destructive-foreground font-semibold inline-flex items-center gap-2">
            <Square className="w-4 h-4" /> Stop
          </button>
        )}
        {!supported && <p className="text-xs text-muted-foreground self-center">Speech recognition unavailable — type your answer.</p>}
      </div>
      <textarea value={answer || ''} onChange={(e) => onChange(e.target.value)} rows={4}
        placeholder="Your spoken response appears here — or type it in."
        className="w-full p-4 rounded-xl border-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
    </div>
  );
}

function Recorder({ q, answer, onChange }: any) {
  const [rec, setRec] = useState<MediaRecorder | null>(null);
  const [url, setUrl] = useState<string | null>(answer || null);
  const chunksRef = useRef<Blob[]>([]);
  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const u = URL.createObjectURL(blob);
        setUrl(u); onChange(u);
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start(); setRec(mr);
    } catch { toast.error('Microphone permission needed.'); }
  };
  const stop = () => { rec?.stop(); setRec(null); };
  return (
    <div>
      <h3 className="font-display text-xl font-semibold mb-4">{q.prompt}</h3>
      <div className="flex gap-2 mb-3">
        {!rec ? (
          <button onClick={start} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold inline-flex items-center gap-2">
            <Mic className="w-4 h-4" /> Record answer
          </button>
        ) : (
          <button onClick={stop} className="px-4 py-2 rounded-xl bg-destructive text-destructive-foreground font-semibold inline-flex items-center gap-2">
            <Square className="w-4 h-4" /> Stop
          </button>
        )}
      </div>
      {url && <audio controls src={url} className="w-full" />}
    </div>
  );
}
