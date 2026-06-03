import React, { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen, Video, FileText, Link2, ArrowLeft, Loader2, PlayCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Course { id: string; title: string; description: string | null; cover_url: string | null; }
interface Lesson { id: string; course_id: string; title: string; description: string | null; video_url: string | null; pdf_url: string | null; external_url: string | null; order_index: number; }

function getYouTubeEmbed(url: string) {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) return `https://www.youtube.com/embed/${v}`;
    }
  } catch {}
  return null;
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
      if (error) toast.error(error.message);
      setCourses((data as Course[]) || []);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!selected) { setLessons([]); setActiveLesson(null); return; }
    (async () => {
      const { data, error } = await supabase.from('lessons').select('*').eq('course_id', selected.id).order('order_index');
      if (error) toast.error(error.message);
      const list = (data as Lesson[]) || [];
      setLessons(list);
      setActiveLesson(list[0] || null);
    })();
  }, [selected]);

  if (selected) {
    const ytEmbed = activeLesson?.video_url ? getYouTubeEmbed(activeLesson.video_url) : null;
    return (
      <AppLayout>
        <div className="container py-6 max-w-6xl">
          <button onClick={() => setSelected(null)} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4" /> All courses
          </button>
          <h1 className="text-2xl font-display font-bold mb-1">{selected.title}</h1>
          <p className="text-sm text-muted-foreground mb-6">{selected.description}</p>

          {lessons.length === 0 ? (
            <div className="text-center py-16 border rounded-xl bg-card text-muted-foreground">No lessons available yet.</div>
          ) : (
            <div className="grid lg:grid-cols-[1fr_320px] gap-6">
              <div className="space-y-4">
                {activeLesson && (
                  <div className="border rounded-xl bg-card overflow-hidden">
                    {ytEmbed ? (
                      <div className="aspect-video bg-black">
                        <iframe src={ytEmbed} className="w-full h-full" allowFullScreen title={activeLesson.title} />
                      </div>
                    ) : activeLesson.video_url ? (
                      <div className="aspect-video bg-black">
                        <video src={activeLesson.video_url} controls className="w-full h-full" />
                      </div>
                    ) : null}
                    <div className="p-5">
                      <h2 className="text-lg font-semibold mb-1">{activeLesson.title}</h2>
                      {activeLesson.description && <p className="text-sm text-muted-foreground mb-4">{activeLesson.description}</p>}
                      <div className="flex flex-wrap gap-2">
                        {activeLesson.video_url && <a href={activeLesson.video_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm bg-secondary hover:bg-secondary/80 px-3 py-1.5 rounded-md"><Video className="w-4 h-4" /> Watch video</a>}
                        {activeLesson.pdf_url && <a href={activeLesson.pdf_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm bg-secondary hover:bg-secondary/80 px-3 py-1.5 rounded-md"><FileText className="w-4 h-4" /> Open PDF</a>}
                        {activeLesson.external_url && <a href={activeLesson.external_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm bg-secondary hover:bg-secondary/80 px-3 py-1.5 rounded-md"><Link2 className="w-4 h-4" /> External link</a>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <aside className="border rounded-xl bg-card p-3 h-fit lg:sticky lg:top-20">
                <div className="text-xs font-semibold text-muted-foreground uppercase px-2 py-2">Lessons ({lessons.length})</div>
                <div className="space-y-1 max-h-[60vh] overflow-y-auto">
                  {lessons.map((l, i) => {
                    const active = activeLesson?.id === l.id;
                    return (
                      <button key={l.id} onClick={() => setActiveLesson(l)}
                        className={`w-full text-left flex items-start gap-3 p-2.5 rounded-lg transition-colors ${active ? 'bg-primary/10 text-primary' : 'hover:bg-secondary'}`}>
                        <div className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-semibold flex-shrink-0 ${active ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>{i + 1}</div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{l.title}</div>
                          <div className="flex gap-1 mt-0.5 text-muted-foreground">
                            {l.video_url && <Video className="w-3 h-3" />}
                            {l.pdf_url && <FileText className="w-3 h-3" />}
                            {l.external_url && <Link2 className="w-3 h-3" />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </aside>
            </div>
          )}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container py-8 max-w-6xl">
        <h1 className="text-2xl font-display font-bold mb-1">My Courses</h1>
        <p className="text-sm text-muted-foreground mb-6">Lessons assigned to you by your mentor.</p>
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : courses.length === 0 ? (
          <div className="text-center py-16 border rounded-xl bg-card">
            <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No courses assigned yet.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map(c => (
              <button key={c.id} onClick={() => setSelected(c)} className="text-left border rounded-xl bg-card p-5 hover:shadow-md transition-shadow flex flex-col">
                {c.cover_url ? (
                  <img src={c.cover_url} alt={c.title} className="w-full h-32 object-cover rounded-lg mb-3" />
                ) : (
                  <div className="w-full h-32 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 mb-3 flex items-center justify-center">
                    <PlayCircle className="w-10 h-10 text-primary" />
                  </div>
                )}
                <h3 className="font-semibold text-base mb-1">{c.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{c.description || 'No description'}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
