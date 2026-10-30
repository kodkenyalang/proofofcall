"use client";

import { createSolanaRpc, signature } from "@solana/kit";
import { useState } from "react";
import { type CallContent, commitmentHash, commitmentMemo } from "@/lib/commitment";
import { explorerTx, RPC_URL } from "@/lib/config";
import type { PublicCall } from "@/lib/types";

type Check = { label: string; ok: boolean; detail?: string };

// Re-derives everything in the reader's browser, straight from the chain.
// The server is not trusted for any of these checks.
export function VerifyPanel({ call }: { call: PublicCall }) {
  const [checks, setChecks] = useState<Check[] | null>(null);
  const [busy, setBusy] = useState(false);

  async function verify() {
    if (!call.direction || !call.thesis || !call.salt) return;
    setBusy(true);
    const out: Check[] = [];
    try {
      const content: CallContent = {
        caller: call.caller,
        asset: call.asset,
        direction: call.direction,
        horizonSec: call.horizonSec,
        targetBps: call.targetBps,
        priceCents: call.priceCents,
        thesis: call.thesis,
        salt: call.salt,
      };
      const hash = await commitmentHash(content);
      out.push({ label: "Revealed call hashes to the committed hash", ok: hash === call.commitHash, detail: hash });

      const tx = await createSolanaRpc(RPC_URL)
        .getTransaction(signature(call.commitSig), {
          commitment: "confirmed",
          encoding: "jsonParsed",
          maxSupportedTransactionVersion: 1,
        })
        .send();
      const keys = (tx?.transaction.message.accountKeys ?? []) as unknown as { pubkey: string; signer: boolean }[];
      const ixs = (tx?.transaction.message.instructions ?? []) as unknown as { program?: string; parsed?: unknown }[];
      out.push({ label: "Commit transaction succeeded on chain", ok: !!tx && !tx.meta?.err });
      out.push({ label: "Signed by the caller's wallet", ok: keys.some((k) => k.pubkey === call.caller && k.signer) });
      out.push({
        label: "Memo carries this hash",
        ok: ixs.some((ix) => ix.program === "spl-memo" && ix.parsed === commitmentMemo(hash)),
      });
      out.push({
        label: "Committed before the scored window",
        ok: tx?.blockTime != null && Number(tx.blockTime) === call.committedAt,
        detail: tx?.blockTime != null ? new Date(Number(tx.blockTime) * 1000).toISOString() : undefined,
      });
    } catch (e) {
      out.push({ label: "Verification error", ok: false, detail: (e as Error).message });
    }
    setChecks(out);
    setBusy(false);
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Audit this call</h3>
        <a href={explorerTx(call.commitSig)} target="_blank" className="text-xs text-accent underline">
          Commit tx ↗
        </a>
      </div>
      <dl className="grid grid-cols-[6rem_1fr] gap-y-1 text-xs">
        <dt className="text-muted">Hash</dt>
        <dd className="break-all font-mono">{call.commitHash}</dd>
        <dt className="text-muted">Salt</dt>
        <dd className="break-all font-mono">{call.salt ?? "published at reveal"}</dd>
      </dl>
      {call.revealed ? (
        <button
          onClick={verify}
          disabled={busy}
          className="rounded-md border border-border px-4 py-2 text-sm hover:bg-background disabled:opacity-60"
        >
          {busy ? "Checking chain…" : "Verify in my browser"}
        </button>
      ) : (
        <p className="text-xs text-muted">Full verification unlocks when the call becomes public and the salt is released.</p>
      )}
      {checks && (
        <ul className="space-y-1.5 text-sm">
          {checks.map((c) => (
            <li key={c.label} className="flex gap-2">
              <span className={c.ok ? "text-hit" : "text-miss"}>{c.ok ? "✓" : "✗"}</span>
              <span>
                {c.label}
                {c.detail && <span className="block break-all font-mono text-[11px] text-muted">{c.detail}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
