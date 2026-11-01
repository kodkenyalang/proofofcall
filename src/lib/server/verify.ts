import "server-only";
import { createSolanaRpc, signature as toSignature } from "@solana/kit";
import { MEMO_PREFIX } from "../commitment";
import { RPC_URL } from "../config";
import { usdcAccountOf } from "../usdc";

const rpc = createSolanaRpc(process.env.SOLANA_RPC_URL ?? RPC_URL);

type ParsedIx = { program?: string; programId: string; parsed?: unknown };
type ParsedKey = { pubkey: string; signer: boolean };

// Confirms that `sig` is a successful transaction, signed by `caller`, carrying exactly
// the memo `poc1:<hash>`. Returns the block time, which becomes the authoritative commit time.
export async function verifyCommitTx(sig: string, caller: string, hash: string): Promise<number> {
  const expectedMemo = `${MEMO_PREFIX}${hash}`;

  // A just-confirmed transaction can take a moment to become queryable.
  let tx = null;
  for (let attempt = 0; attempt < 6 && !tx; attempt++) {
    if (attempt) await new Promise((r) => setTimeout(r, 1500));
    tx = await rpc
      .getTransaction(toSignature(sig), {
        commitment: "confirmed",
        encoding: "jsonParsed",
        maxSupportedTransactionVersion: 1,
      })
      .send();
  }
  if (!tx) throw new Error("Commit transaction not found on chain");
  if (tx.meta?.err) throw new Error("Commit transaction failed on chain");
  if (tx.blockTime == null) throw new Error("Commit transaction has no block time yet");

  const keys = tx.transaction.message.accountKeys as unknown as ParsedKey[];
  if (!keys.some((k) => k.pubkey === caller && k.signer)) {
    throw new Error("Commit transaction was not signed by the caller");
  }

  const ixs = tx.transaction.message.instructions as unknown as ParsedIx[];
  const memos = ixs.filter((ix) => ix.program === "spl-memo").map((ix) => ix.parsed);
  if (!memos.includes(expectedMemo)) throw new Error("Commit transaction does not carry this commitment");

  return Number(tx.blockTime);
}

// False only when the chain says the caller's USDC account is missing, so a payment to them
// would fail. An RPC error returns true: the facilitator simulates before settling, so the
// reader still can't be charged for a failed transfer.
export async function canReceiveUsdc(owner: string): Promise<boolean> {
  try {
    const { value } = await rpc
      .getAccountInfo(await usdcAccountOf(owner), { commitment: "confirmed", encoding: "base64" })
      .send();
    return value !== null;
  } catch {
    return true;
  }
}
