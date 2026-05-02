import { describe, expect, it } from "vitest";
import { validatePatternStructure } from "./formatting";
import { runTranslationPipeline } from "./pipeline";

describe("formatting preservation", () => {
  it("keeps line breaks and repeat punctuation through glossary pass", async () => {
    const source = [
      "Rd. 1: 6 fM in den Fadenring (6 M)",
      "Rd. 2: (2 fM in jede M) 6x (12 M)"
    ].join("\n");

    const result = await runTranslationPipeline({
      text: source,
      sourceLanguage: "de",
      targetLanguage: "pt",
      targetVariant: "pt-PT",
      craft: "crochet"
    });

    expect(result.translatedText.split("\n")).toHaveLength(2);
    expect(result.translatedText).toContain("(6 ponto)");
    expect(result.translatedText).toContain("6x");
    expect(result.warnings).toEqual([]);
  });

  it("warns when translated output changes structure", () => {
    const warnings = validatePatternStructure("Rd. 1: (6 M)", "Volta 1: (6 pontos");

    expect(warnings.map((warning) => warning.code)).toContain("UNBALANCED_PARENTHESES");
  });
});
