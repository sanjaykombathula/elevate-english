import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '@/lib/app-context';
import { useTheme } from '@/lib/theme';
import { BrandMark } from '@/components/BrandMark';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, BookOpen, BarChart3, Trophy, Award, User, Settings, LogOut, Menu, X,
  Flame, Zap, ShieldCheck, Users, ClipboardList, Megaphone, Sun, Moon, Monitor, Bell
} from 'lucide-react';

const studentNav = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/modules', label: 'Modules', icon: BookOpen },
  { path: '/progress', label: 'Progress', icon: BarChart3 },
  { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { path: '/certificates', label: 'Certificates', icon: Award },
  { path: '/profile', label: 'Profile', icon: User },
  { path: '/settings', label: 'Settings', icon: Settings },
];

const adminNav = [
  { path: '/admin/dashboard', label: 'Admin Overview', icon: ShieldCheck },
  { path: '/admin', label: 'Students', icon: Users },
  { path: '/admin/questions', label: 'Questions', icon: ClipboardList },
  { path: '/admin/announcements', label: 'Announcements', icon: Megaphone },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isAdmin } = useApp();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState<{ xp: number; streak: number }>({ xp: 0, streak: 0 });
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    const load = async () => {
      const [{ data: s }, { count }] = await Promise.all([
        supabase.from('user_stats').select('xp_total, streak_current').eq('user_id', user.id).maybeSingle(),
        supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', user.id).is('read_at', null),
      ]);
      if (!mounted) return;
      setStats({ xp: s?.xp_total || 0, streak: s?.streak_current || 0 });
      setNotifCount(count || 0);
    };
    load();
    const ch = supabase
      .channel(`layout-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_stats', filter: `user_id=eq.${user.id}` }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, load)
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(ch); };
  }, [user?.id]);

  const nav = isAdmin ? [...studentNav, ...adminNav] : studentNav;
  const bottomNav = studentNav.slice(0, 5);

  const NavList = ({ onClick }: { onClick?: () => void }) => (
    <nav className="flex flex-col gap-0.5">
      {nav.map((item) => {
        const active = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={onClick}
            className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              active
                ? 'bg-primary text-primary-foreground shadow-glow'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const cycleTheme = () => setTheme(theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light');
  const ThemeIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;

  return (
    <div className="min-h-screen-safe bg-background">
      <header className="sticky top-0 z-50 glass border-b border-border/60">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <button
              aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-secondary min-h-11 min-w-11 flex items-center justify-center"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Link to="/dashboard" aria-label="CampEdge Learning home">
              <BrandMark />
            </Link>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {user && (
              <>
                <div className="hidden sm:flex items-center gap-1.5 bg-warning/10 text-warning px-3 py-1.5 rounded-full" title="Streak">
                  <Flame className="w-4 h-4" />
                  <span className="text-sm font-semibold tabular-nums">{stats.streak}</span>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 bg-primary-soft text-primary px-3 py-1.5 rounded-full" title="XP">
                  <Zap className="w-4 h-4" />
                  <span className="text-sm font-semibold tabular-nums">{stats.xp}</span>
                </div>
                <button aria-label="Notifications" className="relative p-2 rounded-lg hover:bg-secondary min-h-11 min-w-11 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-muted-foreground" />
                  {notifCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                      {notifCount > 9 ? '9+' : notifCount}
                    </span>
                  )}
                </button>
              </>
            )}
            <button
              aria-label={`Theme: ${theme}. Click to change.`}
              onClick={cycleTheme}
              className="p-2 rounded-lg hover:bg-secondary min-h-11 min-w-11 flex items-center justify-center"
            >
              <ThemeIcon className="w-5 h-5 text-muted-foreground" />
            </button>
            {user && (
              <Link to="/profile" aria-label="Profile" className="w-9 h-9 rounded-full bg-brand-gradient flex items-center justify-center text-white text-sm font-bold">
                {user.name?.charAt(0)?.toUpperCase() || 'S'}
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="hidden lg:flex flex-col w-64 min-h-[calc(100dvh-4rem)] border-r bg-card p-4 sticky top-16">
          <div className="mb-4 p-3 rounded-2xl bg-brand-gradient text-white">
            <p className="text-xs uppercase tracking-wider opacity-80">Signed in</p>
            <p className="font-semibold truncate">{user?.name || 'Student'}</p>
            <p className="text-xs opacity-80 truncate">{user?.email}</p>
          </div>
          <NavList />
          <div className="mt-auto pt-4 border-t">
            <button
              onClick={() => { logout(); navigate('/'); }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all w-full"
            >
              <LogOut className="w-4 h-4" /> Log out
            </button>
          </div>
        </aside>

        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-foreground/40 z-40 lg:hidden"
                onClick={() => setSidebarOpen(false)}
              />
              <motion.aside
                initial={{ x: -320 }} animate={{ x: 0 }} exit={{ x: -320 }}
                transition={{ type: 'spring', damping: 26, stiffness: 300 }}
                className="fixed left-0 top-16 bottom-0 w-72 bg-card border-r z-50 p-4 flex flex-col lg:hidden overflow-y-auto"
              >
                <NavList onClick={() => setSidebarOpen(false)} />
                <button
                  onClick={() => { logout(); navigate('/'); }}
                  className="mt-4 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive w-full"
                >
                  <LogOut className="w-4 h-4" /> Log out
                </button>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        <main className="flex-1 pb-24 lg:pb-10 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <nav aria-label="Primary" className="fixed bottom-0 left-0 right-0 glass border-t z-40 lg:hidden">
        <div className="flex justify-around py-2 px-2">
          {bottomNav.map((item) => {
            const active = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl min-h-11 min-w-11 transition-colors ${
                  active ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
