import React, { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Upload, Video, FileText, Briefcase, Loader2, CheckCircle2, Clock, Trash2, MessageSquare, Trophy } from 'lucide-react';

interface Submission {
  id: string;
  title: string;
  description: string | null;
  submission_type: 'video' | 'pdf' | 'resume';
  file_url: string;
  file_name: string | null;
  status: 'pending' | 'reviewed';
  admin_comments: string | null;
  score: number | null;
  created_at: string;
  reviewed_at: string | null;
}

const TYPES = [
  { key: 'video' as const, label: 'Video', icon: Video, accept: 'video/*', desc: 'Upload practice or speaking videos' },
  { key: 'pdf' as const, label: 'PDF', icon: FileText, accept: 'application/pdf', desc: 'Upload assignments or notes' },
  { key: 'resume' as const, label: 'Resume', icon: Briefcase, accept: '.pdf,.doc,.docx', desc: 'Upload your resume for review' },
];

export default function SubmissionsPage() {
  const [items, setItems] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<'video' | 'pdf' | 'resume'>('video');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return setLoading(false);
    const { data, error } = await supabase
      .from('task_submissions').select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) toast.error(error.message);
    setItems((data as Submission[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !file) return toast.error('Title and file are required');
    if (file.size > 50 * 1024 * 1024) return toast.error('File must be under 50MB');
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not signed in');
      const ext = file.name.split('.').pop() || 'bin';
      const path = `${user.id}/${type}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage.from('submissions').upload(path, file, { upsert: false, contentType: file.type });
      if (upErr) throw upErr;
      const { error: insErr } = await supabase.from('task_submissions').insert({
        user_id: user.id, title: title.trim(), description: description.trim() || null,
        submission_type: type, file_url: path, file_name: file.name,
      });
      if (insErr) throw insErr;
      toast.success('Submission uploaded for review');
      setTitle(''); setDescription(''); setFile(null);
      load();
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const openFile = async (path: string) => {
    const { data, error } = await supabase.storage.from('submissions').createSignedUrl(path, 300);
    if (error) return toast.error(error.message);
    window.open(data.signedUrl, '_blank');
  };

  const remove = async (s: Submission) => {
    if (!confirm('Delete this submission?')) return;
    await supabase.storage.from('submissions').remove([s.file_url]);
    const { error } = await supabase.from('task_submissions').delete().eq('id', s.id);
    if (error) return toast.error(error.message);
    toast.success('Deleted');
    load();
  };

  return (
    <AppLayout>
      <div className="container py-8 max-w-5xl">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-1">My Submissions</h1>
          <p className="text-muted-foreground text-sm">Upload videos, PDFs, or your resume for mentor review.</p>
        </div>

        <motion.form onSubmit={submit} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-card border rounded-2xl p-6 mb-8 space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {TYPES.map(t => (
              <button type="button" key={t.key} onClick={() => { setType(t.key); setFile(null); }}
                className={`p-4 rounded-xl border-2 transition-all text-left ${type === t.key ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}>
                <t.icon className={`w-5 h-5 mb-2 ${type === t.key ? 'text-primary' : 'text-muted-foreground'}`} />
                <div className="font-semibold text-sm">{t.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{t.desc}</div>
              </button>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" maxLength={120}
              className="px-3 py-2.5 rounded-lg border bg-background text-sm" />
            <input type="file" accept={TYPES.find(t => t.key === type)?.accept}
              onChange={e => setFile(e.target.files?.[0] || null)}
              className="px-3 py-2 rounded-lg border bg-background text-sm file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:bg-secondary file:text-foreground" />
          </div>
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optional)" rows={2} maxLength={500}
            className="w-full px-3 py-2.5 rounded-lg border bg-background text-sm" />

          <button type="submit" disabled={uploading} className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? 'Uploading...' : 'Submit'}
          </button>
        </motion.form>

        <h2 className="font-display text-xl font-semibold mb-3">History</h2>
        {loading ? (
          <div className="text-sm text-muted-foreground py-8 text-center"><Loader2 className="w-5 h-5 animate-spin inline" /></div>
        ) : items.length === 0 ? (
          <div className="text-sm text-muted-foreground py-12 text-center border border-dashed rounded-xl">No submissions yet.</div>
        ) : (
          <div className="space-y-3">
            {items.map(s => {
              const TIcon = TYPES.find(t => t.key === s.submission_type)?.icon || FileText;
              return (
                <div key={s.id} className="bg-card border rounded-xl p-4 flex flex-col sm:flex-row sm:items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    <TIcon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm">{s.title}</h3>
                      {s.status === 'reviewed' ? (
                        <span className="text-[10px] uppercase font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Reviewed</span>
                      ) : (
                        <span className="text-[10px] uppercase font-bold bg-accent/20 text-accent-foreground px-2 py-0.5 rounded-full flex items-center gap-1"><Clock className="w-3 h-3" />Pending</span>
                      )}
                    </div>
                    {s.description && <p className="text-xs text-muted-foreground mt-1">{s.description}</p>}
                    <p className="text-[11px] text-muted-foreground mt-1">{new Date(s.created_at).toLocaleString()}</p>
                    {s.status === 'reviewed' && (
                      <div className="mt-2 p-3 bg-secondary/50 rounded-lg space-y-1">
                        {s.score !== null && (
                          <div className="flex items-center gap-1.5 text-sm font-semibold"><Trophy className="w-4 h-4 text-accent" /> Score: {s.score}/100</div>
                        )}
                        {s.admin_comments && (
                          <div className="flex items-start gap-1.5 text-xs text-muted-foreground"><MessageSquare className="w-3.5 h-3.5 mt-0.5" /> {s.admin_comments}</div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openFile(s.file_url)} className="text-xs px-3 py-1.5 rounded-lg border hover:bg-secondary">View</button>
                    {s.status === 'pending' && (
                      <button onClick={() => remove(s)} className="text-xs px-3 py-1.5 rounded-lg border text-destructive hover:bg-destructive/10"><Trash2 className="w-3.5 h-3.5" /></button>
                    )}
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
