'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { PlacedWord } from '@/types/game';
import { Sparkles, Trophy, Clock, Flame, ArrowRight, RotateCcw, BookOpen } from 'lucide-react';
import { getWordColor } from '@/lib/colors';

interface VictoryModalProps {
  isOpen: boolean;
  stars: number;
  timeSeconds: number;
  maxCombo: number;
  score: number;
  placedWords: PlacedWord[];
  hasNextLevel: boolean;
  onNextLevel: () => void;
  onRestart: () => void;
  onClose: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  stars,
  timeSeconds,
  maxCombo,
  score,
  placedWords,
  hasNextLevel,
  onNextLevel,
  onRestart,
  onClose,
}) => {
  useEffect(() => {
    if (isOpen) {
      // Fire confetti burst
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });

        // Secondary delayed burst
        const timer = setTimeout(() => {
          confetti({
            particleCount: 50,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
          });
          confetti({
            particleCount: 50,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
          });
        }, 300);

        return () => clearTimeout(timer);
      } catch {
        // Safe fallback
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-700/80 p-6 sm:p-8 shadow-2xl overflow-hidden flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
        {/* Glow effect */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header with Title and Trophy */}
        <div className="text-center flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-400 p-[2px] shadow-lg shadow-amber-500/30">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Trophy className="w-8 h-8 text-amber-400" />
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Parabéns! Nível Concluído!
          </h2>
          <p className="text-sm text-slate-400">
            Você encontrou todas as palavras da grade com maestria.
          </p>
        </div>

        {/* 3 Stars display */}
        <div className="flex items-center justify-center gap-3">
          {[1, 2, 3].map((starIdx) => {
            const isEarned = starIdx <= stars;
            return (
              <div
                key={starIdx}
                className={`
                  p-3 rounded-2xl border transition-all duration-500 transform
                  ${isEarned 
                    ? 'bg-amber-500/20 border-amber-400/60 scale-110 shadow-lg shadow-amber-500/30' 
                    : 'bg-slate-950/60 border-slate-800 opacity-40'}
                `}
              >
                <Sparkles
                  className={`w-7 h-7 sm:w-8 sm:h-8 ${
                    isEarned ? 'text-amber-400 fill-amber-400 animate-pulse' : 'text-slate-600'
                  }`}
                />
              </div>
            );
          })}
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-950 border border-slate-800">
            <Clock className="w-4 h-4 text-emerald-400 mb-1" />
            <span className="text-[11px] text-slate-400">Tempo</span>
            <span className="text-sm sm:text-base font-bold text-slate-200">
              {formatTime(timeSeconds)}
            </span>
          </div>

          <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-950 border border-slate-800">
            <Flame className="w-4 h-4 text-orange-400 mb-1" />
            <span className="text-[11px] text-slate-400">Maior Combo</span>
            <span className="text-sm sm:text-base font-bold text-orange-300">
              {maxCombo}x
            </span>
          </div>

          <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-950 border border-slate-800">
            <Sparkles className="w-4 h-4 text-amber-400 mb-1" />
            <span className="text-[11px] text-slate-400">Pontuação</span>
            <span className="text-sm sm:text-base font-bold text-amber-300">
              {score.toLocaleString('pt-BR')}
            </span>
          </div>
        </div>

        {/* Curiosidades / Words Discovered Summary */}
        <div className="flex flex-col gap-2 bg-slate-950/60 rounded-2xl p-4 border border-slate-800/80">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>Curiosidades do Nível</span>
          </div>

          <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
            {placedWords.slice(0, 4).map((word) => {
              const theme = getWordColor(word.colorIndex);
              return (
                <div key={word.id} className="text-xs text-slate-400 bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                  <span className={`font-bold mr-1.5 ${theme.text}`}>{word.displayWord}:</span>
                  <span>{word.trivia || word.clue || 'Palavra desvendada com sucesso!'}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {hasNextLevel ? (
            <button
              onClick={onNextLevel}
              type="button"
              className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-400 text-slate-950 font-black text-sm sm:text-base shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-transform"
            >
              <span>Próxima Fase</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onClose}
              type="button"
              className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-sm sm:text-base shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-transform"
            >
              <span>Escolher Outro Nível</span>
            </button>
          )}

          <button
            onClick={onRestart}
            type="button"
            className="w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-slate-800 border border-slate-700 text-slate-200 font-bold text-sm hover:bg-slate-750 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Repetir</span>
          </button>
        </div>
      </div>
    </div>
  );
};
