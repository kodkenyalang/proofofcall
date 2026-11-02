// Fetch an x402-protected URL without paying, decode the 402 challenge and check it against the
// cluster this shell is configured for: CAIP-2 network, USDC mint, and a facilitator fee payer.
// Usage: NEXT_PUBLIC_SOLANA_CLUSTER=mainnet node scripts/x402-challenge.ts <unlock url> [payTo] [amount]
// Nothing is signed or paid. Exits non-zero on any mismatch.
import { CLUSTER, USDC_MINT, X402_NETWORK } from "../src/lib/config.ts";

const [url, payTo, amount] = process.argv.slice(2);
if (!url) {
  console.error("usage: node scripts/x402-challenge.ts <unlock url> [expected payTo] [expected amount]");
  process.exit(2);
}

const res = await fetch(url);
const header = res.headers.get("payment-required");
console.log(`GET ${url} -> HTTP ${res.status}`);
if (res.status !== 402 || !header) {
  console.log(await res.text());
  throw new Error("expected an HTTP 402 with a PAYMENT-REQUIRED header");
}

type Accept = { scheme: string; network: string; asset: string; amount: string; payTo: string; extra?: { feePayer?: string } };
const challenge = JSON.parse(Buffer.from(header, "base64").toString()) as { x402Version: number; accepts: Accept[] };
console.log(JSON.stringify(challenge, null, 2));

const accept = challenge.accepts.find((a) => a.network === X402_NETWORK);
const checks: [string, boolean][] = [
  [`offers ${CLUSTER} (${X402_NETWORK})`, !!accept],
  [`asset is ${CLUSTER} USDC (${USDC_MINT})`, accept?.asset === USDC_MINT],
  ["a facilitator fee payer is named, so the reader needs no SOL", !!accept?.extra?.feePayer],
  ...(payTo ? ([[`pays the caller ${payTo}`, accept?.payTo === payTo]] as [string, boolean][]) : []),
  ...(amount ? ([[`amount is ${amount} base units`, accept?.amount === amount]] as [string, boolean][]) : []),
];
for (const [label, ok] of checks) console.log(`${ok ? "✓" : "✗"} ${label}`);
if (checks.some(([, ok]) => !ok)) process.exit(1);
console.log(`OK: fee payer ${accept!.extra!.feePayer}`);
