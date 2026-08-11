'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'sm' | 'md' | 'lg';
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-lg font-sans font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass-500 disabled:opacity-40 disabled:pointer-events-none';

const variants: Record<Variant, string> = {
  primary: 'bg-brass-500 text-ink hover:bg-brass-300 active:bg-brass-700',
  secondary: 'bg-felt-500 text-ivory hover:bg-felt-700 border border-brass-700',
  ghost: 'bg-transparent text-ivory-dim hover:text-ivory hover:bg-felt-700',
  danger: 'bg-oxblood text-ivory hover:bg-oxblood-300',
};

const sizes = {
  sm: 'text-sm px-3 py-1.5',
  md: 'text-base px-4 py-2',
  lg: 'text-lg px-6 py-3',
};

export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ variant = 'primary', size = 'md', className = '', children, ...rest }, ref) => (
    <button
      ref={ref}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  ),
);
Button.displayName = 'Button';
