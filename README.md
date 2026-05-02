# Crochet Translator App

Privacy-first translation assistant for crochet recipes and crochet patterns. The MVP focuses on German to Portuguese translation, with the architecture prepared for additional language pairs and future knitting/tricot support.

## Goals

- Translate crochet terminology with domain-specific glossary support instead of generic literal translation.
- Preserve pattern structure, including rows, rounds, counts, parentheses, repeats, and line breaks.
- Accept image and PDF uploads with transient extraction.
- Avoid permanent storage of uploaded recipes, images, PDFs, extracted text, or translated pattern text.
- Allow users to save only personal terminology preferences and regional choices such as European Portuguese vs Brazilian Portuguese.

## Recommended Starting Architecture

Start as a responsive, PWA-ready web app.

- It is the fastest path to a useful MVP across desktop and mobile.
- Users can upload images/PDFs from phones without separate native apps.
- The same domain logic can later be reused by native wrappers or a shared mobile codebase.
- OCR, PDF parsing, language detection, and translation are behind provider interfaces so the app can move from local/browser providers to server-side or paid APIs without a rewrite.

Native mobile can come later if camera capture, offline OCR, or platform-specific document handling becomes central to the product.

## Repository Structure

```text
apps/
  web/                 React/Vite MVP UI
packages/
  core/                Glossary, formatting, and translation pipeline logic
docs/
  PRD.md
  ARCHITECTURE.md
  GEMINI_SETUP.md
  GLOSSARY_MODEL.md
  OCR_PREPROCESSING.md
  ROADMAP.md
  SECURITY_PRIVACY.md
  TESTING.md
```

## Setup

Requirements:

- Node.js 20+
- npm 10+

Install dependencies:

```bash
npm install
```

Run the web app:

```bash
npm run dev
```

This starts:

- API: `http://localhost:8787`
- Web: `http://localhost:5173`

By default, translation uses the local passthrough provider plus glossary replacement. To enable Gemini translation, copy `.env.example` to `.env`, set `TRANSLATION_PROVIDER=gemini`, and set `GEMINI_API_KEY`.

Run tests:

```bash
npm test
```

Type-check:

```bash
npm run typecheck
```

Build:

```bash
npm run build
```

## MVP Status

Implemented now:

- Responsive web scaffold.
- Pasted-text translation preview.
- Transient text extraction for text uploads.
- In-browser selectable-text extraction for PDFs.
- In-browser OCR for images and scanned PDF fallback.
- German to Portuguese crochet glossary seed data.
- Glossary replacement with match metadata.
- Structure-preservation helpers.
- Unit tests for glossary replacement and formatting preservation.

TODO integrations:

- Language detection provider.
- User-authenticated personal glossary preferences.
- PWA manifest and service worker.
- Production OCR tuning for large multi-page scanned PDFs.

Implemented provider integrations:

- Local passthrough provider for glossary-only preview.
- Server-side Gemini API provider with `@google/genai`.

## Gemini API Setup

1. Go to Google AI Studio API keys: <https://aistudio.google.com/apikey>
2. Create or select a Google Cloud project.
3. Create a Gemini API key.
4. Create `.env` from `.env.example`.
5. Set:

```env
TRANSLATION_PROVIDER=gemini
GEMINI_API_KEY=your_key_here
GEMINI_TRANSLATION_MODEL=gemini-2.5-flash
```

6. Restart the app:

```bash
npm run dev
```

Keep the key in `.env` only. Do not add it to Vite variables or browser code. Gemini free-tier and rate-limit details can change, so check the Google AI Studio dashboard and the official Gemini rate limit docs when you start testing.

## Privacy Model

Uploaded files and translated recipe text must be processed transiently only. Do not persist copyrighted recipes, images, PDFs, extracted OCR text, or translated pattern text. Future persistence should be limited to:

- User account metadata.
- User settings.
- Personal glossary overrides.
- Provider usage logs that exclude recipe content.

See [docs/SECURITY_PRIVACY.md](docs/SECURITY_PRIVACY.md).

More planning docs:

- [Product requirements](docs/PRD.md)
- [Technical architecture](docs/ARCHITECTURE.md)
- [Gemini setup](docs/GEMINI_SETUP.md)
- [Glossary data model](docs/GLOSSARY_MODEL.md)
- [OCR preprocessing](docs/OCR_PREPROCESSING.md)
- [Testing strategy](docs/TESTING.md)
- [Roadmap](docs/ROADMAP.md)
