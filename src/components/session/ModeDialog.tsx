'use client';

import { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { setSessionMode } from '@/core/store/poker-store';
import type { SessionMode } from '@/core/models/domain';

interface Props {
  open: boolean;
  onClose: () => void;
  sessionId: string;
  currentMode: SessionMode;
  locked: boolean;
}

/** Bloquea el cambio de modo con un diálogo explicativo, no un alert. */
export function ModeDialog({ open, onClose, sessionId, currentMode, locked }: Props) {
  const [prevOpen, setPrevOpen] = useState(open);
  const [pending, setPending] = useState<SessionMode>(currentMode);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setPending(currentMode);
  }

  if (locked) {
    return (
      <Dialog open={open} onClose={onClose} title="Modo bloqueado">
        <p className="mb-6 text-sm text-ivory-dim">
          Esta sesión ya tiene transacciones cargadas. El modo real/play queda fijo para no mezclar métricas de plata real y ficticia.
        </p>
        <div className="flex justify-end">
          <Button onClick={onClose}>Entendido</Button>
        </div>
      </Dialog>
    );
  }

  function handleConfirm() {
    if (pending !== currentMode) setSessionMode(sessionId, pending);
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} title="Cambiar modo">
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setPending('real')}
          className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors ${
            pending === 'real'
              ? 'border-brass-500 bg-brass-700 text-ivory'
              : 'border-felt-500 text-ivory-dim hover:border-brass-700 hover:text-ivory'
          }`}
        >
          <Icon name="mode-real" size={18} />
          Dinero real
        </button>
        <button
          onClick={() => setPending('play')}
          className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors ${
            pending === 'play'
              ? 'border-chip-blue bg-chip-blue/30 text-ivory'
              : 'border-felt-500 text-ivory-dim hover:border-brass-700 hover:text-ivory'
          }`}
        >
          <Icon name="mode-play" size={18} />
          Por diversión
        </button>
      </div>
      <div className="mt-5 flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button onClick={handleConfirm}>Guardar</Button>
      </div>
    </Dialog>
  );
}
