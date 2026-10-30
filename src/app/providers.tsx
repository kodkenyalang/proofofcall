"use client";

import { createClient } from "@solana/kit";
import { solanaRpc } from "@solana/kit-plugin-rpc";
import { walletSigner } from "@solana/kit-plugin-wallet";
import { ClientProvider } from "@solana/react";
import type { ReactNode } from "react";
import { RPC_URL, WALLET_CHAIN } from "@/lib/config";

// One client for the whole app. The connected wallet fills payer + identity.
// v1 by default; lib/client/send.ts falls back to v0 for wallets that cannot sign v1.
export const client = createClient()
  .use(walletSigner({ chain: WALLET_CHAIN }))
  .use(solanaRpc({ rpcUrl: RPC_URL, transactionConfig: { version: 1 } }));

export type AppClient = Awaited<typeof client>;

export function Providers({ children }: { children: ReactNode }) {
  return <ClientProvider client={client}>{children}</ClientProvider>;
}
