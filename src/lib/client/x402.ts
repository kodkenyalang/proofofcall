import type { TransactionSigner } from "@solana/kit";
import { wrapFetchWithPaymentFromConfig } from "@x402/fetch";
import { ExactSvmScheme } from "@x402/svm/exact/client";
import { RPC_URL, X402_NETWORK } from "../config";
import type { PublicCall } from "../types";

// Fetch a paid endpoint, paying the x402 challenge with the connected wallet (USDC on Solana).
export async function unlockCall(id: string, walletSigner: TransactionSigner): Promise<PublicCall> {
  const payingFetch = wrapFetchWithPaymentFromConfig(fetch, {
    schemes: [{ network: X402_NETWORK, client: new ExactSvmScheme(walletSigner, { rpcUrl: RPC_URL }) }],
  });
  const res = await payingFetch(`/api/calls/${id}/unlock`);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? `Unlock failed (HTTP ${res.status})`);
  return body as PublicCall;
}
