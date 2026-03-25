import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import QuestionRenderer from '@/components/QuestionRenderer';
import { ScoreCard } from '@/components/ui-components';
import { dailyQuestions, speakingPrompts } from '@/lib/dummy-data';
import { useApp } from '@/lib/app-context';
import { motion } from 'framer-motion';
import { CheckCircle, BookOpen, Mic, Target } from 'lucide-react';

export default function DailyPracticePage() {
  const { completeDailyTask, getGrade } = useApp();
  const [currentQ, setCurrentQ] = useState(0);
  const [totalMarks, setTotalMarks] = useState(0);
  const [totalPossible, setTotalPossible] = useState(0);
  const [completed, setCompleted] = useState(false);

  const questions = dailyQuestions;

  const handleComplete = (correct: boolean, marks: number) => {
    setTotalMarks(m => m + marks);
    setTotalPossible(p => p + questions[currentQ].marks);
    completeDailyTask(marks);
    if (currentQ < questions.length - 1) {
      setCurrentQ(q => q + 1);
    } else {
      setTotalPossible(p => {
        const finalTotal = p + questions[currentQ].marks;
        setCompleted(true);
        return finalTotal;
      });
    }
  };

  const pct = totalPossible > 0 ? Math.round((totalMarks / totalPossible) * 100) : 0;

  return (
    <AppLayout>
      <div className="container py-6 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold">Daily Practice</h1>
            <p className="text-sm text-muted-foreground">Complete today's tasks to maintain your streak</p>
          </div>
          <div className="bg-secondary px-3 py-1.5 rounded-full text-sm font-mono">
            {currentQ + 1}/{questions.length}
          </div>
        </div>

        {/* Progress */}
        <div className="flex gap-1 mb-6">
          {questions.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i < currentQ ? 'bg-success' : i === currentQ ? 'bg-primary' : 'bg-border'}`} />
          ))}
        </div>

        {!completed ? (
          <QuestionRenderer
            key={questions[currentQ].id}
            question={questions[currentQ]}
            onComplete={handleComplete}
            questionNumber={currentQ + 1}
            totalQuestions={questions.length}
          />
        ) : (
          <ScoreCard
            score={totalMarks}
            total={totalPossible}
            grade={getGrade(pct)}
            onRetry={() => { setCurrentQ(0); setTotalMarks(0); setTotalPossible(0); setCompleted(false); }}
            onContinue={() => window.location.href = '/dashboard'}
          />
        )}
      </div>
    </AppLayout>
  );
}
