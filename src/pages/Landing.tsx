import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageSquare, BookOpen, Briefcase, GraduationCap, ArrowRight } from 'lucide-react';
import { BrandMark } from '@/components/BrandMark';

const modules = [
  { icon: MessageSquare, title: 'Communication Skills', desc: 'Speak clearly, confidently, and professionally.' },
  { icon: BookOpen, title: 'Vocabulary Builder', desc: 'Expand your active vocabulary every day.' },
  { icon: Briefcase, title: 'Interview Readiness', desc: 'Practice real questions and land the role.' },
  { icon: GraduationCap, title: 'Professional English', desc: 'Master workplace English for a global career.' },
];

const navLinks = [
  { label: 'Home', href: '#home' },
  { label: 'Modules', href: '#modules' },
  { label: 'About', href: '#about' },
];

export default function Landing() {
  return (
    <div className="min-h-screen-safe bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-50 glass border-b border-border/60">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" aria-label="CampEdge Learning home"><BrandMark /></Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            {navLinks.map((l) => (
              <a key={l.label} href={l.href} className="hover:text-foreground transition-colors">{l.label}</a>
            ))}
          </nav>
          <Link
            to="/dashboard"
            className="px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all"
          >
            Login
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section id="home" className="container py-20 md:py-28">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="font-display text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.05]">
              CampEdge Learning
            </h1>
            <p className="mt-4 text-xl md:text-2xl font-medium text-primary">
              The Edge Every Campus Needs
            </p>
            <p className="mt-6 text-muted-foreground text-base md:text-lg max-w-xl leading-relaxed">
              Empowering students with communication skills, English proficiency, interview readiness, and
              career-focused learning through an interactive digital platform.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/dashboard"
                className="px-6 py-3 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all inline-flex items-center gap-2"
              >
                Login <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#modules"
                className="px-6 py-3 rounded-full border border-border bg-background text-sm font-semibold hover:bg-secondary/60 transition-all"
              >
                Explore Modules
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative"
          >
            <div className="aspect-square max-w-md mx-auto rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-border/60 p-8 flex items-center justify-center shadow-soft">
              <div className="relative w-full h-full">
                <div className="absolute inset-0 flex items-center justify-center">
                  <GraduationCap className="w-40 h-40 text-primary/30" strokeWidth={1.2} />
                </div>
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute top-4 left-4 bg-card border rounded-2xl p-3 shadow-soft flex items-center gap-2"
                >
                  <MessageSquare className="w-5 h-5 text-primary" />
                  <span className="text-xs font-semibold">Communication</span>
                </motion.div>
                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute bottom-6 right-2 bg-card border rounded-2xl p-3 shadow-soft flex items-center gap-2"
                >
                  <Briefcase className="w-5 h-5 text-primary" />
                  <span className="text-xs font-semibold">Interview Ready</span>
                </motion.div>
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute bottom-24 left-0 bg-card border rounded-2xl p-3 shadow-soft flex items-center gap-2"
                >
                  <BookOpen className="w-5 h-5 text-primary" />
                  <span className="text-xs font-semibold">Vocabulary</span>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Modules */}
      <section id="modules" className="container py-16 md:py-24 border-t border-border/60">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Explore our modules</h2>
          <p className="mt-3 text-muted-foreground">
            Four focused learning tracks designed to make every student career-ready.
          </p>
        </div>
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {modules.map((m, i) => (
            <motion.div
              key={m.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.05 }}
              className="group rounded-2xl border bg-card p-6 shadow-soft hover:shadow-glow hover:-translate-y-1 transition-all"
            >
              <div className="w-11 h-11 rounded-xl bg-primary-soft text-primary flex items-center justify-center">
                <m.icon className="w-5 h-5" />
              </div>
              <h3 className="mt-4 font-semibold text-base">{m.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{m.desc}</p>
              <Link
                to="/dashboard"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary group-hover:gap-2 transition-all"
              >
                Explore <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* About */}
      <section id="about" className="container py-16 md:py-24 border-t border-border/60">
        <div className="max-w-3xl">
          <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight">About CampEdge</h2>
          <p className="mt-4 text-muted-foreground text-base md:text-lg leading-relaxed">
            CampEdge Learning is a modern digital platform built for colleges and universities to prepare students
            for a competitive world. We combine practical communication training, interview practice, and
            professional English into a single, elegant learning experience.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60">
        <div className="container py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <BrandMark />
            <p className="mt-3 text-sm text-muted-foreground">© 2026 CampEdge Learning</p>
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
