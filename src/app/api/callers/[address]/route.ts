import { NextResponse } from "next/server";
import { allPublicCalls, trackRecord } from "@/lib/server/calls";

export async function GET(_: Request, { params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;
  const calls = await allPublicCalls();
  return NextResponse.json({
    record: trackRecord(address, calls),
    calls: calls.filter((c) => c.caller === address),
  });
}
