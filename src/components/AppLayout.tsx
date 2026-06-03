import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '@/lib/app-context';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Home, BarChart3, User, Mic, Briefcase, GraduationCap, Menu, X, FlameIcon, Trophy, LogOut, ShieldCheck, Library, BookMarked } from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'Home', icon: Home },
  { path: '/courses', label: 'Courses', icon: Library },
  { path: '/daily-practice', label: 'Daily', icon: BookOpen },
  { path: '/grammar', label: 'Grammar', icon: GraduationCap },
  { path: '/vocabulary', label: 'Vocab', icon: BookOpen },
  { path: '/speaking', label: 'Speaking', icon: Mic },
  { path: '/placement', label: 'Placement', icon: Briefcase },
  { path: '/mock-test', label: 'Mock Test', icon: Trophy },
  { path: '/progress', label: 'Progress', icon: BarChart3 },
  { path: '/profile', label: 'Profile', icon: User },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isAdmin } = useApp();
  const allNav = isAdmin ? [...navItems, { path: '/admin', label: 'Admin', icon: ShieldCheck }, { path: '/admin/courses', label: 'LMS', icon: BookMarked }] : navItems;
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const mobileNav = navItems.slice(0, 5);

  return (
    <div className="min-h-screen bg-background">
      {/* Top Nav */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 rounded-md hover:bg-secondary transition-colors">
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-lg hidden sm:block">MentorsPlace</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <>
                <div className="flex items-center gap-1.5 bg-accent/20 px-3 py-1.5 rounded-full">
                  <FlameIcon className="w-4 h-4 text-accent" />
                  <span className="text-sm font-semibold">{user.streak}</span>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 bg-secondary px-3 py-1.5 rounded-full">
                  <Trophy className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold">{user.totalMarks} pts</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                  {user.name.charAt(0)}
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-60 min-h-[calc(100vh-4rem)] border-r bg-card p-4 gap-1 sticky top-16">
          {allNav.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}>
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
          <div className="mt-auto">
            <button onClick={() => { logout(); navigate('/'); }} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all w-full">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </aside>

        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-foreground/20 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
              <motion.aside initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed left-0 top-16 bottom-0 w-60 bg-card border-r z-50 p-4 flex flex-col gap-1 lg:hidden">
                {allNav.map(item => {
                  const active = location.pathname === item.path;
                  return (
                    <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 pb-20 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t z-40 lg:hidden">
        <div className="flex justify-around py-2">
          {mobileNav.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${active ? 'text-primary' : 'text-muted-foreground'}`}>
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
