import type React from 'react'
import { random, useCurrentFrame } from 'remotion'
import { clamp01, pop, pulse, ramp } from '../animation'
import { Burst } from '../components/Burst'
import { SceneFrame } from '../components/SceneFrame'
import { TokenRow } from '../components/TokenChip'
import type { ChipMetrics } from '../components/tokenLayout'
import { layoutTokens } from '../components/tokenLayout'
import { GERMAN_WORD_TOKENS } from '../data/sentence'
import { COLORS, CONFETTI_COLORS, FONTS, STAGE, TOKEN_PALETTE, withAlpha } from '../theme'

const TEXT_IN_START = 10
const SHAKE_START = 55
const SHATTER_START = 75
const SHATTER_END = 125
const FIRST_ID_AT = 150
const ID_STEP = 5
const COUNT_AT = 228

const GERMAN_WORD = GERMAN_WORD_TOKENS.map((token) => token.text).join('')
const WORD_TOP = 330
const ROW_TOP = 440
const COUNT_TOP = 690
const METRICS: ChipMetrics = { fontSize: 52, padX: 18, wordGap: 16, pieceGap: 5 }
// How far a piece is thrown while the word breaks apart.
const BURST = { distance: 150, rotation: 28 }

// One long German word breaks into many tokens: rare words need more pieces.
export const GermanWordScene: React.FC = () => {
  const frame = useCurrentFrame()

  const spread = ramp(frame, SHATTER_START, SHATTER_END)
  const layout = layoutTokens(GERMAN_WORD_TOKENS, METRICS, spread)
  // The word trembles harder and harder until it breaks.
  const tension = frame < SHATTER_START ? ramp(frame, SHAKE_START, SHATTER_START) : 0
  const shake = Math.sin(frame * 2.4) * 12 * tension
  // Peaks halfway through the shatter and is back to zero when the pieces land.
  const burst = Math.sin(Math.PI * spread)
  const countAppear = pop(frame, FIRST_ID_AT - 12)
  // The count climbs as each piece shows its ID, then bumps when it is final.
  const counted = Math.min(
    GERMAN_WORD_TOKENS.length,
    Math.max(1, Math.floor((frame - FIRST_ID_AT) / ID_STEP) + 1),
  )
  const countBump = pulse(frame, COUNT_AT, 16)

  return (
    <SceneFrame title="And in German?">
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: WORD_TOP,
          textAlign: 'center',
          fontFamily: FONTS.mono,
          fontSize: 40,
          fontWeight: 500,
          color: COLORS.muted,
          opacity: ramp(frame, SHATTER_END, SHATTER_END + 20),
        }}
      >
        {GERMAN_WORD}
      </div>
      <TokenRow
        tokens={GERMAN_WORD_TOKENS}
        metrics={METRICS}
        left={(STAGE.width - layout.width) / 2 + shake}
        top={ROW_TOP}
        spread={spread}
        chipState={(index) => ({
          opacity: ramp(frame, TEXT_IN_START, TEXT_IN_START + 20),
          box: ramp(frame, SHATTER_START, SHATTER_START + 15),
          flash: pulse(frame, SHATTER_START, 18) + pulse(frame, FIRST_ID_AT + index * ID_STEP, 8) * 0.6,
          dy: burst * (random(`dy-${index}`) - 0.5) * 2 * BURST.distance,
          rotate: burst * (random(`rotate-${index}`) - 0.5) * 2 * BURST.rotation,
          idReveal: ramp(frame, FIRST_ID_AT + index * ID_STEP, FIRST_ID_AT + index * ID_STEP + 14),
        })}
      />
      <Burst
        x={STAGE.width / 2}
        y={ROW_TOP + layout.height / 2}
        at={SHATTER_START}
        colors={[...TOKEN_PALETTE, COLORS.onColor]}
        count={48}
        distance={520}
        lifeFrames={40}
        ring
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: COUNT_TOP,
          textAlign: 'center',
          fontSize: 64,
          fontWeight: 800,
          textShadow: `0 0 ${30 + 50 * countBump}px ${withAlpha(COLORS.glow, 0.5 + 0.5 * countBump)}`,
          opacity: clamp01(countAppear * 2),
          transform: `scale(${0.7 + 0.3 * countAppear + 0.14 * countBump})`,
        }}
      >
        1 word = <span style={{ color: COLORS.glow }}>{counted}</span> tokens
      </div>
      <Burst
        x={STAGE.width / 2}
        y={COUNT_TOP + 40}
        at={COUNT_AT}
        colors={CONFETTI_COLORS}
        count={30}
        distance={420}
      />
    </SceneFrame>
  )
}
