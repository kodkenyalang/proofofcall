import { type NextRequest, NextResponse } from "next/server";
import { topUpStatus } from "@/lib/server/aurora";

export async function GET(req: NextRequest) {
  const depositAddress = req.nextUrl.searchParams.get("depositAddress");
  if (!depositAddress) return NextResponse.json({ error: "depositAddress is required" }, { status: 400 });
  try {
    const memo = req.nextUrl.searchParams.get("depositMemo") ?? undefined;
    return NextResponse.json(await topUpStatus(depositAddress, memo));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
