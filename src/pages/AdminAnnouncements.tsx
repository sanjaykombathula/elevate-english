import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/lib/app-context';
import { toast } from 'sonner';
import { Megaphone, Plus, Trash2 } from 'lucide-react';

interface Announcement { id: string; title: string; body: string; created_at: string; published: boolean }

export default function AdminAnnouncementsPage() {
  const { isAdmin, user } = useApp();
  const [list, setList] = useState<Announcement[]>([]);
  const [title, setTitle] = useState(''); const [body, setBody] = useState('');

  const load = async () => {
    const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
    setList((data as any) || []);
  };
  useEffect(() => { load(); }, []);

  if (!isAdmin) return <AppLayout><div className="container py-10">Admins only.</div></AppLayout>;

  const create = async () => {
    if (!title.trim() || !body.trim()) return toast.error('Title and message required');
    const { error } = await supabase.from('announcements').insert({ title, body, created_by: user?.id });
    if (error) return toast.error(error.message);
    setTitle(''); setBody(''); load(); toast.success('Announcement published');
  };
  const del = async (id: string) => {
    if (!confirm('Delete?')) return;
    await supabase.from('announcements').delete().eq('id', id); load();
  };

  return (
    <AppLayout>
      <div className="container py-8 max-w-3xl space-y-6">
        <header>
          <h1 className="font-display text-3xl font-bold flex items-center gap-2"><Megaphone className="w-7 h-7" /> Announcements</h1>
          <p className="text-muted-foreground mt-1">Broadcast messages to all students.</p>
        </header>

        <div className="rounded-2xl border bg-card p-5 shadow-card space-y-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title"
            className="w-full p-3 rounded-xl border bg-background text-sm" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} placeholder="Message"
            className="w-full p-3 rounded-xl border bg-background text-sm" />
          <button onClick={create} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-sm inline-flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Publish
          </button>
        </div>

        <div className="space-y-2">
          {list.map((a) => (
            <div key={a.id} className="p-4 rounded-2xl border bg-card flex items-start gap-3">
              <div className="flex-1">
                <p className="font-display font-semibold">{a.title}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{a.body}</p>
                <p className="text-xs text-muted-foreground mt-1">{new Date(a.created_at).toLocaleString()}</p>
              </div>
              <button onClick={() => del(a.id)} className="p-2 rounded-lg border text-destructive hover:bg-destructive/10" aria-label="Delete">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {list.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No announcements yet.</p>}
        </div>
      </div>
    </AppLayout>
  );
}
