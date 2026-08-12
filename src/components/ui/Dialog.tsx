'use client';

import { ReactNode, useEffect, useRef } from 'react';
import { Icon } from './Icon';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Dialog({ open, onClose, title, children, className = '' }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open) {
      if (!el.open) el.showModal();
    } else {
      if (el.open) el.close();
    }
  }, [open]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handler = () => onClose();
    el.addEventListener('close', handler);
    return () => el.removeEventListener('close', handler);
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      className={`
        m-auto w-full max-w-sm rounded-2xl border border-felt-500 bg-felt-900 p-6 text-ivory
        backdrop:bg-ink/80 backdrop:backdrop-blur-sm
        open:animate-in open:fade-in open:slide-in-from-bottom-4
        ${className}
      `}
    >
      {title && (
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-xl text-brass-300">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="text-ivory-dim hover:text-ivory leading-none"
          >
            <Icon name="close" size={18} />
          </button>
        </div>
      )}
      {children}
    </dialog>
  );
}
