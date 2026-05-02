# Gemini API Setup

Use Gemini for low-cost/free-tier MVP testing. The application calls Gemini from `apps/api` only, so the browser never receives the API key.

## Get An API Key

1. Open Google AI Studio API keys: <https://aistudio.google.com/apikey>
2. Accept the terms if prompted.
3. Create or select a Google Cloud project.
4. Create an API key.
5. Keep the key private.

Google's docs say Gemini API keys are created and managed in Google AI Studio, and that `GEMINI_API_KEY` or `GOOGLE_API_KEY` can be picked up by Gemini API libraries when set as environment variables.

## Local Configuration

Copy the example environment file:

```powershell
Copy-Item .env.example .env
```

Set these values:

```env
TRANSLATION_PROVIDER=gemini
GEMINI_API_KEY=your_key_here
GEMINI_TRANSLATION_MODEL=gemini-2.5-flash
```

Then restart:

```powershell
npm.cmd run dev
```

## Free-Tier Notes

- Gemini API has free-tier/testing access in supported regions, with lower limits than paid tiers.
- Limits change over time and can differ by model, tier, and project.
- Watch for `429` or quota errors during testing.
- Check the official rate limits page before heavier testing: <https://ai.google.dev/gemini-api/docs/rate-limits>
- Keep billing disabled for the project if you want to avoid accidental paid usage during early experiments.

## Key Safety

- Never commit `.env`.
- Never use `VITE_GEMINI_API_KEY`.
- Never call Gemini directly from the browser in production.
- Restrict the key to the Generative Language API in Google Cloud Console where possible.
- Rotate the key immediately if it is exposed.
