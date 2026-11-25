import type React from 'react'
import { Easing, useCurrentFrame } from 'remotion'
import { clamp01, lerp, pop, pulse, ramp } from '../animation'
import { Burst } from '../components/Burst'
import { GlossedTerm, SceneFrame } from '../components/SceneFrame'
import { TokenRow } from '../components/TokenChip'
import type { ChipMetrics } from '../components/tokenLayout'
import { layoutTokens } from '../components/tokenLayout'
import { KEY_TERMS, PROMPT_TOKENS } from '../data/sentence'
import { COLORS, FONT_SIZES, STAGE, tokenColor, withAlpha } from '../theme'

const TEXT_IN_START = 15
const SPREAD_START = 75
const SPREAD_END = 115
// A bar of light sweeps across the sentence; each token snaps into its box
// as the light passes over it.
const SCAN_START = 135
const SCAN_END = 400
const SPLIT_NOTE_AT = 410
const TERM_AT = 440
const FIRST_ID_AT = 500
const ID_STEP = 18
const ID_FLIP_FRAMES = 16

const ROW_TOP = 470
const METRICS: ChipMetrics = { fontSize: 48, padX: 16, wordGap: 16, pieceGap: 4 }
const CHIP_LAYOUT = layoutTokens(PROMPT_TOKENS, METRICS)
const CHIP_ROW_LEFT = (STAGE.width - CHIP_LAYOUT.width) / 2
const SCAN_MARGIN = 70
const SCAN_FROM_X = CHIP_ROW_LEFT - SCAN_MARGIN
const SCAN_TO_X = CHIP_ROW_LEFT + CHIP_LAYOUT.width + SCAN_MARGIN
const SCAN_BEAM = { width: 8, height: 250, trail: 190 }
// For each token: the stage x of its middle and the frame the light reaches it.
const CHIP_BEATS = CHIP_LAYOUT.boxes.map((box) => {
  const centerX = CHIP_ROW_LEFT + box.x + box.width / 2
  const at = lerp(SCAN_START, SCAN_END, (centerX - SCAN_FROM_X) / (SCAN_TO_X - SCAN_FROM_X))
  return { centerX, at: Math.round(at) }
})
// "didn't" is the one word in the sentence that becomes two tokens.
const SPLIT_WORD = { firstIndex: 2, lastIndex: 3 }

// The sentence turns into coloured chips, one per token, and each chip then
// opens to show the ID number the model actually works with.
export const TokensScene: React.FC = () => {
  const frame = useCurrentFrame()

  const spread = ramp(frame, SPREAD_START, SPREAD_END)
  const layout = layoutTokens(PROMPT_TOKENS, METRICS, spread)
  const rowLeft = (STAGE.width - layout.width) / 2

  const scan = ramp(frame, SCAN_START, SCAN_END, Easing.linear)
  const scanX = lerp(SCAN_FROM_X, SCAN_TO_X, scan)
  const scanOpacity = clamp01(scan * 12) * clamp01((1 - scan) * 12)

  const first = layout.boxes[SPLIT_WORD.firstIndex]
  const last = layout.boxes[SPLIT_WORD.lastIndex]
  const noteAppear = pop(frame, SPLIT_NOTE_AT)

  return (
    <SceneFrame
      title="Words become tokens"
      terms={<GlossedTerm term={KEY_TERMS.token} at={TERM_AT} />}
    >
      <TokenRow
        tokens={PROMPT_TOKENS}
        metrics={METRICS}
        left={rowLeft}
        top={ROW_TOP}
        spread={spread}
        chipState={(index) => {
          const idAt = FIRST_ID_AT + index * ID_STEP
          return {
            opacity: ramp(frame, TEXT_IN_START, TEXT_IN_START + 25),
            box: pop(frame, CHIP_BEATS[index].at),
            flash: pulse(frame, CHIP_BEATS[index].at, 12) + pulse(frame, idAt, 10) * 0.6,
            // A chip hops as it snaps into its box and dips as its ID opens.
            dy:
              -18 * Math.sin(Math.PI * ramp(frame, CHIP_BEATS[index].at, CHIP_BEATS[index].at + 14, Easing.linear)) +
              6 * pulse(frame, idAt, 10),
            idReveal: ramp(frame, idAt, idAt + ID_FLIP_FRAMES),
          }
        }}
      />

      {CHIP_BEATS.map((beat, index) => (
        <Burst
          key={index}
          x={beat.centerX}
          y={ROW_TOP + CHIP_LAYOUT.height / 2}
          at={beat.at}
          colors={[tokenColor(index), COLORS.onColor, COLORS.glow]}
          count={9}
          distance={95}
          lifeFrames={22}
        />
      ))}

      <div
        style={{
          position: 'absolute',
          left: scanX - SCAN_BEAM.trail,
          top: ROW_TOP + CHIP_LAYOUT.height / 2 - SCAN_BEAM.height / 2,
          width: SCAN_BEAM.trail,
          height: SCAN_BEAM.height,
          background: `linear-gradient(90deg, transparent, ${withAlpha(COLORS.glow, 0.22)})`,
          opacity: scanOpacity,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: scanX - SCAN_BEAM.width / 2,
          top: ROW_TOP + CHIP_LAYOUT.height / 2 - SCAN_BEAM.height / 2,
          width: SCAN_BEAM.width,
          height: SCAN_BEAM.height,
          borderRadius: SCAN_BEAM.width / 2,
          background: COLORS.onColor,
          boxShadow: `0 0 30px 8px ${COLORS.glow}, 0 0 90px 20px ${withAlpha(COLORS.glow, 0.5)}`,
          opacity: scanOpacity,
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: rowLeft + first.x,
          top: ROW_TOP - 100,
          width: last.x + last.width - first.x,
          opacity: clamp01(noteAppear * 2),
          transform: `translateY(${(1 - noteAppear) * 20}px)`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: 34,
            transform: 'translateX(-50%)',
            whiteSpace: 'nowrap',
            fontSize: FONT_SIZES.caption,
            fontWeight: 700,
            textShadow: `0 0 20px ${withAlpha(COLORS.glow, 0.8)}`,
          }}
        >
          1 word = 2 tokens
        </div>
        <div
          style={{
            height: 18,
            marginTop: 62,
            border: `5px solid ${COLORS.glow}`,
            borderBottom: 'none',
            borderRadius: '10px 10px 0 0',
            boxShadow: `0 -6px 18px ${withAlpha(COLORS.glow, 0.5)}`,
          }}
        />
      </div>
    </SceneFrame>
  )
}
