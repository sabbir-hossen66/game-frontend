'use client';

import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { KeyRound, LogIn } from 'lucide-react';

interface JoinRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinRoom: (code: string, password?: string) => void;
  initialCode?: string;
}

export const JoinRoomModal: React.FC<JoinRoomModalProps> = ({
  isOpen,
  onClose,
  onJoinRoom,
  initialCode = '',
}) => {
  const [code, setCode] = useState(initialCode);
  const [password, setPassword] = useState('');

  // Extract clean 6-digit code even if user pastes a full link like http://.../KUSLBR
  const handleCodeChange = (raw: string) => {
    let clean = raw.trim();
    if (clean.includes('/room/')) {
      clean = clean.split('/room/').pop()?.split(/[?#/]/)[0] || clean;
    } else if (clean.includes('join=')) {
      clean = clean.split('join=').pop()?.split(/[&#/]/)[0] || clean;
    }
    clean = clean.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase();
    setCode(clean);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let finalCode = code.trim();
    if (finalCode.includes('/room/')) {
      finalCode = finalCode.split('/room/').pop()?.split(/[?#/]/)[0] || finalCode;
    } else if (finalCode.includes('join=')) {
      finalCode = finalCode.split('join=').pop()?.split(/[&#/]/)[0] || finalCode;
    }
    finalCode = finalCode.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase();
    if (!finalCode) return;

    onJoinRoom(finalCode, password.trim() || undefined);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Join Battle Arena">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            label="6-Digit Room Code (or Paste Link)"
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            placeholder="e.g. KUSLBR"
            icon={<KeyRound size={16} />}
            required
          />
          <span className="text-[11px] text-slate-400 mt-1 block">
            Enter the 6-character code (e.g. <b className="text-cyan-400 font-mono">KUSLBR</b>)
          </span>
        </div>

        <div>
          <Input
            label="Password (Optional)"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Leave empty if not a private room..."
          />
          <span className="text-[11px] text-slate-500 mt-1 block">
            পাসওয়ার্ড দেওয়ার প্রয়োজন নেই (যদি না হোস্ট প্রাইভেট পাসওয়ার্ড দিয়ে থাকে)।
          </span>
        </div>

        <div className="flex justify-end gap-3 pt-3">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            <LogIn size={16} /> Enter Battle
          </Button>
        </div>
      </form>
    </Modal>
  );
};
