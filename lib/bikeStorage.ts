import { BikeStorageData, TrackRecord } from '@/types/bikeGame';

const BIKE_STORAGE_KEY = 'pedal_radical_storage_v1';

export function getInitialBikeStorage(): BikeStorageData {
  return {
    coins: 60, // starting gift coins
    selectedBikeId: 'speed-asfalto',
    unlockedBikes: ['speed-asfalto'],
    jerseyColor: '#eab308', // Brazilian gold
    helmetColor: '#0ea5e9', // Blue
    trackRecords: {},
    totalDistanceKm: 0,
    totalRacesWon: 0,
    totalRacesPlayed: 0,
    totalOvertakes: 0,
    bestOvertakeStreak: 0,
    overtakeRushHighScore: 0,
  };
}

export function loadBikeStorage(): BikeStorageData {
  if (typeof window === 'undefined') return getInitialBikeStorage();
  try {
    const raw = localStorage.getItem(BIKE_STORAGE_KEY);
    if (!raw) return getInitialBikeStorage();
    const parsed = JSON.parse(raw);
    return {
      ...getInitialBikeStorage(),
      ...parsed,
      trackRecords: parsed.trackRecords || {},
      unlockedBikes: parsed.unlockedBikes || ['speed-asfalto'],
      totalOvertakes: parsed.totalOvertakes || 0,
      bestOvertakeStreak: parsed.bestOvertakeStreak || 0,
      overtakeRushHighScore: parsed.overtakeRushHighScore || 0,
    };
  } catch {
    return getInitialBikeStorage();
  }
}

export function saveBikeStorage(data: BikeStorageData) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(BIKE_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore quota errors
  }
}

export function updateBikeStorage(updater: (prev: BikeStorageData) => BikeStorageData): BikeStorageData {
  const current = loadBikeStorage();
  const next = updater(current);
  saveBikeStorage(next);
  return next;
}

export function saveRaceResult(
  trackId: string,
  timeSeconds: number,
  rank: number,
  distanceMeters: number,
  coinsEarned: number,
  targetGold: number,
  targetSilver: number
): { isNewRecord: boolean; medal: 'gold' | 'silver' | 'bronze' | null; updatedData: BikeStorageData } {
  let isNewRecord = false;
  let medal: 'gold' | 'silver' | 'bronze' | null = null;

  if (rank === 1 && timeSeconds <= targetGold) {
    medal = 'gold';
  } else if (rank <= 2 && timeSeconds <= targetSilver) {
    medal = 'silver';
  } else if (rank <= 3) {
    medal = 'bronze';
  }

  const updatedData = updateBikeStorage((prev) => {
    const prevRecord: TrackRecord | undefined = prev.trackRecords[trackId];
    const isBest = !prevRecord || prevRecord.bestTimeSeconds === 0 || timeSeconds < prevRecord.bestTimeSeconds;
    if (isBest) isNewRecord = true;

    const bestTime = isBest ? timeSeconds : (prevRecord?.bestTimeSeconds || timeSeconds);

    // Keep highest medal
    const medalRank = (m: 'gold' | 'silver' | 'bronze' | null) =>
      m === 'gold' ? 3 : m === 'silver' ? 2 : m === 'bronze' ? 1 : 0;

    let bestMedal = medal;
    if (prevRecord && medalRank(prevRecord.medal) > medalRank(medal)) {
      bestMedal = prevRecord.medal;
    }

    const newRecord: TrackRecord = {
      bestTimeSeconds: bestTime,
      medal: bestMedal,
      victories: (prevRecord?.victories || 0) + (rank === 1 ? 1 : 0),
    };

    return {
      ...prev,
      coins: prev.coins + coinsEarned,
      totalDistanceKm: Number((prev.totalDistanceKm + distanceMeters / 1000).toFixed(2)),
      totalRacesPlayed: prev.totalRacesPlayed + 1,
      totalRacesWon: prev.totalRacesWon + (rank === 1 ? 1 : 0),
      trackRecords: {
        ...prev.trackRecords,
        [trackId]: newRecord,
      },
    };
  });

  return { isNewRecord, medal, updatedData };
}

export function recordOvertakeStats(overtakesDelta: number, streak: number, rushScore?: number): BikeStorageData {
  return updateBikeStorage((prev) => {
    return {
      ...prev,
      totalOvertakes: prev.totalOvertakes + overtakesDelta,
      bestOvertakeStreak: Math.max(prev.bestOvertakeStreak, streak),
      overtakeRushHighScore: rushScore ? Math.max(prev.overtakeRushHighScore, rushScore) : prev.overtakeRushHighScore,
    };
  });
}
