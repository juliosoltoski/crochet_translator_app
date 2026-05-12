export type OcrSegmentationMode = "auto" | "single-column";

export interface ImagePreprocessingCandidate {
  canvas: HTMLCanvasElement;
  label: string;
  segmentationMode: OcrSegmentationMode;
}

export interface ImagePreprocessingResult {
  candidates: ImagePreprocessingCandidate[];
  warnings: string[];
}

export interface ImagePreprocessingOptions {
  maxCandidates?: number;
  segmentationMode?: OcrSegmentationMode;
}

const MAX_LONG_EDGE = 2800;
const TARGET_MIN_TEXT_EDGE = 1800;
const MAX_DESKEW_DEGREES = 15;
const DESKEW_COARSE_STEP = 1.0;
const DESKEW_FINE_STEP = 0.25;
const DESKEW_FINE_RADIUS = 1.5;

export async function preprocessImageForOcr(
  image: Blob,
  options: ImagePreprocessingOptions = {}
): Promise<ImagePreprocessingResult> {
  const bitmap = await createImageBitmap(image, { imageOrientation: "from-image" });

  try {
    const sourceCanvas = drawBitmapToCanvas(bitmap);
    return preprocessCanvasForOcr(sourceCanvas, options);
  } finally {
    bitmap.close();
  }
}

export function preprocessCanvasForOcr(
  sourceCanvas: HTMLCanvasElement,
  options: ImagePreprocessingOptions = {}
): ImagePreprocessingResult {
  const warnings: string[] = [];
  const croppedCanvas = cropLightPageMargins(sourceCanvas);
  const scaledCanvas = scaleCanvasForOcr(croppedCanvas);
  const deskewed = deskewCanvas(scaledCanvas);
  const segmentationMode = options.segmentationMode ?? "single-column";
  const candidates = [
    {
      canvas: enhanceTextContrast(cloneCanvas(deskewed.canvas)),
      label: "deskewed high-contrast grayscale",
      segmentationMode
    },
    {
      canvas: adaptiveThreshold(cloneCanvas(deskewed.canvas)),
      label: "deskewed adaptive threshold",
      segmentationMode
    },
    {
      canvas: sharpenGrayscale(cloneCanvas(deskewed.canvas)),
      label: "deskewed sharpened grayscale",
      segmentationMode
    }
  ].slice(0, options.maxCandidates ?? 3);

  if (croppedCanvas.width !== sourceCanvas.width || croppedCanvas.height !== sourceCanvas.height) {
    warnings.push("Image was auto-cropped to likely page bounds before OCR.");
  }

  if (scaledCanvas.width !== croppedCanvas.width || scaledCanvas.height !== croppedCanvas.height) {
    warnings.push("Image was resized for OCR readability.");
  }

  if (Math.abs(deskewed.angleDegrees) >= 0.25) {
    warnings.push(`Image was deskewed by ${deskewed.angleDegrees.toFixed(1)} degrees.`);
  }

  warnings.push("OCR tried multiple preprocessed image variants and selected the highest-confidence result.");

  return {
    candidates,
    warnings
  };
}

function drawBitmapToCanvas(bitmap: ImageBitmap): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;

  const context = require2dContext(canvas);
  context.drawImage(bitmap, 0, 0);

  return canvas;
}

function cropLightPageMargins(source: HTMLCanvasElement): HTMLCanvasElement {
  const context = require2dContext(source);
  const imageData = context.getImageData(0, 0, source.width, source.height);
  const bounds = findLightPageBounds(imageData, source.width, source.height);

  if (!bounds) {
    return source;
  }

  const padding = Math.round(Math.min(source.width, source.height) * 0.015);
  const x = Math.max(0, bounds.x - padding);
  const y = Math.max(0, bounds.y - padding);
  const right = Math.min(source.width, bounds.x + bounds.width + padding);
  const bottom = Math.min(source.height, bounds.y + bounds.height + padding);
  const width = right - x;
  const height = bottom - y;

  if (width < source.width * 0.5 || height < source.height * 0.5) {
    return source;
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  require2dContext(canvas).drawImage(source, x, y, width, height, 0, 0, width, height);
  return canvas;
}

function scaleCanvasForOcr(source: HTMLCanvasElement): HTMLCanvasElement {
  const longEdge = Math.max(source.width, source.height);
  const shortEdge = Math.min(source.width, source.height);
  const upscale = shortEdge < TARGET_MIN_TEXT_EDGE ? TARGET_MIN_TEXT_EDGE / shortEdge : 1;
  const downscale = longEdge * upscale > MAX_LONG_EDGE ? MAX_LONG_EDGE / (longEdge * upscale) : 1;
  const scale = upscale * downscale;

  if (Math.abs(scale - 1) < 0.05) {
    return source;
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(source.width * scale);
  canvas.height = Math.round(source.height * scale);

  const context = require2dContext(canvas);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(source, 0, 0, canvas.width, canvas.height);

  return canvas;
}

function deskewCanvas(source: HTMLCanvasElement): {
  canvas: HTMLCanvasElement;
  angleDegrees: number;
} {
  const angleDegrees = estimateSkewAngle(source);

  if (Math.abs(angleDegrees) < 0.25) {
    return {
      canvas: source,
      angleDegrees: 0
    };
  }

  return {
    canvas: cropLightPageMargins(rotateCanvas(source, -angleDegrees)),
    angleDegrees
  };
}

function estimateSkewAngle(source: HTMLCanvasElement): number {
  const analysisCanvas = scaleForAnalysis(source);
  const context = require2dContext(analysisCanvas);
  const imageData = context.getImageData(0, 0, analysisCanvas.width, analysisCanvas.height);
  const darkPixels = collectDarkPixels(imageData, analysisCanvas.width, analysisCanvas.height);

  if (darkPixels.length < 500) {
    return 0;
  }

  let coarseBest = 0;
  let coarseScore = -Infinity;

  for (let angle = -MAX_DESKEW_DEGREES; angle <= MAX_DESKEW_DEGREES; angle += DESKEW_COARSE_STEP) {
    const score = scoreHorizontalProjection(darkPixels, analysisCanvas.height, angle);

    if (score > coarseScore) {
      coarseScore = score;
      coarseBest = angle;
    }
  }

  let bestAngle = coarseBest;
  let bestScore = coarseScore;
  const fineMin = coarseBest - DESKEW_FINE_RADIUS;
  const fineMax = coarseBest + DESKEW_FINE_RADIUS;

  for (let angle = fineMin; angle <= fineMax; angle += DESKEW_FINE_STEP) {
    const score = scoreHorizontalProjection(darkPixels, analysisCanvas.height, angle);

    if (score > bestScore) {
      bestScore = score;
      bestAngle = angle;
    }
  }

  return bestAngle;
}

function scaleForAnalysis(source: HTMLCanvasElement): HTMLCanvasElement {
  const longEdge = Math.max(source.width, source.height);

  if (longEdge <= 900) {
    return source;
  }

  const scale = 900 / longEdge;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(source.width * scale);
  canvas.height = Math.round(source.height * scale);

  const context = require2dContext(canvas);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(source, 0, 0, canvas.width, canvas.height);

  return canvas;
}

function collectDarkPixels(
  imageData: ImageData,
  width: number,
  height: number
): Array<{ x: number; y: number }> {
  const data = imageData.data;
  const histogram = new Array<number>(256).fill(0);
  const step = 2;

  for (let index = 0; index < data.length; index += 4 * step) {
    const gray = grayscaleValue(data[index], data[index + 1], data[index + 2]);
    histogram[gray] += 1;
  }

  const threshold = Math.min(150, otsuThreshold(histogram) + 8);
  const pixels: Array<{ x: number; y: number }> = [];
  const marginX = Math.round(width * 0.04);
  const marginY = Math.round(height * 0.04);

  for (let y = marginY; y < height - marginY; y += step) {
    for (let x = marginX; x < width - marginX; x += step) {
      const index = (y * width + x) * 4;
      const gray = grayscaleValue(data[index], data[index + 1], data[index + 2]);

      if (gray < threshold) {
        pixels.push({ x, y });
      }
    }
  }

  return pixels;
}

function scoreHorizontalProjection(
  pixels: Array<{ x: number; y: number }>,
  height: number,
  angleDegrees: number
): number {
  const angle = (angleDegrees * Math.PI) / 180;
  const sin = Math.sin(angle);
  const cos = Math.cos(angle);
  const bins = new Array<number>(height + 200).fill(0);
  const offset = 100;

  for (const pixel of pixels) {
    const projectedY = Math.round(pixel.x * sin + pixel.y * cos) + offset;

    if (projectedY >= 0 && projectedY < bins.length) {
      bins[projectedY] += 1;
    }
  }

  return bins.reduce((score, value) => score + value * value, 0);
}

function rotateCanvas(source: HTMLCanvasElement, angleDegrees: number): HTMLCanvasElement {
  const angle = (angleDegrees * Math.PI) / 180;
  const sin = Math.abs(Math.sin(angle));
  const cos = Math.abs(Math.cos(angle));
  const width = Math.ceil(source.width * cos + source.height * sin);
  const height = Math.ceil(source.width * sin + source.height * cos);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = require2dContext(canvas);
  context.fillStyle = "white";
  context.fillRect(0, 0, width, height);
  context.translate(width / 2, height / 2);
  context.rotate(angle);
  context.drawImage(source, -source.width / 2, -source.height / 2);

  return canvas;
}

function enhanceTextContrast(source: HTMLCanvasElement): HTMLCanvasElement {
  const context = require2dContext(source);
  const imageData = context.getImageData(0, 0, source.width, source.height);
  const data = imageData.data;

  for (let index = 0; index < data.length; index += 4) {
    const gray = grayscaleValue(data[index], data[index + 1], data[index + 2]);
    const contrasted = clamp((gray - 128) * 1.55 + 128);
    const sharpened = contrasted < 188 ? contrasted * 0.76 : Math.min(255, contrasted * 1.08);
    const value = clamp(sharpened);

    data[index] = value;
    data[index + 1] = value;
    data[index + 2] = value;
  }

  context.putImageData(imageData, 0, 0);
  return source;
}

function adaptiveThreshold(source: HTMLCanvasElement): HTMLCanvasElement {
  const context = require2dContext(source);
  const imageData = context.getImageData(0, 0, source.width, source.height);
  const data = imageData.data;
  const width = source.width;
  const height = source.height;
  const gray = new Uint8Array(width * height);
  const integral = new Uint32Array((width + 1) * (height + 1));
  const radius = Math.max(12, Math.round(Math.min(width, height) / 85));

  for (let y = 0; y < height; y += 1) {
    let rowSum = 0;

    for (let x = 0; x < width; x += 1) {
      const pixelIndex = y * width + x;
      const dataIndex = pixelIndex * 4;
      const value = grayscaleValue(data[dataIndex], data[dataIndex + 1], data[dataIndex + 2]);
      gray[pixelIndex] = value;
      rowSum += value;
      integral[(y + 1) * (width + 1) + x + 1] = integral[y * (width + 1) + x + 1] + rowSum;
    }
  }

  for (let y = 0; y < height; y += 1) {
    const y1 = Math.max(0, y - radius);
    const y2 = Math.min(height - 1, y + radius);

    for (let x = 0; x < width; x += 1) {
      const x1 = Math.max(0, x - radius);
      const x2 = Math.min(width - 1, x + radius);
      const area = (x2 - x1 + 1) * (y2 - y1 + 1);
      const sum =
        integral[(y2 + 1) * (width + 1) + x2 + 1] -
        integral[y1 * (width + 1) + x2 + 1] -
        integral[(y2 + 1) * (width + 1) + x1] +
        integral[y1 * (width + 1) + x1];
      const localMean = sum / area;
      const pixelIndex = y * width + x;
      const output = gray[pixelIndex] < localMean - 12 ? 0 : 255;
      const dataIndex = pixelIndex * 4;

      data[dataIndex] = output;
      data[dataIndex + 1] = output;
      data[dataIndex + 2] = output;
    }
  }

  context.putImageData(imageData, 0, 0);
  return source;
}

function sharpenGrayscale(source: HTMLCanvasElement): HTMLCanvasElement {
  const context = require2dContext(source);
  const imageData = context.getImageData(0, 0, source.width, source.height);
  const data = imageData.data;
  const gray = new Uint8ClampedArray(source.width * source.height);

  for (let index = 0; index < gray.length; index += 1) {
    const dataIndex = index * 4;
    gray[index] = grayscaleValue(data[dataIndex], data[dataIndex + 1], data[dataIndex + 2]);
  }

  for (let y = 1; y < source.height - 1; y += 1) {
    for (let x = 1; x < source.width - 1; x += 1) {
      const index = y * source.width + x;
      const sharpened =
        gray[index] * 5 -
        gray[index - 1] -
        gray[index + 1] -
        gray[index - source.width] -
        gray[index + source.width];
      const value = clamp((clamp(sharpened) - 128) * 1.25 + 128);
      const dataIndex = index * 4;

      data[dataIndex] = value;
      data[dataIndex + 1] = value;
      data[dataIndex + 2] = value;
    }
  }

  context.putImageData(imageData, 0, 0);
  return source;
}

function findLightPageBounds(
  imageData: ImageData,
  width: number,
  height: number
): { x: number; y: number; width: number; height: number } | null {
  const data = imageData.data;
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  let hits = 0;
  const step = Math.max(2, Math.floor(Math.min(width, height) / 500));

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const index = (y * width + x) * 4;
      const gray = grayscaleValue(data[index], data[index + 1], data[index + 2]);
      const saturation =
        Math.max(data[index], data[index + 1], data[index + 2]) -
        Math.min(data[index], data[index + 1], data[index + 2]);

      if (gray > 130 && saturation < 90) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
        hits += 1;
      }
    }
  }

  if (hits < 200) {
    return null;
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}

function cloneCanvas(source: HTMLCanvasElement): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = source.width;
  canvas.height = source.height;
  require2dContext(canvas).drawImage(source, 0, 0);
  return canvas;
}

function require2dContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    throw new Error("Canvas rendering is unavailable in this browser.");
  }

  return context;
}

function grayscaleValue(red: number, green: number, blue: number): number {
  return clamp(red * 0.299 + green * 0.587 + blue * 0.114);
}

function otsuThreshold(histogram: number[]): number {
  const total = histogram.reduce((sum, count) => sum + count, 0);
  const sum = histogram.reduce((accumulator, count, index) => accumulator + index * count, 0);
  let sumBackground = 0;
  let weightBackground = 0;
  let maxVariance = 0;
  let threshold = 128;

  for (let index = 0; index < histogram.length; index += 1) {
    weightBackground += histogram[index];

    if (weightBackground === 0) {
      continue;
    }

    const weightForeground = total - weightBackground;

    if (weightForeground === 0) {
      break;
    }

    sumBackground += index * histogram[index];
    const meanBackground = sumBackground / weightBackground;
    const meanForeground = (sum - sumBackground) / weightForeground;
    const variance =
      weightBackground *
      weightForeground *
      (meanBackground - meanForeground) *
      (meanBackground - meanForeground);

    if (variance > maxVariance) {
      maxVariance = variance;
      threshold = index;
    }
  }

  return threshold;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}
