import {
  runTranslationPipeline,
  type Craft,
  type GlossaryMatch,
  type LanguageCode,
  type PipelineWarning,
  type TranslationPipelineResult
} from "@crochet-translator/core";

export interface TranslatePatternInput {
  text: string;
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  targetVariant?: LanguageCode;
  craft: Craft;
}

export interface TranslatePatternResult extends TranslationPipelineResult {
  provider: "api" | "local";
  providerName: string;
}

const API_BASE_URL = import.meta.env.VITE_TRANSLATION_API_URL ?? "http://localhost:8787";

export async function translatePattern(
  input: TranslatePatternInput
): Promise<TranslatePatternResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/translate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(input)
    });

    if (!response.ok) {
      throw new Error(`Translation API returned ${response.status}.`);
    }

    const result = (await response.json()) as TranslationPipelineResult & {
      provider?: string;
    };

    return {
      ...result,
      glossaryMatches: normalizeMatches(result.glossaryMatches),
      warnings: result.warnings ?? [],
      provider: "api",
      providerName: result.provider ?? "api"
    };
  } catch {
    const fallback = await runTranslationPipeline(input);
    const warning: PipelineWarning = {
      code: "TRANSLATION_PROVIDER_UNAVAILABLE",
      severity: "warning",
      message: "Translation API is unavailable. Used local glossary-only preview."
    };

    return {
      ...fallback,
      warnings: [warning, ...fallback.warnings],
      provider: "local",
      providerName: "local passthrough"
    };
  }
}

function normalizeMatches(matches: GlossaryMatch[] | undefined): GlossaryMatch[] {
  return Array.isArray(matches) ? matches : [];
}
