import React from 'react';
import AppLayout from '@/components/AppLayout';
import { useApp } from '@/lib/app-context';
import { ProgressRing, ProgressBar, StatCard } from '@/components/ui-components';
import { motion } from 'framer-motion';
import { Trophy, BookOpen, FlameIcon, Target, TrendingUp, Brain, Mic, Briefcase } from 'lucide-react';

export default function ProgressPage() {
  const { user, achievements, dailyProgress } = useApp();
  if (!user) return null;

  const weekData = [
    { day: 'Mon', score: 72 }, { day: 'Tue', score: 85 }, { day: 'Wed', score: 60 },
    { day: 'Thu', score: 90 }, { day: 'Fri', score: 78 }, { day: 'Sat', score: 45 }, { day: 'Sun', score: 88 },
  ];

  return (
    <AppLayout>
      <div className="container py-6 space-y-6">
        <h1 className="font-display text-2xl font-bold">Progress Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard title="Total Marks" value={user.totalMarks} icon={<Trophy className="w-4 h-4 text-accent" />} />
          <StatCard title="Lessons Done" value={user.lessonsCompleted} icon={<BookOpen className="w-4 h-4 text-primary" />} />
          <StatCard title="Current Streak" value={`${user.streak} days`} icon={<FlameIcon className="w-4 h-4 text-accent" />} />
          <StatCard title="Accuracy" value="76%" icon={<Target className="w-4 h-4 text-success" />} />
        </div>

        {/* Skill Breakdown */}
        <div className="bg-card rounded-2xl p-5 card-shadow">
          <h2 className="font-display text-lg font-bold mb-4">Skill Breakdown</h2>
          <div className="space-y-4">
            <ProgressBar value={user.grammarScore} label="Grammar" />
            <ProgressBar value={user.vocabularyScore} label="Vocabulary" />
            <ProgressBar value={user.speakingScore} label="Speaking" />
            <ProgressBar value={user.placementReadinessScore} label="Placement Communication" />
          </div>
        </div>

        {/* Weekly Chart */}
        <div className="bg-card rounded-2xl p-5 card-shadow">
          <h2 className="font-display text-lg font-bold mb-4">Weekly Performance</h2>
          <div className="flex items-end gap-2 h-32">
            {weekData.map(d => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                <motion.div
                  className="w-full bg-primary/20 rounded-t-md relative overflow-hidden"
                  style={{ height: `${d.score}%` }}
                  initial={{ height: 0 }}
                  animate={{ height: `${d.score}%` }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="absolute inset-0 bg-primary rounded-t-md" />
                </motion.div>
                <span className="text-[10px] text-muted-foreground">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Insights */}
        <div className="bg-card rounded-2xl p-5 card-shadow">
          <h2 className="font-display text-lg font-bold mb-4">Insights</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="bg-destructive/10 rounded-xl p-4">
              <p className="text-xs font-semibold text-destructive">Weakest Area</p>
              <p className="font-bold mt-1">Speaking</p>
              <p className="text-xs text-muted-foreground mt-1">Practice more speaking prompts</p>
            </div>
            <div className="bg-success/10 rounded-xl p-4">
              <p className="text-xs font-semibold text-success">Strongest Area</p>
              <p className="font-bold mt-1">Grammar</p>
              <p className="text-xs text-muted-foreground mt-1">Keep up the great work!</p>
            </div>
            <div className="bg-accent/10 rounded-xl p-4">
              <p className="text-xs font-semibold text-accent-foreground">Next Focus</p>
              <p className="font-bold mt-1">Vocabulary</p>
              <p className="text-xs text-muted-foreground mt-1">Learn 5 new words today</p>
            </div>
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-card rounded-2xl p-5 card-shadow">
          <h2 className="font-display text-lg font-bold mb-4">Achievements</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {achievements.map(a => (
              <div key={a.id} className={`rounded-xl p-4 text-center transition-all ${a.unlocked ? 'bg-accent/10' : 'bg-secondary opacity-60'}`}>
                <span className="text-2xl">{a.icon}</span>
                <p className="text-xs font-semibold mt-2">{a.title}</p>
                {!a.unlocked && (
                  <div className="mt-2">
                    <div className="h-1 bg-border rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${(a.progress / a.target) * 100}%` }} />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">{a.progress}/{a.target}</p>
                  </div>
                )}
                {a.unlocked && <p className="text-[10px] text-success mt-1 font-medium">Unlocked!</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
