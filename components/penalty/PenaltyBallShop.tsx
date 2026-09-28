'use client';

import React from 'react';
import { BALL_SKINS, BallSkin } from '@/lib/penaltyData';
import { X, Sparkles, Check, Lock } from 'lucide-react';
import { sounds } from '@/lib/soundEffects';

interface PenaltyBallShopProps {
  isOpen: boolean;
  coins: number;
  selectedBallId: string;
  unlockedBallIds: string[];
  onSelectBall: (id: string) => void;
  onBuyBall: (ball: BallSkin) => void;
  onClose: () => void;
}

export const PenaltyBallShop: React.FC<PenaltyBallShopProps> = ({
  isOpen,
  coins,
  selectedBallId,
  unlockedBallIds,
  onSelectBall,
  onBuyBall,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">Vestiário de Bolas</h3>
              <p className="text-xs text-slate-400">Personalize a bola com rastros e efeitos visuais</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-amber-400 font-black text-xs font-mono">
              {coins} 🪙
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Balls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
          {BALL_SKINS.map((ball) => {
            const isUnlocked = unlockedBallIds.includes(ball.id);
            const isEquipped = selectedBallId === ball.id;
            const canAfford = coins >= ball.price;

            return (
              <div
                key={ball.id}
                className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 transition-all ${
                  isEquipped
                    ? 'bg-amber-500/10 border-amber-500/40 shadow-lg shadow-amber-500/10'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Ball Preview Circle */}
                  <div
                    className="w-12 h-12 rounded-full border-2 border-slate-700 shadow-md flex items-center justify-center relative overflow-hidden"
                    style={{ backgroundColor: ball.color1 }}
                  >
                    <div
                      className="w-5 h-5 rounded-full"
                      style={{ backgroundColor: ball.color2 }}
                    />
                  </div>

                  <div className="flex flex-col">
                    <span className="text-sm font-black text-white">{ball.name}</span>
                    <span className="text-[11px] text-slate-400">
                      {ball.price === 0 ? 'Padrão Inicial' : `${ball.price} Moedas`}
                    </span>
                  </div>
                </div>

                {/* Action button */}
                {isEquipped ? (
                  <div className="w-full py-2 rounded-xl bg-emerald-500/20 text-emerald-400 font-black text-xs flex items-center justify-center gap-1.5 border border-emerald-500/40">
                    <Check className="w-3.5 h-3.5" />
                    <span>EQUIPADA</span>
                  </div>
                ) : isUnlocked ? (
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playSelectLetter(0);
                      onSelectBall(ball.id);
                    }}
                    className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    Equipar
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={!canAfford}
                    onClick={() => {
                      if (canAfford) {
                        sounds.playUnlockAchievement();
                        onBuyBall(ball);
                      }
                    }}
                    className={`w-full py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                      canAfford
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md cursor-pointer hover:brightness-110'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Desbloquear ({ball.price} 🪙)</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
