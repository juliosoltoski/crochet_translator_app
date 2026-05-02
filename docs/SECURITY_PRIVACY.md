# Security And Privacy Approach

## Core Policy

The app must not permanently store:

- Uploaded recipe images.
- Uploaded PDFs.
- Extracted OCR text.
- Translated recipe or pattern text.
- Generated translation history.

The app may eventually store:

- User account metadata.
- User language preferences.
- User personal glossary overrides.
- Feature settings.

## Transient Processing

For the MVP scaffold, processing happens in browser memory. When a backend is added:

- Use request-size limits.
- Process files in memory or short-lived encrypted temporary storage.
- Delete temporary files immediately after processing.
- Disable request-body logging for upload and translation routes.
- Avoid sending recipe text to analytics tools.

## Provider Calls

OCR and translation providers may receive copyrighted user material during processing. Before production:

- Choose providers with acceptable data-retention controls.
- Disable provider training on submitted data where possible.
- Document provider retention behavior.
- Add user-facing privacy notice.

## Copyright-Safe Storage Strategy

Do:

- Store user glossary preferences like `Lm -> correntinha`.
- Store regional preference like `pt-BR`.
- Store aggregate metrics without content, such as request count and latency.

Do not:

- Store source patterns.
- Store translated patterns.
- Store uploaded files.
- Build a searchable recipe corpus.
- Keep thumbnails or page images.

## Logging Rules

Logs may include:

- Request id.
- Provider name.
- File MIME type.
- File size bucket.
- Processing duration.
- Warning codes.

Logs must not include:

- Recipe text.
- OCR text.
- Translation output.
- File names if they may contain recipe titles.
