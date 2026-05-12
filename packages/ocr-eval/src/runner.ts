import { readFile } from "node:fs/promises";
import { extname } from "node:path";
import { createCanvas, loadImage } from "canvas";
import type { OcrMetrics } from "./metrics.js";
import { computeMetrics } from "./metrics.js";

export interface FixtureResult {
  fixture: string;
  groundTruth: string;
  ocrText: string;
  metrics: OcrMetrics;
  durationMs: number;
  error?: string;
}

const MAX_LONG_EDGE = 2800;
const TARGET_MIN_TEXT_EDGE = 1800;

/**
 * Run OCR on an image fixture using Tesseract.js (Node path, no browser).
 * This mirrors the browser preprocessing pipeline in imagePreprocessing.ts.
 */
export async function runFixture(
  imagePath: string,
  groundTruthPath: string
): Promise<FixtureResult> {
  const fixture = imagePath.split("/").pop() ?? imagePath;
  const start = Date.now();

  let groundTruth = "";
  let ocrText = "";

  try {
    groundTruth = (await readFile(groundTruthPath, "utf8")).trim();
  } catch {
    return {
      fixture,
      groundTruth: "",
      ocrText: "",
      metrics: computeMetrics("", ""),
      durationMs: 0,
      error: `Ground truth not found: ${groundTruthPath}`
    };
  }

  try {
    const imageBuffer = await readFile(imagePath);
    const mimeType = mimeFromPath(imagePath);
    const dataUrl = `data:${mimeType};base64,${imageBuffer.toString("base64")}`;

    const sourceImage = await loadImage(dataUrl);
    const sourceCanvas = createCanvas(sourceImage.width, sourceImage.height);
    const ctx = sourceCanvas.getContext("2d");
    ctx.drawImage(sourceImage, 0, 0);

    const scaled = scaleForOcr(sourceCanvas);
    const grayscale = enhanceContrast(cloneCanvas(scaled));

    const tesseract = await import("tesseract.js");
    const worker = await tesseract.createWorker("deu", tesseract.OEM.LSTM_ONLY, {
      logger: () => undefined
    });

    try {
      await worker.setParameters({
        preserve_interword_spaces: "1",
        user_defined_dpi: "300",
        tessedit_pageseg_mode: tesseract.PSM.SINGLE_BLOCK
      });

      const result = await worker.recognize(grayscale.toDataURL() as Parameters<typeof worker.recognize>[0]);
      ocrText = result.data.text.trim();
    } finally {
      await worker.terminate();
    }
  } catch (error) {
    return {
      fixture,
      groundTruth,
      ocrText: "",
      metrics: computeMetrics(groundTruth, ""),
      durationMs: Date.now() - start,
      error: error instanceof Error ? error.message : String(error)
    };
  }

  return {
    fixture,
    groundTruth,
    ocrText,
    metrics: computeMetrics(groundTruth, ocrText),
    durationMs: Date.now() - start
  };
}

// Minimal versions of the browser preprocessing steps for Node compatibility

function scaleForOcr(source: ReturnType<typeof createCanvas>): ReturnType<typeof createCanvas> {
  const longEdge = Math.max(source.width, source.height);
  const shortEdge = Math.min(source.width, source.height);
  const upscale = shortEdge < TARGET_MIN_TEXT_EDGE ? TARGET_MIN_TEXT_EDGE / shortEdge : 1;
  const downscale = longEdge * upscale > MAX_LONG_EDGE ? MAX_LONG_EDGE / (longEdge * upscale) : 1;
  const scale = upscale * downscale;

  if (Math.abs(scale - 1) < 0.05) return source;

  const canvas = createCanvas(Math.round(source.width * scale), Math.round(source.height * scale));
  const ctx = canvas.getContext("2d");
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);

  return canvas;
}

function enhanceContrast(source: ReturnType<typeof createCanvas>): ReturnType<typeof createCanvas> {
  const ctx = source.getContext("2d");
  const imageData = ctx.getImageData(0, 0, source.width, source.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
    const contrasted = Math.max(0, Math.min(255, (gray - 128) * 1.55 + 128));
    const value = contrasted < 188 ? contrasted * 0.76 : Math.min(255, contrasted * 1.08);
    const v = Math.max(0, Math.min(255, Math.round(value)));

    data[i] = v;
    data[i + 1] = v;
    data[i + 2] = v;
  }

  ctx.putImageData(imageData, 0, 0);
  return source;
}

function cloneCanvas(source: ReturnType<typeof createCanvas>): ReturnType<typeof createCanvas> {
  const canvas = createCanvas(source.width, source.height);
  canvas.getContext("2d").drawImage(source, 0, 0);
  return canvas;
}

function mimeFromPath(filePath: string): string {
  const ext = extname(filePath).toLowerCase();
  const map: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp"
  };

  return map[ext] ?? "image/jpeg";
}
