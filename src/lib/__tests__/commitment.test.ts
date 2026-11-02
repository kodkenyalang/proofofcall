import { describe, expect, it } from "vitest";
import { type CallContent, commitmentHash, commitmentMemo, commitmentPreimage, randomSalt } from "../commitment";

// Parity vectors pin the poc1 format: the browser, the server and the verifier all hash with
// this module, and every committed call must keep verifying. Expected hashes were computed
// outside this codebase (Python: json.dumps(separators=(",", ":"), ensure_ascii=False) + hashlib.sha256).
// If one of these fails, you changed the commitment format: bump to poc2 instead (AGENT.md §6).

// Live production call 41581a66e249c4cc, revealed 1 Nov 2026 (commit tx 3y5tB1b8…9guc on devnet).
const production: CallContent = {
  caller: "Fd3HfM9udQn3ti9Acy2LnmqesBtnqbTwN69kS1ss5RRG",
  asset: "SOL",
  direction: "long",
  horizonSec: 300,
  targetBps: 200,
  priceCents: 25,
  thesis:
    "Day-1 gemba probe from a CLI keypair (not a browser wallet). Checks the live register path: Vercel -> devnet RPC -> Redis -> Coinbase.",
  salt: "27b0cb7f3404fe7d81f621670ea9af2fc8272086d81de70888c413a28fa0f79d",
};

// Escaping and Unicode: quotes, a newline, an arrow and CJK text, with no target.
const synthetic: CallContent = {
  caller: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
  asset: "BTC",
  direction: "short",
  horizonSec: 86_400,
  targetBps: null,
  priceCents: 150,
  thesis: 'Funding "hot" at 0.1%/8h;\nbasis → 0. 资金费率过高',
  salt: "0".repeat(64),
};

describe("commitment hash (poc1)", () => {
  it("reproduces the hash of a live production call", async () => {
    expect(await commitmentHash(production)).toBe(
      "41581a66e249c4cca257cf939f5139e97235b54d77f816aadff597adcaabbeb5",
    );
  });

  it("matches an independent implementation for escaped and non-ASCII text", async () => {
    expect(commitmentPreimage(synthetic)).toBe(
      '[1,"9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM","BTC","short",86400,null,150,"Funding \\"hot\\" at 0.1%/8h;\\nbasis → 0. 资金费率过高","0000000000000000000000000000000000000000000000000000000000000000"]',
    );
    expect(await commitmentHash(synthetic)).toBe(
      "9d00275a1b04f858eb7bce82bc5c97c46a9236633f3c70df07a622718eebbe49",
    );
  });

  it("does not depend on object key order", async () => {
    const reordered = Object.fromEntries(Object.entries(production).reverse()) as CallContent;
    expect(await commitmentHash(reordered)).toBe(await commitmentHash(production));
  });

  it("changes when any sealed field changes", async () => {
    const base = await commitmentHash(production);
    for (const patch of [
      { direction: "short" as const },
      { targetBps: 201 },
      { thesis: `${production.thesis} ` },
      { salt: "f".repeat(64) },
      { priceCents: 26 },
    ]) {
      expect(await commitmentHash({ ...production, ...patch })).not.toBe(base);
    }
  });

  it("builds the memo and salts in the expected shape", () => {
    expect(commitmentMemo("ab")).toBe("poc1:ab");
    const salt = randomSalt();
    expect(salt).toMatch(/^[0-9a-f]{64}$/);
    expect(randomSalt()).not.toBe(salt);
  });
});
