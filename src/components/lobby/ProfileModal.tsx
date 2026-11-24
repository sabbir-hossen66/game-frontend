'use client';

import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { UserProfile, UserStats } from '../../types';
import { Trophy, Gamepad2, Check } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  stats: UserStats;
  avatars: string[];
  onSaveProfile: (nickname: string, avatar: string) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  stats,
  avatars,
  onSaveProfile,
}) => {
  const [nickname, setNickname] = useState(profile.nickname);
  const [selectedAvatar, setSelectedAvatar] = useState(profile.avatar);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(nickname.trim() || profile.nickname, selectedAvatar);
    onClose();
  };

  const winRate =
    stats.gamesPlayed > 0
      ? Math.round((stats.totalWins / stats.gamesPlayed) * 100)
      : 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Player Profile">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Stats card */}
        <div className="grid grid-cols-3 gap-2 bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 text-center">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-center gap-1">
              <Trophy size={11} className="text-amber-400" /> Wins
            </span>
            <span className="text-lg font-bold text-slate-100">{stats.totalWins}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-center gap-1">
              <Gamepad2 size={11} className="text-cyan-400" /> Played
            </span>
            <span className="text-lg font-bold text-slate-100">{stats.gamesPlayed}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">
              Win Rate
            </span>
            <span className="text-lg font-bold text-emerald-400">{winRate}%</span>
          </div>
        </div>

        {/* Nickname input */}
        <Input
          label="Your Nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          maxLength={15}
          required
        />

        {/* Avatar selection grid */}
        <div>
          <label className="text-xs font-medium text-slate-300 block mb-2">
            Select Your Avatar
          </label>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {avatars.map((avatar) => {
              const isSelected = selectedAvatar === avatar;
              return (
                <button
                  key={avatar}
                  type="button"
                  onClick={() => setSelectedAvatar(avatar)}
                  className={`p-2.5 rounded-2xl border text-2xl transition-all cursor-pointer relative flex items-center justify-center ${
                    isSelected
                      ? 'bg-cyan-500/20 border-cyan-400 ring-2 ring-cyan-400/30 scale-105'
                      : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600'
                  }`}
                >
                  {avatar}
                  {isSelected && (
                    <span className="absolute -top-1 -right-1 bg-cyan-400 text-slate-950 p-0.5 rounded-full">
                      <Check size={10} className="stroke-[3]" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            Save Profile
          </Button>
        </div>
      </form>
    </Modal>
  );
};
