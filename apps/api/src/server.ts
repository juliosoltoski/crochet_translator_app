import cors from "cors";
import express from "express";
import {
  runTranslationPipeline,
  type Craft,
  type LanguageCode,
  type PipelineWarning,
  type TranslationPipelineResult
} from "@crochet-translator/core";
import { loadConfig } from "./config";
import { createTranslationProvider } from "./translationProviderFactory";

interface TranslateRequestBody {
  text?: unknown;
  sourceLanguage?: unknown;
  targetLanguage?: unknown;
  targetVariant?: unknown;
  craft?: unknown;
}

interface TranslateResponseBody extends TranslationPipelineResult {
  provider: string;
}

const config = loadConfig();
const app = express();

app.disable("x-powered-by");
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_request, response) => {
  response.json({
    ok: true,
    provider: config.provider,
    storesRecipeContent: false
  });
});

app.post("/api/translate", async (request, response) => {
  const parsed = parseTranslateRequest(request.body, config.maxInputCharacters);

  if (!parsed.ok) {
    response.status(400).json({ error: parsed.error });
    return;
  }

  try {
    const providerBundle = createTranslationProvider(config);
    const result = await runTranslationPipeline(parsed.value, {
      translationProvider: providerBundle.provider
    });

    const body: TranslateResponseBody = {
      ...result,
      warnings: [...providerBundle.warnings, ...result.warnings],
      provider: providerBundle.name
    };

    response.json(body);
  } catch (error) {
    const warning: PipelineWarning = {
      code: "TRANSLATION_FAILED",
      severity: "error",
      message: translationErrorMessage(error)
    };

    response.status(502).json({
      error: warning.message,
      warnings: [warning]
    });
  }
});

app.listen(config.port, () => {
  process.stdout.write(
    `Crochet translator API listening on http://localhost:${config.port} with ${config.provider} provider\n`
  );
});

function parseTranslateRequest(
  body: TranslateRequestBody,
  maxInputCharacters: number
):
  | {
      ok: true;
      value: {
        text: string;
        sourceLanguage: LanguageCode;
        targetLanguage: LanguageCode;
        targetVariant?: LanguageCode;
        craft: Craft;
      };
    }
  | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Request body must be a JSON object." };
  }

  if (typeof body.text !== "string" || body.text.trim().length === 0) {
    return { ok: false, error: "Text is required." };
  }

  if (body.text.length > maxInputCharacters) {
    return {
      ok: false,
      error: `Text exceeds the ${maxInputCharacters} character limit.`
    };
  }

  return {
    ok: true,
    value: {
      text: body.text,
      sourceLanguage: stringOrDefault(body.sourceLanguage, "de"),
      targetLanguage: stringOrDefault(body.targetLanguage, "pt"),
      targetVariant:
        typeof body.targetVariant === "string" && body.targetVariant.length > 0
          ? body.targetVariant
          : undefined,
      craft: body.craft === "knitting" ? "knitting" : "crochet"
    }
  };
}

function stringOrDefault(value: unknown, fallback: string): string {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function translationErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return `Translation provider failed: ${error.message}`;
  }

  return "Translation provider failed.";
}
