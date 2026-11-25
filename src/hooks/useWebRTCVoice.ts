'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { WebRtcSignalPayload, VoicePeer } from '../types';

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun.relay.metered.ca:80' },
    {
      urls: [
        'turn:openrelay.metered.ca:80',
        'turn:openrelay.metered.ca:443',
        'turn:openrelay.metered.ca:443?transport=tcp',
      ],
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
  ],
  iceCandidatePoolSize: 10,
};

interface UseWebRTCVoiceProps {
  roomCode: string;
  myUserId: string;
  socket: Socket | null;
  remoteUserIds: string[];
  isMutedByHost?: boolean;
}

export function useWebRTCVoice({
  roomCode,
  myUserId,
  socket,
  remoteUserIds,
  isMutedByHost = false,
}: UseWebRTCVoiceProps) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isPushToTalk, setIsPushToTalk] = useState(false);
  const [isPttPressed, setIsPttPressed] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioPermission, setAudioPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [availableMics, setAvailableMics] = useState<MediaDeviceInfo[]>([]);
  const [selectedMicId, setSelectedMicId] = useState<string>('');
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'medium' | 'poor'>('good');

  // Map of remoteUserId -> VoicePeer info
  const [peers, setPeers] = useState<Record<string, VoicePeer>>({});

  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const iceCandidateQueuesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const speakingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Microphone
  const initAudio = useCallback(async (deviceId?: string) => {
    try {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        audio: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      setLocalStream(stream);
      setAudioPermission('granted');

      // Setup audio analyzer for Voice Activity Detection (Speaking Indicator)
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Update available devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter((d) => d.kind === 'audioinput');
      setAvailableMics(audioInputs);
      if (stream.getAudioTracks()[0]) {
        setSelectedMicId(stream.getAudioTracks()[0].getSettings().deviceId || '');
      }

      // Replace or add track to all active peer connections
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        peerConnectionsRef.current.forEach(async (pc, targetId) => {
          const transceivers = pc.getTransceivers();
          const audioTransceiver = transceivers.find((t) => t.receiver.track.kind === 'audio');
          if (audioTransceiver && audioTransceiver.sender) {
            await audioTransceiver.sender.replaceTrack(audioTrack);
            audioTransceiver.direction = 'sendrecv';
          } else {
            const senders = pc.getSenders();
            const sender = senders.find((s) => s.track === null || s.track?.kind === 'audio');
            if (sender) {
              await sender.replaceTrack(audioTrack);
            } else {
              pc.addTrack(audioTrack, stream);
            }
          }

          // Seamless renegotiation: ensure other peer receives active audio immediately
          if (pc.signalingState === 'stable' && socket) {
            try {
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              socket.emit('voice:signal', {
                code: roomCode,
                targetUserId: targetId,
                senderUserId: myUserId,
                signal: offer,
              });
            } catch (err) {
              console.warn('[WebRTC] Track renegotiation note:', err);
            }
          }
        });
      }
    } catch {
      setAudioPermission('denied');
    }
  }, [roomCode, myUserId, socket]);

  // Auto-request microphone permission on mount
  useEffect(() => {
    initAudio();
  }, [initAudio]);

  // Global user interaction listener to unlock AudioContext & autoplay on iOS/Android & desktop
  useEffect(() => {
    const unlockAudio = () => {
      audioElementsRef.current.forEach((audioEl) => {
        if (audioEl.paused) {
          audioEl.play().catch(() => {});
        }
      });
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().catch(() => {});
      }
    };

    window.addEventListener('click', unlockAudio);
    window.addEventListener('touchend', unlockAudio);
    window.addEventListener('touchstart', unlockAudio, { passive: true });
    window.addEventListener('pointerup', unlockAudio);
    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchend', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
      window.removeEventListener('pointerup', unlockAudio);
    };
  }, []);

  // Speaking detection loop
  useEffect(() => {
    if (!analyserRef.current) return;
    let animId: number;
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

    const checkAudioLevel = () => {
      if (analyserRef.current) {
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;

        const effectiveMuted = isMuted || isMutedByHost || (isPushToTalk && !isPttPressed);
        const speakingNow = !effectiveMuted && average > 12;

        if (speakingNow !== isSpeaking) {
          setIsSpeaking(speakingNow);
          if (socket) {
            socket.emit('voice:state', {
              code: roomCode,
              userId: myUserId,
              isMuted: effectiveMuted,
              isSpeaking: speakingNow,
            });
          }
        }
      }
      animId = requestAnimationFrame(checkAudioLevel);
    };

    animId = requestAnimationFrame(checkAudioLevel);
    return () => cancelAnimationFrame(animId);
  }, [isMuted, isMutedByHost, isPushToTalk, isPttPressed, isSpeaking, socket, roomCode, myUserId]);

  // Synchronize mic tracks with mute / host mute / PTT
  useEffect(() => {
    if (!localStream) return;
    const effectiveMuted = isMuted || isMutedByHost || (isPushToTalk && !isPttPressed);
    localStream.getAudioTracks().forEach((track) => {
      track.enabled = !effectiveMuted;
    });

    if (socket) {
      socket.emit('voice:state', {
        code: roomCode,
        userId: myUserId,
        isMuted: effectiveMuted,
        isSpeaking: !effectiveMuted && isSpeaking,
      });
    }
  }, [isMuted, isMutedByHost, isPushToTalk, isPttPressed, localStream, socket, roomCode, myUserId, isSpeaking]);

  // Keyboard shortcut listener: 'M' for Mute/Unmute, 'Space' for Push-to-Talk
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in input or textarea
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        setIsMuted((prev) => !prev);
      } else if (e.code === 'Space' && isPushToTalk) {
        e.preventDefault();
        setIsPttPressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && isPushToTalk) {
        e.preventDefault();
        setIsPttPressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPushToTalk]);

  // Create Peer Connection with a target user
  const createPeerConnection = useCallback(
    (targetUserId: string): RTCPeerConnection => {
      const pc = new RTCPeerConnection(RTC_CONFIG);

      // Pre-add transceiver for bidirectional audio
      const transceiver = pc.addTransceiver('audio', { direction: 'sendrecv' });

      // Add local stream track if available
      if (localStreamRef.current) {
        const audioTrack = localStreamRef.current.getAudioTracks()[0];
        if (audioTrack && transceiver.sender) {
          transceiver.sender.replaceTrack(audioTrack);
        }
      }

      // Send ICE candidates to target user
      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit('voice:signal', {
            code: roomCode,
            targetUserId,
            senderUserId: myUserId,
            signal: event.candidate,
          });
        }
      };

      // When remote track arrives, attach to audio element and play
      pc.ontrack = (event) => {
        console.log(`[WebRTC] Remote track received from ${targetUserId}`);
        const remoteStream = event.streams[0] || new MediaStream([event.track]);
        let audioEl = audioElementsRef.current.get(targetUserId);
        if (!audioEl) {
          audioEl = document.createElement('audio');
          audioEl.autoplay = true;
          audioEl.setAttribute('playsinline', 'true');
          audioEl.setAttribute('webkit-playsinline', 'true');
          // Important: Never display: none on iOS/WebKit - use fixed off-screen styling
          audioEl.style.position = 'fixed';
          audioEl.style.top = '-9999px';
          audioEl.style.left = '-9999px';
          audioEl.style.width = '1px';
          audioEl.style.height = '1px';
          audioEl.style.opacity = '0';
          audioEl.style.pointerEvents = 'none';
          document.body.appendChild(audioEl);
          audioElementsRef.current.set(targetUserId, audioEl);
        }
        audioEl.srcObject = remoteStream;
        audioEl.volume = 1.0;
        audioEl.muted = false;

        const playPromise = audioEl.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn('[WebRTC] Autoplay waiting for user gesture:', err);
          });
        }

        setPeers((prev) => ({
          ...prev,
          [targetUserId]: {
            userId: targetUserId,
            peerConnection: pc,
            stream: remoteStream,
            isMuted: prev[targetUserId]?.isMuted ?? false,
            isSpeaking: prev[targetUserId]?.isSpeaking ?? false,
            volume: prev[targetUserId]?.volume ?? 1.0,
            isLocallyMuted: prev[targetUserId]?.isLocallyMuted ?? false,
          },
        }));
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') {
          setConnectionQuality('good');
        } else if (pc.connectionState === 'connecting') {
          setConnectionQuality('medium');
        } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          setConnectionQuality('poor');
        }
      };

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
          setConnectionQuality('good');
        } else if (pc.iceConnectionState === 'failed') {
          if (typeof pc.restartIce === 'function') {
            pc.restartIce();
          }
        }
      };

      peerConnectionsRef.current.set(targetUserId, pc);
      return pc;
    },
    [roomCode, myUserId, socket]
  );

  // Mesh peer setup: connect to each remote player
  useEffect(() => {
    if (!socket || !roomCode) return;

    remoteUserIds.forEach(async (targetId) => {
      if (targetId === myUserId) return;
      if (!peerConnectionsRef.current.has(targetId)) {
        const pc = createPeerConnection(targetId);

        // Deterministic offerer: the player whose id is alphabetically greater creates the offer
        if (myUserId > targetId) {
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit('voice:signal', {
              code: roomCode,
              targetUserId: targetId,
              senderUserId: myUserId,
              signal: offer,
            });
          } catch (err) {
            console.warn('[WebRTC] Offer error:', err);
          }
        }
      }
    });

    // Cleanup disconnected peers
    peerConnectionsRef.current.forEach((pc, uid) => {
      if (!remoteUserIds.includes(uid)) {
        pc.close();
        peerConnectionsRef.current.delete(uid);
        iceCandidateQueuesRef.current.delete(uid);
        const el = audioElementsRef.current.get(uid);
        if (el) {
          el.srcObject = null;
          if (el.parentNode) {
            el.parentNode.removeChild(el);
          }
          audioElementsRef.current.delete(uid);
        }
        setPeers((prev) => {
          const next = { ...prev };
          delete next[uid];
          return next;
        });
      }
    });
  }, [remoteUserIds, myUserId, socket, roomCode, createPeerConnection]);

  // Handle incoming signaling: offer, answer, ice-candidate
  useEffect(() => {
    if (!socket) return;

    const handleSignal = async (payload: WebRtcSignalPayload) => {
      const { senderUserId, signal } = payload;
      let pc = peerConnectionsRef.current.get(senderUserId);
      if (!pc) {
        pc = createPeerConnection(senderUserId);
      }

      try {
        if ('type' in signal) {
          const desc = signal as RTCSessionDescriptionInit;
          if (desc.type === 'offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(desc));
            // Ensure audio transceiver direction is sendrecv in the answer
            const transceivers = pc.getTransceivers();
            const audioTransceiver = transceivers.find((t) => t.receiver.track.kind === 'audio');
            if (audioTransceiver) {
              audioTransceiver.direction = 'sendrecv';
            }
            // Drain queued ICE candidates
            const queued = iceCandidateQueuesRef.current.get(senderUserId) || [];
            for (const cand of queued) {
              await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
            }
            iceCandidateQueuesRef.current.set(senderUserId, []);

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('voice:signal', {
              code: roomCode,
              targetUserId: senderUserId,
              senderUserId: myUserId,
              signal: answer,
            });
          } else if (desc.type === 'answer') {
            await pc.setRemoteDescription(new RTCSessionDescription(desc));
            // Drain queued ICE candidates
            const queued = iceCandidateQueuesRef.current.get(senderUserId) || [];
            for (const cand of queued) {
              await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
            }
            iceCandidateQueuesRef.current.set(senderUserId, []);
          }
        } else if ('candidate' in signal) {
          const candidateInit = signal as RTCIceCandidateInit;
          if (!pc.remoteDescription) {
            const queue = iceCandidateQueuesRef.current.get(senderUserId) || [];
            queue.push(candidateInit);
            iceCandidateQueuesRef.current.set(senderUserId, queue);
          } else {
            await pc.addIceCandidate(new RTCIceCandidate(candidateInit)).catch(() => {});
          }
        }
      } catch (err) {
        console.warn('[WebRTC] Signaling error:', err);
      }
    };

    const handleVoiceStateChanged = (payload: {
      userId: string;
      isMuted: boolean;
      isSpeaking: boolean;
    }) => {
      setPeers((prev) => {
        const existing = prev[payload.userId];
        return {
          ...prev,
          [payload.userId]: {
            userId: payload.userId,
            peerConnection: existing?.peerConnection || (peerConnectionsRef.current.get(payload.userId) as RTCPeerConnection),
            stream: existing?.stream,
            isMuted: payload.isMuted,
            isSpeaking: payload.isSpeaking,
            volume: existing?.volume ?? 1.0,
            isLocallyMuted: existing?.isLocallyMuted ?? false,
          },
        };
      });
    };

    socket.on('voice:signal', handleSignal);
    socket.on('voice:state_changed', handleVoiceStateChanged);

    return () => {
      socket.off('voice:signal', handleSignal);
      socket.off('voice:state_changed', handleVoiceStateChanged);
    };
  }, [socket, roomCode, myUserId, createPeerConnection]);

  // Set per-player volume
  const setPeerVolume = (userId: string, volume: number) => {
    const audioEl = audioElementsRef.current.get(userId);
    if (audioEl) {
      audioEl.volume = Math.max(0, Math.min(1, volume));
    }
    setPeers((prev) => {
      const p = prev[userId];
      if (!p) return prev;
      return { ...prev, [userId]: { ...p, volume } };
    });
  };

  // Toggle local mute for a specific player
  const togglePeerLocalMute = (userId: string) => {
    const audioEl = audioElementsRef.current.get(userId);
    setPeers((prev) => {
      const p = prev[userId];
      if (!p) return prev;
      const nextMuted = !p.isLocallyMuted;
      if (audioEl) {
        audioEl.muted = nextMuted;
      }
      return { ...prev, [userId]: { ...p, isLocallyMuted: nextMuted } };
    });
  };

  // Switch input microphone
  const switchMicrophone = async (deviceId: string) => {
    setSelectedMicId(deviceId);
    await initAudio(deviceId);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      peerConnectionsRef.current.forEach((pc) => pc.close());
      peerConnectionsRef.current.clear();
      audioElementsRef.current.forEach((el) => {
        el.srcObject = null;
        if (el.parentNode) {
          el.parentNode.removeChild(el);
        }
      });
      audioElementsRef.current.clear();
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
      if (speakingTimeoutRef.current) {
        clearTimeout(speakingTimeoutRef.current);
      }
    };
  }, []);

  return {
    initAudio,
    localStream,
    isMuted,
    setIsMuted,
    isPushToTalk,
    setIsPushToTalk,
    isPttPressed,
    setIsPttPressed,
    isSpeaking,
    audioPermission,
    availableMics,
    selectedMicId,
    switchMicrophone,
    connectionQuality,
    peers,
    setPeerVolume,
    togglePeerLocalMute,
  };
}
