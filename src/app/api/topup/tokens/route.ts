import { NextResponse } from "next/server";
import { CLUSTER } from "@/lib/config";
import { auroraTokens } from "@/lib/server/aurora";

// Origin assets a user can top up from (anything Aurora routes, excluding Solana USDC itself).
export async function GET() {
  if (CLUSTER !== "mainnet") {
    return NextResponse.json({ error: "Aurora Intents is mainnet-only; switch the app to mainnet" }, { status: 400 });
  }
  try {
    const tokens = (await auroraTokens())
      .filter((t) => !(t.blockchain === "sol" && t.symbol === "USDC"))
      .sort((a, b) => a.blockchain.localeCompare(b.blockchain) || a.symbol.localeCompare(b.symbol));
    return NextResponse.json(tokens);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
