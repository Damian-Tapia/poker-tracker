'use client';

import { useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Money } from '@/components/ui/Money';
import { SeatActionsDialog } from './SeatActionsDialog';
import type { Player, Session } from '@/core/models/domain';
import type { PlayerSessionSummary } from '@/core/logic/session-math';

interface Seat {
  sessionPlayer: { id: string; playerId: string; seat?: number; joinedAt: number };
  player: Player | undefined;
}

interface Props {
  seats: Seat[];
  summaries: PlayerSessionSummary[];
  session: Session;
}

export function SeatTable({ seats, summaries, session }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const byPlayer = new Map(summaries.map((s) => [s.playerId, s]));
  const selectedSeat = seats.find((s) => s.sessionPlayer.playerId === selected);

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-felt-500 text-xs text-ivory-dim">
              <th className="py-2 text-left">Jugador</th>
              <th className="py-2 text-right">Invertido</th>
              <th className="py-2 text-right">Salida</th>
              <th className="py-2 text-right">Net</th>
            </tr>
          </thead>
          <tbody>
            {seats.map((seat) => {
              const player = seat.player;
              const summary = byPlayer.get(seat.sessionPlayer.playerId);
              const hasCashout = (summary?.cashoutMoney ?? 0) > 0;
              return (
                <tr
                  key={seat.sessionPlayer.id}
                  className="border-b border-felt-900 hover:bg-felt-900 cursor-pointer transition-colors"
                  onClick={() => session.status === 'open' && setSelected(seat.sessionPlayer.playerId)}
                >
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={player?.name ?? 'Jugador borrado'} avatar={player?.avatar} size="sm" />
                      <span className="text-ivory">{player?.name ?? 'Jugador borrado'}</span>
                    </div>
                  </td>
                  <td className="py-3 text-right">
                    <Money amount={summary?.buyInMoney ?? 0} />
                  </td>
                  <td className="py-3 text-right">
                    {hasCashout
                      ? <Money amount={summary!.cashoutMoney} />
                      : <span className="text-ivory-dim">—</span>}
                  </td>
                  <td className="py-3 text-right">
                    {hasCashout
                      ? <Money amount={summary!.net} showSign />
                      : <span className="text-ivory-dim">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedSeat?.player && (
        <SeatActionsDialog
          open={!!selected}
          onClose={() => setSelected(null)}
          sessionId={session.id}
          player={selectedSeat.player}
          summary={byPlayer.get(selectedSeat.sessionPlayer.playerId)}
        />
      )}
    </>
  );
}
