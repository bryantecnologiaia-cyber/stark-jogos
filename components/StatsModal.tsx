'use client';

import React from 'react';
import { PlayerStats } from '@/types/game';
import { ACHIEVEMENTS_LIST } from '@/lib/storage';
import { Trophy, X, Sparkles, CheckCircle2, Lock, Flame, Clock, BookOpen } from 'lucide-react';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: PlayerStats;
}

export const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose, stats }) => {
  if (!isOpen) return null;

  const formatTotalTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const hours = Math.floor(mins / 60);
    if (hours > 0) return `${hours}h ${mins % 60}m`;
    return `${mins}m ${totalSec % 60}s`;
  };

  const unlockedCount = stats.achievements.length;
  const totalAchievements = ACHIEVEMENTS_LIST.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-700/80 p-6 sm:p-8 shadow-2xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          aria-label="Fechar"
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-md">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white">
              Estatísticas & Troféus
            </h3>
            <p className="text-xs text-slate-400">
              Seu progresso como caçador de palavras
            </p>
          </div>
        </div>

        {/* Primary Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center text-center">
            <BookOpen className="w-4 h-4 text-emerald-400 mb-1" />
            <span className="text-[11px] text-slate-400">Palavras</span>
            <span className="text-lg font-black text-emerald-300">
              {stats.totalWordsFound}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center text-center">
            <Trophy className="w-4 h-4 text-amber-400 mb-1" />
            <span className="text-[11px] text-slate-400">Vitórias</span>
            <span className="text-lg font-black text-amber-300">
              {stats.totalGamesWon}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center text-center">
            <Sparkles className="w-4 h-4 text-cyan-400 mb-1" />
            <span className="text-[11px] text-slate-400">Estrelas</span>
            <span className="text-lg font-black text-cyan-300">
              {stats.totalStarsEarned}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center text-center">
            <Clock className="w-4 h-4 text-purple-400 mb-1" />
            <span className="text-[11px] text-slate-400">Tempo Total</span>
            <span className="text-xs font-bold text-purple-300 mt-1">
              {formatTotalTime(stats.totalTimePlayedSeconds)}
            </span>
          </div>
        </div>

        {/* Achievements Section */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
              <span>Conquistas</span>
              <span className="text-xs text-amber-400 font-semibold">
                ({unlockedCount}/{totalAchievements})
              </span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
            {ACHIEVEMENTS_LIST.map((ach) => {
              const isUnlocked = stats.achievements.includes(ach.id);
              return (
                <div
                  key={ach.id}
                  className={`
                    p-3 rounded-2xl border flex items-center gap-3 transition-colors
                    ${isUnlocked
                      ? 'bg-slate-950/80 border-amber-500/30'
                      : 'bg-slate-950/30 border-slate-800/80 opacity-60'}
                  `}
                >
                  <div
                    className={`
                      w-9 h-9 shrink-0 rounded-xl flex items-center justify-center
                      ${isUnlocked
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : 'bg-slate-900 text-slate-600 border border-slate-800'}
                    `}
                  >
                    {isUnlocked ? (
                      <CheckCircle2 className="w-5 h-5 text-amber-400" />
                    ) : (
                      <Lock className="w-4 h-4 text-slate-600" />
                    )}
                  </div>

                  <div className="flex flex-col">
                    <span
                      className={`text-xs font-bold ${
                        isUnlocked ? 'text-slate-100' : 'text-slate-400'
                      }`}
                    >
                      {ach.title}
                    </span>
                    <span className="text-[11px] text-slate-400 leading-tight">
                      {ach.description}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={onClose}
          type="button"
          className="w-full py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 font-bold text-sm hover:bg-slate-750 transition-colors"
        >
          Fechar
        </button>
      </div>
    </div>
  );
};
