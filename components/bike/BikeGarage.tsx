'use client';

import React, { useState } from 'react';
import { Bike, BikeStorageData } from '@/types/bikeGame';
import { BIKES } from '@/lib/bikeData';
import { updateBikeStorage } from '@/lib/bikeStorage';
import { sounds } from '@/lib/soundEffects';
import {
  ArrowLeft,
  Coins,
  Check,
  Lock,
  Gauge,
  Zap,
  Shield,
  Palette,
  Sparkles,
} from 'lucide-react';

interface BikeGarageProps {
  storage: BikeStorageData;
  onUpdateStorage: (newStorage: BikeStorageData) => void;
  onBack: () => void;
}

const JERSEY_COLORS = [
  { name: 'Brasil Canarinho', hex: '#eab308' },
  { name: 'Itália Azzurra', hex: '#2563eb' },
  { name: 'França Tour', hex: '#f97316' },
  { name: 'Esmeralda Sprint', hex: '#10b981' },
  { name: 'Cyber Neon', hex: '#ec4899' },
  { name: 'Stealth Preto', hex: '#0f172a' },
  { name: 'Branco Clássico', hex: '#f8fafc' },
];

const HELMET_COLORS = [
  { name: 'Azul Aero', hex: '#0ea5e9' },
  { name: 'Dourado Campeão', hex: '#f59e0b' },
  { name: 'Vermelho Fúria', hex: '#ef4444' },
  { name: 'Verde Neon', hex: '#22c55e' },
  { name: 'Roxo Quântico', hex: '#a855f7' },
];

export const BikeGarage: React.FC<BikeGarageProps> = ({
  storage,
  onUpdateStorage,
  onBack,
}) => {
  const [selectedBikeId, setSelectedBikeId] = useState<string>(storage.selectedBikeId);
  const [jerseyColor, setJerseyColor] = useState<string>(storage.jerseyColor);
  const [helmetColor, setHelmetColor] = useState<string>(storage.helmetColor);

  const selectedBike = BIKES.find((b) => b.id === selectedBikeId) || BIKES[0];
  const isUnlocked = storage.unlockedBikes.includes(selectedBike.id);
  const isEquipped = storage.selectedBikeId === selectedBike.id;
  const canAfford = storage.coins >= selectedBike.priceCoins;

  // Equip bike
  const handleEquip = () => {
    sounds.playSelectLetter(0);
    const updated = updateBikeStorage((prev) => ({
      ...prev,
      selectedBikeId: selectedBike.id,
    }));
    onUpdateStorage(updated);
  };

  // Buy bike
  const handleBuy = () => {
    if (!canAfford) {
      sounds.playInvalid();
      return;
    }
    sounds.playCoinPickup();
    const updated = updateBikeStorage((prev) => ({
      ...prev,
      coins: prev.coins - selectedBike.priceCoins,
      unlockedBikes: [...prev.unlockedBikes, selectedBike.id],
      selectedBikeId: selectedBike.id,
    }));
    onUpdateStorage(updated);
  };

  // Change Jersey Color
  const handleSelectJersey = (hex: string) => {
    setJerseyColor(hex);
    sounds.playSelectLetter(0);
    const updated = updateBikeStorage((prev) => ({
      ...prev,
      jerseyColor: hex,
    }));
    onUpdateStorage(updated);
  };

  // Change Helmet Color
  const handleSelectHelmet = (hex: string) => {
    setHelmetColor(hex);
    sounds.playSelectLetter(0);
    const updated = updateBikeStorage((prev) => ({
      ...prev,
      helmetColor: hex,
    }));
    onUpdateStorage(updated);
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <button
          type="button"
          onClick={() => {
            sounds.playSelectLetter(0);
            onBack();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar aos Circuitos</span>
        </button>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm font-black font-mono">
          <Coins className="w-4 h-4 text-amber-400" />
          <span>{storage.coins} Moedas</span>
        </div>
      </div>

      {/* Main Garage Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Bike Cards List (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          <h3 className="text-base font-bold text-slate-200">Selecione sua Bicicleta:</h3>

          <div className="flex flex-col gap-3">
            {BIKES.map((bike) => {
              const unlocked = storage.unlockedBikes.includes(bike.id);
              const equipped = storage.selectedBikeId === bike.id;
              const isSelected = selectedBikeId === bike.id;

              return (
                <button
                  key={bike.id}
                  type="button"
                  onClick={() => {
                    sounds.playSelectLetter(0);
                    setSelectedBikeId(bike.id);
                  }}
                  className={`
                    p-4 rounded-2xl border text-left flex items-center justify-between gap-4 transition-all cursor-pointer
                    ${isSelected
                      ? 'bg-slate-900 border-cyan-400 ring-1 ring-cyan-400/40 shadow-lg'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/40'}
                  `}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-inner border border-white/20"
                      style={{ backgroundColor: bike.frameColor }}
                    >
                      🚴
                    </div>

                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-white">{bike.name}</span>
                        {equipped && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Equipada
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 mt-0.5">{bike.tagline}</span>
                      <span className="text-[11px] font-mono text-cyan-400 mt-1">
                        Top: {bike.topSpeed} km/h • Aceleração: {bike.acceleration}/10
                      </span>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div>
                    {unlocked ? (
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                        <Check className="w-4 h-4" />
                        <span>Pronta</span>
                      </span>
                    ) : (
                      <span className="text-xs font-black text-amber-400 flex items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/20">
                        <Coins className="w-3.5 h-3.5" />
                        <span>{bike.priceCoins}</span>
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Bike Specs & Customizer (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Bike Details Card */}
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">
                Especificações Técnicas
              </span>
              <span className="text-xs font-bold text-cyan-400 capitalize">
                Categoria: {selectedBike.category}
              </span>
            </div>

            <h4 className="text-lg font-black text-white">{selectedBike.name}</h4>

            {/* Stat Bars */}
            <div className="flex flex-col gap-2.5">
              {/* Top Speed */}
              <div>
                <div className="flex justify-between text-xs text-slate-300 font-bold mb-1">
                  <span className="flex items-center gap-1">
                    <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Velocidade Máxima</span>
                  </span>
                  <span className="font-mono text-cyan-300">{selectedBike.topSpeed} km/h</span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 rounded-full"
                    style={{ width: `${(selectedBike.topSpeed / 75) * 100}%` }}
                  />
                </div>
              </div>

              {/* Acceleration */}
              <div>
                <div className="flex justify-between text-xs text-slate-300 font-bold mb-1">
                  <span className="flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Aceleração & Sprint</span>
                  </span>
                  <span className="font-mono text-amber-300">{selectedBike.acceleration}/10</span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full"
                    style={{ width: `${(selectedBike.acceleration / 10) * 100}%` }}
                  />
                </div>
              </div>

              {/* Handling */}
              <div>
                <div className="flex justify-between text-xs text-slate-300 font-bold mb-1">
                  <span className="flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Controle & Curvas</span>
                  </span>
                  <span className="font-mono text-emerald-300">{selectedBike.handling}/10</span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 rounded-full"
                    style={{ width: `${(selectedBike.handling / 10) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Equip or Buy CTA Button */}
            {isUnlocked ? (
              <button
                type="button"
                onClick={handleEquip}
                disabled={isEquipped}
                className={`
                  w-full py-3.5 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all
                  ${isEquipped
                    ? 'bg-slate-800 text-slate-500 cursor-default'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-emerald-500/20 cursor-pointer'}
                `}
              >
                {isEquipped ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Equipada Atualmente</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Equipar Esta Bike</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleBuy}
                disabled={!canAfford}
                className={`
                  w-full py-3.5 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all
                  ${canAfford
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-amber-500/20 cursor-pointer'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'}
                `}
              >
                <Lock className="w-4 h-4" />
                <span>Desbloquear por {selectedBike.priceCoins} Moedas</span>
              </button>
            )}
          </div>

          {/* Cyclist Apparel Customizer */}
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-cyan-400" />
              <h4 className="text-sm font-bold text-white">Uniforme do Ciclista:</h4>
            </div>

            {/* Jersey Color Picker */}
            <div>
              <span className="text-xs text-slate-400 block mb-2">Cor da Camisa / Jersey:</span>
              <div className="flex flex-wrap gap-2">
                {JERSEY_COLORS.map((col) => (
                  <button
                    key={col.hex}
                    type="button"
                    onClick={() => handleSelectJersey(col.hex)}
                    style={{ backgroundColor: col.hex }}
                    className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer ${
                      jerseyColor === col.hex ? 'border-white scale-125 shadow-md' : 'border-slate-800 hover:scale-110'
                    }`}
                    title={col.name}
                  />
                ))}
              </div>
            </div>

            {/* Helmet Color Picker */}
            <div>
              <span className="text-xs text-slate-400 block mb-2">Cor do Capacete:</span>
              <div className="flex flex-wrap gap-2">
                {HELMET_COLORS.map((col) => (
                  <button
                    key={col.hex}
                    type="button"
                    onClick={() => handleSelectHelmet(col.hex)}
                    style={{ backgroundColor: col.hex }}
                    className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer ${
                      helmetColor === col.hex ? 'border-white scale-125 shadow-md' : 'border-slate-800 hover:scale-110'
                    }`}
                    title={col.name}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
