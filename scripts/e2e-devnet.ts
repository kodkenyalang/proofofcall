// Devnet smoke test: throwaway keypair -> memo commitment -> register -> x402 challenge.
// Run: node scripts/e2e-devnet.ts (dev server on :3000, NEXT_PUBLIC_SOLANA_CLUSTER=devnet).
// LOCAL=1 targets a Surfpool at 127.0.0.1:8899; the server must use the same RPC
// (NEXT_PUBLIC_SOLANA_RPC_URL=http://127.0.0.1:8899). Public devnet airdrops are disabled.
import { getAddMemoInstruction } from "@solana-program/memo";
import { createClient, lamports } from "@solana/kit";
import { solanaDevnetRpc, solanaLocalRpc } from "@solana/kit-plugin-rpc";
import { airdropSigner, generatedSigner } from "@solana/kit-plugin-signer";
import { commitmentHash, commitmentMemo, randomSalt, type CallContent } from "../src/lib/commitment.ts";

const BASE = process.env.APP_URL ?? "http://localhost:3000";

const client = await createClient()
  .use(generatedSigner())
  .use(
    process.env.LOCAL === "1"
      ? solanaLocalRpc({ transactionConfig: { version: 1 } })
      : solanaDevnetRpc({ transactionConfig: { version: 1 } }),
  )
  .use(airdropSigner(lamports(10_000_000n)));

const content: CallContent = {
  caller: client.payer.address,
  asset: "SOL",
  direction: "long",
  horizonSec: 300,
  targetBps: 200,
  priceCents: 25,
  thesis: "e2e smoke test",
  salt: randomSalt(),
};
const hash = await commitmentHash(content);
const result = await client.sendTransaction([
  getAddMemoInstruction({ memo: commitmentMemo(hash), signers: [client.payer] }),
]);
const signature = result.context.signature;
console.log("commit tx", signature);

const reg = await fetch(`${BASE}/api/calls`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ content, signature }),
});
const call = await reg.json();
console.log("register", reg.status, call);
if (!reg.ok) process.exit(1);
if (call.direction !== null || call.thesis !== null) throw new Error("sealed fields leaked");

const dup = await fetch(`${BASE}/api/calls`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ content, signature }),
});
console.log("duplicate register", dup.status, (await dup.json()).error);

const unlock = await fetch(`${BASE}/api/calls/${call.id}/unlock`);
const challenge = unlock.headers.get("payment-required");
console.log("unlock", unlock.status);
const req = challenge ? JSON.parse(Buffer.from(challenge, "base64").toString()) : await unlock.json();
console.log(JSON.stringify(req, null, 2));
const accept = req.accepts?.[0];
if (unlock.status !== 402 || accept?.payTo !== content.caller || accept?.amount !== "250000") {
  throw new Error("unexpected x402 challenge");
}
console.log("OK: 402 pays", accept.amount, "USDC base units to the caller");
