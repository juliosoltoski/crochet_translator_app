# Roadmap

## Phase 1: MVP Scaffold

- Responsive web app.
- German to Portuguese glossary seed data.
- Pasted-text translation preview.
- Provider interfaces for OCR, PDF parsing, language detection, and translation.
- Privacy and copyright-safe documentation.

## Phase 2: Real Extraction

- Add PDF selectable-text extraction with `pdfjs-dist`. Done.
- Add image OCR prototype. Done.
- Add OCR confidence warnings. Done.
- Add scanned PDF fallback. Done for first pages in-browser.
- Add structure-preserving page separators.
- Add extraction progress and cancellation.
- Tune OCR for larger multi-page PDFs.

## Phase 3: Real Translation

- Add LLM or translation API provider.
- Protect glossary terms before translation.
- Add post-translation terminology validation.
- Add prompt/provider contracts requiring line, count, and repeat preservation.
- Add provider privacy review.

## Phase 4: User Preferences

- Add accounts or local-only settings.
- Save only personal glossary preferences.
- Support `pt-PT` and `pt-BR` defaults.
- Allow per-term overrides.
- Add import/export for user glossary settings without recipe text.

## Phase 5: More Languages

- Add glossary review workflow.
- Add Portuguese to German reverse mapping.
- Add English, French, Spanish, and Italian as new language pairs.
- Store glossary terms as language-neutral craft concepts where useful.

## Phase 6: Knitting/Tricot

- Add `knitting` craft namespace.
- Add knitting-specific abbreviations, gauges, needle sizes, and shaping terms.
- Keep crochet and knitting terminology separate when abbreviations collide.

## Phase 7: Charts And Symbol Diagrams

- Detect chart regions in images and PDFs.
- Recognize crochet symbols and legends.
- Translate chart legends.
- Warn when symbol recognition is uncertain.
- Keep chart images transient unless the user exports locally.
