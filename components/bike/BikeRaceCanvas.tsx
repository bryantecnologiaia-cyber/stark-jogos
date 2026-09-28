'use client';

import React, { useEffect, useRef } from 'react';
import { Track, Bike, CyclistState, TrackEntity, BikeGameMode, BikeRaceStats } from '@/types/bikeGame';
import { RIVALS, generateTrackEntities } from '@/lib/bikeData';
import { sounds } from '@/lib/soundEffects';

interface OvertakeVFX {
  id: number;
  text: string;
  subtext: string;
  color: string;
  life: number; // 1 down to 0
  x: number;
  y: number;
}

interface SparkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  size: number;
}

interface BikeRaceCanvasProps {
  track: Track;
  bike: Bike;
  jerseyColor: string;
  helmetColor: string;
  gameMode?: BikeGameMode;
  onFinishRace: (result: {
    timeSeconds: number;
    rank: number;
    distanceMeters: number;
    coinsEarned: number;
    overtakesCount: number;
    bestStreak: number;
    rushScore?: number;
  }) => void;
  onExit: () => void;
  // External inputs from touch HUD
  externalInput?: {
    steerLeft: boolean;
    steerRight: boolean;
    pedal: boolean;
    sprint: boolean;
    brake: boolean;
    bell: boolean;
  };
  onUpdateStats?: (stats: BikeRaceStats) => void;
}

const RIVAL_EXCLAMATIONS = [
  'Uau, que velocidade!',
  'Não vai me passar!',
  'Droga, perdi a posição!',
  'Que vácuo violento!',
  'Rápido demais!',
  'Boa ultrapassagem!',
  'O quê?! Já me passou?!',
];

export const BikeRaceCanvas: React.FC<BikeRaceCanvasProps> = ({
  track,
  bike,
  jerseyColor,
  helmetColor,
  gameMode = 'grand-tour',
  onFinishRace,
  onExit: _onExit,
  externalInput,
  onUpdateStats,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Stable refs for props to ensure 60fps loop always reads current values
  const trackRef = useRef<Track>(track);
  const bikeRef = useRef<Bike>(bike);
  const jerseyColorRef = useRef<string>(jerseyColor);
  const helmetColorRef = useRef<string>(helmetColor);
  const gameModeRef = useRef<BikeGameMode>(gameMode);
  const onFinishRaceRef = useRef(onFinishRace);
  const onUpdateStatsRef = useRef(onUpdateStats);
  const externalInputRef = useRef(externalInput);

  // Sync refs inside effect
  useEffect(() => {
    trackRef.current = track;
    bikeRef.current = bike;
    jerseyColorRef.current = jerseyColor;
    helmetColorRef.current = helmetColor;
    gameModeRef.current = gameMode;
    onFinishRaceRef.current = onFinishRace;
    onUpdateStatsRef.current = onUpdateStats;
    externalInputRef.current = externalInput;
  }, [track, bike, jerseyColor, helmetColor, gameMode, onFinishRace, onUpdateStats, externalInput]);

  // Keyboard keys state
  const keysRef = useRef<{
    left: boolean;
    right: boolean;
    up: boolean;
    down: boolean;
    sprint: boolean;
    bell: boolean;
  }>({
    left: false,
    right: false,
    up: false,
    down: false,
    sprint: false,
    bell: false,
  });

  // Track entities (coins, water, turbo pads, obstacles)
  const entitiesRef = useRef<TrackEntity[]>([]);

  // Player state
  const playerRef = useRef<CyclistState>({
    id: 'player',
    name: 'Você',
    isPlayer: true,
    jerseyColor,
    bikeColor: bike.frameColor,
    distanceMeters: 0,
    lateralOffset: 0,
    speedKmh: 18,
    stamina: 100,
    isSprinting: false,
    isBraking: false,
    isDrafting: false,
    draftingBonus: 0,
    pedalAngle: 0,
    cadenceRpm: 60,
    rank: 8,
    finished: false,
    finishTimeSeconds: null,
  });

  const rivalsRef = useRef<CyclistState[]>([]);
  const coinsCollectedRef = useRef<number>(0);
  const raceElapsedRef = useRef<number>(0);
  const isRacingRef = useRef<boolean>(true);
  const speedBoostTimerRef = useRef<number>(0);
  const puddleSlowTimerRef = useRef<number>(0);
  const lastPedalSoundTimeRef = useRef<number>(0);
  const lastBellTimeRef = useRef<number>(0);

  // Overtake & Slingshot State
  const overtakesCountRef = useRef<number>(0);
  const overtakeStreakRef = useRef<number>(0);
  const bestStreakRef = useRef<number>(0);
  const lastOvertakeTimeRef = useRef<number>(0);
  const slingshotChargeRef = useRef<number>(0); // 0 to 100
  const isDraftingPreviousRef = useRef<boolean>(false);
  const draftDurationRef = useRef<number>(0);

  // Overtake Rush Mode Timer & Score
  const rushTimeRemainingRef = useRef<number>(50); // seconds
  const rushScoreRef = useRef<number>(0);

  // Visual Effects Lists
  const popupsRef = useRef<OvertakeVFX[]>([]);
  const particlesRef = useRef<SparkParticle[]>([]);

  // Bell ring function
  const triggerBellRing = () => {
    const now = performance.now();
    if (now - lastBellTimeRef.current < 600) return;
    lastBellTimeRef.current = now;
    sounds.playBikeBell();

    // Nudge any rivals right in front of player
    const playerDist = playerRef.current.distanceMeters;
    const playerLat = playerRef.current.lateralOffset;

    rivalsRef.current.forEach((r) => {
      const distDelta = r.distanceMeters - playerDist;
      if (distDelta > 0 && distDelta < 24 && Math.abs(r.lateralOffset - playerLat) < 0.45) {
        // Move rival out of way and give exclamation
        r.lateralOffset += r.lateralOffset >= 0 ? 0.35 : -0.35;
        r.lateralOffset = Math.max(-0.8, Math.min(0.8, r.lateralOffset));
        r.reactionBubble = 'Pode passar!';
        r.reactionTimer = 2.0;
      }
    });
  };

  // Background Sky & Scenery
  const renderBackground = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    curveOffset: number,
    currentTrack: Track
  ) => {
    const horizonY = height * 0.46;

    // Sky Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
    if (currentTrack.theme === 'city') {
      skyGrad.addColorStop(0, '#0284c7');
      skyGrad.addColorStop(0.6, '#38bdf8');
      skyGrad.addColorStop(1, '#bae6fd');
    } else if (currentTrack.theme === 'mountain') {
      skyGrad.addColorStop(0, '#064e3b');
      skyGrad.addColorStop(0.5, '#047857');
      skyGrad.addColorStop(1, '#6ee7b7');
    } else if (currentTrack.theme === 'beach') {
      skyGrad.addColorStop(0, '#0369a1');
      skyGrad.addColorStop(0.6, '#38bdf8');
      skyGrad.addColorStop(1, '#fef08a');
    } else {
      // Neon
      skyGrad.addColorStop(0, '#09090b');
      skyGrad.addColorStop(0.6, '#18181b');
      skyGrad.addColorStop(1, '#3b0764');
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, horizonY);

    // Ground Grass / Terrain
    const groundGrad = ctx.createLinearGradient(0, horizonY, 0, height);
    if (currentTrack.theme === 'mountain') {
      groundGrad.addColorStop(0, '#14532d');
      groundGrad.addColorStop(1, '#166534');
    } else if (currentTrack.theme === 'beach') {
      groundGrad.addColorStop(0, '#fef08a');
      groundGrad.addColorStop(1, '#eab308');
    } else if (currentTrack.theme === 'neon') {
      groundGrad.addColorStop(0, '#020617');
      groundGrad.addColorStop(1, '#0f172a');
    } else {
      groundGrad.addColorStop(0, '#15803d');
      groundGrad.addColorStop(1, '#14532d');
    }
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, horizonY, width, height - horizonY);

    // Scenery Silhouettes on Horizon
    const parallaxX = curveOffset * 0.4;

    if (currentTrack.theme === 'city') {
      ctx.fillStyle = '#1e293b';
      const bWidth = 45;
      for (let x = -60; x < width + 60; x += bWidth + 10) {
        const bHeight = 50 + Math.sin(x * 12.3) * 35;
        ctx.fillRect(x + parallaxX, horizonY - bHeight, bWidth, bHeight);
      }
    } else if (currentTrack.theme === 'mountain') {
      ctx.fillStyle = '#064e3b';
      ctx.beginPath();
      ctx.moveTo(-50, horizonY);
      for (let x = -50; x < width + 100; x += 80) {
        const peakY = horizonY - 40 - Math.abs(Math.sin(x * 0.05)) * 55;
        ctx.lineTo(x + parallaxX, peakY);
      }
      ctx.lineTo(width + 100, horizonY);
      ctx.fill();
    } else if (currentTrack.theme === 'beach') {
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(0, horizonY - 18, width, 18);
    } else {
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 1.5;
      for (let x = 0; x < width; x += 60) {
        const bHeight = 40 + Math.sin(x) * 30;
        ctx.strokeRect(x + parallaxX, horizonY - bHeight, 40, bHeight);
      }
    }
  };

  // Road Perspective Projection
  const renderRoad = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    curveOffset: number,
    playerDist: number,
    currentTrack: Track
  ) => {
    const horizonY = height * 0.46;
    const roadTopWidth = width * 0.08;
    const roadBottomWidth = width * 0.88;

    const segments = 45;
    const segmentHeight = (height - horizonY) / segments;

    for (let i = 0; i < segments; i++) {
      const p1Y = horizonY + i * segmentHeight;
      const p2Y = p1Y + segmentHeight;

      const t1 = i / segments;
      const t2 = (i + 1) / segments;

      const w1 = roadTopWidth + (roadBottomWidth - roadTopWidth) * (t1 * t1);
      const w2 = roadTopWidth + (roadBottomWidth - roadTopWidth) * (t2 * t2);

      const shift1 = curveOffset * (1 - t1) * (1 - t1);
      const shift2 = curveOffset * (1 - t2) * (1 - t2);

      const centerX1 = width / 2 + shift1;
      const centerX2 = width / 2 + shift2;

      const segmentIndex = Math.floor((playerDist * 0.8 + i) % 2);
      const isAlt = segmentIndex === 0;

      // Road Surface
      ctx.fillStyle = isAlt ? '#334155' : '#1e293b';
      ctx.beginPath();
      ctx.moveTo(centerX1 - w1 / 2, p1Y);
      ctx.lineTo(centerX1 + w1 / 2, p1Y);
      ctx.lineTo(centerX2 + w2 / 2, p2Y);
      ctx.lineTo(centerX2 - w2 / 2, p2Y);
      ctx.fill();

      // Curbs
      const curbWidth1 = w1 * 0.07;
      const curbWidth2 = w2 * 0.07;

      ctx.fillStyle = isAlt
        ? currentTrack.theme === 'neon'
          ? '#ec4899'
          : '#ef4444'
        : currentTrack.theme === 'neon'
        ? '#06b6d4'
        : '#f8fafc';

      ctx.beginPath();
      ctx.moveTo(centerX1 - w1 / 2 - curbWidth1, p1Y);
      ctx.lineTo(centerX1 - w1 / 2, p1Y);
      ctx.lineTo(centerX2 - w2 / 2, p2Y);
      ctx.lineTo(centerX2 - w2 / 2 - curbWidth2, p2Y);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(centerX1 + w1 / 2, p1Y);
      ctx.lineTo(centerX1 + w1 / 2 + curbWidth1, p1Y);
      ctx.lineTo(centerX2 + w2 / 2 + curbWidth2, p2Y);
      ctx.lineTo(centerX2 + w2 / 2, p2Y);
      ctx.fill();

      // Dedicated Cycle Lane Strip
      if (currentTrack.theme !== 'neon') {
        ctx.fillStyle = isAlt ? '#991b1b' : '#b91c1c';
        const cycleW1 = w1 * 0.22;
        const cycleW2 = w2 * 0.22;
        const cycleX1 = centerX1 + w1 * 0.25;
        const cycleX2 = centerX2 + w2 * 0.25;
        ctx.beginPath();
        ctx.moveTo(cycleX1, p1Y);
        ctx.lineTo(cycleX1 + cycleW1, p1Y);
        ctx.lineTo(cycleX2 + cycleW2, p2Y);
        ctx.lineTo(cycleX2, p2Y);
        ctx.fill();
      }

      // Dashed Centerline
      if (i % 3 === 0) {
        ctx.fillStyle = '#f8fafc';
        const lineW1 = Math.max(1.5, w1 * 0.015);
        const lineW2 = Math.max(2, w2 * 0.015);
        ctx.beginPath();
        ctx.moveTo(centerX1 - lineW1 / 2, p1Y);
        ctx.lineTo(centerX1 + lineW1 / 2, p1Y);
        ctx.lineTo(centerX2 + lineW2 / 2, p2Y);
        ctx.lineTo(centerX2 - lineW2 / 2, p2Y);
        ctx.fill();
      }
    }
  };

  // Finish Line Banner Arch (Only in Grand Tour)
  const renderFinishLine = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    playerDist: number,
    trackDistance: number,
    curveOffset: number
  ) => {
    if (gameModeRef.current === 'overtake-rush') return;
    const delta = trackDistance - playerDist;
    if (delta < -20 || delta > 150) return;

    const horizonY = height * 0.46;
    const progress = Math.max(0, 1 - delta / 150);
    const y = horizonY + progress * (height * 0.5);
    const scale = 0.15 + progress * 0.85;

    const shift = curveOffset * (1 - progress) * (1 - progress);
    const roadWidthAtY = width * 0.08 + width * 0.8 * (progress * progress);
    const x = width / 2 + shift;

    const bannerH = 26 * scale;
    ctx.save();
    ctx.translate(x, y - 60 * scale);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-roadWidthAtY / 2 - 8 * scale, 0, 12 * scale, 80 * scale);
    ctx.fillRect(roadWidthAtY / 2 - 4 * scale, 0, 12 * scale, 80 * scale);

    ctx.fillStyle = '#eab308';
    ctx.fillRect(-roadWidthAtY / 2 - 8 * scale, -bannerH, roadWidthAtY + 16 * scale, bannerH);

    ctx.fillStyle = '#0f172a';
    ctx.font = `black ${Math.round(14 * scale)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('🏁 CHEGADA • FINISH 🏁', 0, -bannerH / 3);

    ctx.restore();
  };

  // Render Track Entities (Coins, Water, Turbo, Obstacles)
  const renderEntities = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    entities: TrackEntity[],
    playerDist: number,
    curveOffset: number
  ) => {
    const horizonY = height * 0.46;

    entities.forEach((ent) => {
      if (ent.collected) return;
      const delta = ent.distanceMeters - playerDist;
      if (delta < -5 || delta > 110) return;

      const t = 1 - delta / 110;
      const y = horizonY + (height - horizonY) * (t * t);
      const roadW = width * 0.08 + width * 0.8 * (t * t);
      const shift = curveOffset * (1 - t) * (1 - t);
      const x = width / 2 + shift + ent.lateralOffset * roadW * 0.45;
      const scale = 0.2 + t * 0.9;

      ctx.save();
      ctx.translate(x, y);

      if (ent.type === 'coin') {
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(0, 0, 12 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 2 * scale;
        ctx.stroke();

        ctx.fillStyle = '#78350f';
        ctx.font = `bold ${Math.round(11 * scale)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', 0, 0);
      } else if (ent.type === 'water') {
        ctx.fillStyle = '#06b6d4';
        ctx.fillRect(-6 * scale, -14 * scale, 12 * scale, 22 * scale);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(-3 * scale, -18 * scale, 6 * scale, 4 * scale);
      } else if (ent.type === 'turbo') {
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.moveTo(0, -14 * scale);
        ctx.lineTo(12 * scale, 6 * scale);
        ctx.lineTo(-12 * scale, 6 * scale);
        ctx.closePath();
        ctx.fill();
      } else if (ent.type === 'cone') {
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.moveTo(0, -16 * scale);
        ctx.lineTo(9 * scale, 4 * scale);
        ctx.lineTo(-9 * scale, 4 * scale);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-5 * scale, -6 * scale, 10 * scale, 4 * scale);
      } else {
        ctx.fillStyle = '#1e3a5f';
        ctx.beginPath();
        ctx.ellipse(0, 0, 14 * scale, 6 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });
  };

  // Render Rival Cyclist with Reaction Bubble & Slipstream Effect
  const renderCyclist = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    cyclist: CyclistState,
    playerDist: number,
    curveOffset: number,
    isForegroundPlayer: boolean
  ) => {
    const delta = cyclist.distanceMeters - playerDist;
    if (delta < -15 || delta > 120) return;

    const horizonY = height * 0.46;
    const t = 1 - delta / 120;
    const y = horizonY + (height - horizonY) * (t * t);
    const roadW = width * 0.08 + width * 0.8 * (t * t);
    const shift = curveOffset * (1 - t) * (1 - t);
    const x = width / 2 + shift + cyclist.lateralOffset * roadW * 0.45;
    const scale = (0.2 + t * 0.85) * (isForegroundPlayer ? 1.4 : 1.0);

    ctx.save();
    ctx.translate(x, y);

    // Drafting wind tunnel trail behind rival if player is drafting them
    const isPlayerDraftingThis =
      playerRef.current.isDrafting &&
      delta > 2 &&
      delta < 24 &&
      Math.abs(cyclist.lateralOffset - playerRef.current.lateralOffset) < 0.28;

    if (isPlayerDraftingThis) {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
      ctx.beginPath();
      ctx.moveTo(-16 * scale, 0);
      ctx.lineTo(16 * scale, 0);
      ctx.lineTo(30 * scale, 60 * scale);
      ctx.lineTo(-30 * scale, 60 * scale);
      ctx.closePath();
      ctx.fill();
    }

    // Bike shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 16 * scale, 6 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wheels
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3.5 * scale;
    ctx.beginPath();
    ctx.ellipse(0, -4 * scale, 4 * scale, 12 * scale, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Frame
    ctx.strokeStyle = cyclist.bikeColor;
    ctx.lineWidth = 4 * scale;
    ctx.beginPath();
    ctx.moveTo(0, -6 * scale);
    ctx.lineTo(0, -22 * scale);
    ctx.stroke();

    // Rider Torso & Jersey
    ctx.fillStyle = cyclist.jerseyColor;
    ctx.beginPath();
    ctx.ellipse(0, -32 * scale, 10 * scale, 14 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Helmet
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.ellipse(0, -46 * scale, 8 * scale, 7 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pedaling Legs
    const legCycle = Math.sin(cyclist.pedalAngle);
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 3 * scale;
    ctx.beginPath();
    ctx.moveTo(-6 * scale, -24 * scale);
    ctx.lineTo(-8 * scale, -12 * scale + legCycle * 5 * scale);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(6 * scale, -24 * scale);
    ctx.lineTo(8 * scale, -12 * scale - legCycle * 5 * scale);
    ctx.stroke();

    // Name tag & Rank Badge
    if (!cyclist.isPlayer && t > 0.35) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(-32 * scale, -60 * scale, 64 * scale, 14 * scale);
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.round(8 * scale)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${cyclist.rank}º ${cyclist.name.split(' ')[0]}`, 0, -53 * scale);
    }

    // Reaction Speech Bubble when overtaken
    if (cyclist.reactionBubble && cyclist.reactionTimer && cyclist.reactionTimer > 0) {
      const bubbleW = Math.max(70, cyclist.reactionBubble.length * 7) * scale;
      const bubbleH = 20 * scale;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5 * scale;
      ctx.beginPath();
      ctx.roundRect(-bubbleW / 2, -86 * scale, bubbleW, bubbleH, 6 * scale);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.font = `bold ${Math.round(8.5 * scale)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(cyclist.reactionBubble, 0, -76 * scale);
    }

    ctx.restore();
  };

  // Render Player Cyclist with dynamic lean and slingshot trail
  const renderPlayerCyclist = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    const player = playerRef.current;
    const x = width / 2 + player.lateralOffset * (width * 0.4);
    const y = height * 0.88;
    const scale = 1.35;

    ctx.save();
    ctx.translate(x, y);

    // Slingshot glow aura if slingshot charge is full or active
    if (slingshotChargeRef.current > 50 || speedBoostTimerRef.current > 0) {
      ctx.fillStyle = 'rgba(6, 182, 212, 0.25)';
      ctx.beginPath();
      ctx.ellipse(0, -20, 40 * scale, 50 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 10, 28 * scale, 10 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Rear Wheel
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 6 * scale;
    ctx.beginPath();
    ctx.ellipse(0, -6 * scale, 5 * scale, 18 * scale, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Frame
    ctx.strokeStyle = bikeRef.current.frameColor;
    ctx.lineWidth = 6 * scale;
    ctx.beginPath();
    ctx.moveTo(0, -8 * scale);
    ctx.lineTo(0, -32 * scale);
    ctx.stroke();

    // Rider Back
    ctx.fillStyle = jerseyColorRef.current;
    ctx.beginPath();
    ctx.ellipse(0, -45 * scale, 14 * scale, 18 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Number plate
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-6 * scale, -48 * scale, 12 * scale, 10 * scale);
    ctx.fillStyle = '#0f172a';
    ctx.font = `bold ${Math.round(8 * scale)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${player.rank}`, 0, -43 * scale);

    // Helmet
    ctx.fillStyle = helmetColorRef.current;
    ctx.beginPath();
    ctx.ellipse(0, -64 * scale, 11 * scale, 10 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = helmetColorRef.current;
    ctx.beginPath();
    ctx.moveTo(-6 * scale, -60 * scale);
    ctx.lineTo(0, -72 * scale);
    ctx.lineTo(6 * scale, -60 * scale);
    ctx.fill();

    // Pedaling Legs
    const legOffset = Math.sin(player.pedalAngle) * 9 * scale;
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 5 * scale;

    ctx.beginPath();
    ctx.moveTo(-10 * scale, -32 * scale);
    ctx.lineTo(-12 * scale, -16 * scale + legOffset);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(10 * scale, -32 * scale);
    ctx.lineTo(12 * scale, -16 * scale - legOffset);
    ctx.stroke();

    ctx.restore();
  };

  // Speed Lines & Drafting Visual FX
  const renderSpeedVFX = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const player = playerRef.current;

    // Drafting wind tunnel effect
    if (player.isDrafting) {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
      ctx.lineWidth = 2.5;
      const centerX = width / 2 + player.lateralOffset * (width * 0.4);

      for (let i = 0; i < 4; i++) {
        const offset = (i - 1.5) * 22;
        ctx.beginPath();
        ctx.moveTo(centerX + offset, height * 0.62);
        ctx.lineTo(centerX + offset * 1.5, height * 0.96);
        ctx.stroke();
      }

      // Slingshot charging badge
      const chargePct = Math.round(slingshotChargeRef.current);
      ctx.fillStyle = chargePct >= 80 ? 'rgba(16, 185, 129, 0.95)' : 'rgba(14, 165, 233, 0.9)';
      ctx.fillRect(width / 2 - 130, 24, 260, 28);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'black 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (chargePct >= 80) {
        ctx.fillText('🚀 ESTILINGUE PRONTO! PUXE PARA O LADO! 🚀', width / 2, 38);
      } else {
        ctx.fillText(`⚡ VÁCUO ATIVO (+20%) • CARREGANDO ${chargePct}%`, width / 2, 38);
      }
    }

    if (player.isSprinting || speedBoostTimerRef.current > 0) {
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
      ctx.lineWidth = 3.5;
      for (let i = 0; i < 8; i++) {
        const x = Math.random() * width;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
    }
  };

  // Render Spark Particles (from close passes, turbo, and coins)
  const renderParticles = (ctx: CanvasRenderingContext2D) => {
    const particles = particlesRef.current;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.035;

      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }

      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;
  };

  // Render On-Screen Floating Overtake Popups & Badges
  const renderPopups = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const popups = popupsRef.current;
    for (let i = popups.length - 1; i >= 0; i--) {
      const p = popups[i];
      p.life -= 0.025;
      p.y -= 1.2;

      if (p.life <= 0) {
        popups.splice(i, 1);
        continue;
      }

      const alpha = Math.min(1, p.life * 1.5);
      const scale = 0.8 + (1 - p.life) * 0.3;

      ctx.save();
      ctx.translate(width / 2, p.y);
      ctx.scale(scale, scale);

      // Glowing banner box
      const boxW = 340;
      const boxH = 46;
      ctx.fillStyle = `rgba(15, 23, 42, ${0.9 * alpha})`;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(-boxW / 2, -boxH / 2, boxW, boxH, 14);
      ctx.fill();
      ctx.stroke();

      // Main Text
      ctx.fillStyle = p.color;
      ctx.font = 'black 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.text, 0, -8);

      // Subtext
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(p.subtext, 0, 11);

      ctx.restore();
    }
  };

  // Mini Radar at Top of Screen
  const renderRadar = (ctx: CanvasRenderingContext2D, width: number, currentTrack: Track) => {
    const radarW = Math.min(360, width - 40);
    const radarH = 18;
    const radarX = (width - radarW) / 2;
    const radarY = 64;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(radarX, radarY, radarW, radarH, 9);
    ctx.fill();
    ctx.stroke();

    const playerDist = playerRef.current.distanceMeters;
    const totalDist = currentTrack.distanceMeters;

    // Draw rivals on radar relative to player window (+- 100m)
    const windowMeters = 120;
    rivalsRef.current.forEach((r) => {
      const delta = r.distanceMeters - playerDist;
      if (Math.abs(delta) <= windowMeters) {
        const blipNorm = (delta + windowMeters) / (windowMeters * 2);
        const blipX = radarX + blipNorm * radarW;
        ctx.fillStyle = delta > 0 ? '#ef4444' : '#64748b';
        ctx.beginPath();
        ctx.arc(blipX, radarY + radarH / 2, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Player marker (center)
    ctx.fillStyle = '#06b6d4';
    ctx.beginPath();
    ctx.arc(radarX + radarW / 2, radarY + radarH / 2, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Radar Labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Atrás', radarX + 8, radarY + 12);
    ctx.textAlign = 'right';
    ctx.fillText('À frente', radarX + radarW - 8, radarY + 12);
  };

  // Render Scene
  const renderScene = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const width = canvas.width;
    const height = canvas.height;
    const player = playerRef.current;
    const rivals = rivalsRef.current;
    const entities = entitiesRef.current;
    const currentTrack = trackRef.current;

    ctx.clearRect(0, 0, width, height);

    const curveOffset = Math.sin(player.distanceMeters * 0.006) * (currentTrack.curvesIntensity * 120);

    renderBackground(ctx, width, height, curveOffset, currentTrack);
    renderRoad(ctx, width, height, curveOffset, player.distanceMeters, currentTrack);
    renderFinishLine(ctx, width, height, player.distanceMeters, currentTrack.distanceMeters, curveOffset);
    renderEntities(ctx, width, height, entities, player.distanceMeters, curveOffset);

    const visibleRivals = rivals.filter(
      (r) => r.distanceMeters > player.distanceMeters - 15 && r.distanceMeters < player.distanceMeters + 120
    );
    visibleRivals.sort((a, b) => b.distanceMeters - a.distanceMeters);

    visibleRivals.forEach((rival) => {
      renderCyclist(ctx, width, height, rival, player.distanceMeters, curveOffset, false);
    });

    renderPlayerCyclist(ctx, width, height);
    renderSpeedVFX(ctx, width, height);
    renderParticles(ctx);
    renderRadar(ctx, width, currentTrack);
    renderPopups(ctx, width, height);
  };

  // Trigger Overtake Celebration
  const triggerOvertakeEvent = (rival: CyclistState, isSlingshot: boolean, isCloseCall: boolean) => {
    overtakesCountRef.current += 1;
    const now = performance.now();

    // Combo streak calculation (within 5 seconds)
    if (now - lastOvertakeTimeRef.current < 5000) {
      overtakeStreakRef.current += 1;
    } else {
      overtakeStreakRef.current = 1;
    }
    lastOvertakeTimeRef.current = now;
    bestStreakRef.current = Math.max(bestStreakRef.current, overtakeStreakRef.current);

    const streak = overtakeStreakRef.current;

    // Sound effect
    sounds.playOvertake(streak);
    if (isSlingshot) sounds.playSlingshotBoost();
    if (isCloseCall) sounds.playCloseCall();

    // Rival reaction bubble
    rival.reactionBubble = RIVAL_EXCLAMATIONS[Math.floor(Math.random() * RIVAL_EXCLAMATIONS.length)];
    rival.reactionTimer = 2.4;

    // Refill player stamina & grant speed burst
    playerRef.current.stamina = Math.min(100, playerRef.current.stamina + 30);
    speedBoostTimerRef.current = 2.0;
    coinsCollectedRef.current += 10 + streak * 5;

    // Rush mode time & score bonuses
    if (gameModeRef.current === 'overtake-rush') {
      rushTimeRemainingRef.current += 3.5;
      rushScoreRef.current += 100 * streak + (isCloseCall ? 100 : 0);
    }

    // Spark particles burst
    const canvas = canvasRef.current;
    if (canvas) {
      const centerX = canvas.width / 2 + playerRef.current.lateralOffset * (canvas.width * 0.4);
      const centerY = canvas.height * 0.85;
      for (let i = 0; i < 18; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = 2 + Math.random() * 5;
        particlesRef.current.push({
          x: centerX,
          y: centerY,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd,
          color: isSlingshot ? '#38bdf8' : isCloseCall ? '#f59e0b' : '#34d399',
          life: 1.0,
          size: 3 + Math.random() * 3,
        });
      }
    }

    // Pop-up banner
    let title = `🚀 ULTRAPASSAGEM! PASSOU ${rival.name.toUpperCase()}!`;
    if (isSlingshot) title = `⚡ ESTILINGUE! ULTRAPASSOU ${rival.name.toUpperCase()}!`;
    else if (isCloseCall) title = `🔥 ULTRAPASSAGEM FINA! ${rival.name.toUpperCase()}!`;

    const sub =
      gameModeRef.current === 'overtake-rush'
        ? `+3.5s TEMPO • COMBO x${streak} (+${100 * streak} PTS)`
        : `SUBIU PARA ${playerRef.current.rank}º LUGAR! • COMBO x${streak} (+NITRO)`;

    popupsRef.current.push({
      id: Date.now() + Math.random(),
      text: title,
      subtext: sub,
      color: isSlingshot ? '#38bdf8' : streak > 1 ? '#fbbf24' : '#34d399',
      life: 1.0,
      x: 0,
      y: 120,
    });
  };

  // Update Physics
  const updatePhysics = (dt: number, currentTime: number) => {
    const player = playerRef.current;
    const rivals = rivalsRef.current;
    const entities = entitiesRef.current;
    const currentTrack = trackRef.current;
    const currentBike = bikeRef.current;
    const extInput = externalInputRef.current;

    const isSteerLeft = keysRef.current.left || Boolean(extInput?.steerLeft);
    const isSteerRight = keysRef.current.right || Boolean(extInput?.steerRight);
    const isSprintingInput = keysRef.current.sprint || Boolean(extInput?.sprint);
    const isBraking = keysRef.current.down || Boolean(extInput?.brake);

    // Timers
    if (speedBoostTimerRef.current > 0) speedBoostTimerRef.current -= dt;
    if (puddleSlowTimerRef.current > 0) puddleSlowTimerRef.current -= dt;

    // Rush mode countdown
    if (gameModeRef.current === 'overtake-rush') {
      rushTimeRemainingRef.current -= dt;
      if (rushTimeRemainingRef.current <= 0 && isRacingRef.current) {
        // Time over in Rush mode
        isRacingRef.current = false;
        sounds.playVictory();
        setTimeout(() => {
          if (onFinishRaceRef.current) {
            onFinishRaceRef.current({
              timeSeconds: raceElapsedRef.current,
              rank: 1,
              distanceMeters: Math.round(player.distanceMeters),
              coinsEarned: coinsCollectedRef.current + overtakesCountRef.current * 8,
              overtakesCount: overtakesCountRef.current,
              bestStreak: bestStreakRef.current,
              rushScore: rushScoreRef.current,
            });
          }
        }, 1200);
      }
    }

    // Steering
    const prevLateral = player.lateralOffset;
    const handlingFactor = (currentBike.handling / 10) * 1.5;
    if (isSteerLeft) player.lateralOffset -= handlingFactor * dt;
    if (isSteerRight) player.lateralOffset += handlingFactor * dt;
    player.lateralOffset = Math.max(-0.85, Math.min(0.85, player.lateralOffset));

    const isWhippingOut = Math.abs(player.lateralOffset - prevLateral) > 0.005;

    // Drafting & Slingshot Detection
    let draftingFound = false;
    for (const rival of rivals) {
      const distDelta = rival.distanceMeters - player.distanceMeters;
      if (distDelta > 2 && distDelta < 22 && Math.abs(rival.lateralOffset - player.lateralOffset) < 0.28) {
        draftingFound = true;
        break;
      }
    }
    player.isDrafting = draftingFound;
    player.draftingBonus = draftingFound ? 0.22 : 0;

    // Slingshot charging logic
    if (draftingFound) {
      draftDurationRef.current += dt;
      slingshotChargeRef.current = Math.min(100, slingshotChargeRef.current + dt * 75);
    } else {
      // If we were just drafting with high charge and player whipped sideways: ACTIVATE SLINGSHOT BOOST!
      if (isDraftingPreviousRef.current && slingshotChargeRef.current >= 65 && isWhippingOut) {
        speedBoostTimerRef.current = 2.4;
        sounds.playSlingshotBoost();
        player.stamina = Math.min(100, player.stamina + 20);
      }
      slingshotChargeRef.current = Math.max(0, slingshotChargeRef.current - dt * 40);
      draftDurationRef.current = 0;
    }
    isDraftingPreviousRef.current = draftingFound;

    // Stamina
    const canSprint = isSprintingInput && player.stamina > 5;
    player.isSprinting = canSprint;

    if (canSprint) {
      player.stamina = Math.max(0, player.stamina - 22 * currentBike.staminaCost * dt);
    } else {
      const recoveryRate = draftingFound ? 18 : isBraking ? 18 : 10;
      player.stamina = Math.min(100, player.stamina + recoveryRate * dt);
    }

    // Speed target
    let targetSpeed = currentBike.topSpeed * 0.72;
    if (canSprint) targetSpeed = currentBike.topSpeed * 1.25;
    else if (isBraking) targetSpeed = 15;

    if (draftingFound) targetSpeed *= 1.2;
    if (speedBoostTimerRef.current > 0) targetSpeed += 24;
    if (puddleSlowTimerRef.current > 0 && currentBike.category !== 'mtb') targetSpeed *= 0.65;

    const accelRate = (currentBike.acceleration / 10) * 13;
    if (player.speedKmh < targetSpeed) {
      player.speedKmh = Math.min(targetSpeed, player.speedKmh + accelRate * dt);
    } else {
      const decel = isBraking ? 45 : 12;
      player.speedKmh = Math.max(10, player.speedKmh - decel * dt);
    }

    // Sound
    if (currentTime - lastPedalSoundTimeRef.current > Math.max(80, 240 - player.speedKmh * 2.2)) {
      sounds.playBikePedal();
      lastPedalSoundTimeRef.current = currentTime;
    }

    player.cadenceRpm = Math.round(player.speedKmh * 2.1);
    player.pedalAngle += (player.speedKmh / 3.6) * dt * 4;

    const prevPlayerDist = player.distanceMeters;
    const speedMs = player.speedKmh / 3.6;
    player.distanceMeters += speedMs * dt;

    // Update Rivals and CHECK FOR OVERTAKES!
    rivals.forEach((r, idx) => {
      // Update reaction timer
      if (r.reactionTimer && r.reactionTimer > 0) {
        r.reactionTimer -= dt;
        if (r.reactionTimer <= 0) r.reactionBubble = null;
      }

      if (r.finished) return;

      const rivalRivalData = RIVALS[idx % RIVALS.length];
      let rTargetSpeed = rivalRivalData.speedBase;

      // In Rush Mode, rivals cruise steadily across 3 lanes
      if (gameModeRef.current === 'overtake-rush') {
        rTargetSpeed = 44 + (idx % 3) * 4;
      } else {
        const surge = Math.sin(currentTime * 0.001 + idx * 2) * 4;
        rTargetSpeed += surge;
        if (r.distanceMeters > currentTrack.distanceMeters * 0.75) {
          rTargetSpeed *= 1.1;
        }
      }

      r.speedKmh += (rTargetSpeed - r.speedKmh) * dt * 0.8;
      const prevRivalDist = r.distanceMeters;
      r.distanceMeters += (r.speedKmh / 3.6) * dt;
      r.pedalAngle += (r.speedKmh / 3.6) * dt * 4;

      r.lateralOffset += Math.sin(currentTime * 0.0008 + idx) * 0.22 * dt;
      r.lateralOffset = Math.max(-0.75, Math.min(0.75, r.lateralOffset));

      // OVERTAKE DETECTION!
      // Was rival in front of player, and is player now ahead?
      const wasBehind = prevPlayerDist <= prevRivalDist;
      const isNowAhead = player.distanceMeters > r.distanceMeters;

      if (wasBehind && isNowAhead && !r.overtakenByPlayer) {
        r.overtakenByPlayer = true;
        const isSlingshot = speedBoostTimerRef.current > 0 || slingshotChargeRef.current > 50;
        const isCloseCall = Math.abs(player.lateralOffset - r.lateralOffset) < 0.28;
        triggerOvertakeEvent(r, isSlingshot, isCloseCall);
      }

      // In Overtake Rush mode: if rival is left far behind (> 30m), respawn them ahead!
      if (gameModeRef.current === 'overtake-rush' && player.distanceMeters - r.distanceMeters > 28) {
        const leadDist = 80 + Math.random() * 50 + idx * 10;
        r.distanceMeters = player.distanceMeters + leadDist;
        r.lateralOffset = [-0.6, -0.2, 0.2, 0.6][Math.floor(Math.random() * 4)];
        r.overtakenByPlayer = false;
        r.reactionBubble = null;
        r.reactionTimer = 0;
      }

      // Finish check for Grand Tour
      if (gameModeRef.current === 'grand-tour' && r.distanceMeters >= currentTrack.distanceMeters && !r.finished) {
        r.finished = true;
        r.finishTimeSeconds = raceElapsedRef.current;
      }
    });

    // Track Entities Collision
    entities.forEach((ent) => {
      if (ent.collected) return;

      const distDelta = ent.distanceMeters - player.distanceMeters;
      if (Math.abs(distDelta) < 3.2 && Math.abs(ent.lateralOffset - player.lateralOffset) < 0.26) {
        ent.collected = true;

        switch (ent.type) {
          case 'coin':
            coinsCollectedRef.current += 10;
            sounds.playCoinPickup();
            break;
          case 'water':
            player.stamina = Math.min(100, player.stamina + 45);
            sounds.playDrinkWater();
            break;
          case 'turbo':
            speedBoostTimerRef.current = 2.4;
            sounds.playTurboBoost();
            break;
          case 'puddle':
          case 'rock':
          case 'cone':
            if (currentBike.category === 'mtb') {
              sounds.playCrashObstacle();
            } else {
              puddleSlowTimerRef.current = 1.4;
              player.speedKmh = Math.max(15, player.speedKmh - 18);
              sounds.playCrashObstacle();
            }
            break;
        }
      }
    });

    // Ranks Calculation
    const allRacers = [player, ...rivals];
    allRacers.sort((a, b) => b.distanceMeters - a.distanceMeters);
    allRacers.forEach((racer, index) => {
      racer.rank = index + 1;
    });

    // Closest rival ahead for Target Tracker
    let nextRival: CyclistState | null = null;
    let minAheadDist = Infinity;
    rivals.forEach((r) => {
      const d = r.distanceMeters - player.distanceMeters;
      if (d > 0 && d < minAheadDist) {
        minAheadDist = d;
        nextRival = r;
      }
    });

    // Grand Tour Finish Check
    if (gameModeRef.current === 'grand-tour' && player.distanceMeters >= currentTrack.distanceMeters && !player.finished) {
      player.finished = true;
      player.finishTimeSeconds = raceElapsedRef.current;
      isRacingRef.current = false;

      sounds.playVictory();

      setTimeout(() => {
        if (onFinishRaceRef.current) {
          onFinishRaceRef.current({
            timeSeconds: Number(player.finishTimeSeconds?.toFixed(2) || raceElapsedRef.current.toFixed(2)),
            rank: player.rank,
            distanceMeters: currentTrack.distanceMeters,
            coinsEarned:
              coinsCollectedRef.current +
              (player.rank === 1 ? 60 : player.rank === 2 ? 35 : player.rank === 3 ? 20 : 5) +
              overtakesCountRef.current * 5,
            overtakesCount: overtakesCountRef.current,
            bestStreak: bestStreakRef.current,
          });
        }
      }, 1500);
    }

    // Stats sync with HUD
    if (onUpdateStatsRef.current) {
      onUpdateStatsRef.current({
        speedKmh: Math.round(player.speedKmh),
        stamina: Math.round(player.stamina),
        cadenceRpm: player.cadenceRpm,
        rank: player.rank,
        progressPercent:
          gameModeRef.current === 'grand-tour'
            ? Math.min(100, (player.distanceMeters / currentTrack.distanceMeters) * 100)
            : Math.min(100, (rushScoreRef.current / 3000) * 100),
        coinsCollected: coinsCollectedRef.current,
        isDrafting: player.isDrafting,
        isSprinting: player.isSprinting,
        distanceLeftMeters: Math.max(0, Math.round(currentTrack.distanceMeters - player.distanceMeters)),
        overtakesCount: overtakesCountRef.current,
        overtakeStreak: overtakeStreakRef.current,
        slingshotCharge: Math.round(slingshotChargeRef.current),
        nextRivalName: nextRival ? (nextRival as CyclistState).name : null,
        nextRivalDistance: nextRival ? Math.round(minAheadDist) : null,
        rushTimeLeft: gameModeRef.current === 'overtake-rush' ? Math.max(0, Math.ceil(rushTimeRemainingRef.current)) : undefined,
        rushScore: gameModeRef.current === 'overtake-rush' ? rushScoreRef.current : undefined,
      });
    }
  };

  // Initialize track and competitors
  useEffect(() => {
    entitiesRef.current = generateTrackEntities(track);
    coinsCollectedRef.current = 0;
    raceElapsedRef.current = 0;
    isRacingRef.current = true;
    speedBoostTimerRef.current = 0;
    puddleSlowTimerRef.current = 0;
    overtakesCountRef.current = 0;
    overtakeStreakRef.current = 0;
    bestStreakRef.current = 0;
    slingshotChargeRef.current = 0;
    popupsRef.current = [];
    particlesRef.current = [];
    rushTimeRemainingRef.current = 50;
    rushScoreRef.current = 0;

    const isRush = gameMode === 'overtake-rush';

    playerRef.current = {
      id: 'player',
      name: 'Você',
      isPlayer: true,
      jerseyColor,
      bikeColor: bike.frameColor,
      distanceMeters: 0,
      lateralOffset: 0,
      speedKmh: 20,
      stamina: 100,
      isSprinting: false,
      isBraking: false,
      isDrafting: false,
      draftingBonus: 0,
      pedalAngle: 0,
      cadenceRpm: 65,
      rank: isRush ? 1 : track.rivalsCount + 1,
      finished: false,
      finishTimeSeconds: null,
    };

    // Initialize rivals ahead
    const rivalCount = isRush ? 8 : track.rivalsCount;
    const selectedRivals = RIVALS.slice(0, rivalCount);

    rivalsRef.current = selectedRivals.map((rival, index) => {
      const row = Math.floor(index / 2);
      const col = index % 2 === 0 ? -0.4 : 0.4;
      const initialDist = isRush ? 20 + index * 18 : 12 + row * 16;

      return {
        id: rival.id,
        name: rival.name,
        isPlayer: false,
        jerseyColor: rival.jerseyColor,
        bikeColor: rival.bikeColor,
        distanceMeters: initialDist,
        lateralOffset: col,
        speedKmh: isRush ? 46 : rival.speedBase * 0.5,
        stamina: 100,
        isSprinting: false,
        isBraking: false,
        isDrafting: false,
        draftingBonus: 0,
        pedalAngle: Math.random() * Math.PI * 2,
        cadenceRpm: 65,
        rank: index + 1,
        finished: false,
        finishTimeSeconds: null,
        reactionBubble: null,
        reactionTimer: 0,
        overtakenByPlayer: false,
      };
    });
  }, [track, bike, jerseyColor, gameMode]);

  // Touch input bell check
  useEffect(() => {
    if (externalInput?.bell) {
      triggerBellRing();
    }
  }, [externalInput?.bell]);

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keysRef.current.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keysRef.current.right = true;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') keysRef.current.up = true;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keysRef.current.down = true;
      if (e.key === 'Shift') keysRef.current.sprint = true;
      if (e.key === 'b' || e.key === 'B') {
        keysRef.current.bell = true;
        triggerBellRing();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keysRef.current.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keysRef.current.right = false;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') keysRef.current.up = false;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keysRef.current.down = false;
      if (e.key === 'Shift') keysRef.current.sprint = false;
      if (e.key === 'b' || e.key === 'B') keysRef.current.bell = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Main Canvas Render & Physics Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      if (isRacingRef.current) {
        raceElapsedRef.current += dt;
        updatePhysics(dt, currentTime);
      }

      renderScene(ctx, canvas);

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  });

  return (
    <div className="relative w-full h-[520px] sm:h-[620px] bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex items-center justify-center select-none">
      <canvas
        ref={canvasRef}
        width={960}
        height={600}
        className="w-full h-full object-cover"
      />
    </div>
  );
};
