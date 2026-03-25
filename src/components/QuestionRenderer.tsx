import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Question } from '@/lib/types';
import { useApp } from '@/lib/app-context';
import { CheckCircle, XCircle, Lightbulb, ArrowRight } from 'lucide-react';

interface QuestionRendererProps {
  question: Question;
  onComplete: (correct: boolean, marksEarned: number, attemptNumber: number) => void;
  questionNumber: number;
  totalQuestions: number;
}

export default function QuestionRenderer({ question, onComplete, questionNumber, totalQuestions }: QuestionRendererProps) {
  const { calculateMarks } = useApp();
  const [selected, setSelected] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [attempt, setAttempt] = useState(1);
  const [showExplanation, setShowExplanation] = useState(false);
  const [marksEarned, setMarksEarned] = useState(0);

  const checkAnswer = () => {
    let answer = '';
    if (question.type === 'mcq' || question.type === 'vocabulary') {
      answer = selected;
    } else {
      answer = inputValue.trim();
    }

    if (!answer) return;

    let correct = false;
    if (question.type === 'mcq' || question.type === 'vocabulary') {
      correct = answer === question.correctAnswer;
    } else {
      const accepted = question.acceptedAnswers || [question.correctAnswer];
      correct = accepted.some(a => a.toLowerCase().replace(/\s+/g, ' ').trim() === answer.toLowerCase().replace(/\s+/g, ' ').trim());
    }

    const marks = calculateMarks(correct, attempt, question.marks);
    setIsCorrect(correct);
    setMarksEarned(marks);
    setSubmitted(true);
    setShowExplanation(true);

    if (!correct && attempt < question.attemptsAllowed) {
      // Allow retry
    } else {
      // Final
    }
  };

  const handleRetry = () => {
    setSubmitted(false);
    setShowExplanation(false);
    setSelected('');
    setInputValue('');
    setAttempt(a => a + 1);
  };

  const handleNext = () => {
    onComplete(isCorrect, marksEarned, attempt);
  };

  const canRetry = submitted && !isCorrect && attempt < question.attemptsAllowed;
  const isFinal = submitted && (isCorrect || attempt >= question.attemptsAllowed);

  return (
    <div className="bg-card rounded-2xl p-5 sm:p-6 card-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-mono text-muted-foreground">Q{questionNumber}/{totalQuestions}</span>
        <span className="text-xs font-mono bg-secondary px-2 py-1 rounded-full">{question.marks} marks</span>
      </div>

      {/* Question */}
      <h3 className="font-semibold text-base sm:text-lg mb-5 leading-relaxed">{question.question}</h3>

      {/* Answer Area */}
      {(question.type === 'mcq' || question.type === 'vocabulary') && question.options && (
        <div className="space-y-2.5">
          {question.options.map((opt, i) => {
            let optClass = 'border border-border bg-background hover:border-primary/40';
            if (submitted) {
              if (opt === question.correctAnswer) optClass = 'border-success bg-success/10';
              else if (opt === selected && !isCorrect) optClass = 'border-destructive bg-destructive/10';
              else optClass = 'border-border bg-background opacity-50';
            } else if (opt === selected) {
              optClass = 'border-primary bg-primary/5';
            }
            return (
              <button key={i} onClick={() => !submitted && setSelected(opt)}
                disabled={submitted}
                className={`w-full text-left p-3.5 rounded-xl text-sm transition-all ${optClass}`}>
                <span className="font-mono text-xs text-muted-foreground mr-2">{String.fromCharCode(65 + i)}.</span>
                {opt}
              </button>
            );
          })}
        </div>
      )}

      {(question.type === 'fill-blank' || question.type === 'sentence-correction' || question.type === 'interview') && (
        <div>
          <textarea
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            disabled={submitted}
            placeholder={question.type === 'sentence-correction' ? 'Type the corrected sentence...' : 'Type your answer...'}
            className="w-full p-3.5 rounded-xl border bg-background text-sm resize-none min-h-[80px] focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            rows={question.type === 'interview' ? 4 : 2}
          />
        </div>
      )}

      {/* Result */}
      <AnimatePresence>
        {showExplanation && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4">
            <div className={`flex items-start gap-3 p-4 rounded-xl ${isCorrect ? 'bg-success/10' : 'bg-destructive/10'}`}>
              {isCorrect ? <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" /> : <XCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />}
              <div>
                <p className={`text-sm font-semibold ${isCorrect ? 'text-success' : 'text-destructive'}`}>
                  {isCorrect ? `Correct! +${marksEarned} marks` : canRetry ? `Incorrect. Try again! (Attempt ${attempt}/${question.attemptsAllowed})` : `Incorrect. Answer: ${question.correctAnswer}`}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl bg-secondary mt-2">
              <Lightbulb className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">{question.explanation}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="flex gap-3 mt-5">
        {!submitted && (
          <button onClick={checkAnswer}
            disabled={!selected && !inputValue.trim()}
            className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity active:scale-[0.98]">
            Submit Answer
          </button>
        )}
        {canRetry && (
          <button onClick={handleRetry} className="flex-1 py-3 rounded-xl border border-border text-sm font-semibold hover:bg-secondary transition-colors">
            Try Again
          </button>
        )}
        {isFinal && (
          <button onClick={handleNext} className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-[0.98]">
            Next <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
