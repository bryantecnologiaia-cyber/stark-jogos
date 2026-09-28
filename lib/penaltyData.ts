import { useSyncExternalStore } from 'react';
import { GoalkeeperRival, RivalStriker, PenaltyStorageData } from '@/types/penaltyGame';

export const BRAZIL_GOALKEEPER: GoalkeeperRival = {
  id: 'alisson',
  name: 'Alisson Becker',
  team: 'Brasil',
  flag: '🇧🇷',
  jerseyColor: '#15803d', // Green goalkeeper jersey
  glovesColor: '#fbbf24', // Golden gloves
  skinColor: '#fed7aa',
  agility: 9.0,
  reach: 9.2,
  mindGame: 8.8,
};

export const GOALKEEPERS: GoalkeeperRival[] = [
  {
    id: 'martinez',
    name: 'Dibu Martinez',
    team: 'Argentina',
    flag: '🇦🇷',
    jerseyColor: '#0284c7',
    glovesColor: '#f97316',
    skinColor: '#fcd34d',
    agility: 6.8,
    reach: 7.0,
    mindGame: 6.5,
  },
  {
    id: 'neuer',
    name: 'Manuel Neuer',
    team: 'Alemanha',
    flag: '🇩🇪',
    jerseyColor: '#dc2626',
    glovesColor: '#ffffff',
    skinColor: '#fed7aa',
    agility: 7.2,
    reach: 7.5,
    mindGame: 6.0,
  },
  {
    id: 'maignan',
    name: 'Mike Maignan',
    team: 'França',
    flag: '🇫🇷',
    jerseyColor: '#1e3a8a',
    glovesColor: '#10b981',
    skinColor: '#78350f',
    agility: 7.0,
    reach: 7.2,
    mindGame: 6.2,
  },
  {
    id: 'donnarumma',
    name: 'Gianluigi Donnarumma',
    team: 'Itália',
    flag: '🇮🇹',
    jerseyColor: '#059669',
    glovesColor: '#eab308',
    skinColor: '#fed7aa',
    agility: 6.5,
    reach: 7.8,
    mindGame: 5.8,
  },
  {
    id: 'bounou',
    name: 'Yassine Bounou',
    team: 'Marrocos',
    flag: '🇲🇦',
    jerseyColor: '#047857',
    glovesColor: '#f43f5e',
    skinColor: '#fcd34d',
    agility: 7.4,
    reach: 6.8,
    mindGame: 6.4,
  },
];

export const RIVAL_STRIKERS: RivalStriker[] = [
  {
    id: 'messi',
    name: 'Lionel Messi',
    team: 'Argentina',
    flag: '🇦🇷',
    power: 0.85,
    curve: 0.35,
    favouriteZone: 'top-left',
  },
  {
    id: 'mbappe',
    name: 'Kylian Mbappé',
    team: 'França',
    flag: '🇫🇷',
    power: 0.95,
    curve: -0.2,
    favouriteZone: 'top-right',
  },
  {
    id: 'musiala',
    name: 'Jamal Musiala',
    team: 'Alemanha',
    flag: '🇩🇪',
    power: 0.82,
    curve: 0.25,
    favouriteZone: 'bottom-left',
  },
  {
    id: 'barella',
    name: 'Nicolò Barella',
    team: 'Itália',
    flag: '🇮🇹',
    power: 0.88,
    curve: -0.3,
    favouriteZone: 'bottom-right',
  },
  {
    id: 'hakimi',
    name: 'Achraf Hakimi',
    team: 'Marrocos',
    flag: '🇲🇦',
    power: 0.78,
    curve: 0.1,
    favouriteZone: 'crossbar',
  },
];

export interface BallSkin {
  id: string;
  name: string;
  price: number;
  pattern: 'classic' | 'gold' | 'brazuca' | 'fire' | 'neon';
  color1: string;
  color2: string;
  trailColor: string;
}

export const BALL_SKINS: BallSkin[] = [
  {
    id: 'classic',
    name: 'Clássica Brasil 70',
    price: 0,
    pattern: 'classic',
    color1: '#ffffff',
    color2: '#0f172a',
    trailColor: 'rgba(255,255,255,0.4)',
  },
  {
    id: 'brazuca',
    name: 'Brazuca Canarinho',
    price: 50,
    pattern: 'brazuca',
    color1: '#eab308',
    color2: '#16a34a',
    trailColor: 'rgba(234, 179, 8, 0.5)',
  },
  {
    id: 'gold',
    name: 'Bola de Ouro FIFA',
    price: 120,
    pattern: 'gold',
    color1: '#fbbf24',
    color2: '#b45309',
    trailColor: 'rgba(251, 191, 36, 0.6)',
  },
  {
    id: 'fire',
    name: 'Super Fogo Radical',
    price: 200,
    pattern: 'fire',
    color1: '#ef4444',
    color2: '#f97316',
    trailColor: 'rgba(239, 68, 68, 0.7)',
  },
  {
    id: 'neon',
    name: 'Cyber Neon 2077',
    price: 250,
    pattern: 'neon',
    color1: '#06b6d4',
    color2: '#d946ef',
    trailColor: 'rgba(6, 182, 212, 0.7)',
  },
];

const PENALTY_STORAGE_KEY = 'super_penalti_storage_v2';

const penaltyListeners = new Set<() => void>();

export function subscribePenaltyStorage(callback: () => void): () => void {
  penaltyListeners.add(callback);
  const onStorage = (e: StorageEvent) => {
    if (e.key === PENALTY_STORAGE_KEY) {
      cachedRaw = null;
      callback();
    }
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', onStorage);
  }
  return () => {
    penaltyListeners.delete(callback);
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', onStorage);
    }
  };
}

export function notifyPenaltyStorageChange() {
  cachedRaw = null;
  penaltyListeners.forEach((fn) => fn());
}

export function getInitialPenaltyStorage(): PenaltyStorageData {
  return {
    coins: 50,
    totalGoals: 0,
    totalKicks: 0,
    totalSaves: 0,
    cupsWon: 0,
    bestArcadeScore: 0,
    selectedBall: 'classic',
    unlockedBalls: ['classic'],
  };
}

const initialPenaltyStorageServer: PenaltyStorageData = getInitialPenaltyStorage();
let cachedRaw: string | null = null;
let cachedPenaltyData: PenaltyStorageData = initialPenaltyStorageServer;

export function loadPenaltyStorage(): PenaltyStorageData {
  if (typeof window === 'undefined') return initialPenaltyStorageServer;
  try {
    const raw = localStorage.getItem(PENALTY_STORAGE_KEY);
    if (raw === cachedRaw && cachedPenaltyData) {
      return cachedPenaltyData;
    }
    cachedRaw = raw;
    if (!raw) {
      cachedPenaltyData = initialPenaltyStorageServer;
      return cachedPenaltyData;
    }
    cachedPenaltyData = {
      ...initialPenaltyStorageServer,
      ...JSON.parse(raw),
    };
    return cachedPenaltyData;
  } catch {
    return initialPenaltyStorageServer;
  }
}

export function getPenaltyServerSnapshot(): PenaltyStorageData {
  return initialPenaltyStorageServer;
}

export function usePenaltyStorage(): PenaltyStorageData {
  return useSyncExternalStore(
    subscribePenaltyStorage,
    loadPenaltyStorage,
    getPenaltyServerSnapshot
  );
}

export function savePenaltyStorage(data: PenaltyStorageData) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PENALTY_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage quota
  }
}

export function updatePenaltyStorage(
  updater: (prev: PenaltyStorageData) => PenaltyStorageData
): PenaltyStorageData {
  const current = loadPenaltyStorage();
  const next = updater(current);
  savePenaltyStorage(next);
  notifyPenaltyStorageChange();
  return next;
}
