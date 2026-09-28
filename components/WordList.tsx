'use client';

import React from 'react';
import { PlacedWord } from '@/types/game';
import { getWordColor } from '@/lib/colors';
import { Check, Info, HelpCircle } from 'lucide-react';

interface WordListProps {
  placedWords: PlacedWord[];
  onWordClick?: (word: PlacedWord) => void;
  showClues?: boolean;
}

export const WordList: React.FC<WordListProps> = ({
  placedWords,
  onWordClick,
  showClues = false,
}) => {
  const foundCount = placedWords.filter(w => w.isFound).length;
  const totalCount = placedWords.length;
  const progressPercent = Math.round((foundCount / (totalCount || 1)) * 100);

  return (
    <div className="w-full bg-slate-900/90 rounded-2xl border border-slate-800 p-4 shadow-xl backdrop-blur-sm flex flex-col gap-3">
      {/* Header with Progress Bar */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs sm:text-sm">
          <span className="font-bold text-slate-200 flex items-center gap-1.5">
            <span>Palavras</span>
            <span className="text-slate-400 font-normal">
              ({foundCount} de {totalCount})
            </span>
          </span>
          <span className="font-extrabold text-amber-400">{progressPercent}%</span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800/80">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-400 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Words Grid / Flow */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto pr-1">
        {placedWords.map((item) => {
          const colorTheme = getWordColor(item.colorIndex);

          if (item.isFound) {
            return (
              <button
                key={item.id}
                onClick={() => onWordClick?.(item)}
                type="button"
                className={`
                  flex items-center justify-between px-2.5 py-1.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all text-left
                  ${colorTheme.badgeBg} line-through decoration-current hover:brightness-125
                `}
                title="Clique para ver curiosidade sobre esta palavra"
              >
                <span className="truncate pr-1">{item.displayWord}</span>
                <Check className="w-3.5 h-3.5 shrink-0" />
              </button>
            );
          }

          return (
            <div
              key={item.id}
              className={`
                group relative flex flex-col justify-center px-2.5 py-1.5 rounded-xl border border-slate-800 bg-slate-950/60 text-slate-300 text-xs sm:text-sm font-medium
                hover:border-slate-700 hover:text-white transition-colors
              `}
            >
              <div className="flex items-center justify-between">
                <span className="truncate">{item.displayWord}</span>
                {item.clue && (
                  <span
                    title={item.clue}
                    className="text-slate-500 hover:text-amber-400 cursor-help"
                  >
                    <HelpCircle className="w-3 h-3" />
                  </span>
                )}
              </div>

              {/* Optional inline clue if revealed via hint */}
              {item.hintRevealed && item.clue && (
                <span className="text-[10px] text-amber-400/90 leading-tight mt-0.5 italic truncate">
                  💡 {item.clue}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-slate-500 text-center">
        Dica: toque em uma palavra encontrada para ver uma curiosidade educativa.
      </p>
    </div>
  );
};
