import { COLORS, TOKEN_PALETTE } from '../theme'

// Token splits and IDs are real: they come from `bun run tokenize`, which uses
// cl100k_base (the GPT-4 encoding). A token's text keeps its leading space.
export const PROMPT_TOKENS: Token[] = [
  { text: 'The', id: 791 },
  { text: ' dog', id: 5679 },
  { text: ' didn', id: 3287 },
  { text: "'t", id: 956 },
  { text: ' cross', id: 5425 },
  { text: ' the', id: 279 },
  { text: ' street', id: 8761 },
  { text: ' because', id: 1606 },
  { text: ' it', id: 433 },
  { text: ' was', id: 574 },
  { text: ' too', id: 2288 },
]

export const PROMPT_TEXT = PROMPT_TOKENS.map((token) => token.text).join('')

export const GERMAN_WORD_TOKENS: Token[] = [
  { text: 'D', id: 35 },
  { text: 'ona', id: 6863 },
  { text: 'ud', id: 664 },
  { text: 'amp', id: 1141 },
  { text: 'fs', id: 3933 },
  { text: 'ch', id: 331 },
  { text: 'if', id: 333 },
  { text: 'ff', id: 544 },
  { text: 'ah', id: 1494 },
  { text: 'rt', id: 3423 },
  { text: 'sg', id: 2034 },
  { text: 'es', id: 288 },
  { text: 'ellschaft', id: 70801 },
]

export const TIRED_TOKEN: Token = { text: ' tired', id: 19781 }
export const WIDE_TOKEN: Token = { text: ' wide', id: 7029 }
export const FULL_STOP_TOKEN: Token = { text: '.', id: 13 }

// Everything below is hand-authored for the picture, not measured from a model.

// The word whose attention the tower scene follows.
export const FOCUS_TOKEN_INDEX = 8

// How strongly "it" looks at each earlier token, lowest layer first. A model
// only looks backwards, so there are no weights for "was" and "too".
export const ATTENTION_BY_LAYER: number[][] = [
  [0.12, 0.14, 0.12, 0.1, 0.13, 0.12, 0.14, 0.13],
  [0.08, 0.22, 0.1, 0.06, 0.12, 0.08, 0.22, 0.12],
  [0.04, 0.4, 0.06, 0.03, 0.08, 0.04, 0.28, 0.07],
  [0.02, 0.58, 0.02, 0.01, 0.03, 0.02, 0.28, 0.04],
]

// The next word is predicted from the last token. This is how strongly "too"
// looks at each earlier token in the top layer.
export const LAST_TOKEN_INDEX = PROMPT_TOKENS.length - 1
export const LAST_TOKEN_ATTENTION: number[] = [
  0.01, 0.22, 0.1, 0.06, 0.12, 0.01, 0.08, 0.05, 0.25, 0.1,
]

export const NEXT_WORD_CANDIDATES: Candidate[] = [
  { label: 'tired', percent: 41, color: TOKEN_PALETTE[0] },
  { label: 'wide', percent: 22, color: TOKEN_PALETTE[1] },
  { label: 'busy', percent: 9, color: TOKEN_PALETTE[2] },
  { label: 'scared', percent: 6, color: TOKEN_PALETTE[3] },
  { label: 'hot', percent: 4, color: TOKEN_PALETTE[4] },
  { label: 'other', percent: 18, color: COLORS.other },
]

// What could follow "... it was too tired".
export const SECOND_STEP_CANDIDATES: Candidate[] = [
  { label: '.', percent: 62, color: TOKEN_PALETTE[5] },
  { label: 'to', percent: 16, color: TOKEN_PALETTE[6] },
  { label: 'and', percent: 9, color: TOKEN_PALETTE[7] },
  { label: ',', percent: 5, color: TOKEN_PALETTE[4] },
  { label: 'other', percent: 8, color: COLORS.other },
]

export const KEY_TERMS = {
  token: { term: 'token', gloss: 'Textbaustein' },
  layer: { term: 'layer', gloss: 'Schicht' },
  attention: { term: 'attention', gloss: 'Aufmerksamkeit' },
  sampler: { term: 'sampler', gloss: 'Zufallsauswahl' },
} satisfies Record<string, KeyTerm>

export interface Token {
  text: string
  id: number
}

export interface Candidate {
  label: string
  percent: number
  color: string
}

export interface KeyTerm {
  term: string
  gloss: string
}
