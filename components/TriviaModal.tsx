'use client';

import React from 'react';
import { PlacedWord } from '@/types/game';
import { BookOpen, X, Sparkles } from 'lucide-react';
import { getWordColor } from '@/lib/colors';

interface TriviaModalProps {
  word: PlacedWord | null;
  onClose: () => void;
}

export const TriviaModal: React.FC<TriviaModalProps> = ({ word, onClose }) => {
  if (!word) return null;

  const theme = getWordColor(word.colorIndex);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700/80 p-6 shadow-2xl flex flex-col gap-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          aria-label="Fechar"
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs uppercase tracking-wider font-bold text-slate-400">
              Palavra Descoberta
            </span>
            <h3 className={`text-2xl font-black ${theme.text}`}>
              {word.displayWord}
            </h3>
          </div>
        </div>

        {/* Clue and Trivia Body */}
        <div className="flex flex-col gap-3 py-1">
          {word.clue && (
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
              <span className="text-xs font-semibold text-slate-400 block mb-1">
                Definição / Pista:
              </span>
              <p className="text-sm text-slate-200 font-medium">
                {word.clue}
              </p>
            </div>
          )}

          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-emerald-500/10 border border-amber-500/20">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5 mb-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Você sabia?
            </span>
            <p className="text-sm text-slate-300 leading-relaxed">
              {word.trivia || 'Esta palavra faz parte do rico vocabulário em português selecionado para este desafio.'}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          type="button"
          className="w-full py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 font-bold text-sm hover:bg-slate-750 transition-colors mt-2"
        >
          Fechar
        </button>
      </div>
    </div>
  );
};
