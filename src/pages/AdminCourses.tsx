import React, { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { useApp } from '@/lib/app-context';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Plus, Pencil, Trash2, BookOpen, Video, FileText, Link2, Users,
  X, ArrowLeft, Loader2, Layers, ChevronRight,
} from 'lucide-react';

interface Course { id: string; title: string; description: string | null; cover_url: string | null; created_at: string; }
interface Module { id: string; course_id: string; title: string; description: string | null; order_index: number; }
interface Lesson { id: string; course_id: string; module_id: string | null; title: string; description: string | null; video_url: string | null; pdf_url: string | null; external_url: string | null; order_index: number; }
interface Student { id: string; name: string | null; email: string | null; }
interface Assignment { id: string; course_id: string; user_id: string | null; assigned_to_all: boolean; }

const emptyCourse = { title: '', description: '', cover_url: '' };
const emptyModule = { title: '', description: '', order_index: 0 };
const emptyLesson = { title: '', description: '', video_url: '', pdf_url: '', external_url: '', order_index: 0 };

export default function AdminCoursesPage() {
  const { isAdmin } = useApp();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Course | null>(null);

  // course modal
  const [courseModal, setCourseModal] = useState<{ open: boolean; edit?: Course | null }>({ open: false });
  const [courseForm, setCourseForm] = useState<any>({ ...emptyCourse });

  // modules
  const [modules, setModules] = useState<Module[]>([]);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [moduleModal, setModuleModal] = useState<{ open: boolean; edit?: Module | null }>({ open: false });
  const [moduleForm, setModuleForm] = useState<any>({ ...emptyModule });

  // lessons (all for this course, grouped by module)
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [lessonModal, setLessonModal] = useState<{ open: boolean; edit?: Lesson | null; moduleId?: string | null }>({ open: false });
  const [lessonForm, setLessonForm] = useState<any>({ ...emptyLesson });

  // assignments
  const [assignOpen, setAssignOpen] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [assignAll, setAssignAll] = useState(false);
  const [assignedIds, setAssignedIds] = useState<Set<string>>(new Set());
  const [savingAssign, setSavingAssign] = useState(false);

  const loadCourses = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
    if (error) toast.error(error.message);
    setCourses((data as Course[]) || []);
    setLoading(false);
  };

  const loadModulesAndLessons = async (courseId: string) => {
    setModulesLoading(true);
    const [{ data: mods, error: me }, { data: lsns, error: le }] = await Promise.all([
      supabase.from('course_modules').select('*').eq('course_id', courseId).order('order_index'),
      supabase.from('lessons').select('*').eq('course_id', courseId).order('order_index'),
    ]);
    if (me) toast.error(me.message);
    if (le) toast.error(le.message);
    setModules((mods as Module[]) || []);
    setLessons((lsns as Lesson[]) || []);
    setModulesLoading(false);
  };

  useEffect(() => { if (isAdmin) loadCourses(); }, [isAdmin]);
  useEffect(() => { if (selected) loadModulesAndLessons(selected.id); }, [selected]);

  if (!isAdmin) {
    return <AppLayout><div className="container py-12 text-center text-muted-foreground">Admins only.</div></AppLayout>;
  }

  const saveCourse = async () => {
    if (!courseForm.title.trim()) return toast.error('Title required');
    if (courseModal.edit) {
      const { error } = await supabase.from('courses').update(courseForm).eq('id', courseModal.edit.id);
      if (error) return toast.error(error.message);
      toast.success('Course updated');
    } else {
      const { error } = await supabase.from('courses').insert(courseForm);
      if (error) return toast.error(error.message);
      toast.success('Course created');
    }
    setCourseModal({ open: false });
    setCourseForm({ ...emptyCourse });
    loadCourses();
  };

  const deleteCourse = async (id: string) => {
    if (!confirm('Delete this course and all its modules and lessons?')) return;
    const { error } = await supabase.from('courses').delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Course deleted');
    if (selected?.id === id) setSelected(null);
    loadCourses();
  };

  const saveModule = async () => {
    if (!selected) return;
    if (!moduleForm.title.trim()) return toast.error('Title required');
    const payload = { ...moduleForm, course_id: selected.id, order_index: Number(moduleForm.order_index) || 0 };
    if (moduleModal.edit) {
      const { error } = await supabase.from('course_modules').update(payload).eq('id', moduleModal.edit.id);
      if (error) return toast.error(error.message);
      toast.success('Module updated');
    } else {
      const { error } = await supabase.from('course_modules').insert(payload);
      if (error) return toast.error(error.message);
      toast.success('Module created');
    }
    setModuleModal({ open: false });
    setModuleForm({ ...emptyModule });
    loadModulesAndLessons(selected.id);
  };

  const deleteModule = async (id: string) => {
    if (!confirm('Delete this module? Lessons inside will be unassigned but not deleted.')) return;
    const { error } = await supabase.from('course_modules').delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Module deleted');
    if (selected) loadModulesAndLessons(selected.id);
  };

  const saveLesson = async () => {
    if (!selected) return;
    if (!lessonForm.title.trim()) return toast.error('Title required');
    const payload: any = {
      title: lessonForm.title,
      description: lessonForm.description,
      video_url: lessonForm.video_url,
      pdf_url: lessonForm.pdf_url,
      external_url: lessonForm.external_url,
      order_index: Number(lessonForm.order_index) || 0,
      course_id: selected.id,
      module_id: lessonModal.moduleId ?? lessonForm.module_id ?? null,
    };
    if (lessonModal.edit) {
      const { error } = await supabase.from('lessons').update(payload).eq('id', lessonModal.edit.id);
      if (error) return toast.error(error.message);
      toast.success('Lesson updated');
    } else {
      const { error } = await supabase.from('lessons').insert(payload);
      if (error) return toast.error(error.message);
      toast.success('Lesson created');
    }
    setLessonModal({ open: false });
    setLessonForm({ ...emptyLesson });
    loadModulesAndLessons(selected.id);
  };

  const deleteLesson = async (id: string) => {
    if (!confirm('Delete this lesson?')) return;
    const { error } = await supabase.from('lessons').delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Lesson deleted');
    if (selected) loadModulesAndLessons(selected.id);
  };

  const openAssign = async () => {
    if (!selected) return;
    setAssignOpen(true);
    const [{ data: studs }, { data: asg }] = await Promise.all([
      supabase.from('profiles').select('id,name,email').order('name'),
      supabase.from('course_assignments').select('*').eq('course_id', selected.id),
    ]);
    setStudents((studs as Student[]) || []);
    const list = (asg as Assignment[]) || [];
    setAssignAll(list.some(a => a.assigned_to_all));
    setAssignedIds(new Set(list.filter(a => a.user_id).map(a => a.user_id!)));
  };

  const toggleStudent = (id: string) => {
    const next = new Set(assignedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setAssignedIds(next);
  };

  const saveAssignments = async () => {
    if (!selected) return;
    setSavingAssign(true);
    await supabase.from('course_assignments').delete().eq('course_id', selected.id);
    const rows: any[] = [];
    if (assignAll) rows.push({ course_id: selected.id, assigned_to_all: true });
    else assignedIds.forEach(uid => rows.push({ course_id: selected.id, user_id: uid }));
    if (rows.length) {
      const { error } = await supabase.from('course_assignments').insert(rows);
      if (error) { toast.error(error.message); setSavingAssign(false); return; }
    }
    toast.success('Assignments saved');
    setSavingAssign(false);
    setAssignOpen(false);
  };

  const openNewLesson = (moduleId: string | null) => {
    const count = lessons.filter(l => l.module_id === moduleId).length;
    setLessonForm({ ...emptyLesson, order_index: count });
    setLessonModal({ open: true, edit: null, moduleId });
  };

  const renderLesson = (l: Lesson) => (
    <div key={l.id} className="border rounded-lg bg-background p-3 flex items-start gap-3">
      <div className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs shrink-0">
        {l.order_index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <h5 className="font-medium text-sm">{l.title}</h5>
        {l.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{l.description}</p>}
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {l.video_url && <span className="inline-flex items-center gap-1 text-xs bg-secondary px-2 py-0.5 rounded"><Video className="w-3 h-3" /> Video</span>}
          {l.pdf_url && <span className="inline-flex items-center gap-1 text-xs bg-secondary px-2 py-0.5 rounded"><FileText className="w-3 h-3" /> PDF</span>}
          {l.external_url && <span className="inline-flex items-center gap-1 text-xs bg-secondary px-2 py-0.5 rounded"><Link2 className="w-3 h-3" /> Link</span>}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button onClick={() => {
          setLessonForm({ title: l.title, description: l.description || '', video_url: l.video_url || '', pdf_url: l.pdf_url || '', external_url: l.external_url || '', order_index: l.order_index });
          setLessonModal({ open: true, edit: l, moduleId: l.module_id });
        }} className="p-1.5 rounded-md hover:bg-secondary"><Pencil className="w-3.5 h-3.5" /></button>
        <button onClick={() => deleteLesson(l.id)} className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    </div>
  );

  const unassigned = lessons.filter(l => !l.module_id);

  return (
    <AppLayout>
      <div className="container py-8 max-w-6xl">
        {!selected ? (
          <>
            <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
              <div>
                <h1 className="text-2xl font-display font-bold">Learning Management</h1>
                <p className="text-sm text-muted-foreground">Create courses, modules, and lessons — then assign them to students.</p>
              </div>
              <button onClick={() => { setCourseForm({ ...emptyCourse }); setCourseModal({ open: true, edit: null }); }}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90">
                <Plus className="w-4 h-4" /> New Course
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            ) : courses.length === 0 ? (
              <div className="text-center py-16 border rounded-xl bg-card">
                <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No courses yet. Create your first course.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {courses.map(c => (
                  <div key={c.id} className="border rounded-xl bg-card p-5 hover:shadow-md transition-shadow flex flex-col">
                    {c.cover_url ? (
                      <img src={c.cover_url} alt={c.title} className="w-full h-32 object-cover rounded-lg mb-3" />
                    ) : (
                      <div className="w-full h-32 rounded-lg bg-secondary mb-3 flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    <h3 className="font-semibold text-base mb-1">{c.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{c.description || 'No description'}</p>
                    <div className="mt-auto flex items-center gap-2">
                      <button onClick={() => setSelected(c)} className="flex-1 text-sm bg-secondary hover:bg-secondary/80 px-3 py-2 rounded-md font-medium">Manage</button>
                      <button onClick={() => { setCourseForm({ title: c.title, description: c.description || '', cover_url: c.cover_url || '' }); setCourseModal({ open: true, edit: c }); }}
                        className="p-2 rounded-md hover:bg-secondary"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => deleteCourse(c.id)} className="p-2 rounded-md hover:bg-destructive/10 text-destructive"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <button onClick={() => setSelected(null)} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
              <ArrowLeft className="w-4 h-4" /> Back to courses
            </button>
            <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
              <div>
                <h1 className="text-2xl font-display font-bold">{selected.title}</h1>
                <p className="text-sm text-muted-foreground">{selected.description}</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={openAssign} className="inline-flex items-center gap-2 bg-secondary px-4 py-2 rounded-lg text-sm font-medium hover:bg-secondary/80">
                  <Users className="w-4 h-4" /> Assign Students
                </button>
                <button onClick={() => { setModuleForm({ ...emptyModule, order_index: modules.length }); setModuleModal({ open: true, edit: null }); }}
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90">
                  <Plus className="w-4 h-4" /> Add Module
                </button>
              </div>
            </div>

            {modulesLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            ) : modules.length === 0 && unassigned.length === 0 ? (
              <div className="text-center py-16 border rounded-xl bg-card">
                <Layers className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No modules yet. Start by adding a module.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {modules.map(m => {
                  const items = lessons.filter(l => l.module_id === m.id);
                  return (
                    <div key={m.id} className="border rounded-xl bg-card p-5">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm shrink-0">
                            {m.order_index + 1}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold">{m.title}</h3>
                            {m.description && <p className="text-sm text-muted-foreground">{m.description}</p>}
                            <div className="text-xs text-muted-foreground mt-1">{items.length} lesson{items.length === 1 ? '' : 's'}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => openNewLesson(m.id)} className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2.5 py-1.5 rounded-md hover:bg-primary/20 font-medium">
                            <Plus className="w-3.5 h-3.5" /> Lesson
                          </button>
                          <button onClick={() => { setModuleForm({ title: m.title, description: m.description || '', order_index: m.order_index }); setModuleModal({ open: true, edit: m }); }}
                            className="p-2 rounded-md hover:bg-secondary"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => deleteModule(m.id)} className="p-2 rounded-md hover:bg-destructive/10 text-destructive"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                      {items.length > 0 && (
                        <div className="space-y-2 pl-1">{items.map(renderLesson)}</div>
                      )}
                    </div>
                  );
                })}

                {unassigned.length > 0 && (
                  <div className="border rounded-xl bg-card p-5">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <h3 className="font-semibold text-sm text-muted-foreground">Unassigned lessons</h3>
                      <button onClick={() => openNewLesson(null)} className="inline-flex items-center gap-1 text-xs bg-secondary px-2.5 py-1.5 rounded-md hover:bg-secondary/80 font-medium">
                        <Plus className="w-3.5 h-3.5" /> Lesson
                      </button>
                    </div>
                    <div className="space-y-2">{unassigned.map(renderLesson)}</div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Course Modal */}
      {courseModal.open && (
        <Modal onClose={() => setCourseModal({ open: false })} title={courseModal.edit ? 'Edit Course' : 'New Course'}>
          <Field label="Title"><input className="lms-input" value={courseForm.title} onChange={e => setCourseForm({ ...courseForm, title: e.target.value })} /></Field>
          <Field label="Description"><textarea className="lms-input min-h-[80px]" value={courseForm.description} onChange={e => setCourseForm({ ...courseForm, description: e.target.value })} /></Field>
          <Field label="Cover Image URL (optional)"><input className="lms-input" value={courseForm.cover_url} onChange={e => setCourseForm({ ...courseForm, cover_url: e.target.value })} placeholder="https://..." /></Field>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setCourseModal({ open: false })} className="px-4 py-2 rounded-lg text-sm hover:bg-secondary">Cancel</button>
            <button onClick={saveCourse} className="px-4 py-2 rounded-lg text-sm bg-primary text-primary-foreground">Save</button>
          </div>
        </Modal>
      )}

      {/* Module Modal */}
      {moduleModal.open && (
        <Modal onClose={() => setModuleModal({ open: false })} title={moduleModal.edit ? 'Edit Module' : 'New Module'}>
          <Field label="Title"><input className="lms-input" value={moduleForm.title} onChange={e => setModuleForm({ ...moduleForm, title: e.target.value })} /></Field>
          <Field label="Description"><textarea className="lms-input min-h-[60px]" value={moduleForm.description} onChange={e => setModuleForm({ ...moduleForm, description: e.target.value })} /></Field>
          <Field label="Order"><input type="number" className="lms-input" value={moduleForm.order_index} onChange={e => setModuleForm({ ...moduleForm, order_index: e.target.value })} /></Field>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setModuleModal({ open: false })} className="px-4 py-2 rounded-lg text-sm hover:bg-secondary">Cancel</button>
            <button onClick={saveModule} className="px-4 py-2 rounded-lg text-sm bg-primary text-primary-foreground">Save</button>
          </div>
        </Modal>
      )}

      {/* Lesson Modal */}
      {lessonModal.open && (
        <Modal onClose={() => setLessonModal({ open: false })} title={lessonModal.edit ? 'Edit Lesson' : 'New Lesson'}>
          <Field label="Module">
            <select className="lms-input" value={lessonModal.moduleId ?? ''} onChange={e => setLessonModal({ ...lessonModal, moduleId: e.target.value || null })}>
              <option value="">— Unassigned —</option>
              {modules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
            </select>
          </Field>
          <Field label="Title"><input className="lms-input" value={lessonForm.title} onChange={e => setLessonForm({ ...lessonForm, title: e.target.value })} /></Field>
          <Field label="Description"><textarea className="lms-input min-h-[60px]" value={lessonForm.description} onChange={e => setLessonForm({ ...lessonForm, description: e.target.value })} /></Field>
          <Field label="Video Link"><input className="lms-input" value={lessonForm.video_url} onChange={e => setLessonForm({ ...lessonForm, video_url: e.target.value })} placeholder="YouTube, Vimeo, etc." /></Field>
          <Field label="PDF Link"><input className="lms-input" value={lessonForm.pdf_url} onChange={e => setLessonForm({ ...lessonForm, pdf_url: e.target.value })} placeholder="https://.../file.pdf" /></Field>
          <Field label="External Learning Link"><input className="lms-input" value={lessonForm.external_url} onChange={e => setLessonForm({ ...lessonForm, external_url: e.target.value })} placeholder="https://..." /></Field>
          <Field label="Order"><input type="number" className="lms-input" value={lessonForm.order_index} onChange={e => setLessonForm({ ...lessonForm, order_index: e.target.value })} /></Field>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setLessonModal({ open: false })} className="px-4 py-2 rounded-lg text-sm hover:bg-secondary">Cancel</button>
            <button onClick={saveLesson} className="px-4 py-2 rounded-lg text-sm bg-primary text-primary-foreground">Save</button>
          </div>
        </Modal>
      )}

      {/* Assignments Modal */}
      {assignOpen && (
        <Modal onClose={() => setAssignOpen(false)} title="Assign Students">
          <label className="flex items-center gap-2 mb-3 p-3 border rounded-lg cursor-pointer">
            <input type="checkbox" checked={assignAll} onChange={e => setAssignAll(e.target.checked)} />
            <span className="text-sm font-medium">Assign to all students</span>
          </label>
          {!assignAll && (
            <div className="max-h-72 overflow-y-auto border rounded-lg divide-y">
              {students.length === 0 ? <div className="p-4 text-sm text-muted-foreground text-center">No students</div> :
                students.map(s => (
                  <label key={s.id} className="flex items-center gap-3 p-3 hover:bg-secondary/50 cursor-pointer">
                    <input type="checkbox" checked={assignedIds.has(s.id)} onChange={() => toggleStudent(s.id)} />
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{s.name || 'Unnamed'}</div>
                      <div className="text-xs text-muted-foreground truncate">{s.email}</div>
                    </div>
                  </label>
                ))}
            </div>
          )}
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setAssignOpen(false)} className="px-4 py-2 rounded-lg text-sm hover:bg-secondary">Cancel</button>
            <button onClick={saveAssignments} disabled={savingAssign} className="px-4 py-2 rounded-lg text-sm bg-primary text-primary-foreground inline-flex items-center gap-2">
              {savingAssign && <Loader2 className="w-4 h-4 animate-spin" />} Save
            </button>
          </div>
        </Modal>
      )}

      <style>{`.lms-input{width:100%;border:1px solid hsl(var(--border));background:hsl(var(--background));border-radius:0.5rem;padding:0.5rem 0.75rem;font-size:0.875rem;outline:none}.lms-input:focus{border-color:hsl(var(--primary))}`}</style>
    </AppLayout>
  );
}

function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card">
          <h2 className="font-display font-semibold">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-secondary"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-3">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</label>
      {children}
    </div>
  );
}
