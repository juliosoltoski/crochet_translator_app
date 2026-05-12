import { describe, expect, it } from "vitest";
import { computeCer, computeWer, computeCrochetTokenMetrics, editDistance } from "./metrics.js";

describe("editDistance", () => {
  it("returns 0 for identical strings", () => {
    expect(editDistance("abc", "abc")).toBe(0);
  });

  it("returns length of non-empty string when compared to empty", () => {
    expect(editDistance("", "abc")).toBe(3);
    expect(editDistance("abc", "")).toBe(3);
  });

  it("counts single substitution", () => {
    expect(editDistance("cat", "bat")).toBe(1);
  });
});

describe("computeCer", () => {
  it("returns 0 for identical text", () => {
    expect(computeCer("Rd. 1: 6 fM", "Rd. 1: 6 fM")).toBe(0);
  });

  it("returns correct ratio for partial match", () => {
    // "abc" vs "axc" — 1 substitution out of 3 chars
    expect(computeCer("abc", "axc")).toBeCloseTo(1 / 3);
  });

  it("handles empty ground truth", () => {
    expect(computeCer("", "")).toBe(0);
    expect(computeCer("", "something")).toBe(1);
  });
});

describe("computeWer", () => {
  it("returns 0 for identical text", () => {
    expect(computeWer("Rd. 1: 6 fM", "Rd. 1: 6 fM")).toBe(0);
  });

  it("counts word-level errors", () => {
    expect(computeWer("a b c", "a x c")).toBeCloseTo(1 / 3);
  });
});

describe("computeCrochetTokenMetrics", () => {
  it("finds perfect recall when all tokens present", () => {
    const gt = "Rd. 1: 6 fM in den Fadenring (6 M)";
    const metrics = computeCrochetTokenMetrics(gt, gt);
    expect(metrics.crochetTokenRecall).toBe(1);
    expect(metrics.crochetTokenF1).toBe(1);
  });

  it("returns 0 recall when no tokens found in hypothesis", () => {
    const gt = "Rd. 1: 6 fM (6 M)";
    const hyp = "completely different text without crochet abbreviations";
    const metrics = computeCrochetTokenMetrics(gt, hyp);
    expect(metrics.crochetTokenRecall).toBe(0);
  });

  it("handles text with no glossary tokens gracefully", () => {
    const metrics = computeCrochetTokenMetrics("plain text", "plain text");
    expect(metrics.crochetTokenF1).toBe(1);
  });
});
