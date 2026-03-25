import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/lib/app-context';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, CheckCircle, Sparkles } from 'lucide-react';

const steps = ['Profile', 'Academic', 'Goals', 'Plan'];
const years = ['1st', '2nd', '3rd', '4th'];
const branches = ['CSE', 'ECE', 'EEE', 'Civil', 'Mechanical', 'IT', 'Other'];
const levels = ['Beginner', 'Intermediate', 'Advanced'] as const;
const goals = ['Improve spoken English', 'Placement preparation', 'HR interview communication', 'Pronunciation improvement', 'Vocabulary improvement', 'Group discussion confidence'];
const targets = [10, 20, 30];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { completeOnboarding } = useApp();
  const [step, setStep] = useState(0);
  const [data, setData] = useState({ name: '', college: '', year: '3rd', branch: 'CSE', level: 'Intermediate' as const, goal: '', dailyTarget: 20 });

  const canNext = () => {
    if (step === 0) return data.name.trim().length > 0;
    if (step === 1) return data.college.trim().length > 0;
    if (step === 2) return data.goal.length > 0;
    return true;
  };

  const finish = () => {
    const pathMap: Record<string, string> = {
      'Beginner': 'Beginner Path',
      'Intermediate': 'Communication Builder Path',
      'Advanced': 'Placement Ready Path',
    };
    completeOnboarding({ ...data, learningPath: pathMap[data.level] || 'Communication Builder Path' });
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((s, i) => (
            <React.Fragment key={s}>
              <div className={`flex items-center gap-1.5 ${i <= step ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i < step ? 'bg-primary text-primary-foreground' : i === step ? 'border-2 border-primary text-primary' : 'border border-border'}`}>
                  {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
                </div>
                <span className="text-xs font-medium hidden sm:block">{s}</span>
              </div>
              {i < steps.length - 1 && <div className={`flex-1 h-0.5 rounded ${i < step ? 'bg-primary' : 'bg-border'}`} />}
            </React.Fragment>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
            {step === 0 && (
              <div>
                <h2 className="font-display text-2xl font-bold">What's your name?</h2>
                <p className="text-muted-foreground text-sm mt-1 mb-6">We'll personalize your learning experience.</p>
                <input type="text" value={data.name} onChange={e => setData({ ...data, name: e.target.value })}
                  className="w-full p-3.5 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Enter your full name" autoFocus />
              </div>
            )}
            {step === 1 && (
              <div>
                <h2 className="font-display text-2xl font-bold">Your Academic Details</h2>
                <p className="text-muted-foreground text-sm mt-1 mb-6">Help us tailor content for engineering students.</p>
                <div className="space-y-4">
                  <input type="text" value={data.college} onChange={e => setData({ ...data, college: e.target.value })}
                    className="w-full p-3.5 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="College name" />
                  <div>
                    <label className="text-sm font-medium mb-2 block">Year of Study</label>
                    <div className="flex gap-2 flex-wrap">
                      {years.map(y => (
                        <button key={y} onClick={() => setData({ ...data, year: y })}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${data.year === y ? 'bg-primary text-primary-foreground' : 'border hover:bg-secondary'}`}>
                          {y} Year
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Branch</label>
                    <div className="flex gap-2 flex-wrap">
                      {branches.map(b => (
                        <button key={b} onClick={() => setData({ ...data, branch: b })}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${data.branch === b ? 'bg-primary text-primary-foreground' : 'border hover:bg-secondary'}`}>
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {step === 2 && (
              <div>
                <h2 className="font-display text-2xl font-bold">What's your goal?</h2>
                <p className="text-muted-foreground text-sm mt-1 mb-4">Select your primary learning objective.</p>
                <div>
                  <label className="text-sm font-medium mb-2 block">Current English Level</label>
                  <div className="flex gap-2 mb-4">
                    {levels.map(l => (
                      <button key={l} onClick={() => setData({ ...data, level: l })}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${data.level === l ? 'bg-primary text-primary-foreground' : 'border hover:bg-secondary'}`}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  {goals.map(g => (
                    <button key={g} onClick={() => setData({ ...data, goal: g })}
                      className={`w-full text-left p-3.5 rounded-xl text-sm transition-all ${data.goal === g ? 'border-primary bg-primary/5 border-2' : 'border hover:bg-secondary'}`}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {step === 3 && (
              <div>
                <h2 className="font-display text-2xl font-bold">Your Learning Plan</h2>
                <p className="text-muted-foreground text-sm mt-1 mb-6">Choose your daily study commitment.</p>
                <div className="flex gap-3 mb-8">
                  {targets.map(t => (
                    <button key={t} onClick={() => setData({ ...data, dailyTarget: t })}
                      className={`flex-1 py-4 rounded-xl text-center transition-all ${data.dailyTarget === t ? 'bg-primary text-primary-foreground' : 'border hover:bg-secondary'}`}>
                      <p className="text-2xl font-bold">{t}</p>
                      <p className="text-xs mt-1 opacity-80">min/day</p>
                    </button>
                  ))}
                </div>
                <div className="bg-secondary rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-accent" />
                    <h3 className="font-semibold">Your Recommended Path</h3>
                  </div>
                  <p className="text-sm font-bold text-primary">{data.level === 'Beginner' ? 'Beginner Path' : data.level === 'Advanced' ? 'Placement Ready Path' : 'Communication Builder Path'}</p>
                  <p className="text-xs text-muted-foreground mt-1">Goal: {data.goal || 'Placement preparation'} • {data.dailyTarget} min/day</p>
                  <p className="text-xs text-muted-foreground mt-2">First lesson: Introduction to Professional English</p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} className="py-3 px-6 rounded-xl border text-sm font-medium hover:bg-secondary transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          {step < 3 ? (
            <button onClick={() => setStep(s => s + 1)} disabled={!canNext()}
              className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40 hover:opacity-90 transition-all flex items-center justify-center gap-2">
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={finish}
              className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2">
              Start Learning <Sparkles className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
