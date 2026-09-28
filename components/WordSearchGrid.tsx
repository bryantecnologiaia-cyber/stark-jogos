'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Coordinate, PlacedWord } from '@/types/game';
import { getSelectionPath, arePathsEqual } from '@/lib/wordSearchGenerator';
import { getWordColor } from '@/lib/colors';
import { sounds } from '@/lib/soundEffects';

interface WordSearchGridProps {
  matrix: string[][];
  placedWords: PlacedWord[];
  onWordFound: (word: PlacedWord) => void;
  hintedCell: Coordinate | null;
}

export const WordSearchGrid: React.FC<WordSearchGridProps> = ({
  matrix,
  placedWords,
  onWordFound,
  hintedCell,
}) => {
  const rows = matrix.length;
  const cols = matrix[0]?.length || 0;

  const [selectionStart, setSelectionStart] = useState<Coordinate | null>(null);
  const [currentPath, setCurrentPath] = useState<Coordinate[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const gridContainerRef = useRef<HTMLDivElement>(null);

  // Map each coordinate to found words
  const foundCellMap = React.useMemo(() => {
    const map = new Map<string, PlacedWord[]>();
    for (const pw of placedWords) {
      if (pw.isFound) {
        for (const coord of pw.path) {
          const key = `${coord.row},${coord.col}`;
          const list = map.get(key) || [];
          list.push(pw);
          map.set(key, list);
        }
      }
    }
    return map;
  }, [placedWords]);

  // Set of current selection keys for O(1) lookup
  const currentPathSet = React.useMemo(() => {
    const set = new Set<string>();
    for (const coord of currentPath) {
      set.add(`${coord.row},${coord.col}`);
    }
    return set;
  }, [currentPath]);

  // Determine which cell is at client coordinates (X, Y)
  const getCellFromPoint = useCallback(
    (clientX: number, clientY: number): Coordinate | null => {
      if (!gridContainerRef.current) return null;
      const rect = gridContainerRef.current.getBoundingClientRect();

      if (
        clientX < rect.left ||
        clientX > rect.right ||
        clientY < rect.top ||
        clientY > rect.bottom
      ) {
        return null;
      }

      const cellWidth = rect.width / cols;
      const cellHeight = rect.height / rows;

      const col = Math.floor((clientX - rect.left) / cellWidth);
      const row = Math.floor((clientY - rect.top) / cellHeight);

      if (row >= 0 && row < rows && col >= 0 && col < cols) {
        return { row, col };
      }
      return null;
    },
    [rows, cols]
  );

  const evaluateSelection = useCallback(
    (path: Coordinate[]) => {
      if (!path || path.length < 2) {
        setCurrentPath([]);
        setSelectionStart(null);
        setIsDragging(false);
        return;
      }

      // Check if path matches any un-found placed word
      let matchedWord: PlacedWord | null = null;

      for (const pw of placedWords) {
        if (!pw.isFound && arePathsEqual(path, pw.path)) {
          matchedWord = pw;
          break;
        }
      }

      if (matchedWord) {
        sounds.playWordFound();
        onWordFound(matchedWord);
      } else {
        sounds.playInvalid();
      }

      setCurrentPath([]);
      setSelectionStart(null);
      setIsDragging(false);
    },
    [placedWords, onWordFound]
  );

  // Pointer Down (Mouse or Touch)
  const handlePointerDown = (row: number, col: number, e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);

    // If player already clicked a start cell earlier (Click-to-Click Mode)
    if (selectionStart && !isDragging) {
      // Check if clicking the same cell resets it
      if (selectionStart.row === row && selectionStart.col === col) {
        setSelectionStart(null);
        setCurrentPath([]);
        return;
      }

      // Try completing selection path with click-start & click-end
      const path = getSelectionPath(selectionStart, { row, col });
      if (path && path.length > 1) {
        evaluateSelection(path);
        return;
      }
    }

    const startCoord = { row, col };
    setSelectionStart(startCoord);
    setCurrentPath([startCoord]);
    setIsDragging(true);
    sounds.playSelectLetter(0);
  };

  // Pointer Move (Dragging)
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !selectionStart) return;

    const cell = getCellFromPoint(e.clientX, e.clientY);
    if (!cell) return;

    const newPath = getSelectionPath(selectionStart, cell);
    if (newPath) {
      if (newPath.length !== currentPath.length) {
        sounds.playSelectLetter(newPath.length);
      }
      setCurrentPath(newPath);
    }
  };

  // Pointer Up (End Dragging)
  const handlePointerUp = useCallback(() => {
    if (!isDragging || !selectionStart) return;

    if (currentPath.length > 1) {
      evaluateSelection(currentPath);
    } else {
      // Single cell selected - keep selectionStart alive for Click-Start + Click-End mode
      setIsDragging(false);
    }
  }, [isDragging, selectionStart, currentPath, evaluateSelection]);

  // Global pointer up listener in case cursor leaves grid area
  useEffect(() => {
    const handleGlobalUp = () => {
      if (isDragging) {
        handlePointerUp();
      }
    };
    window.addEventListener('pointerup', handleGlobalUp);
    window.addEventListener('pointercancel', handleGlobalUp);
    return () => {
      window.removeEventListener('pointerup', handleGlobalUp);
      window.removeEventListener('pointercancel', handleGlobalUp);
    };
  }, [isDragging, handlePointerUp]);

  // Current selected word string for quick visual preview
  const currentWordPreview = React.useMemo(() => {
    if (currentPath.length <= 1) return '';
    return currentPath.map(c => matrix[c.row][c.col]).join('');
  }, [currentPath, matrix]);

  return (
    <div className="w-full flex flex-col items-center select-none touch-none-select">
      {/* Live selection preview bar */}
      <div className="h-8 flex items-center justify-center mb-2">
        {currentWordPreview ? (
          <div className="px-4 py-1 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 font-black tracking-widest text-sm sm:text-base animate-pulse shadow-md shadow-amber-500/10">
            {currentWordPreview}
          </div>
        ) : selectionStart ? (
          <div className="text-xs text-slate-400 italic">
            Toque na letra final para confirmar a palavra
          </div>
        ) : (
          <div className="text-xs text-slate-500">
            Arraste ou clique no início e fim de cada palavra
          </div>
        )}
      </div>

      {/* Grid Canvas Wrapper */}
      <div 
        ref={gridContainerRef}
        onPointerMove={handlePointerMove}
        className="relative p-2 sm:p-3 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-sm max-w-[560px] w-full aspect-square flex flex-col justify-center"
      >
        <div 
          className="grid gap-1 sm:gap-1.5 w-full h-full"
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
          }}
        >
          {matrix.map((rowArr, r) =>
            rowArr.map((letter, c) => {
              const cellKey = `${r},${c}`;
              const isSelected = currentPathSet.has(cellKey);
              const foundList = foundCellMap.get(cellKey);
              const isFound = foundList && foundList.length > 0;
              const isHinted = hintedCell && hintedCell.row === r && hintedCell.col === c;

              // Color resolution
              let bgClass = 'bg-slate-950/60 hover:bg-slate-800/80 text-slate-200';
              let borderClass = 'border-slate-800/70';
              let glowStyle: React.CSSProperties = {};

              if (isSelected) {
                bgClass = 'bg-amber-400 text-slate-950 font-black scale-95 shadow-md shadow-amber-400/40';
                borderClass = 'border-amber-300';
              } else if (isFound && foundList) {
                // Primary color theme from first found word
                const theme = getWordColor(foundList[0].colorIndex);
                bgClass = `${theme.bg} ${theme.text} font-black`;
                borderClass = theme.border;
                glowStyle = { boxShadow: `0 0 10px ${theme.glow}` };
              }

              if (isHinted) {
                borderClass = 'border-amber-400 animate-ping';
              }

              return (
                <button
                  key={cellKey}
                  type="button"
                  onPointerDown={(e) => handlePointerDown(r, c, e)}
                  aria-label={`Linha ${r + 1}, Coluna ${c + 1}: ${letter}`}
                  style={glowStyle}
                  className={`
                    relative flex items-center justify-center rounded-lg sm:rounded-xl 
                    border text-sm sm:text-lg md:text-xl font-bold uppercase transition-all duration-150 cursor-pointer
                    ${bgClass} ${borderClass}
                    ${isHinted ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-950 animate-bounce' : ''}
                  `}
                >
                  <span className="leading-none">{letter}</span>
                  
                  {/* Multiple intersections indicator */}
                  {foundList && foundList.length > 1 && !isSelected && (
                    <span className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-white/80" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
