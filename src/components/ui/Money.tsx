'use client';

import { formatMXN } from '@/core/logic/currency';

interface Props {
  amount: number;
  showSign?: boolean;
  className?: string;
}

export function Money({ amount, showSign = false, className = '' }: Props) {
  const formatted = formatMXN(Math.abs(amount));

  const sign = amount > 0 ? '+' : amount < 0 ? '-' : '';
  const colorClass =
    amount > 0
      ? 'text-win'
      : amount < 0
        ? 'text-loss'
        : 'text-ivory-dim';

  return (
    <span className={`tabular-money ${colorClass} ${className}`}>
      {showSign && sign}{formatted}
    </span>
  );
}
