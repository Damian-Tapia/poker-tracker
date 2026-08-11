'use client';

import { Dialog } from './Dialog';
import { Button } from './Button';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmVariant?: 'primary' | 'danger';
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmar',
  confirmVariant = 'danger',
}: Props) {
  return (
    <Dialog open={open} onClose={onClose} title={title}>
      <p className="mb-6 text-ivory-dim">{message}</p>
      <div className="flex gap-3 justify-end">
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button variant={confirmVariant} onClick={() => { onConfirm(); onClose(); }}>
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
