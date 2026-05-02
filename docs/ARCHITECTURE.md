# Technical Architecture

## Recommendation

Start with a responsive PWA-ready web app.

Tradeoffs:

- Responsive web app: fastest MVP, broad device support, easiest iteration.
- PWA: adds installability and mobile affordances without native app complexity.
- Native mobile app: best camera/file integrations, but slower and premature before the translation pipeline stabilizes.
- Shared web/mobile codebase: useful later, especially with React Native, but adds early complexity.

The current scaffold uses React + Vite for the web app and a shared TypeScript core package for domain logic.

## High-Level Flow

```text
User file/text
  -> transient extraction provider
  -> language detection provider
  -> crochet glossary matcher
  -> translation provider
  -> post-processing and validation
  -> translated output and warnings
```

## Packages

### `packages/core`

Owns:

- Glossary data model.
- Seed German to Portuguese crochet terms.
- Glossary matching and replacement.
- Pattern formatting helpers.
- Translation pipeline orchestration.
- Provider interfaces.

### `apps/web`

Owns:

- Responsive UI.
- Input forms.
- Upload handling.
- Display of translated text, warnings, and glossary matches.
- Browser-only transient file extraction placeholder.

## Provider Interfaces

Providers should be injected:

- `TextExtractionProvider`
- `LanguageDetectionProvider`
- `TranslationProvider`
- Future `PersonalGlossaryProvider`

This keeps the app independent from a specific OCR, PDF parser, LLM, or translation API.

## OCR/PDF Extraction Pipeline

1. Inspect file MIME type.
2. For text-like files, read text in memory.
3. For PDFs:
   - Try selectable text extraction.
   - If text is sparse, render pages and OCR images.
   - Preserve page breaks.
   - Return confidence per page when available.
4. For images:
   - Normalize orientation.
   - Run OCR.
   - Preserve line breaks where possible.
   - Return confidence and warnings.
5. Discard file buffers immediately after processing.

Current MVP browser providers:

- PDF selectable text: `pdfjs-dist`.
- Image OCR: `tesseract.js` with German language data.
- Scanned PDF fallback: render pages with PDF.js and OCR the page canvas.

Future provider candidates:

- Browser OCR prototype: Tesseract.js.
- Server OCR option: Google Cloud Vision, Azure AI Vision, AWS Textract.
- PDF text: `pdfjs-dist`.
- Scanned PDFs: render with PDF.js and pass page images to OCR.

The browser OCR fallback is intentionally capped to the first few PDF pages for responsiveness. Production can add background workers, cancellation, progress per page, and provider selection.

## Translation Pipeline

1. Extract text.
2. Detect source language.
3. Match domain glossary terms and abbreviations.
4. Pre-protect or replace terms.
5. Translate with provider.
6. Post-process terminology.
7. Validate structure:
   - Line count drift.
   - Count token drift.
   - Parenthesis balance.
   - Repeat markers.
8. Return translated text, warnings, and glossary match metadata.

## Data Model

Terminology entries are many-to-many ready:

- Stable `id`.
- `craft`: `crochet` or future `knitting`.
- `sourceLanguage`.
- `targetLanguage`.
- `source`.
- `aliases`.
- `target`.
- `targetVariants`.
- `kind`.
- `confidence`.
- `notes`.

Future persistence should split canonical glossary terms from user preferences:

- `glossary_terms`
- `glossary_translations`
- `glossary_aliases`
- `user_glossary_overrides`
- `language_variants`

## Security And Privacy

- No permanent storage of uploaded files or translated pattern text.
- No content logging.
- Use transient buffers.
- Add request-size limits when a backend is introduced.
- Keep provider telemetry free of copyrighted content.

## Chart And Symbol Diagram Roadmap

Future chart support should be separate from OCR text translation:

- Detect chart regions in images/PDFs.
- Classify crochet symbols.
- Map symbols to stitch terms.
- Reconstruct chart legend.
- Keep original chart image transient unless the user exports locally.
