import { germanPortugueseCrochetGlossary } from "@crochet-translator/core";

export interface OcrMetrics {
  cer: number;
  wer: number;
  crochetTokenRecall: number;
  crochetTokenPrecision: number;
  crochetTokenF1: number;
  groundTruthLength: number;
  ocrLength: number;
}

/**
 * Compute character-level Levenshtein edit distance.
 * Uses Wagner-Fischer DP; acceptable for strings up to ~5000 chars.
 */
export function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;

  if (m === 0) return n;
  if (n === 0) return m;

  const prev = new Uint32Array(n + 1);
  const curr = new Uint32Array(n + 1);

  for (let j = 0; j <= n; j++) {
    prev[j] = j;
  }

  for (let i = 1; i <= m; i++) {
    curr[0] = i;

    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        curr[j] = prev[j - 1];
      } else {
        curr[j] = 1 + Math.min(prev[j - 1], prev[j], curr[j - 1]);
      }
    }

    prev.set(curr);
  }

  return prev[n];
}

export function computeCer(groundTruth: string, hypothesis: string): number {
  const gt = normalizeForMetrics(groundTruth);
  const hyp = normalizeForMetrics(hypothesis);

  if (gt.length === 0) return hypothesis.length === 0 ? 0 : 1;

  return editDistance(gt, hyp) / gt.length;
}

export function computeWer(groundTruth: string, hypothesis: string): number {
  const gtWords = normalizeForMetrics(groundTruth).split(/\s+/).filter(Boolean);
  const hypWords = normalizeForMetrics(hypothesis).split(/\s+/).filter(Boolean);

  if (gtWords.length === 0) return hypWords.length === 0 ? 0 : 1;

  return editDistance(gtWords.join("\0"), hypWords.join("\0")) / gtWords.length;
}

// All source terms and abbreviations from the German-Portuguese glossary
const GLOSSARY_TOKENS: string[] = germanPortugueseCrochetGlossary.flatMap((entry) => [
  entry.source,
  ...(entry.aliases ?? [])
]);

export function extractCrochetTokens(text: string): string[] {
  const lower = text.toLowerCase();
  return GLOSSARY_TOKENS.filter((token) => {
    const t = token.toLowerCase();
    const index = lower.indexOf(t);

    if (index === -1) return false;

    const before = index === 0 ? "" : lower[index - 1];
    const after = index + t.length >= lower.length ? "" : lower[index + t.length];
    const isBefore = !before || /[^a-zäöüßA-ZÄÖÜ0-9]/.test(before);
    const isAfter = !after || /[^a-zäöüßA-ZÄÖÜ0-9]/.test(after);

    return isBefore && isAfter;
  });
}

export function computeCrochetTokenMetrics(
  groundTruth: string,
  hypothesis: string
): Pick<OcrMetrics, "crochetTokenRecall" | "crochetTokenPrecision" | "crochetTokenF1"> {
  const gtTokens = new Set(extractCrochetTokens(groundTruth).map((t) => t.toLowerCase()));
  const hypTokens = new Set(extractCrochetTokens(hypothesis).map((t) => t.toLowerCase()));

  if (gtTokens.size === 0 && hypTokens.size === 0) {
    return { crochetTokenRecall: 1, crochetTokenPrecision: 1, crochetTokenF1: 1 };
  }

  let truePositives = 0;

  for (const token of gtTokens) {
    if (hypTokens.has(token)) truePositives++;
  }

  const recall = gtTokens.size > 0 ? truePositives / gtTokens.size : 0;
  const precision = hypTokens.size > 0 ? truePositives / hypTokens.size : 0;
  const f1 = recall + precision > 0 ? (2 * recall * precision) / (recall + precision) : 0;

  return {
    crochetTokenRecall: recall,
    crochetTokenPrecision: precision,
    crochetTokenF1: f1
  };
}

export function computeMetrics(groundTruth: string, hypothesis: string): OcrMetrics {
  return {
    cer: computeCer(groundTruth, hypothesis),
    wer: computeWer(groundTruth, hypothesis),
    ...computeCrochetTokenMetrics(groundTruth, hypothesis),
    groundTruthLength: groundTruth.length,
    ocrLength: hypothesis.length
  };
}

function normalizeForMetrics(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}
