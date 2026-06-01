import type { GlossaryEntry } from "../types";

// UK English crochet terminology → Portuguese.
// UK stitch names differ from US: UK dc = US sc, UK tr = US dc, UK htr = US hdc, UK dtr = US tr.
// Do NOT share abbreviation entries with the US glossary; sourceLanguage filters them correctly.
export const englishUkPortugueseCrochetGlossary: GlossaryEntry[] = [
  {
    id: "crochet.en-UK.pt.chain",
    craft: "crochet",
    sourceLanguage: "en-UK",
    targetLanguage: "pt",
    source: "chain",
    aliases: ["ch", "chs"],
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
    confidence: 0.95
  },
  {
    id: "crochet.en-UK.pt.turning-chain",
    craft: "crochet",
    sourceLanguage: "en-UK",
    targetLanguage: "pt",
    source: "turning chain",
    aliases: ["tch", "t-ch"],
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
    id: "crochet.en-UK.pt.slip-stitch",
    craft: "crochet",
    sourceLanguage: "en-UK",
    targetLanguage: "pt",
    source: "slip stitch",
    aliases: ["ss"],
    target: "ponto baixíssimo",
    pluralTarget: "pontos baixíssimos",
    kind: "stitch",
    confidence: 0.95
  },
  {
    id: "crochet.en-UK.pt.double-crochet",
    craft: "crochet",
    sourceLanguage: "en-UK",
    targetLanguage: "pt",
    // UK dc = US single crochet → ponto baixo (NOT ponto alto)
    source: "double crochet",
    aliases: ["dc"],
    target: "ponto baixo",
    pluralTarget: "pontos baixos",
    kind: "stitch",
    confidence: 0.96
  },
  {
    id: "crochet.en-UK.pt.half-treble",
    craft: "crochet",
    sourceLanguage: "en-UK",
    targetLanguage: "pt",
    // UK htr = US half double crochet → meio ponto alto
    source: "half treble crochet",
    aliases: ["htr", "htr.", "half treble"],
    target: "meio ponto alto",
    pluralTarget: "meios pontos altos",
    kind: "stitch",
    confidence: 0.94
  },
  {
    id: "crochet.en-UK.pt.treble",
    craft: "crochet",
    sourceLanguage: "en-UK",
    targetLanguage: "pt",
    // UK tr = US double crochet → ponto alto
    source: "treble crochet",
    aliases: ["treble", "tr", "tr."],
    target: "ponto alto",
    pluralTarget: "pontos altos",
    kind: "stitch",
    confidence: 0.95
  },
  {
    id: "crochet.en-UK.pt.double-treble",
    craft: "crochet",
    sourceLanguage: "en-UK",
    targetLanguage: "pt",
    // UK dtr = US treble crochet → ponto alto duplo
    source: "double treble crochet",
    aliases: ["dtr", "dtr.", "double treble"],
    target: "ponto alto duplo",
    pluralTarget: "pontos altos duplos",
    kind: "stitch",
    confidence: 0.94
  },
  {
    id: "crochet.en-UK.pt.stitch",
    craft: "crochet",
    sourceLanguage: "en-UK",
    targetLanguage: "pt",
    source: "stitch",
    aliases: ["st", "sts", "stitches"],
    target: "ponto",
    pluralTarget: "pontos",
    kind: "stitch",
    confidence: 0.84,
    notes: "Generic stitch term; context may affect translation."
  },
  {
    id: "crochet.en-UK.pt.round",
    craft: "crochet",
    sourceLanguage: "en-UK",
    targetLanguage: "pt",
    source: "round",
    aliases: ["rnd", "rnds", "Rnd", "Rnd.", "rds"],
    target: "volta",
    kind: "structure",
    confidence: 0.91
  },
  {
    id: "crochet.en-UK.pt.row",
    craft: "crochet",
    sourceLanguage: "en-UK",
    targetLanguage: "pt",
    source: "row",
    aliases: ["Row", "rows", "Rows"],
    target: "carreira",
    kind: "structure",
    confidence: 0.9
  },
  {
    id: "crochet.en-UK.pt.increase",
    craft: "crochet",
    sourceLanguage: "en-UK",
    targetLanguage: "pt",
    source: "increase",
    aliases: ["inc", "inc."],
    target: "aumento",
    kind: "instruction",
    confidence: 0.9
  },
  {
    id: "crochet.en-UK.pt.decrease",
    craft: "crochet",
    sourceLanguage: "en-UK",
    targetLanguage: "pt",
    source: "decrease",
    aliases: ["dec", "dec.", "dec2tog"],
    target: "diminuição",
    kind: "instruction",
    confidence: 0.9
  },
  {
    id: "crochet.en-UK.pt.repeat",
    craft: "crochet",
    sourceLanguage: "en-UK",
    targetLanguage: "pt",
    source: "repeat",
    aliases: ["rep", "rep.", "reps"],
    target: "repetir",
    kind: "instruction",
    confidence: 0.93
  },
  {
    id: "crochet.en-UK.pt.miss",
    craft: "crochet",
    sourceLanguage: "en-UK",
    targetLanguage: "pt",
    // UK uses "miss" where US uses "skip"
    source: "miss",
    aliases: ["Miss"],
    target: "saltar",
    targetVariants: {
      "pt-BR": "pular"
    },
    kind: "instruction",
    confidence: 0.86
  },
  {
    id: "crochet.en-UK.pt.magic-ring",
    craft: "crochet",
    sourceLanguage: "en-UK",
    targetLanguage: "pt",
    source: "magic ring",
    aliases: ["MR", "magic circle", "MC"],
    target: "anel mágico",
    kind: "instruction",
    confidence: 0.9
  },
  {
    id: "crochet.en-UK.pt.turn",
    craft: "crochet",
    sourceLanguage: "en-UK",
    targetLanguage: "pt",
    source: "turn",
    aliases: ["Turn"],
    target: "virar",
    kind: "instruction",
    confidence: 0.88
  }
];
