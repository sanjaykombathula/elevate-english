import React, { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Video, FileText, Briefcase, Loader2, CheckCircle2, Clock, MessageSquare, Save, Filter } from 'lucide-react';

interface Submission {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  submission_type: 'video' | 'pdf' | 'resume';
  file_url: string;
  file_name: string | null;
  status: 'pending' | 'reviewed';
  admin_comments: string | null;
  score: number | null;
  created_at: string;
  profiles?: { name: string | null; email: string | null } | null;
}

const TYPE_ICON: Record<string, any> = { video: Video, pdf: FileText, resume: Briefcase };

export default function AdminSubmissionsPage() {
  const [items, setItems] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed'>('pending');
  const [edits, setEdits] = useState<Record<string, { score: string; comments: string }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    let q = supabase.from('task_submissions').select('*').order('created_at', { ascending: false });
    if (filter !== 'all') q = q.eq('status', filter);
    const { data, error } = await q;
    if (error) { toast.error(error.message); setLoading(false); return; }
    const subs = (data as Submission[]) || [];
    // fetch profiles
    const ids = Array.from(new Set(subs.map(s => s.user_id)));
    if (ids.length) {
      const { data: profs } = await supabase.from('profiles').select('id,name,email').in('id', ids);
      const map = new Map((profs || []).map((p: any) => [p.id, p]));
      subs.forEach(s => { s.profiles = map.get(s.user_id) as any; });
    }
    setItems(subs);
    const init: Record<string, { score: string; comments: string }> = {};
    subs.forEach(s => { init[s.id] = { score: s.score?.toString() ?? '', comments: s.admin_comments ?? '' }; });
    setEdits(init);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter]);

  const openFile = async (path: string) => {
    const { data, error } = await supabase.storage.from('submissions').createSignedUrl(path, 300);
    if (error) return toast.error(error.message);
    window.open(data.signedUrl, '_blank');
  };

  const saveReview = async (s: Submission) => {
    const e = edits[s.id];
    const scoreNum = e.score === '' ? null : Number(e.score);
    if (scoreNum !== null && (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100)) return toast.error('Score must be 0-100');
    setSavingId(s.id);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('task_submissions').update({
      score: scoreNum, admin_comments: e.comments.trim() || null,
      status: 'reviewed', reviewed_by: user?.id, reviewed_at: new Date().toISOString(),
    }).eq('id', s.id);
    setSavingId(null);
    if (error) return toast.error(error.message);
    toast.success('Review saved');
    load();
  };

  return (
    <AppLayout>
      <div className="container py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold">Submission Review</h1>
            <p className="text-muted-foreground text-sm">Review student uploads, add comments, assign scores.</p>
          </div>
          <div className="flex items-center gap-2 bg-card border rounded-lg p-1">
            <Filter className="w-4 h-4 text-muted-foreground ml-2" />
            {(['pending', 'reviewed', 'all'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`text-xs font-medium px-3 py-1.5 rounded-md capitalize ${filter === f ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>{f}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin inline text-muted-foreground" /></div>
        ) : items.length === 0 ? (
          <div className="text-sm text-muted-foreground py-16 text-center border border-dashed rounded-xl">No submissions in this view.</div>
        ) : (
          <div className="space-y-4">
            {items.map(s => {
              const TIcon = TYPE_ICON[s.submission_type] || FileText;
              const e = edits[s.id] || { score: '', comments: '' };
              return (
                <div key={s.id} className="bg-card border rounded-xl p-5">
                  <div className="flex items-start gap-3 flex-wrap">
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                      <TIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-[200px]">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{s.title}</h3>
                        <span className="text-[10px] uppercase font-bold bg-secondary px-2 py-0.5 rounded-full">{s.submission_type}</span>
                        {s.status === 'reviewed' ? (
                          <span className="text-[10px] uppercase font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Reviewed</span>
                        ) : (
                          <span className="text-[10px] uppercase font-bold bg-accent/20 text-accent-foreground px-2 py-0.5 rounded-full flex items-center gap-1"><Clock className="w-3 h-3" />Pending</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {s.profiles?.name || s.profiles?.email || s.user_id.slice(0, 8)} · {new Date(s.created_at).toLocaleString()}
                      </p>
                      {s.description && <p className="text-sm mt-2">{s.description}</p>}
                    </div>
                    <button onClick={() => openFile(s.file_url)} className="text-xs px-3 py-1.5 rounded-lg border hover:bg-secondary">Open file</button>
                  </div>

                  <div className="mt-4 grid sm:grid-cols-[120px_1fr_auto] gap-3 items-start">
                    <div>
                      <label className="text-[11px] uppercase font-semibold text-muted-foreground">Score /100</label>
                      <input type="number" min={0} max={100} value={e.score}
                        onChange={ev => setEdits({ ...edits, [s.id]: { ...e, score: ev.target.value } })}
                        className="w-full mt-1 px-3 py-2 rounded-lg border bg-background text-sm" />
                    </div>
                    <div>
                      <label className="text-[11px] uppercase font-semibold text-muted-foreground flex items-center gap-1"><MessageSquare className="w-3 h-3" /> Comments</label>
                      <textarea rows={2} value={e.comments}
                        onChange={ev => setEdits({ ...edits, [s.id]: { ...e, comments: ev.target.value } })}
                        className="w-full mt-1 px-3 py-2 rounded-lg border bg-background text-sm" />
                    </div>
                    <button onClick={() => saveReview(s)} disabled={savingId === s.id}
                      className="self-end px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
                      {savingId === s.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
