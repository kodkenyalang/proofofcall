import { isAddress } from "@solana/kit";
import { NextResponse } from "next/server";
import { z } from "zod";
import { CLUSTER } from "@/lib/config";
import { quoteTopUp } from "@/lib/server/aurora";

const Body = z.object({
  originAsset: z.string().min(1),
  amount: z.string().regex(/^\d+$/),
  refundTo: z.string().min(1),
  recipient: z.string().refine(isAddress, "recipient must be a Solana address"),
});

export async function POST(req: Request) {
  if (CLUSTER !== "mainnet") {
    return NextResponse.json({ error: "Aurora Intents is mainnet-only" }, { status: 400 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  try {
    return NextResponse.json(await quoteTopUp(parsed.data));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
