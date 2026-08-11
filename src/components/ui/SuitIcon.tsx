'use client';

type Suit = '♠' | '♥' | '♦' | '♣';

const SUITS: Suit[] = ['♠', '♥', '♦', '♣'];

interface Props {
  suit?: Suit | number;
  className?: string;
}

export function SuitIcon({ suit, className = '' }: Props) {
  const s: Suit = typeof suit === 'number' ? SUITS[suit % 4] : (suit ?? '♠');
  const red = s === '♥' || s === '♦';
  return (
    <span className={`${red ? 'text-oxblood-300' : 'text-ivory'} ${className}`} aria-hidden>
      {s}
    </span>
  );
}

export { SUITS };
export type { Suit };
