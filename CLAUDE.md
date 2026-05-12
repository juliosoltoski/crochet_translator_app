# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # Install all workspace dependencies
npm run dev          # Start API (port 8787) + web (port 5173) concurrently
npm run dev:api      # API only
npm run dev:web      # Web only
npm test             # Run unit tests (packages/core via vitest)
npm run test:watch   # Run tests in watch mode
npm run typecheck    # Typecheck all workspaces
npm run build        # Build all packages in dependency order
```

Run a single test file:
```bash
npm --workspace packages/core run test -- src/glossary.test.ts
```

## Environment Setup

Copy `.env.example` to `.env`. By default `TRANSLATION_PROVIDER=passthrough` (glossary-only, no API key needed). To use Gemini:

```env
TRANSLATION_PROVIDER=gemini
GEMINI_API_KEY=your_key_here
GEMINI_TRANSLATION_MODEL=gemini-2.5-flash
```

Gemini keys must stay in `.env` and only be read by `apps/api`. Never expose them to Vite or browser code.

## Architecture

This is an npm workspaces monorepo:

- **`packages/core`** — all domain logic: glossary data, matching/replacement, formatting validation, translation pipeline orchestration, and provider interfaces. Pure TypeScript, tested with vitest.
- **`apps/api`** — Express server (`tsx watch src/server.ts`). Holds API keys, calls `runTranslationPipeline` with the configured provider. Only endpoint is `POST /api/translate`.
- **`apps/web`** — React + Vite frontend. Handles file upload, OCR (tesseract.js), PDF extraction (pdfjs-dist), and calls `POST /api/translate`. Falls back to local passthrough if the API is unavailable.

### Translation Pipeline Flow

```
user text/file → transient extraction (browser) → glossary replacement → POST /api/translate → Gemini/passthrough → structure validation → result + warnings
```

`runTranslationPipeline` in `packages/core/src/pipeline.ts` is the central orchestrator. It applies glossary replacements first, passes the result to the translation provider, then validates structure (line count, count tokens, parenthesis balance).

### Provider Interfaces (`packages/core/src/providers.ts`)

Three injectable interfaces: `TextExtractionProvider`, `LanguageDetectionProvider`, `TranslationProvider`. Current implementations:
- `PassthroughTranslationProvider` — returns text unchanged (glossary-only mode)
- `StaticLanguageDetectionProvider` — returns a fixed language code
- `GeminiTranslationProvider` — in `apps/api/src/geminiTranslationProvider.ts`

New providers must implement the relevant interface. Mark incomplete wiring with `TODO(provider)` comments.

### Glossary System

Entries in `packages/core/src/glossary-data/de-pt-crochet.ts` follow `GlossaryEntry` from `types.ts`. Key behaviors:
- Entries are matched longest-first to prevent partial substitution.
- `targetVariants` supports `pt-PT` vs `pt-BR` differences.
- `pluralTarget` / `pluralTargetVariants` are used when a preceding number context is detected.
- Future craft namespaces (knitting) must use a separate `craft` value, not share stitch entries with `crochet`.

## Git Workflow

Commit and push to GitHub regularly throughout work — after each meaningful unit of progress, not just at the end. This preserves work-in-progress and keeps the remote up to date.

- Stage only relevant files by name, not `git add -A`.
- Write concise commit messages that describe why, not just what.
- Push after each commit: `git push`.

## Coding Conventions

- TypeScript strict mode throughout.
- Keep domain logic in `packages/core`; the web app should only call core functions and provider interfaces.
- Prefer pure functions for glossary and formatting transformations.
- Use accessible form labels, semantic HTML, visible focus states, and responsive layouts.
- Mark incomplete provider integrations with `TODO(provider)`.

## Privacy Constraints

**Never** add permanent storage for uploaded files, extracted OCR text, or translated pattern text. All file content must be processed transiently in memory only. Only user-owned preferences (language variant, personal glossary overrides) may be persisted. Do not log recipe content or add analytics events that include pattern text.
