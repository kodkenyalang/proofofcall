"use client";

import {
  useConnect,
  useConnectedWallet,
  useDisconnect,
  useWallets,
  WalletReadyGate,
} from "@solana/kit-plugin-wallet/react";
import { useClient } from "@solana/react";
import { useState } from "react";
import type { AppClient } from "@/app/providers";
import { useUsdcBalance } from "@/lib/client/useUsdcBalance";
import { shortAddr } from "@/lib/format";

function Inner() {
  const client = useClient<AppClient>();
  const wallets = useWallets(client);
  const connected = useConnectedWallet(client);
  const { dispatch: connect, isRunning } = useConnect(client);
  const { dispatch: disconnect } = useDisconnect(client);
  const [open, setOpen] = useState(false);
  const usdc = useUsdcBalance(connected?.account.address);

  if (connected) {
    return (
      <div className="flex items-center gap-2">
        <span className="tabular hidden font-mono text-xs text-muted sm:inline">
          {usdc.data == null ? "– USDC" : `${usdc.data.toFixed(2)} USDC`}
        </span>
        <button
          onClick={() => disconnect()}
          title="Disconnect"
          className="rounded-md border border-border px-3 py-1.5 font-mono text-xs hover:bg-background"
        >
          {shortAddr(connected.account.address)}
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={isRunning}
        className="rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background disabled:opacity-60"
      >
        {isRunning ? "Connecting…" : "Connect wallet"}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-lg border border-border bg-surface p-1 shadow-lg">
          {wallets.length === 0 && (
            <p className="p-3 text-xs text-muted">No Solana wallet found. Install Phantom, Solflare or Backpack.</p>
          )}
          {wallets.map((w) => (
            <button
              key={w.name}
              onClick={() => {
                setOpen(false);
                connect(w);
              }}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-background"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- wallet icons are data: URIs */}
              {w.icon && <img src={w.icon} alt="" className="h-5 w-5" />}
              {w.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function WalletButton() {
  const client = useClient<AppClient>();
  return (
    <WalletReadyGate client={client} fallback={<span className="text-xs text-muted">…</span>}>
      <Inner />
    </WalletReadyGate>
  );
}
