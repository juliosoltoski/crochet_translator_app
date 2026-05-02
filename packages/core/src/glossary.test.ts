import { describe, expect, it } from "vitest";
import { germanPortugueseCrochetGlossary } from "./glossary-data/de-pt-crochet";
import { applyGlossaryReplacements } from "./glossary";

describe("applyGlossaryReplacements", () => {
  it("replaces German crochet abbreviations with Portuguese equivalents", () => {
    const result = applyGlossaryReplacements(
      "R. 1: 6 Lm anschlagen, 1 fM in die 2. Lm.",
      germanPortugueseCrochetGlossary,
      {
        sourceLanguage: "de",
        targetLanguage: "pt",
        targetVariant: "pt-BR",
        craft: "crochet"
      }
    );

    expect(result.text).toContain("carreira 1");
    expect(result.text).toContain("6 correntinha");
    expect(result.text).toContain("1 ponto baixo");
    expect(result.matches.map((match) => match.entryId)).toContain(
      "crochet.de.pt.feste-masche"
    );
  });

  it("prefers longer stitch terms before generic terms", () => {
    const result = applyGlossaryReplacements(
      "1 halbes Stäbchen, 1 Stäbchen, 1 Masche",
      germanPortugueseCrochetGlossary,
      {
        sourceLanguage: "de",
        targetLanguage: "pt",
        craft: "crochet"
      }
    );

    expect(result.text).toBe("1 meio ponto alto, 1 ponto alto, 1 ponto");
  });

  it("does not replace terms embedded inside longer words", () => {
    const result = applyGlossaryReplacements(
      "Maschenprobe: 10 Maschen",
      germanPortugueseCrochetGlossary,
      {
        sourceLanguage: "de",
        targetLanguage: "pt",
        craft: "crochet"
      }
    );

    expect(result.text).toBe("Maschenprobe: 10 Maschen");
    expect(result.matches).toHaveLength(0);
  });
});
