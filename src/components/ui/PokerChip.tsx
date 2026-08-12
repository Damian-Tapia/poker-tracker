'use client';

interface Props {
  colorToken: string;
  label: string;
  size?: 'sm' | 'md';
  className?: string;
}

// Clases estáticas (no interpoladas) para que Tailwind las detecte en build.
const CHIP_BG: Record<string, string> = {
  'chip-white': 'bg-chip-white text-ink',
  'chip-red': 'bg-chip-red text-ivory',
  'chip-green': 'bg-chip-green text-ivory',
  'chip-blue': 'bg-chip-blue text-ivory',
  'chip-black': 'bg-chip-black text-ivory',
  'chip-purple': 'bg-chip-purple text-ivory',
};

const SIZES = { sm: 'h-9 w-9 text-[10px]', md: 'h-12 w-12 text-xs' };

/** Disco visual de ficha física. Puramente decorativo/informativo. */
export function PokerChip({ colorToken, label, size = 'md', className = '' }: Props) {
  const bg = CHIP_BG[colorToken] ?? 'bg-felt-700 text-ivory';
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full border-2 border-dashed border-ivory/40 font-bold tabular-money ${bg} ${SIZES[size]} ${className}`}
      aria-hidden
    >
      {label}
    </div>
  );
}
