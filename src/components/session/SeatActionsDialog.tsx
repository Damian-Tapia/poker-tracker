'use client';

import { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Money } from '@/components/ui/Money';
import { ChipCounter } from '@/components/ui/ChipCounter';
import { buyIn, rebuy, cashout } from '@/core/store/poker-store';
import { totalFromChipCounts, totalChipPieces } from '@/core/logic/chips';
import { STANDARD_BUYIN_PRESET } from '@/core/models/chips';
import type { Player, ChipCount } from '@/core/models/domain';
import type { PlayerSessionSummary } from '@/core/logic/session-math';

type Action = 'buy-in' | 'rebuy' | 'cashout';

interface Props {
  open: boolean;
  onClose: () => void;
  sessionId: string;
  player: Player;
  summary: PlayerSessionSummary | undefined;
}

export function SeatActionsDialog({
  open,
  onClose,
  sessionId,
  player,
  summary,
}: Props) {
  const [action, setAction] = useState<Action>('rebuy');
  const [buyInChips, setBuyInChips] = useState<ChipCount[]>([]);
  const [cashoutChips, setCashoutChips] = useState<ChipCount[]>([]);

  const buyInMoney = totalFromChipCounts(buyInChips);
  const buyInPieces = totalChipPieces(buyInChips);
  const cashoutMoney = totalFromChipCounts(cashoutChips);
  const cashoutPieces = totalChipPieces(cashoutChips);
  const hasBoughtIn = (summary?.buyInChips ?? 0) > 0;

  function handleSubmit() {
    if (action === 'cashout') {
      if (cashoutPieces <= 0) return;
      cashout(sessionId, player.id, cashoutMoney, cashoutPieces);
      setCashoutChips([]);
    } else {
      if (buyInPieces <= 0) return;
      if (action === 'buy-in') buyIn(sessionId, player.id, buyInMoney, buyInPieces);
      else rebuy(sessionId, player.id, buyInMoney, buyInPieces);
      setBuyInChips([]);
    }
    onClose();
  }

  const canSubmit = action === 'cashout' ? cashoutPieces > 0 : buyInPieces > 0;

  return (
    <Dialog open={open} onClose={onClose} title={player.name}>
      <div className="mb-1 flex items-center gap-3">
        <Avatar name={player.name} avatar={player.avatar} />
        {summary && (
          <div className="text-sm text-ivory-dim">
            Stack: <span className="text-ivory font-semibold">{summary.buyInChips - summary.cashoutChips}</span> fichas
            {' · '}
            <Money amount={summary.net} showSign />
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-2 rounded-lg bg-felt-900 p-1">
        {(!hasBoughtIn ? ['buy-in'] : ['rebuy', 'cashout']).map((a) => (
          <button
            key={a}
            onClick={() => setAction(a as Action)}
            className={`flex-1 rounded-md py-1.5 text-sm font-semibold transition-colors ${
              action === a ? 'bg-brass-700 text-ivory' : 'text-ivory-dim hover:text-ivory'
            }`}
          >
            {a === 'buy-in' ? 'Buy-in' : a === 'rebuy' ? 'Rebuy' : 'Cash-out'}
          </button>
        ))}
      </div>

      {action === 'cashout' ? (
        <div className="mt-4">
          <label className="mb-2 block text-xs text-ivory-dim">Contá las fichas que devuelve</label>
          <ChipCounter value={cashoutChips} onChange={setCashoutChips} />
        </div>
      ) : (
        <div className="mt-4">
          <label className="mb-2 block text-xs text-ivory-dim">Contá las fichas por denominación</label>
          <ChipCounter
            value={buyInChips}
            onChange={setBuyInChips}
            presetLabel="Buy-in estándar"
            presetValue={[...STANDARD_BUYIN_PRESET]}
          />
        </div>
      )}

      <div className="mt-5 flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSubmit} disabled={!canSubmit}>
          {action === 'buy-in' ? 'Buy-in' : action === 'rebuy' ? 'Rebuy' : 'Cash-out'}
        </Button>
      </div>
    </Dialog>
  );
}
