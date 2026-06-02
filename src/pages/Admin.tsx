import React, { useEffect, useMemo, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { useApp } from '@/lib/app-context';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Users, UserPlus, Upload, Download, Trash2, Search, ShieldCheck, FileSpreadsheet, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface StudentRow {
  id: string;
  name: string | null;
  email: string | null;
  college: string | null;
  year: string | null;
  branch: string | null;
  level: string | null;
  total_marks: number | null;
  lessons_completed: number | null;
  created_at: string;
}

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-create-user`;

function randomPassword(len = 12) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$';
  let p = '';
  for (let i = 0; i < len; i++) p += chars[Math.floor(Math.random() * chars.length)];
  return p;
}

export default function AdminPage() {
  const { isAdmin, claimAdminIfNone, session } = useApp();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [claiming, setClaiming] = useState(false);

  // Manual create
  const [single, setSingle] = useState({ name: '', email: '', password: '', college: '', year: '', branch: '', level: 'Beginner' });
  const [creating, setCreating] = useState(false);

  // Bulk upload
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [bulkResult, setBulkResult] = useState<any>(null);
  const [bulkRunning, setBulkRunning] = useState(false);

  const loadStudents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id,name,email,college,year,branch,level,total_marks,lessons_completed,created_at')
      .order('created_at', { ascending: false });
    if (error) toast.error(error.message);
    setStudents((data as StudentRow[]) || []);
    setLoading(false);
  };

  useEffect(() => { if (isAdmin) loadStudents(); }, [isAdmin]);

  const callCreate = async (users: any[]) => {
    const res = await fetch(FN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ users }),
    });
    return res.json();
  };

  const handleClaimAdmin = async () => {
    setClaiming(true);
    const ok = await claimAdminIfNone();
    setClaiming(false);
    if (ok) toast.success('You are now the admin');
    else toast.error('An admin already exists. Ask them to grant you access.');
  };

  const handleSingleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!single.email || !single.password) { toast.error('Email and password required'); return; }
    if (single.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setCreating(true);
    try {
      const result = await callCreate([single]);
      const r = result?.results?.[0];
      if (r?.status === 'created') {
        toast.success(`Created ${single.email}`);
        setSingle({ name: '', email: '', password: '', college: '', year: '', branch: '', level: 'Beginner' });
        loadStudents();
      } else {
        toast.error(r?.error || result?.error || 'Failed to create user');
      }
    } finally { setCreating(false); }
  };

  const handleFile = async (file: File) => {
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<any>(sheet, { defval: '' });
      const normalized = rows.map((r) => ({
        email: String(r.email || r.Email || '').trim(),
        password: String(r.password || r.Password || '').trim() || randomPassword(),
        name: String(r.name || r.Name || '').trim(),
        college: String(r.college || r.College || '').trim(),
        year: String(r.year || r.Year || '').trim(),
        branch: String(r.branch || r.Branch || '').trim(),
        level: String(r.level || r.Level || 'Beginner').trim(),
      })).filter((r) => r.email);
      setParsedRows(normalized);
      setBulkResult(null);
      toast.success(`Parsed ${normalized.length} rows`);
    } catch (err: any) {
      toast.error('Failed to read file: ' + err.message);
    }
  };

  const runBulk = async () => {
    if (!parsedRows.length) return;
    setBulkRunning(true);
    try {
      const result = await callCreate(parsedRows);
      setBulkResult(result);
      toast.success(`Created ${result.created} / ${result.total}`);
      loadStudents();
    } catch (err: any) {
      toast.error(err.message);
    } finally { setBulkRunning(false); }
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { name: 'Aarav Kumar', email: 'aarav@example.com', password: 'TempPass123', college: 'JNTU Hyderabad', year: '3rd', branch: 'CSE', level: 'Intermediate' },
      { name: 'Priya Sharma', email: 'priya@example.com', password: '', college: 'IIT Bombay', year: '2nd', branch: 'ECE', level: 'Beginner' },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    XLSX.writeFile(wb, 'mentorsplace-students-template.xlsx');
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return students;
    return students.filter((s) =>
      (s.name || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q) ||
      (s.college || '').toLowerCase().includes(q),
    );
  }, [students, search]);

  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="container py-10 max-w-lg">
          <div className="bg-card rounded-2xl p-8 card-shadow text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-7 h-7 text-primary" />
            </div>
            <h1 className="font-display text-2xl font-bold">Admin access required</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Only administrators can manage student accounts. If no admin exists yet, you can claim the role below — this only works once.
            </p>
            <button
              onClick={handleClaimAdmin}
              disabled={claiming}
              className="mt-6 w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 disabled:opacity-40 transition"
            >
              {claiming ? 'Claiming...' : 'Claim admin (bootstrap)'}
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container py-6 space-y-6 max-w-6xl">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold flex items-center gap-2">
              <Users className="w-7 h-7 text-primary" /> Student Management
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Create accounts manually or import from an Excel file.</p>
          </div>
          <div className="text-sm text-muted-foreground tabular-nums">
            <span className="font-semibold text-foreground">{students.length}</span> students
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Manual create */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl p-6 card-shadow">
            <div className="flex items-center gap-2 mb-4">
              <UserPlus className="w-5 h-5 text-primary" />
              <h2 className="font-display text-lg font-bold">Create student manually</h2>
            </div>
            <form onSubmit={handleSingleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input className="px-3 py-2 rounded-lg border bg-background text-sm" placeholder="Full name"
                  value={single.name} onChange={e => setSingle({ ...single, name: e.target.value })} />
                <input className="px-3 py-2 rounded-lg border bg-background text-sm" placeholder="Email *" type="email" required
                  value={single.email} onChange={e => setSingle({ ...single, email: e.target.value })} />
                <div className="relative col-span-2">
                  <input className="w-full px-3 py-2 rounded-lg border bg-background text-sm pr-20" placeholder="Password (min 8) *"
                    value={single.password} onChange={e => setSingle({ ...single, password: e.target.value })} />
                  <button type="button" onClick={() => setSingle({ ...single, password: randomPassword() })}
                    className="absolute right-1 top-1 px-2 py-1 text-xs rounded-md bg-secondary hover:bg-secondary/70">Generate</button>
                </div>
                <input className="px-3 py-2 rounded-lg border bg-background text-sm" placeholder="College"
                  value={single.college} onChange={e => setSingle({ ...single, college: e.target.value })} />
                <input className="px-3 py-2 rounded-lg border bg-background text-sm" placeholder="Year"
                  value={single.year} onChange={e => setSingle({ ...single, year: e.target.value })} />
                <input className="px-3 py-2 rounded-lg border bg-background text-sm" placeholder="Branch"
                  value={single.branch} onChange={e => setSingle({ ...single, branch: e.target.value })} />
                <select className="px-3 py-2 rounded-lg border bg-background text-sm"
                  value={single.level} onChange={e => setSingle({ ...single, level: e.target.value })}>
                  <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                </select>
              </div>
              <button disabled={creating} className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition flex items-center justify-center gap-2">
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                Create student
              </button>
            </form>
          </motion.div>

          {/* Bulk upload */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-card rounded-2xl p-6 card-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-primary" />
                <h2 className="font-display text-lg font-bold">Excel bulk upload</h2>
              </div>
              <button onClick={downloadTemplate} className="text-xs flex items-center gap-1 text-primary hover:underline">
                <Download className="w-3.5 h-3.5" /> Template
              </button>
            </div>
            <label className="block border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-secondary/30 transition">
              <Upload className="w-6 h-6 mx-auto text-muted-foreground" />
              <p className="text-sm font-medium mt-2">Drop .xlsx or .csv here</p>
              <p className="text-xs text-muted-foreground mt-0.5">Columns: name, email, password, college, year, branch, level</p>
              <input type="file" accept=".xlsx,.xls,.csv" className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            </label>

            {parsedRows.length > 0 && (
              <div className="mt-4 space-y-3">
                <div className="text-sm">
                  <span className="font-semibold tabular-nums">{parsedRows.length}</span> rows ready to import.
                  Missing passwords will be auto-generated.
                </div>
                <button onClick={runBulk} disabled={bulkRunning}
                  className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition flex items-center justify-center gap-2">
                  {bulkRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  Import {parsedRows.length} students
                </button>
              </div>
            )}

            {bulkResult && (
              <div className="mt-4 max-h-48 overflow-y-auto rounded-lg border divide-y text-xs">
                {bulkResult.results.map((r: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2">
                    {r.status === 'created'
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                      : <XCircle className="w-3.5 h-3.5 text-destructive shrink-0" />}
                    <span className="flex-1 truncate">{r.email}</span>
                    {r.error && <span className="text-destructive">{r.error}</span>}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Students list */}
        <div className="bg-card rounded-2xl card-shadow overflow-hidden">
          <div className="p-4 border-b flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, email, college..."
                className="w-full pl-10 pr-3 py-2 rounded-lg border bg-background text-sm" />
            </div>
            <button onClick={loadStudents} className="text-xs px-3 py-2 rounded-lg border hover:bg-secondary">Refresh</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3">Name</th>
                  <th className="text-left px-4 py-3">Email</th>
                  <th className="text-left px-4 py-3">College</th>
                  <th className="text-left px-4 py-3">Year / Branch</th>
                  <th className="text-right px-4 py-3">Marks</th>
                  <th className="text-right px-4 py-3">Lessons</th>
                  <th className="text-left px-4 py-3">Joined</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={7} className="py-10 text-center text-muted-foreground">Loading...</td></tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr><td colSpan={7} className="py-10 text-center text-muted-foreground">No students yet. Create one above.</td></tr>
                )}
                {filtered.map((s) => (
                  <tr key={s.id} className="border-t hover:bg-secondary/30">
                    <td className="px-4 py-3 font-medium">{s.name || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.email}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.college || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{[s.year, s.branch].filter(Boolean).join(' • ') || '—'}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{s.total_marks ?? 0}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{s.lessons_completed ?? 0}</td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
