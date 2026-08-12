import { describe, it, expect } from 'vitest';
import { formatMXN } from '../currency';

describe('formatMXN', () => {
  it('formats a positive integer amount as MXN', () => {
    expect(formatMXN(1500)).toBe('$1,500.00');
  });

  it('formats zero', () => {
    expect(formatMXN(0)).toBe('$0.00');
  });

  it('formats decimals rounded to cents', () => {
    expect(formatMXN(20.5)).toBe('$20.50');
  });

  it('formats negative amounts with a leading minus', () => {
    expect(formatMXN(-75)).toBe('-$75.00');
  });
});
