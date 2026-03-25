import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import QuestionRenderer from '@/components/QuestionRenderer';
import { ScoreCard, ProgressBar } from '@/components/ui-components';
import { grammarLessons } from '@/lib/dummy-data';
import { useApp } from '@/lib/app-context';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, CheckCircle } from 'lucide-react';
import { Lesson } from '@/lib/types';

export default function GrammarPage() {
  const { recordAttempt, getGrade, lessonProgress } = useApp();
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [totalMarks, setTotalMarks] = useState(0);
  const [totalPossible, setTotalPossible] = useState(0);
  const [completed, setCompleted] = useState(false);

  const handleComplete = (correct: boolean, marks: number, attempt: number) => {
    if (activeLesson) {
      recordAttempt(activeLesson.id, { questionId: activeLesson.questions[currentQ].id, answer: '', correct, attemptNumber: attempt, marksEarned: marks, timeSpent: 0 });
      setTotalMarks(m => m + marks);
      setTotalPossible(p => p + activeLesson.questions[currentQ].marks);
      if (currentQ < activeLesson.questions.length - 1) {
        setCurrentQ(q => q + 1);
      } else {
        setCompleted(true);
      }
    }
  };

  if (activeLesson && !completed) {
    return (
      <AppLayout>
        <div className="container py-6 max-w-2xl">
          <button onClick={() => { setActiveLesson(null); setCurrentQ(0); setTotalMarks(0); setTotalPossible(0); }}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Grammar
          </button>
          <h1 className="font-display text-xl font-bold mb-1">{activeLesson.title}</h1>
          <p className="text-sm text-muted-foreground mb-6">{activeLesson.description}</p>
          <div className="flex gap-1 mb-6">
            {activeLesson.questions.map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full ${i < currentQ ? 'bg-success' : i === currentQ ? 'bg-primary' : 'bg-border'}`} />
            ))}
          </div>
          <QuestionRenderer
            key={activeLesson.questions[currentQ].id}
            question={activeLesson.questions[currentQ]}
            onComplete={handleComplete}
            questionNumber={currentQ + 1}
            totalQuestions={activeLesson.questions.length}
          />
        </div>
      </AppLayout>
    );
  }

  if (completed && activeLesson) {
    const pct = totalPossible > 0 ? Math.round((totalMarks / totalPossible) * 100) : 0;
    return (
      <AppLayout>
        <div className="container py-6 max-w-2xl">
          <ScoreCard score={totalMarks} total={totalPossible} grade={getGrade(pct)}
            onRetry={() => { setCurrentQ(0); setTotalMarks(0); setTotalPossible(0); setCompleted(false); }}
            onContinue={() => { setActiveLesson(null); setCurrentQ(0); setTotalMarks(0); setTotalPossible(0); setCompleted(false); }}
          />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container py-6">
        <h1 className="font-display text-2xl font-bold mb-1">Grammar Practice</h1>
        <p className="text-sm text-muted-foreground mb-6">Master English grammar for professional communication</p>
        <div className="grid sm:grid-cols-2 gap-4">
          {grammarLessons.map(lesson => {
            const progress = lessonProgress[lesson.id];
            return (
              <motion.button key={lesson.id} onClick={() => setActiveLesson(lesson)}
                whileHover={{ y: -4 }}
                className="bg-card rounded-2xl p-5 card-shadow hover:card-shadow-hover transition-all text-left">
                <div className="flex items-start justify-between">
                  <span className="text-3xl">{lesson.icon}</span>
                  <span className="text-xs font-mono bg-secondary px-2 py-1 rounded-full">{lesson.marksTotal} marks</span>
                </div>
                <h3 className="font-semibold mt-3">{lesson.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{lesson.description}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-muted-foreground">{lesson.estimatedTime} • {lesson.questions.length} questions</span>
                  {progress?.completed && <CheckCircle className="w-4 h-4 text-success" />}
                </div>
                {progress && <ProgressBar value={progress.score} max={lesson.marksTotal} className="mt-3" />}
              </motion.button>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
