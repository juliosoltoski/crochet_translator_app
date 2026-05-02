# AGENTS.md

## Project Constraints

- This is a privacy-first translation assistant, not a recipe library.
- Never add permanent storage for uploaded recipes, images, PDFs, extracted recipe text, or translated recipe text.
- Persist only user-owned preferences, such as language variant settings and personal glossary overrides.
- Keep translation providers modular and replaceable.
- Keep terminology data language-pair aware and ready for many-to-many expansion.
- Preserve crochet pattern structure wherever possible: counts, row/round numbering, parentheses, repeats, punctuation, and line breaks.

## Coding Conventions

- Use TypeScript in strict mode.
- Keep domain logic in `packages/core`.
- Keep the web app thin; UI should call core pipeline functions and provider interfaces.
- Prefer pure functions for glossary and formatting transformations.
- Add or update focused tests for terminology and formatting behavior.
- Use accessible form labels, semantic HTML, visible focus states, and responsive layouts.
- Mark incomplete integrations with clear `TODO(provider)` comments.

## Data And Privacy Rules

- Do not write uploaded user files to disk or object storage.
- Do not log recipe contents, OCR output, or translated recipe text.
- Do not add analytics events containing pattern text.
- If backend routes are added, use request-size limits, transient buffers, and explicit retention notes.
- Add tests for any code that touches saved glossary preferences or redaction.

## Domain Notes

- German crochet terms often have abbreviation variants, punctuation variants, and regional meaning.
- Portuguese output must support at least `pt-PT` and `pt-BR` preferences.
- Avoid assuming one-to-one term mapping. The glossary model supports aliases, variants, notes, and confidence.
- Future tricot/knitting support should use a separate craft namespace rather than mixing stitch systems.
