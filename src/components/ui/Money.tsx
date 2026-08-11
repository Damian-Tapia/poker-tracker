'use client';

interface Props {
  amount: number;
  currency?: string;
  showSign?: boolean;
  className?: string;
}

export function Money({ amount, currency = 'USD', showSign = false, className = '' }: Props) {
  const formatted = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));

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
