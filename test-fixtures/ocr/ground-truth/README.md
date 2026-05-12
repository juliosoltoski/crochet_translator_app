# Ground Truth Files

Each `.txt` file here is the manually transcribed expected output for the corresponding image fixture in `../manual/`.

Naming convention: `<fixture-name-without-extension>.txt`

## Transcription Rules

- Include all crochet pattern rows/rounds exactly as printed, preserving abbreviations.
- Exclude: photo captions, product descriptions, decorative headings, page numbers, copyright notices.
- Preserve line breaks as they appear in the pattern.
- Save as UTF-8.

## Files Needed

- `daffodil-dorothy-1-column.txt` — single-column crop fixture
- `magazine-layout-daffodil-dorothy.txt` — full magazine layout fixture (include only the crochet pattern text columns)

These files must be transcribed manually from the images before running `npm --workspace packages/ocr-eval run eval`.
