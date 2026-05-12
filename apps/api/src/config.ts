import { config as loadEnvFile } from "dotenv";

loadEnvFile({ path: new URL("../../../.env", import.meta.url) });
loadEnvFile();

export type TranslationProviderName = "passthrough" | "gemini";
export type OcrProviderName = "passthrough" | "gemini";

export interface ApiConfig {
  port: number;
  corsOrigin: string;
  provider: TranslationProviderName;
  ocrProvider: OcrProviderName;
  geminiApiKey?: string;
  geminiModel: string;
  geminiOcrModel: string;
  maxInputCharacters: number;
  maxOcrImageBytes: number;
}

export function loadConfig(): ApiConfig {
  return {
    port: numberFromEnv("PORT", 8787),
    corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
    provider: providerFromEnv(process.env.TRANSLATION_PROVIDER),
    ocrProvider: ocrProviderFromEnv(process.env.OCR_PROVIDER),
    geminiApiKey: process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY,
    geminiModel: process.env.GEMINI_TRANSLATION_MODEL ?? "gemini-2.5-flash",
    geminiOcrModel: process.env.GEMINI_OCR_MODEL ?? "gemini-2.5-flash",
    maxInputCharacters: numberFromEnv("MAX_TRANSLATION_INPUT_CHARACTERS", 50000),
    maxOcrImageBytes: numberFromEnv("MAX_OCR_IMAGE_BYTES", 10 * 1024 * 1024)
  };
}

function providerFromEnv(value: string | undefined): TranslationProviderName {
  if (value === "gemini") {
    return "gemini";
  }

  return "passthrough";
}

function ocrProviderFromEnv(value: string | undefined): OcrProviderName {
  if (value === "gemini") {
    return "gemini";
  }

  return "passthrough";
}

function numberFromEnv(name: string, fallback: number): number {
  const parsed = Number(process.env[name]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
