import type { PipelineWarning } from "./types";

const COUNT_TOKEN_REGEX =
  /\(\s*\d+\s*(?:M|Maschen|Stiche|sts?|stitches?|pontos?|pts?)\s*\)|\b\d+\s*x\b/giu;

export function normalizeLineEndings(text: string): string {
  return text.replace(/\r\n?/g, "\n");
}

export function extractCountTokens(text: string): string[] {
  return normalizeLineEndings(text).match(COUNT_TOKEN_REGEX) ?? [];
}

export function hasBalancedParentheses(text: string): boolean {
  let depth = 0;

  for (const char of text) {
    if (char === "(") {
      depth += 1;
    }

    if (char === ")") {
      depth -= 1;
    }

    if (depth < 0) {
      return false;
    }
  }

  return depth === 0;
}

export function validatePatternStructure(
  sourceText: string,
  translatedText: string
): PipelineWarning[] {
  const warnings: PipelineWarning[] = [];
  const normalizedSource = normalizeLineEndings(sourceText);
  const normalizedTranslated = normalizeLineEndings(translatedText);
  const sourceLineCount = normalizedSource.split("\n").length;
  const translatedLineCount = normalizedTranslated.split("\n").length;

  if (sourceLineCount !== translatedLineCount) {
    warnings.push({
      code: "LINE_COUNT_DRIFT",
      severity: "warning",
      message: "The translated text has a different number of lines than the source."
    });
  }

  if (extractCountTokens(sourceText).length !== extractCountTokens(translatedText).length) {
    warnings.push({
      code: "COUNT_TOKEN_DRIFT",
      severity: "warning",
      message: "The number of stitch/count tokens changed during translation."
    });
  }

  if (!hasBalancedParentheses(translatedText)) {
    warnings.push({
      code: "UNBALANCED_PARENTHESES",
      severity: "warning",
      message: "The translated text may have unbalanced parentheses."
    });
  }

  return warnings;
}
