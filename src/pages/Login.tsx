import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/lib/app-context';
import { motion } from 'framer-motion';
import { GraduationCap, Eye, EyeOff, Mail, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useApp();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email format';
    if (!form.password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const ok = await login(form.email, form.password);
      if (ok) { toast.success('Welcome back!'); navigate('/'); }
      else toast.error('Invalid credentials. Contact your administrator if you do not have an account.');
    } finally {
      setSubmitting(false);
    }
  };

  const isValid = form.email.trim() && form.password.length > 0;

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:flex flex-1 bg-primary items-center justify-center p-12">
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-primary-foreground/10 flex items-center justify-center mb-8">
            <GraduationCap className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="font-display text-4xl font-extrabold text-primary-foreground leading-tight text-balance">
            Your technical skills got you the interview.
          </h1>
          <p className="text-primary-foreground/70 text-lg mt-4">
            We'll get you the job. Master English communication for placements.
          </p>
          <div className="flex gap-6 mt-10">
            {[{ n: '10K+', l: 'Students' }, { n: '500+', l: 'Lessons' }, { n: '95%', l: 'Placement Rate' }].map(s => (
              <div key={s.l}>
                <p className="text-2xl font-bold text-primary-foreground">{s.n}</p>
                <p className="text-xs text-primary-foreground/60">{s.l}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl">MentorsPlace</span>
          </div>

          <h2 className="font-display text-2xl font-bold">Welcome Back</h2>
          <p className="text-muted-foreground text-sm mt-1 mb-6">Sign in with the credentials provided by your administrator.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="you@example.com" autoComplete="email" />
              </div>
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Enter your password" autoComplete="current-password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-muted-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive mt-1">{errors.password}</p>}
            </div>

            <button type="submit" disabled={!isValid || submitting}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40 hover:opacity-90 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
              {submitting ? 'Signing in...' : 'Sign In'} <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 flex items-start gap-2 p-3 rounded-xl bg-secondary/50 border text-xs text-muted-foreground">
            <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <span>Accounts are created by your institution's administrator. If you don't have credentials, please contact them.</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
