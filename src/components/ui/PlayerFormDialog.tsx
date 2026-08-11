'use client';

import { useState, useEffect } from 'react';
import { Dialog } from './Dialog';
import { Button } from './Button';

const EMOJI_OPTIONS = ['🎰', '🃏', '♠️', '🎲', '🤠', '😎', '🦊', '🐺', '🐻', '🦁'];

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (name: string, avatar?: string) => void;
  initialName?: string;
  initialAvatar?: string;
  title?: string;
}

export function PlayerFormDialog({
  open,
  onClose,
  onSave,
  initialName = '',
  initialAvatar,
  title = 'Nuevo jugador',
}: Props) {
  const [name, setName] = useState(initialName);
  const [avatar, setAvatar] = useState<string | undefined>(initialAvatar);

  useEffect(() => {
    if (open) { setName(initialName); setAvatar(initialAvatar); }
  }, [open, initialName, initialAvatar]);

  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed, avatar);
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} title={title}>
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-xs text-ivory-dim">Nombre</label>
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder="Nombre del jugador"
            className="w-full rounded-lg border border-felt-500 bg-felt-900 px-3 py-2 text-ivory placeholder:text-ivory-dim focus:border-brass-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-2 block text-xs text-ivory-dim">Avatar (emoji)</label>
          <div className="flex flex-wrap gap-2">
            {EMOJI_OPTIONS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setAvatar(avatar === e ? undefined : e)}
                className={`h-10 w-10 rounded-lg text-xl transition-colors ${
                  avatar === e ? 'bg-brass-700 ring-2 ring-brass-500' : 'bg-felt-700 hover:bg-felt-500'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!name.trim()}>Guardar</Button>
        </div>
      </div>
    </Dialog>
  );
}
