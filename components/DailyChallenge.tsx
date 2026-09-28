'use client';

import React from 'react';
import { Calendar, Flame, Play, CheckCircle2, Sparkles, Trophy } from 'lucide-react';
import { Category, Difficulty } from '@/types/game';
import { CATEGORIES } from '@/lib/categoriesData';
import { sounds } from '@/lib/soundEffects';

interface DailyChallengeProps {
  onStartDaily: (category: Category, difficulty: Difficulty, wordCount: number) => void;
  streak: number;
  isCompletedToday: boolean;
}

export const DailyChallenge: React.FC<DailyChallengeProps> = ({
  onStartDaily,
  streak,
  isCompletedToday,
}) => {
  const today = new Date();
  const formattedDate = today.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Pick deterministic category for today
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24
  );
  const dailyCategory = CATEGORIES[dayOfYear % CATEGORIES.length];

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-6">
      {/* Daily Banner Card */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold mb-2">
              <Calendar className="w-3.5 h-3.5" />
              <span>Desafio do Dia</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white capitalize">
              {formattedDate}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Um quebra-cabeça inédito gerado diariamente para exercitar o cérebro.
            </p>
          </div>

          {/* Streak pill */}
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800">
            <Flame className="w-6 h-6 text-orange-400 fill-orange-400 animate-pulse" />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                Sequência
              </span>
              <span className="text-lg font-black text-orange-300 leading-none">
                {streak} {streak === 1 ? 'dia' : 'dias'}
              </span>
            </div>
          </div>
        </div>

        {/* Challenge details */}
        <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs uppercase tracking-wider text-slate-400 font-bold block mb-1">
              Tema Especial de Hoje:
            </span>
            <h3 className="text-lg font-bold text-amber-300">
              {dailyCategory.name}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Grade 12x12 • 8 palavras • Nível Médio
            </p>
          </div>

          {isCompletedToday ? (
            <div className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Concluído hoje!</span>
            </div>
          ) : (
            <button
              onClick={() => {
                sounds.playSelectLetter(0);
                onStartDaily(dailyCategory, 'medio', 8);
              }}
              type="button"
              className="flex items-center gap-2 py-3 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 font-black text-sm sm:text-base shadow-lg shadow-cyan-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <span>Jogar Desafio Diário</span>
              <Play className="w-4 h-4 fill-current" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
