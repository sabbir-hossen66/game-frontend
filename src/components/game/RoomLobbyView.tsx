'use client';

import React, { useState } from 'react';
import { Copy, Check, Play, UserCheck, Shield, UserX, Crown } from 'lucide-react';
import { Button } from '../common/Button';
import { Room, UserProfile } from '../../types';

interface RoomLobbyViewProps {
  room: Room;
  myUserId: string;
  isHost: boolean;
  onToggleReady: () => void;
  onStartGame: () => void;
  onKickPlayer: (targetUserId: string) => void;
}

export const RoomLobbyView: React.FC<RoomLobbyViewProps> = ({
  room,
  myUserId,
  isHost,
  onToggleReady,
  onStartGame,
  onKickPlayer,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const playersList = Object.values(room.players);
  const myPlayer = room.players[myUserId];
  const allReady = playersList.length >= 2 && playersList.every((p) => p.isReady);

  const copyRoomCode = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(room.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const copyRoomLink = () => {
    if (typeof window !== 'undefined') {
      const shareUrl = `${window.location.origin}/lobby?join=${room.code}`;
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Room Header & Share Box */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold text-cyan-400 tracking-wider">
            Game Room • 1v1 Battle
          </span>
          <h2 className="text-2xl font-bold text-white mt-0.5">{room.name}</h2>
          <p className="text-xs text-slate-400 mt-1">
            Target: First to {room.roundsToWin} wins • Free Peer-to-Peer Voice Enabled
          </p>
        </div>

        {/* Room Code Badge */}
        <div className="flex items-center gap-2 bg-slate-950 px-4 py-2.5 rounded-2xl border border-slate-800 shadow-inner">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Room Code</span>
            <span className="text-xl font-mono font-black text-cyan-400 tracking-widest">{room.code}</span>
          </div>
          <button
            onClick={copyRoomCode}
            className="p-2 ml-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
            title="Copy 6-digit Code"
          >
            {copiedCode ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
          </button>
        </div>
      </div>

      {/* Players Grid (Slots) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {playersList.map((player) => {
          const isSelf = player.id === myUserId;
          return (
            <div
              key={player.id}
              className={`p-5 rounded-3xl border transition-all relative overflow-hidden ${
                player.isReady
                  ? 'bg-slate-900/90 border-emerald-500/40 shadow-lg shadow-emerald-500/5'
                  : 'bg-slate-900/50 border-slate-800'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/60 flex items-center justify-center text-4xl shadow-md">
                  {player.avatar || '🎮'}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-base text-slate-100 truncate">{player.nickname}</h4>
                    {player.isHost && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                        <Crown size={11} /> Host
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{isSelf ? '(You)' : 'Opponent'}</p>

                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                        player.isReady
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {player.isReady ? 'READY TO BATTLE' : 'PREPARING...'}
                    </span>
                  </div>
                </div>

                {/* Host kick button */}
                {isHost && !isSelf && (
                  <button
                    onClick={() => onKickPlayer(player.id)}
                    title="Kick player"
                    className="p-2 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <UserX size={18} />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Empty Slot for 2nd player */}
        {playersList.length < 2 && (
          <div className="p-5 rounded-3xl border border-dashed border-slate-800 bg-slate-950/40 flex flex-col items-center justify-center text-center py-8">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-2xl text-slate-500 mb-2">
              ⏳
            </div>
            <p className="text-sm font-semibold text-slate-300">Waiting for Opponent...</p>
            <p className="text-xs text-slate-500 mt-1">Share the room code or link to invite a friend</p>
            <Button variant="secondary" size="sm" onClick={copyRoomLink} className="mt-3 text-xs">
              {copiedLink ? 'Link Copied!' : 'Copy Invite Link'}
            </Button>
          </div>
        )}
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4">
        <div>
          <p className="text-xs text-slate-400">
            {playersList.length < 2
              ? 'Waiting for another challenger to join...'
              : allReady
              ? 'Both players are ready! Host can start the battle.'
              : 'Waiting for both players to toggle Ready.'}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Ready Button for non-host or toggle */}
          <Button
            variant={myPlayer?.isReady ? 'secondary' : 'neon'}
            size="md"
            onClick={onToggleReady}
            className="flex-1 sm:flex-initial"
          >
            <UserCheck size={16} />
            {myPlayer?.isReady ? 'Cancel Ready' : 'I am Ready!'}
          </Button>

          {/* Host Start Game Button */}
          {isHost && (
            <Button
              variant="primary"
              size="md"
              onClick={onStartGame}
              disabled={playersList.length < 2}
              className="flex-1 sm:flex-initial"
            >
              <Play size={16} /> Start Game
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
