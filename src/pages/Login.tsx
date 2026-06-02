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

            <button type="submit" disabled={!isValid}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40 hover:opacity-90 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
              {isSignup ? 'Create Account' : 'Sign In'} <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 text-center">
            <button onClick={() => { setIsSignup(!isSignup); setErrors({}); }} className="text-sm text-primary font-medium hover:underline">
              {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>

          {!isSignup && (
            <button onClick={() => { login('guest@mentorsplace.com', 'guestpassword'); navigate('/dashboard'); toast.success('Welcome!'); }}
              className="w-full mt-3 py-2.5 rounded-xl border text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors">
              Continue as Guest
            </button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
