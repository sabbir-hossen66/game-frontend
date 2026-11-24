'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserProfile, UserStats } from '../types';

const AVATARS = ['🐱', '🐺', '🦊', '🐉', '🤖', '🦁', '⚡', '🚀', '🎮', '🥷', '👑', '🦄'];

const STORAGE_KEY_PROFILE = 'playroom_guest_profile';
const STORAGE_KEY_STATS = 'playroom_user_stats';
const STORAGE_KEY_TOKEN = 'playroom_auth_token';

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats>({ totalWins: 0, gamesPlayed: 0 });
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Sync profile to Neon PostgreSQL
  const syncWithBackend = useCallback(async (currentProfile: UserProfile, token: string | null) => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
    try {
      if (token) {
        const res = await fetch(`${backendUrl}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const user = await res.json();
          setProfile({
            id: user.id,
            nickname: user.nickname,
            avatar: user.avatar,
          });
          setStats({
            totalWins: user.totalWins,
            gamesPlayed: user.gamesPlayed,
          });
          return;
        }
      }

      // If guest, sync to NeonDB
      const res = await fetch(`${backendUrl}/api/auth/guest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentProfile.id,
          nickname: currentProfile.nickname,
          avatar: currentProfile.avatar,
        }),
      });

      if (res.ok) {
        const user = await res.json();
        setStats({
          totalWins: user.totalWins,
          gamesPlayed: user.gamesPlayed,
        });
      }
    } catch {
      // Local fallback
    }
  }, []);

  useEffect(() => {
    try {
      const savedToken = localStorage.getItem(STORAGE_KEY_TOKEN);
      const savedProfile = localStorage.getItem(STORAGE_KEY_PROFILE);
      const savedStats = localStorage.getItem(STORAGE_KEY_STATS);

      let currentProfile: UserProfile;
      if (savedProfile) {
        currentProfile = JSON.parse(savedProfile);
      } else {
        const randomId = 'usr_' + Math.random().toString(36).substring(2, 9);
        const randomAvatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];
        const randomNick = `Player_${Math.floor(1000 + Math.random() * 9000)}`;
        currentProfile = {
          id: randomId,
          nickname: randomNick,
          avatar: randomAvatar,
        };
        localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(currentProfile));
      }

      let currentStats: UserStats = { totalWins: 0, gamesPlayed: 0 };
      if (savedStats) {
        currentStats = JSON.parse(savedStats);
      }

      setProfile(currentProfile);
      setStats(currentStats);
      setAuthToken(savedToken);

      // Async sync to Neon DB
      syncWithBackend(currentProfile, savedToken);
    } catch {
      setProfile({
        id: 'usr_default',
        nickname: 'Player',
        avatar: '🎮',
      });
    } finally {
      setIsLoaded(true);
    }
  }, [syncWithBackend]);

  const updateProfile = (nickname: string, avatar: string) => {
    if (!profile) return;
    const updated: UserProfile = {
      ...profile,
      nickname: nickname.trim() || profile.nickname,
      avatar,
    };
    setProfile(updated);
    localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(updated));
    syncWithBackend(updated, authToken);
  };

  const setAuthUser = (
    token: string,
    user: {
      id: string;
      nickname: string;
      avatar: string;
      email: string | null;
      totalWins: number;
      gamesPlayed: number;
    }
  ) => {
    const updatedProfile: UserProfile = {
      id: user.id,
      nickname: user.nickname,
      avatar: user.avatar,
    };
    const updatedStats: UserStats = {
      totalWins: user.totalWins,
      gamesPlayed: user.gamesPlayed,
    };
    setProfile(updatedProfile);
    setStats(updatedStats);
    setAuthToken(token);
    localStorage.setItem(STORAGE_KEY_TOKEN, token);
    localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(updatedProfile));
    localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(updatedStats));
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    setAuthToken(null);
    const randomId = 'usr_' + Math.random().toString(36).substring(2, 9);
    const guestProfile: UserProfile = {
      id: randomId,
      nickname: `Player_${Math.floor(1000 + Math.random() * 9000)}`,
      avatar: '🎮',
    };
    setProfile(guestProfile);
    setStats({ totalWins: 0, gamesPlayed: 0 });
    localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(guestProfile));
    localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify({ totalWins: 0, gamesPlayed: 0 }));
  };

  const recordMatchOutcome = (won: boolean) => {
    setStats((prev) => {
      const updated: UserStats = {
        totalWins: won ? prev.totalWins + 1 : prev.totalWins,
        gamesPlayed: prev.gamesPlayed + 1,
      };
      localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(updated));
      return updated;
    });
  };

  return {
    profile,
    stats,
    authToken,
    isAuthenticated: Boolean(authToken),
    isLoaded,
    avatars: AVATARS,
    updateProfile,
    setAuthUser,
    logout,
    recordMatchOutcome,
  };
}
