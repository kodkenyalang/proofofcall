"use client";

import { useConnectedWallet } from "@solana/kit-plugin-wallet/react";
import { useClient } from "@solana/react";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import type { AppClient } from "@/app/providers";
import { CLUSTER } from "@/lib/config";
import type { AuroraToken, TopUpQuote, TopUpStatus } from "@/lib/server/aurora";

const input = "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent";
const DONE = new Set(["SUCCESS", "REFUNDED", "FAILED"]);

// "1.5" with 6 decimals -> "1500000", without floating point.
function toBaseUnits(amount: string, decimals: number): string | null {
  const m = amount.trim().match(/^(\d*)(?:\.(\d*))?$/);
  if (!m || (!m[1] && !m[2])) return null;
  const frac = (m[2] ?? "").slice(0, decimals).padEnd(decimals, "0");
  const units = BigInt((m[1] || "0") + frac);
  return units > BigInt(0) ? units.toString() : null;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const body = await res.json();
  if (!res.ok) throw new Error(body.error);
  return body;
};

export function TopUpPanel() {
  const client = useClient<AppClient>();
  const connected = useConnectedWallet(client);
  const tokens = useSWR<AuroraToken[]>(CLUSTER === "mainnet" ? "/api/topup/tokens" : null, fetcher);

  const [assetId, setAssetId] = useState("");
  const [amount, setAmount] = useState("");
  const [refundTo, setRefundTo] = useState("");
  const [quote, setQuote] = useState<TopUpQuote | null>(null);
  const [status, setStatus] = useState<TopUpStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = useMemo(() => tokens.data?.find((t) => t.assetId === assetId), [tokens.data, assetId]);

  // Poll every 8s, as Aurora's rate-limit guidance recommends (5–10s), until a terminal state.
  useEffect(() => {
    if (!quote || (status && DONE.has(status.status))) return;
    const t = setInterval(async () => {
      try {
        const q = new URLSearchParams({ depositAddress: quote.depositAddress });
        if (quote.depositMemo) q.set("depositMemo", quote.depositMemo);
        setStatus(await fetcher(`/api/topup/status?${q}`));
      } catch {}
    }, 8000);
    return () => clearInterval(t);
  }, [quote, status]);

  if (CLUSTER !== "mainnet") {
    return (
      <div className="rounded-xl border border-border bg-surface p-6 text-sm text-muted">
        Aurora Intents has no public testnet, so cross-chain top-ups run only when the app is on mainnet (
        <code className="font-mono">NEXT_PUBLIC_SOLANA_CLUSTER=mainnet</code>). On devnet, get test USDC from{" "}
        <a href="https://faucet.circle.com" target="_blank" className="text-accent underline">faucet.circle.com</a>.
      </div>
    );
  }

  async function getQuote() {
    setError(null);
    if (!connected) return setError("Connect the Solana wallet that should receive USDC.");
    if (!token) return setError("Pick what you're paying with.");
    const units = toBaseUnits(amount, token.decimals);
    if (!units) return setError("Enter an amount.");
    if (!refundTo.trim()) return setError(`Enter your ${token.blockchain} address for refunds.`);
    setBusy(true);
    try {
      const res = await fetch("/api/topup/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originAsset: token.assetId,
          amount: units,
          refundTo: refundTo.trim(),
          recipient: connected.account.address,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      setQuote(body);
      setStatus(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (quote && token) {
    return (
      <div className="space-y-4 rounded-xl border border-border bg-surface p-6">
        <h2 className="font-semibold">
          Send {quote.amountInFormatted} {token.symbol} on {token.blockchain}
        </h2>
        <div className="rounded-md bg-background p-3">
          <p className="text-xs text-muted">Deposit address (one-time)</p>
          <p className="break-all font-mono text-sm">{quote.depositAddress}</p>
          {quote.depositMemo && <p className="mt-1 font-mono text-xs">Memo: {quote.depositMemo}</p>}
        </div>
        <p className="text-sm text-muted">
          You’ll receive about <b className="text-foreground">{quote.amountOutFormatted} USDC</b> on Solana in ~
          {Math.ceil(quote.timeEstimate / 60)} min. Unused or late deposits are refunded to {refundTo}. Quote expires{" "}
          {new Date(quote.deadline).toLocaleTimeString()}.
        </p>
        <p className="font-mono text-sm">
          Status: <span className={status?.status === "SUCCESS" ? "text-hit" : ""}>{status?.status ?? "PENDING_DEPOSIT"}</span>
        </p>
        {status?.swapDetails?.destinationChainTxHashes?.map((h) => (
          <a key={h.hash} href={h.explorerUrl} target="_blank" className="block text-xs text-accent underline">
            Solana settlement ↗
          </a>
        ))}
        <button onClick={() => setQuote(null)} className="text-sm text-muted underline">New top-up</button>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-surface p-6">
      <label className="block space-y-1 text-sm">
        <span className="text-muted">Pay with</span>
        <select className={input} value={assetId} onChange={(e) => setAssetId(e.target.value)}>
          <option value="">{tokens.isLoading ? "Loading routes…" : "Choose chain & token"}</option>
          {tokens.data?.map((t) => (
            <option key={t.assetId} value={t.assetId}>
              {t.symbol} on {t.blockchain}
            </option>
          ))}
        </select>
      </label>
      <label className="block space-y-1 text-sm">
        <span className="text-muted">Amount {token ? `(${token.symbol})` : ""}</span>
        <input className={input} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Recommended minimum: $1" />
      </label>
      <label className="block space-y-1 text-sm">
        <span className="text-muted">Your {token?.blockchain ?? "origin-chain"} address (for refunds)</span>
        <input className={`${input} font-mono`} value={refundTo} onChange={(e) => setRefundTo(e.target.value)} />
      </label>
      {(error || tokens.error) && (
        <p className="rounded-md bg-miss/10 p-3 text-sm text-miss">{error ?? (tokens.error as Error).message}</p>
      )}
      <button
        onClick={getQuote}
        disabled={busy}
        className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
      >
        {busy ? "Quoting…" : "Get deposit address"}
      </button>
    </div>
  );
}
