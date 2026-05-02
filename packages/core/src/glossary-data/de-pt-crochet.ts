import type { GlossaryEntry } from "../types";

export const germanPortugueseCrochetGlossary: GlossaryEntry[] = [
  {
    id: "crochet.de.pt.luftmasche",
    craft: "crochet",
    sourceLanguage: "de",
    targetLanguage: "pt",
    source: "Luftmasche",
    aliases: ["Luftm.", "Lm", "LM"],
    target: "corrente",
    targetVariants: {
      "pt-PT": "corrente",
      "pt-BR": "correntinha"
    },
    pluralTarget: "correntes",
    pluralTargetVariants: {
      "pt-PT": "correntes",
      "pt-BR": "correntinhas"
    },
    kind: "stitch",
    confidence: 0.95,
    notes: "Common chain stitch abbreviation."
  },
  {
    id: "crochet.de.pt.wendeluftmasche",
    craft: "crochet",
    sourceLanguage: "de",
    targetLanguage: "pt",
    source: "Wendeluftmasche",
    aliases: ["Wende-Lm", "W-Lm", "WLM"],
    target: "corrente de viragem",
    targetVariants: {
      "pt-BR": "correntinha de virada"
    },
    pluralTarget: "correntes de viragem",
    pluralTargetVariants: {
      "pt-BR": "correntinhas de virada"
    },
    kind: "stitch",
    confidence: 0.92
  },
  {
    id: "crochet.de.pt.feste-masche",
    craft: "crochet",
    sourceLanguage: "de",
    targetLanguage: "pt",
    source: "feste Masche",
    aliases: ["fM", "f. M."],
    target: "ponto baixo",
    pluralTarget: "pontos baixos",
    kind: "stitch",
    confidence: 0.96
  },
  {
    id: "crochet.de.pt.masche",
    craft: "crochet",
    sourceLanguage: "de",
    targetLanguage: "pt",
    source: "Masche",
    aliases: ["M", "M."],
    target: "ponto",
    pluralTarget: "pontos",
    kind: "stitch",
    confidence: 0.84,
    notes: "Generic stitch term; context may affect translation."
  },
  {
    id: "crochet.de.pt.kettmasche",
    craft: "crochet",
    sourceLanguage: "de",
    targetLanguage: "pt",
    source: "Kettmasche",
    aliases: ["Km", "KM", "Kettm."],
    target: "ponto baixíssimo",
    targetVariants: {
      "pt-PT": "ponto baixíssimo",
      "pt-BR": "ponto baixíssimo"
    },
    pluralTarget: "pontos baixíssimos",
    pluralTargetVariants: {
      "pt-PT": "pontos baixíssimos",
      "pt-BR": "pontos baixíssimos"
    },
    kind: "stitch",
    confidence: 0.95
  },
  {
    id: "crochet.de.pt.halbes-staebchen",
    craft: "crochet",
    sourceLanguage: "de",
    targetLanguage: "pt",
    source: "halbes Stäbchen",
    aliases: ["hStb", "h. Stb."],
    target: "meio ponto alto",
    pluralTarget: "meios pontos altos",
    kind: "stitch",
    confidence: 0.94
  },
  {
    id: "crochet.de.pt.staebchen",
    craft: "crochet",
    sourceLanguage: "de",
    targetLanguage: "pt",
    source: "Stäbchen",
    aliases: ["Stb", "Stb."],
    target: "ponto alto",
    pluralTarget: "pontos altos",
    kind: "stitch",
    confidence: 0.95
  },
  {
    id: "crochet.de.pt.doppelstaebchen",
    craft: "crochet",
    sourceLanguage: "de",
    targetLanguage: "pt",
    source: "Doppelstäbchen",
    aliases: ["DStb", "DStb."],
    target: "ponto alto duplo",
    pluralTarget: "pontos altos duplos",
    kind: "stitch",
    confidence: 0.94
  },
  {
    id: "crochet.de.pt.reihe",
    craft: "crochet",
    sourceLanguage: "de",
    targetLanguage: "pt",
    source: "Reihe",
    aliases: ["R."],
    target: "carreira",
    kind: "structure",
    confidence: 0.9
  },
  {
    id: "crochet.de.pt.runde",
    craft: "crochet",
    sourceLanguage: "de",
    targetLanguage: "pt",
    source: "Runde",
    aliases: ["Rd.", "Runden"],
    target: "volta",
    kind: "structure",
    confidence: 0.91
  },
  {
    id: "crochet.de.pt.zunahme",
    craft: "crochet",
    sourceLanguage: "de",
    targetLanguage: "pt",
    source: "Zunahme",
    aliases: ["zun.", "zunehmen"],
    target: "aumento",
    kind: "instruction",
    confidence: 0.9
  },
  {
    id: "crochet.de.pt.abnahme",
    craft: "crochet",
    sourceLanguage: "de",
    targetLanguage: "pt",
    source: "Abnahme",
    aliases: ["abn.", "abnehmen"],
    target: "diminuição",
    kind: "instruction",
    confidence: 0.9
  },
  {
    id: "crochet.de.pt.wiederholen",
    craft: "crochet",
    sourceLanguage: "de",
    targetLanguage: "pt",
    source: "wiederholen",
    aliases: ["wdh.", "Wdh."],
    target: "repetir",
    kind: "instruction",
    confidence: 0.93
  },
  {
    id: "crochet.de.pt.ueberspringen",
    craft: "crochet",
    sourceLanguage: "de",
    targetLanguage: "pt",
    source: "überspringen",
    aliases: ["ueberspringen"],
    target: "saltar",
    targetVariants: {
      "pt-BR": "pular"
    },
    kind: "instruction",
    confidence: 0.86
  },
  {
    id: "crochet.de.pt.fadenring",
    craft: "crochet",
    sourceLanguage: "de",
    targetLanguage: "pt",
    source: "Fadenring",
    aliases: ["Maschenring", "magischer Ring"],
    target: "anel mágico",
    kind: "instruction",
    confidence: 0.9
  }
];
