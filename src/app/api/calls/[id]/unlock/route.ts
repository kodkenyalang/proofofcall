import { withX402 } from "@x402/next";
import { type NextRequest, NextResponse } from "next/server";
import { X402_NETWORK } from "@/lib/config";
import { toPublic } from "@/lib/server/calls";
import { getCall, incrementUnlocks } from "@/lib/server/store";
import { x402Server } from "@/lib/server/x402";

// GET /api/calls/:id/unlock: pay-per-call access to a live (sealed) call over x402.
// Price and payee are per call: the reader pays the caller's wallet directly, in USDC.
// Missing and already-public calls are answered before the paywall, so they never get a 402.
// withX402 also settles only when the handler returns < 400.

const idFromPath = (path: string) => path.split("/").at(-2) ?? "";

async function precheck(id: string) {
  const record = await getCall(id);
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (Date.now() / 1000 >= record.revealAt) {
    return NextResponse.json({ error: "This call is already public; view it for free" }, { status: 409 });
  }
  return null;
}

async function handler(req: NextRequest): Promise<NextResponse> {
  const id = idFromPath(req.nextUrl.pathname);
  const rejected = await precheck(id);
  if (rejected) return rejected;
  const record = (await getCall(id))!;
  const updated = await incrementUnlocks(id);
  return NextResponse.json(toPublic(updated ?? record, { unlocked: true }));
}

const paid = withX402(
  handler,
  {
    "/api/calls/[id]/unlock": {
      accepts: {
        scheme: "exact",
        network: X402_NETWORK,
        payTo: async (ctx) => {
          const record = await getCall(idFromPath(ctx.path));
          if (!record) throw new Error("Unknown call");
          return record.caller;
        },
        price: async (ctx) => {
          const record = await getCall(idFromPath(ctx.path));
          return `$${((record?.priceCents ?? 0) / 100).toFixed(2)}`;
        },
        maxTimeoutSeconds: 120,
      },
      description: "Unlock a live, on-chain-committed market call",
      mimeType: "application/json",
    },
  },
  x402Server,
);

export async function GET(req: NextRequest) {
  return (await precheck(idFromPath(req.nextUrl.pathname))) ?? paid(req);
}
