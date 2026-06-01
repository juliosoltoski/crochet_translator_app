import { useMemo, useState, type ChangeEvent } from "react";
import { Languages, Upload } from "lucide-react";
import {
  germanPortugueseCrochetGlossary,
  englishPortugueseCrochetGlossary,
  type GlossaryMatch,
  type ExtractedText,
  type LanguageCode,
  type PipelineWarning
} from "@crochet-translator/core";
import { extractTextTransiently } from "./services/transientExtraction";
import { translatePattern } from "./services/translationClient";

const SAMPLE_PATTERNS: Record<string, string> = {
  de: `Rd. 1: 6 fM in den Fadenring (6 M)
Rd. 2: (2 fM in jede M) 6x (12 M)
R. 3: 1 Lm, wenden, 12 fM`,
  en: `Rnd 1: 6 sc in magic ring (6 sts)
Rnd 2: 2 sc in each st around (6 inc) (12 sts)
Row 3: ch 1, turn, 12 sc`
};

export function App() {
  const [sourceLanguage, setSourceLanguage] = useState<LanguageCode>("de");
  const [sourceText, setSourceText] = useState(SAMPLE_PATTERNS["de"]);
  const [targetVariant, setTargetVariant] = useState<LanguageCode>("pt-PT");
  const [translatedText, setTranslatedText] = useState("");
  const [warnings, setWarnings] = useState<PipelineWarning[]>([]);
  const [matches, setMatches] = useState<GlossaryMatch[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Ready");
  const [providerName, setProviderName] = useState("local passthrough");
  const [showMultiColumnHint, setShowMultiColumnHint] = useState(false);

  const matchedTermCount = useMemo(() => matches.length, [matches]);
  const activeGlossary = useMemo(
    () => (sourceLanguage === "en" ? englishPortugueseCrochetGlossary : germanPortugueseCrochetGlossary),
    [sourceLanguage]
  );

  async function handleTranslate() {
    await translateText(sourceText);
  }

  async function translateText(text: string, extractionWarnings: PipelineWarning[] = []) {
    if (!text.trim()) {
      setTranslatedText("");
      setMatches([]);
      setWarnings(extractionWarnings);
      setStatusMessage("No text extracted");
      return;
    }

    setIsProcessing(true);
    setStatusMessage("Translating");

    try {
      const result = await translatePattern({
        text,
        sourceLanguage,
        targetLanguage: "pt",
        targetVariant,
        craft: "crochet"
      });

      setTranslatedText(result.translatedText);
      setWarnings([...extractionWarnings, ...result.warnings]);
      setMatches(result.glossaryMatches);
      setProviderName(result.providerName);
      setStatusMessage("Ready");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setShowMultiColumnHint(false);
    setIsProcessing(true);
    setStatusMessage("Extracting text");

    if (file.type.startsWith("image/")) {
      const isWide = await checkImageIsWide(file);
      setShowMultiColumnHint(isWide);
    }

    try {
      const extracted = await extractTextTransiently(file);
      const extractionWarnings = warningsForExtraction(extracted);
      setWarnings(extractionWarnings);
      setMatches([]);

      if (extracted.text.trim()) {
        setSourceText(extracted.text);
        await translateText(extracted.text, extractionWarnings);
      } else {
        setTranslatedText("");
        setStatusMessage("No text extracted");
      }
    } finally {
      setIsProcessing(false);
      event.target.value = "";
    }
  }

  return (
    <main className="app-shell">
      <section className="workspace" aria-labelledby="page-title">
        <div className="masthead">
          <div>
            <p className="eyebrow">German / English to Portuguese crochet</p>
            <h1 id="page-title">Crochet Translator</h1>
          </div>
          <div className="privacy-pill" aria-label="Privacy mode">
            transient processing
          </div>
        </div>

        <div className="controls" aria-label="Translation settings">
          <label className="field">
            <span>Source language</span>
            <select
              value={sourceLanguage}
              onChange={(event) => {
                const lang = event.target.value;
                setSourceLanguage(lang);
                setSourceText(SAMPLE_PATTERNS[lang] ?? SAMPLE_PATTERNS["de"]);
                setTranslatedText("");
                setMatches([]);
                setWarnings([]);
              }}
            >
              <option value="de">German</option>
              <option value="en">English (US)</option>
            </select>
          </label>

          <label className="field">
            <span>Portuguese variant</span>
            <select
              value={targetVariant}
              onChange={(event) => setTargetVariant(event.target.value)}
            >
              <option value="pt-PT">European Portuguese</option>
              <option value="pt-BR">Brazilian Portuguese</option>
            </select>
          </label>

          <label className="file-button">
            <input
              type="file"
              accept="image/*,.pdf,.txt,.md,text/plain"
              onChange={handleFileChange}
            />
            <Upload aria-hidden="true" size={18} />
            <span>Upload image, PDF, or text</span>
          </label>
        </div>

        {showMultiColumnHint && (
          <p className="notice info" role="note">
            Multi-column layout detected. For best results, crop the image to one column before uploading.
          </p>
        )}

        <div className="editor-grid">
          <section className="panel" aria-labelledby="source-heading">
            <div className="panel-heading">
              <h2 id="source-heading">Source</h2>
              <span>{sourceLanguage === "en" ? "English (US) crochet text" : "German crochet text"}</span>
            </div>
            <textarea
              value={sourceText}
              onChange={(event) => setSourceText(event.target.value)}
              spellCheck={false}
              aria-label={sourceLanguage === "en" ? "English crochet source text" : "German crochet source text"}
            />
          </section>

          <section className="panel" aria-labelledby="translation-heading">
            <div className="panel-heading">
              <h2 id="translation-heading">Translation</h2>
              <span>Portuguese terminology preview</span>
            </div>
            <output className="translation-output" aria-live="polite">
              {translatedText || "Run translation to preview glossary-aware output."}
            </output>
          </section>
        </div>

        <div className="actions">
          <button type="button" onClick={handleTranslate} disabled={isProcessing}>
            <Languages aria-hidden="true" size={18} />
            <span>{isProcessing ? "Processing..." : "Translate"}</span>
          </button>
          <p>
            {matchedTermCount > 0
              ? `${matchedTermCount} glossary matches found`
              : `${activeGlossary.length} glossary terms loaded`}
            {" - "}
            {providerName}
            {" - "}
            {statusMessage}
          </p>
        </div>

        {warnings.length > 0 && (
          <section className="notice-list" aria-label="Warnings">
            {warnings.map((warning, index) => (
              <article className={`notice ${warning.severity}`} key={`${warning.code}-${index}`}>
                <strong>{warning.code}</strong>
                <span>{warning.message}</span>
              </article>
            ))}
          </section>
        )}

        {matches.length > 0 && (
          <section className="matches" aria-labelledby="matches-heading">
            <h2 id="matches-heading">Glossary Matches</h2>
            <div className="match-table" role="table">
              <div className="match-row header" role="row">
                <span role="columnheader">Source</span>
                <span role="columnheader">Portuguese</span>
                <span role="columnheader">Type</span>
              </div>
              {matches.map((match, index) => (
                <div className="match-row" role="row" key={`${match.entryId}-${index}`}>
                  <span role="cell">{match.source}</span>
                  <span role="cell">{match.target}</span>
                  <span role="cell">{match.kind}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}

async function checkImageIsWide(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img.width > img.height * 1.4);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(false);
    };

    img.src = url;
  });
}

function warningsForExtraction(extracted: ExtractedText): PipelineWarning[] {
  const warnings = [...(extracted.warnings ?? [])];

  if (extracted.confidence !== undefined && extracted.confidence < 0.75) {
    warnings.push({
      code: "LOW_EXTRACTION_CONFIDENCE",
      severity: "warning",
      message: "Extraction confidence is low. Check the source text before translating."
    });
  }

  return warnings;
}
