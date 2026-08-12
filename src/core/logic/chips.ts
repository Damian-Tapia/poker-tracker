// core/logic/chips.ts
// Matemática pura del constructor de buy-in por fichas. Sin UI, sin custodia de inventario.

import type { ChipCount, PlayerChipRack } from '../models/domain';
import { round2 } from './session-math';

/** Monto total en MXN de un reparto de fichas por denominación. */
export function totalFromChipCounts(counts: ChipCount[]): number {
  return round2(counts.reduce((sum, c) => sum + c.value * c.count, 0));
}

/** Cantidad total de fichas físicas (piezas), sin importar denominación. */
export function totalChipPieces(counts: ChipCount[]): number {
  return counts.reduce((sum, c) => sum + c.count, 0);
}

/** Gran total en MXN de lo que entró cada jugador, sumado entre todos. Solo referencia. */
export function totalFromPlayerChipRacks(racks: PlayerChipRack[]): number {
  return round2(racks.reduce((sum, r) => sum + totalFromChipCounts(r.counts), 0));
}
