import { NextResponse } from "next/server";
import { resolveIfDue, toPublic } from "@/lib/server/calls";
import { getCall } from "@/lib/server/store";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const record = await getCall((await params).id);
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(toPublic(await resolveIfDue(record)));
}
