export type Craft = "crochet" | "knitting";

export type LanguageCode = "de" | "pt" | "pt-PT" | "pt-BR" | string;

export type GlossaryTermKind =
  | "stitch"
  | "abbreviation"
  | "instruction"
  | "structure"
  | "tool"
  | "material";

export interface GlossaryEntry {
  id: string;
  craft: Craft;
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  source: string;
  aliases?: string[];
  target: string;
  targetVariants?: Partial<Record<LanguageCode, string>>;
  pluralTarget?: string;
  pluralTargetVariants?: Partial<Record<LanguageCode, string>>;
  kind: GlossaryTermKind;
  confidence: number;
  notes?: string;
  wholeWord?: boolean;
  caseSensitive?: boolean;
}

export interface GlossaryMatch {
  entryId: string;
  source: string;
  target: string;
  index: number;
  kind: GlossaryTermKind;
}

export interface GlossaryReplacementOptions {
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  targetVariant?: LanguageCode;
  craft?: Craft;
}

export interface GlossaryReplacementResult {
  text: string;
  matches: GlossaryMatch[];
}

export interface PipelineWarning {
  code:
    | "LOW_EXTRACTION_CONFIDENCE"
    | "PDF_TEXT_LAYER_EMPTY"
    | "OCR_FALLBACK_USED"
    | "OCR_PAGE_LIMIT"
    | "OCR_PREPROCESSING_APPLIED"
    | "EXTRACTION_FAILED"
    | "LANGUAGE_MISMATCH"
    | "UNBALANCED_PARENTHESES"
    | "COUNT_TOKEN_DRIFT"
    | "LINE_COUNT_DRIFT"
    | "PROVIDER_NOT_CONFIGURED"
    | "TRANSLATION_PROVIDER_UNAVAILABLE"
    | "TRANSLATION_FAILED";
  message: string;
  severity: "info" | "warning" | "error";
}

export interface ExtractedText {
  text: string;
  confidence?: number;
  warnings?: PipelineWarning[];
}

export interface TranslationPipelineInput {
  text: string;
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  targetVariant?: LanguageCode;
  craft?: Craft;
}

export interface TranslationPipelineResult {
  translatedText: string;
  detectedLanguage?: LanguageCode;
  glossaryMatches: GlossaryMatch[];
  warnings: PipelineWarning[];
}
