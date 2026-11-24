'use client';

import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { RoomSettings } from '../../types';
import { Lock, Swords, Trophy } from 'lucide-react';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: (settings: RoomSettings) => void;
  defaultHostName: string;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  isOpen,
  onClose,
  onCreateRoom,
  defaultHostName,
}) => {
  const [name, setName] = useState(`${defaultHostName}'s Arena`);
  const [roundsToWin, setRoundsToWin] = useState(3);
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateRoom({
      name: name.trim() || `${defaultHostName}'s Arena`,
      maxPlayers: 2,
      isPrivate,
      password: isPrivate ? password : undefined,
      roundsToWin,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create 1v1 Battle Arena">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Arena Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter arena name..."
          required
        />

        {/* Rounds to Win */}
        <div>
          <label className="text-xs font-medium text-slate-300 block mb-2 flex items-center gap-1.5">
            <Trophy size={14} className="text-amber-400" /> Match Format (Wins needed)
          </label>
          <div className="grid grid-cols-2 gap-3">
            {[3, 5].map((rounds) => (
              <button
                key={rounds}
                type="button"
                onClick={() => setRoundsToWin(rounds)}
                className={`py-2.5 px-4 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                  roundsToWin === rounds
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                    : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                Best of {rounds === 3 ? '5 (First to 3)' : '9 (First to 5)'}
              </button>
            ))}
          </div>
        </div>

        {/* Private room toggle */}
        <div className="pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Lock size={14} className="text-slate-400" /> Private Room (Password)
            </span>
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="accent-cyan-400 w-4 h-4 rounded cursor-pointer"
            />
          </div>

          {isPrivate && (
            <div className="mt-3">
              <Input
                type="password"
                placeholder="Enter room password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={isPrivate}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-3">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            <Swords size={16} /> Create Arena
          </Button>
        </div>
      </form>
    </Modal>
  );
};
