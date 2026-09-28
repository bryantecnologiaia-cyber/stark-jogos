'use client';

import React, { useState } from 'react';
import { GoalkeeperRival, PenaltyMode, ShootoutRound, MatchPhase, RivalStriker } from '@/types/penaltyGame';
import {
  Trophy,
  Zap,
  Target,
  RotateCcw,
  Sparkles,
  Flame,
  ChevronRight,
  ArrowUpLeft,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowDownRight,
  ArrowUp,
  ArrowDown,
  Shield,
  Crosshair,
} from 'lucide-react';
import { sounds } from '@/lib/soundEffects';

interface PenaltyHUDProps {
  mode: PenaltyMode;
  phase: MatchPhase;
  goalkeeper: GoalkeeperRival;
  striker?: RivalStriker;
  rounds: ShootoutRound[];
  currentRoundIndex: number;
  playerGoals: number;
  rivalGoals: number;
  playerSaves: number;
  arcadeScore: number;
  arcadeStreak: number;
  isKickingAllowed: boolean;
  onTriggerShot: (targetX: number, targetY: number, power: number, curve: number, isChip: boolean) => void;
  onTriggerGlovesDive: (x: number, y: number) => void;
  onNextRound: () => void;
  onResetMatch: () => void;
  onChangeMode: (mode: PenaltyMode) => void;
  onOpenBallShop: () => void;
  coins: number;
}

export const PenaltyHUD: React.FC<PenaltyHUDProps> = ({
  mode,
  phase,
  goalkeeper,
  striker,
  rounds,
  currentRoundIndex: _currentRoundIndex,
  playerGoals,
  rivalGoals,
  playerSaves,
  arcadeScore,
  arcadeStreak,
  isKickingAllowed,
  onTriggerShot,
  onTriggerGlovesDive,
  onNextRound,
  onResetMatch,
  onChangeMode,
  onOpenBallShop,
  coins,
}) => {
  // Manual tuning states for button shooters
  const [selectedZone, setSelectedZone] = useState<{ x: number; y: number; name: string }>({
    x: 0.75,
    y: 0.85,
    name: 'Gaveta Direita',
  });
  const [power, setPower] = useState<number>(85); // 0-100%
  const [curve, setCurve] = useState<number>(0); // -40 to +40
  const [isChip, setIsChip] = useState<boolean>(false);

  // Exact target zones with explicit Travessão!
  const zones = [
    { name: 'Ângulo Esquerdo', x: -0.75, y: 0.85, icon: ArrowUpLeft },
    { name: 'Travessão', x: 0, y: 1.0, icon: ArrowUp }, // 100% hits crossbar!
    { name: 'Gaveta Direita', x: 0.75, y: 0.85, icon: ArrowUpRight },
    { name: 'Canto Esquerdo', x: -0.78, y: 0.2, icon: ArrowDownLeft },
    { name: 'Cavadinha no Meio', x: 0, y: 0.45, icon: ArrowDown, chip: true },
    { name: 'Canto Direito', x: 0.78, y: 0.2, icon: ArrowDownRight },
  ];

  const handleShootClick = () => {
    if (!isKickingAllowed) return;
    onTriggerShot(
      selectedZone.x,
      selectedZone.y,
      power / 100,
      curve / 40,
      isChip || selectedZone.name.includes('Cavadinha')
    );
  };

  return (
    <div className="w-full flex flex-col gap-3 select-none">
      {/* Top Banner: Mode Selector & Scoreboard */}
      <div className="w-full p-4 rounded-3xl bg-slate-900/90 border border-slate-800 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        {/* Match / Cup Scoreboard */}
        {mode === 'cup' || mode === 'goalkeeper' || mode === 'striker' ? (
          <div className="flex items-center gap-4">
            {/* Player Team (Brasil) */}
            <div className="flex items-center gap-2">
              <span className="text-2xl">🇧🇷</span>
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-black text-white">BRASIL</span>
                  {playerSaves > 0 && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-1.5 py-0.2 rounded border border-emerald-500/30">
                      🧤 {playerSaves} defesas
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  {rounds.slice(0, 5).map((r, i) => (
                    <div
                      key={i}
                      className={`w-3.5 h-3.5 rounded-full border border-slate-700 flex items-center justify-center text-[8px] font-bold ${
                        r.playerScore === 'goal'
                          ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                          : r.playerScore === 'saved' || r.playerScore === 'post' || r.playerScore === 'miss'
                          ? 'bg-rose-500 border-rose-400 text-white'
                          : 'bg-slate-800'
                      }`}
                    >
                      {r.playerScore === 'goal' ? '✓' : r.playerScore ? '✗' : ''}
                    </div>
                  ))}
                </div>
              </div>
              <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 ml-1">
                {playerGoals}
              </span>
            </div>

            <span className="text-sm font-bold text-slate-500">X</span>

            {/* Rival Team */}
            <div className="flex items-center gap-2">
              <span className="text-2xl sm:text-3xl font-black font-mono text-rose-400 mr-1">
                {rivalGoals}
              </span>
              <div className="flex flex-col items-end">
                <span className="text-xs font-black text-white uppercase">{goalkeeper.team}</span>
                <div className="flex items-center gap-1 mt-0.5">
                  {rounds.slice(0, 5).map((r, i) => (
                    <div
                      key={i}
                      className={`w-3.5 h-3.5 rounded-full border border-slate-700 flex items-center justify-center text-[8px] font-bold ${
                        r.rivalScore === 'goal'
                          ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                          : r.rivalScore === 'saved' || r.rivalScore === 'post' || r.rivalScore === 'miss'
                          ? 'bg-rose-500 border-rose-400 text-white'
                          : 'bg-slate-800'
                      }`}
                    >
                      {r.rivalScore === 'goal' ? '✓' : r.rivalScore ? '✗' : ''}
                    </div>
                  ))}
                </div>
              </div>
              <span className="text-2xl">{goalkeeper.flag}</span>
            </div>
          </div>
        ) : (
          /* Arcade Points Banner */
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Target className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Pontuação Arcade</span>
                <span className="text-2xl font-black text-amber-300 font-mono leading-none">
                  {arcadeScore} pts
                </span>
              </div>
            </div>

            {arcadeStreak > 1 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black animate-pulse">
                <Flame className="w-4 h-4 fill-current text-amber-400" />
                <span>Combo x{arcadeStreak}!</span>
              </div>
            )}
          </div>
        )}

        {/* Right side: Coins & Shop button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              sounds.playSelectLetter(0);
              onOpenBallShop();
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Vestiário ({coins} 🪙)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playSelectLetter(0);
              onResetMatch();
            }}
            className="p-2 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Reiniciar Disputa"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex items-center justify-start gap-1 p-1 bg-slate-900 rounded-2xl border border-slate-800 overflow-x-auto">
        <button
          type="button"
          onClick={() => {
            sounds.playSelectLetter(0);
            onChangeMode('cup');
          }}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
            mode === 'cup'
              ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>Copa (Chuta & Defende)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            sounds.playSelectLetter(1);
            onChangeMode('goalkeeper');
          }}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
            mode === 'goalkeeper'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Modo Goleiro (Só Defesas)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            sounds.playSelectLetter(2);
            onChangeMode('striker');
          }}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
            mode === 'striker'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Crosshair className="w-3.5 h-3.5" />
          <span>Modo Cobrador (Só Chutes)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            sounds.playSelectLetter(3);
            onChangeMode('arcade');
          }}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
            mode === 'arcade'
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          <span>Treino de Alvos</span>
        </button>
      </div>

      {/* DYNAMIC DASHBOARD: Depends on whether it is SHOOTING or DEFENDING turn */}
      {phase === 'shoot' ? (
        /* ==================== SHOOTING DASHBOARD ==================== */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-3xl bg-slate-900/90 border border-slate-800 backdrop-blur-md">
          {/* Column 1: Exact Zone Target Picker */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-cyan-400" />
              <span>Ponto de Mira: <strong className="text-white">{selectedZone.name}</strong></span>
            </span>

            <div className="grid grid-cols-3 gap-2">
              {zones.map((z) => {
                const Icon = z.icon;
                const isSelected = selectedZone.name === z.name;

                return (
                  <button
                    key={z.name}
                    type="button"
                    onClick={() => {
                      sounds.playSelectLetter(0);
                      setSelectedZone(z);
                      if (z.chip) setIsChip(true);
                      else setIsChip(false);
                    }}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/20 scale-[1.02]'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4 mb-0.5" />
                    <span className="text-[10px] text-center leading-tight truncate w-full">
                      {z.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Column 2: Power & Curve Sliders */}
          <div className="flex flex-col justify-between gap-3">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-bold flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Força do Chute</span>
                </span>
                <span className="font-mono font-black text-amber-300">{power}%</span>
              </div>
              <input
                type="range"
                min="40"
                max="100"
                value={power}
                onChange={(e) => setPower(Number(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-slate-500 font-bold">
                <span>Colocada (40%)</span>
                <span>Bomba (100%)</span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-bold">Efeito / Curva</span>
                <span className="font-mono font-bold text-cyan-400">
                  {curve < 0 ? `Curva Esquerda (${Math.abs(curve)})` : curve > 0 ? `Curva Direita (+${curve})` : 'Seco / Reto'}
                </span>
              </div>
              <input
                type="range"
                min="-35"
                max="35"
                value={curve}
                onChange={(e) => setCurve(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>

          {/* Column 3: Shoot Button or Next Round */}
          <div className="flex flex-col justify-center gap-2">
            {isKickingAllowed ? (
              <button
                type="button"
                onClick={handleShootClick}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-base shadow-xl shadow-emerald-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>CHUTAR NO GOL!</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  sounds.playSelectLetter(0);
                  onNextRound();
                }}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-base shadow-xl shadow-amber-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer animate-pulse"
              >
                <span>PRÓXIMO LANCE</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            )}

            <div className="text-center text-[10px] text-slate-400">
              💡 Toque no gol para posicionar a mira, ou selecione <strong>Travessão</strong> para carimbar o poste superior!
            </div>
          </div>
        </div>
      ) : (
        /* ==================== GOALKEEPER DEFENSE DASHBOARD ==================== */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-3xl bg-slate-900/90 border border-emerald-500/30 backdrop-blur-md">
          {/* Column 1: Goalkeeper Status */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-2xl shadow-lg shadow-emerald-500/10">
              🧤
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                Goleiro Titular do Brasil
              </span>
              <span className="text-base font-black text-white">Alisson Becker</span>
              <span className="text-xs text-slate-400">
                Cobrador rival: <strong>{striker?.name || 'Atacante'}</strong> {striker?.flag}
              </span>
            </div>
          </div>

          {/* Column 2: Quick Dive Buttons */}
          <div className="flex flex-col gap-1.5 justify-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase">
              Mergulho Rápido de Luvas:
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  sounds.playSelectLetter(0);
                  onTriggerGlovesDive(-0.7, 0.5);
                }}
                className="py-2 px-1 rounded-xl bg-slate-950 border border-slate-700 hover:border-emerald-400 text-slate-200 font-bold text-xs text-center transition-all cursor-pointer"
              >
                ⬅️ Esquerda
              </button>
              <button
                type="button"
                onClick={() => {
                  sounds.playSelectLetter(0);
                  onTriggerGlovesDive(0, 0.6);
                }}
                className="py-2 px-1 rounded-xl bg-slate-950 border border-slate-700 hover:border-emerald-400 text-slate-200 font-bold text-xs text-center transition-all cursor-pointer"
              >
                ⬆️ Centro
              </button>
              <button
                type="button"
                onClick={() => {
                  sounds.playSelectLetter(0);
                  onTriggerGlovesDive(0.7, 0.5);
                }}
                className="py-2 px-1 rounded-xl bg-slate-950 border border-slate-700 hover:border-emerald-400 text-slate-200 font-bold text-xs text-center transition-all cursor-pointer"
              >
                ➡️ Direita
              </button>
            </div>
          </div>

          {/* Column 3: Defend Action / Next Turn */}
          <div className="flex flex-col justify-center gap-2">
            {!isKickingAllowed ? (
              <button
                type="button"
                onClick={() => {
                  sounds.playSelectLetter(0);
                  onNextRound();
                }}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-base shadow-xl shadow-emerald-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer animate-pulse"
              >
                <span>PRÓXIMO LANCE</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <div className="w-full py-3 px-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold text-center">
                <span>⚡ O atacante adversário vai chutar! Arraste as luvas na tela para espalmar!</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
