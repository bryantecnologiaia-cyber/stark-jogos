export type BikeCategory = 'speed' | 'mtb' | 'aero' | 'electric';
export type BikeGameMode = 'grand-tour' | 'overtake-rush';

export interface Bike {
  id: string;
  name: string;
  tagline: string;
  category: BikeCategory;
  topSpeed: number; // in km/h (e.g. 52 - 75)
  acceleration: number; // 1-10
  handling: number; // 1-10
  staminaCost: number; // relative modifier (e.g. 0.85 = efficient, 1.2 = heavy)
  priceCoins: number;
  unlockedByDefault: boolean;
  frameColor: string;
  accentColor: string;
  iconName: string;
}

export type TrackDifficulty = 'facil' | 'medio' | 'dificil' | 'mestre';
export type TrackTheme = 'city' | 'mountain' | 'beach' | 'neon';

export interface Track {
  id: string;
  name: string;
  subtitle: string;
  location: string;
  theme: TrackTheme;
  difficulty: TrackDifficulty;
  distanceMeters: number;
  description: string;
  targetGoldSeconds: number;
  targetSilverSeconds: number;
  targetBronzeSeconds: number;
  rivalsCount: number;
  curvesIntensity: number; // 0 (straight) to 1.5 (very twisty)
  puddleChance: number;
  weatherName: string;
  accentColor: string;
}

export interface CyclistRival {
  id: string;
  name: string;
  country: string;
  flag: string;
  jerseyColor: string;
  bikeColor: string;
  speedBase: number;
  aggressiveness: number;
}

export interface CyclistState {
  id: string;
  name: string;
  isPlayer: boolean;
  jerseyColor: string;
  bikeColor: string;
  distanceMeters: number;
  lateralOffset: number; // -0.9 (left) to 0.9 (right)
  speedKmh: number;
  stamina: number; // 0 to 100
  isSprinting: boolean;
  isBraking: boolean;
  isDrafting: boolean;
  draftingBonus: number;
  pedalAngle: number;
  cadenceRpm: number;
  rank: number;
  finished: boolean;
  finishTimeSeconds: number | null;
  reactionBubble?: string | null;
  reactionTimer?: number;
  overtakenByPlayer?: boolean;
}

export interface OvertakeEvent {
  id: string;
  rivalName: string;
  newRank: number;
  points: number;
  streak: number;
  isCloseCall: boolean;
  isSlingshot: boolean;
  timestamp: number;
}

export interface BikeRaceStats {
  speedKmh: number;
  stamina: number;
  cadenceRpm: number;
  rank: number;
  progressPercent: number;
  coinsCollected: number;
  isDrafting: boolean;
  isSprinting: boolean;
  distanceLeftMeters: number;
  overtakesCount: number;
  overtakeStreak: number;
  slingshotCharge: number;
  nextRivalName: string | null;
  nextRivalDistance: number | null;
  rushTimeLeft?: number;
  rushScore?: number;
}

export type EntityType = 'water' | 'turbo' | 'coin' | 'cone' | 'puddle' | 'rock';

export interface TrackEntity {
  id: string;
  type: EntityType;
  distanceMeters: number;
  lateralOffset: number; // -0.8 to 0.8
  collected: boolean;
}

export interface TrackRecord {
  bestTimeSeconds: number;
  medal: 'gold' | 'silver' | 'bronze' | null;
  victories: number;
}

export interface BikeStorageData {
  coins: number;
  selectedBikeId: string;
  unlockedBikes: string[];
  jerseyColor: string;
  helmetColor: string;
  trackRecords: Record<string, TrackRecord>;
  totalDistanceKm: number;
  totalRacesWon: number;
  totalRacesPlayed: number;
  totalOvertakes: number;
  bestOvertakeStreak: number;
  overtakeRushHighScore: number;
}
