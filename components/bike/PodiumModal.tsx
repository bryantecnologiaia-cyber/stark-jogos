'use client';

import React from 'react';
import { Trophy, Clock, Coins, RotateCcw, ArrowRight, Award, Sparkles, Flame, Zap } from 'lucide-react';
import { sounds } from '@/lib/soundEffects';

interface PodiumModalProps {
  isOpen: boolean;
  rank: number;
  timeSeconds: number;
  coinsEarned: number;
  medal: 'gold' | 'silver' | 'bronze' | null;
  isNewRecord: boolean;
  trackName: string;
  overtakesCount?: number;
  bestStreak?: number;
  rushScore?: number;
  gameMode?: 'grand-tour' | 'overtake-rush';
  onRestart: () => void;
  onNextTrack: () => void;
  onClose: () => void;
}

export const PodiumModal: React.FC<PodiumModalProps> = ({
  isOpen,
  rank,
  timeSeconds,
  coinsEarned,
  medal,
  isNewRecord,
  trackName,
  overtakesCount = 0,
  bestStreak = 0,
  rushScore,
  gameMode = 'grand-tour',
  onRestart,
  onNextTrack,
  onClose: _onClose,
}) => {
  if (!isOpen) return null;

  const isRush = gameMode === 'overtake-rush';

  const getRankTitle = () => {
    if (isRush) {
      return {
        title: '🚀 Desafio de Ultrapassagens!',
        subtitle: `Sensacional! Você ultrapassou ${overtakesCount} ciclistas no tráfego!`,
      };
    }
    if (rank === 1) return { title: '🏆 Grande Campeão!', subtitle: 'Você ultrapassou todos os rivais e cruzou em 1º Lugar!' };
    if (rank === 2) return { title: '🥈 Vice-Campeão!', subtitle: 'Excelente prova, 2º Lugar no Pódio!' };
    if (rank === 3) return { title: '🥉 Pódio Garantido!', subtitle: 'Conquistou o 3º Lugar na corrida!' };
    return { title: '🏁 Prova Concluída!', subtitle: `Você finalizou em ${rank}º lugar com ${overtakesCount} ultrapassagens!` };
  };

  const { title, subtitle } = getRankTitle();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center gap-5 relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Big Rank / Trophy Badge */}
        <div className="relative">
          <div
            className={`w-20 h-20 rounded-3xl flex items-center justify-center text-3xl font-black shadow-xl ${
              isRush
                ? 'bg-gradient-to-tr from-cyan-500 to-emerald-400 text-slate-950 ring-4 ring-cyan-400/40'
                : rank === 1
                ? 'bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 ring-4 ring-amber-400/40'
                : rank === 2
                ? 'bg-gradient-to-tr from-slate-400 to-slate-200 text-slate-950 ring-4 ring-slate-300/40'
                : rank === 3
                ? 'bg-gradient-to-tr from-amber-700 to-amber-500 text-white ring-4 ring-amber-600/40'
                : 'bg-slate-800 text-white'
            }`}
          >
            {isRush ? <Flame className="w-10 h-10 fill-current text-slate-950" /> : `${rank}º`}
          </div>

          {medal && !isRush && (
            <div className="absolute -bottom-2 -right-2 p-1.5 rounded-full bg-slate-950 border border-slate-700 shadow-md">
              <Award className="w-5 h-5 text-amber-400" />
            </div>
          )}
        </div>

        <div>
          <h3 className="text-2xl font-black text-white tracking-tight">{title}</h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">{subtitle}</p>
          <span className="text-xs font-bold text-cyan-400 mt-0.5 block">{trackName}</span>
        </div>

        {/* Highlight Stats Grid */}
        <div className="w-full grid grid-cols-2 gap-2.5">
          {/* Overtakes Stat */}
          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col items-center">
            <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Ultrapassagens</span>
            </span>
            <span className="text-xl font-black text-amber-300 font-mono mt-0.5">
              {overtakesCount}
            </span>
            {bestStreak > 1 && (
              <span className="text-[10px] text-amber-400/80 font-bold">
                Combo Máximo: x{bestStreak}
              </span>
            )}
          </div>

          {/* Time or Rush Score */}
          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col items-center">
            <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
              {isRush ? (
                <>
                  <Zap className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Pontos Rush</span>
                </>
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Tempo de Corrida</span>
                </>
              )}
            </span>
            <span className="text-xl font-black text-white font-mono mt-0.5">
              {isRush ? rushScore || 0 : `${timeSeconds.toFixed(1)}s`}
            </span>
            {isNewRecord && (
              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5">
                <Sparkles className="w-3 h-3" />
                <span>Novo Recorde!</span>
              </span>
            )}
          </div>

          {/* Coins Earned */}
          <div className="col-span-2 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between px-4">
            <span className="text-xs font-bold text-amber-200">Recompensa da Prova:</span>
            <div className="flex items-center gap-1.5 text-base font-black text-amber-400 font-mono">
              <Coins className="w-4 h-4" />
              <span>+{coinsEarned} Moedas</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col sm:flex-row items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => {
              sounds.playSelectLetter(0);
              onRestart();
            }}
            className="w-full sm:flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Correr Novamente</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playSelectLetter(0);
              onNextTrack();
            }}
            className="w-full sm:flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
          >
            <span>Ver Circuitos</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
