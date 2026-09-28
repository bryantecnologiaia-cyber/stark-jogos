'use client';

import React, { useState } from 'react';
import { CATEGORIES } from '@/lib/categoriesData';
import { Category, Difficulty } from '@/types/game';
import { Play, Trees, Apple, Cpu, Sparkles, Globe, Flame, Trophy, Compass, Check } from 'lucide-react';
import { sounds } from '@/lib/soundEffects';

interface ModeSelectorProps {
  onStartGame: (category: Category, difficulty: Difficulty, wordCount: number) => void;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Trees,
  Apple,
  Cpu,
  Sparkles,
  Globe,
  Flame,
  Trophy,
  Compass,
};

export const ModeSelector: React.FC<ModeSelectorProps> = ({ onStartGame }) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(CATEGORIES[0].id);
  const [difficulty, setDifficulty] = useState<Difficulty>('medio');
  const [wordCount, setWordCount] = useState<number>(8);

  const selectedCategory = CATEGORIES.find((c) => c.id === selectedCategoryId) || CATEGORIES[0];

  const difficulties: {
    id: Difficulty;
    name: string;
    gridSize: number;
    directionsDesc: string;
    color: string;
  }[] = [
    {
      id: 'facil',
      name: 'Fácil',
      gridSize: 10,
      directionsDesc: 'Horizontal & Vertical (diretas)',
      color: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
    },
    {
      id: 'medio',
      name: 'Médio',
      gridSize: 12,
      directionsDesc: 'Horizontal, Vertical e Diagonais',
      color: 'border-amber-500/40 text-amber-400 bg-amber-500/10',
    },
    {
      id: 'dificil',
      name: 'Difícil',
      gridSize: 14,
      directionsDesc: '8 direções (inclui invertidas)',
      color: 'border-orange-500/40 text-orange-400 bg-orange-500/10',
    },
    {
      id: 'mestre',
      name: 'Mestre',
      gridSize: 16,
      directionsDesc: '8 direções, palavras longas e densas',
      color: 'border-purple-500/40 text-purple-400 bg-purple-500/10',
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6">
      {/* Header Banner */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-xl">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold mb-2">
          <Compass className="w-3.5 h-3.5" />
          <span>Partida Personalizada & Temática</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
          Escolha seu Tema & Desafio
        </h2>
        <p className="text-sm sm:text-base text-slate-400 mt-1 max-w-xl">
          Selecione uma categoria temática de palavras e configure o nível de dificuldade desejado.
        </p>
      </div>

      {/* Categories Grid */}
      <div className="flex flex-col gap-3">
        <h3 className="text-base font-bold text-slate-200">1. Escolha a Categoria:</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {CATEGORIES.map((cat) => {
            const isSelected = cat.id === selectedCategoryId;
            const Icon = CATEGORY_ICONS[cat.iconName] || Sparkles;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  sounds.playSelectLetter(0);
                  setSelectedCategoryId(cat.id);
                }}
                className={`
                  relative flex flex-col items-start p-4 rounded-2xl border text-left transition-all cursor-pointer
                  ${isSelected
                    ? 'bg-slate-900 border-amber-400 shadow-xl shadow-amber-500/10 ring-1 ring-amber-400/40 scale-[1.01]'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'}
                `}
              >
                <div className="w-full flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-400">
                    <Icon className="w-5 h-5" />
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>

                <h4 className="text-sm font-bold text-white mb-1">{cat.name}</h4>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {cat.description}
                </p>
                <span className="text-[11px] text-amber-400 font-medium mt-2">
                  {cat.words.length} palavras disponíveis
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Difficulty & Word Count Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Difficulty */}
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 flex flex-col gap-3">
          <h3 className="text-base font-bold text-slate-200">2. Nível de Dificuldade:</h3>

          <div className="grid grid-cols-2 gap-2">
            {difficulties.map((diff) => {
              const isSelected = diff.id === difficulty;
              return (
                <button
                  key={diff.id}
                  type="button"
                  onClick={() => {
                    sounds.playSelectLetter(0);
                    setDifficulty(diff.id);
                  }}
                  className={`
                    p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer
                    ${isSelected
                      ? 'bg-slate-950 border-amber-400 ring-1 ring-amber-400/40'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'}
                  `}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-black text-white">{diff.name}</span>
                    <span className="text-xs font-mono font-bold text-slate-400">
                      {diff.gridSize}x{diff.gridSize}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 leading-tight">
                    {diff.directionsDesc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Word Count & Start Game */}
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-200 mb-2">3. Quantidade de Palavras:</h3>
            <div className="flex items-center gap-2 mb-4">
              {[6, 8, 10, 12].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => {
                    sounds.playSelectLetter(0);
                    setWordCount(count);
                  }}
                  className={`
                    flex-1 py-2 rounded-xl border text-xs sm:text-sm font-bold transition-all cursor-pointer
                    ${wordCount === count
                      ? 'bg-amber-400 text-slate-950 border-amber-400 font-black'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'}
                  `}
                >
                  {count} palavras
                </button>
              ))}
            </div>
          </div>

          {/* Big Start Button */}
          <button
            onClick={() => {
              sounds.playSelectLetter(0);
              onStartGame(selectedCategory, difficulty, wordCount);
            }}
            type="button"
            className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-400 text-slate-950 font-black text-base shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-transform cursor-pointer"
          >
            <span>Iniciar Caça-Palavras</span>
            <Play className="w-5 h-5 fill-current" />
          </button>
        </div>
      </div>
    </div>
  );
};
