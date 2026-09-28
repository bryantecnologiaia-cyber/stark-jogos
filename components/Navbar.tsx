'use client';

import React from 'react';
import { Volume2, VolumeX, Sparkles, Trophy, Map, Compass, Calendar, Wand2, Bike } from 'lucide-react';
import { sounds } from '@/lib/soundEffects';

interface NavbarProps {
  activeGame: 'wordsearch' | 'bike' | 'penalty';
  onSelectGame: (game: 'wordsearch' | 'bike' | 'penalty') => void;
  currentTab: 'campaign' | 'freeplay' | 'daily' | 'custom';
  onSelectTab: (tab: 'campaign' | 'freeplay' | 'daily' | 'custom') => void;
  totalStars: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenStats: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeGame,
  onSelectGame,
  currentTab,
  onSelectTab,
  totalStars,
  soundEnabled,
  onToggleSound,
  onOpenStats,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-slate-950/90 border-b border-slate-800/80">
      {/* Top Main Switcher Bar */}
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Game Switcher */}
        <div className="flex items-center gap-3">
          <div 
            onClick={() => onSelectGame('penalty')}
            className="flex items-center gap-2.5 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-emerald-500 to-cyan-500 p-[2px] shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-200">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center font-black text-transparent bg-clip-text bg-gradient-to-tr from-amber-400 to-cyan-300 text-base">
                {activeGame === 'penalty' ? '⚽' : activeGame === 'bike' ? '🚴' : 'CP'}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-extrabold text-base sm:text-lg tracking-tight text-white flex items-center gap-1">
                  {activeGame === 'penalty' ? 'Super Pênalti' : activeGame === 'bike' ? 'Pedal Radical' : 'Caça-Palavras'}
                  <span className="text-amber-400 font-semibold text-xs px-1.5 py-0.5 rounded bg-amber-400/10 border border-amber-400/30">
                    {activeGame === 'penalty' ? 'Copa 3D' : activeGame === 'bike' ? 'Ciclismo 3D' : 'Infinito'}
                  </span>
                </h1>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                {activeGame === 'penalty'
                  ? 'Disputa de pênaltis contra os melhores goleiros'
                  : activeGame === 'bike'
                  ? 'Corrida de alta velocidade sobre duas rodas'
                  : 'Desafios temáticos e níveis progressivos'}
              </p>
            </div>
          </div>

          {/* Primary Game Mode Switcher Pills */}
          <div className="flex items-center bg-slate-900 p-1 rounded-2xl border border-slate-800 ml-1 sm:ml-3 overflow-x-auto">
            <button
              type="button"
              onClick={() => {
                sounds.playSelectLetter(0);
                onSelectGame('penalty');
              }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                activeGame === 'penalty'
                  ? 'bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 shadow-md shadow-emerald-400/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>⚽ Super Pênalti</span>
              <span className="text-[9px] bg-red-500 text-white font-bold px-1 rounded-full uppercase">Novo</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sounds.playSelectLetter(0);
                onSelectGame('bike');
              }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                activeGame === 'bike'
                  ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 shadow-md shadow-cyan-400/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Bike className="w-3.5 h-3.5" />
              <span>Corrida de Bike</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sounds.playSelectLetter(0);
                onSelectGame('wordsearch');
              }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                activeGame === 'wordsearch'
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🔤 Caça-Palavras</span>
            </button>
          </div>
        </div>

        {/* Right Actions: Stars, Sound, Stats */}
        <div className="flex items-center gap-2">
          {/* Total Stars Pill */}
          {activeGame === 'wordsearch' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs sm:text-sm font-bold shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>{totalStars}</span>
            </div>
          )}

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={onToggleSound}
            title={soundEnabled ? 'Silenciar Efeitos' : 'Ativar Sons'}
            aria-label={soundEnabled ? 'Silenciar Sons' : 'Ativar Sons'}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </button>

          {/* Stats & Achievements */}
          {activeGame === 'wordsearch' && (
            <button
              type="button"
              onClick={onOpenStats}
              title="Estatísticas e Conquistas"
              aria-label="Estatísticas e Conquistas"
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
            </button>
          )}
        </div>
      </div>

      {/* Word Search Subnavigation Tabs (when activeGame === 'wordsearch') */}
      {activeGame === 'wordsearch' && (
        <div className="border-t border-slate-900/60 bg-slate-950/60">
          <div className="max-w-6xl mx-auto px-4 py-1.5 flex items-center justify-start overflow-x-auto gap-1">
            <button
              type="button"
              onClick={() => {
                sounds.playSelectLetter(0);
                onSelectTab('campaign');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                currentTab === 'campaign'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              <span>Aventura (Fases)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sounds.playSelectLetter(0);
                onSelectTab('freeplay');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                currentTab === 'freeplay'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Temas Livres</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sounds.playSelectLetter(0);
                onSelectTab('daily');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                currentTab === 'daily'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Desafio Diário</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sounds.playSelectLetter(0);
                onSelectTab('custom');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                currentTab === 'custom'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md shadow-purple-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Criador IA</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

