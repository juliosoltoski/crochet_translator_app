import { germanPortugueseCrochetGlossary } from "./glossary-data/de-pt-crochet";
import { validatePatternStructure } from "./formatting";
import { applyGlossaryReplacements } from "./glossary";
import { PassthroughTranslationProvider, StaticLanguageDetectionProvider } from "./providers";
import type {
  GlossaryEntry,
  LanguageCode,
  PipelineWarning,
  TranslationPipelineInput,
  TranslationPipelineResult
} from "./types";
import type { LanguageDetectionProvider, TranslationProvider } from "./providers";

export interface RunTranslationPipelineOptions {
  glossary?: GlossaryEntry[];
  languageDetectionProvider?: LanguageDetectionProvider;
  translationProvider?: TranslationProvider;
}

export async function runTranslationPipeline(
  input: TranslationPipelineInput,
  options: RunTranslationPipelineOptions = {}
): Promise<TranslationPipelineResult> {
  const glossary = options.glossary ?? germanPortugueseCrochetGlossary;
  const languageDetectionProvider =
    options.languageDetectionProvider ?? new StaticLanguageDetectionProvider(input.sourceLanguage);
  const translationProvider = options.translationProvider ?? new PassthroughTranslationProvider();
  const warnings: PipelineWarning[] = [];
  const detectedLanguage = await languageDetectionProvider.detect(input.text);

  if (!languagesCompatible(detectedLanguage, input.sourceLanguage)) {
    warnings.push({
      code: "LANGUAGE_MISMATCH",
      severity: "warning",
      message: `Detected ${detectedLanguage}, but expected ${input.sourceLanguage}.`
    });
  }

  const glossaryResult = applyGlossaryReplacements(input.text, glossary, {
    sourceLanguage: input.sourceLanguage,
    targetLanguage: input.targetLanguage,
    targetVariant: input.targetVariant,
    craft: input.craft ?? "crochet"
  });

  // TODO(provider): Replace passthrough translation with an LLM or translation API.
  // Keep provider prompts/contracts explicit about preserving counts, line breaks, and repeats.
  const translatedText = await translationProvider.translate({
    text: glossaryResult.text,
    sourceLanguage: input.sourceLanguage,
    targetLanguage: input.targetLanguage,
    targetVariant: input.targetVariant
  });

  warnings.push(...validatePatternStructure(input.text, translatedText));

  return {
    translatedText,
    detectedLanguage,
    glossaryMatches: glossaryResult.matches,
    warnings
  };
}

function languagesCompatible(detected: LanguageCode, expected: LanguageCode): boolean {
  return detected === expected || detected.startsWith(`${expected}-`);
}
