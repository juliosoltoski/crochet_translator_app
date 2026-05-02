# Product Requirements Document: MVP

## Product Summary

Crochet Translator App is a private translation assistant for crochet patterns and recipes. It extracts text from a user-provided image or PDF, detects crochet-specific terminology, translates the text with domain-aware terminology handling, and returns a structured translation without permanently storing copyrighted source material or translated pattern text.

## MVP Scope

Initial language pair:

- Source: German
- Target: Portuguese
- Variants: European Portuguese (`pt-PT`) and Brazilian Portuguese (`pt-BR`)

Initial craft:

- Crochet

Future craft:

- Knitting/tricot

## User Problems

- Generic translation tools translate crochet terms literally or inconsistently.
- Abbreviations like `Lm`, `fM`, `Stb`, `Rd.` and `R.` need craft-aware interpretation.
- Pattern structure is as important as prose meaning.
- Users need help with private material they already own, without creating a stored recipe library.

## MVP User Stories

- As a crocheter, I can paste German pattern text and receive Portuguese output with crochet terminology handled consistently.
- As a crocheter, I can upload a German pattern image or PDF and receive a clear message when OCR/PDF extraction is not yet configured.
- As a crocheter, I can choose European Portuguese or Brazilian Portuguese terminology.
- As a crocheter, I can see glossary matches that influenced the translation.
- As a crocheter, I can receive warnings when extraction or translation confidence is low.
- As a crocheter, I can override terminology later and save only those preferences, not the pattern.

## Functional Requirements

1. Input
   - Accept pasted text.
   - Accept uploaded images.
   - Accept uploaded PDFs.
   - Process uploaded content transiently.

2. Extraction
   - Extract text from images with OCR.
   - Extract selectable text from PDFs.
   - Fall back to OCR for scanned PDFs.
   - Return extraction confidence and warnings.

3. Language And Domain Detection
   - Detect source language.
   - Identify crochet abbreviations and stitch terms.
   - Flag ambiguous terms and low-confidence extraction.

4. Translation
   - Apply crochet glossary protection/replacement.
   - Call a modular translation provider.
   - Preserve pattern layout, rows, rounds, repeats, counts, and punctuation.
   - Post-process terminology and formatting.

5. Output
   - Show translated pattern text.
   - Show warnings and matched glossary terms.
   - Provide copy/download-to-device options without server persistence.

6. Preferences
   - Support Portuguese regional variant selection.
   - Future: save personal glossary overrides only.

## Non-Functional Requirements

- Privacy-first.
- No permanent recipe storage.
- Modular translation providers.
- Easy to add language pairs.
- Mobile-friendly.
- Accessibility-aware.
- Internationalization-ready.
- Clear confidence warnings.

## Out Of Scope For MVP

- A public recipe library.
- Permanent project history.
- User sharing of translated recipes.
- Full chart/symbol translation.
- Native mobile app.
- Human translator marketplace.

## Success Criteria

- German crochet abbreviations are translated consistently in sample patterns.
- Pattern structure is preserved in unit tests.
- The app clearly communicates provider TODOs for OCR/PDF/LLM integration.
- No code path persists uploaded or translated recipe content.
