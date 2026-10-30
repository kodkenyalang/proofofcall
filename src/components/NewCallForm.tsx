"use client";

import { getAddMemoInstruction } from "@solana-program/memo";
import { useConnectedWallet } from "@solana/kit-plugin-wallet/react";
import { useClient } from "@solana/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AppClient } from "@/app/providers";
import { sendWithWallet } from "@/lib/client/send";
import {
  type CallContent,
  commitmentHash,
  commitmentMemo,
  type Direction,
  randomSalt,
} from "@/lib/commitment";
import { ASSETS, type Asset, CLUSTER, explorerTx, HORIZONS } from "@/lib/config";

type Pending = { content: CallContent; hash: string; signature?: string };
type Step = "edit" | "review" | "signing" | "registering" | "failed";

const input = "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent";

export function NewCallForm() {
  const client = useClient<AppClient>();
  const connected = useConnectedWallet(client);
  const router = useRouter();

  const [asset, setAsset] = useState<Asset>("SOL");
  const [direction, setDirection] = useState<Direction>("long");
  const [horizonSec, setHorizonSec] = useState(HORIZONS[0].seconds);
  const [targetPct, setTargetPct] = useState("");
  const [price, setPrice] = useState("0.25");
  const [thesis, setThesis] = useState("");

  const [step, setStep] = useState<Step>("edit");
  const [pending, setPending] = useState<Pending | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function review() {
    setError(null);
    if (!connected) return setError("Connect a wallet first.");
    const priceCents = Math.round(Number(price) * 100);
    if (!(priceCents >= 1 && priceCents <= 10_000)) return setError("Unlock price must be between $0.01 and $100.");
    if (!thesis.trim()) return setError("Write a short thesis — it's what readers pay for.");
    const target = targetPct.trim() ? Math.round(Number(targetPct) * 100) : null;
    if (target != null && !(target > 0)) return setError("Target must be a positive percentage.");

    const content: CallContent = {
      caller: connected.account.address,
      asset,
      direction,
      horizonSec,
      targetBps: target,
      priceCents,
      thesis: thesis.trim(),
      salt: randomSalt(),
    };
    setPending({ content, hash: await commitmentHash(content) });
    setStep("review");
  }

  async function register(p: Pending) {
    setStep("registering");
    const res = await fetch("/api/calls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: p.content, signature: p.signature }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error ?? "Registration failed");
    router.push(`/c/${body.id}`);
  }

  async function commit() {
    if (!pending) return;
    setError(null);
    try {
      let p = pending;
      if (!p.signature) {
        setStep("signing");
        const memo = commitmentMemo(p.hash);
        const signature = await sendWithWallet(client, (signer) => [
          getAddMemoInstruction({ memo, signers: [signer] }),
        ]);
        p = { ...p, signature };
        setPending(p); // keep it: if registration fails we retry without re-signing
      }
      await register(p);
    } catch (e) {
      setError((e as Error).message);
      setStep("failed");
    }
  }

  if (step !== "edit" && pending) {
    const busy = step === "signing" || step === "registering";
    return (
      <div className="space-y-5 rounded-xl border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold">Review commitment</h2>
        <p className="text-sm text-muted">
          Your wallet will sign one Memo transaction on <b>{CLUSTER}</b>. Only the hash goes on chain. Direction,
          target and thesis stay sealed until the horizon ends, or until a reader pays to unlock.
        </p>
        <dl className="grid grid-cols-[8rem_1fr] gap-y-2 text-sm">
          <dt className="text-muted">Fee payer</dt>
          <dd className="break-all font-mono text-xs">{pending.content.caller}</dd>
          <dt className="text-muted">Program</dt>
          <dd>SPL Memo (no funds move)</dd>
          <dt className="text-muted">Memo</dt>
          <dd className="break-all font-mono text-xs">{commitmentMemo(pending.hash)}</dd>
          <dt className="text-muted">Public now</dt>
          <dd>
            {pending.content.asset} · {HORIZONS.find((h) => h.seconds === pending.content.horizonSec)?.label} · unlock $
            {(pending.content.priceCents / 100).toFixed(2)}
          </dd>
          <dt className="text-muted">Sealed</dt>
          <dd>
            {pending.content.direction.toUpperCase()}
            {pending.content.targetBps ? ` · target ${(pending.content.targetBps / 100).toFixed(1)}%` : ""} · thesis
          </dd>
        </dl>
        {pending.signature && (
          <a className="block text-xs text-accent underline" href={explorerTx(pending.signature)} target="_blank">
            Commit transaction ↗
          </a>
        )}
        {error && <p className="rounded-md bg-miss/10 p-3 text-sm text-miss">{error}</p>}
        <div className="flex gap-3">
          <button
            onClick={commit}
            disabled={busy}
            className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
          >
            {step === "signing"
              ? "Waiting for wallet…"
              : step === "registering"
                ? "Verifying on chain…"
                : pending.signature
                  ? "Retry registration"
                  : "Sign & commit"}
          </button>
          {!pending.signature && (
            <button onClick={() => setStep("edit")} disabled={busy} className="px-4 py-2 text-sm text-muted">
              Edit
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 rounded-xl border border-border bg-surface p-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="space-y-1 text-sm">
          <span className="text-muted">Asset</span>
          <select className={input} value={asset} onChange={(e) => setAsset(e.target.value as Asset)}>
            {ASSETS.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </label>
        <div className="space-y-1 text-sm">
          <span className="text-muted">Direction (sealed)</span>
          <div className="grid grid-cols-2 gap-1 rounded-md border border-border p-1">
            {(["long", "short"] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDirection(d)}
                className={`rounded px-2 py-1.5 text-sm capitalize ${direction === d ? (d === "long" ? "bg-hit text-white" : "bg-miss text-white") : "text-muted"}`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
        <label className="space-y-1 text-sm">
          <span className="text-muted">Horizon</span>
          <select className={input} value={horizonSec} onChange={(e) => setHorizonSec(Number(e.target.value))}>
            {HORIZONS.map((h) => (
              <option key={h.seconds} value={h.seconds}>
                {h.label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted">Target move % (optional, sealed)</span>
          <input className={input} inputMode="decimal" placeholder="e.g. 8" value={targetPct} onChange={(e) => setTargetPct(e.target.value)} />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted">Unlock price (USDC)</span>
          <input className={input} inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
        </label>
      </div>
      <label className="block space-y-1 text-sm">
        <span className="text-muted">Thesis (sealed)</span>
        <textarea
          className={`${input} min-h-32`}
          maxLength={2000}
          placeholder="What do you see that the market doesn't? What would make you wrong?"
          value={thesis}
          onChange={(e) => setThesis(e.target.value)}
        />
      </label>
      {error && <p className="rounded-md bg-miss/10 p-3 text-sm text-miss">{error}</p>}
      <button
        onClick={review}
        className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
      >
        Review commitment
      </button>
    </div>
  );
}
