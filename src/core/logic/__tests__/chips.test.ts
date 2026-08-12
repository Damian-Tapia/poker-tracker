import { describe, it, expect } from 'vitest';
import { totalFromChipCounts, totalChipPieces } from '../chips';
import type { ChipCount } from '../../models/domain';

describe('totalFromChipCounts', () => {
  it('sums value * count across denominations', () => {
    const counts: ChipCount[] = [
      { value: 1, count: 20 },
      { value: 5, count: 20 },
      { value: 25, count: 20 },
    ];
    expect(totalFromChipCounts(counts)).toBe(20 + 100 + 500);
  });

  it('returns 0 for empty breakdown', () => {
    expect(totalFromChipCounts([])).toBe(0);
  });

  it('ignores zero-count denominations', () => {
    const counts: ChipCount[] = [{ value: 100, count: 0 }, { value: 1, count: 3 }];
    expect(totalFromChipCounts(counts)).toBe(3);
  });

  it('rounds to cents to avoid float drift', () => {
    const counts: ChipCount[] = [{ value: 0.1, count: 3 }];
    expect(totalFromChipCounts(counts)).toBeCloseTo(0.3, 5);
  });
});

describe('totalChipPieces', () => {
  it('sums physical chip count regardless of denomination', () => {
    const counts: ChipCount[] = [
      { value: 1, count: 20 },
      { value: 100, count: 4 },
    ];
    expect(totalChipPieces(counts)).toBe(24);
  });

  it('returns 0 for empty breakdown', () => {
    expect(totalChipPieces([])).toBe(0);
  });
});
