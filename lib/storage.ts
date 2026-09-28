import { LevelProgress, PlayerStats } from '@/types/game';

const STORAGE_KEYS = {
  CAMPAIGN_PROGRESS: 'caca_palavras_campaign_progress_v1',
  PLAYER_STATS: 'caca_palavras_player_stats_v1',
  SOUND_ENABLED: 'caca_palavras_sound_v1',
  VIBRATION_ENABLED: 'caca_palavras_vibration_v1',
  DAILY_CHALLENGE: 'caca_palavras_daily_v1',
};

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export const ACHIEVEMENTS_LIST: Achievement[] = [
  { id: 'first_win', title: 'Primeira Vitória', description: 'Complete seu primeiro caça-palavras!', icon: 'Trophy' },
  { id: 'star_collector', title: 'Colecionador de Estrelas', description: 'Conquiste 15 estrelas na campanha.', icon: 'Sparkles' },
  { id: 'speed_demon', title: 'Olhos de Águia', description: 'Encontre todas as palavras em menos de 1 minuto.', icon: 'Zap' },
  { id: 'combo_king', title: 'Mestre do Combo', description: 'Atinja um multiplicador de combo 3x consecutivo.', icon: 'Flame' },
  { id: 'world_traveler', title: 'Explorador', description: 'Desbloqueie o Mundo 3 da Campanha.', icon: 'Globe' },
  { id: 'wordsmith_50', title: 'Caçador de Palavras', description: 'Encontre mais de 50 palavras no total.', icon: 'BookOpen' },
  { id: 'cosmos_master', title: 'Mestre do Infinito', description: 'Complete uma partida na dificuldade Mestre.', icon: 'Crown' },
  { id: 'daily_streak', title: 'Hábito Diário', description: 'Complete um Desafio Diário.', icon: 'Calendar' },
];

export function getInitialStats(): PlayerStats {
  return {
    totalGamesPlayed: 0,
    totalGamesWon: 0,
    totalWordsFound: 0,
    totalTimePlayedSeconds: 0,
    totalStarsEarned: 0,
    dailyStreak: 0,
    lastDailyDate: null,
    achievements: [],
  };
}

export function loadCampaignProgress(): Record<number, LevelProgress> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CAMPAIGN_PROGRESS);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveLevelProgress(levelId: number, stars: number, timeSeconds: number): {
  newTotalStars: number;
  isNewBest: boolean;
} {
  const current = loadCampaignProgress();
  const existing = current[levelId];

  const highestStars = existing ? Math.max(existing.stars, stars) : stars;
  const bestTime = existing && existing.bestTimeSeconds > 0 
    ? Math.min(existing.bestTimeSeconds, timeSeconds) 
    : timeSeconds;

  current[levelId] = {
    levelId,
    stars: highestStars,
    bestTimeSeconds: bestTime,
    completed: true,
  };

  try {
    localStorage.setItem(STORAGE_KEYS.CAMPAIGN_PROGRESS, JSON.stringify(current));
  } catch {
    // Ignore storage quota
  }

  // Recalculate total stars
  const totalStars = Object.values(current).reduce((acc, curr) => acc + curr.stars, 0);

  return {
    newTotalStars: totalStars,
    isNewBest: !existing || stars > existing.stars,
  };
}

export function loadPlayerStats(): PlayerStats {
  if (typeof window === 'undefined') return getInitialStats();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PLAYER_STATS);
    if (!raw) return getInitialStats();
    return { ...getInitialStats(), ...JSON.parse(raw) };
  } catch {
    return getInitialStats();
  }
}

export function updatePlayerStats(updater: (prev: PlayerStats) => PlayerStats): PlayerStats {
  const prev = loadPlayerStats();
  const next = updater(prev);
  try {
    localStorage.setItem(STORAGE_KEYS.PLAYER_STATS, JSON.stringify(next));
  } catch {
    // Ignore
  }
  return next;
}

export function unlockAchievement(achievementId: string): boolean {
  let isNew = false;
  updatePlayerStats(prev => {
    if (!prev.achievements.includes(achievementId)) {
      isNew = true;
      return {
        ...prev,
        achievements: [...prev.achievements, achievementId],
      };
    }
    return prev;
  });
  return isNew;
}

export function loadSoundPreference(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SOUND_ENABLED);
    return raw !== null ? JSON.parse(raw) : true;
  } catch {
    return true;
  }
}

export function saveSoundPreference(enabled: boolean) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.SOUND_ENABLED, JSON.stringify(enabled));
  } catch {
    // Ignore
  }
}
