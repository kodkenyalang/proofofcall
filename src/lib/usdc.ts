import { address } from "@solana/kit";
import { findAssociatedTokenPda, TOKEN_PROGRAM_ADDRESS } from "@solana-program/token";
import { USDC_MINT } from "./config";

// The USDC account x402 pays into. A wallet that has never held USDC doesn't have one,
// and a transfer to a missing account fails, so a caller needs it before anyone can unlock.
export async function usdcAccountOf(owner: string) {
  const [ata] = await findAssociatedTokenPda({
    owner: address(owner),
    mint: address(USDC_MINT),
    tokenProgram: TOKEN_PROGRAM_ADDRESS,
  });
  return ata;
}

// Size of an SPL token account; its rent comes from the RPC because the rate can change.
export const TOKEN_ACCOUNT_BYTES = BigInt(165);
