import "server-only";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { x402ResourceServer } from "@x402/next";
import { ExactSvmScheme } from "@x402/svm/exact/server";
import { CLUSTER, X402_NETWORK } from "../config";

// x402.org's public facilitator is testnet/devnet only. On mainnet, set X402_FACILITATOR_URL
// to a production facilitator (e.g. PayAI, Dexter, or Coinbase CDP).
const facilitatorUrl =
  process.env.X402_FACILITATOR_URL ??
  (CLUSTER === "devnet" ? "https://x402.org/facilitator" : undefined);
if (!facilitatorUrl) throw new Error("X402_FACILITATOR_URL is required on mainnet");

export const x402Server = new x402ResourceServer(new HTTPFacilitatorClient({ url: facilitatorUrl })).register(
  X402_NETWORK,
  new ExactSvmScheme(),
);
