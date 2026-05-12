import { GoogleGenAI } from "@google/genai";
import type { ExtractedText } from "@crochet-translator/core";

interface GeminiOcrProviderOptions {
  apiKey: string;
  model: string;
}

const SYSTEM_INSTRUCTION = [
  "You are an expert at reading and extracting text from images of crochet and knitting patterns.",
  "Your task is to extract all crochet pattern text from the image.",
  "Rules:",
  "- Return only the pattern text, preserving every row/round, stitch count, abbreviation, parenthesis, repeat marker, and line break exactly as they appear.",
  "- Read columns in correct left-to-right, top-to-bottom reading order.",
  "- Ignore photographs of finished items, product photos, decorative headings, page numbers, and advertisements.",
  "- Do not translate, summarize, explain, or add any text that is not in the image.",
  "- If no pattern text is found, return the single word: EMPTY"
].join(" ");

export class GeminiOcrProvider {
  private readonly client: GoogleGenAI;
  private readonly model: string;

  constructor(options: GeminiOcrProviderOptions) {
    this.client = new GoogleGenAI({ apiKey: options.apiKey });
    this.model = options.model;
  }

  async extract(imageBase64: string, mimeType: string): Promise<ExtractedText> {
    const response = await this.client.models.generateContent({
      model: this.model,
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType,
                data: imageBase64
              }
            },
            {
              text: "Extract all crochet pattern text from this image."
            }
          ]
        }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.1
      }
    });

    const text = (response.text ?? "").trim();

    if (!text || text === "EMPTY") {
      return {
        text: "",
        confidence: 0,
        warnings: [
          {
            code: "EXTRACTION_FAILED",
            severity: "warning",
            message: "Gemini Vision found no pattern text in the image."
          }
        ]
      };
    }

    return {
      text,
      confidence: 0.92
    };
  }
}
