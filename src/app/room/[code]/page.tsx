'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useProfile } from '../../../hooks/useProfile';
import { useWebRTCVoice } from '../../../hooks/useWebRTCVoice';
import { getSocket } from '../../../lib/socket';
import { Room, ClientRpsGameState, ChatMessage, RpsChoice } from '../../../types';
import { RoomLobbyView } from '../../../components/game/RoomLobbyView';
import { RpsArena } from '../../../components/game/RpsArena';
import { GameOverModal } from '../../../components/game/GameOverModal';
import { VoiceBar } from '../../../components/voice/VoiceBar';
import { PlayerVoiceCard } from '../../../components/voice/PlayerVoiceCard';
import { ChatBox } from '../../../components/chat/ChatBox';
import { Swords, ArrowLeft, MessageSquare, Volume2 } from 'lucide-react';
import { Button } from '../../../components/common/Button';

function RoomContent() {
  const params = useParams();
  const rawCode = params?.code;
  const roomCode = (Array.isArray(rawCode) ? rawCode[0] : rawCode || '').toUpperCase();
  const router = useRouter();

  const { profile, isLoaded, recordMatchOutcome } = useProfile();
  const [room, setRoom] = useState<Room | null>(null);
  const [gameState, setGameState] = useState<ClientRpsGameState | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<'game' | 'chat'>('game');
  const hasJoinedRef = React.useRef(false);

  const socket = useMemo(() => getSocket(), []);

  // Compute remote user ids for WebRTC mesh
  const remoteUserIds = useMemo(() => {
    if (!room || !profile) return [];
    return Object.keys(room.players).filter((id) => id !== profile.id);
  }, [room, profile]);

  const isMutedByHost = Boolean(profile && room?.players[profile.id]?.isMutedByHost);

  // Initialize WebRTC Voice (100% Free with Google STUN)
  const voice = useWebRTCVoice({
    roomCode,
    myUserId: profile?.id || '',
    socket,
    remoteUserIds,
    isMutedByHost,
  });

  // Socket setup and room event listeners
  useEffect(() => {
    if (!profile) return;

    if (!socket.connected) {
      socket.connect();
    }

    // Join room once per mount/session
    if (!hasJoinedRef.current) {
      hasJoinedRef.current = true;
      socket.emit('room:join', { code: roomCode, user: profile });
    }

    const handleRoomUpdated = (updatedRoom: Room) => {
      setRoom(updatedRoom);
    };

    const handlePlayerKicked = (payload: { userId: string }) => {
      if (payload.userId === profile.id) {
        alert('You were removed from the room by the host.');
        router.push('/lobby');
      }
    };

    const handleGameState = (state: ClientRpsGameState) => {
      setGameState(state);
      if (state.phase === 'game_over' && state.matchWinnerId) {
        const won = state.matchWinnerId === profile.id;
        recordMatchOutcome(won);
      }
    };

    const handleChatMessage = (msg: ChatMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    };

    const handleChatHistory = (history: ChatMessage[]) => {
      setMessages(history);
    };

    const handleError = (payload: { message: string }) => {
      setErrorMsg(payload.message || 'An error occurred');
    };

    socket.on('room:updated', handleRoomUpdated);
    socket.on('room:player_kicked', handlePlayerKicked);
    socket.on('game:state', handleGameState);
    socket.on('chat:message', handleChatMessage);
    socket.on('chat:history', handleChatHistory);
    socket.on('error', handleError);

    return () => {
      socket.off('room:updated', handleRoomUpdated);
      socket.off('room:player_kicked', handlePlayerKicked);
      socket.off('game:state', handleGameState);
      socket.off('chat:message', handleChatMessage);
      socket.off('chat:history', handleChatHistory);
      socket.off('error', handleError);
    };
  }, [socket, profile, roomCode, router, recordMatchOutcome]);

  // Leave room handler
  const handleLeaveRoom = () => {
    if (profile && socket) {
      socket.emit('room:leave', { code: roomCode, userId: profile.id });
    }
    router.push('/lobby');
  };

  // Ready toggle handler
  const handleToggleReady = () => {
    if (!profile || !room) return;
    const currentReady = Boolean(room.players[profile.id]?.isReady);
    socket.emit('room:ready', {
      code: roomCode,
      userId: profile.id,
      ready: !currentReady,
    });
  };

  // Start game handler (host only)
  const handleStartGame = () => {
    if (!profile) return;
    socket.emit('game:start', { code: roomCode, hostId: profile.id });
  };

  // RPS Choice handler
  const handleMakeChoice = (choice: RpsChoice) => {
    if (!profile) return;
    socket.emit('game:choose', { code: roomCode, userId: profile.id, choice });
  };

  // Rematch handler
  const handleRematch = () => {
    if (!profile) return;
    socket.emit('game:rematch', { code: roomCode, userId: profile.id });
  };

  // Host kick player
  const handleKickPlayer = (targetUserId: string) => {
    if (!profile) return;
    socket.emit('room:kick', {
      code: roomCode,
      hostId: profile.id,
      targetUserId,
    });
  };

  // Host mute player
  const handleHostMute = (targetUserId: string, mute: boolean) => {
    if (!profile) return;
    socket.emit('room:mute_player', {
      code: roomCode,
      hostId: profile.id,
      targetUserId,
      mute,
    });
  };

  // Send chat message
  const handleSendMessage = (text: string) => {
    if (!profile) return;
    socket.emit('chat:send', { code: roomCode, user: profile, text });
  };

  // Send chat reaction emoji
  const handleSendReaction = (emoji: string) => {
    if (!profile) return;
    socket.emit('chat:reaction', { code: roomCode, user: profile, emoji });
  };

  if (!isLoaded || !profile) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-cyan-400">
        <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isHost = room?.hostId === profile.id;
  const isPlaying = room?.status === 'playing' && gameState !== null;

  return (
    <div
      onClick={voice.unlockAudio}
      onTouchEnd={voice.unlockAudio}
      className="min-h-screen bg-gradient-to-b from-slate-950 via-[#0d101e] to-slate-950 text-slate-100 flex flex-col justify-between p-3 sm:p-6 pb-24"
    >
      {/* Floating Audio Playback Unlock Banner for Mobile & WebKit */}
      {voice.isAudioBlocked && (
        <div className="max-w-md w-full mx-auto my-3 px-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              voice.unlockAudio();
            }}
            className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-xl shadow-cyan-500/30 animate-pulse flex items-center justify-center gap-2 cursor-pointer border-2 border-white/40"
          >
            <Volume2 size={18} /> 🔊 Tap Here to Enable Voice Sound on this Device
          </button>
        </div>
      )}
      {/* Top Navbar */}
      <header className="max-w-7xl w-full mx-auto flex items-center justify-between pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <button
            onClick={handleLeaveRoom}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Leave room"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-black">
              <Swords size={18} />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                {room?.name || 'Loading Arena...'}
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded-md">
                  {roomCode}
                </span>
              </h1>
            </div>
          </div>
        </div>

        {/* Mobile View Switcher (Game vs Chat) */}
        <div className="flex lg:hidden items-center bg-slate-900 rounded-xl p-1 border border-slate-800 text-xs">
          <button
            onClick={() => setMobileTab('game')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
              mobileTab === 'game' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
            }`}
          >
            Duel
          </button>
          <button
            onClick={() => setMobileTab('chat')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
              mobileTab === 'chat' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
            }`}
          >
            <MessageSquare size={13} /> Chat
          </button>
        </div>
      </header>

      {/* Error alert */}
      {errorMsg && (
        <div className="max-w-7xl w-full mx-auto mt-4 p-3 rounded-2xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs flex items-center justify-between">
          <span>{errorMsg}</span>
          <button
            onClick={() => setErrorMsg(null)}
            className="font-bold uppercase text-[10px] hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Arena & Voice Section */}
      <main className="max-w-7xl w-full mx-auto flex-1 my-4 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left / Center Area: Game Duel / Lobby */}
        <div
          className={`lg:col-span-8 flex flex-col gap-6 ${
            mobileTab === 'chat' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Voice Avatars Row (Showing speaking pulses and volume controls) */}
          {room && (
            <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-3xl p-4">
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Volume2 size={13} className="text-cyan-400" /> Active Voice Arena (Free WebRTC)
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">
                  {Object.keys(room.players).length} Connected
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.values(room.players).map((p) => {
                  const isSelf = p.id === profile.id;
                  const peer = voice.peers[p.id];
                  return (
                    <PlayerVoiceCard
                      key={p.id}
                      player={p}
                      peer={peer}
                      isSelf={isSelf}
                      isRoomHost={isHost}
                      onSetVolume={(vol) => voice.setPeerVolume(p.id, vol)}
                      onToggleLocalMute={() => voice.togglePeerLocalMute(p.id)}
                      onHostMuteToggle={handleHostMute}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Fallback if Room Not Found */}
          {!room && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 text-center max-w-md mx-auto my-12 shadow-2xl">
              <div className="text-4xl mb-3">🔍</div>
              <h3 className="text-lg font-bold text-white mb-2">Arena Not Found</h3>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                This battle room does not exist or expired when the server restarted. Return to the lobby to host a new arena or quick join.
              </p>
              <Button
                variant="primary"
                size="md"
                onClick={() => router.push('/lobby')}
                className="w-full"
              >
                Return to Lobby
              </Button>
            </div>
          )}

          {/* Core Arena Display */}
          {room && !isPlaying && (
            <RoomLobbyView
              room={room}
              myUserId={profile.id}
              isHost={isHost}
              onToggleReady={handleToggleReady}
              onStartGame={handleStartGame}
              onKickPlayer={handleKickPlayer}
            />
          )}

          {room && isPlaying && gameState && (
            <RpsArena
              gameState={gameState}
              myUserId={profile.id}
              players={room.players}
              onMakeChoice={handleMakeChoice}
            />
          )}
        </div>

        {/* Right Sidebar: Real-time Chat & Reactions */}
        <div
          className={`lg:col-span-4 h-[550px] lg:h-[650px] flex flex-col ${
            mobileTab === 'game' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <ChatBox
            messages={messages}
            myProfile={profile}
            onSendMessage={handleSendMessage}
            onSendReaction={handleSendReaction}
          />
        </div>
      </main>

      {/* Floating Bottom Voice Control Bar (PRD Section 11: Mobile Floating Bar) */}
      <footer className="fixed bottom-3 left-0 right-0 z-40 max-w-2xl mx-auto px-4">
        <VoiceBar
          isMuted={voice.isMuted}
          onToggleMute={() => {
            if (!voice.localStream) {
              voice.initAudio();
            }
            voice.setIsMuted(!voice.isMuted);
          }}
          isSpeaking={voice.isSpeaking}
          isPushToTalk={voice.isPushToTalk}
          onTogglePushToTalk={voice.setIsPushToTalk}
          isPttPressed={voice.isPttPressed}
          onPttDown={() => voice.setIsPttPressed(true)}
          onPttUp={() => voice.setIsPttPressed(false)}
          audioPermission={voice.audioPermission}
          onRequestPermission={() => voice.initAudio()}
          availableMics={voice.availableMics}
          selectedMicId={voice.selectedMicId}
          onSelectMic={voice.switchMicrophone}
          connectionQuality={voice.connectionQuality}
          isMutedByHost={isMutedByHost}
        />
      </footer>

      {/* Game Over Scoreboard & Rematch Modal */}
      {room && gameState && (
        <GameOverModal
          gameState={gameState}
          myUserId={profile.id}
          players={room.players}
          onRematch={handleRematch}
          onLeave={handleLeaveRoom}
        />
      )}
    </div>
  );
}

export default function RoomPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-cyan-400">
          <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <RoomContent />
    </Suspense>
  );
}
