'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Category,
  Difficulty,
  PlacedWord,
  WordDefinition,
  WordSearchGrid as WordSearchGridType,
  CampaignLevel,
  LevelProgress,
  PlayerStats,
  Coordinate,
} from '@/types/game';
import { CATEGORIES, getCategoryById } from '@/lib/categoriesData';
import { CAMPAIGN_LEVELS } from '@/lib/campaignData';
import { generateWordSearch } from '@/lib/wordSearchGenerator';
import { sounds } from '@/lib/soundEffects';
import {
  loadCampaignProgress,
  saveLevelProgress,
  loadPlayerStats,
  updatePlayerStats,
  unlockAchievement,
  loadSoundPreference,
  saveSoundPreference,
} from '@/lib/storage';

import { Navbar } from '@/components/Navbar';
import { WordSearchGrid } from '@/components/WordSearchGrid';
import { WordList } from '@/components/WordList';
import { GameControls } from '@/components/GameControls';
import { CampaignMap } from '@/components/CampaignMap';
import { ModeSelector } from '@/components/ModeSelector';
import { DailyChallenge } from '@/components/DailyChallenge';
import { CustomThemeModal } from '@/components/CustomThemeModal';
import { VictoryModal } from '@/components/VictoryModal';
import { TriviaModal } from '@/components/TriviaModal';
import { StatsModal } from '@/components/StatsModal';
import { BikeGame } from '@/components/bike/BikeGame';
import { PenaltyGame } from '@/components/penalty/PenaltyGame';
import { ArrowLeft, Sparkles, BookOpen, Layers } from 'lucide-react';

export default function WordSearchApp() {
  // App-level Game Switcher ('wordsearch' | 'bike' | 'penalty') - defaults to 'penalty'
  const [activeAppGame, setActiveAppGame] = useState<'wordsearch' | 'bike' | 'penalty'>('penalty');

  // Navigation & View State for Word Search
  const [currentTab, setCurrentTab] = useState<'campaign' | 'freeplay' | 'daily' | 'custom'>('campaign');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Active Game State
  const [activeTitle, setActiveTitle] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [activeDifficulty, setActiveDifficulty] = useState<Difficulty>('medio');
  const [activeCampaignLevel, setActiveCampaignLevel] = useState<CampaignLevel | null>(null);
  const [activeGrid, setActiveGrid] = useState<WordSearchGridType | null>(null);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [timeSeconds, setTimeSeconds] = useState<number>(0);

  // Hints & Visual Assists
  const [hintsRemaining, setHintsRemaining] = useState({ radar: 3, clue: 3, reveal: 1 });
  const [hintedCell, setHintedCell] = useState<Coordinate | null>(null);
  const [selectedTriviaWord, setSelectedTriviaWord] = useState<PlacedWord | null>(null);

  // Combo Streak & Score
  const [comboStreak, setComboStreak] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(1);
  const [score, setScore] = useState<number>(0);
  const lastFoundTimestampRef = useRef<number>(0);

  // Victory State
  const [isVictoryOpen, setIsVictoryOpen] = useState<boolean>(false);
  const [earnedStars, setEarnedStars] = useState<number>(1);

  // User Progression & Stats
  const [campaignProgress, setCampaignProgress] = useState<Record<number, LevelProgress>>(() => loadCampaignProgress());
  const [playerStats, setPlayerStats] = useState<PlayerStats>(() => loadPlayerStats());
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => loadSoundPreference());
  const [isStatsModalOpen, setIsStatsModalOpen] = useState<boolean>(false);

  // Sync sound settings with audio manager
  useEffect(() => {
    sounds.setSoundEnabled(soundEnabled);
  }, [soundEnabled]);

  const totalStars = Object.values(campaignProgress).reduce(
    (acc, curr) => acc + (curr?.stars || 0),
    0
  );

  // In-Game Timer Loop
  useEffect(() => {
    if (!isPlaying || isPaused || isVictoryOpen) return;

    const interval = setInterval(() => {
      setTimeSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, isPaused, isVictoryOpen]);

  // Audio preference toggle
  const handleToggleSound = () => {
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    sounds.setSoundEnabled(nextState);
    saveSoundPreference(nextState);
  };

  /**
   * Initializes a new word search game
   */
  const startNewGame = useCallback(
    (params: {
      title: string;
      category: Category;
      difficulty: Difficulty;
      gridSize: number;
      words: WordDefinition[];
      campaignLevel?: CampaignLevel | null;
    }) => {
      const generated = generateWordSearch(
        params.words,
        params.gridSize,
        params.difficulty
      );

      setActiveTitle(params.title);
      setActiveCategory(params.category);
      setActiveDifficulty(params.difficulty);
      setActiveCampaignLevel(params.campaignLevel || null);
      setActiveGrid(generated);

      setTimeSeconds(0);
      setIsPaused(false);
      setIsVictoryOpen(false);
      setHintsRemaining({ radar: 3, clue: 3, reveal: 1 });
      setHintedCell(null);
      setComboStreak(0);
      setMaxCombo(1);
      setScore(0);
      lastFoundTimestampRef.current = 0;

      setIsPlaying(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    []
  );

  /**
   * Handle starting a level from Campaign Mode
   */
  const handleStartCampaignLevel = (level: CampaignLevel) => {
    const category = getCategoryById(level.categoryId);
    // Shuffle and pick target count of words from category
    const shuffled = [...category.words].sort(() => 0.5 - Math.random());
    const levelWords = shuffled.slice(0, level.wordCount);

    startNewGame({
      title: `${level.worldName} • Fase ${level.levelNumber}`,
      category,
      difficulty: level.difficulty,
      gridSize: level.gridSize,
      words: levelWords,
      campaignLevel: level,
    });
  };

  /**
   * Handle starting from Free Play Mode
   */
  const handleStartFreePlay = (
    category: Category,
    difficulty: Difficulty,
    wordCount: number
  ) => {
    const shuffled = [...category.words].sort(() => 0.5 - Math.random());
    const words = shuffled.slice(0, wordCount);

    const sizeMap: Record<Difficulty, number> = {
      facil: 10,
      medio: 12,
      dificil: 14,
      mestre: 16,
    };

    startNewGame({
      title: `${category.name} (${difficulty.toUpperCase()})`,
      category,
      difficulty,
      gridSize: sizeMap[difficulty],
      words,
    });
  };

  /**
   * Handle starting Custom AI generated theme
   */
  const handleStartCustomGame = (
    category: Category,
    difficulty: Difficulty,
    words: WordDefinition[]
  ) => {
    const sizeMap: Record<Difficulty, number> = {
      facil: 10,
      medio: 12,
      dificil: 14,
      mestre: 16,
    };

    startNewGame({
      title: `Tema Criativo: ${category.name}`,
      category,
      difficulty,
      gridSize: sizeMap[difficulty],
      words,
    });
  };

  /**
   * Victory Handler
   */
  const handleVictory = useCallback((completedWords: PlacedWord[]) => {
    sounds.playVictory();

    // Calculate stars
    let stars = 1; // Completed puzzle
    const targetSeconds = activeCampaignLevel?.timeTargetSeconds || 140;

    if (timeSeconds <= targetSeconds) {
      stars += 1;
    }
    if (hintsRemaining.reveal === 1 && maxCombo >= 2) {
      stars += 1;
    }

    setEarnedStars(stars);
    setIsVictoryOpen(true);

    // Save campaign progress if applicable
    if (activeCampaignLevel) {
      const { newTotalStars } = saveLevelProgress(
        activeCampaignLevel.id,
        stars,
        timeSeconds
      );
      setCampaignProgress(loadCampaignProgress());

      if (newTotalStars >= 15) {
        unlockAchievement('star_collector');
      }
      if (activeCampaignLevel.worldId >= 3) {
        unlockAchievement('world_traveler');
      }
    }

    // Update player cumulative stats
    const updatedStats = updatePlayerStats((prev) => ({
      ...prev,
      totalGamesWon: prev.totalGamesWon + 1,
      totalWordsFound: prev.totalWordsFound + completedWords.length,
      totalTimePlayedSeconds: prev.totalTimePlayedSeconds + timeSeconds,
    }));
    setPlayerStats(updatedStats);

    // Check extra achievements
    unlockAchievement('first_win');
    if (timeSeconds < 60) {
      unlockAchievement('speed_demon');
    }
    if (updatedStats.totalWordsFound >= 50) {
      unlockAchievement('wordsmith_50');
    }
    if (activeDifficulty === 'mestre') {
      unlockAchievement('cosmos_master');
    }
  }, [activeCampaignLevel, timeSeconds, hintsRemaining.reveal, maxCombo, activeDifficulty]);

  /**
   * Word found by player
   */
  const handleWordFound = useCallback((foundWord: PlacedWord) => {
    if (!activeGrid) return;

    // Check combo timing (within 12 seconds of last found word)
    const now = Date.now();
    let currentCombo = 1;
    if (lastFoundTimestampRef.current > 0 && now - lastFoundTimestampRef.current < 12000) {
      currentCombo = comboStreak + 1;
      sounds.playCombo(currentCombo);
    }
    lastFoundTimestampRef.current = now;

    setComboStreak(currentCombo);
    setMaxCombo((prev) => Math.max(prev, currentCombo));

    // Calculate score
    const basePoints = foundWord.word.length * 100;
    const comboBonus = (currentCombo - 1) * 150;
    setScore((prev) => prev + basePoints + comboBonus);

    // Clear hinted cell if matching
    if (
      hintedCell &&
      hintedCell.row === foundWord.start.row &&
      hintedCell.col === foundWord.start.col
    ) {
      setHintedCell(null);
    }

    // Update active grid with found word marked
    const updatedPlacedWords = activeGrid.placedWords.map((pw) =>
      pw.id === foundWord.id ? { ...pw, isFound: true } : pw
    );

    setActiveGrid({
      ...activeGrid,
      placedWords: updatedPlacedWords,
    });

    // Check if player unlocked achievements
    if (currentCombo >= 3) {
      unlockAchievement('combo_king');
    }

    // Check if all words are found (VICTORY)
    const allFound = updatedPlacedWords.every((pw) => pw.isFound);
    if (allFound) {
      handleVictory(updatedPlacedWords);
    }
  }, [activeGrid, comboStreak, hintedCell, handleVictory]);

  /**
   * Hint 1: Radar / Compass
   * Highlights the first letter coordinate of an un-found word on the board
   */
  const handleRadarHint = () => {
    if (!activeGrid || hintsRemaining.radar <= 0) return;

    const unfoundWords = activeGrid.placedWords.filter((w) => !w.isFound);
    if (unfoundWords.length === 0) return;

    const targetWord = unfoundWords[Math.floor(Math.random() * unfoundWords.length)];
    const startCoord = targetWord.start;

    sounds.playHint();
    setHintedCell(startCoord);
    setHintsRemaining((prev) => ({ ...prev, radar: prev.radar - 1 }));

    // Reset radar highlight after 5 seconds
    setTimeout(() => {
      setHintedCell((current) =>
        current?.row === startCoord.row && current?.col === startCoord.col ? null : current
      );
    }, 5000);
  };

  /**
   * Hint 2: Clue Definition Reveal
   */
  const handleClueHint = () => {
    if (!activeGrid || hintsRemaining.clue <= 0) return;

    const unfoundWithoutClue = activeGrid.placedWords.filter(
      (w) => !w.isFound && !w.hintRevealed
    );
    if (unfoundWithoutClue.length === 0) return;

    const targetWord = unfoundWithoutClue[0];
    sounds.playHint();

    setActiveGrid({
      ...activeGrid,
      placedWords: activeGrid.placedWords.map((w) =>
        w.id === targetWord.id ? { ...w, hintRevealed: true } : w
      ),
    });

    setHintsRemaining((prev) => ({ ...prev, clue: prev.clue - 1 }));
  };

  /**
   * Hint 3: Auto-Reveal Full Word
   */
  const handleRevealWordHint = () => {
    if (!activeGrid || hintsRemaining.reveal <= 0) return;

    const unfoundWords = activeGrid.placedWords.filter((w) => !w.isFound);
    if (unfoundWords.length === 0) return;

    const targetWord = unfoundWords[0];
    sounds.playHint();

    setHintsRemaining((prev) => ({ ...prev, reveal: prev.reveal - 1 }));
    handleWordFound(targetWord);
  };

  /**
   * Go to next level in campaign
   */
  const handleNextLevel = () => {
    if (!activeCampaignLevel) {
      setIsPlaying(false);
      setIsVictoryOpen(false);
      return;
    }

    const nextLevel = CAMPAIGN_LEVELS.find((lvl) => lvl.id === activeCampaignLevel.id + 1);
    if (nextLevel) {
      handleStartCampaignLevel(nextLevel);
    } else {
      setIsPlaying(false);
      setIsVictoryOpen(false);
    }
  };

  /**
   * Restart current puzzle
   */
  const handleRestart = () => {
    if (!activeGrid) return;

    // Reset placed words found state
    setActiveGrid({
      ...activeGrid,
      placedWords: activeGrid.placedWords.map((pw) => ({
        ...pw,
        isFound: false,
        hintRevealed: false,
      })),
    });

    setTimeSeconds(0);
    setIsPaused(false);
    setIsVictoryOpen(false);
    setHintsRemaining({ radar: 3, clue: 3, reveal: 1 });
    setHintedCell(null);
    setComboStreak(0);
    setScore(0);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Top Navigation */}
      <Navbar
        activeGame={activeAppGame}
        onSelectGame={(game) => {
          setActiveAppGame(game);
          if (game === 'bike') {
            setIsPlaying(false);
          }
        }}
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          setIsPlaying(false);
        }}
        totalStars={totalStars}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onOpenStats={() => setIsStatsModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 flex flex-col">
        {activeAppGame === 'penalty' ? (
          // SOCCER PENALTY SHOOTOUT GAME
          <div className="flex-1 flex flex-col animate-fade-in">
            <PenaltyGame />
          </div>
        ) : activeAppGame === 'bike' ? (
          // BICYCLE RACING GAME
          <div className="flex-1 flex flex-col animate-fade-in">
            <BikeGame />
          </div>
        ) : !isPlaying ? (
          // WORD SEARCH MENU / EXPLORATION VIEWS
          <div className="flex-1 flex flex-col justify-center animate-fade-in">
            {currentTab === 'campaign' && (
              <CampaignMap
                progress={campaignProgress}
                totalStars={totalStars}
                onSelectLevel={handleStartCampaignLevel}
              />
            )}

            {currentTab === 'freeplay' && (
              <ModeSelector onStartGame={handleStartFreePlay} />
            )}

            {currentTab === 'daily' && (
              <DailyChallenge
                streak={playerStats.dailyStreak}
                isCompletedToday={playerStats.lastDailyDate === new Date().toISOString().split('T')[0]}
                onStartDaily={(cat, diff, words) => {
                  handleStartFreePlay(cat, diff, words);
                  // Update daily streak
                  const todayStr = new Date().toISOString().split('T')[0];
                  updatePlayerStats((prev) => ({
                    ...prev,
                    lastDailyDate: todayStr,
                    dailyStreak: prev.dailyStreak + 1,
                  }));
                  unlockAchievement('daily_streak');
                }}
              />
            )}

            {currentTab === 'custom' && (
              <CustomThemeModal onStartCustomGame={handleStartCustomGame} />
            )}
          </div>
        ) : (
          // ACTIVE GAMEPLAY BOARD
          <div className="flex-1 flex flex-col gap-4 animate-fade-in">
            {/* Game Topbar & Back Button */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setIsPlaying(false)}
                  type="button"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar</span>
                </button>

                <div>
                  <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    <span>{activeTitle}</span>
                  </h2>
                  <span className="text-xs text-slate-400 capitalize">
                    Dificuldade: {activeDifficulty} ({activeGrid?.rows}x{activeGrid?.cols})
                  </span>
                </div>
              </div>

              {/* In-Game Score pill */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-amber-300 font-mono text-xs sm:text-sm font-bold shadow-sm">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>{score.toLocaleString('pt-BR')} pts</span>
              </div>
            </div>

            {/* In-Game Controls & Hints Bar */}
            <GameControls
              timeSeconds={timeSeconds}
              isPaused={isPaused}
              onTogglePause={() => setIsPaused((prev) => !prev)}
              onRestart={handleRestart}
              onRadarHint={handleRadarHint}
              onClueHint={handleClueHint}
              onRevealWordHint={handleRevealWordHint}
              hintsRemaining={hintsRemaining}
              comboStreak={comboStreak}
              comboMultiplier={Math.min(comboStreak, 5)}
            />

            {/* Pause Screen Overlay or Interactive Game Layout */}
            {isPaused ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 bg-slate-900/60 rounded-3xl border border-slate-800 text-center gap-4 my-8">
                <h3 className="text-2xl font-black text-white">Jogo Pausado</h3>
                <p className="text-sm text-slate-400 max-w-sm">
                  O cronômetro está parado. Respire fundo e volte quando estiver pronto!
                </p>
                <button
                  onClick={() => setIsPaused(false)}
                  type="button"
                  className="px-6 py-3 rounded-2xl bg-amber-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-400/20 hover:scale-105 active:scale-95 transition-transform"
                >
                  Retomar Jogo
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* Main Word Search Grid (7 Cols on desktop) */}
                <div className="lg:col-span-7 flex flex-col items-center justify-center">
                  {activeGrid && (
                    <WordSearchGrid
                      matrix={activeGrid.matrix}
                      placedWords={activeGrid.placedWords}
                      onWordFound={handleWordFound}
                      hintedCell={hintedCell}
                    />
                  )}
                </div>

                {/* Word Checklist & Trivia Sidebar (5 Cols on desktop) */}
                <div className="lg:col-span-5 flex flex-col gap-4">
                  {activeGrid && (
                    <WordList
                      placedWords={activeGrid.placedWords}
                      onWordClick={(word) => setSelectedTriviaWord(word)}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-900 py-4 px-4 text-center text-xs text-slate-600">
        Caça-Palavras Infinito • Níveis progressivos e vocabulário autêntico em Português
      </footer>

      {/* Modals */}
      <VictoryModal
        isOpen={isVictoryOpen}
        stars={earnedStars}
        timeSeconds={timeSeconds}
        maxCombo={maxCombo}
        score={score}
        placedWords={activeGrid?.placedWords || []}
        hasNextLevel={Boolean(activeCampaignLevel && CAMPAIGN_LEVELS.some((l) => l.id === activeCampaignLevel.id + 1))}
        onNextLevel={handleNextLevel}
        onRestart={handleRestart}
        onClose={() => {
          setIsVictoryOpen(false);
          setIsPlaying(false);
        }}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950/80 py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            {activeAppGame === 'bike'
              ? '🚴 Pedal Radical • Grand Tour de Ciclismo 3D com Vácuo, Sprint e Garagem'
              : '🔤 Caça-Palavras Infinito • Níveis progressivos, dicionário em Português e temas variados'}
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                sounds.playSelectLetter(0);
                setActiveAppGame(activeAppGame === 'bike' ? 'wordsearch' : 'bike');
              }}
              className="text-cyan-400 hover:text-cyan-300 font-bold transition-colors cursor-pointer"
            >
              {activeAppGame === 'bike' ? 'Ir para o Caça-Palavras ➔' : 'Jogar Corrida de Bike ➔'}
            </button>
          </div>
        </div>
      </footer>

      <TriviaModal
        word={selectedTriviaWord}
        onClose={() => setSelectedTriviaWord(null)}
      />

      <StatsModal
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
        stats={playerStats}
      />
    </div>
  );
}
