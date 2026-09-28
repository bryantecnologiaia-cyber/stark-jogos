'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Track, BikeStorageData, BikeGameMode, BikeRaceStats } from '@/types/bikeGame';
import { TRACKS, BIKES } from '@/lib/bikeData';
import { loadBikeStorage, getInitialBikeStorage, saveRaceResult, recordOvertakeStats } from '@/lib/bikeStorage';
import { TrackSelector } from './TrackSelector';
import { BikeGarage } from './BikeGarage';
import { BikeRaceCanvas } from './BikeRaceCanvas';
import { BikeHUD } from './BikeHUD';
import { PodiumModal } from './PodiumModal';
import { sounds } from '@/lib/soundEffects';
import { ArrowLeft, RotateCcw } from 'lucide-react';

export const BikeGame: React.FC = () => {
  // Navigation inside bike game
  const [view, setView] = useState<'track-select' | 'garage' | 'racing'>('track-select');
  const [storage, setStorage] = useState<BikeStorageData>(() => loadBikeStorage());
  const [gameMode, setGameMode] = useState<BikeGameMode>('grand-tour');
  const [selectedTrack, setSelectedTrack] = useState<Track>(TRACKS[0]);

  // Active race stats for HUD
  const [raceStats, setRaceStats] = useState<BikeRaceStats>({
    speedKmh: 0,
    stamina: 100,
    cadenceRpm: 0,
    rank: 1,
    progressPercent: 0,
    coinsCollected: 0,
    isDrafting: false,
    isSprinting: false,
    distanceLeftMeters: TRACKS[0].distanceMeters,
    overtakesCount: 0,
    overtakeStreak: 0,
    slingshotCharge: 0,
    nextRivalName: null,
    nextRivalDistance: null,
    rushTimeLeft: undefined,
    rushScore: undefined,
  });

  // Touch controls input passed into canvas
  const [externalInput, setExternalInput] = useState({
    steerLeft: false,
    steerRight: false,
    pedal: false,
    sprint: false,
    brake: false,
    bell: false,
  });

  // Race result & podium modal
  const [podiumResult, setPodiumResult] = useState<{
    isOpen: boolean;
    rank: number;
    timeSeconds: number;
    coinsEarned: number;
    medal: 'gold' | 'silver' | 'bronze' | null;
    isNewRecord: boolean;
    overtakesCount: number;
    bestStreak: number;
    rushScore?: number;
  }>({
    isOpen: false,
    rank: 1,
    timeSeconds: 0,
    coinsEarned: 0,
    medal: null,
    isNewRecord: false,
    overtakesCount: 0,
    bestStreak: 0,
  });

  // Key to force reset canvas on restart
  const [raceKey, setRaceKey] = useState<number>(0);

  // Active equipped bike
  const equippedBike =
    BIKES.find((b) => b.id === storage.selectedBikeId) || BIKES[0];

  // Start a race on chosen track
  const handleSelectTrack = (track: Track) => {
    setSelectedTrack(track);
    setPodiumResult((prev) => ({ ...prev, isOpen: false }));
    setRaceKey((prev) => prev + 1);
    setView('racing');
  };

  // Finish race handler
  const handleFinishRace = useCallback(
    (result: {
      timeSeconds: number;
      rank: number;
      distanceMeters: number;
      coinsEarned: number;
      overtakesCount: number;
      bestStreak: number;
      rushScore?: number;
    }) => {
      // Record overtakes in career storage
      recordOvertakeStats(result.overtakesCount, result.bestStreak, result.rushScore);

      const { isNewRecord, medal, updatedData } = saveRaceResult(
        selectedTrack.id,
        result.timeSeconds,
        result.rank,
        result.distanceMeters,
        result.coinsEarned,
        selectedTrack.targetGoldSeconds,
        selectedTrack.targetSilverSeconds
      );

      setStorage(updatedData);

      setPodiumResult({
        isOpen: true,
        rank: result.rank,
        timeSeconds: result.timeSeconds,
        coinsEarned: result.coinsEarned,
        medal,
        isNewRecord,
        overtakesCount: result.overtakesCount,
        bestStreak: result.bestStreak,
        rushScore: result.rushScore,
      });
    },
    [selectedTrack]
  );

  // Restart current track race
  const handleRestartRace = () => {
    setPodiumResult((prev) => ({ ...prev, isOpen: false }));
    setRaceKey((prev) => prev + 1);
  };

  // Ring bell action from HUD
  const handleRingBell = () => {
    setExternalInput((prev) => ({ ...prev, bell: true }));
    setTimeout(() => {
      setExternalInput((prev) => ({ ...prev, bell: false }));
    }, 200);
  };

  return (
    <div className="w-full flex flex-col gap-4 animate-fade-in">
      {/* View 1: Track Selector & Mode Choice */}
      {view === 'track-select' && (
        <TrackSelector
          storage={storage}
          currentGameMode={gameMode}
          onChangeGameMode={(mode) => setGameMode(mode)}
          onSelectTrack={handleSelectTrack}
          onOpenGarage={() => setView('garage')}
        />
      )}

      {/* View 2: Garage & Customizer */}
      {view === 'garage' && (
        <BikeGarage
          storage={storage}
          onUpdateStorage={(newStorage) => setStorage(newStorage)}
          onBack={() => setView('track-select')}
        />
      )}

      {/* View 3: Active Racing */}
      {view === 'racing' && (
        <div className="w-full max-w-5xl mx-auto flex flex-col gap-4">
          {/* Top Bar with Exit & Restart */}
          <div className="flex items-center justify-between pb-1 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  sounds.playSelectLetter(0);
                  setView('track-select');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar ao Menu</span>
              </button>

              <span className="text-sm font-black text-white hidden sm:inline">
                {selectedTrack.name}
              </span>

              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                {gameMode === 'overtake-rush' ? 'Desafio de Ultrapassagens' : 'Grand Tour'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-cyan-400 font-bold hidden sm:inline">
                Bike: {equippedBike.name}
              </span>

              <button
                type="button"
                onClick={() => {
                  sounds.playSelectLetter(0);
                  handleRestartRace();
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                title="Reiniciar Corrida"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reiniciar</span>
              </button>
            </div>
          </div>

          {/* Canvas Rendering 3D Perspective Road with Overtake Dynamics */}
          <BikeRaceCanvas
            key={raceKey}
            track={selectedTrack}
            bike={equippedBike}
            jerseyColor={storage.jerseyColor}
            helmetColor={storage.helmetColor}
            gameMode={gameMode}
            onFinishRace={handleFinishRace}
            onExit={() => setView('track-select')}
            externalInput={externalInput}
            onUpdateStats={(stats) => setRaceStats(stats)}
          />

          {/* Interactive HUD Controls (Speedometer, Stamina, Target Radar, Touch Steering) */}
          <BikeHUD
            speedKmh={raceStats.speedKmh}
            stamina={raceStats.stamina}
            cadenceRpm={raceStats.cadenceRpm}
            rank={raceStats.rank}
            totalRivals={selectedTrack.rivalsCount + 1}
            progressPercent={raceStats.progressPercent}
            coinsCollected={raceStats.coinsCollected}
            isDrafting={raceStats.isDrafting}
            isSprinting={raceStats.isSprinting}
            distanceLeftMeters={raceStats.distanceLeftMeters}
            trackName={selectedTrack.name}
            overtakesCount={raceStats.overtakesCount}
            overtakeStreak={raceStats.overtakeStreak}
            slingshotCharge={raceStats.slingshotCharge}
            nextRivalName={raceStats.nextRivalName}
            nextRivalDistance={raceStats.nextRivalDistance}
            rushTimeLeft={raceStats.rushTimeLeft}
            rushScore={raceStats.rushScore}
            gameMode={gameMode}
            onSteerLeft={(val) =>
              setExternalInput((prev) => ({ ...prev, steerLeft: val }))
            }
            onSteerRight={(val) =>
              setExternalInput((prev) => ({ ...prev, steerRight: val }))
            }
            onSprint={(val) =>
              setExternalInput((prev) => ({ ...prev, sprint: val }))
            }
            onBrake={(val) =>
              setExternalInput((prev) => ({ ...prev, brake: val }))
            }
            onRingBell={handleRingBell}
          />
        </div>
      )}

      {/* Podium Victory Modal */}
      <PodiumModal
        isOpen={podiumResult.isOpen}
        rank={podiumResult.rank}
        timeSeconds={podiumResult.timeSeconds}
        coinsEarned={podiumResult.coinsEarned}
        medal={podiumResult.medal}
        isNewRecord={podiumResult.isNewRecord}
        trackName={selectedTrack.name}
        overtakesCount={podiumResult.overtakesCount}
        bestStreak={podiumResult.bestStreak}
        rushScore={podiumResult.rushScore}
        gameMode={gameMode}
        onRestart={handleRestartRace}
        onNextTrack={() => {
          setPodiumResult((prev) => ({ ...prev, isOpen: false }));
          setView('track-select');
        }}
        onClose={() => setPodiumResult((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
