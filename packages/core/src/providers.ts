import type { ExtractedText, LanguageCode } from "./types";

export interface TextExtractionProvider {
  extract(input: File | Blob | string): Promise<ExtractedText>;
}

export interface LanguageDetectionProvider {
  detect(text: string): Promise<LanguageCode>;
}

export interface TranslationProvider {
  translate(input: {
    text: string;
    sourceLanguage: LanguageCode;
    targetLanguage: LanguageCode;
    targetVariant?: LanguageCode;
  }): Promise<string>;
}

export class PassthroughTranslationProvider implements TranslationProvider {
  async translate(input: {
    text: string;
    sourceLanguage: LanguageCode;
    targetLanguage: LanguageCode;
    targetVariant?: LanguageCode;
  }): Promise<string> {
    return input.text;
  }
}

export class StaticLanguageDetectionProvider implements LanguageDetectionProvider {
  constructor(private readonly language: LanguageCode) {}

  async detect(): Promise<LanguageCode> {
    return this.language;
  }
}
