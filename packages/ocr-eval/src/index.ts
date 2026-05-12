#!/usr/bin/env node
/**
 * OCR evaluation CLI.
 *
 * Usage:
 *   npm --workspace packages/ocr-eval run eval -- --provider tesseract
 *   npm --workspace packages/ocr-eval run eval -- --provider tesseract --save-baseline
 *   npm --workspace packages/ocr-eval run eval -- --provider tesseract --check-regression
 *   npm --workspace packages/ocr-eval run eval -- --fixture daffodil-dorothy-1-column
 *
 * Ground truth files must exist in test-fixtures/ocr/ground-truth/<name>.txt
 * Image fixtures are read from test-fixtures/ocr/manual/<name>.(jpg|jpeg|png)
 */
import { readdir } from "node:fs/promises";
import { join, basename, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { runFixture, type FixtureResult } from "./runner.js";
import { loadBaseline, saveBaseline, checkRegression, type BaselineReport } from "./baseline.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const REPO_ROOT = join(__dirname, "../../..");
const FIXTURES_DIR = join(REPO_ROOT, "test-fixtures/ocr/manual");
const GROUND_TRUTH_DIR = join(REPO_ROOT, "test-fixtures/ocr/ground-truth");
const BASELINE_DIR = join(REPO_ROOT, "test-fixtures/ocr/baseline");

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

async function findImageFixtures(nameFilter?: string): Promise<string[]> {
  const entries = await readdir(FIXTURES_DIR);

  return entries
    .filter((name) => {
      const ext = extname(name).toLowerCase();
      if (!IMAGE_EXTENSIONS.has(ext)) return false;
      if (nameFilter) return name.includes(nameFilter);
      return true;
    })
    .map((name) => join(FIXTURES_DIR, name));
}

function printTable(results: FixtureResult[]): void {
  const cols = [
    { label: "Fixture", width: 45 },
    { label: "CER", width: 6 },
    { label: "WER", width: 6 },
    { label: "TokenF1", width: 8 },
    { label: "ms", width: 6 },
    { label: "Status", width: 12 }
  ];

  const header = cols.map((c) => c.label.padEnd(c.width)).join(" ");
  const divider = cols.map((c) => "-".repeat(c.width)).join(" ");

  process.stdout.write(`\n${header}\n${divider}\n`);

  for (const r of results) {
    const status = r.error ? "ERROR" : meetsThreshold(r) ? "PASS" : "FAIL";
    const row = [
      r.fixture.substring(0, 44).padEnd(cols[0].width),
      (r.error ? "—" : pct(r.metrics.cer)).padEnd(cols[1].width),
      (r.error ? "—" : pct(r.metrics.wer)).padEnd(cols[2].width),
      (r.error ? "—" : pct(r.metrics.crochetTokenF1)).padEnd(cols[3].width),
      String(r.durationMs).padEnd(cols[4].width),
      status.padEnd(cols[5].width)
    ].join(" ");

    process.stdout.write(`${row}\n`);

    if (r.error) {
      process.stdout.write(`  Error: ${r.error}\n`);
    }
  }

  const passing = results.filter((r) => !r.error && meetsThreshold(r)).length;
  const total = results.length;

  process.stdout.write(`\n${passing}/${total} fixtures passed thresholds\n\n`);
}

function meetsThreshold(r: FixtureResult): boolean {
  return r.metrics.cer <= 0.15 && r.metrics.crochetTokenRecall >= 0.75;
}

function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const provider = argValue(args, "--provider") ?? "tesseract";
  const fixtureFilter = argValue(args, "--fixture");
  const saveBaseline = args.includes("--save-baseline");
  const checkReg = args.includes("--check-regression");

  process.stdout.write(`OCR Evaluation — provider: ${provider}\n`);

  const imagePaths = await findImageFixtures(fixtureFilter ?? undefined);

  if (imagePaths.length === 0) {
    process.stderr.write(`No fixtures found in ${FIXTURES_DIR}\n`);
    process.exit(1);
  }

  process.stdout.write(`Running ${imagePaths.length} fixture(s)...\n`);

  const results: FixtureResult[] = [];

  for (const imagePath of imagePaths) {
    const name = basename(imagePath, extname(imagePath));
    const gtPath = join(GROUND_TRUTH_DIR, `${name}.txt`);

    process.stdout.write(`  ${name}...`);
    const result = await runFixture(imagePath, gtPath);
    results.push(result);

    if (result.error) {
      process.stdout.write(` error: ${result.error}\n`);
    } else {
      process.stdout.write(` CER=${pct(result.metrics.cer)} TokenF1=${pct(result.metrics.crochetTokenF1)} (${result.durationMs}ms)\n`);
    }
  }

  printTable(results);

  if (saveBaseline) {
    const report: BaselineReport = {
      provider,
      entries: results
        .filter((r) => !r.error)
        .map((r) => ({
          fixture: r.fixture,
          metrics: r.metrics,
          recordedAt: new Date().toISOString()
        }))
    };

    const baselinePath = join(BASELINE_DIR, `${provider}-baseline.json`);
    const { saveBaseline: save } = await import("./baseline.js");
    await save(baselinePath, report);
    process.stdout.write(`Baseline saved to ${baselinePath}\n`);
  }

  if (checkReg) {
    const baselinePath = join(BASELINE_DIR, `${provider}-baseline.json`);
    const { loadBaseline: load, checkRegression } = await import("./baseline.js");
    const baseline = await load(baselinePath);

    if (!baseline) {
      process.stderr.write(`No baseline found at ${baselinePath}. Run with --save-baseline first.\n`);
      process.exit(1);
    }

    const currentMap = new Map(results.filter((r) => !r.error).map((r) => [r.fixture, r.metrics]));
    const regressions = checkRegression(baseline, currentMap).filter((r) => !r.passed);

    if (regressions.length > 0) {
      process.stderr.write(`\n${regressions.length} regression(s) detected:\n`);

      for (const reg of regressions) {
        process.stderr.write(
          `  ${reg.fixture} — ${String(reg.metric)}: baseline=${pct(reg.baseline)} current=${pct(reg.current)} delta=${pct(reg.delta)}\n`
        );
      }

      process.exit(1);
    }

    process.stdout.write("No regressions detected.\n");
  }
}

function argValue(args: string[], flag: string): string | null {
  const index = args.indexOf(flag);
  return index !== -1 && index + 1 < args.length ? args[index + 1] : null;
}

main().catch((error) => {
  process.stderr.write(`Fatal: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
