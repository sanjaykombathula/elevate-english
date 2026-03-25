import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { speakingPrompts } from '@/lib/dummy-data';
import { useApp } from '@/lib/app-context';
import { motion } from 'framer-motion';
import { Mic, Timer, Send, ArrowRight, Star, RotateCcw } from 'lucide-react';

export default function SpeakingPage() {
  const { completeDailyTask } = useApp();
  const [activePrompt, setActivePrompt] = useState<string | null>(null);
  const [response, setResponse] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<{ clarity: number; confidence: number; structure: number; vocabulary: number } | null>(null);
  const [filter, setFilter] = useState('All');

  const categories = ['All', ...Array.from(new Set(speakingPrompts.map(p => p.category)))];
  const filtered = filter === 'All' ? speakingPrompts : speakingPrompts.filter(p => p.category === filter);

  useEffect(() => {
    if (timerActive && timeLeft > 0) {
      const t = setTimeout(() => setTimeLeft(tl => tl - 1), 1000);
      return () => clearTimeout(t);
    }
    if (timeLeft === 0 && timerActive) setTimerActive(false);
  }, [timerActive, timeLeft]);

  const prompt = speakingPrompts.find(p => p.id === activePrompt);

  const startTimer = () => {
    if (prompt) {
      setTimeLeft(prompt.expectedDuration);
      setTimerActive(true);
    }
  };

  const handleSubmit = () => {
    if (!response.trim() || !prompt) return;
    // Mock scoring
    const words = response.trim().split(/\s+/).length;
    const clarity = Math.min(Math.round(words / 2 + 40), 95);
    const confidence = Math.min(Math.round(words / 3 + 50), 90);
    const structure = response.includes('.') ? Math.min(70 + Math.round(Math.random() * 20), 90) : 55;
    const vocabulary = Math.min(Math.round(words / 1.5 + 30), 85);
    setScore({ clarity, confidence, structure, vocabulary });
    setSubmitted(true);
    const avg = Math.round((clarity + confidence + structure + vocabulary) / 4);
    const marks = Math.round((avg / 100) * prompt.marks);
    completeDailyTask(marks);
  };

  if (activePrompt && prompt) {
    return (
      <AppLayout>
        <div className="container py-6 max-w-2xl">
          <button onClick={() => { setActivePrompt(null); setResponse(''); setSubmitted(false); setScore(null); setTimerActive(false); }}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-4 flex items-center gap-1">
            ← Back to prompts
          </button>

          <div className="bg-card rounded-2xl p-5 sm:p-6 card-shadow">
            <span className="text-xs bg-secondary px-2 py-1 rounded-full font-medium">{prompt.category}</span>
            <h2 className="font-display text-xl font-bold mt-3">{prompt.prompt}</h2>
            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
              <span>{prompt.expectedDuration}s recommended</span>
              <span>{prompt.marks} marks</span>
            </div>

            {/* Tips */}
            <div className="bg-secondary rounded-xl p-4 mt-4">
              <p className="text-xs font-semibold mb-2">💡 Tips</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                {prompt.tips.map((t, i) => <li key={i}>• {t}</li>)}
              </ul>
            </div>

            {!submitted ? (
              <>
                {/* Timer */}
                <div className="flex items-center gap-3 mt-5">
                  <button onClick={startTimer} disabled={timerActive}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-sm font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50">
                    <Timer className="w-4 h-4" /> {timerActive ? `${timeLeft}s` : 'Start Timer'}
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive/10 text-destructive text-sm font-medium">
                    <Mic className="w-4 h-4" /> Record (Coming Soon)
                  </button>
                </div>

                <textarea value={response} onChange={e => setResponse(e.target.value)}
                  placeholder="Type your response here... (text fallback for MVP)"
                  className="w-full p-4 rounded-xl border bg-background text-sm mt-4 min-h-[150px] resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  rows={6} />

                <button onClick={handleSubmit} disabled={!response.trim()}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold mt-4 disabled:opacity-40 hover:opacity-90 transition-all flex items-center justify-center gap-2">
                  <Send className="w-4 h-4" /> Submit Response
                </button>
              </>
            ) : score && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-5">
                <h3 className="font-semibold text-lg mb-4">Your Evaluation</h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(score).map(([key, val]) => (
                    <div key={key} className="bg-secondary rounded-xl p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium capitalize">{key}</span>
                        <span className="text-sm font-bold">{val}%</span>
                      </div>
                      <div className="h-1.5 bg-border rounded-full overflow-hidden">
                        <motion.div className="h-full bg-primary rounded-full" initial={{ width: 0 }} animate={{ width: `${val}%` }} transition={{ duration: 0.8 }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-success/10 rounded-xl p-4 mt-4">
                  <p className="text-sm font-semibold text-success">Overall: {Math.round(Object.values(score).reduce((a, b) => a + b, 0) / 4)}%</p>
                  <p className="text-xs text-muted-foreground mt-1">Great effort! Practice regularly to improve your scores.</p>
                </div>
                <button onClick={() => { setResponse(''); setSubmitted(false); setScore(null); }}
                  className="w-full py-3 rounded-xl border text-sm font-medium mt-4 flex items-center justify-center gap-2 hover:bg-secondary transition-colors">
                  <RotateCcw className="w-4 h-4" /> Try Again
                </button>
              </motion.div>
            )}
          </div>

          {prompt.sampleResponse && (
            <div className="bg-card rounded-2xl p-5 card-shadow mt-4">
              <h3 className="font-semibold text-sm mb-2">📋 Sample Response</h3>
              <p className="text-sm text-muted-foreground">{prompt.sampleResponse}</p>
            </div>
          )}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container py-6">
        <h1 className="font-display text-2xl font-bold mb-1">Speaking & Pronunciation Lab</h1>
        <p className="text-sm text-muted-foreground mb-4">Practice speaking for interviews, GDs, and presentations</p>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {categories.map(c => (
            <button key={c} onClick={() => setFilter(c)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${filter === c ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80'}`}>
              {c}
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map(p => (
            <motion.button key={p.id} onClick={() => setActivePrompt(p.id)} whileHover={{ y: -4 }}
              className="bg-card rounded-2xl p-5 card-shadow hover:card-shadow-hover transition-all text-left">
              <span className="text-xs bg-secondary px-2 py-1 rounded-full font-medium">{p.category}</span>
              <h3 className="font-semibold mt-3 text-sm leading-relaxed">{p.prompt}</h3>
              <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
                <span>{p.expectedDuration}s • {p.marks} marks</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
