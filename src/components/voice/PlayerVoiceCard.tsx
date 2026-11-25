'use client';

import React, { useState } from 'react';
import { Volume2, VolumeX, MicOff, Shield, Mic, Crown } from 'lucide-react';
import { UserProfile, VoicePeer } from '../../types';

interface PlayerVoiceCardProps {
  player: UserProfile;
  peer?: VoicePeer;
  isSelf: boolean;
  isRoomHost: boolean;
  onSetVolume?: (volume: number) => void;
  onToggleLocalMute?: () => void;
  onHostMuteToggle?: (targetUserId: string, mute: boolean) => void;
}

export const PlayerVoiceCard: React.FC<PlayerVoiceCardProps> = ({
  player,
  peer,
  isSelf,
  isRoomHost,
  onSetVolume,
  onToggleLocalMute,
  onHostMuteToggle,
}) => {
  const [showVolumeControls, setShowVolumeControls] = useState(false);

  const isSpeaking = isSelf ? player.isSpeaking : peer?.isSpeaking ?? player.isSpeaking;
  const isMuted = isSelf
    ? player.isMuted || player.isMutedByHost
    : peer?.isMuted ?? player.isMuted ?? player.isMutedByHost;
  const isLocallyMuted = peer?.isLocallyMuted ?? false;
  const currentVolume = peer?.volume ?? 1;

  return (
    <div className="relative flex flex-col items-center p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 transition-all hover:border-slate-700">
      {/* Speaking Avatar Container */}
      <div className="relative flex items-center justify-center">
        {/* Animated speaking ring */}
        <div
          className={`absolute inset-0 rounded-full transition-all duration-200 ${
            isSpeaking && !isMuted
              ? 'ring-4 ring-cyan-400/80 ring-offset-4 ring-offset-slate-900 shadow-xl shadow-cyan-500/40 animate-pulse scale-105'
              : 'ring-1 ring-slate-800'
          }`}
        />

        {/* Avatar circle */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-3xl sm:text-4xl shadow-inner relative z-10 select-none">
          {player.avatar || '🎮'}
        </div>

        {/* Host Crown Icon */}
        {player.isHost && (
          <div
            className="absolute -top-1.5 -right-1.5 z-20 bg-amber-500 text-slate-950 p-1 rounded-full shadow-md shadow-amber-500/30"
            title="Room Host"
          >
            <Crown size={12} className="fill-current" />
          </div>
        )}

        {/* Muted Icon Badge */}
        {isMuted && (
          <div
            className="absolute -bottom-1 -right-1 z-20 bg-rose-600 text-white p-1 rounded-full shadow-md shadow-rose-600/30"
            title={player.isMutedByHost ? 'Muted by Host' : 'Muted'}
          >
            <MicOff size={12} />
          </div>
        )}

        {/* Speaking Icon Badge */}
        {isSpeaking && !isMuted && (
          <div
            className="absolute -bottom-1 -right-1 z-20 bg-emerald-500 text-slate-950 p-1 rounded-full shadow-md shadow-emerald-500/30 animate-bounce"
            title="Speaking"
          >
            <Mic size={12} />
          </div>
        )}
      </div>

      {/* Nickname & Tags */}
      <div className="mt-2.5 text-center w-full">
        <p className="text-sm font-semibold text-slate-200 truncate flex items-center justify-center gap-1">
          {player.nickname} {isSelf && <span className="text-[11px] text-cyan-400 font-normal">(You)</span>}
        </p>

        {player.isReady !== undefined && (
          <span
            className={`inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full mt-1 ${
              player.isReady
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            {player.isReady ? 'Ready' : 'Not Ready'}
          </span>
        )}
      </div>

      {/* Remote Voice Controls (Local Mute & Volume Slider for others) */}
      {!isSelf && (
        <div className="mt-2 w-full pt-2 border-t border-slate-800/80 flex items-center justify-center gap-1.5">
          <button
            onClick={onToggleLocalMute}
            title={isLocallyMuted ? 'Unmute for you' : 'Mute for you'}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              isLocallyMuted
                ? 'bg-rose-950 text-rose-400 border-rose-800'
                : 'bg-slate-800 text-slate-400 hover:text-white border-slate-700'
            }`}
          >
            {isLocallyMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
          </button>

          <button
            onClick={() => setShowVolumeControls((p) => !p)}
            className="text-[10px] text-slate-400 hover:text-cyan-400 px-2 py-1 bg-slate-800/60 rounded-md border border-slate-700/60 cursor-pointer"
          >
            Vol: {Math.round(currentVolume * 100)}%
          </button>

          {/* Host Mute Player */}
          {isRoomHost && (
            <button
              onClick={() => onHostMuteToggle && onHostMuteToggle(player.id, !player.isMutedByHost)}
              title={player.isMutedByHost ? 'Host: Unmute player' : 'Host: Mute player'}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                player.isMutedByHost
                  ? 'bg-rose-950 text-rose-400 border-rose-800'
                  : 'bg-slate-800 text-slate-400 hover:text-amber-400 border-slate-700'
              }`}
            >
              <Shield size={13} />
            </button>
          )}
        </div>
      )}

      {/* Floating mini volume slider */}
      {!isSelf && showVolumeControls && onSetVolume && (
        <div className="mt-2 w-full px-2">
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={currentVolume}
            onChange={(e) => onSetVolume(parseFloat(e.target.value))}
            className="w-full accent-cyan-400 h-1 bg-slate-700 rounded-lg cursor-pointer"
          />
        </div>
      )}

      {/* Direct JSX Audio Element to guarantee Mobile Browser WebKit & Android Playback */}
      {!isSelf && peer?.stream && (
        <audio
          ref={(el) => {
            if (el && peer?.stream) {
              if (el.srcObject !== peer.stream) {
                el.srcObject = peer.stream;
              }
              el.volume = isLocallyMuted ? 0 : currentVolume;
              el.muted = isLocallyMuted;
              if (el.paused) {
                el.play().catch(() => {});
              }
            }
          }}
          autoPlay
          playsInline
          style={{
            position: 'fixed',
            top: '-9999px',
            left: '-9999px',
            width: '1px',
            height: '1px',
            opacity: 0,
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
};
