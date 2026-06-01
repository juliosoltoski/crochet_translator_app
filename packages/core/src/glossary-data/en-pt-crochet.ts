import type { GlossaryEntry } from "../types";

// US English crochet terminology → Portuguese.
// UK English uses different stitch names (UK dc ≠ US dc); these entries follow US conventions.
export const englishPortugueseCrochetGlossary: GlossaryEntry[] = [
  {
    id: "crochet.en.pt.chain",
    craft: "crochet",
    sourceLanguage: "en",
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
    id: "crochet.en.pt.turning-chain",
    craft: "crochet",
    sourceLanguage: "en",
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
    id: "crochet.en.pt.single-crochet",
    craft: "crochet",
    sourceLanguage: "en",
    targetLanguage: "pt",
    source: "single crochet",
    aliases: ["sc"],
    target: "ponto baixo",
    pluralTarget: "pontos baixos",
    kind: "stitch",
    confidence: 0.96
  },
  {
    id: "crochet.en.pt.slip-stitch",
    craft: "crochet",
    sourceLanguage: "en",
    targetLanguage: "pt",
    source: "slip stitch",
    aliases: ["sl st", "ss"],
    target: "ponto baixíssimo",
    pluralTarget: "pontos baixíssimos",
    kind: "stitch",
    confidence: 0.95
  },
  {
    id: "crochet.en.pt.half-double-crochet",
    craft: "crochet",
    sourceLanguage: "en",
    targetLanguage: "pt",
    source: "half double crochet",
    aliases: ["hdc"],
    target: "meio ponto alto",
    pluralTarget: "meios pontos altos",
    kind: "stitch",
    confidence: 0.94
  },
  {
    id: "crochet.en.pt.double-crochet",
    craft: "crochet",
    sourceLanguage: "en",
    targetLanguage: "pt",
    source: "double crochet",
    aliases: ["dc"],
    target: "ponto alto",
    pluralTarget: "pontos altos",
    kind: "stitch",
    confidence: 0.95
  },
  {
    id: "crochet.en.pt.treble-crochet",
    craft: "crochet",
    sourceLanguage: "en",
    targetLanguage: "pt",
    source: "treble crochet",
    aliases: ["treble", "tr", "trc"],
    target: "ponto alto duplo",
    pluralTarget: "pontos altos duplos",
    kind: "stitch",
    confidence: 0.94
  },
  {
    id: "crochet.en.pt.stitch",
    craft: "crochet",
    sourceLanguage: "en",
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
    id: "crochet.en.pt.round",
    craft: "crochet",
    sourceLanguage: "en",
    targetLanguage: "pt",
    source: "round",
    aliases: ["rnd", "rnds", "Rnd", "Rnd.", "rds", "Rd"],
    target: "volta",
    kind: "structure",
    confidence: 0.91
  },
  {
    id: "crochet.en.pt.row",
    craft: "crochet",
    sourceLanguage: "en",
    targetLanguage: "pt",
    source: "row",
    aliases: ["Row", "rows", "Rows"],
    target: "carreira",
    kind: "structure",
    confidence: 0.9
  },
  {
    id: "crochet.en.pt.increase",
    craft: "crochet",
    sourceLanguage: "en",
    targetLanguage: "pt",
    source: "increase",
    aliases: ["inc", "inc."],
    target: "aumento",
    kind: "instruction",
    confidence: 0.9
  },
  {
    id: "crochet.en.pt.decrease",
    craft: "crochet",
    sourceLanguage: "en",
    targetLanguage: "pt",
    source: "decrease",
    aliases: ["dec", "dec."],
    target: "diminuição",
    kind: "instruction",
    confidence: 0.9
  },
  {
    id: "crochet.en.pt.repeat",
    craft: "crochet",
    sourceLanguage: "en",
    targetLanguage: "pt",
    source: "repeat",
    aliases: ["rep", "rep.", "reps"],
    target: "repetir",
    kind: "instruction",
    confidence: 0.93
  },
  {
    id: "crochet.en.pt.skip",
    craft: "crochet",
    sourceLanguage: "en",
    targetLanguage: "pt",
    source: "skip",
    aliases: ["sk", "sk."],
    target: "saltar",
    targetVariants: {
      "pt-BR": "pular"
    },
    kind: "instruction",
    confidence: 0.86
  },
  {
    id: "crochet.en.pt.magic-ring",
    craft: "crochet",
    sourceLanguage: "en",
    targetLanguage: "pt",
    source: "magic ring",
    aliases: ["MR", "magic circle", "MC"],
    target: "anel mágico",
    kind: "instruction",
    confidence: 0.9
  },
  {
    id: "crochet.en.pt.turn",
    craft: "crochet",
    sourceLanguage: "en",
    targetLanguage: "pt",
    source: "turn",
    aliases: ["Turn"],
    target: "virar",
    kind: "instruction",
    confidence: 0.88
  }
];
