'use client';

import React, { useState } from 'react';
import { Mic, MicOff, Settings, Radio, Wifi, WifiOff } from 'lucide-react';
import { Button } from '../common/Button';
import { VoiceSettingsModal } from './VoiceSettingsModal';

interface VoiceBarProps {
  isMuted: boolean;
  onToggleMute: () => void;
  isSpeaking: boolean;
  isPushToTalk: boolean;
  onTogglePushToTalk: (ptt: boolean) => void;
  isPttPressed: boolean;
  onPttDown: () => void;
  onPttUp: () => void;
  audioPermission: 'granted' | 'denied' | 'prompt';
  onRequestPermission: () => void;
  availableMics: MediaDeviceInfo[];
  selectedMicId: string;
  onSelectMic: (deviceId: string) => void;
  connectionQuality: 'good' | 'medium' | 'poor';
  isMutedByHost?: boolean;
}

export const VoiceBar: React.FC<VoiceBarProps> = ({
  isMuted,
  onToggleMute,
  isSpeaking,
  isPushToTalk,
  onTogglePushToTalk,
  isPttPressed,
  onPttDown,
  onPttUp,
  audioPermission,
  onRequestPermission,
  availableMics,
  selectedMicId,
  onSelectMic,
  connectionQuality,
  isMutedByHost = false,
}) => {
  const [showSettings, setShowSettings] = useState(false);

  const getQualityColor = () => {
    if (connectionQuality === 'good') return 'text-emerald-400';
    if (connectionQuality === 'medium') return 'text-amber-400';
    return 'text-rose-400';
  };

  return (
    <>
      <div className="w-full bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-2.5 sm:px-4 sm:py-3 shadow-2xl flex items-center justify-between gap-3">
        {/* Mic & Speaking Status */}
        <div className="flex items-center gap-3">
          {audioPermission === 'denied' ? (
            <div className="flex items-center gap-2 text-rose-400 text-xs font-medium">
              <MicOff size={16} />
              <span>Mic Blocked (Listen-Only)</span>
            </div>
          ) : audioPermission === 'prompt' ? (
            <Button
              variant="neon"
              size="sm"
              onClick={onRequestPermission}
              className="text-xs"
            >
              <Mic size={14} /> Join Voice
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={onToggleMute}
                disabled={isMutedByHost}
                title={
                  isMutedByHost
                    ? 'Muted by room host'
                    : `Click to ${isMuted ? 'Unmute' : 'Mute'} (Press M)`
                }
                className={`relative p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2 text-sm font-medium ${
                  isMutedByHost
                    ? 'bg-rose-950/40 border-rose-600/50 text-rose-300 opacity-60 cursor-not-allowed'
                    : isMuted
                    ? 'bg-rose-950/40 border-rose-500/50 text-rose-300 hover:bg-rose-900/40'
                    : 'bg-cyan-950/40 border-cyan-400/50 text-cyan-300 hover:bg-cyan-900/40'
                } ${
                  isSpeaking && !isMuted
                    ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-950 shadow-lg shadow-emerald-400/20'
                    : ''
                }`}
              >
                {isMuted || isMutedByHost ? <MicOff size={16} /> : <Mic size={16} />}
                <span className="hidden sm:inline">
                  {isMutedByHost ? 'Host Muted' : isMuted ? 'Muted' : 'Unmuted'}
                </span>
                <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.5 text-[10px] bg-slate-800 text-slate-400 rounded border border-slate-700">
                  M
                </kbd>
              </button>

              {/* Push-to-Talk touch trigger */}
              {isPushToTalk && (
                <button
                  onMouseDown={onPttDown}
                  onMouseUp={onPttUp}
                  onTouchStart={onPttDown}
                  onTouchEnd={onPttUp}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider border select-none transition-all cursor-pointer ${
                    isPttPressed
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/30'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <Radio size={14} className="inline mr-1" />
                  {isPttPressed ? 'Transmitting' : 'Hold Space'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Voice Activity Waves & Connection Indicator */}
        <div className="flex items-center gap-3">
          {/* Real-time speaking waves */}
          <div className="flex items-center gap-1 h-5 px-2">
            {[0.4, 0.9, 0.6, 1.0, 0.5].map((scale, i) => (
              <span
                key={i}
                className={`w-1 rounded-full transition-all duration-150 ${
                  isSpeaking && !isMuted && !isMutedByHost
                    ? 'bg-cyan-400 animate-pulse'
                    : 'bg-slate-700'
                }`}
                style={{
                  height:
                    isSpeaking && !isMuted && !isMutedByHost
                      ? `${Math.max(6, 18 * scale)}px`
                      : '4px',
                }}
              />
            ))}
          </div>

          {/* Connection quality */}
          <div
            className={`flex items-center gap-1 text-xs ${getQualityColor()}`}
            title={`Voice Network: ${connectionQuality}`}
          >
            {connectionQuality === 'poor' ? <WifiOff size={14} /> : <Wifi size={14} />}
            <span className="hidden md:inline capitalize">{connectionQuality}</span>
          </div>

          {/* Settings Trigger */}
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 transition-colors cursor-pointer"
            title="Audio Settings"
          >
            <Settings size={17} />
          </button>
        </div>
      </div>

      <VoiceSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        availableMics={availableMics}
        selectedMicId={selectedMicId}
        onSelectMic={onSelectMic}
        isPushToTalk={isPushToTalk}
        onTogglePushToTalk={onTogglePushToTalk}
      />
    </>
  );
};
