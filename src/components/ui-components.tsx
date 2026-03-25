import React from 'react';
import { motion } from 'framer-motion';

interface ProgressRingProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  color?: string;
}

export function ProgressRing({ value, max = 100, size = 80, strokeWidth = 6, label, color }: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = Math.min((value / max) * 100, 100);
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} stroke="hsl(var(--border))" strokeWidth={strokeWidth} fill="none" />
          <motion.circle
            cx={size / 2} cy={size / 2} r={radius}
            stroke={color || 'hsl(var(--primary))'}
            strokeWidth={strokeWidth} fill="none" strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold">{Math.round(percentage)}%</span>
        </div>
      </div>
      {label && <span className="text-xs text-muted-foreground font-medium">{label}</span>}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  className?: string;
}

export function StatCard({ title, value, icon, trend, className = '' }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-card rounded-xl p-4 card-shadow hover:card-shadow-hover transition-shadow ${className}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="p-2 rounded-lg bg-secondary">{icon}</div>
        {trend && <span className="text-xs font-medium text-success">{trend}</span>}
      </div>
      <p className="text-2xl font-bold mt-2">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{title}</p>
    </motion.div>
  );
}

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  className?: string;
}

export function ProgressBar({ value, max = 100, label, showPercentage = true, className = '' }: ProgressBarProps) {
  const pct = Math.min(Math.round((value / max) * 100), 100);
  return (
    <div className={className}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-sm font-medium">{label}</span>}
          {showPercentage && <span className="text-xs font-mono text-muted-foreground">{pct}%</span>}
        </div>
      )}
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}

export function ScoreCard({ score, total, grade, onRetry, onContinue }: { score: number; total: number; grade: string; onRetry?: () => void; onContinue?: () => void }) {
  const pct = Math.round((score / total) * 100);
  const gradeColor = pct >= 80 ? 'text-success' : pct >= 60 ? 'text-accent' : 'text-destructive';
  return (
    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card rounded-2xl p-6 card-shadow text-center max-w-sm mx-auto">
      <h3 className="font-display text-xl font-bold mb-4">Lesson Complete!</h3>
      <ProgressRing value={pct} size={120} strokeWidth={8} />
      <p className={`text-4xl font-display font-extrabold mt-4 ${gradeColor}`}>{grade}</p>
      <p className="text-muted-foreground text-sm mt-1">{score} / {total} marks</p>
      <div className="flex gap-3 mt-6">
        {onRetry && <button onClick={onRetry} className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-secondary transition-colors">Retry</button>}
        {onContinue && <button onClick={onContinue} className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">Continue</button>}
      </div>
    </motion.div>
  );
}
