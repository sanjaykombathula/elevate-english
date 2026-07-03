import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { BrandMark } from '@/components/BrandMark';
import {
  Sparkles, MessageSquare, BookOpen, Briefcase, GraduationCap,
  Mic, PenLine, BarChart3, Award, Trophy, Brain, ArrowRight,
  CheckCircle2, Star, Zap, Users, Target, ShieldCheck, Rocket,
  Twitter, Linkedin, Instagram, Github, Menu, X
} from 'lucide-react';

function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const dur = 1400;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setN(Math.floor(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to]);
  return <span ref={ref} className="tabular-nums">{n}{suffix}</span>;
}

const features = [
  { icon: Brain, title: 'AI-Powered Learning', desc: 'Adaptive lessons that evolve with your pace and progress.' },
  { icon: MessageSquare, title: 'Communication Skills', desc: 'Real-world scenarios to sharpen everyday conversation.' },
  { icon: Briefcase, title: 'Interview Preparation', desc: 'Mock interviews and HR question banks for placements.' },
  { icon: BookOpen, title: 'Vocabulary Building', desc: 'Curated word decks with spaced-repetition mastery.' },
  { icon: Mic, title: 'Speaking Practice', desc: 'Voice-based drills with instant AI pronunciation feedback.' },
  { icon: PenLine, title: 'Grammar Improvement', desc: 'Fix common mistakes with contextual, guided practice.' },
  { icon: BarChart3, title: 'Progress Tracking', desc: 'Beautiful dashboards that show exactly where you stand.' },
  { icon: Award, title: 'Certificates', desc: 'Verified PDF certificates with QR authentication.' },
  { icon: Trophy, title: 'Leaderboards', desc: 'Compete with peers across your campus and beyond.' },
  { icon: Target, title: 'Personalized Learning', desc: 'A learning path built around your goals and level.' },
];

const modules = [
  { icon: MessageSquare, title: 'Communication Skills', desc: 'Everyday English, confidence, and clarity.', progress: 60, color: 'from-blue-500 to-cyan-500' },
  { icon: BookOpen, title: 'Vocabulary Builder', desc: 'Grow a placement-ready word bank.', progress: 40, color: 'from-emerald-500 to-teal-500' },
  { icon: Briefcase, title: 'Interview Readiness', desc: 'Ace HR and technical interviews.', progress: 25, color: 'from-orange-500 to-pink-500' },
  { icon: GraduationCap, title: 'Professional English', desc: 'Emails, reports, and workplace tone.', progress: 15, color: 'from-violet-500 to-fuchsia-500' },
];

const whyUs = [
  { icon: ShieldCheck, title: 'Industry-Relevant Curriculum', desc: 'Designed with recruiters and industry mentors.' },
  { icon: Sparkles, title: 'AI Feedback', desc: 'Instant, personalised feedback on every attempt.' },
  { icon: Zap, title: 'Interactive Exercises', desc: 'MCQs, matches, drag & drop, and more.' },
  { icon: Mic, title: 'Voice-Based Assessments', desc: 'Speak, record, and get scored in real time.' },
  { icon: BarChart3, title: 'Progress Analytics', desc: 'Charts, streaks and XP that keep you moving.' },
  { icon: Award, title: 'Certification', desc: 'Shareable certificates for your résumé.' },
];

const testimonials = [
  { name: 'Aarav Sharma', college: 'IIT Kharagpur', review: 'CampEdge helped me clear three placement interviews back-to-back. The mock rounds are gold.' },
  { name: 'Priya Menon', college: 'NIT Trichy', review: 'The vocabulary and speaking modules genuinely rebuilt my confidence in English.' },
  { name: 'Rohit Verma', college: 'BITS Pilani', review: 'It feels like a premium app, not a college tool. Streaks and XP kept me hooked daily.' },
  { name: 'Sneha Iyer', college: 'VIT Vellore', review: 'The AI feedback on my recordings is scary accurate. My fluency has jumped in weeks.' },
];

const stats = [
  { n: 4, s: '', label: 'Learning Modules' },
  { n: 12, s: '', label: 'Interactive Tasks' },
  { n: 100, s: '+', label: 'Practice Questions' },
  { n: 100, s: '%', label: 'AI-Powered' },
];

const navLinks = [
  { href: '#home', label: 'Home' },
  { href: '#modules', label: 'Modules' },
  { href: '#features', label: 'Features' },
  { href: '#about', label: 'About' },
  { href: '#contact', label: 'Contact' },
];

export default function Landing() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen-safe bg-background text-foreground antialiased">
      {/* NAV */}
      <header className="sticky top-0 z-50 glass border-b border-border/60">
        <div className="container flex items-center justify-between h-16">
          <BrandMark />
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((l) => (
              <a key={l.href} href={l.href} className="px-3 py-2 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                {l.label}
              </a>
            ))}
          </nav>
          <div className="hidden md:flex items-center gap-2">
            <Link to="/dashboard" className="px-4 py-2 rounded-full text-sm font-semibold text-foreground hover:bg-secondary transition-all">
              Dashboard
            </Link>
            <Link to="/dashboard" className="px-4 py-2 rounded-full text-sm font-semibold text-primary-foreground bg-primary hover:bg-[hsl(var(--primary-hover))] shadow-glow hover:scale-[1.03] transition-all">
              Start Learning
            </Link>
          </div>
          <button aria-label="Menu" onClick={() => setOpen(!open)} className="md:hidden p-2 rounded-lg hover:bg-secondary">
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {open && (
          <div className="md:hidden border-t bg-card">
            <div className="container py-3 flex flex-col gap-1">
              {navLinks.map((l) => (
                <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-secondary">{l.label}</a>
              ))}
              <Link to="/dashboard" className="mt-2 px-4 py-2.5 rounded-full text-center text-sm font-semibold text-primary-foreground bg-primary">
                Start Learning
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* HERO */}
      <section id="home" className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-40 -right-32 w-[520px] h-[520px] rounded-full bg-brand-gradient opacity-20 blur-3xl" />
          <div className="absolute -bottom-40 -left-32 w-[520px] h-[520px] rounded-full bg-[hsl(var(--accent))]/20 blur-3xl" />
        </div>
        <div className="container py-20 lg:py-28 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-soft text-primary text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5" /> AI-Powered EdTech for Campuses
            </div>
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight text-balance">
              CampEdge <span className="text-brand-gradient">Learning</span>
            </h1>
            <p className="mt-4 text-xl md:text-2xl font-medium text-foreground/80">
              The Edge Every Campus Needs
            </p>
            <p className="mt-6 max-w-xl text-base md:text-lg text-muted-foreground text-pretty">
              Empowering students with communication skills, interview readiness, English proficiency, and career-focused learning through an AI-powered platform.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link to="/dashboard" className="group inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-base font-semibold bg-primary text-primary-foreground shadow-glow hover:bg-[hsl(var(--primary-hover))] hover:scale-[1.03] transition-all">
                Start Learning <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <a href="#modules" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-base font-semibold border border-border bg-card hover:bg-secondary transition-all">
                Explore Modules
              </a>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-[hsl(var(--accent))]" /> No credit card</div>
              <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-[hsl(var(--accent))]" /> Free for students</div>
            </div>
          </motion.div>

          {/* Hero illustration — abstract, layered cards */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="relative h-[420px] lg:h-[520px]"
          >
            <motion.div
              animate={{ y: [0, -14, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 rounded-[2rem] bg-brand-gradient opacity-90 shadow-glow"
            />
            <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_50%)]" />

            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="absolute top-8 left-8 right-8 bg-white/95 dark:bg-card rounded-2xl p-4 shadow-2xl backdrop-blur"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><Brain className="w-5 h-5" /></div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">AI Tutor</p>
                  <p className="text-sm font-semibold">Great pronunciation — 94% clarity!</p>
                </div>
                <div className="text-[hsl(var(--accent))]"><CheckCircle2 className="w-5 h-5" /></div>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute bottom-10 left-6 bg-white/95 dark:bg-card rounded-2xl p-4 shadow-2xl w-56"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-muted-foreground">Weekly Progress</p>
                <Zap className="w-4 h-4 text-warning" />
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div className="h-full w-4/5 rounded-full bg-brand-gradient" />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">1,240 XP this week</p>
            </motion.div>

            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute bottom-24 right-4 bg-white/95 dark:bg-card rounded-2xl p-4 shadow-2xl flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-[hsl(var(--accent))]/15 text-[hsl(var(--accent))] flex items-center justify-center"><Trophy className="w-5 h-5" /></div>
              <div>
                <p className="text-sm font-semibold">Rank #12</p>
                <p className="text-xs text-muted-foreground">Campus Leaderboard</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* STATS */}
      <section className="border-y bg-card/50">
        <div className="container py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-display text-4xl md:text-5xl font-bold text-brand-gradient">
                <Counter to={s.n} suffix={s.s} />
              </div>
              <p className="mt-2 text-sm text-muted-foreground font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="container py-24">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider">Features</p>
          <h2 className="mt-2 font-display text-4xl md:text-5xl font-bold text-balance">Everything a student needs to shine</h2>
          <p className="mt-4 text-muted-foreground text-lg">Modern learning tools, wrapped in a delightful experience.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: i * 0.03 }}
              className="group bg-card rounded-2xl p-6 border border-border/60 card-shadow hover:card-shadow-hover hover:-translate-y-1 transition-[box-shadow,transform] duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-brand-gradient text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-base">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* MODULES */}
      <section id="modules" className="bg-secondary/30 border-y">
        <div className="container py-24">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider">Learning Modules</p>
            <h2 className="mt-2 font-display text-4xl md:text-5xl font-bold text-balance">Four paths to a stronger career</h2>
            <p className="mt-4 text-muted-foreground text-lg">Crafted for campus placements and beyond.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {modules.map((m, i) => (
              <motion.div
                key={m.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="bg-card rounded-2xl p-6 border border-border/60 card-shadow hover:card-shadow-hover hover:-translate-y-1 transition-[box-shadow,transform] duration-300 flex flex-col"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${m.color} text-white flex items-center justify-center mb-4 shadow-lg`}>
                  <m.icon className="w-6 h-6" />
                </div>
                <h3 className="font-display text-xl font-semibold">{m.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground flex-1">{m.desc}</p>
                <div className="mt-5">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-semibold tabular-nums">{m.progress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${m.progress}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, ease: 'easeOut', delay: 0.2 + i * 0.08 }}
                      className={`h-full bg-gradient-to-r ${m.color}`}
                    />
                  </div>
                </div>
                <Link to="/dashboard" className="mt-5 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-full text-sm font-semibold bg-secondary hover:bg-primary hover:text-primary-foreground transition-colors">
                  Explore <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY US */}
      <section id="about" className="container py-24">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider">Why CampEdge</p>
          <h2 className="mt-2 font-display text-4xl md:text-5xl font-bold text-balance">Built for real outcomes, not just lessons</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {whyUs.map((w, i) => (
            <motion.div
              key={w.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="relative bg-card rounded-2xl p-7 border border-border/60 card-shadow hover:card-shadow-hover transition-[box-shadow] duration-300"
            >
              <div className="w-12 h-12 rounded-2xl bg-primary-soft text-primary flex items-center justify-center mb-4">
                <w.icon className="w-5 h-5" />
              </div>
              <h3 className="font-display text-lg font-semibold">{w.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{w.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-secondary/30 border-y">
        <div className="container py-24">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider">Testimonials</p>
            <h2 className="mt-2 font-display text-4xl md:text-5xl font-bold text-balance">Loved by students across India</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="bg-card rounded-2xl p-6 border border-border/60 card-shadow flex flex-col"
              >
                <div className="flex gap-0.5 text-warning mb-3">
                  {Array.from({ length: 5 }).map((_, k) => <Star key={k} className="w-4 h-4 fill-current" />)}
                </div>
                <p className="text-sm text-foreground/90 flex-1">"{t.review}"</p>
                <div className="mt-5 flex items-center gap-3 pt-4 border-t border-border/60">
                  <div className="w-10 h-10 rounded-full bg-brand-gradient text-white flex items-center justify-center font-bold">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold leading-tight">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.college}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-24">
        <div className="relative overflow-hidden rounded-[2rem] bg-brand-gradient p-10 md:p-16 text-white shadow-glow">
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
          <div className="relative max-w-2xl">
            <Rocket className="w-10 h-10 mb-4" />
            <h2 className="font-display text-3xl md:text-5xl font-bold text-balance">Ready to get the edge?</h2>
            <p className="mt-4 text-white/90 text-lg">Join thousands of students building the skills that get them hired.</p>
            <Link to="/dashboard" className="mt-8 inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-base font-semibold bg-white text-primary hover:scale-[1.03] transition-transform">
              Start Learning Free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="contact" className="border-t bg-card">
        <div className="container py-14 grid md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <BrandMark />
            <p className="mt-4 text-sm text-muted-foreground max-w-sm">The Edge Every Campus Needs. AI-powered upskilling for the next generation of professionals.</p>
            <div className="mt-5 flex items-center gap-2">
              {[Twitter, Linkedin, Instagram, Github].map((I, i) => (
                <a key={i} href="#" aria-label="Social link" className="w-9 h-9 rounded-full bg-secondary hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors">
                  <I className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
          <div>
            <p className="font-semibold text-sm mb-3">Quick Links</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#home" className="hover:text-foreground">Home</a></li>
              <li><a href="#modules" className="hover:text-foreground">Modules</a></li>
              <li><a href="#features" className="hover:text-foreground">Features</a></li>
              <li><Link to="/dashboard" className="hover:text-foreground">Dashboard</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-sm mb-3">Contact</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>hello@campedge.io</li>
              <li>Bengaluru, India</li>
              <li><Users className="w-4 h-4 inline mr-1" /> For Colleges & Institutions</li>
            </ul>
          </div>
        </div>
        <div className="border-t">
          <div className="container py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} CampEdge Learning. All rights reserved.</p>
            <p>Made with care for students everywhere.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
