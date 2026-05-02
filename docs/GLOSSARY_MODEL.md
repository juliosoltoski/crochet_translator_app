# Glossary Data Model

The glossary must support many-to-many terminology over time. A German source term may have multiple Portuguese targets depending on region, context, abbreviation, and craft. A Portuguese target may also map back to multiple German terms.

## Current In-Code Entry Shape

```ts
interface GlossaryEntry {
  id: string;
  craft: "crochet" | "knitting";
  sourceLanguage: string;
  targetLanguage: string;
  source: string;
  aliases?: string[];
  target: string;
  targetVariants?: Record<string, string>;
  kind: "stitch" | "abbreviation" | "instruction" | "structure" | "tool" | "material";
  confidence: number;
  notes?: string;
  wholeWord?: boolean;
  caseSensitive?: boolean;
}
```

## Future Persistent Tables

`glossary_terms`

- `id`
- `craft`
- `language`
- `term`
- `normalized_term`
- `kind`
- `notes`

`glossary_aliases`

- `id`
- `term_id`
- `alias`
- `normalized_alias`
- `source`

`glossary_translations`

- `id`
- `source_term_id`
- `target_term_id`
- `target_variant`
- `confidence`
- `context_rule`
- `review_status`

`user_glossary_overrides`

- `id`
- `user_id`
- `source_language`
- `target_language`
- `target_variant`
- `source_text`
- `preferred_target_text`
- `craft`

Only `user_glossary_overrides` should contain user-specific saved preferences. It must not contain full recipe lines or pattern excerpts.

## Seed German To Portuguese Terms

Examples included in the MVP:

- `Lm`, `Luftmasche` -> `corrente` / `correntinha`
- `fM`, `feste Masche` -> `ponto baixo`
- `Stb`, `Stäbchen` -> `ponto alto`
- `hStb`, `halbes Stäbchen` -> `meio ponto alto`
- `DStb`, `Doppelstäbchen` -> `ponto alto duplo`
- `Km`, `Kettmasche` -> `ponto baixíssimo`
- `Rd.`, `Runde` -> `volta`
- `R.`, `Reihe` -> `carreira`
- `Fadenring`, `Maschenring` -> `anel mágico`
