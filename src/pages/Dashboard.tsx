import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '@/lib/app-context';
import { motion } from 'framer-motion';
import { StatCard, ProgressRing, ProgressBar } from '@/components/ui-components';
import { FlameIcon, Trophy, BookOpen, Target, Mic, GraduationCap, Briefcase, Brain, ArrowRight, Sparkles, CheckCircle } from 'lucide-react';
import { vocabWords } from '@/lib/dummy-data';
import AppLayout from '@/components/AppLayout';
import Recommendations from '@/components/Recommendations';

const quickLinks = [
  { path: '/grammar', label: 'Grammar', icon: '📝', color: 'bg-emerald-50 border-emerald-200' },
  { path: '/vocabulary', label: 'Vocabulary', icon: '📚', color: 'bg-amber-50 border-amber-200' },
  { path: '/speaking', label: 'Speaking Lab', icon: '🎙️', color: 'bg-blue-50 border-blue-200' },
  { path: '/placement', label: 'Placement', icon: '💼', color: 'bg-purple-50 border-purple-200' },
  { path: '/mock-test', label: 'Mock Test', icon: '🏆', color: 'bg-rose-50 border-rose-200' },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function Dashboard() {
  const { user, dailyProgress } = useApp();
  const wotd = vocabWords[Math.floor(Date.now() / 86400000) % vocabWords.length];

  if (!user) return null;

  return (
    <AppLayout>
      <div className="container py-6 space-y-6">
        {/* Welcome */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-primary rounded-2xl p-6 sm:p-8 text-primary-foreground relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 0%, transparent 50%)' }} />
          <div className="relative z-10">
            <p className="text-sm opacity-70">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},</p>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold mt-1">{user.name} 👋</h1>
            <p className="text-sm opacity-80 mt-2 max-w-md">{user.learningPath} • {user.dailyTarget} min/day goal</p>
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-1.5">
                <FlameIcon className="w-5 h-5 text-accent" />
                <span className="font-bold">{user.streak} day streak</span>
              </div>
              <Link to="/daily-practice" className="bg-primary-foreground/20 hover:bg-primary-foreground/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5">
                Continue Learning <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <motion.div variants={item}><StatCard title="Total Marks" value={user.totalMarks} icon={<Trophy className="w-4 h-4 text-accent" />} trend="+25 today" /></motion.div>
          <motion.div variants={item}><StatCard title="Lessons Done" value={user.lessonsCompleted} icon={<BookOpen className="w-4 h-4 text-primary" />} /></motion.div>
          <motion.div variants={item}><StatCard title="Placement Score" value={`${user.placementReadinessScore}%`} icon={<Briefcase className="w-4 h-4 text-primary" />} /></motion.div>
          <motion.div variants={item}><StatCard title="Current Streak" value={`${user.streak} days`} icon={<FlameIcon className="w-4 h-4 text-accent" />} /></motion.div>
        </motion.div>

        {/* Today's Progress */}
        <div className="bg-card rounded-2xl p-5 card-shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold">Today's Progress</h2>
            <Link to="/daily-practice" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
              Start Practice <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <ProgressBar value={dailyProgress.tasksCompleted} max={dailyProgress.totalTasks} label={`${dailyProgress.tasksCompleted}/${dailyProgress.totalTasks} tasks`} />
          <div className="flex gap-4 mt-4">
            <div className="flex-1 bg-secondary rounded-xl p-3 text-center">
              <p className="text-lg font-bold">{dailyProgress.marksEarned}</p>
              <p className="text-xs text-muted-foreground">Marks earned</p>
            </div>
            <div className="flex-1 bg-secondary rounded-xl p-3 text-center">
              <p className="text-lg font-bold">{dailyProgress.totalTasks - dailyProgress.tasksCompleted}</p>
              <p className="text-xs text-muted-foreground">Remaining</p>
            </div>
          </div>
        </div>

        {/* Scores */}
        <div className="bg-card rounded-2xl p-5 card-shadow">
          <h2 className="font-display text-lg font-bold mb-4">Skill Scores</h2>
          <div className="flex justify-around">
            <ProgressRing value={user.grammarScore} label="Grammar" />
            <ProgressRing value={user.vocabularyScore} label="Vocabulary" color="hsl(var(--accent))" />
            <ProgressRing value={user.speakingScore} label="Speaking" color="hsl(var(--success))" />
            <ProgressRing value={user.placementReadinessScore} label="Placement" color="hsl(var(--destructive))" />
          </div>
        </div>

        {/* Recommendations based on assessment scores */}
        <Recommendations />

        {/* Quick Start */}
        <div>
          <h2 className="font-display text-lg font-bold mb-3">Quick Start</h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {quickLinks.map(ql => (
              <Link key={ql.path} to={ql.path} className="bg-card rounded-xl p-4 card-shadow hover:card-shadow-hover transition-all text-center group">
                <span className="text-2xl">{ql.icon}</span>
                <p className="text-xs font-medium mt-2 group-hover:text-primary transition-colors">{ql.label}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Word of the Day */}
        <div className="bg-card rounded-2xl p-5 card-shadow">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-accent" />
            <h2 className="font-display text-lg font-bold">Word of the Day</h2>
          </div>
          <h3 className="text-xl font-bold">{wotd.word}</h3>
          <p className="text-xs font-mono text-muted-foreground">{wotd.pronunciationHint}</p>
          <p className="text-sm text-muted-foreground mt-2">{wotd.meaning}</p>
          <p className="text-sm italic mt-2 text-foreground/70">"{wotd.example}"</p>
          <p className="text-xs mt-2 bg-secondary inline-block px-2 py-1 rounded-md">💼 {wotd.interviewUsage}</p>
        </div>

        {/* Recent Achievements */}
        <div className="bg-card rounded-2xl p-5 card-shadow">
          <h2 className="font-display text-lg font-bold mb-3">Recent Achievements</h2>
          <div className="grid grid-cols-3 gap-3">
            {user.badges.length > 0 ? (
              [{ icon: '🔥', title: '3-Day Streak' }, { icon: '✅', title: '10 Tasks' }, { icon: '💯', title: '100 Marks' }].map(b => (
                <div key={b.title} className="text-center p-3 bg-secondary rounded-xl">
                  <span className="text-2xl">{b.icon}</span>
                  <p className="text-xs font-medium mt-1">{b.title}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground col-span-3">Complete tasks to earn badges!</p>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
