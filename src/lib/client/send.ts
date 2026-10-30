import { createClient, type Instruction, type TransactionSigner } from "@solana/kit";
import { solanaRpc } from "@solana/kit-plugin-rpc";
import { signer } from "@solana/kit-plugin-signer";
import type { AppClient } from "@/app/providers";
import { RPC_URL } from "../config";

// Sends instructions with the connected wallet. Uses transaction v1 when the wallet
// supports it; otherwise routes through a v0 client that borrows the same wallet signer.
// The instruction builder receives the exact signer object the transaction will use,
// so Kit never sees two distinct signers for the same address.
export async function sendWithWallet(
  client: AppClient,
  build: (signer: TransactionSigner) => Instruction[],
): Promise<string> {
  const { connected } = client.wallet.getState();
  if (!connected) throw new Error("Connect a wallet first");
  if (!connected.signer) throw new Error("This wallet is read-only and cannot sign");

  if (connected.supportedTransactionVersions.has(1)) {
    const result = await client.sendTransaction(build(client.payer));
    return result.context.signature;
  }
  if (!connected.supportedTransactionVersions.has(0)) {
    throw new Error("This wallet only signs legacy transactions; please update it");
  }
  const v0 = createClient()
    .use(signer(connected.signer))
    .use(solanaRpc({ rpcUrl: RPC_URL, transactionConfig: { version: 0 } }));
  const result = await v0.sendTransaction(build(connected.signer));
  return result.context.signature;
}
