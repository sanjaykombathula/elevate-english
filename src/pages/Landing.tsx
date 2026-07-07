import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageSquare, BookOpen, Briefcase, GraduationCap, ArrowRight } from 'lucide-react';
import { BrandMark } from '@/components/BrandMark';

const modules = [
  { icon: MessageSquare, title: 'Communication Skills', desc: 'Speak clearly and confidently in every setting.' },
  { icon: BookOpen, title: 'Vocabulary Builder', desc: 'Expand your active vocabulary every day.' },
  { icon: Briefcase, title: 'Interview Readiness', desc: 'Practice real questions and land the role.' },
  { icon: GraduationCap, title: 'Professional English', desc: 'Master workplace English for a global career.' },
];

const navLinks = [
  { label: 'Home', href: '#home' },
  { label: 'Modules', href: '#modules' },
];

export default function Landing() {
  return (
    <div className="min-h-screen-safe bg-background text-foreground">
      <header className="sticky top-0 z-50 bg-card/90 backdrop-blur border-b border-border">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" aria-label="CampEdge Learning home"><BrandMark /></Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            {navLinks.map((l) => (
              <a key={l.label} href={l.href} className="hover:text-foreground transition-colors">{l.label}</a>
            ))}
          </nav>
          <Link
            to="/dashboard"
            className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-colors"
          >
            Login
          </Link>
        </div>
      </header>

      <section id="home" className="container py-20 md:py-28">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-3xl"
        >
          <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight leading-[1.05]">
            CampEdge Learning
          </h1>
          <p className="mt-4 text-xl md:text-2xl font-medium text-primary">
            The Edge Every Campus Needs
          </p>
          <p className="mt-6 text-muted-foreground text-base md:text-lg max-w-2xl leading-relaxed">
            A simple platform to help students improve communication, English, interview skills,
            and workplace readiness through structured learning.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/dashboard"
              className="px-6 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-colors inline-flex items-center gap-2"
            >
              Login <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#modules"
              className="px-6 py-3 rounded-lg border border-border bg-card text-sm font-semibold text-secondary-foreground hover:bg-secondary transition-colors"
            >
              Explore Modules
            </a>
          </div>
        </motion.div>
      </section>

      <section id="modules" className="container pb-20 md:pb-28">
        <div className="max-w-2xl mb-10">
          <h2 className="font-display text-2xl md:text-3xl font-semibold tracking-tight">Learning modules</h2>
          <p className="mt-2 text-muted-foreground">Four focused tracks to make every student career-ready.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {modules.map((m, i) => (
            <motion.div
              key={m.title}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
              className="rounded-xl border border-border bg-card p-6 card-shadow hover:card-shadow-hover transition-[box-shadow]"
            >
              <div className="w-10 h-10 rounded-lg bg-primary-soft text-primary flex items-center justify-center">
                <m.icon className="w-5 h-5" />
              </div>
              <h3 className="mt-4 font-semibold text-base">{m.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{m.desc}</p>
              <Link
                to="/dashboard"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:gap-2 transition-all"
              >
                Explore <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border bg-card">
        <div className="container py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <p className="font-display font-semibold text-sm">CampEdge Learning</p>
            <p className="mt-1 text-xs text-muted-foreground">© 2026 CampEdge Learning</p>
          </div>
          <nav className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Contact</a>
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
