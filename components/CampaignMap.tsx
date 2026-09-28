'use client';

import React, { useState } from 'react';
import { CAMPAIGN_LEVELS, CAMPAIGN_WORLDS } from '@/lib/campaignData';
import { CampaignLevel, LevelProgress } from '@/types/game';
import { Sparkles, Lock, Play, ChevronRight, Trees, Apple, Globe, Cpu, Award } from 'lucide-react';
import { sounds } from '@/lib/soundEffects';

interface CampaignMapProps {
  progress: Record<number, LevelProgress>;
  totalStars: number;
  onSelectLevel: (level: CampaignLevel) => void;
}

const WORLD_ICONS: Record<string, React.ElementType> = {
  Trees,
  Apple,
  Globe,
  Cpu,
  Sparkles,
};

export const CampaignMap: React.FC<CampaignMapProps> = ({
  progress,
  totalStars,
  onSelectLevel,
}) => {
  const [selectedWorldId, setSelectedWorldId] = useState<number>(1);

  const selectedWorld = CAMPAIGN_WORLDS.find((w) => w.id === selectedWorldId) || CAMPAIGN_WORLDS[0];
  const levelsInWorld = CAMPAIGN_LEVELS.filter((lvl) => lvl.worldId === selectedWorldId);

  return (
    <div className="w-full flex flex-col gap-6 max-w-5xl mx-auto">
      {/* Hero Banner with World Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5 fill-amber-400" />
              <span>Modo Aventura Progressiva</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Trilha de Fases
            </h2>
            <p className="text-sm sm:text-base text-slate-400 mt-1 max-w-xl">
              Avance pelos mundos temáticos. Cada nível aumenta o tamanho da grade e desbloqueia novas direções e desafios.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-950/80 px-4 py-3 rounded-2xl border border-slate-800 shrink-0">
            <Sparkles className="w-5 h-5 text-amber-400 fill-amber-400" />
            <div className="flex flex-col">
              <span className="text-[11px] text-slate-400 font-semibold">Total de Estrelas</span>
              <span className="text-lg font-black text-amber-300 leading-none">{totalStars} / 60</span>
            </div>
          </div>
        </div>
      </div>

      {/* World Selection Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
        {CAMPAIGN_WORLDS.map((world) => {
          const isUnlocked = totalStars >= world.requiredStars;
          const isSelected = world.id === selectedWorldId;
          const IconComp = WORLD_ICONS[world.icon] || Sparkles;

          return (
            <button
              key={world.id}
              onClick={() => {
                sounds.playSelectLetter(0);
                setSelectedWorldId(world.id);
              }}
              type="button"
              className={`
                relative flex flex-col items-center justify-center p-3.5 rounded-2xl border text-center transition-all cursor-pointer
                ${isSelected
                  ? 'bg-slate-900 border-amber-400 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/40'
                  : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'}
                ${!isUnlocked ? 'opacity-70' : ''}
              `}
            >
              <div
                className={`
                  w-10 h-10 rounded-xl flex items-center justify-center mb-2 transition-transform
                  ${isSelected
                    ? 'bg-amber-400 text-slate-950 font-black scale-105'
                    : 'bg-slate-900 text-slate-300 border border-slate-800'}
                `}
              >
                {isUnlocked ? (
                  <IconComp className="w-5 h-5" />
                ) : (
                  <Lock className="w-4 h-4 text-slate-500" />
                )}
              </div>

              <span className="text-xs font-bold text-slate-200 truncate w-full">
                {world.name.split(':')[0]}
              </span>

              {!isUnlocked && (
                <span className="text-[10px] text-amber-400 font-semibold mt-1">
                  Requer {world.requiredStars} ★
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected World Level Cards */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="text-xl font-black text-white">{selectedWorld.name}</h3>
            <p className="text-xs text-slate-400">{selectedWorld.description}</p>
          </div>

          {totalStars < selectedWorld.requiredStars && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
              <Lock className="w-3.5 h-3.5" />
              <span>Bloqueado (necessário {selectedWorld.requiredStars} estrelas)</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {levelsInWorld.map((lvl, index) => {
            const worldUnlocked = totalStars >= selectedWorld.requiredStars;
            // Level is unlocked if it's the first in world or previous level completed
            const prevLevel = CAMPAIGN_LEVELS.find((l) => l.id === lvl.id - 1);
            const prevCompleted = !prevLevel || progress[prevLevel.id]?.completed;
            const isLevelUnlocked = worldUnlocked && (index === 0 || prevCompleted);

            const lvlProgress = progress[lvl.id];
            const stars = lvlProgress?.stars || 0;

            const difficultyColors: Record<string, string> = {
              facil: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
              medio: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
              dificil: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
              mestre: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
            };

            return (
              <div
                key={lvl.id}
                className={`
                  relative flex flex-col justify-between p-5 rounded-3xl border transition-all duration-200
                  ${isLevelUnlocked
                    ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:shadow-xl hover:scale-[1.02]'
                    : 'bg-slate-950/40 border-slate-800/60 opacity-60'}
                `}
              >
                <div>
                  {/* Top tags */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded-lg bg-slate-950 text-slate-300 text-xs font-mono font-bold border border-slate-800">
                      Fase {lvl.levelNumber}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase border ${
                        difficultyColors[lvl.difficulty]
                      }`}
                    >
                      {lvl.difficulty}
                    </span>
                  </div>

                  <h4 className="text-base font-black text-white mb-1">{lvl.title}</h4>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                    {lvl.description}
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mb-4">
                    <span>Grade {lvl.gridSize}x{lvl.gridSize}</span>
                    <span>•</span>
                    <span>{lvl.wordCount} palavras</span>
                  </div>
                </div>

                {/* Bottom: Stars & Play Button */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  {/* Stars earned */}
                  <div className="flex items-center gap-1">
                    {[1, 2, 3].map((s) => (
                      <Sparkles
                        key={s}
                        className={`w-4 h-4 ${
                          s <= stars
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-700'
                        }`}
                      />
                    ))}
                  </div>

                  {isLevelUnlocked ? (
                    <button
                      onClick={() => {
                        sounds.playSelectLetter(0);
                        onSelectLevel(lvl);
                      }}
                      type="button"
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-md shadow-amber-500/20 active:scale-95 transition-all"
                    >
                      <span>Jogar</span>
                      <Play className="w-3 h-3 fill-current" />
                    </button>
                  ) : (
                    <div className="flex items-center gap-1 text-slate-600 text-xs font-semibold">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Bloqueado</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
