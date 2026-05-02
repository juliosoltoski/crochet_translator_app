import {
  PassthroughTranslationProvider,
  type PipelineWarning,
  type TranslationProvider
} from "@crochet-translator/core";
import type { ApiConfig } from "./config";
import { GeminiTranslationProvider } from "./geminiTranslationProvider";

export interface TranslationProviderBundle {
  name: "passthrough" | "gemini";
  provider: TranslationProvider;
  warnings: PipelineWarning[];
}

export function createTranslationProvider(config: ApiConfig): TranslationProviderBundle {
  if (config.provider === "gemini") {
    if (!config.geminiApiKey) {
      return {
        name: "passthrough",
        provider: new PassthroughTranslationProvider(),
        warnings: [
          {
            code: "TRANSLATION_PROVIDER_UNAVAILABLE",
            severity: "warning",
            message:
              "TRANSLATION_PROVIDER is gemini, but GEMINI_API_KEY is missing. Used glossary-only preview."
          }
        ]
      };
    }

    return {
      name: "gemini",
      provider: new GeminiTranslationProvider({
        apiKey: config.geminiApiKey,
        model: config.geminiModel
      }),
      warnings: []
    };
  }

  return {
    name: "passthrough",
    provider: new PassthroughTranslationProvider(),
    warnings: [
      {
        code: "PROVIDER_NOT_CONFIGURED",
        severity: "info",
        message: "TRANSLATION_PROVIDER is passthrough. Used glossary-only preview."
      }
    ]
  };
}
