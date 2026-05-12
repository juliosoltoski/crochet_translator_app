import type { ExtractedText, PipelineWarning } from "@crochet-translator/core";
import * as pdfjs from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";
import {
  preprocessCanvasForOcr,
  preprocessImageForOcr,
  type ImagePreprocessingCandidate,
  type OcrSegmentationMode
} from "./imagePreprocessing";

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const MIN_SELECTABLE_PDF_CHARACTERS = 200;
const MAX_OCR_PDF_PAGES = 5;
const PDF_RENDER_SCALE = 3;
const OCR_LANGUAGE = "deu";

type PdfTextItem = {
  str: string;
  transform: unknown[];
  hasEOL?: boolean;
};

type PdfDocumentProxy = Awaited<ReturnType<typeof pdfjs.getDocument>["promise"]>;
type TesseractModule = typeof import("tesseract.js");
type ImageLike = Parameters<TesseractModule["recognize"]>[0];

interface OcrResult {
  text: string;
  confidence: number;
  candidateLabel?: string;
}

export async function extractTextTransiently(file: File): Promise<ExtractedText> {
  try {
    if (isTextFile(file)) {
      return {
        text: await file.text(),
        confidence: 1
      };
    }

    if (isPdfFile(file)) {
      return await extractPdfText(file);
    }

    if (file.type.startsWith("image/")) {
      return await extractImageText(file);
    }

    return {
      text: "",
      confidence: 0,
      warnings: [
        {
          code: "PROVIDER_NOT_CONFIGURED",
          severity: "warning",
          message: "This file type is not supported yet."
        }
      ]
    };
  } catch (error) {
    return {
      text: "",
      confidence: 0,
      warnings: [
        {
          code: "EXTRACTION_FAILED",
          severity: "error",
          message: extractionErrorMessage(error)
        }
      ]
    };
  }
}

async function extractPdfText(file: File): Promise<ExtractedText> {
  const warnings: PipelineWarning[] = [];
  const bytes = new Uint8Array(await file.arrayBuffer());
  const loadingTask = pdfjs.getDocument({ data: bytes });
  const pdf = await loadingTask.promise;

  try {
    const pageTexts: string[] = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const pageText = textItemsToLines(content.items).trim();

      if (pageText) {
        pageTexts.push(pageText);
      }

      page.cleanup();
    }

    const selectableText = normalizeExtractedText(pageTexts.join("\n\n"));

    if (selectableText.replace(/\s/g, "").length >= MIN_SELECTABLE_PDF_CHARACTERS) {
      return {
        text: selectableText,
        confidence: 0.9,
        warnings
      };
    }

    warnings.push({
      code: "PDF_TEXT_LAYER_EMPTY",
      severity: "warning",
      message: "No useful selectable text was found in the PDF."
    });

    warnings.push({
      code: "OCR_FALLBACK_USED",
      severity: "info",
      message: "The PDF appears to be scanned, so OCR was used."
    });

    return await extractScannedPdfText(pdf, warnings);
  } finally {
    await pdf.destroy();
  }
}

async function extractScannedPdfText(
  pdf: PdfDocumentProxy,
  warnings: PipelineWarning[]
): Promise<ExtractedText> {
  const pageLimit = Math.min(pdf.numPages, MAX_OCR_PDF_PAGES);
  const pageTexts: string[] = [];
  const confidences: number[] = [];

  if (pdf.numPages > MAX_OCR_PDF_PAGES) {
    warnings.push({
      code: "OCR_PAGE_LIMIT",
      severity: "warning",
      message: `OCR was limited to the first ${MAX_OCR_PDF_PAGES} pages for responsiveness.`
    });
  }

  for (let pageNumber = 1; pageNumber <= pageLimit; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Canvas rendering is unavailable in this browser.");
    }

    const viewport = page.getViewport({ scale: PDF_RENDER_SCALE });
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);

    await page.render({
      canvasContext: context,
      viewport,
      background: "rgb(255,255,255)"
    }).promise;

    const preprocessed = preprocessCanvasForOcr(canvas, {
      maxCandidates: 2,
      segmentationMode: "auto"
    });
    const result = await recognizeBestCandidate(preprocessed.candidates);
    pageTexts.push(result.text.trim());
    confidences.push(result.confidence);
    warnings.push(...preprocessingWarnings(preprocessed.warnings));
    page.cleanup();
  }

  return {
    text: normalizeExtractedText(pageTexts.join("\n\n")),
    confidence: averageConfidence(confidences),
    warnings
  };
}

async function extractImageText(file: File): Promise<ExtractedText> {
  const preprocessed = await preprocessImageForOcr(file, {
    segmentationMode: "single-column"
  });
  const result = await recognizeBestCandidate(preprocessed.candidates);

  return {
    text: normalizeExtractedText(result.text),
    confidence: result.confidence,
    warnings: preprocessingWarnings([
      ...preprocessed.warnings,
      `Selected OCR variant: ${result.candidateLabel ?? "unknown"}.`
    ])
  };
}

async function recognizeImage(
  worker: Awaited<ReturnType<TesseractModule["createWorker"]>>,
  image: ImageLike,
  segmentationMode: OcrSegmentationMode
): Promise<OcrResult> {
  const tesseract = await loadTesseract();

  await worker.setParameters({
    preserve_interword_spaces: "1",
    user_defined_dpi: "300",
    tessedit_pageseg_mode:
      segmentationMode === "single-column" ? tesseract.PSM.SINGLE_BLOCK : tesseract.PSM.AUTO
  });

  const result = await worker.recognize(image);

  return {
    text: normalizeOcrText(result.data.text),
    confidence: result.data.confidence / 100
  };
}

async function recognizeBestCandidate(
  candidates: ImagePreprocessingCandidate[]
): Promise<OcrResult> {
  const tesseract = await loadTesseract();
  const worker = await tesseract.createWorker(OCR_LANGUAGE, tesseract.OEM.LSTM_ONLY, {
    logger: () => undefined
  });
  let bestResult: OcrResult | null = null;

  try {
    for (const candidate of candidates) {
      const result = await recognizeImage(worker, candidate.canvas, candidate.segmentationMode);
      const scoredResult = {
        ...result,
        candidateLabel: candidate.label
      };

      if (!bestResult || scoreOcrResult(scoredResult) > scoreOcrResult(bestResult)) {
        bestResult = scoredResult;
      }
    }
  } finally {
    await worker.terminate();
  }

  if (!bestResult) {
    return {
      text: "",
      confidence: 0
    };
  }

  return bestResult;
}

async function loadTesseract(): Promise<TesseractModule> {
  const module = await import("tesseract.js");
  return ("default" in module ? module.default : module) as TesseractModule;
}

function textItemsToLines(items: Array<unknown>): string {
  const positionedItems = items.filter(isPdfTextItem).map((item) => ({
    text: item.str.trim(),
    x: Number(item.transform[4] ?? 0),
    y: Number(item.transform[5] ?? 0),
    hasEOL: item.hasEOL ?? false
  }));

  if (positionedItems.length === 0) {
    return "";
  }

  const hasUsablePositions = positionedItems.some((item) => item.x !== 0 || item.y !== 0);

  if (!hasUsablePositions) {
    return positionedItems
      .map((item) => `${item.text}${item.hasEOL ? "\n" : " "}`)
      .join("")
      .replace(/[ \t]+\n/g, "\n");
  }

  const lines: Array<{ y: number; items: typeof positionedItems }> = [];

  for (const item of positionedItems.filter((entry) => entry.text.length > 0)) {
    const existingLine = lines.find((line) => Math.abs(line.y - item.y) < 3);

    if (existingLine) {
      existingLine.items.push(item);
      existingLine.y = (existingLine.y + item.y) / 2;
    } else {
      lines.push({ y: item.y, items: [item] });
    }
  }

  return lines
    .sort((a, b) => b.y - a.y)
    .map((line) =>
      line.items
        .sort((a, b) => a.x - b.x)
        .map((item) => item.text)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim()
    )
    .filter(Boolean)
    .join("\n");
}

function isPdfTextItem(item: unknown): item is PdfTextItem {
  return (
    typeof item === "object" &&
    item !== null &&
    "str" in item &&
    typeof (item as PdfTextItem).str === "string" &&
    Array.isArray((item as PdfTextItem).transform)
  );
}

function normalizeExtractedText(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function averageConfidence(confidences: number[]): number {
  if (confidences.length === 0) {
    return 0;
  }

  return confidences.reduce((sum, value) => sum + value, 0) / confidences.length;
}

function isTextFile(file: File): boolean {
  return file.type.startsWith("text/") || file.name.endsWith(".txt") || file.name.endsWith(".md");
}

function isPdfFile(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

function extractionErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return `Text extraction failed: ${error.message}`;
  }

  return "Text extraction failed.";
}

function preprocessingWarnings(messages: string[]): PipelineWarning[] {
  return messages.map((message) => ({
    code: "OCR_PREPROCESSING_APPLIED",
    severity: "info",
    message
  }));
}

const CROCHET_TOKEN_REGEX =
  /\b(?:Rd|Runde|Runden|Reihe|fM|LM|Lm|Luftm|Luftmasche|Stb|hStb|DStb|KM|Km|Kettm|Kettmasche|zun|abn|Wdh|wdh|WLM|Fadenring|Maschenring|wenden|zunehmen|abnehmen|wiederholen)\b/giu;

function scoreOcrResult(result: OcrResult): number {
  const text = result.text;
  const crochetTokenMatches = text.match(CROCHET_TOKEN_REGEX) ?? [];
  const lineCount = text.split(/\n/u).filter((line) => line.trim().length > 0).length;
  const alphanumericCount = (text.match(/[\p{L}\p{N}]/gu) ?? []).length;
  const qualityRatio = text.length > 0 ? alphanumericCount / text.length : 0;

  return result.confidence + crochetTokenMatches.length * 0.015 + lineCount * 0.002 + qualityRatio * 0.05;
}

function normalizeOcrText(text: string): string {
  return (
    text
      // Replace lowercase l with digit 1 when adjacent to digits (e.g. "l2" → "12", "6xl" → "6x1")
      .replace(/(?<=\d)l(?=\d)/gu, "1")
      .replace(/(?<=\d)l\b/gu, "1")
      .replace(/\bl(?=\d)/gu, "1")
      // Repair "Rd l:" / "R l:" patterns — l after structure abbreviation is almost certainly 1
      .replace(/\b(Rd|R)\.\s+l\b/gu, "$1. 1")
  );
}
