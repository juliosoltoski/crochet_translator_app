import { germanPortugueseCrochetGlossary } from "./glossary-data/de-pt-crochet";
import { englishPortugueseCrochetGlossary } from "./glossary-data/en-pt-crochet";
import { englishUkPortugueseCrochetGlossary } from "./glossary-data/en-uk-pt-crochet";
import { validatePatternStructure } from "./formatting";
import { applyGlossaryReplacements } from "./glossary";
import { PassthroughTranslationProvider, StaticLanguageDetectionProvider } from "./providers";

const defaultCrochetGlossary = [
  ...germanPortugueseCrochetGlossary,
  ...englishPortugueseCrochetGlossary,
  ...englishUkPortugueseCrochetGlossary
];
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
  const glossary = options.glossary ?? defaultCrochetGlossary;
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
