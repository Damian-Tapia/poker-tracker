// src/core/hooks/use-poker.ts
// Reads reactivos con useSyncExternalStore (NATIVO de React, cero deps externas).
//
// NOTA de hidratación: en SSR y en el primer render de cliente el snapshot es EMPTY_STATE,
// así que las listas arrancan vacías y se llenan tras la hidratación. useSyncExternalStore
// maneja esto sin warnings, pero igual conviene un estado de carga si el vacío se ve raro.

'use client';

import { useMemo, useSyncExternalStore } from 'react';
import {
  subscribe,
  getSnapshot,
  getServerSnapshot,
  selectPlayerLifetimeStats,
  PokerState,
} from '../store/poker-store';
import { summarizeSession, checkIntegrity } from '../logic/session-math';
import { settle } from '../logic/settlement';

function usePokerState(): PokerState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function usePlayers() {
  const s = usePokerState();
  return useMemo(
    () => [...s.players].sort((a, b) => a.name.localeCompare(b.name)),
    [s.players],
  );
}

export function useOpenSessions() {
  const s = usePokerState();
  return useMemo(() => s.sessions.filter((x) => x.status === 'open'), [s.sessions]);
}

export function useSessionHistory() {
  const s = usePokerState();
  return useMemo(
    () => s.sessions.filter((x) => x.status === 'closed').sort((a, b) => b.date - a.date),
    [s.sessions],
  );
}

export function useSession(sessionId?: string) {
  const s = usePokerState();
  return useMemo(
    () => (sessionId ? s.sessions.find((x) => x.id === sessionId) : undefined),
    [s.sessions, sessionId],
  );
}

export function useSessionPlayers(sessionId?: string) {
  const s = usePokerState();
  return useMemo(() => {
    if (!sessionId) return [];
    return s.sessionPlayers
      .filter((sp) => sp.sessionId === sessionId)
      .sort((a, b) => (a.seat ?? Infinity) - (b.seat ?? Infinity) || a.joinedAt - b.joinedAt)
      .map((sp) => ({
        sessionPlayer: sp,
        player: s.players.find((p) => p.id === sp.playerId),
      }));
  }, [s.sessionPlayers, s.players, sessionId]);
}

export function useSessionSummary(sessionId?: string) {
  const s = usePokerState();
  return useMemo(() => {
    if (!sessionId) return [];
    const txs = s.transactions.filter((t) => t.sessionId === sessionId);
    return summarizeSession(txs);
  }, [s.transactions, sessionId]);
}

export function useSessionSettlement(sessionId?: string) {
  const s = usePokerState();
  return useMemo(() => {
    if (!sessionId) return undefined;
    const session = s.sessions.find((x) => x.id === sessionId);
    if (!session) return undefined;
    const txs = s.transactions.filter((t) => t.sessionId === sessionId);
    const summaries = summarizeSession(txs);
    return { summaries, payments: settle(summaries), integrity: checkIntegrity(summaries, session) };
  }, [s.sessions, s.transactions, sessionId]);
}

export function usePlayerLifetimeStats(playerId?: string) {
  const s = usePokerState();
  return useMemo(
    () => (playerId ? selectPlayerLifetimeStats(s, playerId) : undefined),
    [s, playerId],
  );
}