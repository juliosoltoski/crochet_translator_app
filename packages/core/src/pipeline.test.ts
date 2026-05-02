import { describe, expect, it } from "vitest";
import { runTranslationPipeline } from "./pipeline";
import type { TranslationProvider } from "./providers";

describe("runTranslationPipeline", () => {
  it("uses an injected translation provider after glossary replacement", async () => {
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
});
