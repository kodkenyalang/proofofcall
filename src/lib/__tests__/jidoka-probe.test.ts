import { expect, it } from "vitest";

// Deliberately red: proves a failing PR cannot merge into a protected main (KAIZEN Day 4). Never merge.
it("fails on purpose", () => expect(1).toBe(2));
