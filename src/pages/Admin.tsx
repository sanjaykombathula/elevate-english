import React, { useEffect, useMemo, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { useApp } from '@/lib/app-context';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import {
  Users, UserPlus, Upload, Download, Trash2, Search, ShieldCheck, FileSpreadsheet,
  CheckCircle2, XCircle, Loader2, Pencil, X, KeyRound, Power, ChevronLeft, ChevronRight, Filter,
} from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface StudentRow {
  id: string;
  student_id: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  college: string | null;
  department: string | null;
  year: string | null;
  branch: string | null;
  level: string | null;
  active: boolean | null;
  total_marks: number | null;
  lessons_completed: number | null;
  created_at: string;
}

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-create-user`;

const emptyStudent = { student_id: '', name: '', email: '', password: '', phone: '', college: '', department: '', year: '', branch: '', level: 'Beginner' };
const PAGE_SIZE = 10;

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
  const [filterCollege, setFilterCollege] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);
  const [claiming, setClaiming] = useState(false);

  const [single, setSingle] = useState({ ...emptyStudent });
  const [creating, setCreating] = useState(false);

  const [editing, setEditing] = useState<StudentRow | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [savingEdit, setSavingEdit] = useState(false);

  const [resetting, setResetting] = useState<StudentRow | null>(null);
  const [newPwd, setNewPwd] = useState('');
  const [savingReset, setSavingReset] = useState(false);

  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [bulkResult, setBulkResult] = useState<any>(null);
  const [bulkRunning, setBulkRunning] = useState(false);

  const loadStudents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id,student_id,name,email,phone,college,department,year,branch,level,active,total_marks,lessons_completed,created_at')
      .order('created_at', { ascending: false });
    if (error) toast.error(error.message);
    setStudents((data as StudentRow[]) || []);
    setLoading(false);
  };

  useEffect(() => { if (isAdmin) loadStudents(); }, [isAdmin]);
  useEffect(() => { setPage(1); }, [search, filterCollege, filterDept, filterYear, filterStatus]);

  const callFn = async (payload: any) => {
    const res = await fetch(FN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
      body: JSON.stringify(payload),
    });
    return res.json();
  };

  const handleClaimAdmin = async () => {
    setClaiming(true);
    const ok = await claimAdminIfNone();
    setClaiming(false);
    if (ok) toast.success('You are now the admin');
    else toast.error('An admin already exists.');
  };

  const handleSingleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!single.email || !single.password) { toast.error('Email and password required'); return; }
    if (single.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setCreating(true);
    try {
      const result = await callFn({ users: [single] });
      const r = result?.results?.[0];
      if (r?.status === 'created') {
        toast.success(`Created ${single.email}`);
        setSingle({ ...emptyStudent });
        loadStudents();
      } else {
        toast.error(r?.error || result?.error || 'Failed to create user');
      }
    } finally { setCreating(false); }
  };

  const openEdit = (s: StudentRow) => {
    setEditing(s);
    setEditForm({
      student_id: s.student_id || '', name: s.name || '', email: s.email || '', phone: s.phone || '',
      college: s.college || '', department: s.department || '',
      year: s.year || '', branch: s.branch || '', level: s.level || 'Beginner',
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSavingEdit(true);
    try {
      const result = await callFn({ action: 'update', user: { ...editForm, id: editing.id } });
      if (result?.ok) {
        toast.success('Student updated');
        setEditing(null);
        loadStudents();
      } else {
        toast.error(result?.error || 'Update failed');
      }
    } finally { setSavingEdit(false); }
  };

  const submitReset = async () => {
    if (!resetting || newPwd.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setSavingReset(true);
    try {
      const result = await callFn({ action: 'reset_password', id: resetting.id, password: newPwd });
      if (result?.ok) {
        toast.success(`Password reset for ${resetting.email}`);
        setResetting(null); setNewPwd('');
      } else toast.error(result?.error || 'Reset failed');
    } finally { setSavingReset(false); }
  };

  const toggleActive = async (s: StudentRow) => {
    const next = !s.active;
    const result = await callFn({ action: 'set_active', id: s.id, active: next });
    if (result?.ok) {
      toast.success(next ? 'Activated' : 'Deactivated');
      setStudents((prev) => prev.map((x) => x.id === s.id ? { ...x, active: next } : x));
    } else toast.error(result?.error || 'Failed');
  };

  const deleteStudent = async (s: StudentRow) => {
    if (!confirm(`Delete ${s.email}? This cannot be undone.`)) return;
    const result = await callFn({ action: 'delete', id: s.id });
    if (result?.ok) {
      toast.success('Student deleted');
      setStudents((prev) => prev.filter((x) => x.id !== s.id));
    } else toast.error(result?.error || 'Delete failed');
  };

  const handleFile = async (file: File) => {
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<any>(sheet, { defval: '' });
      const normalized = rows.map((r) => ({
        student_id: String(r.student_id || r.StudentID || r['Student ID'] || '').trim(),
        email: String(r.email || r.Email || '').trim(),
        password: String(r.password || r.Password || '').trim() || randomPassword(),
        name: String(r.name || r.Name || '').trim(),
        phone: String(r.phone || r.Phone || '').trim(),
        college: String(r.college || r.College || '').trim(),
        department: String(r.department || r.Department || '').trim(),
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
      const result = await callFn({ users: parsedRows });
      setBulkResult(result);
      toast.success(`Created ${result.created} / ${result.total}`);
      loadStudents();
    } catch (err: any) {
      toast.error(err.message);
    } finally { setBulkRunning(false); }
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { student_id: 'MP2026001', name: 'Aarav Kumar', email: 'aarav@example.com', password: 'TempPass123', phone: '9876543210', college: 'JNTU Hyderabad', department: 'Computer Science', year: '3rd', branch: 'CSE', level: 'Intermediate' },
      { student_id: 'MP2026002', name: 'Priya Sharma', email: 'priya@example.com', password: '', phone: '', college: 'IIT Bombay', department: 'Electronics', year: '2nd', branch: 'ECE', level: 'Beginner' },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    XLSX.writeFile(wb, 'mentorsplace-students-template.xlsx');
  };

  const exportStudents = () => {
    const ws = XLSX.utils.json_to_sheet(students.map((s) => ({
      student_id: s.student_id, name: s.name, email: s.email, phone: s.phone,
      college: s.college, department: s.department, year: s.year, level: s.level,
      active: s.active, total_marks: s.total_marks, lessons_completed: s.lessons_completed,
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    XLSX.writeFile(wb, `students-export-${Date.now()}.xlsx`);
  };

  const colleges = useMemo(() => Array.from(new Set(students.map((s) => s.college).filter(Boolean))) as string[], [students]);
  const depts = useMemo(() => Array.from(new Set(students.map((s) => s.department).filter(Boolean))) as string[], [students]);
  const years = useMemo(() => Array.from(new Set(students.map((s) => s.year).filter(Boolean))) as string[], [students]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return students.filter((s) => {
      if (q) {
        const hit = (s.name || '').toLowerCase().includes(q)
          || (s.email || '').toLowerCase().includes(q)
          || (s.student_id || '').toLowerCase().includes(q)
          || (s.college || '').toLowerCase().includes(q)
          || (s.department || '').toLowerCase().includes(q)
          || (s.phone || '').toLowerCase().includes(q);
        if (!hit) return false;
      }
      if (filterCollege && s.college !== filterCollege) return false;
      if (filterDept && s.department !== filterDept) return false;
      if (filterYear && s.year !== filterYear) return false;
      if (filterStatus === 'active' && !s.active) return false;
      if (filterStatus === 'inactive' && s.active) return false;
      return true;
    });
  }, [students, search, filterCollege, filterDept, filterYear, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
            <button onClick={handleClaimAdmin} disabled={claiming}
              className="mt-6 w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 disabled:opacity-40 transition">
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
            <p className="text-sm text-muted-foreground mt-1">Add, edit, delete, activate, or bulk-import student accounts.</p>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground tabular-nums">
            <span><span className="font-semibold text-foreground">{students.length}</span> total</span>
            <button onClick={exportStudents} className="text-xs px-3 py-1.5 rounded-lg border hover:bg-secondary flex items-center gap-1">
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Manual create */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl p-6 card-shadow">
            <div className="flex items-center gap-2 mb-4">
              <UserPlus className="w-5 h-5 text-primary" />
              <h2 className="font-display text-lg font-bold">Add student</h2>
            </div>
            <form onSubmit={handleSingleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input className="px-3 py-2 rounded-lg border bg-background text-sm" placeholder="Student ID"
                  value={single.student_id} onChange={e => setSingle({ ...single, student_id: e.target.value })} />
                <input className="px-3 py-2 rounded-lg border bg-background text-sm" placeholder="Full name"
                  value={single.name} onChange={e => setSingle({ ...single, name: e.target.value })} />
                <input className="px-3 py-2 rounded-lg border bg-background text-sm" placeholder="Email *" type="email" required
                  value={single.email} onChange={e => setSingle({ ...single, email: e.target.value })} />
                <input className="px-3 py-2 rounded-lg border bg-background text-sm" placeholder="Phone"
                  value={single.phone} onChange={e => setSingle({ ...single, phone: e.target.value })} />
                <div className="relative col-span-2">
                  <input className="w-full px-3 py-2 rounded-lg border bg-background text-sm pr-20" placeholder="Password (min 8) *"
                    value={single.password} onChange={e => setSingle({ ...single, password: e.target.value })} />
                  <button type="button" onClick={() => setSingle({ ...single, password: randomPassword() })}
                    className="absolute right-1 top-1 px-2 py-1 text-xs rounded-md bg-secondary hover:bg-secondary/70">Generate</button>
                </div>
                <input className="px-3 py-2 rounded-lg border bg-background text-sm" placeholder="College"
                  value={single.college} onChange={e => setSingle({ ...single, college: e.target.value })} />
                <input className="px-3 py-2 rounded-lg border bg-background text-sm" placeholder="Department"
                  value={single.department} onChange={e => setSingle({ ...single, department: e.target.value })} />
                <input className="px-3 py-2 rounded-lg border bg-background text-sm" placeholder="Year"
                  value={single.year} onChange={e => setSingle({ ...single, year: e.target.value })} />
                <select className="px-3 py-2 rounded-lg border bg-background text-sm"
                  value={single.level} onChange={e => setSingle({ ...single, level: e.target.value })}>
                  <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                </select>
              </div>
              <button disabled={creating} className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition flex items-center justify-center gap-2">
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                Add student
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
              <p className="text-xs text-muted-foreground mt-0.5">student_id, name, email, password, phone, college, department, year, level</p>
              <input type="file" accept=".xlsx,.xls,.csv" className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            </label>

            {parsedRows.length > 0 && (
              <div className="mt-4 space-y-3">
                <div className="text-sm">
                  <span className="font-semibold tabular-nums">{parsedRows.length}</span> rows ready. Missing passwords are auto-generated.
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
          <div className="p-4 border-b space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search by ID, name, email, phone, college, department..."
                  className="w-full pl-10 pr-3 py-2 rounded-lg border bg-background text-sm" />
              </div>
              <button onClick={loadStudents} className="text-xs px-3 py-2 rounded-lg border hover:bg-secondary">Refresh</button>
            </div>
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <Filter className="w-3.5 h-3.5 text-muted-foreground" />
              <select value={filterCollege} onChange={e => setFilterCollege(e.target.value)} className="px-2 py-1.5 rounded-lg border bg-background">
                <option value="">All colleges</option>
                {colleges.map((c) => <option key={c}>{c}</option>)}
              </select>
              <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="px-2 py-1.5 rounded-lg border bg-background">
                <option value="">All departments</option>
                {depts.map((c) => <option key={c}>{c}</option>)}
              </select>
              <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="px-2 py-1.5 rounded-lg border bg-background">
                <option value="">All years</option>
                {years.map((c) => <option key={c}>{c}</option>)}
              </select>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className="px-2 py-1.5 rounded-lg border bg-background">
                <option value="all">All status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              {(filterCollege || filterDept || filterYear || filterStatus !== 'all' || search) && (
                <button onClick={() => { setSearch(''); setFilterCollege(''); setFilterDept(''); setFilterYear(''); setFilterStatus('all'); }}
                  className="px-2 py-1.5 rounded-lg hover:bg-secondary text-muted-foreground">Clear</button>
              )}
              <span className="ml-auto tabular-nums text-muted-foreground">{filtered.length} of {students.length}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3">Student ID</th>
                  <th className="text-left px-4 py-3">Name</th>
                  <th className="text-left px-4 py-3">Email</th>
                  <th className="text-left px-4 py-3">Phone</th>
                  <th className="text-left px-4 py-3">College</th>
                  <th className="text-left px-4 py-3">Dept</th>
                  <th className="text-left px-4 py-3">Year</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3 w-40">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={9} className="py-10 text-center text-muted-foreground">Loading...</td></tr>}
                {!loading && pageRows.length === 0 && (
                  <tr><td colSpan={9} className="py-10 text-center text-muted-foreground">No students match.</td></tr>
                )}
                {pageRows.map((s) => (
                  <tr key={s.id} className="border-t hover:bg-secondary/30">
                    <td className="px-4 py-3 font-mono text-xs">{s.student_id || '—'}</td>
                    <td className="px-4 py-3 font-medium">{s.name || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.email}</td>
                    <td className="px-4 py-3 text-muted-foreground tabular-nums">{s.phone || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.college || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.department || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.year || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${s.active ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'}`}>
                        {s.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(s)} title="Edit"
                          className="p-1.5 rounded-md hover:bg-primary/10 text-primary transition">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => { setResetting(s); setNewPwd(randomPassword()); }} title="Reset password"
                          className="p-1.5 rounded-md hover:bg-primary/10 text-primary transition">
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => toggleActive(s)} title={s.active ? 'Deactivate' : 'Activate'}
                          className={`p-1.5 rounded-md transition ${s.active ? 'hover:bg-destructive/10 text-destructive' : 'hover:bg-success/10 text-success'}`}>
                          <Power className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => deleteStudent(s)} title="Delete"
                          className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive transition">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filtered.length > 0 && (
            <div className="p-3 border-t flex items-center justify-between text-xs text-muted-foreground">
              <span>Page <span className="tabular-nums font-semibold text-foreground">{page}</span> of {totalPages}</span>
              <div className="flex items-center gap-1">
                <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-md border hover:bg-secondary disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
                <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-md border hover:bg-secondary disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => !savingEdit && setEditing(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-2xl p-6 max-w-lg w-full card-shadow" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-bold flex items-center gap-2">
                <Pencil className="w-5 h-5 text-primary" /> Edit student
              </h2>
              <button onClick={() => setEditing(null)} className="p-1 rounded-md hover:bg-secondary">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input className="px-3 py-2 rounded-lg border bg-background text-sm" placeholder="Student ID"
                value={editForm.student_id} onChange={e => setEditForm({ ...editForm, student_id: e.target.value })} />
              <input className="px-3 py-2 rounded-lg border bg-background text-sm" placeholder="Name"
                value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
              <input className="px-3 py-2 rounded-lg border bg-background text-sm" placeholder="Email" type="email"
                value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
              <input className="px-3 py-2 rounded-lg border bg-background text-sm" placeholder="Phone"
                value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
              <input className="px-3 py-2 rounded-lg border bg-background text-sm" placeholder="College"
                value={editForm.college} onChange={e => setEditForm({ ...editForm, college: e.target.value })} />
              <input className="px-3 py-2 rounded-lg border bg-background text-sm" placeholder="Department"
                value={editForm.department} onChange={e => setEditForm({ ...editForm, department: e.target.value })} />
              <input className="px-3 py-2 rounded-lg border bg-background text-sm" placeholder="Year"
                value={editForm.year} onChange={e => setEditForm({ ...editForm, year: e.target.value })} />
              <select className="px-3 py-2 rounded-lg border bg-background text-sm"
                value={editForm.level} onChange={e => setEditForm({ ...editForm, level: e.target.value })}>
                <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
              </select>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setEditing(null)} disabled={savingEdit}
                className="flex-1 py-2.5 rounded-xl border text-sm font-semibold hover:bg-secondary transition">Cancel</button>
              <button onClick={saveEdit} disabled={savingEdit}
                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-2">
                {savingEdit && <Loader2 className="w-4 h-4 animate-spin" />}
                Save changes
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Reset password modal */}
      {resetting && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => !savingReset && setResetting(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-2xl p-6 max-w-md w-full card-shadow" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-bold flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-primary" /> Reset password
              </h2>
              <button onClick={() => setResetting(null)} className="p-1 rounded-md hover:bg-secondary">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-3">Setting a new password for <span className="font-semibold text-foreground">{resetting.email}</span>. Share it with the student securely.</p>
            <div className="relative">
              <input className="w-full px-3 py-2 rounded-lg border bg-background text-sm pr-20 font-mono"
                value={newPwd} onChange={e => setNewPwd(e.target.value)} />
              <button type="button" onClick={() => setNewPwd(randomPassword())}
                className="absolute right-1 top-1 px-2 py-1 text-xs rounded-md bg-secondary hover:bg-secondary/70">Generate</button>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setResetting(null)} disabled={savingReset}
                className="flex-1 py-2.5 rounded-xl border text-sm font-semibold hover:bg-secondary transition">Cancel</button>
              <button onClick={submitReset} disabled={savingReset || newPwd.length < 8}
                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-2">
                {savingReset && <Loader2 className="w-4 h-4 animate-spin" />}
                Reset password
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AppLayout>
  );
}
