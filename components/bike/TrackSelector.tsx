'use client';

import React from 'react';
import { Track, BikeGameMode, BikeStorageData } from '@/types/bikeGame';
import { TRACKS } from '@/lib/bikeData';
import { Trophy, Clock, MapPin, Play, Award, Zap, Sparkles, Flame, Rocket, ChevronRight } from 'lucide-react';
import { sounds } from '@/lib/soundEffects';

interface TrackSelectorProps {
  storage: BikeStorageData;
  currentGameMode: BikeGameMode;
  onChangeGameMode: (mode: BikeGameMode) => void;
  onSelectTrack: (track: Track) => void;
  onOpenGarage: () => void;
}

export const TrackSelector: React.FC<TrackSelectorProps> = ({
  storage,
  currentGameMode,
  onChangeGameMode,
  onSelectTrack,
  onOpenGarage,
}) => {
  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6">
      {/* Header Banner */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold mb-2">
            <Zap className="w-3.5 h-3.5" />
            <span>Pedal Radical • Corrida & Ultrapassagens</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Corte o Vento & Ultrapasse os Rivais!
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-xl">
            Acelere, pegue vácuo aerodinâmico para disparar o estilingue, buzine para abrir espaço e ultrapasse cada adversário rumo à vitória!
          </p>
        </div>

        {/* Garage Quick Button */}
        <button
          type="button"
          onClick={() => {
            sounds.playSelectLetter(0);
            onOpenGarage();
          }}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-white font-bold text-sm shadow-lg transition-all cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Garagem & Bikes ({storage.coins} 🪙)</span>
        </button>
      </div>

      {/* Career Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Flame className="w-5 h-5 fill-current" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Ultrapassagens</span>
            <span className="text-lg sm:text-xl font-black text-white font-mono leading-tight">
              {storage.totalOvertakes || 0}
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Rocket className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Maior Combo</span>
            <span className="text-lg sm:text-xl font-black text-cyan-300 font-mono leading-tight">
              x{storage.bestOvertakeStreak || 0}
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Trophy className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Vitórias</span>
            <span className="text-lg sm:text-xl font-black text-white font-mono leading-tight">
              {storage.totalRacesWon || 0}
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Zap className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Recorde Rush</span>
            <span className="text-lg sm:text-xl font-black text-emerald-300 font-mono leading-tight">
              {storage.overtakeRushHighScore || 0} pts
            </span>
          </div>
        </div>
      </div>

      {/* Game Mode Selector Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2 rounded-2xl bg-slate-950 border border-slate-800">
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl">
          <button
            type="button"
            onClick={() => {
              sounds.playSelectLetter(0);
              onChangeGameMode('grand-tour');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
              currentGameMode === 'grand-tour'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Grand Tour • Campeonato (7 Rivais)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playSelectLetter(1);
              onChangeGameMode('overtake-rush');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
              currentGameMode === 'overtake-rush'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Flame className="w-4 h-4 fill-current" />
            <span>Desafio de Ultrapassagens (Overtake Rush)</span>
          </button>
        </div>

        <span className="text-xs text-slate-400 px-3">
          {currentGameMode === 'overtake-rush'
            ? '🔥 Modo infinito focado em passar o máximo de adversários com tempo extra!'
            : '🏁 Disputa posições oficiais do 8º até o 1º lugar do pódio!'}
        </span>
      </div>

      {/* If Overtake Rush is chosen, show a special hero start card */}
      {currentGameMode === 'overtake-rush' && (
        <div className="rounded-3xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="flex-1 flex flex-col gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold w-fit">
              <Flame className="w-4 h-4 fill-current" />
              <span>Modo Especial: Tráfego Intenso de Ciclistas</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white">
              Corrida Frenética: Ultrapasse sem Parar!
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              O relógio começa com <strong className="text-amber-400">50 segundos</strong>. Cada rival que você ultrapassa adiciona <strong className="text-emerald-400">+3.5s no cronômetro</strong>, bônus de nitro e combo multiplicador!
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
              <span>🎯 <strong>Vácuo:</strong> Cole atrás para carregar o Estilingue</span>
              <span>⚡ <strong>Combo:</strong> Ultrapasse vários seguidos</span>
              <span>🔔 <strong>Sino (B):</strong> Nudge rivais do caminho</span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 w-full md:w-auto">
            <button
              type="button"
              onClick={() => {
                sounds.playSelectLetter(0);
                // Start with the city or neon track
                onSelectTrack(TRACKS[3] || TRACKS[0]);
              }}
              className="w-full md:w-64 py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-base shadow-xl shadow-amber-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Flame className="w-5 h-5 fill-current" />
              <span>Jogar Desafio Rush</span>
              <ChevronRight className="w-5 h-5" />
            </button>
            <span className="text-[11px] text-slate-500">Recorde Atual: {storage.overtakeRushHighScore || 0} pts</span>
          </div>
        </div>
      )}

      {/* Tracks Grid (Available for both modes) */}
      <div>
        <h3 className="text-lg font-black text-white mb-3">
          {currentGameMode === 'grand-tour' ? 'Circuitos Oficiais do Grand Tour' : 'Escolha o Cenário para Ultrapassar'}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TRACKS.map((track) => {
            const record = storage.trackRecords[track.id];
            const hasRecord = Boolean(record && record.bestTimeSeconds > 0);

            const medalColor =
              record?.medal === 'gold'
                ? 'text-amber-400'
                : record?.medal === 'silver'
                ? 'text-slate-300'
                : record?.medal === 'bronze'
                ? 'text-amber-600'
                : 'text-slate-600';

            const difficultyBadge = {
              facil: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
              medio: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
              dificil: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
              mestre: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
            }[track.difficulty];

            return (
              <div
                key={track.id}
                className="rounded-3xl bg-slate-900 border border-slate-800 p-5 sm:p-6 flex flex-col justify-between gap-5 hover:border-slate-700 transition-all shadow-xl group"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${difficultyBadge}`}
                    >
                      {track.difficulty.toUpperCase()} • {track.distanceMeters}m
                    </span>

                    {/* Medal Icon if achieved in Grand Tour */}
                    {record?.medal && currentGameMode === 'grand-tour' && (
                      <div className="flex items-center gap-1 text-xs font-bold bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">
                        <Award className={`w-4 h-4 ${medalColor}`} />
                        <span className="capitalize text-slate-300">Medalha {record.medal}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-xl font-black text-white group-hover:text-cyan-300 transition-colors">
                      {track.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{track.subtitle}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    {track.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Tempo Ouro: &le;{track.targetGoldSeconds}s</span>
                    </div>
                    {hasRecord && (
                      <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                        <Trophy className="w-3.5 h-3.5" />
                        <span>Seu Recorde: {record.bestTimeSeconds.toFixed(1)}s</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Start Race Button */}
                <button
                  type="button"
                  onClick={() => {
                    sounds.playSelectLetter(0);
                    onSelectTrack(track);
                  }}
                  className={`w-full flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl text-slate-950 font-black text-sm shadow-lg active:scale-[0.98] transition-transform cursor-pointer ${
                    currentGameMode === 'overtake-rush'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 shadow-amber-500/20'
                      : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 shadow-cyan-500/20'
                  }`}
                >
                  <span>{currentGameMode === 'overtake-rush' ? 'Iniciar Desafio de Ultrapassagens' : 'Iniciar Etapa'}</span>
                  <Play className="w-4 h-4 fill-current" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
