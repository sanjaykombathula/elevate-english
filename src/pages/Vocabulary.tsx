import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { vocabWords } from '@/lib/dummy-data';
import { useApp } from '@/lib/app-context';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Check, Volume2, ArrowRight, Bookmark } from 'lucide-react';

export default function VocabularyPage() {
  const { favoriteWords, learnedWords, toggleFavoriteWord, markWordLearned } = useApp();
  const [activeWord, setActiveWord] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'favorites' | 'learned'>('all');

  const filtered = vocabWords.filter(w => {
    if (filter === 'favorites') return favoriteWords.includes(w.id);
    if (filter === 'learned') return learnedWords.includes(w.id);
    return true;
  });

  return (
    <AppLayout>
      <div className="container py-6">
        <h1 className="font-display text-2xl font-bold mb-1">Vocabulary Builder</h1>
        <p className="text-sm text-muted-foreground mb-4">Build a powerful professional vocabulary</p>

        <div className="flex gap-2 mb-6">
          {(['all', 'favorites', 'learned'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${filter === f ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80'}`}>
              {f} {f === 'learned' ? `(${learnedWords.length})` : f === 'favorites' ? `(${favoriteWords.length})` : ''}
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map(word => (
            <motion.div key={word.id} layout whileHover={{ y: -2 }}
              className="bg-card rounded-2xl p-5 card-shadow hover:card-shadow-hover transition-all cursor-pointer"
              onClick={() => setActiveWord(activeWord === word.id ? null : word.id)}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold">{word.word}</h3>
                  <p className="text-xs font-mono text-muted-foreground">{word.pronunciationHint}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={e => { e.stopPropagation(); toggleFavoriteWord(word.id); }}
                    className={`p-1.5 rounded-lg transition-colors ${favoriteWords.includes(word.id) ? 'text-destructive' : 'text-muted-foreground hover:text-destructive'}`}>
                    <Heart className={`w-4 h-4 ${favoriteWords.includes(word.id) ? 'fill-current' : ''}`} />
                  </button>
                  {!learnedWords.includes(word.id) && (
                    <button onClick={e => { e.stopPropagation(); markWordLearned(word.id); }}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-success transition-colors">
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  {learnedWords.includes(word.id) && (
                    <span className="p-1.5 text-success"><Check className="w-4 h-4" /></span>
                  )}
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">{word.meaning}</p>

              <AnimatePresence>
                {activeWord === word.id && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="mt-4 pt-4 border-t space-y-3">
                      <p className="text-sm italic">"{word.example}"</p>
                      <div className="flex gap-2 flex-wrap">
                        {word.synonyms.map(s => (
                          <span key={s} className="text-xs bg-success/10 text-success px-2 py-1 rounded-md">{s}</span>
                        ))}
                        {word.antonyms.map(a => (
                          <span key={a} className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded-md">{a}</span>
                        ))}
                      </div>
                      <div className="bg-secondary rounded-xl p-3">
                        <p className="text-xs font-medium mb-1">💼 Interview Usage</p>
                        <p className="text-xs text-muted-foreground">{word.interviewUsage}</p>
                      </div>
                      <span className="text-xs bg-secondary px-2 py-1 rounded-md inline-block">{word.level} • {word.category}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No words found. {filter !== 'all' && 'Try switching to "All" words.'}</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
