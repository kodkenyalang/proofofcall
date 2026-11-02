import { describe, expect, it } from "vitest";
import { keyPrefix } from "../store";

// Blast radius (AGENT.md §9): every environment and cluster shares one Redis database.
describe("keyPrefix", () => {
  it("keeps production on devnet on the original keys", () => {
    expect(keyPrefix("production", "devnet")).toBe("poc:");
  });

  it("namespaces preview and local development away from production", () => {
    expect(keyPrefix("preview", "devnet")).toBe("preview:poc:");
    expect(keyPrefix("development", "devnet")).toBe("development:poc:");
  });

  it("treats an unset VERCEL_ENV as local development", () => {
    expect(keyPrefix("", "devnet")).toBe("development:poc:");
  });

  it("never lets a mainnet deploy share keys with a devnet one", () => {
    expect(keyPrefix("production", "mainnet")).toBe("mainnet:poc:");
    expect(keyPrefix("preview", "mainnet")).toBe("preview:mainnet:poc:");
    expect(keyPrefix("development", "mainnet")).toBe("development:mainnet:poc:");
  });

  it("gives every (environment, cluster) pair a distinct namespace", () => {
    const all = ["production", "preview", "development"].flatMap((env) =>
      (["devnet", "mainnet"] as const).map((cluster) => keyPrefix(env, cluster)),
    );
    expect(new Set(all).size).toBe(all.length);
    // No namespace is a prefix of another, so a SCAN of one can never match keys of another.
    for (const a of all) for (const b of all) if (a !== b) expect(b.startsWith(a)).toBe(false);
  });
});
