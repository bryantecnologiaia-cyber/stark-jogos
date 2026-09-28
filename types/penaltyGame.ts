export type PenaltyMode = 'cup' | 'goalkeeper' | 'striker' | 'arcade';

export type MatchPhase = 'shoot' | 'defend';

export type ShotResult = 'goal' | 'saved' | 'post' | 'miss' | 'none';

export type ShotZone =
  | 'top-left'
  | 'crossbar'
  | 'top-right'
  | 'mid-left'
  | 'mid-center'
  | 'mid-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export interface GoalkeeperRival {
  id: string;
  name: string;
  team: string;
  flag: string;
  jerseyColor: string;
  glovesColor: string;
  skinColor: string;
  agility: number; // 1-10
  reach: number; // 1-10
  mindGame: number; // tendency to guess right
}

export interface RivalStriker {
  id: string;
  name: string;
  team: string;
  flag: string;
  power: number;
  curve: number;
  favouriteZone: ShotZone;
}

export interface PenaltyTarget {
  id: string;
  x: number; // normalized inside goal (-0.8 to 0.8)
  y: number; // normalized inside goal (0.2 to 0.9)
  points: number;
  radius: number;
  label: string;
  hit: boolean;
}

export interface ShootoutRound {
  roundNumber: number;
  playerScore: ShotResult | null;
  rivalScore: ShotResult | null;
}

export interface PenaltyStorageData {
  coins: number;
  totalGoals: number;
  totalKicks: number;
  totalSaves: number;
  cupsWon: number;
  bestArcadeScore: number;
  selectedBall: string;
  unlockedBalls: string[];
}
