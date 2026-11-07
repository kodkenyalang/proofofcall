// "1.5" with 6 decimals -> "1500000", without floating point. Digits past the token's
// precision are dropped (never rounded up), so a user is never asked to send more than they typed.
// Returns null for anything that isn't a plain positive decimal.
export function toBaseUnits(amount: string, decimals: number): string | null {
  const m = amount.trim().match(/^(\d*)(?:\.(\d*))?$/);
  if (!m || (!m[1] && !m[2])) return null;
  const frac = (m[2] ?? "").slice(0, decimals).padEnd(decimals, "0");
  const units = BigInt((m[1] || "0") + frac);
  return units > BigInt(0) ? units.toString() : null;
}
