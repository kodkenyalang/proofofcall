import { TopUpPanel } from "@/components/TopUpPanel";

export default function TopUp() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Top up from any chain</h1>
        <p className="text-sm text-muted">
          Have USDC on Base or ETH on Arbitrum? Send it to a one-time address and receive USDC in your Solana wallet,
          ready for unlocks. Routed by Aurora Intents. No bridge UI, no extra wallet.
        </p>
      </div>
      <TopUpPanel />
    </div>
  );
}
