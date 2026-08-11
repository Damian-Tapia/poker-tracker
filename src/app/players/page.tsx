'use client';

import { useState } from 'react';
import { useMounted } from '@/hooks/use-mounted';
import { usePlayers } from '@/core/hooks/use-poker';
import { addPlayer, updatePlayer, deletePlayer } from '@/core/store/poker-store';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { PlayerFormDialog } from '@/components/ui/PlayerFormDialog';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { Player } from '@/core/models/domain';

export default function PlayersPage() {
  const mounted = useMounted();
  const players = usePlayers();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Player | null>(null);
  const [deleting, setDeleting] = useState<Player | null>(null);

  if (!mounted) return <div className="p-6 text-ivory-dim">Cargando…</div>;

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl text-brass-300">Jugadores</h1>
        <Button size="sm" onClick={() => setCreateOpen(true)}>+ Agregar</Button>
      </div>

      {players.length === 0 && (
        <p className="py-10 text-center text-ivory-dim">
          No hay jugadores. ¡Agregá el primero!
        </p>
      )}

      <ul className="space-y-2">
        {players.map((p) => (
          <li
            key={p.id}
            className="flex items-center gap-3 rounded-xl border border-felt-500 bg-felt-900 px-4 py-3"
          >
            <Avatar name={p.name} avatar={p.avatar} />
            <span className="flex-1 font-semibold text-ivory">{p.name}</span>
            <button
              onClick={() => setEditing(p)}
              className="text-sm text-ivory-dim hover:text-ivory px-2"
              aria-label={`Editar ${p.name}`}
            >
              ✏️
            </button>
            <button
              onClick={() => setDeleting(p)}
              className="text-sm text-oxblood-300 hover:text-loss px-2"
              aria-label={`Borrar ${p.name}`}
            >
              🗑️
            </button>
          </li>
        ))}
      </ul>

      <PlayerFormDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSave={(name, avatar) => addPlayer(name, avatar)}
        title="Nuevo jugador"
      />

      <PlayerFormDialog
        open={!!editing}
        onClose={() => setEditing(null)}
        onSave={(name, avatar) => editing && updatePlayer(editing.id, { name, avatar })}
        initialName={editing?.name}
        initialAvatar={editing?.avatar}
        title="Editar jugador"
      />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && deletePlayer(deleting.id)}
        title="Borrar jugador"
        message={`¿Borrar a ${deleting?.name}? Sus transacciones históricas quedan guardadas.`}
        confirmLabel="Borrar"
      />
    </div>
  );
}
