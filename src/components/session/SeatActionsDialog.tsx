'use client';

import { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Avatar } from '@/components/ui/Avatar';
import { Money } from '@/components/ui/Money';
import { buyIn, rebuy, cashout } from '@/core/store/poker-store';
import { moneyForChips } from '@/core/logic/session-math';
import type { Player } from '@/core/models/domain';
import type { PlayerSessionSummary } from '@/core/logic/session-math';

type Action = 'buy-in' | 'rebuy' | 'cashout';

const QUICK_CHIPS = [50, 100, 200, 300, 500];

interface Props {
  open: boolean;
  onClose: () => void;
  sessionId: string;
  player: Player;
  summary: PlayerSessionSummary | undefined;
  chipValue: number;
  currency: string;
}

export function SeatActionsDialog({
  open,
  onClose,
  sessionId,
  player,
  summary,
  chipValue,
  currency,
}: Props) {
  const [action, setAction] = useState<Action>('rebuy');
  const [chips, setChips] = useState('');

  const chipsNum = parseInt(chips) || 0;
  const money = moneyForChips(chipsNum, chipValue);
  const hasBoughtIn = (summary?.buyInChips ?? 0) > 0;

  function handleSubmit() {
    if (chipsNum <= 0) return;
    if (action === 'buy-in') buyIn(sessionId, player.id, money, chipsNum);
    else if (action === 'rebuy') rebuy(sessionId, player.id, money, chipsNum);
    else cashout(sessionId, player.id, chipsNum);
    setChips('');
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} title={player.name}>
      <div className="mb-1 flex items-center gap-3">
        <Avatar name={player.name} avatar={player.avatar} />
        {summary && (
          <div className="text-sm text-ivory-dim">
            Stack: <span className="text-ivory font-semibold">{summary.buyInChips - summary.cashoutChips}</span> fichas
            {' · '}
            <Money amount={summary.net} currency={currency} showSign />
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

      <div className="mt-4">
        <label className="mb-2 block text-xs text-ivory-dim">Fichas rápidas</label>
        <div className="flex flex-wrap gap-2">
          {QUICK_CHIPS.map((q) => (
            <Chip
              key={q}
              label={q}
              active={chipsNum === q}
              onClick={() => setChips(chipsNum === q ? '' : String(q))}
            />
          ))}
        </div>
      </div>

      <div className="mt-3">
        <label className="mb-1 block text-xs text-ivory-dim">Fichas (manual)</label>
        <input
          type="number"
          inputMode="numeric"
          min={1}
          value={chips}
          onChange={(e) => setChips(e.target.value)}
          placeholder="0"
          className="w-full rounded-lg border border-felt-500 bg-felt-900 px-3 py-2 text-ivory tabular-money placeholder:text-ivory-dim focus:border-brass-500 focus:outline-none"
        />
        {chipsNum > 0 && action !== 'cashout' && (
          <p className="mt-1 text-xs text-ivory-dim">
            = <Money amount={money} currency={currency} />
          </p>
        )}
      </div>

      <div className="mt-5 flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSubmit} disabled={chipsNum <= 0}>
          {action === 'buy-in' ? 'Buy-in' : action === 'rebuy' ? 'Rebuy' : 'Cash-out'}
        </Button>
      </div>
    </Dialog>
  );
}
