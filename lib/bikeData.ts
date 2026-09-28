import { Bike, Track, CyclistRival, TrackEntity } from '@/types/bikeGame';

export const BIKES: Bike[] = [
  {
    id: 'speed-asfalto',
    name: 'Speed Urbana Strada',
    tagline: 'Ágil e equilibrada para qualquer circuito',
    category: 'speed',
    topSpeed: 58,
    acceleration: 7,
    handling: 8,
    staminaCost: 1.0,
    priceCoins: 0,
    unlockedByDefault: true,
    frameColor: '#0ea5e9', // cyan-500
    accentColor: '#38bdf8',
    iconName: 'Bike',
  },
  {
    id: 'mtb-pro',
    name: 'Mountain Bike All-Terrain',
    tagline: 'Tração brutal que ignora terra, buracos e poças',
    category: 'mtb',
    topSpeed: 55,
    acceleration: 8,
    handling: 9,
    staminaCost: 0.85,
    priceCoins: 120,
    unlockedByDefault: false,
    frameColor: '#22c55e', // emerald-500
    accentColor: '#4ade80',
    iconName: 'Compass',
  },
  {
    id: 'aero-carbon',
    name: 'Aero Carbono Tour',
    tagline: 'Projetada no túnel de vento para velocidade pura',
    category: 'aero',
    topSpeed: 68,
    acceleration: 9,
    handling: 7,
    staminaCost: 1.15,
    priceCoins: 250,
    unlockedByDefault: false,
    frameColor: '#f59e0b', // amber-500
    accentColor: '#fbbf24',
    iconName: 'Zap',
  },
  {
    id: 'ebike-turbo',
    name: 'E-Bike Turbo Pro 2099',
    tagline: 'Motor elétrico auxiliar com sprint devastador',
    category: 'electric',
    topSpeed: 74,
    acceleration: 10,
    handling: 8,
    staminaCost: 0.7,
    priceCoins: 450,
    unlockedByDefault: false,
    frameColor: '#a855f7', // purple-500
    accentColor: '#c084fc',
    iconName: 'Flame',
  },
];

export const TRACKS: Track[] = [
  {
    id: 'av-paulista',
    name: 'Circuito Av. Paulista',
    subtitle: 'São Paulo, Brasil',
    location: 'Metrópole Paulista',
    theme: 'city',
    difficulty: 'facil',
    distanceMeters: 1200,
    description: 'Asfalto plano e veloz margeando a icônica avenida e o Parque Ibirapuera. Ótimo para pegar o ritmo da pedalada!',
    targetGoldSeconds: 42,
    targetSilverSeconds: 50,
    targetBronzeSeconds: 60,
    rivalsCount: 6,
    curvesIntensity: 0.5,
    puddleChance: 0.15,
    weatherName: 'Dia Ensolarado • 26°C',
    accentColor: 'from-amber-500 to-emerald-500',
  },
  {
    id: 'serra-graciosa',
    name: 'Serra da Graciosa',
    subtitle: 'Paraná, Brasil',
    location: 'Mata Atlântica & Curvas',
    theme: 'mountain',
    difficulty: 'medio',
    distanceMeters: 1500,
    description: 'Descidas sinuosas e subidas que testam a resistência. Cuidado com trechos úmidos e curvas fechadas na serra!',
    targetGoldSeconds: 52,
    targetSilverSeconds: 62,
    targetBronzeSeconds: 74,
    rivalsCount: 7,
    curvesIntensity: 0.9,
    puddleChance: 0.35,
    weatherName: 'Névoa da Serra • 19°C',
    accentColor: 'from-emerald-500 to-teal-500',
  },
  {
    id: 'orla-copacabana',
    name: 'Orla de Copacabana & Leblon',
    subtitle: 'Rio de Janeiro, Brasil',
    location: 'Litoral Atlântico',
    theme: 'beach',
    difficulty: 'dificil',
    distanceMeters: 1700,
    description: 'Vento contra à beira-mar, coqueiros e trechos com areia. Use o vácuo dos rivais para economizar vigor até o sprint final!',
    targetGoldSeconds: 58,
    targetSilverSeconds: 70,
    targetBronzeSeconds: 84,
    rivalsCount: 7,
    curvesIntensity: 0.7,
    puddleChance: 0.25,
    weatherName: 'Brisa Marítima • 29°C',
    accentColor: 'from-cyan-500 to-blue-500',
  },
  {
    id: 'velodromo-neon',
    name: 'Grand Prix Velódromo Neon',
    subtitle: 'Circuito Noturno Internacional',
    location: 'Arena Indoor de Alta Performance',
    theme: 'neon',
    difficulty: 'mestre',
    distanceMeters: 2000,
    description: 'Pista futurista oval ultra-aderente com turbo pads fluorescentes e os ciclistas mais rápidos do circuito mundial!',
    targetGoldSeconds: 65,
    targetSilverSeconds: 78,
    targetBronzeSeconds: 92,
    rivalsCount: 7,
    curvesIntensity: 1.1,
    puddleChance: 0.1,
    weatherName: 'Noite Iluminada • 22°C',
    accentColor: 'from-purple-500 to-pink-500',
  },
];

export const RIVALS: CyclistRival[] = [
  {
    id: 'rival-carlos',
    name: 'Carlos Trovão',
    country: 'Brasil',
    flag: '🇧🇷',
    jerseyColor: '#eab308', // amarelo ouro
    bikeColor: '#16a34a',
    speedBase: 56,
    aggressiveness: 0.7,
  },
  {
    id: 'rival-pedro',
    name: 'Pedro Escalador',
    country: 'Colômbia',
    flag: '🇨🇴',
    jerseyColor: '#dc2626', // vermelho
    bikeColor: '#3b82f6',
    speedBase: 57,
    aggressiveness: 0.8,
  },
  {
    id: 'rival-enzo',
    name: 'Enzo Azzurro',
    country: 'Itália',
    flag: '🇮🇹',
    jerseyColor: '#2563eb', // azul royal
    bikeColor: '#ffffff',
    speedBase: 59,
    aggressiveness: 0.85,
  },
  {
    id: 'rival-lucas',
    name: 'Lucas Sprint',
    country: 'França',
    flag: '🇫🇷',
    jerseyColor: '#f97316', // laranja
    bikeColor: '#1e293b',
    speedBase: 60,
    aggressiveness: 0.75,
  },
  {
    id: 'rival-maria',
    name: 'Maria Relâmpago',
    country: 'Portugal',
    flag: '🇵🇹',
    jerseyColor: '#10b981', // verde esmeralda
    bikeColor: '#f43f5e',
    speedBase: 58,
    aggressiveness: 0.8,
  },
  {
    id: 'rival-hans',
    name: 'Hans Kraft',
    country: 'Alemanha',
    flag: '🇩🇪',
    jerseyColor: '#64748b', // cinza prata
    bikeColor: '#facc15',
    speedBase: 61,
    aggressiveness: 0.9,
  },
  {
    id: 'rival-kenji',
    name: 'Kenji Hayate',
    country: 'Japão',
    flag: '🇯🇵',
    jerseyColor: '#ec4899', // rosa neon
    bikeColor: '#06b6d4',
    speedBase: 62,
    aggressiveness: 0.85,
  },
];

/**
 * Procedurally populates track entities along the course
 */
export function generateTrackEntities(track: Track): TrackEntity[] {
  const entities: TrackEntity[] = [];
  const distance = track.distanceMeters;

  // Start after 80m and stop before last 60m
  let curr = 90;
  let idCounter = 1;

  while (curr < distance - 80) {
    const step = 45 + Math.floor(Math.random() * 35);
    curr += step;
    if (curr >= distance - 60) break;

    // Pick entity type based on track theme and odds
    const roll = Math.random();
    let type: TrackEntity['type'];

    if (roll < 0.32) {
      type = 'coin'; // 32% coins
    } else if (roll < 0.55) {
      type = 'water'; // 23% isotonic water
    } else if (roll < 0.75) {
      type = 'turbo'; // 20% turbo pads
    } else if (roll < 0.90) {
      type = track.theme === 'mountain' ? 'rock' : 'puddle'; // 15% hazard
    } else {
      type = 'cone'; // 10% road cone
    }

    // Lane position: -0.7 to 0.7
    const laneOffset = Number(((Math.random() * 1.4) - 0.7).toFixed(2));

    entities.push({
      id: `entity-${idCounter++}`,
      type,
      distanceMeters: curr,
      lateralOffset: laneOffset,
      collected: false,
    });
  }

  return entities;
}
