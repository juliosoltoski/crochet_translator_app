import { GoogleGenAI } from "@google/genai";
import type { LanguageCode, TranslationProvider } from "@crochet-translator/core";

interface GeminiTranslationProviderOptions {
  apiKey: string;
  model: string;
}

export class GeminiTranslationProvider implements TranslationProvider {
  private readonly client: GoogleGenAI;
  private readonly model: string;

  constructor(options: GeminiTranslationProviderOptions) {
    this.client = new GoogleGenAI({ apiKey: options.apiKey });
    this.model = options.model;
  }

  async translate(input: {
    text: string;
    sourceLanguage: LanguageCode;
    targetLanguage: LanguageCode;
    targetVariant?: LanguageCode;
  }): Promise<string> {
    const response = await this.client.models.generateContent({
      model: this.model,
      contents: buildUserPrompt(input),
      config: {
        systemInstruction: buildInstructions(input.targetVariant),
        temperature: 0.2
      }
    });

    return (response.text ?? "").trim();
  }
}

function buildInstructions(targetVariant?: LanguageCode): string {
  const portugueseVariant =
    targetVariant === "pt-BR" ? "Brazilian Portuguese" : "European Portuguese";

  return [
    "You are a careful crochet pattern translator.",
    "Translate German crochet pattern text into Portuguese.",
    `Use ${portugueseVariant} terminology.`,
    "Preserve line breaks, row and round numbering, stitch counts, parentheses, brackets, repeats, punctuation, and abbreviations that are already in Portuguese.",
    "Do not add explanations, summaries, markdown fences, headings, or safety notes.",
    "Return only the translated pattern text."
  ].join(" ");
}

function buildUserPrompt(input: {
  text: string;
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  targetVariant?: LanguageCode;
}): string {
  return [
    `Source language: ${input.sourceLanguage}`,
    `Target language: ${input.targetVariant ?? input.targetLanguage}`,
    "",
    "Translate this crochet pattern text:",
    input.text
  ].join("\n");
}
