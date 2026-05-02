# OCR Preprocessing

Manual fixture:

- `test-fixtures/ocr/manual/magazine-layout-daffodil-dorothy.jpeg`
- `test-fixtures/ocr/manual/daffodil-dorothy-1-column.jpg`

This sample is a magazine/book photo with several OCR stressors:

- Three-column layout.
- Small German crochet pattern text.
- Slight page curvature.
- Uneven lighting.
- Mixed photos and text.
- Decorative heading and non-pattern text.

## Current Preprocessing

The browser OCR path now applies these steps before Tesseract:

1. Respect image orientation metadata.
2. Draw the image to a canvas.
3. Auto-crop likely light page margins.
4. Resize the page to a more OCR-friendly size.
5. Estimate and correct small text skew.
6. Create multiple OCR candidates:
   - high-contrast grayscale
   - adaptive threshold
   - sharpened grayscale
7. Run German OCR with Tesseract.js using single-column segmentation for image uploads.
8. Select the OCR result with the best confidence and crochet-token signal.

Scanned PDF page renders use a smaller candidate set with automatic segmentation to avoid excessive runtime.

## Expected Impact On The Sample

Likely improvements:

- Better recognition of faint small text.
- Less interference from the dark background outside the page.
- More stable OCR confidence on body text.

Remaining limitations:

- Tesseract may read columns in the wrong order.
- Page curvature can distort lines near the edges.
- The app does not yet separate pattern text from photos or side sections.
- The app does not yet perform full perspective correction for trapezoid page photos.
- Crochet chart/symbol diagrams are not recognized as structured crochet notation.

## Recommended Next OCR Step

Add a manual crop/region selector before OCR. For magazine layouts, selecting one column or section at a time will likely improve results more than additional automatic image filters.
