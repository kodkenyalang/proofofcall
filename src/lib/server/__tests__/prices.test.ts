import { describe, expect, it } from "vitest";
import { type Candle, firstOpenAtOrAfter, scoringMinute } from "../prices";

// Real Coinbase SOL-USD 1-minute candles (newest first) around the live production call
// 41581a66e249c4cc: committed 1793524695, revealed 1793524995. Production stored
// entry 95.52 and exit 95.36; these fixtures must reproduce both.
const AROUND_COMMIT: Candle[] = [
  [1793525040, 95.33, 95.37, 95.36, 95.33, 149.48204654],
  [1793524980, 95.36, 95.38, 95.38, 95.37, 63.00732103],
  [1793524920, 95.38, 95.46, 95.46, 95.38, 558.66845476],
  [1793524860, 95.46, 95.49, 95.48, 95.46, 102.30506713],
  [1793524800, 95.47, 95.49, 95.48, 95.47, 69.924224],
  [1793524740, 95.47, 95.52, 95.52, 95.47, 198.27722691],
];

describe("scoringMinute", () => {
  it("rounds up to the next full minute", () => {
    expect(scoringMinute(1793524695)).toBe(1793524740);
    expect(scoringMinute(61)).toBe(120);
  });

  it("keeps a timestamp that is already on the minute", () => {
    expect(scoringMinute(120)).toBe(120);
  });
});

describe("firstOpenAtOrAfter", () => {
  it("reproduces production's entry and exit prices", () => {
    expect(firstOpenAtOrAfter(AROUND_COMMIT, scoringMinute(1793524695))).toBe(95.52);
    expect(firstOpenAtOrAfter(AROUND_COMMIT, scoringMinute(1793524995))).toBe(95.36);
  });

  it("skips minutes with no trades to the next traded minute", () => {
    const gappy = AROUND_COMMIT.filter((c) => c[0] !== 1793524740);
    expect(firstOpenAtOrAfter(gappy, 1793524740)).toBe(95.48);
  });

  it("never uses a candle from before the minute", () => {
    expect(firstOpenAtOrAfter(AROUND_COMMIT, 1793525100)).toBeNull();
  });

  it("returns null when nothing has printed yet", () => {
    expect(firstOpenAtOrAfter([], 1793524740)).toBeNull();
  });
});
