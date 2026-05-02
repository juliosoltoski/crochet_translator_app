import type {
  GlossaryEntry,
  GlossaryMatch,
  GlossaryReplacementOptions,
  GlossaryReplacementResult,
  LanguageCode
} from "./types";

const TOKEN_BOUNDARY = "[^\\p{L}\\p{N}_]";

export function applyGlossaryReplacements(
  text: string,
  entries: GlossaryEntry[],
  options: GlossaryReplacementOptions
): GlossaryReplacementResult {
  const matches: GlossaryMatch[] = [];
  let transformed = text;

  const applicableEntries = entries
    .filter((entry) => {
      const craftMatches = options.craft ? entry.craft === options.craft : true;
      return (
        craftMatches &&
        entry.sourceLanguage === options.sourceLanguage &&
        entry.targetLanguage === options.targetLanguage
      );
    })
    .flatMap((entry) => termsForEntry(entry).map((term) => ({ entry, term })))
    .sort((a, b) => b.term.length - a.term.length);

  for (const { entry, term } of applicableEntries) {
    const regex = createTermRegex(term, entry);
    const target = getEntryTarget(entry, options.targetVariant);

    transformed = transformed.replace(regex, (...args: unknown[]) => {
      const match = String(args[0]);
      const offset = Number(args[args.length - 2]);
      const prefix = entry.wholeWord === false ? "" : getBoundaryPrefix(match);
      const matchedTerm = entry.wholeWord === false ? match : match.slice(prefix.length);
      const matchIndex = offset + prefix.length;

      matches.push({
        entryId: entry.id,
        source: matchedTerm,
        target,
        index: matchIndex,
        kind: entry.kind
      });

      return `${prefix}${target}`;
    });
  }

  return {
    text: transformed,
    matches: matches.sort((a, b) => a.index - b.index)
  };
}

export function getEntryTarget(
  entry: GlossaryEntry,
  targetVariant?: LanguageCode
): string {
  if (targetVariant && entry.targetVariants?.[targetVariant]) {
    return entry.targetVariants[targetVariant];
  }

  return entry.target;
}

function termsForEntry(entry: GlossaryEntry): string[] {
  return [entry.source, ...(entry.aliases ?? [])].filter(Boolean);
}

function createTermRegex(term: string, entry: GlossaryEntry): RegExp {
  const flags = entry.caseSensitive ? "gu" : "giu";
  const escaped = escapeRegex(term);

  if (entry.wholeWord === false) {
    return new RegExp(escaped, flags);
  }

  return new RegExp(`(^|${TOKEN_BOUNDARY})${escaped}(?=$|${TOKEN_BOUNDARY})`, flags);
}

function getBoundaryPrefix(match: string): string {
  const first = Array.from(match)[0] ?? "";
  return /^[\p{L}\p{N}_]$/u.test(first) ? "" : first;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
