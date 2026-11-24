'use client';

import React from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Mic, CheckCircle2, Sliders, Volume2 } from 'lucide-react';

interface VoiceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableMics: MediaDeviceInfo[];
  selectedMicId: string;
  onSelectMic: (deviceId: string) => void;
  isPushToTalk: boolean;
  onTogglePushToTalk: (ptt: boolean) => void;
}

export const VoiceSettingsModal: React.FC<VoiceSettingsModalProps> = ({
  isOpen,
  onClose,
  availableMics,
  selectedMicId,
  onSelectMic,
  isPushToTalk,
  onTogglePushToTalk,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Audio & Voice Settings">
      <div className="space-y-5 text-sm">
        {/* Device Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Mic size={14} className="text-cyan-400" /> Input Microphone
          </label>
          {availableMics.length > 0 ? (
            <select
              value={selectedMicId}
              onChange={(e) => onSelectMic(e.target.value)}
              className="w-full bg-slate-800 text-slate-200 border border-slate-700 rounded-xl px-3.5 py-2.5 outline-none focus:border-cyan-400 text-sm cursor-pointer"
            >
              {availableMics.map((mic, idx) => (
                <option key={mic.deviceId || idx} value={mic.deviceId}>
                  {mic.label || `Microphone ${idx + 1}`}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-xs text-slate-400 italic">No input microphones detected yet.</p>
          )}
        </div>

        {/* Input Mode: Open Mic vs Push To Talk */}
        <div className="pt-2 border-t border-slate-800">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Sliders size={14} className="text-cyan-400" /> Voice Activation Mode
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onTogglePushToTalk(false)}
              className={`p-3.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                !isPushToTalk
                  ? 'border-cyan-400/80 bg-cyan-950/20 text-cyan-200'
                  : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700'
              }`}
            >
              <span className="font-semibold text-sm">Open Mic</span>
              <span className="text-xs text-slate-400">Voice activity detection</span>
            </button>

            <button
              onClick={() => onTogglePushToTalk(true)}
              className={`p-3.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                isPushToTalk
                  ? 'border-cyan-400/80 bg-cyan-950/20 text-cyan-200'
                  : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700'
              }`}
            >
              <span className="font-semibold text-sm">Push-to-Talk</span>
              <span className="text-xs text-slate-400">Hold Space or PTT button</span>
            </button>
          </div>
        </div>

        {/* Audio Processing Features */}
        <div className="pt-2 border-t border-slate-800">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Volume2 size={14} className="text-cyan-400" /> Audio Processing
          </label>
          <div className="space-y-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>Noise Suppression</span>
              <CheckCircle2 size={15} className="text-emerald-400" />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>Echo Cancellation</span>
              <CheckCircle2 size={15} className="text-emerald-400" />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>Auto Gain Control</span>
              <CheckCircle2 size={15} className="text-emerald-400" />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>Google STUN Free WebRTC</span>
              <span className="text-cyan-400 font-medium">100% Free Forever</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="primary" size="md" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
};
