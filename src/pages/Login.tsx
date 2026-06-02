import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/lib/app-context';
import { motion } from 'framer-motion';
import { GraduationCap, Eye, EyeOff, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, signup, signInWithGoogle } = useApp();
  const [isSignup, setIsSignup] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (isSignup && !form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email format';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'Minimum 8 characters';
    if (isSignup && form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      if (isSignup) {
        const ok = await signup(form.name, form.email, form.password);
        if (ok) { toast.success('Account created!'); navigate('/onboarding'); }
        else toast.error('Signup failed. Email may already be in use.');
      } else {
        const ok = await login(form.email, form.password);
        if (ok) { toast.success('Welcome back!'); navigate('/'); }
        else toast.error('Invalid credentials');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    try { await signInWithGoogle(); } catch { toast.error('Google sign-in failed'); }
  };

  const isValid = isSignup
    ? form.name.trim() && form.email.trim() && form.password.length >= 8 && form.password === form.confirmPassword
    : form.email.trim() && form.password.length >= 8;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel */}
      <div className="hidden lg:flex flex-1 bg-primary items-center justify-center p-12">
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-primary-foreground/10 flex items-center justify-center mb-8">
            <GraduationCap className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="font-display text-4xl font-extrabold text-primary-foreground leading-tight">
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

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl">MentorsPlace</span>
          </div>

          <h2 className="font-display text-2xl font-bold">{isSignup ? 'Create Account' : 'Welcome Back'}</h2>
          <p className="text-muted-foreground text-sm mt-1 mb-6">{isSignup ? 'Start your placement preparation journey' : 'Continue your learning journey'}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div>
                <label className="text-sm font-medium mb-1.5 block">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Enter your full name" />
                </div>
                {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
              </div>
            )}
            <div>
              <label className="text-sm font-medium mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="you@example.com" />
              </div>
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Min 8 characters" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-muted-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive mt-1">{errors.password}</p>}
              {form.password && (
                <div className="flex gap-1 mt-2">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className={`h-1 flex-1 rounded-full ${form.password.length >= i * 3 ? 'bg-success' : 'bg-border'}`} />
                  ))}
                </div>
              )}
            </div>
            {isSignup && (
              <div>
                <label className="text-sm font-medium mb-1.5 block">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <input type="password" value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Re-enter password" />
                </div>
                {errors.confirmPassword && <p className="text-xs text-destructive mt-1">{errors.confirmPassword}</p>}
              </div>
            )}

            <button type="submit" disabled={!isValid || submitting}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40 hover:opacity-90 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
              {submitting ? 'Please wait...' : (isSignup ? 'Create Account' : 'Sign In')} <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
            <div className="relative flex justify-center"><span className="bg-background px-2 text-xs text-muted-foreground">or continue with</span></div>
          </div>

          <button onClick={handleGoogle} type="button"
            className="w-full py-2.5 rounded-xl border text-sm font-medium hover:bg-secondary transition-colors flex items-center justify-center gap-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </button>

          <div className="mt-6 text-center">
            <button onClick={() => { setIsSignup(!isSignup); setErrors({}); }} className="text-sm text-primary font-medium hover:underline">
              {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
