import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { useApp } from '@/lib/app-context';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, GraduationCap, Building, Calendar, Target, BookOpen, Trophy, LogOut, Edit3, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { user, logout, completeOnboarding } = useApp();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user?.name || '', college: user?.college || '', branch: user?.branch || '', year: user?.year || '' });

  if (!user) return null;

  const handleSave = () => {
    completeOnboarding(form);
    setEditing(false);
    toast.success('Profile updated!');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <AppLayout>
      <div className="container py-6 max-w-2xl space-y-6">
        {/* Profile Header */}
        <div className="bg-card rounded-2xl p-6 card-shadow text-center">
          <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-3xl font-bold mx-auto">
            {user.name.charAt(0)}
          </div>
          <h1 className="font-display text-2xl font-bold mt-4">{user.name}</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <div className="flex justify-center gap-4 mt-4">
            <div className="text-center">
              <p className="text-lg font-bold">{user.totalMarks}</p>
              <p className="text-xs text-muted-foreground">Points</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold">{user.streak}</p>
              <p className="text-xs text-muted-foreground">Streak</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold">{user.lessonsCompleted}</p>
              <p className="text-xs text-muted-foreground">Lessons</p>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="bg-card rounded-2xl p-5 card-shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold">Details</h2>
            <button onClick={() => editing ? handleSave() : setEditing(true)}
              className="flex items-center gap-1.5 text-sm text-primary font-medium hover:underline">
              {editing ? <><Save className="w-4 h-4" /> Save</> : <><Edit3 className="w-4 h-4" /> Edit</>}
            </button>
          </div>
          <div className="space-y-4">
            {editing ? (
              <>
                {[{ label: 'Name', key: 'name' as const }, { label: 'College', key: 'college' as const }, { label: 'Branch', key: 'branch' as const }, { label: 'Year', key: 'year' as const }].map(f => (
                  <div key={f.key}>
                    <label className="text-xs text-muted-foreground">{f.label}</label>
                    <input value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                      className="w-full p-2.5 rounded-lg border bg-background text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                ))}
              </>
            ) : (
              <>
                {[
                  { icon: <Building className="w-4 h-4" />, label: 'College', value: user.college },
                  { icon: <GraduationCap className="w-4 h-4" />, label: 'Branch', value: user.branch },
                  { icon: <Calendar className="w-4 h-4" />, label: 'Year', value: `${user.year} Year` },
                  { icon: <Target className="w-4 h-4" />, label: 'Level', value: user.level },
                  { icon: <BookOpen className="w-4 h-4" />, label: 'Goal', value: user.goal },
                  { icon: <Trophy className="w-4 h-4" />, label: 'Path', value: user.learningPath },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-secondary text-muted-foreground">{item.icon}</div>
                    <div>
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <p className="text-sm font-medium">{item.value}</p>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Learning Preferences */}
        <div className="bg-card rounded-2xl p-5 card-shadow">
          <h2 className="font-display text-lg font-bold mb-4">Learning Preferences</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-secondary rounded-xl">
              <span className="text-sm">Daily Target</span>
              <span className="text-sm font-bold">{user.dailyTarget} min/day</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-secondary rounded-xl">
              <span className="text-sm">English Level</span>
              <span className="text-sm font-bold">{user.level}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-secondary rounded-xl">
              <span className="text-sm">Member Since</span>
              <span className="text-sm font-bold">{new Date(user.joinedDate).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="bg-card rounded-2xl p-5 card-shadow">
          <h2 className="font-display text-lg font-bold mb-3">Badges Earned</h2>
          {user.badges.length > 0 ? (
            <div className="flex gap-3 flex-wrap">
              {user.badges.map(b => (
                <div key={b} className="bg-accent/10 px-3 py-2 rounded-xl text-xs font-medium">{b}</div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Complete tasks to earn badges!</p>
          )}
        </div>

        <button onClick={handleLogout}
          className="w-full py-3 rounded-xl border border-destructive text-destructive text-sm font-semibold hover:bg-destructive/10 transition-colors flex items-center justify-center gap-2">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>
    </AppLayout>
  );
}
