'use client';

import { PokerChip } from './PokerChip';
import { Icon } from './Icon';
import { CHIP_DENOMINATIONS } from '@/core/models/chips';
import { totalFromChipCounts } from '@/core/logic/chips';
import { formatMXN } from '@/core/logic/currency';
import type { ChipCount } from '@/core/models/domain';
import type { ChipDenomination } from '@/core/models/chips';

interface Props {
  value: ChipCount[];
  onChange: (next: ChipCount[]) => void;
  denominations?: readonly ChipDenomination[];
  presetLabel?: string;
  presetValue?: ChipCount[];
  className?: string;
}

/**
 * Constructor de buy-in por fichas: el host cuenta fichas por denominación,
 * el monto total en MXN se calcula en vivo. No es inventario — no valida
 * contra ningún stock físico.
 */
export function ChipCounter({
  value,
  onChange,
  denominations = CHIP_DENOMINATIONS,
  presetLabel,
  presetValue,
  className = '',
}: Props) {
  const countFor = (v: number) => value.find((c) => c.value === v)?.count ?? 0;

  function setCount(denomValue: number, count: number) {
    const next = count <= 0 ? 0 : count;
    const rest = value.filter((c) => c.value !== denomValue);
    onChange(next > 0 ? [...rest, { value: denomValue, count: next }] : rest);
  }

  const total = totalFromChipCounts(value);

  return (
    <div className={`space-y-2 ${className}`}>
      {denominations.map((d) => {
        const count = countFor(d.value);
        return (
          <div key={d.value} className="flex items-center gap-3 rounded-lg bg-felt-900 px-3 py-2">
            <PokerChip colorToken={d.colorToken} label={d.label} size="sm" />
            <div className="flex flex-1 items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCount(d.value, count - 1)}
                disabled={count <= 0}
                aria-label={`Menos fichas de ${d.label}`}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-felt-500 text-ivory-dim hover:border-brass-700 hover:text-ivory disabled:opacity-30"
              >
                <Icon name="minus" size={14} />
              </button>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={count}
                onChange={(e) => setCount(d.value, parseInt(e.target.value) || 0)}
                className="w-12 rounded-md border border-felt-500 bg-felt-700 px-1 py-1 text-center text-sm tabular-money text-ivory focus:border-brass-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setCount(d.value, count + 1)}
                aria-label={`Más fichas de ${d.label}`}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-felt-500 text-ivory-dim hover:border-brass-700 hover:text-ivory"
              >
                <Icon name="plus" size={14} />
              </button>
            </div>
            <span className="w-20 shrink-0 text-right text-xs tabular-money text-ivory-dim">
              {formatMXN(totalFromChipCounts([{ value: d.value, count }]))}
            </span>
          </div>
        );
      })}

      <div className="flex items-center justify-between border-t border-felt-500 pt-2">
        {presetValue && presetLabel ? (
          <button
            type="button"
            onClick={() => onChange(presetValue)}
            className="text-xs font-semibold text-brass-300 hover:text-brass-500"
          >
            {presetLabel}
          </button>
        ) : (
          <span />
        )}
        <span className="text-sm font-semibold tabular-money text-ivory">
          Total: {formatMXN(total)}
        </span>
      </div>
    </div>
  );
}
