import type { Token } from '../data/sentence'

// JetBrains Mono advances exactly 0.6em per character, which lets every chip
// position be computed up front instead of measured in the browser.
const MONO_CHAR_WIDTH_EM = 0.6

export interface ChipMetrics {
  fontSize: number
  padX: number
  // Space before a token that starts a new word.
  wordGap: number
  // Space before a token that continues the previous word.
  pieceGap: number
}

export interface ChipBox {
  x: number
  width: number
}

export interface RowLayout {
  boxes: ChipBox[]
  width: number
  height: number
}

// `spread` 0 lays the tokens out like plain text; 1 gives every token its own
// padded chip. Values in between animate from one to the other.
export function layoutTokens(tokens: Token[], metrics: ChipMetrics, spread = 1): RowLayout {
  const charWidth = metrics.fontSize * MONO_CHAR_WIDTH_EM
  const boxes: ChipBox[] = []
  let x = 0

  tokens.forEach((token, index) => {
    if (index > 0) {
      const newWord = startsWord(token)
      const plainGap = newWord ? charWidth : 0
      const chipGap = newWord ? metrics.wordGap : metrics.pieceGap
      x += plainGap + (chipGap - plainGap) * spread
    }
    const width = visibleText(token).length * charWidth + 2 * metrics.padX * spread
    boxes.push({ x, width })
    x += width
  })

  return { boxes, width: x, height: chipHeight(metrics.fontSize) }
}

export function chipHeight(fontSize: number): number {
  return Math.round(fontSize * 1.5)
}

export function visibleText(token: Token): string {
  return token.text.trimStart()
}

function startsWord(token: Token): boolean {
  return token.text.startsWith(' ')
}
