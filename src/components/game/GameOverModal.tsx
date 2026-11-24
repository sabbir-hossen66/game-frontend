'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RefreshCw, LogOut, CheckCircle2 } from 'lucide-react';
import { Button } from '../common/Button';
import { ClientRpsGameState, UserProfile } from '../../types';

interface GameOverModalProps {
  gameState: ClientRpsGameState;
  myUserId: string;
  players: Record<string, UserProfile>;
  onRematch: () => void;
  onLeave: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  gameState,
  myUserId,
  players,
  onRematch,
  onLeave,
}) => {
  const isMatchOver = gameState.phase === 'game_over';
  const winnerId = gameState.matchWinnerId;
  const isWinner = winnerId === myUserId;
  const opponentId = gameState.playerIds.find((id) => id !== myUserId) || '';
  const opponentRequestedRematch = gameState.rematchRequested.includes(opponentId);
  const myRematchRequested = gameState.rematchRequested.includes(myUserId);

  useEffect(() => {
    if (isMatchOver && isWinner) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  }, [isMatchOver, isWinner]);

  if (!isMatchOver) return null;

  const winnerProfile = winnerId ? players[winnerId] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-md bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex justify-center mb-4">
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl shadow-xl ${
              isWinner
                ? 'bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 ring-4 ring-yellow-400/30 shadow-yellow-500/30'
                : 'bg-slate-800 text-slate-300 border border-slate-700'
            }`}
          >
            {isWinner ? <Trophy size={42} className="stroke-[2.5]" /> : '⚔️'}
          </div>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-1">
          {isWinner ? 'VICTORY!' : 'DEFEAT'}
        </h2>
        <p className="text-slate-400 text-sm mb-6">
          {isWinner
            ? 'Outstanding reflexes! You conquered the arena!'
            : winnerProfile
            ? `${winnerProfile.nickname} claimed the victory!`
            : 'Well fought battle!'}
        </p>

        {/* Final Scoreboard */}
        <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800/80 mb-6 flex items-center justify-around">
          {gameState.playerIds.map((pid) => {
            const player = players[pid];
            const score = gameState.scores[pid] || 0;
            const isPlayerWinner = winnerId === pid;
            return (
              <div key={pid} className="flex flex-col items-center">
                <span className="text-3xl mb-1">{player?.avatar || '🎮'}</span>
                <span className="text-xs font-medium text-slate-300 max-w-[90px] truncate">
                  {player?.nickname || 'Player'}
                </span>
                <span
                  className={`text-2xl font-bold mt-1 ${
                    isPlayerWinner ? 'text-amber-400' : 'text-slate-400'
                  }`}
                >
                  {score}
                </span>
              </div>
            );
          })}
        </div>

        {/* Rematch Status */}
        {opponentRequestedRematch && !myRematchRequested && (
          <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-xs">
            <CheckCircle2 size={14} /> Opponent wants a rematch!
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant={myRematchRequested ? 'secondary' : 'neon'}
            size="lg"
            className="flex-1"
            onClick={onRematch}
            disabled={myRematchRequested}
          >
            <RefreshCw size={17} className={myRematchRequested ? 'animate-spin' : ''} />
            {myRematchRequested ? 'Waiting for opponent...' : 'Rematch!'}
          </Button>

          <Button variant="ghost" size="lg" onClick={onLeave}>
            <LogOut size={17} /> Leave
          </Button>
        </div>
      </div>
    </div>
  );
};
