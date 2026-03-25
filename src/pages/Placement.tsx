import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import QuestionRenderer from '@/components/QuestionRenderer';
import { ScoreCard } from '@/components/ui-components';
import { placementQuestions, speakingPrompts } from '@/lib/dummy-data';
import { useApp } from '@/lib/app-context';
import { motion } from 'framer-motion';
import { Briefcase, ArrowRight, MessageSquare, Users, FileText } from 'lucide-react';

const sections = [
  { id: 'intro', title: 'Self Introduction', icon: '👋', description: 'Master your self-introduction' },
  { id: 'strengths', title: 'Strengths & Weaknesses', icon: '💪', description: 'Answer confidently about your qualities' },
  { id: 'hr', title: 'HR Questions', icon: '💼', description: 'Practice common HR interview questions' },
  { id: 'gd', title: 'Group Discussion', icon: '👥', description: 'GD topics and communication tips' },
  { id: 'project', title: 'Project Explanation', icon: '🔧', description: 'Explain your projects clearly' },
  { id: 'formal', title: 'Formal Communication', icon: '✉️', description: 'Emails, presentations, and more' },
];

export default function PlacementPage() {
  const { recordAttempt, getGrade } = useApp();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [totalMarks, setTotalMarks] = useState(0);
  const [totalPossible, setTotalPossible] = useState(0);
  const [completed, setCompleted] = useState(false);

  const questions = placementQuestions;

  const handleComplete = (correct: boolean, marks: number, attempt: number) => {
    recordAttempt('placement', { questionId: questions[currentQ].id, answer: '', correct, attemptNumber: attempt, marksEarned: marks, timeSpent: 0 });
    setTotalMarks(m => m + marks);
    setTotalPossible(p => p + questions[currentQ].marks);
    if (currentQ < questions.length - 1) {
      setCurrentQ(q => q + 1);
    } else {
      setCompleted(true);
    }
  };

  if (activeSection && !completed) {
    return (
      <AppLayout>
        <div className="container py-6 max-w-2xl">
          <button onClick={() => { setActiveSection(null); setCurrentQ(0); setTotalMarks(0); setTotalPossible(0); }}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">← Back</button>
          <h1 className="font-display text-xl font-bold mb-6">Placement Communication</h1>
          <div className="flex gap-1 mb-6">
            {questions.map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full ${i < currentQ ? 'bg-success' : i === currentQ ? 'bg-primary' : 'bg-border'}`} />
            ))}
          </div>
          <QuestionRenderer key={questions[currentQ].id} question={questions[currentQ]} onComplete={handleComplete} questionNumber={currentQ + 1} totalQuestions={questions.length} />
        </div>
      </AppLayout>
    );
  }

  if (completed) {
    const pct = totalPossible > 0 ? Math.round((totalMarks / totalPossible) * 100) : 0;
    return (
      <AppLayout>
        <div className="container py-6 max-w-2xl">
          <ScoreCard score={totalMarks} total={totalPossible} grade={getGrade(pct)}
            onRetry={() => { setCurrentQ(0); setTotalMarks(0); setTotalPossible(0); setCompleted(false); }}
            onContinue={() => { setActiveSection(null); setCurrentQ(0); setTotalMarks(0); setTotalPossible(0); setCompleted(false); }} />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container py-6">
        <h1 className="font-display text-2xl font-bold mb-1">Placement Communication</h1>
        <p className="text-sm text-muted-foreground mb-6">Master communication for campus placements</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sections.map(s => (
            <motion.button key={s.id} onClick={() => setActiveSection(s.id)} whileHover={{ y: -4 }}
              className="bg-card rounded-2xl p-5 card-shadow hover:card-shadow-hover transition-all text-left">
              <span className="text-3xl">{s.icon}</span>
              <h3 className="font-semibold mt-3">{s.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{s.description}</p>
              <div className="flex items-center justify-end mt-3">
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
