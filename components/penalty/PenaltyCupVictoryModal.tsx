'use client';

import React from 'react';
import { Trophy, Award, RotateCcw, ChevronRight, Sparkles } from 'lucide-react';
import { sounds } from '@/lib/soundEffects';

interface PenaltyCupVictoryModalProps {
  isOpen: boolean;
  isWinner: boolean;
  playerGoals: number;
  rivalGoals: number;
  playerSaves: number;
  rivalTeam: string;
  rivalFlag: string;
  coinsEarned: number;
  onPlayAgain: () => void;
  onNextOpponent: () => void;
}

export const PenaltyCupVictoryModal: React.FC<PenaltyCupVictoryModalProps> = ({
  isOpen,
  isWinner,
  playerGoals,
  rivalGoals,
  playerSaves,
  rivalTeam,
  rivalFlag,
  coinsEarned,
  onPlayAgain,
  onNextOpponent,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center flex flex-col items-center gap-5">
        {/* Animated Trophy or Whistle Icon */}
        <div
          className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-xl border ${
            isWinner
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-400 animate-bounce'
              : 'bg-rose-500/20 border-rose-500/40 text-rose-400'
          }`}
        >
          {isWinner ? (
            <Trophy className="w-10 h-10 fill-current" />
          ) : (
            <Award className="w-10 h-10" />
          )}
        </div>

        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {isWinner ? '🏆 BRASIL CAMPEÃO!' : 'FIM DA DISPUTA!'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {isWinner
              ? `Vitória maiúscula contra ${rivalFlag} ${rivalTeam} nos pênaltis!`
              : `${rivalFlag} ${rivalTeam} levou a melhor desta vez.`}
          </p>
        </div>

        {/* Scoreboard display */}
        <div className="flex items-center justify-center gap-6 p-4 rounded-2xl bg-slate-950 border border-slate-800 w-full">
          <div className="flex flex-col items-center">
            <span className="text-2xl">🇧🇷</span>
            <span className="text-xs font-black text-slate-300">BRASIL</span>
            <span className="text-3xl font-black font-mono text-emerald-400 mt-1">
              {playerGoals}
            </span>
            {playerSaves > 0 && (
              <span className="text-[10px] text-emerald-400 font-bold mt-0.5">
                🧤 {playerSaves} defesas
              </span>
            )}
          </div>

          <span className="text-base font-bold text-slate-600">X</span>

          <div className="flex flex-col items-center">
            <span className="text-2xl">{rivalFlag}</span>
            <span className="text-xs font-black text-slate-300 uppercase">{rivalTeam}</span>
            <span className="text-3xl font-black font-mono text-rose-400 mt-1">
              {rivalGoals}
            </span>
          </div>
        </div>

        {/* Reward pill */}
        {coinsEarned > 0 && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold text-sm">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>+{coinsEarned} Moedas de Ouro Conquistadas!</span>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full pt-2">
          <button
            type="button"
            onClick={() => {
              sounds.playSelectLetter(0);
              onPlayAgain();
            }}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Revanche</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playSelectLetter(0);
              onNextOpponent();
            }}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <span>Próximo Rival</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
