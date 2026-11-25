import type React from 'react'
import { clamp01, lerp } from '../animation'
import { TokenChip } from '../components/TokenChip'
import type { ChipBox, ChipMetrics } from '../components/tokenLayout'
import { chipHeight, layoutTokens, visibleText } from '../components/tokenLayout'
import { Tower, TOWER_BANDS_HEIGHT, TOWER_WIDTH } from '../components/Tower'
import { Wheel, WHEEL_POINTER_TIP, WHEEL_RIM } from '../components/Wheel'
import type { Token } from '../data/sentence'
import { FULL_STOP_TOKEN, PROMPT_TOKENS, TIRED_TOKEN } from '../data/sentence'
import { STAGE } from '../theme'

// Shared stage for the sampler and closing scenes: a small tower on the left,
// the wheel on the right and the growing sentence along the bottom.

export const SENTENCE_METRICS: ChipMetrics = { fontSize: 40, padX: 16, wordGap: 12, pieceGap: 4 }
export const SENTENCE_TOP = 860
// The sentence is placed so that its longest finished form sits centred.
export const SENTENCE_LEFT =
  (STAGE.width -
    layoutTokens([...PROMPT_TOKENS, TIRED_TOKEN, FULL_STOP_TOKEN], SENTENCE_METRICS).width) /
  2

const TOWER_FRAME = { left: 90, top: 240, scale: 0.5 }
const WHEEL_FRAME = { left: 1090, top: 190 }

// Stage coordinates of the tower's edges and the wheel's pointer, for arrows.
export const TOWER_EDGES = {
  right: TOWER_FRAME.left + TOWER_WIDTH * TOWER_FRAME.scale,
  bottom: TOWER_FRAME.top + TOWER_BANDS_HEIGHT * TOWER_FRAME.scale,
  centerX: TOWER_FRAME.left + (TOWER_WIDTH * TOWER_FRAME.scale) / 2,
  topBandY: TOWER_FRAME.top + 80 * TOWER_FRAME.scale,
}
export const WHEEL_LEFT = WHEEL_FRAME.left
export const WHEEL_CENTER_X = WHEEL_FRAME.left + WHEEL_RIM.centerX
export const WHEEL_BOTTOM = WHEEL_FRAME.top + WHEEL_RIM.bottom
export const POINTER = {
  x: WHEEL_FRAME.left + WHEEL_POINTER_TIP.x,
  y: WHEEL_FRAME.top + WHEEL_POINTER_TIP.y,
}
// How far behind the flying chip each of its trailing copies sits (in flight).
const TRAIL_STEPS = [0.05, 0.1, 0.15, 0.2]

interface LandingChipProps {
  token: Token
  color: string
  // Where the chip belongs in the sentence row.
  box: ChipBox
  rowTop: number
  // 0 = at the wheel's pointer, 1 = landed in the sentence.
  flight: number
  opacity?: number
  scale?: number
}

export const PipelineTower: React.FC<React.ComponentProps<typeof Tower> & { opacity?: number }> = ({
  opacity = 1,
  ...towerProps
}) => (
  <div
    style={{
      position: 'absolute',
      left: TOWER_FRAME.left,
      top: TOWER_FRAME.top,
      opacity,
      transform: `scale(${TOWER_FRAME.scale})`,
      transformOrigin: 'top left',
    }}
  >
    <Tower showInputRow={false} {...towerProps} />
  </div>
)

export const PipelineWheel: React.FC<React.ComponentProps<typeof Wheel>> = (wheelProps) => (
  <div style={{ position: 'absolute', ...WHEEL_FRAME }}>
    <Wheel {...wheelProps} />
  </div>
)

// A new token that flies from the wheel's pointer down into the sentence.
export const LandingChip: React.FC<LandingChipProps> = ({
  token,
  color,
  box,
  rowTop,
  flight,
  opacity = 1,
  scale = 1,
}) => {
  if (flight <= 0 || opacity <= 0 || scale <= 0) {
    return null
  }
  // While in the air, the chip drags a few fading copies of itself behind it.
  const inFlight = flight < 1
  const ghosts = inFlight
    ? TRAIL_STEPS.map((step) => flight - step).filter((position) => position > 0)
    : []

  return (
    <>
      {[...ghosts.reverse(), flight].map((position, index, all) => {
        const isChip = index === all.length - 1
        const hop = Math.sin(Math.PI * position) * 70
        return (
          <div
            key={index}
            style={{
              position: 'absolute',
              left: lerp(POINTER.x - box.width / 2, SENTENCE_LEFT + box.x, position),
              top: lerp(POINTER.y, rowTop, position) - hop,
              opacity: opacity * (isChip ? 1 : 0.12 + 0.1 * index),
              transform: `scale(${lerp(1.3, 1, position) * scale})`,
            }}
          >
            <TokenChip
              text={visibleText(token)}
              color={color}
              width={box.width}
              fontSize={SENTENCE_METRICS.fontSize}
              flash={isChip ? landingFlash(flight) : 0}
            />
          </div>
        )
      })}
    </>
  )
}

// The stage position of the middle of a chip in the sentence row.
export function sentenceChipCenter(box: ChipBox, rowTop: number): { x: number; y: number } {
  return {
    x: SENTENCE_LEFT + box.x + box.width / 2,
    y: rowTop + chipHeight(SENTENCE_METRICS.fontSize) / 2,
  }
}

// Layout of the prompt followed by the given ending, in sentence-row metrics.
export function sentenceBoxes(ending: Token[]): ChipBox[] {
  return layoutTokens([...PROMPT_TOKENS, ...ending], SENTENCE_METRICS).boxes
}

// The chip glows white just as it touches down (flight close to 1).
function landingFlash(flight: number): number {
  return flight < 1 ? clamp01((flight - 0.8) * 4) : 0
}
