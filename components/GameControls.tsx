'use client';

import React from 'react';
import { Timer, Pause, Play, RotateCcw, Lightbulb, Compass, Zap, Flame } from 'lucide-react';

interface GameControlsProps {
  timeSeconds: number;
  isPaused: boolean;
  onTogglePause: () => void;
  onRestart: () => void;
  onRadarHint: () => void;
  onClueHint: () => void;
  onRevealWordHint: () => void;
  hintsRemaining: {
    radar: number;
    clue: number;
    reveal: number;
  };
  comboStreak: number;
  comboMultiplier: number;
}

export const GameControls: React.FC<GameControlsProps> = ({
  timeSeconds,
  isPaused,
  onTogglePause,
  onRestart,
  onRadarHint,
  onClueHint,
  onRevealWordHint,
  hintsRemaining,
  comboStreak,
  comboMultiplier,
}) => {
  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-sm">
      {/* Timer & Pause */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono text-sm sm:text-base font-bold shadow-inner">
          <Timer className="w-4 h-4 text-emerald-400" />
          <span>{formatTime(timeSeconds)}</span>
        </div>

        <button
          onClick={onTogglePause}
          type="button"
          title={isPaused ? 'Continuar jogo' : 'Pausar jogo'}
          className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
        >
          {isPaused ? (
            <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
          ) : (
            <Pause className="w-4 h-4 text-amber-400" />
          )}
        </button>

        <button
          onClick={onRestart}
          type="button"
          title="Reiniciar partida com a mesma grade"
          className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Combo streak banner */}
      {comboStreak > 1 && (
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-amber-500/40 text-amber-300 text-xs sm:text-sm font-extrabold animate-bounce">
          <Flame className="w-4 h-4 text-orange-400 fill-orange-400" />
          <span>COMBO {comboMultiplier}x!</span>
        </div>
      )}

      {/* Hint Actions */}
      <div className="flex items-center gap-1.5">
        {/* Radar Hint */}
        <button
          onClick={onRadarHint}
          disabled={hintsRemaining.radar <= 0 || isPaused}
          type="button"
          title={`Bússola: Localiza a 1ª letra de uma palavra (${hintsRemaining.radar} restantes)`}
          className={`
            flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all
            ${hintsRemaining.radar > 0 && !isPaused
              ? 'bg-slate-950 border-amber-500/40 text-amber-300 hover:bg-amber-500/20 hover:border-amber-400'
              : 'bg-slate-950/40 border-slate-800 text-slate-600 cursor-not-allowed'}
          `}
        >
          <Compass className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Radar</span>
          <span className="px-1 py-0.2 rounded bg-amber-400/20 text-[10px] text-amber-300 font-mono">
            {hintsRemaining.radar}
          </span>
        </button>

        {/* Clue Hint */}
        <button
          onClick={onClueHint}
          disabled={hintsRemaining.clue <= 0 || isPaused}
          type="button"
          title={`Dica: Revela a pista da próxima palavra (${hintsRemaining.clue} restantes)`}
          className={`
            flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all
            ${hintsRemaining.clue > 0 && !isPaused
              ? 'bg-slate-950 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-400'
              : 'bg-slate-950/40 border-slate-800 text-slate-600 cursor-not-allowed'}
          `}
        >
          <Lightbulb className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Pista</span>
          <span className="px-1 py-0.2 rounded bg-cyan-400/20 text-[10px] text-cyan-300 font-mono">
            {hintsRemaining.clue}
          </span>
        </button>

        {/* Auto Reveal Hint */}
        <button
          onClick={onRevealWordHint}
          disabled={hintsRemaining.reveal <= 0 || isPaused}
          type="button"
          title={`Revelar: Marca 1 palavra completa (${hintsRemaining.reveal} restantes)`}
          className={`
            flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all
            ${hintsRemaining.reveal > 0 && !isPaused
              ? 'bg-slate-950 border-purple-500/40 text-purple-300 hover:bg-purple-500/20 hover:border-purple-400'
              : 'bg-slate-950/40 border-slate-800 text-slate-600 cursor-not-allowed'}
          `}
        >
          <Zap className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden sm:inline">Revelar</span>
          <span className="px-1 py-0.2 rounded bg-purple-400/20 text-[10px] text-purple-300 font-mono">
            {hintsRemaining.reveal}
          </span>
        </button>
      </div>
    </div>
  );
};
