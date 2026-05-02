# Testing Strategy

## Unit Tests

The first test layer covers pure domain logic in `packages/core`.

Current tests:

- German abbreviation replacement.
- Region-specific Portuguese variants.
- Longest-match handling, such as `halbes Stäbchen` before `Stäbchen`.
- Avoiding replacements inside longer words, such as `Maschenprobe`.
- Preserving line breaks, parentheses, repeat counts, and explicit stitch totals.
- Emitting warnings for structural problems.

## Sample German Crochet Terms

Use these in test fixtures:

```text
Rd. 1: 6 fM in den Fadenring (6 M)
Rd. 2: (2 fM in jede M) 6x (12 M)
R. 3: 1 Lm, wenden, 12 fM
1 hStb, 1 Stb, 1 DStb
Mit 1 Km schließen.
```

Expected glossary concepts:

- `Rd.` -> `volta`
- `R.` -> `carreira`
- `fM` -> `ponto baixo`
- `Lm` -> `corrente` or `correntinha`
- `M` -> `ponto`
- `hStb` -> `meio ponto alto`
- `Stb` -> `ponto alto`
- `DStb` -> `ponto alto duplo`
- `Km` -> `ponto baixíssimo`

## Integration Tests

Add once providers exist:

- PDF with selectable text.
- Scanned PDF with OCR fallback.
- Phone photo with low contrast.
- Multi-page pattern preserving page and line boundaries.
- Provider timeout and retry behavior.
- No recipe content in logs.

Manual MVP checks:

- Upload a `.txt` file and confirm the source text is replaced and translated.
- Upload a selectable-text PDF and confirm text appears without OCR fallback warnings.
- Upload a scanned PDF and confirm OCR fallback warnings appear.
- Upload a clear German pattern image and confirm OCR confidence is shown through warnings when low.
- Upload `test-fixtures/ocr/manual/magazine-layout-daffodil-dorothy.jpeg` and inspect column order plus crochet abbreviation recognition.

## Accessibility And UI Tests

Add with Playwright when the app grows:

- Keyboard-only translation flow.
- Mobile viewport upload and translate flow.
- Warning messages announced through accessible regions.
- Textareas and output remain readable at 320px width.
