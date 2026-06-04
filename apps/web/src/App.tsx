import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { Copy, Download, Languages, Upload } from "lucide-react";
import {
  germanPortugueseCrochetGlossary,
  englishPortugueseCrochetGlossary,
  englishUkPortugueseCrochetGlossary,
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
Row 3: ch 1, turn, 12 sc`,
  "en-UK": `Rnd 1: 6 dc into magic ring (6 sts)
Rnd 2: 2 dc into each st (6 inc) (12 sts)
Row 3: 1 ch, turn, 12 dc`
};

export function App() {
  const [sourceLanguage, setSourceLanguage] = useState<LanguageCode>("de");
  const [sourceText, setSourceText] = useState(SAMPLE_PATTERNS["de"]);
  const [targetVariant, setTargetVariant] = useState<LanguageCode>(
    () => localStorage.getItem("targetVariant") ?? "pt-PT"
  );
  const [translatedText, setTranslatedText] = useState("");
  const [warnings, setWarnings] = useState<PipelineWarning[]>([]);
  const [matches, setMatches] = useState<GlossaryMatch[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Ready");
  const [providerName, setProviderName] = useState("local passthrough");
  const [showMultiColumnHint, setShowMultiColumnHint] = useState(false);
  const [copied, setCopied] = useState(false);
  const activeControllerRef = useRef<AbortController | null>(null);

  const matchedTermCount = useMemo(() => matches.length, [matches]);
  const activeGlossary = useMemo(() => {
    if (sourceLanguage === "en") return englishPortugueseCrochetGlossary;
    if (sourceLanguage === "en-UK") return englishUkPortugueseCrochetGlossary;
    return germanPortugueseCrochetGlossary;
  }, [sourceLanguage]);

  function handleCancel() {
    activeControllerRef.current?.abort();
    activeControllerRef.current = null;
    setIsProcessing(false);
    setStatusMessage("Ready");
  }

  async function handleTranslate() {
    activeControllerRef.current?.abort();
    const controller = new AbortController();
    activeControllerRef.current = controller;
    try {
      await translateText(sourceText, [], controller.signal);
    } catch (err) {
      if (!isAbortError(err)) throw err;
    } finally {
      if (activeControllerRef.current === controller) activeControllerRef.current = null;
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function handleDownload() {
    const blob = new Blob([translatedText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "translation.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function translateText(
    text: string,
    extractionWarnings: PipelineWarning[] = [],
    signal?: AbortSignal
  ) {
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
        craft: "crochet",
        signal
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

    activeControllerRef.current?.abort();
    const controller = new AbortController();
    activeControllerRef.current = controller;

    setShowMultiColumnHint(false);
    setIsProcessing(true);
    setStatusMessage("Extracting text");

    if (file.type.startsWith("image/")) {
      const isWide = await checkImageIsWide(file);
      setShowMultiColumnHint(isWide);
    }

    try {
      const extracted = await extractTextTransiently(file, {
        signal: controller.signal,
        onProgress: (msg) => setStatusMessage(msg)
      });
      const extractionWarnings = warningsForExtraction(extracted);
      setWarnings(extractionWarnings);
      setMatches([]);

      if (extracted.text.trim()) {
        setSourceText(extracted.text);
        await translateText(extracted.text, extractionWarnings, controller.signal);
      } else {
        setTranslatedText("");
        setStatusMessage("No text extracted");
      }
    } catch (err) {
      if (!isAbortError(err)) throw err;
    } finally {
      setIsProcessing(false);
      event.target.value = "";
      if (activeControllerRef.current === controller) activeControllerRef.current = null;
    }
  }

  return (
    <main className="app-shell">
      <section className="workspace" aria-labelledby="page-title">
        <div className="masthead">
          <div>
            <p className="eyebrow">German / English (US &amp; UK) to Portuguese crochet</p>
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
              <option value="en-UK">English (UK)</option>
            </select>
          </label>

          <label className="field">
            <span>Portuguese variant</span>
            <select
              value={targetVariant}
              onChange={(event) => {
                localStorage.setItem("targetVariant", event.target.value);
                setTargetVariant(event.target.value);
              }}
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
              <span>{sourcePanelLabel(sourceLanguage)}</span>
            </div>
            <textarea
              value={sourceText}
              onChange={(event) => setSourceText(event.target.value)}
              spellCheck={false}
              aria-label={`${sourcePanelLabel(sourceLanguage)} source text`}
            />
          </section>

          <section className="panel" aria-labelledby="translation-heading">
            <div className="panel-heading">
              <h2 id="translation-heading">Translation</h2>
              <div className="panel-actions">
                <span>Portuguese terminology preview</span>
                {translatedText && (
                  <>
                    <button type="button" onClick={handleCopy} aria-label="Copy translation to clipboard">
                      <Copy aria-hidden="true" size={15} />
                      <span>{copied ? "Copied!" : "Copy"}</span>
                    </button>
                    <button type="button" onClick={handleDownload} aria-label="Download translation as text file">
                      <Download aria-hidden="true" size={15} />
                      <span>Download</span>
                    </button>
                  </>
                )}
              </div>
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
          {isProcessing && (
            <button type="button" className="cancel-button" onClick={handleCancel}>
              Cancel
            </button>
          )}
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

function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError";
}

function sourcePanelLabel(lang: string): string {
  if (lang === "en") return "English (US) crochet text";
  if (lang === "en-UK") return "English (UK) crochet text";
  return "German crochet text";
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
