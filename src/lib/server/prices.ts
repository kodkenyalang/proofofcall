import "server-only";
import type { Asset } from "../config";

// Price at a point in time from Coinbase Exchange public 1-minute candles.
// Rule (published on every call page): use the OPEN of the first full minute
// at or after the timestamp, so a caller can never benefit from their own timestamp.
// Pyth Hermes now requires an API key; swap this module for Pyth once one is configured.

type Candle = [time: number, low: number, high: number, open: number, close: number, volume: number];

export async function priceAt(asset: Asset, unixSec: number): Promise<number> {
  const minute = Math.ceil(unixSec / 60) * 60;
  if (minute > Date.now() / 1000) throw new Error(`${asset} price for this minute is not available yet`);
  const url = new URL(`https://api.exchange.coinbase.com/products/${asset}-USD/candles`);
  url.searchParams.set("granularity", "60");
  url.searchParams.set("start", new Date(minute * 1000).toISOString());
  url.searchParams.set("end", new Date((minute + 300) * 1000).toISOString());

  const res = await fetch(url, { headers: { "User-Agent": "proof-of-call" }, cache: "no-store" });
  if (!res.ok) throw new Error(`Price lookup failed for ${asset}: HTTP ${res.status}`);
  const candles = (await res.json()) as Candle[];

  // Candles arrive newest-first and minutes with no trades are omitted.
  const first = candles.filter((c) => c[0] >= minute).sort((a, b) => a[0] - b[0])[0];
  if (!first) throw new Error(`No ${asset} price available yet for ${new Date(minute * 1000).toISOString()}`);
  return first[3];
}
