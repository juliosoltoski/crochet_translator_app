import { GoogleGenAI } from "@google/genai";
import type { ExtractedText } from "@crochet-translator/core";

interface GeminiOcrProviderOptions {
  apiKey: string;
  model: string;
}

const SYSTEM_INSTRUCTION = `You are a specialist OCR system for crochet and knitting pattern documents.

COLUMN HANDLING — this is the most important rule:
- Before transcribing anything, identify how many columns of text exist on the page.
- For a two-column layout: transcribe the ENTIRE left column from top to bottom first, then transcribe the ENTIRE right column from top to bottom.
- Never read across a row and mix text from the left column and right column on the same output line.
- Each section heading (e.g. HAAR, MATERIAL, KÖRPER, ROCK, ZÖPFE) must appear on its own line exactly as printed.

FAITHFUL TRANSCRIPTION:
- Copy every character exactly as it appears. Do not paraphrase, reorder, or summarise.
- Preserve all crochet abbreviations exactly: LM, Stb, hStb, DStb, fM, fe M, Rd., R., KM, Km, wdh., zun., abn., Wdh., etc.
- Preserve all numbers, parentheses, brackets, asterisks (*), equals signs (=), commas, semicolons, and repeat markers (e.g. "3x", "[...] 4x wdh.", "ab * 2x wdh.").
- Preserve line breaks as they appear in the source. Do not join continuation lines.

INCLUDE: All text — section headings, material lists, gauge notes, row-by-row instructions, stitch counts, finishing notes.
EXCLUDE: Photographs of finished items, decorative images, page numbers, ISBN or publisher information.

If no pattern text is found, return exactly: EMPTY`;


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
