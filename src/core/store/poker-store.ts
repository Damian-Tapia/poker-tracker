// src/core/store/poker-store.ts
// Store local SIN dependencias externas. Estado en memoria, persistido en localStorage,
// suscribible vía useSyncExternalStore (hook nativo de React).
// Reemplaza a Dexie (poker-db.ts) Y al service Angular/Next.
//
// Adecuado porque el volumen de datos de un home game es mínimo (KB). Si algún día
// esto creciera a decenas de miles de registros, ahí sí conviene volver a IndexedDB.

'use client';

import {
  Player,
  Session,
  SessionMode,
  SessionPlayer,
  Transaction,
  RoundResult,
  PlayerChipRack,
} from '../models/domain';
import {
  summarizePlayer,
  summarizeSession,
  checkIntegrity,
  round2,
  canChangeSessionMode,
} from '../logic/session-math';
import { computePlayerPotStats, PlayerPotStats } from '../logic/rounds';

export interface PokerState {
  players: Player[];
  sessions: Session[];
  sessionPlayers: SessionPlayer[];
  transactions: Transaction[];
  roundResults: RoundResult[];
}

const STORAGE_KEY = 'pokerTracker:v1';

// Referencia estable para SSR y estado vacío (requerido por useSyncExternalStore).
const EMPTY_STATE: PokerState = {
  players: [],
  sessions: [],
  sessionPlayers: [],
  transactions: [],
  roundResults: [],
};

let state: PokerState = EMPTY_STATE;
let loaded = false;
const listeners = new Set<() => void>();

const uid = (): string => crypto.randomUUID();
const isBrowser = (): boolean => typeof window !== 'undefined';

function load(): void {
  if (loaded || !isBrowser()) return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) state = { ...EMPTY_STATE, ...JSON.parse(raw) };
  } catch (e) {
    console.error('[poker-store] load failed', e);
  }
}

function persist(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('[poker-store] persist failed', e);
  }
}

/** Reemplaza el estado por una referencia NUEVA, persiste y notifica. */
function setState(next: PokerState): void {
  state = next;
  persist();
  listeners.forEach((l) => l());
}

// ---------------- API para useSyncExternalStore ----------------

export function subscribe(cb: () => void): () => void {
  load();
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** Debe devolver una referencia ESTABLE mientras no haya mutaciones. */
export function getSnapshot(): PokerState {
  load();
  return state;
}

export function getServerSnapshot(): PokerState {
  return EMPTY_STATE;
}

// ---------------- Comandos (mutaciones) ----------------

export function addPlayer(name: string, avatar?: string): Player {
  const player: Player = { id: uid(), name: name.trim(), avatar, createdAt: Date.now() };
  setState({ ...state, players: [...state.players, player] });
  return player;
}

export function updatePlayer(playerId: string, patch: { name?: string; avatar?: string }): void {
  setState({
    ...state,
    players: state.players.map((p) =>
      p.id === playerId
        ? { ...p, ...(patch.name !== undefined ? { name: patch.name.trim() } : {}), ...(patch.avatar !== undefined ? { avatar: patch.avatar } : {}) }
        : p,
    ),
  });
}

export function deletePlayer(playerId: string): void {
  setState({ ...state, players: state.players.filter((p) => p.id !== playerId) });
}

export function createSession(opts: {
  date?: number;
  location?: string;
  mode?: SessionMode;
  rake?: number;
  chipRack?: PlayerChipRack[];
}): Session {
  const session: Session = {
    id: uid(),
    date: opts.date ?? Date.now(),
    location: opts.location,
    status: 'open',
    mode: opts.mode ?? 'real',
    currency: 'MXN',
    rake: opts.rake ?? 0,
    chipRack: opts.chipRack,
    createdAt: Date.now(),
  };
  setState({ ...state, sessions: [...state.sessions, session] });
  return session;
}

/**
 * Cambia el modo real/play de una sesión. Solo permitido antes de la primera
 * transacción (evita mezclar métricas de plata real y ficticia a mitad de noche).
 */
export function setSessionMode(sessionId: string, mode: SessionMode): void {
  const s = state.sessions.find((x) => x.id === sessionId);
  if (!s) throw new Error('Session not found');
  const txs = state.transactions.filter((t) => t.sessionId === sessionId);
  if (!canChangeSessionMode(txs)) {
    throw new Error('No se puede cambiar el modo: la sesión ya tiene transacciones cargadas.');
  }
  setState({
    ...state,
    sessions: state.sessions.map((x) => (x.id === sessionId ? { ...x, mode } : x)),
  });
}

export function addPlayerToSession(sessionId: string, playerId: string, seat?: number): void {
  const exists = state.sessionPlayers.some(
    (sp) => sp.sessionId === sessionId && sp.playerId === playerId,
  );
  if (exists) return;
  const sp: SessionPlayer = { id: uid(), sessionId, playerId, seat, joinedAt: Date.now() };
  setState({ ...state, sessionPlayers: [...state.sessionPlayers, sp] });
}

function requireOpenSession(sessionId: string): Session {
  const s = state.sessions.find((x) => x.id === sessionId);
  if (!s) throw new Error('Session not found');
  if (s.status === 'closed') throw new Error('Session is closed');
  return s;
}

export function buyIn(
  sessionId: string,
  playerId: string,
  money: number,
  chips: number,
  type: 'BUY_IN' | 'REBUY' = 'BUY_IN',
): Transaction {
  requireOpenSession(sessionId);
  const tx: Transaction = { id: uid(), sessionId, playerId, type, money, chips, ts: Date.now() };

  const inRoster = state.sessionPlayers.some(
    (sp) => sp.sessionId === sessionId && sp.playerId === playerId,
  );
  const sessionPlayers = inRoster
    ? state.sessionPlayers
    : [...state.sessionPlayers, { id: uid(), sessionId, playerId, joinedAt: Date.now() }];

  setState({ ...state, transactions: [...state.transactions, tx], sessionPlayers });
  return tx;
}

export function rebuy(sessionId: string, playerId: string, money: number, chips: number): Transaction {
  return buyIn(sessionId, playerId, money, chips, 'REBUY');
}

export function cashout(sessionId: string, playerId: string, money: number, chips: number): Transaction {
  requireOpenSession(sessionId);
  const tx: Transaction = { id: uid(), sessionId, playerId, type: 'CASHOUT', money, chips, ts: Date.now() };
  setState({ ...state, transactions: [...state.transactions, tx] });
  return tx;
}

/** Cierra la sesión si está balanceada. Lanza si no cuadra (salvo force). */
export function closeSession(sessionId: string, opts: { force?: boolean } = {}): void {
  const s = requireOpenSession(sessionId);
  const txs = state.transactions.filter((t) => t.sessionId === sessionId);
  const summaries = summarizeSession(txs);
  const integrity = checkIntegrity(summaries, s);
  if (!opts.force && (!integrity.moneyBalanced || !integrity.chipsBalanced)) {
    throw new Error(
      `Sesión desbalanceada (netSum=${integrity.netSum.toFixed(2)}, ` +
        `chipDelta=${integrity.chipDelta}). Corregí los cash-outs o pasá { force: true }.`,
    );
  }
  const sessions = state.sessions.map((x) =>
    x.id === sessionId ? { ...x, status: 'closed' as const, closedAt: Date.now() } : x,
  );
  setState({ ...state, sessions });
}

/**
 * Registra el resultado de la ronda actual y deja lista la numeración para la
 * siguiente. Puramente informativo: NO alimenta settlement ni el neto de plata.
 */
export function recordRound(sessionId: string, winnerPlayerId: string, potChips?: number): RoundResult {
  requireOpenSession(sessionId);
  const existing = state.roundResults.filter((r) => r.sessionId === sessionId);
  const round = existing.length > 0 ? Math.max(...existing.map((r) => r.round)) + 1 : 1;
  const result: RoundResult = { id: uid(), sessionId, round, winnerPlayerId, potChips, ts: Date.now() };
  setState({ ...state, roundResults: [...state.roundResults, result] });
  return result;
}

// ---------------- Backup ----------------

export function exportData(): string {
  return JSON.stringify({ version: 1, exportedAt: Date.now(), ...state }, null, 2);
}

export function importData(json: string, opts: { replace?: boolean } = {}): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let data: any;
  try {
    data = JSON.parse(json);
  } catch {
    throw new Error('JSON inválido — el archivo no se puede leer.');
  }
  if (opts.replace) {
    setState({
      players: data.players ?? [],
      sessions: data.sessions ?? [],
      sessionPlayers: data.sessionPlayers ?? [],
      transactions: data.transactions ?? [],
      roundResults: data.roundResults ?? [],
    });
    return;
  }
  const mergeById = <T extends { id: string }>(a: T[], b: T[] = []): T[] => {
    const map = new Map(a.map((x) => [x.id, x]));
    for (const x of b) map.set(x.id, x);
    return [...map.values()];
  };
  setState({
    players: mergeById(state.players, data.players),
    sessions: mergeById(state.sessions, data.sessions),
    sessionPlayers: mergeById(state.sessionPlayers, data.sessionPlayers),
    transactions: mergeById(state.transactions, data.transactions),
    roundResults: mergeById(state.roundResults, data.roundResults),
  });
}

// ---------------- Selectores puros (para hooks) ----------------

export interface PlayerLifetimeStats {
  playerId: string;
  sessionsPlayed: number;
  totalIn: number;
  totalCashout: number;
  net: number;
  totalWon: number;
  totalLost: number;
  biggestWin: number;
  biggestLoss: number;
  winningSessions: number;
  losingSessions: number;
}

/** Real y play SIEMPRE separados. Nunca se suman en un solo número. */
export interface PlayerLifetimeStatsByMode {
  real: PlayerLifetimeStats;
  play: PlayerLifetimeStats;
}

function aggregateLifetimeStats(
  playerId: string,
  bySession: Map<string, Transaction[]>,
): PlayerLifetimeStats {
  const stats: PlayerLifetimeStats = {
    playerId, sessionsPlayed: 0, totalIn: 0, totalCashout: 0, net: 0,
    totalWon: 0, totalLost: 0, biggestWin: 0, biggestLoss: 0,
    winningSessions: 0, losingSessions: 0,
  };

  for (const sessTxs of bySession.values()) {
    const sum = summarizePlayer(playerId, sessTxs);
    stats.sessionsPlayed++;
    stats.totalIn += sum.buyInMoney;
    stats.totalCashout += sum.cashoutMoney;
    stats.net += sum.net;
    if (sum.net > 0) {
      stats.totalWon += sum.net; stats.winningSessions++;
      stats.biggestWin = Math.max(stats.biggestWin, sum.net);
    } else if (sum.net < 0) {
      stats.totalLost += -sum.net; stats.losingSessions++;
      stats.biggestLoss = Math.max(stats.biggestLoss, -sum.net);
    }
  }

  stats.totalIn = round2(stats.totalIn);
  stats.totalCashout = round2(stats.totalCashout);
  stats.net = round2(stats.net);
  stats.totalWon = round2(stats.totalWon);
  stats.totalLost = round2(stats.totalLost);
  stats.biggestWin = round2(stats.biggestWin);
  stats.biggestLoss = round2(stats.biggestLoss);
  return stats;
}

export function selectPlayerLifetimeStats(
  s: PokerState,
  playerId: string,
): PlayerLifetimeStatsByMode {
  const closedIdsByMode: Record<SessionMode, Set<string>> = { real: new Set(), play: new Set() };
  for (const x of s.sessions) {
    if (x.status === 'closed') closedIdsByMode[x.mode].add(x.id);
  }

  const txs = s.transactions.filter((t) => t.playerId === playerId);

  function bucket(mode: SessionMode): PlayerLifetimeStats {
    const ids = closedIdsByMode[mode];
    const bySession = new Map<string, Transaction[]>();
    for (const t of txs) {
      if (!ids.has(t.sessionId)) continue;
      const arr = bySession.get(t.sessionId) ?? [];
      arr.push(t);
      bySession.set(t.sessionId, arr);
    }
    return aggregateLifetimeStats(playerId, bySession);
  }

  return { real: bucket('real'), play: bucket('play') };
}

/** pozos ganados por jugador (cantidad, promedio, más grande), partido por modo real/play. */
export function selectPlayerRoundStats(
  s: PokerState,
  playerId: string,
): { real: PlayerPotStats; play: PlayerPotStats } {
  const closedIdsByMode: Record<SessionMode, Set<string>> = { real: new Set(), play: new Set() };
  for (const x of s.sessions) {
    if (x.status === 'closed') closedIdsByMode[x.mode].add(x.id);
  }

  function bucket(mode: SessionMode): PlayerPotStats {
    const ids = closedIdsByMode[mode];
    const rounds = s.roundResults.filter((r) => ids.has(r.sessionId));
    return computePlayerPotStats(playerId, rounds);
  }

  return { real: bucket('real'), play: bucket('play') };
}