import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import QuestionRenderer from '@/components/QuestionRenderer';
import { ScoreCard } from '@/components/ui-components';
import { mockTestQuestions } from '@/lib/dummy-data';
import { useApp } from '@/lib/app-context';
import { motion } from 'framer-motion';
import { Timer, Flag, ArrowRight, AlertTriangle } from 'lucide-react';

export default function MockTestPage() {
  const { recordAttempt, getGrade } = useApp();
  const [started, setStarted] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [totalMarks, setTotalMarks] = useState(0);
  const [totalPossible, setTotalPossible] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 min
  const [showConfirm, setShowConfirm] = useState(false);

  const questions = mockTestQuestions;

  useEffect(() => {
    if (started && !completed && timeLeft > 0) {
      const t = setTimeout(() => setTimeLeft(tl => tl - 1), 1000);
      return () => clearTimeout(t);
    }
    if (timeLeft === 0 && started) setCompleted(true);
  }, [started, completed, timeLeft]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const handleComplete = (correct: boolean, marks: number, attempt: number) => {
    recordAttempt('mock-test', { questionId: questions[currentQ].id, answer: '', correct, attemptNumber: attempt, marksEarned: marks, timeSpent: 0 });
    setTotalMarks(m => m + marks);
    setTotalPossible(p => p + questions[currentQ].marks);
    if (currentQ < questions.length - 1) {
      setCurrentQ(q => q + 1);
    } else {
      setCompleted(true);
    }
  };

  if (!started) {
    return (
      <AppLayout>
        <div className="container py-6 max-w-lg">
          <div className="bg-card rounded-2xl p-6 sm:p-8 card-shadow text-center">
            <span className="text-5xl">🏆</span>
            <h1 className="font-display text-2xl font-bold mt-4">Mock Test</h1>
            <p className="text-sm text-muted-foreground mt-2">Test your English communication skills</p>
            <div className="grid grid-cols-3 gap-3 mt-6">
              <div className="bg-secondary rounded-xl p-3">
                <p className="text-lg font-bold">{questions.length}</p>
                <p className="text-xs text-muted-foreground">Questions</p>
              </div>
              <div className="bg-secondary rounded-xl p-3">
                <p className="text-lg font-bold">10</p>
                <p className="text-xs text-muted-foreground">Minutes</p>
              </div>
              <div className="bg-secondary rounded-xl p-3">
                <p className="text-lg font-bold">{questions.reduce((a, q) => a + q.marks, 0)}</p>
                <p className="text-xs text-muted-foreground">Total Marks</p>
              </div>
            </div>
            <div className="bg-accent/10 rounded-xl p-4 mt-4 text-left">
              <p className="text-xs font-semibold flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Instructions</p>
              <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                <li>• Each question has only 1 attempt</li>
                <li>• Timer starts immediately</li>
                <li>• Cannot go back to previous questions</li>
                <li>• Score shown at the end</li>
              </ul>
            </div>
            <button onClick={() => setStarted(true)}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold mt-6 hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
              Start Test <ArrowRight className="w-4 h-4" />
            </button>
          </div>
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
            onRetry={() => { setStarted(false); setCurrentQ(0); setTotalMarks(0); setTotalPossible(0); setCompleted(false); setTimeLeft(600); }}
            onContinue={() => window.location.href = '/dashboard'} />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container py-6 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-xl font-bold">Mock Test</h1>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-mono ${timeLeft < 60 ? 'bg-destructive/10 text-destructive' : 'bg-secondary'}`}>
            <Timer className="w-4 h-4" /> {formatTime(timeLeft)}
          </div>
        </div>
        {/* Question Nav */}
        <div className="flex gap-1.5 mb-6 flex-wrap">
          {questions.map((_, i) => (
            <div key={i} className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${i < currentQ ? 'bg-success text-success-foreground' : i === currentQ ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
              {i + 1}
            </div>
          ))}
        </div>
        <QuestionRenderer key={questions[currentQ].id} question={questions[currentQ]} onComplete={handleComplete} questionNumber={currentQ + 1} totalQuestions={questions.length} />
      </div>
    </AppLayout>
  );
}
