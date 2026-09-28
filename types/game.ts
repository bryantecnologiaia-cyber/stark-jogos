export type Difficulty = 'facil' | 'medio' | 'dificil' | 'mestre';

export type Direction = 
  | 'horizontal'          // Left to Right
  | 'horizontal-reverse'  // Right to Left
  | 'vertical'            // Top to Bottom
  | 'vertical-reverse'    // Bottom to Top
  | 'diagonal-down-right' // Top-Left to Bottom-Right
  | 'diagonal-up-right'   // Bottom-Left to Top-Right
  | 'diagonal-down-left'  // Top-Right to Bottom-Left
  | 'diagonal-up-left';   // Bottom-Right to Top-Left

export interface Coordinate {
  row: number;
  col: number;
}

export interface WordDefinition {
  word: string;        // e.g. "CAPIVARA" or "TUPÃ"
  displayWord: string; // e.g. "Capivara"
  clue?: string;       // e.g. "Maior roedor do mundo, muito amigável"
  trivia?: string;     // Interesting fact
}

export interface PlacedWord {
  id: string;
  word: string;         // uppercase normalized e.g. "TUPA"
  displayWord: string;  // e.g. "Tupã"
  clue?: string;
  trivia?: string;
  start: Coordinate;
  end: Coordinate;
  direction: Direction;
  path: Coordinate[];
  colorIndex: number;
  isFound: boolean;
  hintRevealed?: boolean;
}

export interface WordSearchGrid {
  matrix: string[][];
  rows: number;
  cols: number;
  placedWords: PlacedWord[];
  unplacedWords: string[];
}

export interface Category {
  id: string;
  name: string;
  description: string;
  iconName: string;
  color: string;
  bgGradient: string;
  words: WordDefinition[];
}

export interface CampaignLevel {
  id: number;
  worldId: number;
  worldName: string;
  levelNumber: number;
  title: string;
  categoryId: string;
  difficulty: Difficulty;
  gridSize: number;
  wordCount: number;
  timeTargetSeconds: number; // For 2nd star
  customWords?: WordDefinition[];
  description: string;
}

export interface PlayerStats {
  totalGamesPlayed: number;
  totalGamesWon: number;
  totalWordsFound: number;
  totalTimePlayedSeconds: number;
  totalStarsEarned: number;
  dailyStreak: number;
  lastDailyDate: string | null;
  achievements: string[];
}

export interface LevelProgress {
  levelId: number;
  stars: number; // 0 to 3
  bestTimeSeconds: number;
  completed: boolean;
}

export interface DailyChallengeState {
  date: string;
  completed: boolean;
  timeSeconds: number;
  stars: number;
}
