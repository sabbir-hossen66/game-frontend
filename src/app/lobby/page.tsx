'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useProfile } from '../../hooks/useProfile';
import { getSocket } from '../../lib/socket';
import { RoomSummary, RoomSettings, Room } from '../../types';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { CreateRoomModal } from '../../components/lobby/CreateRoomModal';
import { JoinRoomModal } from '../../components/lobby/JoinRoomModal';
import { ProfileModal } from '../../components/lobby/ProfileModal';
import { AuthModal } from '../../components/auth/AuthModal';
import {
  Swords,
  PlusCircle,
  KeyRound,
  Zap,
  Users,
  Trophy,
  Edit3,
  Shield,
  Gamepad2,
  Sparkles,
  ArrowRight,
  LogIn,
  LogOut,
  Medal,
} from 'lucide-react';

interface LeaderboardUser {
  id: string;
  nickname: string;
  avatar: string;
  totalWins: number;
  gamesPlayed: number;
  isGuest: boolean;
}

function LobbyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const joinCodeParam = searchParams.get('join');

  const {
    profile,
    stats,
    isAuthenticated,
    isLoaded,
    avatars,
    updateProfile,
    setAuthUser,
    logout,
  } = useProfile();
  const [publicRooms, setPublicRooms] = useState<RoomSummary[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(Boolean(joinCodeParam));
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch live Leaderboard from Neon PostgreSQL
  const fetchLeaderboard = useCallback(async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
      const res = await fetch(`${backendUrl}/api/auth/leaderboard`);
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data);
      }
    } catch {
      // Ignore fallback
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Initialize socket and listen for rooms
  useEffect(() => {
    const socket = getSocket();
    if (!socket.connected) {
      socket.connect();
    }

    const handleRoomList = (rooms: RoomSummary[]) => {
      setPublicRooms(rooms);
    };

    const handleRoomCreated = (room: Room) => {
      setIsConnecting(false);
      router.push(`/room/${room.code}`);
    };

    const handleRoomJoined = (room: Room) => {
      setIsConnecting(false);
      router.push(`/room/${room.code}`);
    };

    const handleError = (payload: { message: string }) => {
      setIsConnecting(false);
      setErrorMsg(payload.message || 'Action failed');
    };

    socket.on('room:list', handleRoomList);
    socket.on('room:created', handleRoomCreated);
    socket.on('room:joined', handleRoomJoined);
    socket.on('error', handleError);

    // Request initial public rooms list
    socket.emit('room:list_public');
    const interval = setInterval(() => {
      if (socket.connected) {
        socket.emit('room:list_public');
      }
    }, 4000);

    return () => {
      clearInterval(interval);
      socket.off('room:list', handleRoomList);
      socket.off('room:created', handleRoomCreated);
      socket.off('room:joined', handleRoomJoined);
      socket.off('error', handleError);
    };
  }, [router]);

  // Handle Quick Join
  const handleQuickJoin = useCallback(() => {
    if (!profile) return;
    setIsConnecting(true);
    setErrorMsg(null);
    const socket = getSocket();
    socket.emit('room:quick_join', { user: profile });
  }, [profile]);

  // Handle Create Room
  const handleCreateRoom = (settings: RoomSettings) => {
    if (!profile) return;
    setIsConnecting(true);
    setErrorMsg(null);
    const socket = getSocket();
    socket.emit('room:create', { user: profile, settings });
  };

  // Handle Join Room via Code
  const handleJoinRoom = (code: string, password?: string) => {
    if (!profile) return;
    setIsConnecting(true);
    setErrorMsg(null);
    const socket = getSocket();
    socket.emit('room:join', { code, user: profile, password });
  };

  if (!isLoaded || !profile) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-cyan-400">
        <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-[#0d101c] to-slate-950 text-slate-100 flex flex-col p-4 sm:p-8">
      {/* Top Header & Profile Bar */}
      <header className="max-w-6xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div
          className="flex items-center gap-2.5 cursor-pointer"
          onClick={() => router.push('/')}
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-cyan-500/30">
            <Swords size={20} className="stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white">PlayRoom</h1>
            <span className="text-[10px] text-cyan-400 font-semibold tracking-wider block -mt-1 uppercase">
              Game Lobby
            </span>
          </div>
        </div>

        {/* Profile & Account Actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl px-4 py-2 shadow-lg">
            <div className="text-2xl select-none">{profile.avatar}</div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-slate-100">{profile.nickname}</span>
                <button
                  onClick={() => setIsProfileOpen(true)}
                  className="text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
                  title="Edit profile"
                >
                  <Edit3 size={13} />
                </button>
              </div>
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Trophy size={11} className="text-amber-400" /> {stats.totalWins} Wins •{' '}
                {stats.gamesPlayed} Matches
              </span>
            </div>
          </div>

          {isAuthenticated ? (
            <button
              onClick={logout}
              title="Sign Out"
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-all cursor-pointer"
            >
              <LogOut size={16} />
            </button>
          ) : (
            <Button
              variant="neon"
              size="sm"
              onClick={() => setIsAuthOpen(true)}
              className="text-xs"
            >
              <LogIn size={13} /> Sign In
            </Button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl w-full mx-auto flex-1 py-8 space-y-8">
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-sm flex items-center justify-between">
            <span>{errorMsg}</span>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-xs uppercase font-bold text-rose-400 hover:text-rose-200"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Quick Actions Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={handleQuickJoin}
            disabled={isConnecting}
            className="p-5 rounded-3xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black shadow-xl shadow-cyan-500/20 border border-cyan-400/40 flex items-center justify-between text-left transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <div>
              <span className="text-xs uppercase tracking-wider text-slate-900 font-bold block">
                Instant Match
              </span>
              <h3 className="text-xl font-extrabold text-slate-950">Quick Join</h3>
              <p className="text-xs text-slate-900/80 mt-0.5">Jump directly into a 1v1 battle</p>
            </div>
            <Zap size={28} className="fill-slate-950 text-slate-950" />
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="p-5 rounded-3xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-700/80 text-left transition-all active:scale-95 cursor-pointer shadow-lg flex items-center justify-between"
          >
            <div>
              <span className="text-xs uppercase tracking-wider text-cyan-400 font-bold block">
                Custom Match
              </span>
              <h3 className="text-xl font-extrabold text-white">Create Arena</h3>
              <p className="text-xs text-slate-400 mt-0.5">Host a room with custom rounds</p>
            </div>
            <PlusCircle size={28} className="text-cyan-400" />
          </button>

          <button
            onClick={() => setIsJoinOpen(true)}
            className="p-5 rounded-3xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-700/80 text-left transition-all active:scale-95 cursor-pointer shadow-lg flex items-center justify-between"
          >
            <div>
              <span className="text-xs uppercase tracking-wider text-fuchsia-400 font-bold block">
                Direct Invite
              </span>
              <h3 className="text-xl font-extrabold text-white">Join by Code</h3>
              <p className="text-xs text-slate-400 mt-0.5">Enter 6-digit code from friend</p>
            </div>
            <KeyRound size={28} className="text-fuchsia-400" />
          </button>
        </div>

        {/* Available Game Modes / Plugins (FR-4 & FR-24) */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Gamepad2 className="text-cyan-400" size={20} /> Game Modes
            </h3>
            <span className="text-xs text-slate-400">Modular Plugin Engine</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Active Game: Rock Paper Scissors */}
            <div className="relative rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-cyan-500/50 p-6 shadow-xl shadow-cyan-500/10 flex flex-col justify-between overflow-hidden">
              <div className="absolute top-4 right-4">
                <Badge variant="cyan">Available Now</Badge>
              </div>

              <div>
                <div className="text-4xl mb-3">🪨 📄 ✂️</div>
                <h4 className="text-xl font-black text-white">Rock Paper Scissors</h4>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Fast-paced 1v1 duel with real-time countdown, hidden server-authoritative choices, and live free voice chat!
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-slate-300">
                  <span className="px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700">
                    2 Players
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700">
                    Voice Chat
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700">
                    Best of 3 / 5
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800">
                <Button
                  variant="primary"
                  size="md"
                  className="w-full text-xs"
                  onClick={handleQuickJoin}
                >
                  <Sparkles size={14} /> Quick Play RPS <ArrowRight size={14} />
                </Button>
              </div>
            </div>

            {/* Modular Upcoming: Connect Four (PRD section 5.6) */}
            <div className="relative rounded-3xl bg-slate-900/40 border border-slate-800 p-6 flex flex-col justify-between opacity-70">
              <div className="absolute top-4 right-4">
                <Badge variant="slate">Phase 3</Badge>
              </div>

              <div>
                <div className="text-4xl mb-3">🔴 🟡</div>
                <h4 className="text-xl font-bold text-slate-200">Connect Four</h4>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Turn-based 7x6 grid tactical board battle with full voice chat support.
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-slate-400">
                  <span className="px-2 py-0.5 rounded-lg bg-slate-800/60 border border-slate-700">
                    2 Players
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-slate-800/60 border border-slate-700">
                    Turn-based
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/60">
                <span className="text-xs text-slate-500 font-semibold block text-center">
                  Coming Soon
                </span>
              </div>
            </div>

            {/* Modular Upcoming: Draw & Guess (PRD section 5.6) */}
            <div className="relative rounded-3xl bg-slate-900/40 border border-slate-800 p-6 flex flex-col justify-between opacity-70">
              <div className="absolute top-4 right-4">
                <Badge variant="slate">Phase 3</Badge>
              </div>

              <div>
                <div className="text-4xl mb-3">🎨 ✏️</div>
                <h4 className="text-xl font-bold text-slate-200">Draw & Guess</h4>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  One draws on the canvas while others guess in voice or real-time text chat.
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-slate-400">
                  <span className="px-2 py-0.5 rounded-lg bg-slate-800/60 border border-slate-700">
                    3-8 Players
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-slate-800/60 border border-slate-700">
                    Party Game
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/60">
                <span className="text-xs text-slate-500 font-semibold block text-center">
                  Coming Soon
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Public Rooms Section (FR-5) */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Users className="text-cyan-400" size={20} /> Live Public Rooms
            </h3>
            <span className="text-xs text-slate-400">
              {publicRooms.length} room{publicRooms.length === 1 ? '' : 's'} online
            </span>
          </div>

          {publicRooms.length === 0 ? (
            <div className="p-8 rounded-3xl bg-slate-900/40 border border-slate-800/80 text-center">
              <div className="text-3xl mb-2">🏟️</div>
              <h4 className="text-base font-bold text-slate-200">No public arenas right now</h4>
              <p className="text-xs text-slate-400 mt-1 mb-4">
                Be the first to create an arena and invite challengers!
              </p>
              <Button variant="neon" size="sm" onClick={() => setIsCreateOpen(true)}>
                <PlusCircle size={15} /> Create An Arena
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {publicRooms.map((room) => {
                const isFull = room.playerCount >= room.maxPlayers;
                const isPlaying = room.status === 'playing';

                return (
                  <div
                    key={room.code}
                    className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800/90 shadow-md flex flex-col justify-between hover:border-slate-700 transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-mono font-bold text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded-lg border border-cyan-800/40">
                          {room.code}
                        </span>
                        <Badge variant={isPlaying ? 'yellow' : isFull ? 'slate' : 'green'}>
                          {isPlaying ? 'In Duel' : isFull ? 'Full' : 'Open'}
                        </Badge>
                      </div>

                      <h4 className="font-bold text-base text-white truncate">{room.name}</h4>
                      <p className="text-xs text-slate-400 mt-1">Host: {room.hostName}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Users size={13} /> {room.playerCount} / {room.maxPlayers}
                      </span>

                      <Button
                        variant={isFull || isPlaying ? 'secondary' : 'primary'}
                        size="sm"
                        disabled={isFull || isPlaying}
                        onClick={() => handleJoinRoom(room.code)}
                        className="text-xs"
                      >
                        {isPlaying ? 'Busy' : isFull ? 'Full' : 'Join'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {/* Global Leaderboard (Powered by PostgreSQL NeonDB) */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Medal className="text-amber-400" size={20} /> Arena Leaderboard
            </h3>
            <span className="text-xs text-slate-400">Top Duel Champions</span>
          </div>

          {leaderboard.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-3 text-center">
              Play your first match to claim the top spot on the leaderboard!
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {leaderboard.slice(0, 6).map((user, idx) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        idx === 0
                          ? 'bg-amber-400 text-slate-950'
                          : idx === 1
                          ? 'bg-slate-300 text-slate-950'
                          : idx === 2
                          ? 'bg-amber-700 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="text-xl">{user.avatar}</span>
                    <span className="text-xs font-bold text-slate-200 truncate max-w-[100px]">
                      {user.nickname}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-amber-400">
                      {user.totalWins} Wins
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      {user.gamesPlayed} Matches
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <CreateRoomModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreateRoom={handleCreateRoom}
        defaultHostName={profile.nickname}
      />

      <JoinRoomModal
        isOpen={isJoinOpen}
        onClose={() => setIsJoinOpen(false)}
        onJoinRoom={handleJoinRoom}
        initialCode={joinCodeParam || ''}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        profile={profile}
        stats={stats}
        avatars={avatars}
        onSaveProfile={updateProfile}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={setAuthUser}
        avatars={avatars}
      />
    </div>
  );
}

export default function LobbyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-cyan-400">
          <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LobbyContent />
    </Suspense>
  );
}
