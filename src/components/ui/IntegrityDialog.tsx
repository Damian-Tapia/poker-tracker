'use client';

import { Dialog } from './Dialog';
import { Button } from './Button';
import { formatMXN } from '@/core/logic/currency';
import type { SessionIntegrity } from '@/core/logic/session-math';

interface Props {
  open: boolean;
  onClose: () => void;
  onForce: () => void;
  integrity: SessionIntegrity;
}

export function IntegrityDialog({ open, onClose, onForce, integrity }: Props) {
  const fmt = (n: number) => formatMXN(Math.abs(n));

  return (
    <Dialog open={open} onClose={onClose} title="Sesión desbalanceada">
      <div className="mb-4 space-y-2 text-sm">
        {!integrity.moneyBalanced && (
          <p className="text-oxblood-300">
            Diferencia de dinero: <strong>{fmt(integrity.netSum)}</strong>
          </p>
        )}
        {!integrity.chipsBalanced && (
          <p className="text-oxblood-300">
            Fichas que faltan canjear: <strong>{integrity.chipDelta}</strong>
          </p>
        )}
        <p className="text-ivory-dim text-xs">
          Verificá que todos los jugadores hicieron cash-out. Si el desbalance es intencional (rake), podés forzar el cierre.
        </p>
      </div>
      <div className="flex gap-3 justify-end">
        <Button variant="ghost" onClick={onClose}>Volver</Button>
        <Button variant="danger" onClick={() => { onForce(); onClose(); }}>
          Forzar cierre
        </Button>
      </div>
    </Dialog>
  );
}
