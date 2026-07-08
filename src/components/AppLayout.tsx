import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '@/lib/app-context';
import { useTheme } from '@/lib/theme';
import { BrandMark } from '@/components/BrandMark';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, BookOpen, User, Settings, LogOut, Menu, X,
  ShieldCheck, Users, ClipboardList, Megaphone, Sun, Moon, GraduationCap, Library,
} from 'lucide-react';

const studentNav = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/modules', label: 'Modules', icon: BookOpen },
  { path: '/courses', label: 'My Courses', icon: GraduationCap },
  { path: '/profile', label: 'Profile', icon: User },
  { path: '/settings', label: 'Settings', icon: Settings },
];

const adminNav = [
  { path: '/admin/dashboard', label: 'Admin', icon: ShieldCheck },
  { path: '/admin', label: 'Students', icon: Users },
  { path: '/admin/courses', label: 'LMS', icon: Library },
  { path: '/admin/questions', label: 'Questions', icon: ClipboardList },
  { path: '/admin/announcements', label: 'Announcements', icon: Megaphone },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isAdmin } = useApp();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const nav = isAdmin ? [...studentNav, ...adminNav] : studentNav;
  const isActive = (path: string) =>
    location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path));

  const NavList = ({ onClick }: { onClick?: () => void }) => (
    <nav className="flex flex-col gap-1">
      {nav.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          onClick={onClick}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            isActive(item.path)
              ? 'bg-primary-soft text-primary'
              : 'text-secondary-foreground hover:bg-secondary hover:text-foreground'
          }`}
        >
          <item.icon className="w-4 h-4" />
          {item.label}
        </Link>
      ))}
    </nav>
  );

  const isDark = theme === 'dark';
  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark');
  const ThemeIcon = isDark ? Sun : Moon;

  return (
    <div className="min-h-screen-safe bg-background">
      <header className="sticky top-0 z-50 bg-card border-b border-border">
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
          <div className="flex items-center gap-2">
            <button
              aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-secondary min-h-10 min-w-10 flex items-center justify-center text-muted-foreground"
            >
              <ThemeIcon className="w-4 h-4" />
            </button>
            {user && (
              <Link
                to="/profile"
                aria-label="Profile"
                className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold"
              >
                {user.name?.charAt(0)?.toUpperCase() || 'S'}
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="hidden lg:flex flex-col w-60 min-h-[calc(100dvh-4rem)] border-r border-border bg-card p-4 sticky top-16">
          <NavList />
          <div className="mt-auto pt-4 border-t border-border">
            <button
              onClick={() => { logout(); navigate('/'); }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors w-full"
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
                className="fixed inset-0 bg-foreground/30 z-40 lg:hidden"
                onClick={() => setSidebarOpen(false)}
              />
              <motion.aside
                initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }}
                transition={{ type: 'tween', duration: 0.2 }}
                className="fixed left-0 top-16 bottom-0 w-64 bg-card border-r border-border z-50 p-4 flex flex-col lg:hidden overflow-y-auto"
              >
                <NavList onClick={() => setSidebarOpen(false)} />
                <button
                  onClick={() => { logout(); navigate('/'); setSidebarOpen(false); }}
                  className="mt-4 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground w-full"
                >
                  <LogOut className="w-4 h-4" /> Log out
                </button>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        <main className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
