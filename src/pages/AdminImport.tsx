import React, { useMemo, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { useApp } from '@/lib/app-context';
import { motion } from 'framer-motion';
import { Upload, Download, FileSpreadsheet, Loader2, CheckCircle2, XCircle, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-create-user`;

type FieldKey = 'student_id' | 'name' | 'email' | 'phone' | 'college' | 'department' | 'year' | 'password';

const FIELDS: { key: FieldKey; label: string; required?: boolean; hints: string[] }[] = [
  { key: 'student_id', label: 'Student ID', hints: ['student_id', 'studentid', 'student id', 'roll', 'roll no', 'id'] },
  { key: 'name', label: 'Full Name', required: true, hints: ['name', 'full name', 'fullname', 'student name'] },
  { key: 'email', label: 'Email', required: true, hints: ['email', 'email id', 'mail'] },
  { key: 'phone', label: 'Phone', hints: ['phone', 'mobile', 'contact', 'phone number'] },
  { key: 'college', label: 'College', hints: ['college', 'institute', 'university'] },
  { key: 'department', label: 'Department', hints: ['department', 'dept', 'branch'] },
  { key: 'year', label: 'Year', hints: ['year', 'study year', 'class'] },
  { key: 'password', label: 'Password', hints: ['password', 'pwd', 'pass'] },
];

function randomPassword(len = 12) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$';
  let p = '';
  for (let i = 0; i < len; i++) p += chars[Math.floor(Math.random() * chars.length)];
  return p;
}

function autoMap(headers: string[]): Record<FieldKey, string> {
  const map: any = {};
  for (const f of FIELDS) {
    const found = headers.find((h) => {
      const n = h.toLowerCase().trim().replace(/[_\-\s]+/g, ' ');
      return f.hints.some((hint) => n === hint || n.includes(hint));
    });
    map[f.key] = found || '';
  }
  return map;
}

export default function AdminImportPage() {
  const { isAdmin, session } = useApp();
  const [fileName, setFileName] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [mapping, setMapping] = useState<Record<FieldKey, string>>({} as any);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleFile = async (file: File) => {
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<any>(sheet, { defval: '' });
      if (!json.length) { toast.error('Sheet is empty'); return; }
      const hdrs = Object.keys(json[0]);
      setFileName(file.name);
      setHeaders(hdrs);
      setRows(json);
      setMapping(autoMap(hdrs));
      setResult(null);
      toast.success(`Loaded ${json.length} rows. Review mapping below.`);
    } catch (err: any) {
      toast.error('Failed to read file: ' + err.message);
    }
  };

  const mapped = useMemo(() => {
    if (!rows.length) return [];
    return rows.map((r) => {
      const out: any = {};
      for (const f of FIELDS) {
        const col = mapping[f.key];
        out[f.key] = col ? String(r[col] ?? '').trim() : '';
      }
      if (!out.password) out.password = randomPassword();
      return out;
    });
  }, [rows, mapping]);

  const validRows = useMemo(() => mapped.filter((r) => r.email && r.name), [mapped]);
  const invalidCount = mapped.length - validRows.length;

  const runImport = async () => {
    if (!validRows.length) { toast.error('No valid rows to import'); return; }
    if (!mapping.email || !mapping.name) { toast.error('Email and Full Name columns are required'); return; }
    setRunning(true);
    try {
      const res = await fetch(FN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ users: validRows }),
      });
      const data = await res.json();
      setResult(data);
      if (data?.created) toast.success(`Created ${data.created} of ${data.total} accounts`);
      else toast.error(data?.error || 'Import failed');
    } catch (err: any) {
      toast.error(err.message);
    } finally { setRunning(false); }
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { 'Student ID': 'MP2026001', 'Full Name': 'Aarav Kumar', 'Email': 'aarav@example.com', 'Phone': '9876543210', 'College': 'JNTU Hyderabad', 'Department': 'CSE', 'Year': '3rd', 'Password': 'TempPass123' },
      { 'Student ID': 'MP2026002', 'Full Name': 'Priya Sharma', 'Email': 'priya@example.com', 'Phone': '9876500000', 'College': 'IIT Bombay', 'Department': 'ECE', 'Year': '2nd', 'Password': '' },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    XLSX.writeFile(wb, 'student-import-template.xlsx');
  };

  const reset = () => {
    setFileName(null); setHeaders([]); setRows([]); setMapping({} as any); setResult(null);
  };

  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto p-12 text-center bg-card border rounded-2xl">
          <ShieldCheck className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <h1 className="font-display text-2xl font-bold">Admin access required</h1>
          <p className="text-sm text-muted-foreground mt-2">Only admins can import students.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold">Student Import</h1>
            <p className="text-sm text-muted-foreground mt-1">Upload an Excel file, map the columns, and create accounts in bulk.</p>
          </div>
          <button onClick={downloadTemplate} className="px-3 py-2 rounded-lg border bg-card hover:bg-muted text-sm font-medium inline-flex items-center gap-2">
            <Download className="w-4 h-4" /> Download template
          </button>
        </motion.div>

        {/* Step 1: Upload */}
        <section className="bg-card border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold inline-flex items-center justify-center">1</span>
            <h2 className="font-display text-lg font-bold">Upload Excel file</h2>
          </div>
          {!fileName ? (
            <label className="block border-2 border-dashed rounded-xl p-10 text-center cursor-pointer hover:bg-muted/40 transition">
              <FileSpreadsheet className="w-10 h-10 mx-auto text-muted-foreground" />
              <p className="text-sm font-medium mt-3">Drop or click to upload .xlsx / .csv</p>
              <p className="text-xs text-muted-foreground mt-1">First row should contain column headers</p>
              <input type="file" accept=".xlsx,.xls,.csv" className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            </label>
          ) : (
            <div className="flex items-center justify-between p-4 bg-muted/40 rounded-lg">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-6 h-6 text-primary" />
                <div>
                  <div className="font-medium text-sm">{fileName}</div>
                  <div className="text-xs text-muted-foreground">{rows.length} rows · {headers.length} columns</div>
                </div>
              </div>
              <button onClick={reset} className="text-sm px-3 py-1.5 rounded-md border hover:bg-card">Change file</button>
            </div>
          )}
        </section>

        {/* Step 2: Map columns */}
        {!!headers.length && (
          <section className="bg-card border rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold inline-flex items-center justify-center">2</span>
              <h2 className="font-display text-lg font-bold">Map columns</h2>
              <span className="text-xs text-muted-foreground inline-flex items-center gap-1 ml-2"><Sparkles className="w-3 h-3" /> Auto-detected</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {FIELDS.map((f) => (
                <div key={f.key} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      {f.label} {f.required && <span className="text-destructive">*</span>}
                    </div>
                    <div className="text-xs text-muted-foreground">Field: {f.key}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  <select
                    value={mapping[f.key] || ''}
                    onChange={(e) => setMapping((m) => ({ ...m, [f.key]: e.target.value }))}
                    className="flex-1 px-3 py-2 rounded-md border bg-background text-sm"
                  >
                    <option value="">— Not mapped —</option>
                    {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Tip: rows without an email or name are skipped. Empty passwords are auto-generated.
            </p>
          </section>
        )}

        {/* Step 3: Preview & import */}
        {!!mapped.length && (
          <section className="bg-card border rounded-2xl p-6">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold inline-flex items-center justify-center">3</span>
                <h2 className="font-display text-lg font-bold">Preview & import</h2>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-emerald-600 font-medium">{validRows.length} valid</span>
                {invalidCount > 0 && <span className="text-amber-600 font-medium">{invalidCount} skipped</span>}
                <button onClick={runImport} disabled={running || !validRows.length}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium inline-flex items-center gap-2 disabled:opacity-50">
                  {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  Create {validRows.length} accounts
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-xs">
                <thead className="bg-muted/50">
                  <tr className="text-left">
                    <th className="px-3 py-2">#</th>
                    {FIELDS.map((f) => <th key={f.key} className="px-3 py-2">{f.label}</th>)}
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {mapped.slice(0, 20).map((r, i) => {
                    const ok = r.email && r.name;
                    return (
                      <tr key={i} className="border-t">
                        <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                        {FIELDS.map((f) => (
                          <td key={f.key} className="px-3 py-2 truncate max-w-[140px]">
                            {f.key === 'password' ? (r[f.key] ? '••••••••' : '—') : (r[f.key] || <span className="text-muted-foreground">—</span>)}
                          </td>
                        ))}
                        <td className="px-3 py-2">
                          {ok ? <span className="inline-flex items-center gap-1 text-emerald-600"><CheckCircle2 className="w-3 h-3" /> Ready</span>
                              : <span className="inline-flex items-center gap-1 text-amber-600"><XCircle className="w-3 h-3" /> Skip</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {mapped.length > 20 && (
                <div className="text-center text-xs text-muted-foreground py-2 border-t bg-muted/30">
                  Showing first 20 of {mapped.length} rows
                </div>
              )}
            </div>
          </section>
        )}

        {/* Results */}
        {result && (
          <section className="bg-card border rounded-2xl p-6">
            <h2 className="font-display text-lg font-bold mb-3">Import results</h2>
            <div className="flex gap-4 text-sm mb-4">
              <div className="px-3 py-2 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-medium">
                ✓ Created: {result.created}
              </div>
              <div className="px-3 py-2 rounded-md bg-muted font-medium">Total: {result.total}</div>
              {result.created < result.total && (
                <div className="px-3 py-2 rounded-md bg-destructive/10 text-destructive font-medium">
                  Failed: {result.total - result.created}
                </div>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto border rounded-lg">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 sticky top-0">
                  <tr className="text-left">
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {result.results?.map((r: any, i: number) => (
                    <tr key={i} className="border-t">
                      <td className="px-3 py-2">{r.email}</td>
                      <td className="px-3 py-2">
                        {r.status === 'created'
                          ? <span className="inline-flex items-center gap-1 text-emerald-600"><CheckCircle2 className="w-3 h-3" /> Created</span>
                          : <span className="inline-flex items-center gap-1 text-destructive"><XCircle className="w-3 h-3" /> Failed</span>}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{r.error || r.user_id || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </AppLayout>
  );
}
