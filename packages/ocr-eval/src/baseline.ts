import { readFile, writeFile } from "node:fs/promises";
import type { OcrMetrics } from "./metrics.js";

export interface BaselineEntry {
  fixture: string;
  metrics: OcrMetrics;
  recordedAt: string;
}

export interface BaselineReport {
  provider: string;
  entries: BaselineEntry[];
}

export async function loadBaseline(path: string): Promise<BaselineReport | null> {
  try {
    const raw = await readFile(path, "utf8");
    return JSON.parse(raw) as BaselineReport;
  } catch {
    return null;
  }
}

export async function saveBaseline(path: string, report: BaselineReport): Promise<void> {
  await writeFile(path, JSON.stringify(report, null, 2) + "\n", "utf8");
}

export interface RegressionResult {
  fixture: string;
  metric: keyof OcrMetrics;
  baseline: number;
  current: number;
  delta: number;
  passed: boolean;
}

const REGRESSION_THRESHOLD = 0.02;

/**
 * Compare current metrics against baseline.
 * Fails if CER or token recall regresses by more than 2 percentage points.
 */
export function checkRegression(
  baseline: BaselineReport,
  current: Map<string, OcrMetrics>
): RegressionResult[] {
  const results: RegressionResult[] = [];

  for (const entry of baseline.entries) {
    const curr = current.get(entry.fixture);

    if (!curr) continue;

    const cerDelta = curr.cer - entry.metrics.cer;
    results.push({
      fixture: entry.fixture,
      metric: "cer",
      baseline: entry.metrics.cer,
      current: curr.cer,
      delta: cerDelta,
      passed: cerDelta <= REGRESSION_THRESHOLD
    });

    const recallDelta = entry.metrics.crochetTokenRecall - curr.crochetTokenRecall;
    results.push({
      fixture: entry.fixture,
      metric: "crochetTokenRecall",
      baseline: entry.metrics.crochetTokenRecall,
      current: curr.crochetTokenRecall,
      delta: recallDelta,
      passed: recallDelta <= REGRESSION_THRESHOLD
    });
  }

  return results;
}
