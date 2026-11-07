import { describe, expect, it } from "vitest";
import { toBaseUnits } from "../units";

describe("toBaseUnits", () => {
  it.each([
    ["1.5", 6, "1500000"],
    ["0.25", 6, "250000"],
    [".5", 6, "500000"],
    ["5.", 6, "5000000"],
    [" 2 ", 6, "2000000"],
    ["0.000001", 6, "1"],
    ["1", 18, "1000000000000000000"],
    ["123456789.123456789", 18, "123456789123456789000000000"],
    ["1.5", 0, "1"],
  ])("%s with %i decimals is %s", (amount, decimals, expected) => {
    expect(toBaseUnits(amount, decimals)).toBe(expected);
  });

  it("drops digits past the token's precision instead of rounding up", () => {
    expect(toBaseUnits("1.1234569", 6)).toBe("1123456");
  });

  it.each(["", " ", ".", "0", "0.0000001", "-1", "1e5", "1,5", "abc", "1.2.3", "0x10"])(
    "rejects %j",
    (amount) => {
      expect(toBaseUnits(amount, 6)).toBeNull();
    },
  );
});
