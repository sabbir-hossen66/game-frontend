'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProfile } from '../hooks/useProfile';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import {
  Gamepad2,
  Mic,
  Zap,
  ShieldCheck,
  Swords,
  Trophy,
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const { profile, stats, isLoaded, avatars, updateProfile } = useProfile();
  const [nickname, setNickname] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🐱');
  const [hasCustomized, setHasCustomized] = useState(false);

  // Sync state once profile is loaded
  React.useEffect(() => {
    if (profile && !hasCustomized) {
      setNickname(profile.nickname);
      setSelectedAvatar(profile.avatar);
      setHasCustomized(true);
    }
  }, [profile, hasCustomized]);

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (nickname.trim()) {
      updateProfile(nickname.trim(), selectedAvatar);
    }
    router.push('/lobby');
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-cyan-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold tracking-wider">Loading PlayRoom Arena...</span>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-[#0d111e] to-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-8 relative overflow-hidden">
      {/* Glow gradient effects */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[300px] bg-fuchsia-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Navbar */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between py-2 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-cyan-500/30">
            <Swords size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight bg-gradient-to-r from-white via-slate-200 to-cyan-400 bg-clip-text text-transparent">
              PlayRoom
            </h1>
            <span className="text-[10px] text-cyan-400 font-semibold tracking-wider block -mt-1 uppercase">
              1v1 Battle & Voice Arena
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-300 font-medium">Free Voice P2P Online</span>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl w-full mx-auto my-auto py-8 sm:py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-center relative z-10">
        <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-semibold shadow-inner">
            <Zap size={14} className="text-cyan-400" /> Real-time 1v1 Battle • Rock Paper Scissors
          </div>

          <h2 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
            Duel Friends 1v1 with{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-fuchsia-400 bg-clip-text text-transparent">
              Free Voice Chat
            </span>
          </h2>

          <p className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed">
            কোনো অ্যাপ ইন্সটল বা কোনো ধরনের টাকা খরচ ছাড়াই ব্রাউজারে রিয়েল-টাইম রক পেপার সিজার খেলুন এবং কথা বলুন এক সাথে।
          </p>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="bg-slate-900/70 border border-slate-800/80 p-3.5 rounded-2xl flex items-center gap-3 text-left">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
                <Mic size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">100% Free Voice</h4>
                <p className="text-[11px] text-slate-400">No payment or card needed</p>
              </div>
            </div>

            <div className="bg-slate-900/70 border border-slate-800/80 p-3.5 rounded-2xl flex items-center gap-3 text-left">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">Server Anti-Cheat</h4>
                <p className="text-[11px] text-slate-400">Authoritative game sync</p>
              </div>
            </div>

            <div className="bg-slate-900/70 border border-slate-800/80 p-3.5 rounded-2xl flex items-center gap-3 text-left">
              <div className="p-2.5 rounded-xl bg-fuchsia-500/10 text-fuchsia-400">
                <Zap size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">Instant Guest Play</h4>
                <p className="text-[11px] text-slate-400">Enter name and play!</p>
              </div>
            </div>
          </div>
        </div>

        {/* Guest Profile & Quick Start Card */}
        <div className="lg:col-span-5 w-full max-w-md mx-auto">
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-cyan-500/10 relative">
            <div className="absolute -top-3.5 right-6 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black text-[11px] uppercase tracking-wider px-3 py-1 rounded-full shadow-md">
              Instant Entry
            </div>

            <h3 className="text-xl font-bold text-slate-100 mb-1 flex items-center gap-2">
              <Gamepad2 className="text-cyan-400" size={20} /> Join The Arena
            </h3>
            <p className="text-xs text-slate-400 mb-6">Choose your game persona and jump in</p>

            <form onSubmit={handleStart} className="space-y-5">
              <Input
                label="Player Nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="e.g. MasterGamer"
                maxLength={15}
                required
              />

              {/* Avatar Selector */}
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-2">
                  Choose Avatar
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {avatars.map((av) => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => setSelectedAvatar(av)}
                      className={`p-2 rounded-xl text-xl border transition-all cursor-pointer flex items-center justify-center ${
                        selectedAvatar === av
                          ? 'bg-cyan-500/20 border-cyan-400 ring-2 ring-cyan-400/40 scale-105 shadow-md shadow-cyan-500/20'
                          : 'bg-slate-800/50 border-slate-700/60 hover:border-slate-600'
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stats pill */}
              <div className="flex items-center justify-between bg-slate-950/60 border border-slate-800/80 px-4 py-2.5 rounded-xl text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Trophy size={14} className="text-amber-400" /> Career Stats
                </span>
                <span className="text-slate-200 font-semibold">
                  {stats.totalWins} Wins / {stats.gamesPlayed} Matches
                </span>
              </div>

              <Button variant="primary" size="lg" className="w-full text-base" type="submit">
                <Swords size={18} /> Play Now (Game Lobby)
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto text-center py-4 text-xs text-slate-500 border-t border-slate-900 relative z-10 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>PlayRoom Multiplayer Game & Voice Platform • 100% Free Peer-to-Peer Voice</p>
        <p className="text-slate-600">Built with NestJS & Next.js</p>
      </footer>
    </main>
  );
}
