// core/models/domain.ts
// Contratos de dominio. Todo lo demás depende de esto.
// Modelo pensado para CASH GAME, local-only, administrado por el host.

export type TransactionType = 'BUY_IN' | 'REBUY' | 'CASHOUT' | 'BET' | 'POT_WIN';

/** Un jugador es solo un perfil que administra el host. No loguea, no tiene cuenta. */
export interface Player {
  id: string;
  name: string;
  avatar?: string;      // opcional: url/base64/emoji
  createdAt: number;    // epoch ms
}

/** Dinero de verdad vs. sesión ficticia. Se fija al crear, se bloquea tras la primera transacción. */
export type SessionMode = 'real' | 'play';

/** Reparto de fichas por denominación. Solo informativo, no custodia inventario. */
export interface ChipCount {
  value: number;
  count: number;
}

/** Cuántas fichas (por denominación) contó el host para UN jugador. Solo referencia. */
export interface PlayerChipRack {
  playerId: string;
  counts: ChipCount[];
}

/** Una "noche" de juego. */
export interface Session {
  id: string;
  date: number;         // epoch ms
  location?: string;
  status: 'open' | 'closed';
  /** Dinero real ('real') o de mentira ('play'). Bloqueado tras la primera transacción. */
  mode: SessionMode;
  currency: string;     // siempre 'MXN'. Se mantiene el campo por compatibilidad de datos existentes.
  /** Dinero que sale de la mesa (corte del host / propina). Default 0 en home game. */
  rake?: number;
  /** Reparto de fichas por jugador contado al armar la mesa. Solo referencia — no crea
   *  transacciones ni bloquea nada; el buy-in real se sigue cargando por separado. */
  chipRack?: PlayerChipRack[];
  createdAt: number;
  closedAt?: number;
}

/** Roster: quién está en la mesa esta noche (aunque todavía no haya comprado fichas). */
export interface SessionPlayer {
  id: string;
  sessionId: string;
  playerId: string;
  seat?: number;
  joinedAt: number;
}

/** Movimiento de plata/fichas. money y chips SIEMPRE positivos; el `type` da el signo lógico. */
export interface Transaction {
  id: string;
  sessionId: string;
  playerId: string;
  type: TransactionType;
  money: number;        // dinero real movido
  chips: number;        // cantidad de fichas movidas
  ts: number;           // epoch ms
  note?: string;
}

/** Cuánto apostó un jugador en una ronda. */
export interface RoundBet {
  playerId: string;
  amount: number;
}

/**
 * Registro de ronda. El pozo es SIEMPRE la suma de `bets` (nunca se guarda por
 * separado, para que no se desincronice). Cada ronda mueve plata real: resta
 * `amount` del stack de cada jugador que apostó y se lo suma entero al ganador.
 */
export interface RoundResult {
  id: string;
  sessionId: string;
  round: number;
  bets: RoundBet[];
  winnerPlayerId: string;
  ts: number;
}