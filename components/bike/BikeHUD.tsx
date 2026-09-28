'use client';

import React from 'react';
import {
  Gauge,
  Zap,
  Bell,
  Coins,
  Flag,
  ArrowLeft,
  ArrowRight,
  ShieldAlert,
  Flame,
  Target,
  Rocket,
  Timer,
  Trophy,
} from 'lucide-react';

interface BikeHUDProps {
  speedKmh: number;
  stamina: number;
  cadenceRpm: number;
  rank: number;
  totalRivals: number;
  progressPercent: number;
  coinsCollected: number;
  isDrafting: boolean;
  isSprinting: boolean;
  distanceLeftMeters: number;
  trackName: string;
  overtakesCount?: number;
  overtakeStreak?: number;
  slingshotCharge?: number;
  nextRivalName?: string | null;
  nextRivalDistance?: number | null;
  rushTimeLeft?: number;
  rushScore?: number;
  gameMode?: 'grand-tour' | 'overtake-rush';
  onSteerLeft: (active: boolean) => void;
  onSteerRight: (active: boolean) => void;
  onSprint: (active: boolean) => void;
  onBrake: (active: boolean) => void;
  onRingBell: () => void;
}

export const BikeHUD: React.FC<BikeHUDProps> = ({
  speedKmh,
  stamina,
  cadenceRpm,
  rank,
  totalRivals,
  progressPercent,
  coinsCollected,
  isDrafting: _isDrafting,
  isSprinting,
  distanceLeftMeters,
  trackName,
  overtakesCount = 0,
  overtakeStreak = 0,
  slingshotCharge = 0,
  nextRivalName,
  nextRivalDistance,
  rushTimeLeft,
  rushScore,
  gameMode = 'grand-tour',
  onSteerLeft,
  onSteerRight,
  onSprint,
  onBrake,
  onRingBell,
}) => {
  const getRankBadgeColor = (r: number) => {
    if (r === 1) return 'bg-amber-400 text-slate-950 ring-2 ring-amber-300';
    if (r === 2) return 'bg-slate-300 text-slate-950 ring-2 ring-slate-200';
    if (r === 3) return 'bg-amber-700 text-white ring-2 ring-amber-600';
    return 'bg-slate-800 text-slate-300';
  };

  const isRush = gameMode === 'overtake-rush';

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Target Tracker & Slingshot Indicator Banner */}
      <div className="w-full p-2.5 sm:p-3 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-md flex flex-wrap items-center justify-between gap-2">
        {/* Next Rival Ahead Target */}
        <div className="flex items-center gap-2 text-xs">
          <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
              {nextRivalName ? 'Próximo Alvo para Ultrapassar' : 'Líder da Corrida'}
            </span>
            <span className="font-extrabold text-white">
              {nextRivalName ? (
                <>
                  <span className="text-cyan-300">{nextRivalName}</span> • a{' '}
                  <span className="text-amber-400 font-mono">{nextRivalDistance}m</span> à frente
                </>
              ) : (
                <span className="text-emerald-400">Você está em 1º Lugar! Mantenha o ritmo!</span>
              )}
            </span>
          </div>
        </div>

        {/* Slingshot / Overtake Counter */}
        <div className="flex items-center gap-3">
          {/* Slingshot meter */}
          <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
            <Rocket
              className={`w-4 h-4 ${
                slingshotCharge >= 70 ? 'text-cyan-400 animate-pulse' : 'text-slate-500'
              }`}
            />
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-400 font-bold uppercase">
                Estilingue de Vácuo
              </span>
              <div className="w-20 sm:w-28 h-2 bg-slate-800 rounded-full overflow-hidden mt-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-75 ${
                    slingshotCharge >= 70
                      ? 'bg-gradient-to-r from-cyan-400 to-emerald-400'
                      : 'bg-cyan-500'
                  }`}
                  style={{ width: `${slingshotCharge}%` }}
                />
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold text-cyan-300">
              {slingshotCharge}%
            </span>
          </div>

          {/* Overtakes Badge */}
          <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-xl text-amber-300 text-xs font-black">
            <Flame className="w-4 h-4 fill-current text-amber-400" />
            <span>
              {overtakesCount} {overtakesCount === 1 ? 'Ultrapassagem' : 'Ultrapassagens'}
            </span>
            {overtakeStreak > 1 && (
              <span className="bg-amber-400 text-slate-950 text-[10px] px-1.5 py-0.5 rounded-full">
                x{overtakeStreak} Combo!
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Top Overlay Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Speedometer */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-md">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Gauge className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
              Velocidade
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-black text-white font-mono leading-none">
                {speedKmh}
              </span>
              <span className="text-[11px] font-bold text-cyan-400">km/h</span>
            </div>
            <span className="text-[10px] text-slate-500">{cadenceRpm} RPM</span>
          </div>
        </div>

        {/* Stamina & Sprint Bar */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-md">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
              isSprinting
                ? 'bg-amber-500/20 text-amber-300 animate-pulse'
                : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
            }`}
          >
            <Zap className="w-5 h-5" />
          </div>
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                Vigor / Estamina
              </span>
              <span className="text-xs font-mono font-bold text-slate-200">
                {stamina}%
              </span>
            </div>
            {/* Stamina Progress Bar */}
            <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden mt-1 p-0.5 border border-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-75 ${
                  stamina > 40
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-400'
                    : stamina > 15
                    ? 'bg-amber-400'
                    : 'bg-rose-500 animate-pulse'
                }`}
                style={{ width: `${stamina}%` }}
              />
            </div>
            <span className="text-[9px] text-slate-500 mt-0.5">
              {stamina <= 10 ? 'Cansado! Poupe energia' : 'Segure Sprint p/ acelerar'}
            </span>
          </div>
        </div>

        {/* Current Position / Rank (Grand Tour) or Rush Score */}
        {isRush ? (
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-md">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                Pontuação Rush
              </span>
              <span className="text-xl sm:text-2xl font-black text-amber-300 font-mono leading-none">
                {rushScore || 0}
              </span>
              <span className="text-[10px] text-slate-500">Ultrapasse para somar!</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-md">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-base ${getRankBadgeColor(
                rank
              )}`}
            >
              {rank}º
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                Posição na Prova
              </span>
              <span className="text-sm font-bold text-white">
                {rank}º de {totalRivals} Ciclistas
              </span>
              <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                {trackName}
              </span>
            </div>
          </div>
        )}

        {/* Distance Remaining or Rush Countdown Timer */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-md">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
              {isRush ? 'Tempo Restante' : 'Faltam'}
            </span>
            <div className="flex items-center gap-1.5">
              {isRush ? (
                <>
                  <Timer
                    className={`w-4 h-4 ${(rushTimeLeft || 0) <= 10 ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`}
                  />
                  <span
                    className={`text-xl font-black font-mono leading-tight ${
                      (rushTimeLeft || 0) <= 10 ? 'text-rose-400 animate-pulse' : 'text-amber-300'
                    }`}
                  >
                    {rushTimeLeft || 0}s
                  </span>
                </>
              ) : (
                <span className="text-lg font-black text-amber-300 font-mono leading-tight">
                  {distanceLeftMeters}m
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-yellow-400 font-bold mt-0.5">
              <Coins className="w-3.5 h-3.5" />
              <span>+{coinsCollected}</span>
            </div>
          </div>

          {/* Quick Bell Button */}
          <button
            type="button"
            onClick={onRingBell}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-amber-400 border border-slate-700 transition-all cursor-pointer"
            title="Tocar Buzina / Sino (B)"
          >
            <Bell className="w-5 h-5 fill-current animate-bounce" />
            <span className="text-[9px] font-bold text-slate-300 mt-0.5">Sino (B)</span>
          </button>
        </div>
      </div>

      {/* Course Progression Ribbon */}
      <div className="w-full p-2.5 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-center gap-3">
        <span className="text-xs font-bold text-slate-400">Largada</span>
        <div className="relative flex-1 h-3 bg-slate-950 rounded-full border border-slate-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 via-amber-400 to-emerald-400 rounded-full transition-all duration-100"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex items-center gap-1 text-xs font-bold text-emerald-400">
          <Flag className="w-3.5 h-3.5" />
          <span>{isRush ? 'Meta Rush' : 'Chegada'}</span>
        </div>
      </div>

      {/* On-Screen Touch / Mouse Controls (Essential for mobile or clickers) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
        {/* Steer Left */}
        <button
          type="button"
          onPointerDown={() => onSteerLeft(true)}
          onPointerUp={() => onSteerLeft(false)}
          onPointerLeave={() => onSteerLeft(false)}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-slate-900 active:bg-cyan-500/20 active:border-cyan-400 border border-slate-800 text-slate-200 text-sm font-black transition-transform active:scale-95 cursor-pointer touch-none select-none"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Virar Esquerda (◄)</span>
        </button>

        {/* Steer Right */}
        <button
          type="button"
          onPointerDown={() => onSteerRight(true)}
          onPointerUp={() => onSteerRight(false)}
          onPointerLeave={() => onSteerRight(false)}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-slate-900 active:bg-cyan-500/20 active:border-cyan-400 border border-slate-800 text-slate-200 text-sm font-black transition-transform active:scale-95 cursor-pointer touch-none select-none"
        >
          <span>Virar Direita (►)</span>
          <ArrowRight className="w-5 h-5" />
        </button>

        {/* Sprint / Turbo */}
        <button
          type="button"
          onPointerDown={() => onSprint(true)}
          onPointerUp={() => onSprint(false)}
          onPointerLeave={() => onSprint(false)}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 active:from-amber-400 active:to-orange-400 text-slate-950 text-sm font-black shadow-lg shadow-amber-500/20 transition-transform active:scale-95 cursor-pointer touch-none select-none"
        >
          <Flame className="w-5 h-5 fill-current" />
          <span>Sprint Turbo (Espaço/Shift)</span>
        </button>

        {/* Brake */}
        <button
          type="button"
          onPointerDown={() => onBrake(true)}
          onPointerUp={() => onBrake(false)}
          onPointerLeave={() => onBrake(false)}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-slate-900 active:bg-rose-500/20 active:border-rose-400 border border-slate-800 text-rose-400 text-sm font-black transition-transform active:scale-95 cursor-pointer touch-none select-none"
        >
          <ShieldAlert className="w-5 h-5" />
          <span>Frear (▼)</span>
        </button>
      </div>

      {/* Helpful tactical tip */}
      <div className="text-center text-[11px] text-slate-400 bg-slate-950/60 py-2 px-3 rounded-xl border border-slate-800/80">
        🚀 <strong className="text-white">Dica de Ultrapassagem:</strong> Fique bem colado atrás de outro ciclista para carregar o <span className="text-cyan-400 font-bold">Estilingue de Vácuo (100%)</span> e depois puxe para o lado para ser arremessado à frente em supervelocidade!
      </div>
    </div>
  );
};
