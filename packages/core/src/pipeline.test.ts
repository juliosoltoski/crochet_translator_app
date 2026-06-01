import { describe, expect, it } from "vitest";
import { runTranslationPipeline } from "./pipeline";
import type { TranslationProvider } from "./providers";

describe("runTranslationPipeline", () => {
  it("German input: applies glossary replacement then calls provider", async () => {
    const provider: TranslationProvider = {
      async translate(input) {
        return input.text.replace("pontos baixos", "PB");
      }
    };

    const result = await runTranslationPipeline(
      {
        text: "Rd. 1: 6 fM (6 M)",
        sourceLanguage: "de",
        targetLanguage: "pt",
        targetVariant: "pt-PT",
        craft: "crochet"
      },
      { translationProvider: provider }
    );

    expect(result.translatedText).toContain("6 PB");
    expect(result.glossaryMatches.some((match) => match.source === "fM")).toBe(true);
  });

  it("English input: applies English glossary replacement and passes sourceLanguage to provider", async () => {
    let capturedSourceLanguage: string | undefined;

    const provider: TranslationProvider = {
      async translate(input) {
        capturedSourceLanguage = input.sourceLanguage;
        return input.text;
      }
    };

    const result = await runTranslationPipeline(
      {
        text: "Rnd 1: 6 sc in magic ring (6 sts)",
        sourceLanguage: "en",
        targetLanguage: "pt",
        targetVariant: "pt-PT",
        craft: "crochet"
      },
      { translationProvider: provider }
    );

    expect(capturedSourceLanguage).toBe("en");
    expect(result.glossaryMatches.some((m) => m.source === "sc")).toBe(true);
    expect(result.glossaryMatches.some((m) => m.source === "magic ring")).toBe(true);
    // "sc" → "ponto baixo" (singular: count=6 but the regex looks at text before match)
    // "magic ring" → "anel mágico"
    expect(result.translatedText).toContain("anel mágico");
  });

  it("German input does not match English-only abbreviations", async () => {
    const result = await runTranslationPipeline({
      text: "6 sc in magic ring (6 sts)",
      sourceLanguage: "de",
      targetLanguage: "pt",
      craft: "crochet"
    });

    // No glossary matches expected because these are English terms and source is German
    expect(result.glossaryMatches).toHaveLength(0);
    expect(result.translatedText).toContain("sc");
  });

  it("English input does not match German-only abbreviations", async () => {
    const result = await runTranslationPipeline({
      text: "6 fM in den Fadenring (6 M)",
      sourceLanguage: "en",
      targetLanguage: "pt",
      craft: "crochet"
    });

    // No glossary matches expected because these are German terms and source is English
    expect(result.glossaryMatches).toHaveLength(0);
    expect(result.translatedText).toContain("fM");
  });

  it("ambiguous/mixed input: emits LANGUAGE_MISMATCH warning when detected differs from declared", async () => {
    // Simulate a detector that guesses "de" when the caller said "en"
    const result = await runTranslationPipeline(
      {
        text: "6 sc, 3 fM",
        sourceLanguage: "en",
        targetLanguage: "pt",
        craft: "crochet"
      },
      {
        languageDetectionProvider: { detect: async () => "de" }
      }
    );

    expect(result.warnings.some((w) => w.code === "LANGUAGE_MISMATCH")).toBe(true);
  });
});
