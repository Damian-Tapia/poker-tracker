// core/logic/currency.ts
// Toda la app es MXN. Único helper de formateo, reutilizado en toda la UI.

const MXN_FORMATTER = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

export function formatMXN(amount: number): string {
  return MXN_FORMATTER.format(amount);
}
