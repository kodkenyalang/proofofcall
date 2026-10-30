"use client";

import { address } from "@solana/kit";
import { useClient } from "@solana/react";
import useSWR from "swr";
import type { AppClient } from "@/app/providers";
import { USDC_MINT } from "../config";

// Total USDC across the owner's token accounts for the cluster's USDC mint.
export function useUsdcBalance(owner?: string) {
  const { rpc } = useClient<AppClient>();
  return useSWR(
    owner ? ["usdc", owner] : null,
    async () => {
      const { value } = await rpc
        .getTokenAccountsByOwner(address(owner!), { mint: address(USDC_MINT) }, { encoding: "jsonParsed" })
        .send();
      return value.reduce(
        (sum, acc) => sum + Number(acc.account.data.parsed.info.tokenAmount.uiAmountString ?? 0),
        0,
      );
    },
    { refreshInterval: 15_000 },
  );
}
