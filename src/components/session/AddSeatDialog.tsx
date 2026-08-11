'use client';

import { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { addPlayerToSession } from '@/core/store/poker-store';
import { usePlayers } from '@/core/hooks/use-poker';

interface Props {
  open: boolean;
  onClose: () => void;
  sessionId: string;
  existingPlayerIds: Set<string>;
}

export function AddSeatDialog({ open, onClose, sessionId, existingPlayerIds }: Props) {
  const players = usePlayers();
  const [search, setSearch] = useState('');

  const available = players.filter(
    (p) => !existingPlayerIds.has(p.id) && p.name.toLowerCase().includes(search.toLowerCase()),
  );

  function add(playerId: string) {
    addPlayerToSession(sessionId, playerId);
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} title="Agregar jugador">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar jugador..."
        className="mb-3 w-full rounded-lg border border-felt-500 bg-felt-900 px-3 py-2 text-ivory placeholder:text-ivory-dim focus:border-brass-500 focus:outline-none"
      />
      <div className="max-h-60 overflow-y-auto space-y-1">
        {available.length === 0 && (
          <p className="py-4 text-center text-sm text-ivory-dim">Sin jugadores disponibles</p>
        )}
        {available.map((p) => (
          <button
            key={p.id}
            onClick={() => add(p.id)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 hover:bg-felt-700 transition-colors"
          >
            <Avatar name={p.name} avatar={p.avatar} size="sm" />
            <span className="text-ivory">{p.name}</span>
          </button>
        ))}
      </div>
      <div className="mt-3 flex justify-end">
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
      </div>
    </Dialog>
  );
}
