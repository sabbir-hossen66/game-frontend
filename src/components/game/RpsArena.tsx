'use client';

import React from 'react';
import { ClientRpsGameState, RpsChoice, UserProfile } from '../../types';

interface RpsArenaProps {
  gameState: ClientRpsGameState;
  myUserId: string;
  players: Record<string, UserProfile>;
  onMakeChoice: (choice: RpsChoice) => void;
}

const CHOICE_EMOJIS: Record<RpsChoice, string> = {
  rock: '🪨',
  paper: '📄',
  scissors: '✂️',
};

const CHOICE_NAMES: Record<RpsChoice, string> = {
  rock: 'Rock',
  paper: 'Paper',
  scissors: 'Scissors',
};

export const RpsArena: React.FC<RpsArenaProps> = ({
  gameState,
  myUserId,
  players,
  onMakeChoice,
}) => {
  const [p1Id, p2Id] = gameState.playerIds;
  const isP1 = myUserId === p1Id;
  const opponentId = isP1 ? p2Id : p1Id;

  const myPlayer = players[myUserId];
  const opponentPlayer = players[opponentId];

  const myScore = gameState.scores[myUserId] || 0;
  const opponentScore = gameState.scores[opponentId] || 0;

  const opponentHasChosen = Boolean(gameState.hasMadeChoice[opponentId]);
  const iHaveChosen = Boolean(gameState.myChoice);

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
      {/* Arena Score Header */}
      <div className="w-full bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-3xl p-4 sm:p-6 mb-6 shadow-xl flex items-center justify-between">
        {/* My Profile & Score */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-cyan-600/30 to-slate-900 border border-cyan-500/40 flex items-center justify-center text-3xl">
            {myPlayer?.avatar || '🎮'}
          </div>
          <div>
            <h4 className="font-bold text-sm sm:text-base text-cyan-300">
              {myPlayer?.nickname || 'You'}
            </h4>
            <span className="text-[11px] text-slate-400">Challenger</span>
          </div>
        </div>

        {/* Center Score & Round */}
        <div className="flex flex-col items-center text-center">
          <span className="text-xs uppercase font-extrabold text-cyan-400 tracking-wider">
            Round {gameState.round} / First to {gameState.targetScore}
          </span>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-3xl sm:text-4xl font-black text-cyan-400">{myScore}</span>
            <span className="text-lg text-slate-600 font-bold">:</span>
            <span className="text-3xl sm:text-4xl font-black text-fuchsia-400">{opponentScore}</span>
          </div>
        </div>

        {/* Opponent Profile & Score */}
        <div className="flex items-center gap-3 text-right">
          <div>
            <h4 className="font-bold text-sm sm:text-base text-fuchsia-300">
              {opponentPlayer?.nickname || 'Opponent'}
            </h4>
            <span className="text-[11px] text-slate-400">Rival</span>
          </div>
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-fuchsia-600/30 to-slate-900 border border-fuchsia-500/40 flex items-center justify-center text-3xl">
            {opponentPlayer?.avatar || '👾'}
          </div>
        </div>
      </div>

      {/* Main Duel Stage */}
      <div className="w-full bg-slate-900/60 backdrop-blur-md border border-slate-800/90 rounded-3xl p-6 sm:p-10 shadow-2xl flex flex-col items-center relative overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute -top-32 -left-32 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-72 h-72 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* State Banner & Timer */}
        <div className="mb-8 text-center relative z-10">
          {gameState.phase === 'countdown' && (
            <div className="flex flex-col items-center animate-bounce">
              <span className="text-sm font-semibold uppercase tracking-widest text-cyan-400">
                Get Ready!
              </span>
              <span className="text-6xl sm:text-7xl font-black text-white mt-2 drop-shadow-[0_0_20px_rgba(0,242,254,0.6)]">
                {gameState.timerSeconds}
              </span>
            </div>
          )}

          {gameState.phase === 'choosing' && (
            <div className="flex flex-col items-center">
              <span className="text-sm font-semibold uppercase tracking-widest text-yellow-400">
                Make Your Choice!
              </span>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-4xl font-extrabold text-white">
                  {gameState.timerSeconds}s
                </span>
              </div>
            </div>
          )}

          {gameState.phase === 'revealing' && (
            <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
              <span className="text-xs uppercase font-bold tracking-widest text-slate-400">
                Round Result
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-1 drop-shadow-md">
                {gameState.lastRoundResult?.message}
              </h3>
            </div>
          )}
        </div>

        {/* Reveal Animation Arena (During Reveal) */}
        {gameState.phase === 'revealing' && gameState.revealedChoices && (
          <div className="w-full max-w-lg flex items-center justify-around my-6 relative z-10 animate-in zoom-in-75 duration-300">
            {/* My Revealed Hand */}
            <div className="flex flex-col items-center animate-in slide-in-from-left duration-300">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl bg-cyan-950/60 border-2 border-cyan-400 flex items-center justify-center text-6xl sm:text-7xl shadow-2xl shadow-cyan-500/30">
                {CHOICE_EMOJIS[gameState.revealedChoices[myUserId]]}
              </div>
              <span className="mt-2 text-sm font-bold text-cyan-300 capitalize">
                {CHOICE_NAMES[gameState.revealedChoices[myUserId]]}
              </span>
            </div>

            {/* VS Shockwave */}
            <div className="text-2xl sm:text-3xl font-black text-slate-500 tracking-tighter">
              VS
            </div>

            {/* Opponent Revealed Hand */}
            <div className="flex flex-col items-center animate-in slide-in-from-right duration-300">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl bg-fuchsia-950/60 border-2 border-fuchsia-400 flex items-center justify-center text-6xl sm:text-7xl shadow-2xl shadow-fuchsia-500/30">
                {CHOICE_EMOJIS[gameState.revealedChoices[opponentId]]}
              </div>
              <span className="mt-2 text-sm font-bold text-fuchsia-300 capitalize">
                {CHOICE_NAMES[gameState.revealedChoices[opponentId]]}
              </span>
            </div>
          </div>
        )}

        {/* Choice Buttons Stage (During Choosing) */}
        {gameState.phase === 'choosing' && (
          <div className="w-full flex flex-col items-center relative z-10">
            {/* Opponent status indicator */}
            <div className="mb-6">
              {opponentHasChosen ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-fuchsia-500/20 border border-fuchsia-500/30 text-fuchsia-300 text-xs font-semibold animate-pulse">
                  ✓ Opponent has locked in their move!
                </span>
              ) : (
                <span className="text-xs text-slate-400 italic">
                  Opponent is deciding...
                </span>
              )}
            </div>

            {/* 3 Action Buttons: Rock, Paper, Scissors */}
            <div className="grid grid-cols-3 gap-3 sm:gap-6 w-full max-w-xl">
              {(['rock', 'paper', 'scissors'] as RpsChoice[]).map((choice) => {
                const isSelected = gameState.myChoice === choice;
                return (
                  <button
                    key={choice}
                    onClick={() => onMakeChoice(choice)}
                    disabled={iHaveChosen}
                    className={`group flex flex-col items-center justify-center p-4 sm:p-6 rounded-3xl border transition-all duration-200 cursor-pointer select-none ${
                      isSelected
                        ? 'bg-gradient-to-b from-cyan-500/30 to-blue-600/30 border-cyan-400 ring-4 ring-cyan-400/30 scale-105 shadow-2xl shadow-cyan-500/40'
                        : iHaveChosen
                        ? 'bg-slate-900/60 border-slate-800 opacity-40 cursor-not-allowed'
                        : 'bg-slate-900/90 border-slate-700/80 hover:border-cyan-400/80 hover:bg-slate-800/80 hover:scale-105 active:scale-95 shadow-lg'
                    }`}
                  >
                    <span className="text-4xl sm:text-6xl group-hover:scale-110 transition-transform duration-200">
                      {CHOICE_EMOJIS[choice]}
                    </span>
                    <span
                      className={`mt-2 font-bold text-xs sm:text-sm tracking-wide ${
                        isSelected ? 'text-cyan-300' : 'text-slate-300'
                      }`}
                    >
                      {CHOICE_NAMES[choice]}
                    </span>
                  </button>
                );
              })}
            </div>

            {iHaveChosen && (
              <p className="text-xs text-cyan-400 font-semibold mt-4">
                Move locked in! Waiting for round countdown...
              </p>
            )}
          </div>
        )}

        {/* History of Rounds */}
        {gameState.history.length > 0 && (
          <div className="mt-8 w-full max-w-lg border-t border-slate-800/80 pt-4 relative z-10">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2 text-center">
              Battle History
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {gameState.history.map((h, i) => {
                const won = h.winnerId === myUserId;
                const tie = h.winnerId === 'tie';
                const myHand = isP1 ? h.p1Choice : h.p2Choice;
                const oppHand = isP1 ? h.p2Choice : h.p1Choice;

                return (
                  <div
                    key={i}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border ${
                      won
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                        : tie
                        ? 'bg-slate-800 border-slate-700 text-slate-300'
                        : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                    }`}
                  >
                    <span>R{h.round}:</span>
                    <span>{CHOICE_EMOJIS[myHand]}</span>
                    <span>vs</span>
                    <span>{CHOICE_EMOJIS[oppHand]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
