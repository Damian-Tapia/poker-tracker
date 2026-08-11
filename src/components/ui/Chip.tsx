'use client';

interface Props {
  label: string | number;
  onClick?: () => void;
  active?: boolean;
  className?: string;
}

export function Chip({ label, onClick, active, className = '' }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        rounded-full border px-4 py-1.5 text-sm font-semibold tabular-money transition-colors
        ${active
          ? 'border-brass-500 bg-brass-700 text-ivory'
          : 'border-felt-500 bg-felt-900 text-ivory-dim hover:border-brass-700 hover:text-ivory'}
        ${className}
      `}
    >
      {label}
    </button>
  );
}
