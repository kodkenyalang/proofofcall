import { isAddress } from "@solana/kit";
import { NextResponse } from "next/server";
import { z } from "zod";
import { commitmentHash } from "@/lib/commitment";
import { ASSETS, HORIZONS, REGISTRATION_WINDOW_SEC } from "@/lib/config";
import { allPublicCalls, toPublic } from "@/lib/server/calls";
import { insertCall } from "@/lib/server/store";
import { verifyCommitTx } from "@/lib/server/verify";

export async function GET() {
  return NextResponse.json(await allPublicCalls());
}

const Body = z.object({
  content: z.object({
    caller: z.string().refine(isAddress, "invalid caller address"),
    asset: z.enum(ASSETS),
    direction: z.enum(["long", "short"]),
    horizonSec: z.number().int().refine((s) => HORIZONS.some((h) => h.seconds === s), "unsupported horizon"),
    targetBps: z.number().int().min(1).max(100_000).nullable(),
    priceCents: z.number().int().min(1).max(10_000),
    thesis: z.string().trim().min(1).max(2_000),
    salt: z.string().regex(/^[0-9a-f]{64}$/),
  }),
  signature: z.string().min(64).max(100),
});

// Register a call whose commitment memo is already on chain.
// The server never trusts the client's clock or price: commit time is the block time,
// and the entry price is looked up from that time once the market has printed it.
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  const { content, signature } = parsed.data;

  try {
    const hash = await commitmentHash(content);
    const committedAt = await verifyCommitTx(signature, content.caller, hash);
    if (Date.now() / 1000 - committedAt > REGISTRATION_WINDOW_SEC) {
      throw new Error("Commit is too old to register; calls must be registered within 10 minutes");
    }
    const record = await insertCall({
      ...content,
      id: hash.slice(0, 16),
      commitHash: hash,
      commitSig: signature,
      committedAt,
      revealAt: committedAt + content.horizonSec,
      entryPrice: null,
      outcome: null,
      unlocks: 0,
      createdAt: Math.floor(Date.now() / 1000),
    });
    return NextResponse.json(toPublic(record), { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 422 });
  }
}
