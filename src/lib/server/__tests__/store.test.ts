import { describe, expect, it } from "vitest";
import { keyPrefix } from "../store";

// Blast radius (AGENT.md §9): every environment shares one Redis database.
describe("keyPrefix", () => {
  it("keeps production on the original keys", () => {
    expect(keyPrefix("production")).toBe("poc:");
  });

  it("namespaces preview and local development away from production", () => {
    expect(keyPrefix("preview")).toBe("preview:poc:");
    expect(keyPrefix("development")).toBe("development:poc:");
  });

  it("treats an unset VERCEL_ENV as local development", () => {
    expect(keyPrefix("")).toBe("development:poc:");
  });
});
