import React, { useEffect, useMemo, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { useApp } from '@/lib/app-context';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { ClipboardCheck, ArrowLeft, ArrowRight, Loader2, Clock, CheckCircle2, XCircle, Trophy } from 'lucide-react';

interface Assessment { id: string; title: string; description: string | null; duration_minutes: number; total_marks: number; passing_marks: number; }
interface Question { id: string; question_text: string; question_type: string; options: any; marks: number; order_index: number; }
interface Attempt { id: string; assessment_id: string; score: number; total_marks: number; percentage: number; passed: boolean; submitted_at: string; }

export default function AssessmentsPage() {
  const [list, setList] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Assessment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; total: number; percentage: number; passed: boolean; details: any[] } | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [myAttempts, setMyAttempts] = useState<Record<string, Attempt>>({});

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('assessments').select('*').eq('published', true).order('created_at', { ascending: false });
    if (error) toast.error(error.message);
    setList((data as Assessment[]) || []);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: at } = await supabase.from('assessment_attempts').select('*').eq('user_id', user.id).order('submitted_at', { ascending: false });
      const map: Record<string, Attempt> = {};
      (at as Attempt[] || []).forEach(a => { if (!map[a.assessment_id]) map[a.assessment_id] = a; });
      setMyAttempts(map);
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const startAssessment = async (a: Assessment) => {
    const { data, error } = await supabase.from('assessment_questions').select('id,question_text,question_type,options,marks,order_index').eq('assessment_id', a.id).order('order_index');
    if (error) return toast.error(error.message);
    if (!data || data.length === 0) return toast.error('No questions in this assessment');
    setActive(a); setQuestions(data as Question[]); setAnswers({}); setCurrentIdx(0); setResult(null);
    setSecondsLeft(a.duration_minutes * 60);
  };

  useEffect(() => {
    if (!active || result) return;
    if (secondsLeft <= 0) { handleSubmit(); return; }
    const t = setTimeout(() => setSecondsLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft, active, result]);

  const handleSubmit = async () => {
    if (!active || submitting || result) return;
    setSubmitting(true);
    const { data, error } = await supabase.rpc('submit_assessment', { _assessment_id: active.id, _answers: answers as any });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    const r = data as any;
    setResult({ score: r.score, total: r.total, percentage: Number(r.percentage), passed: r.passed, details: r.details || [] });
  };

  const timer = useMemo(() => {
    const m = Math.floor(secondsLeft / 60); const s = secondsLeft % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }, [secondsLeft]);

  if (result && active) {
    const correctCount = result.details.filter(d => d.correct).length;
    return (
      <AppLayout>
        <div className="container py-6 max-w-2xl">
          <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card rounded-2xl p-8 card-shadow text-center">
            <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center ${result.passed ? 'bg-success/15' : 'bg-destructive/15'}`}>
              {result.passed ? <Trophy className="w-10 h-10 text-success" /> : <XCircle className="w-10 h-10 text-destructive" />}
            </div>
            <h2 className="font-display text-2xl font-bold mt-4">{result.passed ? 'Passed!' : 'Keep practicing'}</h2>
            <p className="text-sm text-muted-foreground mt-1">{active.title}</p>
            <div className="grid grid-cols-3 gap-3 mt-6">
              <div className="bg-secondary rounded-xl p-4"><p className="text-xs text-muted-foreground">Score</p><p className="font-mono text-2xl font-bold">{result.score}/{result.total}</p></div>
              <div className="bg-secondary rounded-xl p-4"><p className="text-xs text-muted-foreground">Percentage</p><p className="font-mono text-2xl font-bold">{result.percentage}%</p></div>
              <div className="bg-secondary rounded-xl p-4"><p className="text-xs text-muted-foreground">Correct</p><p className="font-mono text-2xl font-bold">{correctCount}/{result.details.length}</p></div>
            </div>
            <div className="mt-6 text-left space-y-2 max-h-72 overflow-y-auto">
              {result.details.map((d, i) => {
                const q = questions.find(qq => qq.id === d.question_id);
                return (
                  <div key={i} className={`p-3 rounded-lg text-xs border ${d.correct ? 'border-success/30 bg-success/5' : 'border-destructive/30 bg-destructive/5'}`}>
                    <div className="flex items-start gap-2">
                      {d.correct ? <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />}
                      <div className="flex-1">
                        <p className="font-medium">{q?.question_text}</p>
                        <p className="text-muted-foreground mt-1">Your answer: <span className="font-mono">{d.user_answer || '—'}</span></p>
                        {!d.correct && <p className="text-success mt-0.5">Correct: <span className="font-mono">{d.correct_answer}</span></p>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <button onClick={() => { setActive(null); setResult(null); load(); }} className="mt-6 px-6 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">Back to Assessments</button>
          </motion.div>
        </div>
      </AppLayout>
    );
  }

  if (active) {
    const q = questions[currentIdx];
    const answered = Object.keys(answers).length;
    return (
      <AppLayout>
        <div className="container py-6 max-w-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="font-display text-xl font-bold">{active.title}</h1>
              <p className="text-xs text-muted-foreground">Question {currentIdx + 1} of {questions.length} · {answered} answered</p>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-sm font-bold ${secondsLeft < 60 ? 'bg-destructive/15 text-destructive' : 'bg-secondary'}`}>
              <Clock className="w-4 h-4" /> {timer}
            </div>
          </div>

          <div className="flex gap-1 mb-6">
            {questions.map((qq, i) => (
              <div key={qq.id} className={`h-1.5 flex-1 rounded-full ${answers[qq.id] ? 'bg-success' : i === currentIdx ? 'bg-primary' : 'bg-border'}`} />
            ))}
          </div>

          <div className="bg-card rounded-2xl p-5 sm:p-6 card-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-muted-foreground">Q{currentIdx + 1}</span>
              <span className="text-xs font-mono bg-secondary px-2 py-1 rounded-full">{q.marks} mark{q.marks > 1 ? 's' : ''}</span>
            </div>
            <h3 className="font-semibold text-base sm:text-lg mb-5 leading-relaxed">{q.question_text}</h3>

            {q.question_type === 'mcq' && Array.isArray(q.options) ? (
              <div className="space-y-2.5">
                {(q.options as string[]).map((opt, i) => {
                  const selected = answers[q.id] === opt;
                  return (
                    <button key={i} onClick={() => setAnswers({ ...answers, [q.id]: opt })}
                      className={`w-full text-left p-3.5 rounded-xl text-sm transition-all border ${selected ? 'border-primary bg-primary/5' : 'border-border bg-background hover:border-primary/40'}`}>
                      <span className="font-mono text-xs text-muted-foreground mr-2">{String.fromCharCode(65 + i)}.</span>{opt}
                    </button>
                  );
                })}
              </div>
            ) : (
              <textarea value={answers[q.id] || ''} onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })}
                placeholder="Type your answer..." className="w-full p-3.5 rounded-xl border bg-background text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-ring" />
            )}

            <div className="flex gap-2 mt-5">
              <button disabled={currentIdx === 0} onClick={() => setCurrentIdx(i => i - 1)} className="px-4 py-3 rounded-xl border text-sm font-medium disabled:opacity-40 hover:bg-secondary flex items-center gap-2"><ArrowLeft className="w-4 h-4" /> Prev</button>
              {currentIdx < questions.length - 1 ? (
                <button onClick={() => setCurrentIdx(i => i + 1)} className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2">Next <ArrowRight className="w-4 h-4" /></button>
              ) : (
                <button disabled={submitting} onClick={handleSubmit} className="flex-1 py-3 rounded-xl bg-success text-success-foreground text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Submit
                </button>
              )}
            </div>
          </div>

          <button onClick={() => { if (confirm('Exit assessment? Your progress will be lost.')) setActive(null); }} className="mt-4 text-xs text-muted-foreground hover:text-destructive">Exit assessment</button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container py-6 max-w-5xl">
        <h1 className="font-display text-2xl font-bold flex items-center gap-2 mb-1"><ClipboardCheck className="w-6 h-6 text-primary" /> Assessments</h1>
        <p className="text-sm text-muted-foreground mb-6">Take assessments and get instant scores</p>

        {loading ? <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          : list.length === 0 ? <div className="bg-card rounded-2xl p-12 text-center text-muted-foreground">No assessments available yet.</div>
          : <div className="grid sm:grid-cols-2 gap-4">
              {list.map(a => {
                const prev = myAttempts[a.id];
                return (
                  <motion.div key={a.id} whileHover={{ y: -3 }} className="bg-card rounded-2xl p-5 card-shadow">
                    <h3 className="font-semibold">{a.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{a.description || 'No description'}</p>
                    <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
                      <span>⏱ {a.duration_minutes}m</span>
                      <span>📝 {a.total_marks} marks</span>
                      <span>🎯 Pass: {a.passing_marks}</span>
                    </div>
                    {prev && (
                      <div className={`mt-3 p-2 rounded-lg text-xs font-medium ${prev.passed ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                        Last attempt: {prev.score}/{prev.total_marks} ({prev.percentage}%) · {prev.passed ? 'Passed' : 'Failed'}
                      </div>
                    )}
                    <button onClick={() => startAssessment(a)} className="w-full mt-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">{prev ? 'Retake' : 'Start'}</button>
                  </motion.div>
                );
              })}
            </div>}
      </div>
    </AppLayout>
  );
}
