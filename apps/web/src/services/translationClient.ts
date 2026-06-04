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
  signal?: AbortSignal;
}

export interface TranslatePatternResult extends TranslationPipelineResult {
  provider: "api" | "local";
  providerName: string;
}

// Empty string → relative URLs → Vite proxy forwards to the API server (no CORS).
// Set VITE_TRANSLATION_API_URL only for production deployments where the API is on a different host.
const API_BASE_URL = import.meta.env.VITE_TRANSLATION_API_URL ?? "";

export async function translatePattern(
  input: TranslatePatternInput
): Promise<TranslatePatternResult> {
  const { signal, ...body } = input;
  let apiWarnings: PipelineWarning[] = [];

  try {
    let response: Response;

    try {
      response = await fetch(`${API_BASE_URL}/api/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") throw err;
      // Network-level failure: server is not reachable at all.
      throw new ApiError(
        "TRANSLATION_PROVIDER_UNAVAILABLE",
        "Translation API is not reachable. Make sure both servers are running with `npm run dev`."
      );
    }

    if (!response.ok) {
      // Server responded but with an error — extract the reason from the body.
      const body = await safeReadJson(response);
      const message =
        body?.error ??
        `Translation API returned ${response.status}.`;

      apiWarnings = normalizeWarnings(body?.warnings);

      throw new ApiError("TRANSLATION_FAILED", message);
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
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    const fallback = await runTranslationPipeline(input);

    const warning: PipelineWarning =
      error instanceof ApiError
        ? { code: error.warningCode, severity: "warning", message: error.message }
        : {
            code: "TRANSLATION_PROVIDER_UNAVAILABLE",
            severity: "warning",
            message: "Translation API is unavailable. Used local glossary-only preview."
          };

    return {
      ...fallback,
      warnings: [warning, ...apiWarnings, ...fallback.warnings],
      provider: "local",
      providerName: "local passthrough"
    };
  }
}

class ApiError extends Error {
  constructor(
    public readonly warningCode: PipelineWarning["code"],
    message: string
  ) {
    super(message);
  }
}

async function safeReadJson(
  response: Response
): Promise<{ error?: string; warnings?: unknown } | null> {
  try {
    return (await response.json()) as { error?: string; warnings?: unknown };
  } catch {
    return null;
  }
}

function normalizeWarnings(value: unknown): PipelineWarning[] {
  return Array.isArray(value)
    ? (value as PipelineWarning[]).filter(
        (w) => typeof w === "object" && w !== null && "code" in w && "message" in w
      )
    : [];
}

function normalizeMatches(matches: GlossaryMatch[] | undefined): GlossaryMatch[] {
  return Array.isArray(matches) ? matches : [];
}
