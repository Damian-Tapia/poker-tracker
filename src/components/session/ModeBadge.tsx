'use client';

import { Icon } from '@/components/ui/Icon';
import type { SessionMode } from '@/core/models/domain';

interface Props {
  mode: SessionMode;
  onClick?: () => void;
  className?: string;
}

/** Badge inequívoco del modo real/play. Nadie debería poder confundir una noche de a mentira con una de a de verdad. */
export function ModeBadge({ mode, onClick, className = '' }: Props) {
  const isReal = mode === 'real';
  const classes = `inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors ${
    isReal
      ? 'border-brass-500 bg-brass-700/40 text-brass-300'
      : 'border-chip-blue bg-chip-blue/20 text-ivory'
  } ${className}`;

  const content = (
    <>
      <Icon name={isReal ? 'mode-real' : 'mode-play'} size={14} />
      {isReal ? 'Dinero real' : 'Por diversión'}
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${classes} hover:opacity-80`}>
        {content}
      </button>
    );
  }
  return <span className={classes}>{content}</span>;
}
