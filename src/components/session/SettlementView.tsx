'use client';

import { Avatar } from '@/components/ui/Avatar';
import { Money } from '@/components/ui/Money';
import type { Payment } from '@/core/logic/settlement';
import type { Player } from '@/core/models/domain';

interface Props {
  payments: Payment[];
  players: Player[];
  currency?: string;
}

export function SettlementView({ payments, players, currency = 'USD' }: Props) {
  const byId = new Map(players.map((p) => [p.id, p]));

  if (payments.length === 0) {
    return (
      <div className="py-6 text-center text-ivory-dim">
        ¡Todos quedaron mano a mano! No hay transferencias.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {payments.map((pay, i) => {
        const from = byId.get(pay.fromPlayerId);
        const to = byId.get(pay.toPlayerId);
        return (
          <div
            key={i}
            className="flex items-center gap-3 rounded-xl border border-felt-500 bg-felt-900 px-4 py-3"
          >
            <Avatar name={from?.name ?? 'Jugador borrado'} avatar={from?.avatar} size="sm" />
            <span className="text-sm text-ivory-dim">le paga a</span>
            <Avatar name={to?.name ?? 'Jugador borrado'} avatar={to?.avatar} size="sm" />
            <div className="ml-auto">
              <Money amount={pay.amount} currency={currency} className="font-semibold" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
