import type React from 'react'
import { Fragment } from 'react'
import { Easing, useCurrentFrame } from 'remotion'
import { clamp01, ramp } from '../animation'
import { Arrow } from '../components/Arrow'
import { Burst } from '../components/Burst'
import { GlossedTerm, SceneFrame } from '../components/SceneFrame'
import { TokenRow } from '../components/TokenChip'
import { chipHeight } from '../components/tokenLayout'
import { rotationToLandOn } from '../components/Wheel'
import {
  ATTENTION_BY_LAYER,
  FULL_STOP_TOKEN,
  KEY_TERMS,
  NEXT_WORD_CANDIDATES,
  PROMPT_TOKENS,
  SECOND_STEP_CANDIDATES,
  TIRED_TOKEN,
} from '../data/sentence'
import { COLORS, CONFETTI_COLORS } from '../theme'
import {
  LandingChip,
  PipelineTower,
  PipelineWheel,
  POINTER,
  sentenceChipCenter,
  SENTENCE_LEFT,
  SENTENCE_METRICS,
  SENTENCE_TOP,
  sentenceBoxes,
  TOWER_EDGES,
  WHEEL_BOTTOM,
  WHEEL_CENTER_X,
  WHEEL_LEFT,
} from './pipeline'

const STAGE_IN_END = 30
const OUTPUT_ARROW_START = 50
const BARS_START = 80
const BARS_END = 200
const TERM_AT = 215
const BEND_START = 250
const BEND_END = 340
const POINTER_IN_START = 345
const FIRST_SPIN_START = 370
const FIRST_SPIN_END = 520
const FIRST_FLIGHT_START = 550
const FIRST_FLIGHT_END = 600
const FEEDBACK_ARROW_START = 615
const FEEDBACK_GLOW_START = 650
const GLOW_STEP = 15
const WHEEL_SWAP_START = 700
const SECOND_SPIN_START = 730
const SECOND_SPIN_END = 820
const SECOND_FLIGHT_START = 835
const SECOND_FLIGHT_END = 875

const TIRED_INDEX = 0
const FULL_STOP_INDEX = 0
const FIRST_SPIN_DEGREES = rotationToLandOn(NEXT_WORD_CANDIDATES, TIRED_INDEX, 0.64, 4)
const SECOND_SPIN_DEGREES = rotationToLandOn(SECOND_STEP_CANDIDATES, FULL_STOP_INDEX, 0.6, 3)
const BOXES = sentenceBoxes([TIRED_TOKEN, FULL_STOP_TOKEN])
const TIRED_BOX = BOXES[PROMPT_TOKENS.length]
const FULL_STOP_BOX = BOXES[PROMPT_TOKENS.length + 1]
const ALL_LINES_DRAWN = ATTENTION_BY_LAYER.map(() => 1)
const spinEasing = Easing.out(Easing.cubic)

// The model's output is a list of chances. They bend into a wheel, the wheel
// picks "tired", and the longer sentence goes round again for the full stop.
export const SamplerScene: React.FC = () => {
  const frame = useCurrentFrame()

  const stageIn = ramp(frame, 0, STAGE_IN_END)
  const firstFlight = ramp(frame, FIRST_FLIGHT_START, FIRST_FLIGHT_END)
  const secondFlight = ramp(frame, SECOND_FLIGHT_START, SECOND_FLIGHT_END)
  const swap = ramp(frame, WHEEL_SWAP_START, WHEEL_SWAP_START + 25)
  // A highlight that travels up the tower as the longer sentence passes through.
  const bandGlow = ATTENTION_BY_LAYER.map((_, layerIndex) => {
    const peak = FEEDBACK_GLOW_START + layerIndex * GLOW_STEP
    return ramp(frame, peak - GLOW_STEP, peak) * (1 - ramp(frame, peak, peak + GLOW_STEP * 2))
  })
  const slotBlink = 0.45 + 0.55 * Math.abs(Math.sin(frame / 9))

  return (
    <SceneFrame
      title="Picking the next word"
      terms={<GlossedTerm term={KEY_TERMS.sampler} at={TERM_AT} />}
    >
      <PipelineTower
        rise={4}
        lineProgress={ALL_LINES_DRAWN}
        outputProgress={1}
        nextSlot={1}
        bandGlow={bandGlow}
        opacity={stageIn}
      />
      <Arrow
        from={{ x: TOWER_EDGES.right + 16, y: TOWER_EDGES.topBandY }}
        to={{ x: WHEEL_LEFT + 10, y: TOWER_EDGES.topBandY }}
        progress={ramp(frame, OUTPUT_ARROW_START, OUTPUT_ARROW_START + 30)}
      />

      <PipelineWheel
        slices={NEXT_WORD_CANDIDATES}
        barsReveal={ramp(frame, BARS_START, BARS_END, Easing.linear) * NEXT_WORD_CANDIDATES.length}
        bend={ramp(frame, BEND_START, BEND_END)}
        pointerOpacity={ramp(frame, POINTER_IN_START, POINTER_IN_START + 15)}
        rotation={FIRST_SPIN_DEGREES * ramp(frame, FIRST_SPIN_START, FIRST_SPIN_END, spinEasing)}
        spin={ramp(frame, FIRST_SPIN_START, FIRST_SPIN_END, Easing.linear)}
        highlight={{ index: TIRED_INDEX, amount: ramp(frame, FIRST_SPIN_END, FIRST_SPIN_END + 25) }}
        opacity={1 - swap}
      />
      {swap > 0 ? (
        <PipelineWheel
          slices={SECOND_STEP_CANDIDATES}
          bend={1}
          pointerOpacity={1}
          rotation={
            SECOND_SPIN_DEGREES * ramp(frame, SECOND_SPIN_START, SECOND_SPIN_END, spinEasing)
          }
          spin={ramp(frame, SECOND_SPIN_START, SECOND_SPIN_END, Easing.linear)}
          highlight={{
            index: FULL_STOP_INDEX,
            amount: ramp(frame, SECOND_SPIN_END, SECOND_SPIN_END + 15),
          }}
          opacity={swap}
        />
      ) : null}

      <TokenRow
        tokens={PROMPT_TOKENS}
        metrics={SENTENCE_METRICS}
        left={SENTENCE_LEFT}
        top={SENTENCE_TOP}
        chipState={() => ({ opacity: stageIn })}
      />
      <EmptySlot
        left={SENTENCE_LEFT + TIRED_BOX.x}
        width={TIRED_BOX.width}
        opacity={stageIn * slotBlink * (1 - clamp01(firstFlight * 1.5))}
      />
      <EmptySlot
        left={SENTENCE_LEFT + FULL_STOP_BOX.x}
        width={FULL_STOP_BOX.width}
        opacity={
          ramp(frame, FIRST_FLIGHT_END, FIRST_FLIGHT_END + 15) *
          slotBlink *
          (1 - clamp01(secondFlight * 1.5))
        }
      />
      <Arrow
        from={{ x: TOWER_EDGES.centerX, y: SENTENCE_TOP - 18 }}
        to={{ x: TOWER_EDGES.centerX, y: TOWER_EDGES.bottom + 18 }}
        progress={ramp(frame, FEEDBACK_ARROW_START, FEEDBACK_ARROW_START + 35)}
      />

      <Arrow
        from={{ x: WHEEL_CENTER_X, y: WHEEL_BOTTOM + 14 }}
        to={{ x: SENTENCE_LEFT + TIRED_BOX.x + TIRED_BOX.width / 2, y: SENTENCE_TOP - 18 }}
        bulge={-22}
        progress={ramp(frame, FIRST_FLIGHT_START, FIRST_FLIGHT_END)}
      />

      <LandingChip
        token={TIRED_TOKEN}
        color={NEXT_WORD_CANDIDATES[TIRED_INDEX].color}
        box={TIRED_BOX}
        rowTop={SENTENCE_TOP}
        flight={firstFlight}
      />
      <LandingChip
        token={FULL_STOP_TOKEN}
        color={SECOND_STEP_CANDIDATES[FULL_STOP_INDEX].color}
        box={FULL_STOP_BOX}
        rowTop={SENTENCE_TOP}
        flight={secondFlight}
      />

      {/* Confetti when the wheel stops, and a spark when the token lands. */}
      {[
        { stopAt: FIRST_SPIN_END, landAt: FIRST_FLIGHT_END, box: TIRED_BOX },
        { stopAt: SECOND_SPIN_END, landAt: SECOND_FLIGHT_END, box: FULL_STOP_BOX },
      ].map(({ stopAt, landAt, box }) => (
        <Fragment key={stopAt}>
          <Burst
            x={POINTER.x}
            y={POINTER.y}
            at={stopAt}
            colors={CONFETTI_COLORS}
            count={34}
            distance={330}
            lifeFrames={38}
            ring
          />
          <Burst
            {...sentenceChipCenter(box, SENTENCE_TOP)}
            at={landAt}
            colors={CONFETTI_COLORS}
            count={16}
            distance={150}
            lifeFrames={22}
            ring
          />
        </Fragment>
      ))}
    </SceneFrame>
  )
}

// The dashed gap in the sentence where the next token will go.
const EmptySlot: React.FC<{ left: number; width: number; opacity: number }> = ({
  left,
  width,
  opacity,
}) => (
  <div
    style={{
      position: 'absolute',
      left,
      top: SENTENCE_TOP,
      width,
      height: chipHeight(SENTENCE_METRICS.fontSize),
      boxSizing: 'border-box',
      border: `5px dashed ${COLORS.muted}`,
      borderRadius: 12,
      opacity,
    }}
  />
)
