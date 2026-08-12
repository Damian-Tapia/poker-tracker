// core/models/chips.ts
// Set de fichas fijo del home game. Constantes tipadas, sin custodia de inventario.

import type { ChipCount } from './domain';

export interface ChipDenomination {
  value: number;
  colorToken: string; // token del design system (ver globals.css), no color hardcodeado
  label: string;
  defaultCount: number; // cantidad física default en el set del host
}

export const CHIP_DENOMINATIONS: readonly ChipDenomination[] = [
  { value: 1, colorToken: 'chip-white', label: '$1', defaultCount: 100 },
  { value: 5, colorToken: 'chip-red', label: '$5', defaultCount: 50 },
  { value: 25, colorToken: 'chip-green', label: '$25', defaultCount: 50 },
  { value: 50, colorToken: 'chip-blue', label: '$50', defaultCount: 50 },
  { value: 100, colorToken: 'chip-black', label: '$100', defaultCount: 25 },
  { value: 500, colorToken: 'chip-purple', label: '$500', defaultCount: 25 },
];

/** Preset rápido: reparto típico de buy-in (~$1,500 MXN) para no contar ficha por ficha. */
export const STANDARD_BUYIN_PRESET: readonly ChipCount[] = [
  { value: 1, count: 20 },
  { value: 5, count: 20 },
  { value: 25, count: 20 },
  { value: 50, count: 10 },
  { value: 100, count: 4 },
];
