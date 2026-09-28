'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GoalkeeperRival, ShotResult, PenaltyTarget, PenaltyMode, MatchPhase, RivalStriker } from '@/types/penaltyGame';
import { BALL_SKINS, BallSkin, BRAZIL_GOALKEEPER } from '@/lib/penaltyData';
import { sounds } from '@/lib/soundEffects';

interface BallState {
  x: number; // 0 is center, -1 is left post, 1 is right post
  y: number; // 0 is ground, 1 is crossbar
  targetX: number;
  targetY: number;
  z: number; // 0 at penalty spot, 1 at goal line
  vz: number;
  curve: number; // lateral spin
  arcHeight: number; // chip or elevation arc
  rotation: number;
  isKicked: boolean;
  isFinished: boolean;
  result: ShotResult;
  speedKmh: number;
}

interface GoalkeeperState {
  x: number; // -1 to 1
  y: number; // 0 to 1
  targetX: number;
  targetY: number;
  isDiving: boolean;
  diveProgress: number; // 0 to 1
  idleTimer: number;
}

interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
}

interface SparkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
}

interface PenaltyCanvasProps {
  mode: PenaltyMode;
  phase: MatchPhase; // 'shoot' (user attacks) vs 'defend' (user is goalkeeper)
  goalkeeper: GoalkeeperRival; // Enemy GK during shoot, or Brazil GK during defend
  striker?: RivalStriker; // Rival striker during defend
  selectedBallId: string;
  onShotComplete: (result: ShotResult, speedKmh: number, isGaveta: boolean, isCavadinha: boolean) => void;
  externalShotTrigger?: {
    targetX: number;
    targetY: number;
    power: number;
    curve: number;
    isChip: boolean;
  } | null;
  roundKey: number;
  // External gloves position from HUD buttons
  externalGlovesDive?: { x: number; y: number } | null;
}

export const PenaltyCanvas: React.FC<PenaltyCanvasProps> = ({
  mode,
  phase,
  goalkeeper,
  striker,
  selectedBallId,
  onShotComplete,
  externalShotTrigger,
  roundKey,
  externalGlovesDive,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const ballSkin: BallSkin =
    BALL_SKINS.find((b) => b.id === selectedBallId) || BALL_SKINS[0];

  // Aiming reticle in goal coordinates (-1 to 1 for x, 0 to 1 for y)
  const [aimTarget, setAimTarget] = useState<{ x: number; y: number }>({ x: 0.75, y: 0.85 });
  const [hasKickedState, setHasKickedState] = useState<boolean>(false);

  // User goalkeeper gloves position in goal coordinates
  const glovesPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0.25 });

  // Ball physics state
  const ballRef = useRef<BallState>({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0.5,
    z: 0,
    vz: 0,
    curve: 0,
    arcHeight: 0,
    rotation: 0,
    isKicked: false,
    isFinished: false,
    result: 'none',
    speedKmh: 0,
  });

  // Goalkeeper state
  const gkRef = useRef<GoalkeeperState>({
    x: 0,
    y: 0.22,
    targetX: 0,
    targetY: 0.22,
    isDiving: false,
    diveProgress: 0,
    idleTimer: 0,
  });

  const netRippleRef = useRef<number>(0);
  const targetsRef = useRef<PenaltyTarget[]>([
    { id: 'top-left', x: -0.75, y: 0.85, points: 250, radius: 24, label: 'ÂNGULO', hit: false },
    { id: 'crossbar', x: 0, y: 1.0, points: 300, radius: 22, label: 'TRAVESSÃO', hit: false },
    { id: 'top-right', x: 0.75, y: 0.85, points: 250, radius: 24, label: 'GAVETA', hit: false },
    { id: 'bot-left', x: -0.78, y: 0.2, points: 150, radius: 22, label: 'CANTO', hit: false },
    { id: 'bot-right', x: 0.78, y: 0.2, points: 150, radius: 22, label: 'CANTO', hit: false },
  ]);

  const confettiRef = useRef<ConfettiParticle[]>([]);
  const sparksRef = useRef<SparkParticle[]>([]);
  const trailRef = useRef<{ x: number; y: number; size: number; alpha: number }[]>([]);

  const [announcement, setAnnouncement] = useState<{
    text: string;
    subtext: string;
    color: string;
    visible: boolean;
  }>({
    text: '',
    subtext: '',
    color: '#ffffff',
    visible: false,
  });

  // Pointer tracking for aim and goalkeeper glove movement
  const isPointerDownRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  // Execute kick function
  const executeKick = useCallback(
    (
      targetX: number,
      targetY: number,
      power: number,
      curve: number = 0,
      isChip: boolean = false
    ) => {
      if (ballRef.current.isKicked) return;

      setHasKickedState(true);

      const clampedPower = Math.max(0.4, Math.min(1.2, power));
      const speedKmh = Math.round(70 + clampedPower * 48);

      sounds.playBallKick(clampedPower);

      const flightDuration = isChip ? 1.05 : Math.max(0.5, 0.95 - clampedPower * 0.38);
      const vz = 1 / flightDuration;

      ballRef.current = {
        ...ballRef.current,
        targetX,
        targetY,
        z: 0,
        vz,
        curve: curve * 0.35,
        arcHeight: isChip ? 0.45 : 0.08,
        speedKmh,
        isKicked: true,
        isFinished: false,
        result: 'none',
      };

      // If user is shooting, AI goalkeeper reacts with balanced, realistic chance
      if (phase === 'shoot') {
        const gk = gkRef.current;
        const rival = goalkeeper;

        // Balanced AI: 55% of the time the keeper dives the WRONG way or stays center!
        // 45% of the time he guesses the general side, but if power is high and placed in corner, he still misses!
        const guessCorrectSide = Math.random() < 0.45;

        let gkTargetX = 0;
        let gkTargetY = 0.25;

        if (guessCorrectSide) {
          const side = Math.sign(targetX) || (Math.random() > 0.5 ? 1 : -1);
          // Goalkeeper dives towards that side, but can only reach around 0.6 max in time
          gkTargetX = side * Math.min(0.65, Math.abs(targetX) * 0.85);
          gkTargetY = Math.max(0.15, Math.min(0.65, targetY * 0.8));
        } else {
          // Dives completely the wrong way or stays rooted!
          const wrongSide = targetX > 0 ? -1 : 1;
          gkTargetX = Math.random() < 0.25 ? 0 : wrongSide * (0.4 + Math.random() * 0.4);
          gkTargetY = 0.2 + Math.random() * 0.3;
        }

        // Delay before diving (reaction time)
        const delayMs = isChip ? 240 : Math.max(120, 280 - rival.agility * 12);

        setTimeout(() => {
          gk.targetX = gkTargetX;
          gk.targetY = gkTargetY;
          gk.isDiving = true;
          gk.diveProgress = 0;
        }, delayMs);
      }
    },
    [goalkeeper, phase]
  );

  // When external dive is triggered from HUD (Goalkeeper mode)
  useEffect(() => {
    if (externalGlovesDive) {
      glovesPosRef.current = {
        x: externalGlovesDive.x,
        y: externalGlovesDive.y,
      };
      gkRef.current.x = externalGlovesDive.x;
      gkRef.current.y = externalGlovesDive.y;
      gkRef.current.isDiving = true;
      gkRef.current.diveProgress = 1;
    }
  }, [externalGlovesDive]);

  // Round key reset & initiation
  useEffect(() => {
    ballRef.current = {
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0.5,
      z: 0,
      vz: 0,
      curve: 0,
      arcHeight: 0,
      rotation: 0,
      isKicked: false,
      isFinished: false,
      result: 'none',
      speedKmh: 0,
    };

    gkRef.current = {
      x: 0,
      y: 0.22,
      targetX: 0,
      targetY: 0.22,
      isDiving: false,
      diveProgress: 0,
      idleTimer: 0,
    };

    glovesPosRef.current = { x: 0, y: 0.25 };
    netRippleRef.current = 0;
    trailRef.current = [];
    confettiRef.current = [];
    sparksRef.current = [];
    targetsRef.current.forEach((t) => (t.hit = false));

    const whistleTimer = setTimeout(() => {
      sounds.playRefereeWhistle();
    }, 350);

    // If in Defend Phase: Rival AI striker automatically shoots after 1.8s!
    let rivalKickTimer: NodeJS.Timeout | null = null;
    if (phase === 'defend') {
      rivalKickTimer = setTimeout(() => {
        // Pick target for rival striker (varies across goals)
        const possibleTargets = [
          { x: -0.75, y: 0.8 }, // Top left
          { x: 0.75, y: 0.8 },  // Top right
          { x: -0.75, y: 0.2 }, // Bot left
          { x: 0.75, y: 0.2 },  // Bot right
          { x: 0, y: 0.98 },    // Crossbar / high
          { x: 0, y: 0.35 },    // Low center
          { x: 0.45, y: 0.6 },  // Mid right
        ];
        const pick = possibleTargets[Math.floor(Math.random() * possibleTargets.length)];
        const power = striker?.power || 0.85;
        const curve = striker?.curve || 0;
        executeKick(pick.x, pick.y, power, curve, pick.y > 0.9);
      }, 1600);
    }

    return () => {
      clearTimeout(whistleTimer);
      if (rivalKickTimer) clearTimeout(rivalKickTimer);
    };
  }, [roundKey, phase, striker, executeKick]);

  // Handle external shot triggers from HUD
  useEffect(() => {
    if (externalShotTrigger && !ballRef.current.isKicked) {
      setAimTarget({ x: externalShotTrigger.targetX, y: externalShotTrigger.targetY });
      executeKick(
        externalShotTrigger.targetX,
        externalShotTrigger.targetY,
        externalShotTrigger.power,
        externalShotTrigger.curve,
        externalShotTrigger.isChip
      );
    }
  }, [externalShotTrigger, executeKick]);

  // Pointer interactions on canvas
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    isPointerDownRef.current = true;
    dragStartRef.current = { x: px, y: py, time: performance.now() };

    const goalLeft = canvas.width * 0.22;
    const goalRight = canvas.width * 0.78;
    const goalTop = canvas.height * 0.22;
    const goalBottom = canvas.height * 0.52;

    if (phase === 'defend') {
      // In Defend phase, pointer directly positions the Goalkeeper's gloves!
      const normX = Math.max(-0.95, Math.min(0.95, ((px - goalLeft) / (goalRight - goalLeft)) * 2 - 1));
      const normY = Math.max(0.05, Math.min(0.95, (goalBottom - py) / (goalBottom - goalTop)));
      glovesPosRef.current = { x: normX, y: normY };
      gkRef.current.x = normX;
      gkRef.current.y = normY;
      gkRef.current.isDiving = true;
    } else {
      // In Shoot phase, clicking directly in or near the goal sets the Aim Reticle!
      if (py <= goalBottom + 40) {
        const normX = Math.max(-1.05, Math.min(1.05, ((px - goalLeft) / (goalRight - goalLeft)) * 2 - 1));
        const normY = Math.max(0.05, Math.min(1.05, (goalBottom - py) / (goalBottom - goalTop)));
        setAimTarget({ x: normX, y: normY });
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    const goalLeft = canvas.width * 0.22;
    const goalRight = canvas.width * 0.78;
    const goalTop = canvas.height * 0.22;
    const goalBottom = canvas.height * 0.52;

    if (phase === 'defend') {
      // Move gloves continuously with mouse/touch!
      const normX = Math.max(-0.95, Math.min(0.95, ((px - goalLeft) / (goalRight - goalLeft)) * 2 - 1));
      const normY = Math.max(0.05, Math.min(0.95, (goalBottom - py) / (goalBottom - goalTop)));
      glovesPosRef.current = { x: normX, y: normY };
      gkRef.current.x = normX;
      gkRef.current.y = normY;
      gkRef.current.isDiving = true;
    } else if (isPointerDownRef.current && !ballRef.current.isKicked) {
      // Dragging aim reticle
      const normX = Math.max(-1.05, Math.min(1.05, ((px - goalLeft) / (goalRight - goalLeft)) * 2 - 1));
      const normY = Math.max(0.05, Math.min(1.05, (goalBottom - py) / (goalBottom - goalTop)));
      setAimTarget({ x: normX, y: normY });
    }
  };

  const handlePointerUp = () => {
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;

    if (phase === 'shoot' && !ballRef.current.isKicked && dragStartRef.current) {
      const dt = Math.max(30, performance.now() - dragStartRef.current.time);
      const isQuickFlick = dt < 350;
      const power = isQuickFlick ? 0.9 : 0.85;
      executeKick(aimTarget.x, aimTarget.y, power, 0, aimTarget.y > 0.95 && aimTarget.x === 0);
    }
    dragStartRef.current = null;
  };

  // Main 60 FPS Canvas Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    const renderStadium = (width: number, height: number) => {
      const horizonY = height * 0.42;

      // Night stadium sky
      const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
      skyGrad.addColorStop(0, '#020617');
      skyGrad.addColorStop(0.5, '#0f172a');
      skyGrad.addColorStop(1, '#1e293b');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, horizonY);

      // Stadium Crowd Stands
      const standsTop = horizonY * 0.35;
      const standsGrad = ctx.createLinearGradient(0, standsTop, 0, horizonY);
      standsGrad.addColorStop(0, '#1e293b');
      standsGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = standsGrad;
      ctx.fillRect(0, standsTop, width, horizonY - standsTop);

      // Floodlights
      const lights = [width * 0.12, width * 0.28, width * 0.72, width * 0.88];
      lights.forEach((lx) => {
        const beamGrad = ctx.createRadialGradient(lx, standsTop * 0.8, 5, lx, horizonY, width * 0.3);
        beamGrad.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
        beamGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.1)');
        beamGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.arc(lx, standsTop * 0.8, width * 0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(lx - 8, standsTop * 0.75, 16, 8);
      });

      // Electronic Advertising board
      ctx.fillStyle = '#09090b';
      ctx.fillRect(width * 0.15, horizonY - 26, width * 0.7, 26);
      ctx.strokeStyle = phase === 'defend' ? '#10b981' : '#eab308';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(width * 0.15, horizonY - 26, width * 0.7, 26);

      ctx.fillStyle = phase === 'defend' ? '#34d399' : '#eab308';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const boardText =
        phase === 'defend'
          ? `🧤 VOCÊ NO GOL! DEFENDA O PÊNALTI DE ${striker?.name || 'ADVERSÁRIO'} 🧤`
          : '⚽ SUPER PÊNALTI • COPA DO MUNDO • BRASIL 2026 ⚽';
      ctx.fillText(boardText, width / 2, horizonY - 13);
    };

    const renderPitch = (width: number, height: number) => {
      const horizonY = height * 0.42;

      const grassGrad = ctx.createLinearGradient(0, horizonY, 0, height);
      grassGrad.addColorStop(0, '#15803d');
      grassGrad.addColorStop(1, '#166534');
      ctx.fillStyle = grassGrad;
      ctx.fillRect(0, horizonY, width, height - horizonY);

      const stripes = 12;
      for (let i = 0; i < stripes; i++) {
        if (i % 2 === 0) {
          const y1 = horizonY + Math.pow(i / stripes, 2.2) * (height - horizonY);
          const y2 = horizonY + Math.pow((i + 1) / stripes, 2.2) * (height - horizonY);
          ctx.fillStyle = 'rgba(21, 128, 61, 0.35)';
          ctx.fillRect(0, y1, width, y2 - y1);
        }
      }

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.lineWidth = 3;

      // Goal line
      const goalLineY = height * 0.52;
      ctx.beginPath();
      ctx.moveTo(width * 0.1, goalLineY);
      ctx.lineTo(width * 0.9, goalLineY);
      ctx.stroke();

      // Penalty box lines
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(width * 0.28, goalLineY);
      ctx.lineTo(width * 0.22, height * 0.62);
      ctx.lineTo(width * 0.78, height * 0.62);
      ctx.lineTo(width * 0.72, goalLineY);
      ctx.stroke();

      // Penalty spot
      const penaltySpotX = width / 2;
      const penaltySpotY = height * 0.88;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(penaltySpotX, penaltySpotY, 8, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    };

    const renderGoal = (width: number, height: number) => {
      const goalLeft = width * 0.22;
      const goalRight = width * 0.78;
      const goalWidth = goalRight - goalLeft;
      const goalTop = height * 0.22;
      const goalBottom = height * 0.52;
      const goalDepth = 40;

      // Back net background
      ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
      ctx.beginPath();
      ctx.moveTo(goalLeft + goalDepth * 0.5, goalTop - goalDepth * 0.2);
      ctx.lineTo(goalRight - goalDepth * 0.5, goalTop - goalDepth * 0.2);
      ctx.lineTo(goalRight - goalDepth * 0.2, goalBottom - 8);
      ctx.lineTo(goalLeft + goalDepth * 0.2, goalBottom - 8);
      ctx.closePath();
      ctx.fill();

      // Net Mesh Lines with physical ripple
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;

      const netCols = 24;
      const netRows = 14;
      const rip = netRippleRef.current;

      for (let c = 0; c <= netCols; c++) {
        const u = c / netCols;
        const xTop = goalLeft + u * goalWidth;
        const xBot = goalLeft + u * goalWidth;
        const rippleOffset = Math.sin(u * Math.PI) * rip * 18;

        ctx.beginPath();
        ctx.moveTo(xTop, goalTop);
        ctx.quadraticCurveTo((xTop + xBot) / 2 + rippleOffset, (goalTop + goalBottom) / 2, xBot, goalBottom);
        ctx.stroke();
      }

      for (let r = 0; r <= netRows; r++) {
        const v = r / netRows;
        const y = goalTop + v * (goalBottom - goalTop);
        const rippleY = Math.sin(v * Math.PI) * rip * 10;

        ctx.beginPath();
        ctx.moveTo(goalLeft, y);
        ctx.quadraticCurveTo(width / 2, y - rippleY, goalRight, y);
        ctx.stroke();
      }

      // Traves e Travessão Metálicos Brancos
      ctx.lineWidth = 10;
      ctx.strokeStyle = '#ffffff';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Sombra sob o travessão
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.moveTo(goalLeft, goalTop + 4);
      ctx.lineTo(goalRight, goalTop + 4);
      ctx.stroke();

      // Traves brancas sólidas
      ctx.strokeStyle = '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(goalLeft, goalBottom);
      ctx.lineTo(goalLeft, goalTop);
      ctx.lineTo(goalRight, goalTop);
      ctx.lineTo(goalRight, goalBottom);
      ctx.stroke();

      // Destaque brilhante metálico
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(goalLeft - 2, goalBottom);
      ctx.lineTo(goalLeft - 2, goalTop - 2);
      ctx.lineTo(goalRight + 2, goalTop - 2);
      ctx.lineTo(goalRight + 2, goalBottom);
      ctx.stroke();
    };

    const renderArcadeTargets = (width: number, height: number) => {
      const goalLeft = width * 0.22;
      const goalRight = width * 0.78;
      const goalTop = height * 0.22;
      const goalBottom = height * 0.52;

      targetsRef.current.forEach((t) => {
        if (t.hit) return;
        const normX = (t.x + 1) / 2;
        const cx = goalLeft + normX * (goalRight - goalLeft);
        const cy = goalBottom - t.y * (goalBottom - goalTop);

        ctx.save();
        ctx.translate(cx, cy);

        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, t.radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(0, 0, t.radius * 0.75, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, t.radius * 0.45, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(0, 0, t.radius * 0.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`+${t.points}`, 0, t.radius + 10);

        ctx.restore();
      });
    };

    // Render Goalkeeper (Enemy GK or Brazilian GK Alisson)
    const updateAndRenderGoalkeeper = (width: number, height: number, dt: number) => {
      const gk = gkRef.current;
      const activeGK = phase === 'defend' ? BRAZIL_GOALKEEPER : goalkeeper;

      const goalLeft = width * 0.22;
      const goalRight = width * 0.78;
      const goalWidth = goalRight - goalLeft;
      const goalTop = height * 0.22;
      const goalBottom = height * 0.52;

      if (phase === 'defend') {
        // Player is goalkeeper: gk position tracks gloves smoothly
        gk.x = glovesPosRef.current.x;
        gk.y = glovesPosRef.current.y;
      } else {
        // Enemy AI goalkeeper
        if (!gk.isDiving) {
          gk.idleTimer += dt * 4;
          gk.x = Math.sin(gk.idleTimer * 0.8) * 0.08;
          gk.y = 0.2 + Math.abs(Math.sin(gk.idleTimer)) * 0.04;
        } else {
          gk.diveProgress = Math.min(1, gk.diveProgress + dt * (2.8 + activeGK.agility * 0.2));
          const t = gk.diveProgress;
          const ease = t * (2 - t);
          gk.x = gk.x + (gk.targetX - gk.x) * ease;
          gk.y = gk.y + (gk.targetY - gk.y) * ease;
        }
      }

      const normX = (gk.x + 1) / 2;
      const gkCanvasX = goalLeft + normX * goalWidth;
      const gkCanvasY = goalBottom - gk.y * (goalBottom - goalTop);

      ctx.save();
      ctx.translate(gkCanvasX, gkCanvasY);

      // Sombra no gramado
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 24, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Ângulo de salto
      const diveAngle = gk.isDiving ? Math.sign(gk.x) * Math.min(1.0, Math.abs(gk.x) * 1.1) : 0;
      ctx.rotate(diveAngle);

      // Torso / Camisa do Goleiro
      ctx.fillStyle = activeGK.jerseyColor;
      ctx.beginPath();
      ctx.roundRect(-14, -48, 28, 36, 6);
      ctx.fill();

      // Cabeça / Rosto
      ctx.fillStyle = activeGK.skinColor;
      ctx.beginPath();
      ctx.arc(0, -56, 9, 0, Math.PI * 2);
      ctx.fill();

      // Cabelo
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(0, -60, 9, Math.PI, Math.PI * 2);
      ctx.fill();

      // Calção
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-12, -16, 24, 14);

      // Pernas
      ctx.fillStyle = activeGK.skinColor;
      ctx.fillRect(-10, -2, 7, 16);
      ctx.fillRect(3, -2, 7, 16);

      // Chuteiras
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-12, 12, 9, 5);
      ctx.fillRect(3, 12, 9, 5);

      // Luvas do Goleiro (Douradas para o Brasil ou da cor do adversário)
      ctx.fillStyle = activeGK.glovesColor;
      if (gk.isDiving || phase === 'defend') {
        // Braços esticados para defesa
        ctx.beginPath();
        ctx.ellipse(-26, -42, 11, 9, -0.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.ellipse(26, -42, 11, 9, 0.4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Posição de prontidão
        ctx.beginPath();
        ctx.ellipse(-20, -32, 9, 7, -0.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.ellipse(20, -32, 9, 7, 0.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Tag de Identificação
      ctx.rotate(-diveAngle);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(-45, -78, 90, 16);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const gkTag =
        phase === 'defend'
          ? '🇧🇷 VOCÊ (Alisson)'
          : `${activeGK.flag} ${activeGK.name.split(' ')[0]}`;
      ctx.fillText(gkTag, 0, -70);

      ctx.restore();
    };

    // Confetti particles for GOAL
    const spawnConfetti = () => {
      const colors = ['#eab308', '#22c55e', '#3b82f6', '#ec4899', '#f97316', '#ffffff'];
      for (let i = 0; i < 45; i++) {
        confettiRef.current.push({
          x: canvas.width * 0.2 + Math.random() * canvas.width * 0.6,
          y: canvas.height * 0.25 + Math.random() * 50,
          vx: (Math.random() - 0.5) * 8,
          vy: -2 - Math.random() * 6,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 5 + Math.random() * 5,
          life: 1.0,
        });
      }
    };

    // Sparks particles for Crossbar / Trave hits
    const spawnSparks = (x: number, y: number) => {
      for (let i = 0; i < 25; i++) {
        sparksRef.current.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 10,
          vy: (Math.random() - 0.5) * 10,
          color: Math.random() > 0.5 ? '#fbbf24' : '#ffffff',
          life: 1.0,
        });
      }
    };

    // Shot Resolution Logic
    const resolveOutcome = (ball: BallState, gk: GoalkeeperState) => {
      ball.isFinished = true;

      const goalLeft = canvas.width * 0.22;
      const goalRight = canvas.width * 0.78;
      const goalTop = canvas.height * 0.22;
      const goalBottom = canvas.height * 0.52;

      // Check Crossbar / Trave Hit with high precision!
      // If user aimed near crossbar (y >= 0.96 and |x| <= 1.05) or posts (|x| >= 0.96)
      const hitCrossbar = ball.targetY >= 0.94 && ball.targetY <= 1.06 && Math.abs(ball.targetX) <= 1.05;
      const hitLeftPost = Math.abs(ball.targetX - -1.0) <= 0.08 && ball.targetY <= 1.02;
      const hitRightPost = Math.abs(ball.targetX - 1.0) <= 0.08 && ball.targetY <= 1.02;

      if (hitCrossbar || hitLeftPost || hitRightPost) {
        ball.result = 'post';
        sounds.playPostHit();
        sounds.playCrowdGasp();

        const hitX = hitLeftPost ? goalLeft : hitRightPost ? goalRight : canvas.width / 2;
        const hitY = hitCrossbar ? goalTop : goalBottom - ball.targetY * (goalBottom - goalTop);
        spawnSparks(hitX, hitY);

        setAnnouncement({
          text: hitCrossbar ? '⚡ EXPLODIU NO TRAVESSÃO!' : '⚡ NA TRAVE! QUE TIRO!',
          subtext: hitCrossbar ? 'A bola carimbou o travessão e quicou!' : 'Bateu na trave e voltou!',
          color: '#f59e0b',
          visible: true,
        });

        onShotComplete('post', ball.speedKmh, false, false);
        return;
      }

      // Check Save Collision:
      // If user is defending (Phase = defend): check user's gloves
      // If user is shooting (Phase = shoot): check enemy AI goalkeeper
      if (phase === 'defend') {
        const gloves = glovesPosRef.current;
        const distToGloves = Math.hypot(ball.targetX - gloves.x, ball.targetY - gloves.y);

        // Player glove reach radius is generous (0.24) so player can make rewarding saves!
        if (distToGloves < 0.24) {
          ball.result = 'saved';
          sounds.playGoalkeeperSave();
          sounds.playGoalCheer(); // Torcida brasileira vibra com a defesaça!

          setAnnouncement({
            text: '🧤 DEFESAAAÇA! VOCÊ SALVOU O BRASIL!',
            subtext: `Alisson Becker voou e espalmou a bola de ${striker?.name || 'adversário'}!`,
            color: '#10b981',
            visible: true,
          });

          onShotComplete('saved', ball.speedKmh, false, false);
          return;
        }
      } else {
        // Enemy AI Goalkeeper:
        // Goalkeeper only saves if he guessed the right side AND shot is not in the gaveta / corners!
        const distToEnemyGK = Math.hypot(ball.targetX - gk.x, ball.targetY - gk.y);
        const isCornerGaveta = Math.abs(ball.targetX) > 0.65 || ball.targetY > 0.75;
        const isFastShot = ball.speedKmh > 95;

        // Enemy GK only saves if within 0.14 radius AND it's not a laser in the corner!
        const canSave = distToEnemyGK < 0.14 && !(isCornerGaveta && isFastShot);

        if (canSave) {
          ball.result = 'saved';
          sounds.playGoalkeeperSave();
          sounds.playCrowdGasp();

          setAnnouncement({
            text: '🧤 GRANDE DEFESA DO GOLEIRO!',
            subtext: `${goalkeeper.name} espalmou a cobrança!`,
            color: '#38bdf8',
            visible: true,
          });

          onShotComplete('saved', ball.speedKmh, false, false);
          return;
        }
      }

      // Check if Ball is Inside Goal Frame (-0.95 <= x <= 0.95 and 0.02 <= y <= 0.96)
      const isInside = Math.abs(ball.targetX) <= 0.96 && ball.targetY >= 0.02 && ball.targetY <= 0.96;

      if (isInside) {
        ball.result = 'goal';
        netRippleRef.current = 1.0;
        sounds.playNetSwish();

        if (phase === 'defend') {
          // Rival scored against player
          sounds.playCrowdGasp();
          setAnnouncement({
            text: '⚽ GOL DO ADVERSÁRIO!',
            subtext: `${striker?.name || 'O atacante'} colocou no fundo da rede!`,
            color: '#ef4444',
            visible: true,
          });
        } else {
          // Player scored!
          sounds.playGoalCheer();
          spawnConfetti();

          const isGaveta = Math.abs(ball.targetX) > 0.65 && ball.targetY > 0.72;
          const isCavadinha = ball.arcHeight > 0.3;

          let title = '⚽ GOOOOOOOOOOOL!';
          let sub = 'Golaço espetacular estufando a rede!';

          if (isGaveta) {
            title = '💥 GOLAÇO NA GAVETA!';
            sub = 'No ângulo onde a coruja dorme!';
          } else if (isCavadinha) {
            title = '😲 CAVADINHA HISTÓRICA!';
            sub = 'Deixou o goleiro na saudade!';
          }

          setAnnouncement({
            text: title,
            subtext: sub,
            color: '#10b981',
            visible: true,
          });

          if (mode === 'arcade') {
            targetsRef.current.forEach((t) => {
              if (Math.hypot(ball.targetX - t.x, ball.targetY - t.y) < 0.22) {
                t.hit = true;
              }
            });
          }
        }

        onShotComplete('goal', ball.speedKmh, ball.targetY > 0.7, ball.arcHeight > 0.3);
      } else {
        // Shot flew outside goal
        ball.result = 'miss';
        sounds.playCrowdGasp();

        setAnnouncement({
          text: '❌ PRA FORA!',
          subtext: 'A bola passou longe da trave!',
          color: '#ef4444',
          visible: true,
        });

        onShotComplete('miss', ball.speedKmh, false, false);
      }
    };

    // Update & Render Ball with EXACT mathematical trajectory
    const updateAndRenderBall = (width: number, height: number, dt: number) => {
      const ball = ballRef.current;
      const gk = gkRef.current;

      const penaltySpotX = width / 2;
      const penaltySpotY = height * 0.88;

      const goalLeft = width * 0.22;
      const goalRight = width * 0.78;
      const goalWidth = goalRight - goalLeft;
      const goalTop = height * 0.22;
      const goalBottom = height * 0.52;

      // Target position on canvas in goal plane
      const normTargetX = (ball.targetX + 1) / 2;
      const targetScreenX = goalLeft + normTargetX * goalWidth;
      const targetScreenY = goalBottom - ball.targetY * (goalBottom - goalTop);

      if (ball.isKicked && !ball.isFinished) {
        ball.z += ball.vz * dt;
        ball.rotation += 14 * dt;

        if (netRippleRef.current > 0) {
          netRippleRef.current = Math.max(0, netRippleRef.current - dt * 1.5);
        }

        if (ball.z >= 1.0) {
          ball.z = 1.0;
          resolveOutcome(ball, gk);
        }
      }

      const z = Math.min(1.0, ball.z);
      const scale = 1 - z * 0.65;
      const ballRadius = Math.max(8, 26 * scale);

      // EXACT Trajectory Mapping:
      // At z = 0, (screenX, screenY) = (penaltySpotX, penaltySpotY)
      // At z = 1, (screenX, screenY) = (targetScreenX, targetScreenY)
      const curveLateral = ball.curve * goalWidth * Math.sin(z * Math.PI);
      const arcVertical = ball.arcHeight * (goalBottom - goalTop) * Math.sin(z * Math.PI);

      const screenX = penaltySpotX + (targetScreenX - penaltySpotX) * z + curveLateral;
      const screenY = penaltySpotY + (targetScreenY - penaltySpotY) * z - arcVertical;

      if (ball.isKicked && !ball.isFinished) {
        trailRef.current.push({
          x: screenX,
          y: screenY,
          size: ballRadius * 0.7,
          alpha: 0.65,
        });
      }

      // Ball Trail
      for (let i = trailRef.current.length - 1; i >= 0; i--) {
        const p = trailRef.current[i];
        p.alpha -= dt * 2.8;
        if (p.alpha <= 0) {
          trailRef.current.splice(i, 1);
          continue;
        }
        ctx.fillStyle = ballSkin.trailColor;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;

      // Ball shadow on grass
      const groundY = penaltySpotY + (goalBottom - penaltySpotY) * z;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(screenX, groundY, ballRadius * 1.1, ballRadius * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Render 3D Soccer Ball
      ctx.save();
      ctx.translate(screenX, screenY);
      ctx.rotate(ball.rotation);

      ctx.fillStyle = ballSkin.color1;
      ctx.beginPath();
      ctx.arc(0, 0, ballRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = ballSkin.color2;
      for (let a = 0; a < 5; a++) {
        const angle = (a * Math.PI * 2) / 5;
        const px = Math.cos(angle) * (ballRadius * 0.55);
        const py = Math.sin(angle) * (ballRadius * 0.55);
        ctx.beginPath();
        ctx.arc(px, py, ballRadius * 0.26, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(0, 0, ballRadius * 0.28, 0, Math.PI * 2);
      ctx.fill();

      const lightGrad = ctx.createRadialGradient(
        -ballRadius * 0.3,
        -ballRadius * 0.3,
        1,
        0,
        0,
        ballRadius
      );
      lightGrad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
      lightGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0)');
      lightGrad.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
      ctx.fillStyle = lightGrad;
      ctx.beginPath();
      ctx.arc(0, 0, ballRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    // Render Aiming Crosshair / Reticle in the Goal (Shooting mode)
    const renderAimReticle = (width: number, height: number) => {
      if (phase !== 'shoot' || ballRef.current.isKicked) return;

      const goalLeft = width * 0.22;
      const goalRight = width * 0.78;
      const goalTop = height * 0.22;
      const goalBottom = height * 0.52;

      const normX = (aimTarget.x + 1) / 2;
      const rx = goalLeft + normX * (goalRight - goalLeft);
      const ry = goalBottom - aimTarget.y * (goalBottom - goalTop);

      // Connecting aim line from ball to target
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(width / 2, height * 0.88);
      ctx.lineTo(rx, ry);
      ctx.stroke();
      ctx.setLineDash([]);

      // Pulsing Reticle Target
      ctx.save();
      ctx.translate(rx, ry);

      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-22, 0);
      ctx.lineTo(-10, 0);
      ctx.moveTo(10, 0);
      ctx.lineTo(22, 0);
      ctx.moveTo(0, -22);
      ctx.lineTo(0, -10);
      ctx.moveTo(0, 10);
      ctx.lineTo(0, 22);
      ctx.stroke();

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    // Render Large Gloves for Player Goalkeeper (Defending mode)
    const renderPlayerGloves = (width: number, height: number) => {
      if (phase !== 'defend') return;

      const goalLeft = width * 0.22;
      const goalRight = width * 0.78;
      const goalTop = height * 0.22;
      const goalBottom = height * 0.52;

      const normX = (glovesPosRef.current.x + 1) / 2;
      const gx = goalLeft + normX * (goalRight - goalLeft);
      const gy = goalBottom - glovesPosRef.current.y * (goalBottom - goalTop);

      ctx.save();
      ctx.translate(gx, gy);

      // Left Glove
      ctx.fillStyle = '#fbbf24'; // Golden Brazil Glove
      ctx.strokeStyle = '#15803d';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.roundRect(-28, -16, 22, 32, 6);
      ctx.fill();
      ctx.stroke();

      // Right Glove
      ctx.beginPath();
      ctx.roundRect(6, -16, 22, 32, 6);
      ctx.fill();
      ctx.stroke();

      // Glove grip circles
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-17, 0, 5, 0, Math.PI * 2);
      ctx.arc(17, 0, 5, 0, Math.PI * 2);
      ctx.fill();

      // Reach indicator ring
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(0, 0, 36, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.restore();
    };

    const renderConfetti = (height: number) => {
      const confetti = confettiRef.current;
      for (let i = confetti.length - 1; i >= 0; i--) {
        const p = confetti[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15;
        p.life -= 0.02;

        if (p.life <= 0 || p.y > height) {
          confetti.splice(i, 1);
          continue;
        }

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.fillRect(p.x, p.y, p.size, p.size * 0.6);
      }
      ctx.globalAlpha = 1.0;
    };

    const renderSparks = () => {
      const sparks = sparksRef.current;
      for (let i = sparks.length - 1; i >= 0; i--) {
        const p = sparks[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.04;

        if (p.life <= 0) {
          sparks.splice(i, 1);
          continue;
        }

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;
    };

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.08);
      lastTime = time;

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);
      renderStadium(width, height);
      renderPitch(width, height);
      renderGoal(width, height);

      if (mode === 'arcade') {
        renderArcadeTargets(width, height);
      }

      updateAndRenderGoalkeeper(width, height, dt);
      renderAimReticle(width, height);
      updateAndRenderBall(width, height, dt);
      renderPlayerGloves(width, height);
      renderConfetti(height);
      renderSparks();

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [mode, phase, goalkeeper, striker, ballSkin, aimTarget, onShotComplete]);

  return (
    <div className="relative w-full h-[480px] sm:h-[580px] bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex items-center justify-center select-none touch-none">
      <canvas
        ref={canvasRef}
        width={960}
        height={600}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="w-full h-full object-cover cursor-crosshair"
      />

      {/* Dynamic Celebration Announcement Overlay */}
      {announcement.visible && (
        <div
          className="absolute top-10 sm:top-14 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl bg-slate-950/90 border-2 shadow-2xl backdrop-blur-md text-center animate-bounce z-20"
          style={{ borderColor: announcement.color }}
        >
          <h3 className="text-xl sm:text-2xl font-black tracking-tight" style={{ color: announcement.color }}>
            {announcement.text}
          </h3>
          <p className="text-xs sm:text-sm font-bold text-white mt-0.5">
            {announcement.subtext}
          </p>
        </div>
      )}

      {/* Turn indicator badge in canvas */}
      <div className="absolute top-3 left-3 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-700 text-xs font-black backdrop-blur-sm flex items-center gap-2 text-white">
        {phase === 'shoot' ? (
          <>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span>⚽ SUA VEZ: Chute no gol!</span>
          </>
        ) : (
          <>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <span>🧤 SUA VEZ: Mova as luvas e defenda!</span>
          </>
        )}
      </div>

      {/* Touch prompt */}
      {!hasKickedState && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-slate-900/80 border border-slate-700 text-xs font-bold text-slate-300 pointer-events-none flex items-center gap-2 backdrop-blur-sm">
          {phase === 'shoot' ? (
            <span>🎯 Toque no gol para mirar e arraste ou clique em CHUTAR</span>
          ) : (
            <span>🧤 Arraste o mouse/dedo na tela para mover as luvas e defender!</span>
          )}
        </div>
      )}
    </div>
  );
};
