"use client";

import { useConnectedWallet } from "@solana/kit-plugin-wallet/react";
import { useClient } from "@solana/react";
import { useEffect, useState } from "react";
import type { AppClient } from "@/app/providers";
import { useUsdcBalance } from "@/lib/client/useUsdcBalance";
import { unlockCall } from "@/lib/client/x402";
import { CLUSTER } from "@/lib/config";
import { fmtCountdown, fmtUsdCents } from "@/lib/format";
import type { PublicCall } from "@/lib/types";

const cacheKey = (id: string, who: string) => `poc:unlock:${id}:${who}`;

function readCache(key: string): PublicCall | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as PublicCall) : null;
  } catch {
    return null;
  }
}

export function UnlockPanel({ call }: { call: PublicCall }) {
  const client = useClient<AppClient>();
  const connected = useConnectedWallet(client);
  const usdc = useUsdcBalance(connected?.account.address);
  const [purchased, setPurchased] = useState<Record<string, PublicCall>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // A purchase made earlier on this device (the payment itself is on chain).
  const key = connected ? cacheKey(call.id, connected.account.address) : null;
  const unlocked = key ? (purchased[key] ?? readCache(key)) : null;

  const isOwner = connected?.account.address === call.caller;
  const price = call.priceCents / 100;
  const short = usdc.data != null && usdc.data < price;

  async function unlock() {
    if (!connected?.signer) return;
    setBusy(true);
    setError(null);
    try {
      const result = await unlockCall(call.id, connected.signer);
      const k = cacheKey(call.id, connected.account.address);
      setPurchased((p) => ({ ...p, [k]: result }));
      try {
        localStorage.setItem(k, JSON.stringify(result));
      } catch {}
      usdc.mutate();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (unlocked?.direction) {
    return (
      <div className="space-y-3 rounded-xl border border-sealed/40 bg-surface p-5">
        <p className="font-mono text-xs tracking-wider text-sealed">UNLOCKED · LIVE CALL</p>
        <p className="text-2xl font-semibold">
          <span className={unlocked.direction === "long" ? "text-hit" : "text-miss"}>{unlocked.direction.toUpperCase()}</span>{" "}
          {unlocked.asset}
          {unlocked.targetBps ? <span className="text-base text-muted"> · target {(unlocked.targetBps / 100).toFixed(1)}%</span> : null}
        </p>
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{unlocked.thesis}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-surface p-5">
      <div className="flex items-baseline justify-between">
        <p className="font-mono text-xs tracking-wider text-sealed">SEALED</p>
        <p className="tabular text-sm text-muted">public in {fmtCountdown(call.revealAt, now)}</p>
      </div>
      <p className="text-sm text-muted">
        Direction, target and thesis are hidden but already fixed on chain. Pay {fmtUsdCents(call.priceCents)} USDC to
        read it now. The payment goes straight to the caller’s wallet via x402.
      </p>
      {isOwner ? (
        <p className="text-sm text-muted">This is your call.</p>
      ) : !connected ? (
        <p className="text-sm">Connect a wallet to unlock.</p>
      ) : (
        <>
          <button
            onClick={unlock}
            disabled={busy || short}
            className="rounded-md bg-sealed px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {busy ? "Paying…" : `Unlock for ${fmtUsdCents(call.priceCents)}`}
          </button>
          {short && (
            <p className="text-sm text-muted">
              You have {usdc.data!.toFixed(2)} USDC.{" "}
              {CLUSTER === "mainnet" ? (
                <a href="/topup" className="text-accent underline">Top up from any chain</a>
              ) : (
                <a href="https://faucet.circle.com" target="_blank" className="text-accent underline">Get devnet USDC</a>
              )}
            </p>
          )}
        </>
      )}
      {error && <p className="rounded-md bg-miss/10 p-3 text-sm text-miss">{error}</p>}
    </div>
  );
}
