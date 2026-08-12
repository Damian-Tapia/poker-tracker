'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMounted } from '@/hooks/use-mounted';
import { usePlayers } from '@/core/hooks/use-poker';
import { createSession, addPlayerToSession } from '@/core/store/poker-store';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { ChipCounter } from '@/components/ui/ChipCounter';
import { CHIP_DENOMINATIONS } from '@/core/models/chips';
import type { ChipCount, SessionMode } from '@/core/models/domain';

const CHIP_VALUES = [0.5, 1, 2, 5, 10, 25];

const DEFAULT_RACK: ChipCount[] = CHIP_DENOMINATIONS.map((d) => ({ value: d.value, count: d.defaultCount }));

export default function NewSessionPage() {
  const mounted = useMounted();
  const players = usePlayers();
  const router = useRouter();

  const [mode, setMode] = useState<SessionMode>('real');
  const [chipValue, setChipValue] = useState(1);
  const [rake, setRake] = useState('0');
  const [location, setLocation] = useState('');
  const [roster, setRoster] = useState<Set<string>>(new Set());
  const [rackOpen, setRackOpen] = useState(false);
  const [chipRack, setChipRack] = useState<ChipCount[]>(DEFAULT_RACK);

  function togglePlayer(id: string) {
    setRoster((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleCreate() {
    const session = createSession({
      mode,
      chipValue,
      rake: parseFloat(rake) || 0,
      location: location.trim() || undefined,
      chipRack: rackOpen ? chipRack : undefined,
    });
    roster.forEach((id) => addPlayerToSession(session.id, id));
    router.push(`/session/?id=${session.id}`);
  }

  if (!mounted) return <div className="p-6 text-ivory-dim">Cargando…</div>;

  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="font-serif text-2xl text-brass-300">Nueva sesión</h1>

      <div>
        <label className="mb-2 block text-xs text-ivory-dim">Modo</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setMode('real')}
            className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors ${
              mode === 'real'
                ? 'border-brass-500 bg-brass-700 text-ivory'
                : 'border-felt-500 text-ivory-dim hover:border-brass-700 hover:text-ivory'
            }`}
          >
            <Icon name="mode-real" size={18} />
            Dinero real
          </button>
          <button
            onClick={() => setMode('play')}
            className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors ${
              mode === 'play'
                ? 'border-chip-blue bg-chip-blue/30 text-ivory'
                : 'border-felt-500 text-ivory-dim hover:border-brass-700 hover:text-ivory'
            }`}
          >
            <Icon name="mode-play" size={18} />
            Por diversión
          </button>
        </div>
        <p className="mt-1.5 text-xs text-ivory-dim">
          Se bloquea apenas se carga el primer buy-in. Las estadísticas de real y play nunca se mezclan.
        </p>
      </div>

      <div>
        <label className="mb-1 block text-xs text-ivory-dim">Lugar (opcional)</label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Casa de Damián…"
          className="w-full rounded-lg border border-felt-500 bg-felt-900 px-3 py-2 text-ivory placeholder:text-ivory-dim focus:border-brass-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-2 block text-xs text-ivory-dim">Valor de ficha (MXN/ficha)</label>
        <div className="flex flex-wrap gap-2">
          {CHIP_VALUES.map((v) => (
            <button
              key={v}
              onClick={() => setChipValue(v)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-semibold tabular-money transition-colors ${
                chipValue === v
                  ? 'border-brass-500 bg-brass-700 text-ivory'
                  : 'border-felt-500 text-ivory-dim hover:border-brass-700 hover:text-ivory'
              }`}
            >
              {v}
            </button>
          ))}
          <input
            type="number"
            inputMode="decimal"
            min={0.01}
            step={0.01}
            value={chipValue}
            onChange={(e) => setChipValue(parseFloat(e.target.value) || 1)}
            className="w-20 rounded-lg border border-felt-500 bg-felt-900 px-2 py-1.5 text-sm text-ivory tabular-money focus:border-brass-500 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs text-ivory-dim">Rake (dinero que se saca de la mesa)</label>
        <input
          type="number"
          inputMode="decimal"
          min={0}
          value={rake}
          onChange={(e) => setRake(e.target.value)}
          placeholder="0"
          className="w-32 rounded-lg border border-felt-500 bg-felt-900 px-3 py-2 text-ivory tabular-money placeholder:text-ivory-dim focus:border-brass-500 focus:outline-none"
        />
      </div>

      <div>
        <button
          type="button"
          onClick={() => setRackOpen((v) => !v)}
          className="flex w-full items-center gap-2 text-xs font-semibold uppercase tracking-widest text-ivory-dim hover:text-ivory"
        >
          <Icon name="chips" size={16} />
          Fichas en mesa (opcional)
          <span className="ml-auto normal-case tracking-normal text-ivory-dim">{rackOpen ? 'ocultar' : 'mostrar'}</span>
        </button>
        {rackOpen && (
          <div className="mt-3 rounded-xl border border-felt-500 bg-felt-900/50 p-3">
            <p className="mb-2 text-xs text-ivory-dim">
              Solo para referencia — no bloquea buy-ins ni cash-outs.
            </p>
            <ChipCounter value={chipRack} onChange={setChipRack} />
          </div>
        )}
      </div>

      <div>
        <label className="mb-2 block text-xs text-ivory-dim">
          Jugadores iniciales ({roster.size} seleccionados)
        </label>
        {players.length === 0 && (
          <p className="text-sm text-ivory-dim">No hay jugadores. Agregá desde la pantalla Jugadores.</p>
        )}
        <div className="space-y-1">
          {players.map((p) => (
            <button
              key={p.id}
              onClick={() => togglePlayer(p.id)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                roster.has(p.id) ? 'bg-felt-700 border border-brass-700' : 'hover:bg-felt-900'
              }`}
            >
              <Avatar name={p.name} avatar={p.avatar} size="sm" />
              <span className="flex-1 text-left text-ivory">{p.name}</span>
              {roster.has(p.id) && <Icon name="check" size={18} className="text-brass-300" />}
            </button>
          ))}
        </div>
      </div>

      <Button onClick={handleCreate} size="lg" className="w-full">
        Abrir mesa
      </Button>
    </div>
  );
}
