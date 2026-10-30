// Shared (client + server) configuration. Only NEXT_PUBLIC_* values are read here.

export type Cluster = "devnet" | "mainnet";

export const CLUSTER: Cluster =
  process.env.NEXT_PUBLIC_SOLANA_CLUSTER === "mainnet" ? "mainnet" : "devnet";

export const RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ??
  (CLUSTER === "mainnet" ? "https://api.mainnet-beta.solana.com" : "https://api.devnet.solana.com");

// Wallet Standard chain id and x402 CAIP-2 network id for the active cluster.
export const WALLET_CHAIN = CLUSTER === "mainnet" ? "solana:mainnet" : "solana:devnet";
export const X402_NETWORK =
  CLUSTER === "mainnet"
    ? "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp"
    : "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1";

export const USDC_MINT =
  CLUSTER === "mainnet"
    ? "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
    : "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";

export const explorerTx = (sig: string) =>
  `https://explorer.solana.com/tx/${sig}${CLUSTER === "devnet" ? "?cluster=devnet" : ""}`;

// A commit must be registered with the server within this window of its block time.
// Closes the "commit long AND short, register whichever wins" loophole.
export const REGISTRATION_WINDOW_SEC = 600;

export const HORIZONS: { label: string; seconds: number }[] = [
  ...(process.env.NEXT_PUBLIC_DEMO_HORIZONS === "true" ? [{ label: "5 min (demo)", seconds: 300 }] : []),
  { label: "1 hour", seconds: 3600 },
  { label: "24 hours", seconds: 86_400 },
  { label: "7 days", seconds: 604_800 },
  { label: "30 days", seconds: 2_592_000 },
];

export const ASSETS = ["SOL", "BTC", "ETH", "JUP", "JTO", "BONK"] as const;
export type Asset = (typeof ASSETS)[number];
