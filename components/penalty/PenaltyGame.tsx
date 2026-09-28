'use client';

import React, { useState, useCallback } from 'react';
import { PenaltyMode, MatchPhase, ShotResult, ShootoutRound, GoalkeeperRival, RivalStriker } from '@/types/penaltyGame';
import { GOALKEEPERS, RIVAL_STRIKERS, BRAZIL_GOALKEEPER, loadPenaltyStorage, updatePenaltyStorage, BallSkin } from '@/lib/penaltyData';
import { PenaltyCanvas } from './PenaltyCanvas';
import { PenaltyHUD } from './PenaltyHUD';
import { PenaltyBallShop } from './PenaltyBallShop';
import { PenaltyCupVictoryModal } from './PenaltyCupVictoryModal';
import { sounds } from '@/lib/soundEffects';

export const PenaltyGame: React.FC = () => {
  // Storage & Profile
  const [storage, setStorage] = useState(() => loadPenaltyStorage());
  const [isBallShopOpen, setIsBallShopOpen] = useState<boolean>(false);

  // Game Mode: 'cup' (Chuta & Defende) | 'goalkeeper' (Só Defesas) | 'striker' (Só Chutes) | 'arcade' (Alvos)
  const [mode, setMode] = useState<PenaltyMode>('cup');

  // Match Phase: 'shoot' (user attacks) vs 'defend' (user is goalkeeper)
  const [phase, setPhase] = useState<MatchPhase>('shoot');

  // Active Rival Goalkeeper & Striker
  const [rivalIndex, setRivalIndex] = useState<number>(0);
  const activeGoalkeeper: GoalkeeperRival = GOALKEEPERS[rivalIndex] || GOALKEEPERS[0];
  const activeStriker: RivalStriker = RIVAL_STRIKERS[rivalIndex] || RIVAL_STRIKERS[0];

  // Round key to trigger canvas re-renders
  const [roundKey, setRoundKey] = useState<number>(0);

  // Shootout Rounds (5 rounds of Player vs Rival)
  const [rounds, setRounds] = useState<ShootoutRound[]>([
    { roundNumber: 1, playerScore: null, rivalScore: null },
    { roundNumber: 2, playerScore: null, rivalScore: null },
    { roundNumber: 3, playerScore: null, rivalScore: null },
    { roundNumber: 4, playerScore: null, rivalScore: null },
    { roundNumber: 5, playerScore: null, rivalScore: null },
  ]);
  const [currentRoundIdx, setCurrentRoundIdx] = useState<number>(0);

  // Player saves counter
  const [playerSaves, setPlayerSaves] = useState<number>(0);

  // Flag if user is allowed to act
  const [isKickingAllowed, setIsKickingAllowed] = useState<boolean>(true);

  // External triggers from HUD buttons
  const [externalShot, setExternalShot] = useState<{
    targetX: number;
    targetY: number;
    power: number;
    curve: number;
    isChip: boolean;
  } | null>(null);

  const [externalGlovesDive, setExternalGlovesDive] = useState<{ x: number; y: number } | null>(null);

  // Arcade Score & Streak
  const [arcadeScore, setArcadeScore] = useState<number>(0);
  const [arcadeStreak, setArcadeStreak] = useState<number>(0);

  // Victory Modal State
  const [victoryModal, setVictoryModal] = useState<{
    isOpen: boolean;
    isWinner: boolean;
    coinsEarned: number;
  }>({
    isOpen: false,
    isWinner: false,
    coinsEarned: 0,
  });

  // Calculate scores
  const playerGoals = rounds.filter((r) => r.playerScore === 'goal').length;
  const rivalGoals = rounds.filter((r) => r.rivalScore === 'goal').length;

  // Handle Shot / Action Completion
  const handleShotComplete = useCallback(
    (result: ShotResult, _speedKmh: number, isGaveta: boolean, isCavadinha: boolean) => {
      setIsKickingAllowed(false);

      if (mode === 'cup') {
        if (phase === 'shoot') {
          // Player finished shooting
          setRounds((prev) => {
            const next = [...prev];
            if (next[currentRoundIdx]) {
              next[currentRoundIdx] = {
                ...next[currentRoundIdx],
                playerScore: result,
              };
            }
            return next;
          });

          if (result === 'goal') {
            const earned = isGaveta ? 15 : isCavadinha ? 20 : 10;
            setStorage((prev) =>
              updatePenaltyStorage((s) => ({
                ...s,
                coins: s.coins + earned,
                totalGoals: s.totalGoals + 1,
                totalKicks: s.totalKicks + 1,
              }))
            );
          } else {
            setStorage((prev) =>
              updatePenaltyStorage((s) => ({
                ...s,
                totalKicks: s.totalKicks + 1,
              }))
            );
          }
        } else {
          // Rival shot while player was defending as Goalkeeper!
          const rivalResult = result;
          const isPlayerSave = result === 'saved';

          if (isPlayerSave) {
            setPlayerSaves((s) => s + 1);
            setStorage((prev) =>
              updatePenaltyStorage((s) => ({
                ...s,
                coins: s.coins + 20, // reward for heroic save!
                totalSaves: s.totalSaves + 1,
              }))
            );
          }

          setRounds((prev) => {
            const next = [...prev];
            if (next[currentRoundIdx]) {
              next[currentRoundIdx] = {
                ...next[currentRoundIdx],
                rivalScore: rivalResult,
              };
            }
            return next;
          });

          // Check if match is finished after 5 full rounds
          if (currentRoundIdx >= 4) {
            setTimeout(() => {
              const finalPlayerGoals = playerGoals + (rounds[4]?.playerScore === 'goal' ? 1 : 0);
              const finalRivalGoals = rivalGoals + (rivalResult === 'goal' ? 1 : 0);
              const isWinner = finalPlayerGoals >= finalRivalGoals;
              const rewardCoins = isWinner ? 60 : 15;

              if (isWinner) {
                sounds.playUnlockAchievement();
                setStorage((prev) =>
                  updatePenaltyStorage((s) => ({
                    ...s,
                    coins: s.coins + rewardCoins,
                    cupsWon: s.cupsWon + 1,
                  }))
                );
              }

              setVictoryModal({
                isOpen: true,
                isWinner,
                coinsEarned: rewardCoins,
              });
            }, 1600);
          }
        }
      } else if (mode === 'goalkeeper') {
        // Solely defending
        const isPlayerSave = result === 'saved';
        if (isPlayerSave) {
          setPlayerSaves((s) => s + 1);
          setStorage((prev) =>
            updatePenaltyStorage((s) => ({
              ...s,
              coins: s.coins + 25,
              totalSaves: s.totalSaves + 1,
            }))
          );
        }

        setRounds((prev) => {
          const next = [...prev];
          if (next[currentRoundIdx]) {
            next[currentRoundIdx] = {
              ...next[currentRoundIdx],
              rivalScore: result,
              playerScore: isPlayerSave ? 'goal' : 'saved', // save counts as player win in keeper mode
            };
          }
          return next;
        });

        if (currentRoundIdx >= 4) {
          setTimeout(() => {
            const saves = playerSaves + (isPlayerSave ? 1 : 0);
            const isWinner = saves >= 3;
            const rewardCoins = isWinner ? 50 : 15;

            if (isWinner) {
              sounds.playUnlockAchievement();
              setStorage((prev) =>
                updatePenaltyStorage((s) => ({
                  ...s,
                  coins: s.coins + rewardCoins,
                  cupsWon: s.cupsWon + 1,
                }))
              );
            }

            setVictoryModal({
              isOpen: true,
              isWinner,
              coinsEarned: rewardCoins,
            });
          }, 1500);
        }
      } else if (mode === 'striker') {
        // Solely shooting
        setRounds((prev) => {
          const next = [...prev];
          if (next[currentRoundIdx]) {
            next[currentRoundIdx] = {
              ...next[currentRoundIdx],
              playerScore: result,
              rivalScore: Math.random() < 0.6 ? 'goal' : 'saved',
            };
          }
          return next;
        });

        if (result === 'goal') {
          const earned = isGaveta ? 15 : isCavadinha ? 20 : 10;
          setStorage((prev) =>
            updatePenaltyStorage((s) => ({
              ...s,
              coins: s.coins + earned,
              totalGoals: s.totalGoals + 1,
              totalKicks: s.totalKicks + 1,
            }))
          );
        } else {
          setStorage((prev) =>
            updatePenaltyStorage((s) => ({
              ...s,
              totalKicks: s.totalKicks + 1,
            }))
          );
        }

        if (currentRoundIdx >= 4) {
          setTimeout(() => {
            const finalPlayerGoals = playerGoals + (result === 'goal' ? 1 : 0);
            const isWinner = finalPlayerGoals >= 3;
            const rewardCoins = isWinner ? 40 : 10;

            if (isWinner) {
              sounds.playUnlockAchievement();
              setStorage((prev) =>
                updatePenaltyStorage((s) => ({
                  ...s,
                  coins: s.coins + rewardCoins,
                  cupsWon: s.cupsWon + 1,
                }))
              );
            }

            setVictoryModal({
              isOpen: true,
              isWinner,
              coinsEarned: rewardCoins,
            });
          }, 1500);
        }
      } else {
        // Arcade Target Mode
        if (result === 'goal' || result === 'post') {
          const basePts = isGaveta ? 350 : isCavadinha ? 400 : result === 'post' ? 300 : 150;
          const streakMultiplier = Math.max(1, arcadeStreak + 1);
          const pointsEarned = basePts * streakMultiplier;

          setArcadeScore((prev) => {
            const next = prev + pointsEarned;
            if (next > storage.bestArcadeScore) {
              setStorage((s) =>
                updatePenaltyStorage((st) => ({
                  ...st,
                  bestArcadeScore: next,
                }))
              );
            }
            return next;
          });
          setArcadeStreak((prev) => prev + 1);

          setStorage((s) =>
            updatePenaltyStorage((st) => ({
              ...st,
              coins: st.coins + 5 * streakMultiplier,
              totalGoals: s.totalGoals + 1,
              totalKicks: s.totalKicks + 1,
            }))
          );
        } else {
          setArcadeStreak(0);
          setStorage((s) =>
            updatePenaltyStorage((st) => ({
              ...st,
              totalKicks: s.totalKicks + 1,
            }))
          );
        }
      }
    },
    [mode, phase, currentRoundIdx, playerGoals, rivalGoals, playerSaves, arcadeStreak, storage.bestArcadeScore, rounds]
  );

  // Next round / Next play
  const handleNextRound = () => {
    setExternalShot(null);
    setExternalGlovesDive(null);
    setIsKickingAllowed(true);

    if (mode === 'cup') {
      if (phase === 'shoot') {
        // Switch to defend phase (Rival kicks, player defends)
        setPhase('defend');
      } else {
        // Switch back to shoot phase and advance round index
        setPhase('shoot');
        setCurrentRoundIdx((prev) => Math.min(4, prev + 1));
      }
    } else {
      setCurrentRoundIdx((prev) => Math.min(4, prev + 1));
    }

    setRoundKey((prev) => prev + 1);
  };

  // Reset match
  const handleResetMatch = () => {
    setRounds([
      { roundNumber: 1, playerScore: null, rivalScore: null },
      { roundNumber: 2, playerScore: null, rivalScore: null },
      { roundNumber: 3, playerScore: null, rivalScore: null },
      { roundNumber: 4, playerScore: null, rivalScore: null },
      { roundNumber: 5, playerScore: null, rivalScore: null },
    ]);
    setCurrentRoundIdx(0);
    setPlayerSaves(0);
    setArcadeScore(0);
    setArcadeStreak(0);
    setIsKickingAllowed(true);
    setExternalShot(null);
    setExternalGlovesDive(null);
    setPhase(mode === 'goalkeeper' ? 'defend' : 'shoot');
    setVictoryModal((prev) => ({ ...prev, isOpen: false }));
    setRoundKey((prev) => prev + 1);
  };

  // Switch mode
  const handleChangeMode = (newMode: PenaltyMode) => {
    setMode(newMode);
    setPhase(newMode === 'goalkeeper' ? 'defend' : 'shoot');
    setRounds([
      { roundNumber: 1, playerScore: null, rivalScore: null },
      { roundNumber: 2, playerScore: null, rivalScore: null },
      { roundNumber: 3, playerScore: null, rivalScore: null },
      { roundNumber: 4, playerScore: null, rivalScore: null },
      { roundNumber: 5, playerScore: null, rivalScore: null },
    ]);
    setCurrentRoundIdx(0);
    setPlayerSaves(0);
    setArcadeScore(0);
    setArcadeStreak(0);
    setIsKickingAllowed(true);
    setExternalShot(null);
    setExternalGlovesDive(null);
    setVictoryModal((prev) => ({ ...prev, isOpen: false }));
    setRoundKey((prev) => prev + 1);
  };

  // Next Opponent team
  const handleNextOpponent = () => {
    setRivalIndex((prev) => (prev + 1) % GOALKEEPERS.length);
    handleResetMatch();
  };

  // Triggered by HUD manual shooting
  const handleTriggerShot = (
    targetX: number,
    targetY: number,
    power: number,
    curve: number,
    isChip: boolean
  ) => {
    setExternalShot({
      targetX,
      targetY,
      power,
      curve,
      isChip,
    });
  };

  // Triggered by HUD goalkeeper dive buttons
  const handleTriggerGlovesDive = (x: number, y: number) => {
    setExternalGlovesDive({ x, y });
  };

  // Ball purchase
  const handleBuyBall = (ball: BallSkin) => {
    setStorage((prev) =>
      updatePenaltyStorage((s) => ({
        ...s,
        coins: s.coins - ball.price,
        selectedBall: ball.id,
        unlockedBalls: [...s.unlockedBalls, ball.id],
      }))
    );
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-4 animate-fade-in">
      {/* 3D Penalty Canvas */}
      <PenaltyCanvas
        key={roundKey}
        roundKey={roundKey}
        mode={mode}
        phase={phase}
        goalkeeper={phase === 'defend' ? BRAZIL_GOALKEEPER : activeGoalkeeper}
        striker={activeStriker}
        selectedBallId={storage.selectedBall}
        onShotComplete={handleShotComplete}
        externalShotTrigger={externalShot}
        externalGlovesDive={externalGlovesDive}
      />

      {/* Control Dashboard & Scoreboard */}
      <PenaltyHUD
        mode={mode}
        phase={phase}
        goalkeeper={activeGoalkeeper}
        striker={activeStriker}
        rounds={rounds}
        currentRoundIndex={currentRoundIdx}
        playerGoals={playerGoals}
        rivalGoals={rivalGoals}
        playerSaves={playerSaves}
        arcadeScore={arcadeScore}
        arcadeStreak={arcadeStreak}
        isKickingAllowed={isKickingAllowed}
        onTriggerShot={handleTriggerShot}
        onTriggerGlovesDive={handleTriggerGlovesDive}
        onNextRound={handleNextRound}
        onResetMatch={handleResetMatch}
        onChangeMode={handleChangeMode}
        onOpenBallShop={() => setIsBallShopOpen(true)}
        coins={storage.coins}
      />

      {/* Ball Shop Modal */}
      <PenaltyBallShop
        isOpen={isBallShopOpen}
        coins={storage.coins}
        selectedBallId={storage.selectedBall}
        unlockedBallIds={storage.unlockedBalls}
        onSelectBall={(id) => {
          setStorage((prev) =>
            updatePenaltyStorage((s) => ({
              ...s,
              selectedBall: id,
            }))
          );
        }}
        onBuyBall={handleBuyBall}
        onClose={() => setIsBallShopOpen(false)}
      />

      {/* Cup Victory Celebration Modal */}
      <PenaltyCupVictoryModal
        isOpen={victoryModal.isOpen}
        isWinner={victoryModal.isWinner}
        playerGoals={playerGoals}
        rivalGoals={rivalGoals}
        playerSaves={playerSaves}
        rivalTeam={activeGoalkeeper.team}
        rivalFlag={activeGoalkeeper.flag}
        coinsEarned={victoryModal.coinsEarned}
        onPlayAgain={handleResetMatch}
        onNextOpponent={handleNextOpponent}
      />
    </div>
  );
};
