import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { useApp } from '@/lib/app-context';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Flame, Crown } from 'lucide-react';

interface Row { user_id: string; xp_total: number; streak_current: number; streak_best: number; name: string; college?: string; department?: string }

export default function LeaderboardPage() {
  const { user } = useApp();
  const [rows, setRows] = useState<Row[]>([]);
  const [scope, setScope] = useState<'all' | 'college' | 'department'>('all');
  const [me, setMe] = useState<{ college?: string; department?: string }>({});

  useEffect(() => {
    (async () => {
      const [{ data: s }, { data: p }] = await Promise.all([
        supabase.from('user_stats').select('user_id, xp_total, streak_current, streak_best').order('xp_total', { ascending: false }).limit(100),
        supabase.from('profiles').select('id, name, college, department'),
      ]);
      const pMap = new Map((p || []).map((x: any) => [x.id, x]));
      const rs: Row[] = (s || []).map((r: any) => ({ ...r, name: pMap.get(r.user_id)?.name || 'Student', college: pMap.get(r.user_id)?.college, department: pMap.get(r.user_id)?.department }));
      setRows(rs);
      const mine = pMap.get(user?.id || '') as any;
      if (mine) setMe({ college: mine.college, department: mine.department });
    })();
  }, [user?.id]);

  const filtered = rows.filter((r) => scope === 'all' ? true : scope === 'college' ? me.college && r.college === me.college : me.department && r.department === me.department);

  return (
    <AppLayout>
      <div className="container py-8 max-w-3xl">
        <header className="mb-6">
          <h1 className="font-display text-3xl font-bold">Leaderboard</h1>
          <p className="text-muted-foreground mt-1">Compete with peers by XP earned across modules.</p>
        </header>

        <div className="inline-flex bg-secondary rounded-xl p-1 mb-5">
          {(['all', 'college', 'department'] as const).map((s) => (
            <button key={s} onClick={() => setScope(s)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${scope === s ? 'bg-card shadow-card text-foreground' : 'text-muted-foreground'}`}>
              {s === 'all' ? 'Global' : `My ${s}`}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border bg-card shadow-card overflow-hidden">
          {filtered.length === 0 && <p className="p-6 text-sm text-muted-foreground">No entries yet.</p>}
          {filtered.map((r, i) => (
            <div key={r.user_id} className={`flex items-center gap-4 px-4 py-3 border-b last:border-0 ${r.user_id === user?.id ? 'bg-primary-soft' : ''}`}>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${i === 0 ? 'bg-warning text-warning-foreground' : i === 1 ? 'bg-muted' : i === 2 ? 'bg-accent/40' : 'bg-secondary'}`}>
                {i < 3 ? <Crown className="w-4 h-4" /> : i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{r.name} {r.user_id === user?.id && <span className="text-xs text-primary">(You)</span>}</p>
                <p className="text-xs text-muted-foreground truncate">{r.college || '—'}{r.department ? ` · ${r.department}` : ''}</p>
              </div>
              <div className="flex items-center gap-1.5 text-warning text-sm font-semibold">
                <Flame className="w-4 h-4" /> {r.streak_current}
              </div>
              <div className="flex items-center gap-1.5 text-primary font-bold tabular-nums">
                <Trophy className="w-4 h-4" /> {r.xp_total}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
