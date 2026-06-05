import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import AppLayout from '@/components/AppLayout';
import { useApp } from '@/lib/app-context';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, FileSpreadsheet, X, ArrowLeft, Loader2, ClipboardCheck, Eye, EyeOff, Users } from 'lucide-react';

interface Assessment { id: string; title: string; description: string | null; duration_minutes: number; total_marks: number; passing_marks: number; published: boolean; created_at: string; recommended_course_id?: string | null; }
interface Question { id: string; assessment_id: string; question_text: string; question_type: string; options: any; correct_answer: string; marks: number; order_index: number; }
interface Attempt { id: string; user_id: string; score: number; total_marks: number; percentage: number; passed: boolean; submitted_at: string; }
interface CourseOpt { id: string; title: string; }

const emptyA = { title: '', description: '', duration_minutes: 30, passing_marks: 0, recommended_course_id: '' };
const emptyQ = { question_text: '', question_type: 'mcq', options: ['', '', '', ''], correct_answer: '', marks: 1, order_index: 0 };


export default function AdminAssessmentsPage() {
  const { isAdmin } = useApp();
  const [list, setList] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Assessment | null>(null);
  const [aModal, setAModal] = useState<{ open: boolean; edit?: Assessment | null }>({ open: false });
  const [aForm, setAForm] = useState<any>({ ...emptyA });

  const [questions, setQuestions] = useState<Question[]>([]);
  const [qLoading, setQLoading] = useState(false);
  const [qModal, setQModal] = useState<{ open: boolean; edit?: Question | null }>({ open: false });
  const [qForm, setQForm] = useState<any>({ ...emptyQ });

  const [attemptsOpen, setAttemptsOpen] = useState(false);
  const [attempts, setAttempts] = useState<(Attempt & { name?: string; email?: string })[]>([]);
  const [courses, setCourses] = useState<CourseOpt[]>([]);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('assessments').select('*').order('created_at', { ascending: false });
    if (error) toast.error(error.message);
    setList((data as Assessment[]) || []);
    setLoading(false);
  };
  const loadCourses = async () => {
    const { data } = await supabase.from('courses').select('id,title').order('title');
    setCourses((data as CourseOpt[]) || []);
  };
  const loadQuestions = async (id: string) => {
    setQLoading(true);
    const { data, error } = await supabase.from('assessment_questions').select('*').eq('assessment_id', id).order('order_index');
    if (error) toast.error(error.message);
    setQuestions((data as Question[]) || []);
    setQLoading(false);
  };
  useEffect(() => { if (isAdmin) { load(); loadCourses(); } }, [isAdmin]);
  useEffect(() => { if (selected) loadQuestions(selected.id); }, [selected]);


  if (!isAdmin) return <AppLayout><div className="container py-12 text-center text-muted-foreground">Admins only.</div></AppLayout>;

  const recalcTotal = async (assessmentId: string) => {
    const { data } = await supabase.from('assessment_questions').select('marks').eq('assessment_id', assessmentId);
    const total = (data || []).reduce((s: number, q: any) => s + (q.marks || 0), 0);
    await supabase.from('assessments').update({ total_marks: total }).eq('id', assessmentId);
  };

  const saveAssessment = async () => {
    if (!aForm.title.trim()) return toast.error('Title required');
    const payload: any = { title: aForm.title.trim(), description: aForm.description || null, duration_minutes: Number(aForm.duration_minutes) || 30, passing_marks: Number(aForm.passing_marks) || 0, recommended_course_id: aForm.recommended_course_id || null };
    if (aModal.edit) {
      const { error } = await supabase.from('assessments').update(payload).eq('id', aModal.edit.id);
      if (error) return toast.error(error.message);
      toast.success('Updated');
    } else {
      const { error } = await supabase.from('assessments').insert(payload);
      if (error) return toast.error(error.message);
      toast.success('Created');
    }
    setAModal({ open: false }); setAForm({ ...emptyA }); load();
  };


  const deleteAssessment = async (id: string) => {
    if (!confirm('Delete this assessment? All questions and attempts will be removed.')) return;
    const { error } = await supabase.from('assessments').delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Deleted'); setSelected(null); load();
  };

  const togglePublish = async (a: Assessment) => {
    const { error } = await supabase.from('assessments').update({ published: !a.published }).eq('id', a.id);
    if (error) return toast.error(error.message);
    load(); if (selected?.id === a.id) setSelected({ ...a, published: !a.published });
  };

  const saveQuestion = async () => {
    if (!selected) return;
    if (!qForm.question_text.trim() || !qForm.correct_answer.trim()) return toast.error('Question and correct answer required');
    const options = qForm.question_type === 'mcq' ? (qForm.options || []).filter((o: string) => o && o.trim()) : null;
    const payload = { assessment_id: selected.id, question_text: qForm.question_text.trim(), question_type: qForm.question_type, options, correct_answer: qForm.correct_answer.trim(), marks: Number(qForm.marks) || 1, order_index: Number(qForm.order_index) || questions.length };
    if (qModal.edit) {
      const { error } = await supabase.from('assessment_questions').update(payload).eq('id', qModal.edit.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from('assessment_questions').insert(payload);
      if (error) return toast.error(error.message);
    }
    setQModal({ open: false }); setQForm({ ...emptyQ });
    await recalcTotal(selected.id); await load(); loadQuestions(selected.id);
    toast.success('Saved');
  };

  const deleteQuestion = async (id: string) => {
    if (!confirm('Delete question?')) return;
    const { error } = await supabase.from('assessment_questions').delete().eq('id', id);
    if (error) return toast.error(error.message);
    if (selected) { await recalcTotal(selected.id); await load(); loadQuestions(selected.id); }
  };

  const handleExcelImport = async (file: File) => {
    if (!selected) return;
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf);
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<any>(sheet);
      if (!rows.length) return toast.error('No rows found');
      const toInsert = rows.map((r, i) => {
        const opts = [r.OptionA, r.OptionB, r.OptionC, r.OptionD].filter((o: any) => o !== undefined && o !== null && String(o).trim() !== '');
        const type = (r.Type || (opts.length ? 'mcq' : 'short')).toString().toLowerCase();
        return {
          assessment_id: selected.id,
          question_text: String(r.Question || '').trim(),
          question_type: type,
          options: type === 'mcq' ? opts.map((o: any) => String(o)) : null,
          correct_answer: String(r.Answer || r.Correct || '').trim(),
          marks: Number(r.Marks) || 1,
          order_index: Number(r.Order) || i,
        };
      }).filter(q => q.question_text && q.correct_answer);
      if (!toInsert.length) return toast.error('No valid questions. Required: Question, Answer columns.');
      const { error } = await supabase.from('assessment_questions').insert(toInsert);
      if (error) return toast.error(error.message);
      toast.success(`Imported ${toInsert.length} questions`);
      await recalcTotal(selected.id); await load(); loadQuestions(selected.id);
    } catch (e: any) { toast.error(e.message); }
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { Question: 'What is 2+2?', Type: 'mcq', OptionA: '3', OptionB: '4', OptionC: '5', OptionD: '6', Answer: '4', Marks: 1, Order: 1 },
      { Question: 'Capital of France?', Type: 'short', OptionA: '', OptionB: '', OptionC: '', OptionD: '', Answer: 'Paris', Marks: 2, Order: 2 },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Questions');
    XLSX.writeFile(wb, 'assessment-template.xlsx');
  };

  const viewAttempts = async (a: Assessment) => {
    setSelected(a); setAttemptsOpen(true);
    const { data } = await supabase.from('assessment_attempts').select('*').eq('assessment_id', a.id).order('submitted_at', { ascending: false });
    const rows = (data as Attempt[]) || [];
    const ids = Array.from(new Set(rows.map(r => r.user_id)));
    let profMap: Record<string, any> = {};
    if (ids.length) {
      const { data: profs } = await supabase.from('profiles').select('id,name,email').in('id', ids);
      (profs || []).forEach((p: any) => { profMap[p.id] = p; });
    }
    setAttempts(rows.map(r => ({ ...r, name: profMap[r.user_id]?.name, email: profMap[r.user_id]?.email })));
  };

  // ---- selected view ----
  if (selected && !attemptsOpen) {
    return (
      <AppLayout>
        <div className="container py-6 max-w-5xl">
          <button onClick={() => setSelected(null)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"><ArrowLeft className="w-4 h-4" /> Back</button>
          <div className="bg-card rounded-2xl p-6 card-shadow mb-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="font-display text-2xl font-bold">{selected.title}</h1>
                <p className="text-sm text-muted-foreground mt-1">{selected.description}</p>
                <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
                  <span>⏱ {selected.duration_minutes} min</span>
                  <span>📝 {selected.total_marks} marks</span>
                  <span>🎯 Pass: {selected.passing_marks}</span>
                  <span className={selected.published ? 'text-success' : 'text-accent'}>{selected.published ? '● Published' : '○ Draft'}</span>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => togglePublish(selected)} className="px-3 py-2 rounded-lg text-sm border hover:bg-secondary flex items-center gap-2">
                  {selected.published ? <><EyeOff className="w-4 h-4" /> Unpublish</> : <><Eye className="w-4 h-4" /> Publish</>}
                </button>
                <button onClick={() => viewAttempts(selected)} className="px-3 py-2 rounded-lg text-sm border hover:bg-secondary flex items-center gap-2"><Users className="w-4 h-4" /> Attempts</button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="font-semibold">Questions ({questions.length})</h2>
            <div className="flex gap-2 flex-wrap">
              <button onClick={downloadTemplate} className="px-3 py-2 rounded-lg text-sm border hover:bg-secondary flex items-center gap-2"><FileSpreadsheet className="w-4 h-4" /> Template</button>
              <label className="px-3 py-2 rounded-lg text-sm border hover:bg-secondary flex items-center gap-2 cursor-pointer">
                <FileSpreadsheet className="w-4 h-4" /> Import Excel
                <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleExcelImport(f); e.currentTarget.value = ''; }} />
              </label>
              <button onClick={() => { setQForm({ ...emptyQ, order_index: questions.length }); setQModal({ open: true }); }} className="px-3 py-2 rounded-lg text-sm bg-primary text-primary-foreground flex items-center gap-2"><Plus className="w-4 h-4" /> Add</button>
            </div>
          </div>

          {qLoading ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            : questions.length === 0 ? <div className="bg-card rounded-2xl p-8 text-center text-muted-foreground text-sm">No questions yet. Add manually or import from Excel.</div>
            : <div className="space-y-3">
                {questions.map((q, i) => (
                  <div key={q.id} className="bg-card rounded-xl p-4 card-shadow">
                    <div className="flex justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-1">Q{i + 1} · {q.question_type.toUpperCase()} · {q.marks} mark{q.marks > 1 ? 's' : ''}</p>
                        <p className="font-medium text-sm">{q.question_text}</p>
                        {q.options && Array.isArray(q.options) && (
                          <ul className="mt-2 text-xs text-muted-foreground space-y-0.5">
                            {(q.options as string[]).map((o, oi) => (
                              <li key={oi} className={o === q.correct_answer ? 'text-success font-semibold' : ''}>{String.fromCharCode(65 + oi)}. {o}</li>
                            ))}
                          </ul>
                        )}
                        {(!q.options || !Array.isArray(q.options)) && <p className="mt-2 text-xs"><span className="text-muted-foreground">Answer: </span><span className="text-success font-semibold">{q.correct_answer}</span></p>}
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => { setQForm({ ...q, options: Array.isArray(q.options) ? [...(q.options as string[]), '', '', '', ''].slice(0, 4) : ['', '', '', ''] }); setQModal({ open: true, edit: q }); }} className="p-2 rounded-lg hover:bg-secondary"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => deleteQuestion(q.id)} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>}
        </div>

        {qModal.open && (
          <Modal onClose={() => setQModal({ open: false })} title={qModal.edit ? 'Edit Question' : 'Add Question'}>
            <div className="space-y-3">
              <select value={qForm.question_type} onChange={e => setQForm({ ...qForm, question_type: e.target.value })} className="w-full p-3 rounded-lg border bg-background text-sm">
                <option value="mcq">Multiple Choice</option>
                <option value="short">Short Answer</option>
              </select>
              <textarea placeholder="Question text" value={qForm.question_text} onChange={e => setQForm({ ...qForm, question_text: e.target.value })} className="w-full p-3 rounded-lg border bg-background text-sm min-h-[80px]" />
              {qForm.question_type === 'mcq' && (
                <div className="space-y-2">
                  {[0, 1, 2, 3].map(i => (
                    <input key={i} placeholder={`Option ${String.fromCharCode(65 + i)}`} value={qForm.options[i] || ''} onChange={e => { const o = [...qForm.options]; o[i] = e.target.value; setQForm({ ...qForm, options: o }); }} className="w-full p-2.5 rounded-lg border bg-background text-sm" />
                  ))}
                </div>
              )}
              <input placeholder="Correct Answer (exact text)" value={qForm.correct_answer} onChange={e => setQForm({ ...qForm, correct_answer: e.target.value })} className="w-full p-3 rounded-lg border bg-background text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <input type="number" placeholder="Marks" value={qForm.marks} onChange={e => setQForm({ ...qForm, marks: e.target.value })} className="p-3 rounded-lg border bg-background text-sm" />
                <input type="number" placeholder="Order" value={qForm.order_index} onChange={e => setQForm({ ...qForm, order_index: e.target.value })} className="p-3 rounded-lg border bg-background text-sm" />
              </div>
              <button onClick={saveQuestion} className="w-full py-3 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">Save</button>
            </div>
          </Modal>
        )}
      </AppLayout>
    );
  }

  if (attemptsOpen && selected) {
    return (
      <AppLayout>
        <div className="container py-6 max-w-5xl">
          <button onClick={() => { setAttemptsOpen(false); }} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"><ArrowLeft className="w-4 h-4" /> Back to assessment</button>
          <h1 className="font-display text-2xl font-bold mb-1">Attempts · {selected.title}</h1>
          <p className="text-sm text-muted-foreground mb-6">{attempts.length} submission{attempts.length !== 1 ? 's' : ''}</p>
          <div className="bg-card rounded-2xl card-shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary text-xs text-muted-foreground">
                <tr><th className="text-left p-3">Student</th><th className="text-left p-3">Email</th><th className="text-right p-3">Score</th><th className="text-right p-3">%</th><th className="text-right p-3">Result</th><th className="text-right p-3">Submitted</th></tr>
              </thead>
              <tbody>
                {attempts.length === 0 ? <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No attempts yet</td></tr>
                : attempts.map(a => (
                  <tr key={a.id} className="border-t">
                    <td className="p-3 font-medium">{a.name || '—'}</td>
                    <td className="p-3 text-muted-foreground">{a.email || '—'}</td>
                    <td className="p-3 text-right font-mono">{a.score}/{a.total_marks}</td>
                    <td className="p-3 text-right font-mono">{a.percentage}%</td>
                    <td className={`p-3 text-right font-semibold ${a.passed ? 'text-success' : 'text-destructive'}`}>{a.passed ? 'Pass' : 'Fail'}</td>
                    <td className="p-3 text-right text-xs text-muted-foreground">{new Date(a.submitted_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container py-6 max-w-5xl">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
          <div>
            <h1 className="font-display text-2xl font-bold flex items-center gap-2"><ClipboardCheck className="w-6 h-6 text-primary" /> Assessments</h1>
            <p className="text-sm text-muted-foreground">Create assessments and import questions from Excel</p>
          </div>
          <button onClick={() => { setAForm({ ...emptyA }); setAModal({ open: true }); }} className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-2"><Plus className="w-4 h-4" /> New Assessment</button>
        </div>

        {loading ? <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          : list.length === 0 ? <div className="bg-card rounded-2xl p-12 text-center text-muted-foreground">No assessments yet. Create your first one.</div>
          : <div className="grid sm:grid-cols-2 gap-4">
              {list.map(a => (
                <div key={a.id} className="bg-card rounded-2xl p-5 card-shadow hover:card-shadow-hover transition-all">
                  <div className="flex justify-between items-start gap-2">
                    <button onClick={() => setSelected(a)} className="text-left flex-1">
                      <h3 className="font-semibold">{a.title}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{a.description || 'No description'}</p>
                    </button>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${a.published ? 'bg-success/15 text-success' : 'bg-accent/15 text-accent'}`}>{a.published ? 'LIVE' : 'DRAFT'}</span>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
                    <span>⏱ {a.duration_minutes}m</span>
                    <span>📝 {a.total_marks} marks</span>
                    <span>🎯 Pass: {a.passing_marks}</span>
                  </div>
                  <div className="flex gap-1 mt-4 border-t pt-3">
                    <button onClick={() => setSelected(a)} className="flex-1 py-1.5 rounded-lg text-xs hover:bg-secondary">Manage</button>
                    <button onClick={() => { setAForm({ title: a.title, description: a.description || '', duration_minutes: a.duration_minutes, passing_marks: a.passing_marks, recommended_course_id: a.recommended_course_id || '' }); setAModal({ open: true, edit: a }); }} className="p-2 rounded-lg hover:bg-secondary"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => deleteAssessment(a.id)} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>}
      </div>

      {aModal.open && (
        <Modal onClose={() => setAModal({ open: false })} title={aModal.edit ? 'Edit Assessment' : 'New Assessment'}>
          <div className="space-y-3">
            <input placeholder="Title" value={aForm.title} onChange={e => setAForm({ ...aForm, title: e.target.value })} className="w-full p-3 rounded-lg border bg-background text-sm" />
            <textarea placeholder="Description" value={aForm.description} onChange={e => setAForm({ ...aForm, description: e.target.value })} className="w-full p-3 rounded-lg border bg-background text-sm min-h-[70px]" />
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs"><span className="text-muted-foreground">Duration (min)</span><input type="number" value={aForm.duration_minutes} onChange={e => setAForm({ ...aForm, duration_minutes: e.target.value })} className="w-full mt-1 p-2.5 rounded-lg border bg-background text-sm" /></label>
              <label className="text-xs"><span className="text-muted-foreground">Passing marks</span><input type="number" value={aForm.passing_marks} onChange={e => setAForm({ ...aForm, passing_marks: e.target.value })} className="w-full mt-1 p-2.5 rounded-lg border bg-background text-sm" /></label>
            </div>
            <label className="text-xs block">
              <span className="text-muted-foreground">Recommended course (shown to students who score below passing)</span>
              <select value={aForm.recommended_course_id || ''} onChange={e => setAForm({ ...aForm, recommended_course_id: e.target.value })} className="w-full mt-1 p-2.5 rounded-lg border bg-background text-sm">
                <option value="">— None —</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </label>
            <button onClick={saveAssessment} className="w-full py-3 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">Save</button>
          </div>
        </Modal>
      )}
    </AppLayout>
  );
}

function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 bg-foreground/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-card">
          <h3 className="font-semibold">{title}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-secondary"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
