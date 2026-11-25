import type React from 'react'
import { Easing, useCurrentFrame } from 'remotion'
import { clamp01, lerp, pop, pulse, ramp } from '../animation'
import { Burst } from '../components/Burst'
import { SceneFrame } from '../components/SceneFrame'
import { TokenRow } from '../components/TokenChip'
import { rotationToLandOn } from '../components/Wheel'
import {
  ATTENTION_BY_LAYER,
  FULL_STOP_TOKEN,
  NEXT_WORD_CANDIDATES,
  PROMPT_TOKENS,
  SECOND_STEP_CANDIDATES,
  TIRED_TOKEN,
  WIDE_TOKEN,
} from '../data/sentence'
import { COLORS, CONFETTI_COLORS, withAlpha } from '../theme'
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
} from './pipeline'

// "AI guesses the next word, again and again." with the key words lit up.
const TAKEAWAY_WORDS = [
  { text: 'AI', highlighted: false },
  { text: 'guesses', highlighted: false },
  { text: 'the', highlighted: false },
  { text: 'next', highlighted: true },
  { text: 'word,', highlighted: true },
  { text: 'again', highlighted: false },
  { text: 'and', highlighted: false },
  { text: 'again.', highlighted: false },
]

const TEXT_IN_START = 5
const SPREAD_START = 20
const SPREAD_END = 45
const FIRST_BOX_AT = 30
const BOX_STEP = 3
const BANDS_IN_START = 60
const FIRST_RISE_START = 90
const RISE_STEP = 30
const RISE_FRAMES = 24
const WHEEL_IN_START = 215
const BEND_START = 235
const BEND_END = 275
const SPIN_START = 285
const SPIN_END = 385
const FLIGHT_START = 400
const FLIGHT_END = 430
const FULL_STOP_AT = 445
const STAGE_OUT_START = 455
const COMPARE_START = 470
const COMPARE_END = 530
const TAKEAWAY_START = 545

const TIRED_INDEX = 0
const WIDE_INDEX = 1
const FULL_STOP_COLOR = SECOND_STEP_CANDIDATES[0].color
const SPIN_DEGREES = rotationToLandOn(NEXT_WORD_CANDIDATES, WIDE_INDEX, 0.66, 3)
const TIRED_BOXES = sentenceBoxes([TIRED_TOKEN, FULL_STOP_TOKEN])
const WIDE_BOXES = sentenceBoxes([WIDE_TOKEN, FULL_STOP_TOKEN])
const ENDING_START = PROMPT_TOKENS.length
// Final picture: the prompt in the middle, with the two endings above and below.
const COMPARE_ROW_TOP = 470
const ENDING_OFFSET = 44
const TAKEAWAY_TOP = 740
const TAKEAWAY_WORD_STEP = 4
// Stage x positions the final confetti is fired from.
const CONFETTI_CANNONS = [520, 1400]
// Timed so the last piece has faded before the scene holds on its final frame.
const CONFETTI_DELAY = 8
const CONFETTI_LIFE_FRAMES = 44

// The whole pipeline once more, fast. This time the wheel stops on "wide", so
// the same prompt ends in a different sentence.
export const ClosingScene: React.FC = () => {
  const frame = useCurrentFrame()

  const layerStarts = ATTENTION_BY_LAYER.map((_, index) => FIRST_RISE_START + index * RISE_STEP)
  const lastLayerStart = layerStarts[layerStarts.length - 1]
  const rise = layerStarts.reduce(
    (total, start) => total + ramp(frame, start, start + RISE_FRAMES),
    0,
  )
  const stageOpacity = 1 - ramp(frame, STAGE_OUT_START, STAGE_OUT_START + 30)
  const compare = ramp(frame, COMPARE_START, COMPARE_END)
  const rowTop = lerp(SENTENCE_TOP, COMPARE_ROW_TOP, compare)
  const wideRowTop = rowTop + ENDING_OFFSET * compare
  const tiredRowTop = rowTop - ENDING_OFFSET
  const tiredOpacity = ramp(frame, COMPARE_END - 25, COMPARE_END + 5)
  return (
    <SceneFrame title="Again, and again">
      <PipelineTower
        rise={rise}
        lineProgress={layerStarts.map((start) => ramp(frame, start + 18, start + 40))}
        outputProgress={ramp(frame, lastLayerStart + 40, lastLayerStart + 58)}
        nextSlot={ramp(frame, lastLayerStart + 54, lastLayerStart + 62)}
        bandsReveal={ramp(frame, BANDS_IN_START, BANDS_IN_START + 30)}
        opacity={stageOpacity}
      />
      <PipelineWheel
        slices={NEXT_WORD_CANDIDATES}
        bend={ramp(frame, BEND_START, BEND_END)}
        pointerOpacity={ramp(frame, BEND_END, BEND_END + 10)}
        rotation={SPIN_DEGREES * ramp(frame, SPIN_START, SPIN_END, Easing.out(Easing.cubic))}
        spin={ramp(frame, SPIN_START, SPIN_END, Easing.linear)}
        highlight={{ index: WIDE_INDEX, amount: ramp(frame, SPIN_END, SPIN_END + 15) }}
        opacity={ramp(frame, WHEEL_IN_START, WHEEL_IN_START + 15) * stageOpacity}
      />

      <TokenRow
        tokens={PROMPT_TOKENS}
        metrics={SENTENCE_METRICS}
        left={SENTENCE_LEFT}
        top={rowTop}
        spread={ramp(frame, SPREAD_START, SPREAD_END)}
        chipState={(index) => ({
          opacity: ramp(frame, TEXT_IN_START, TEXT_IN_START + 15),
          box: pop(frame, FIRST_BOX_AT + index * BOX_STEP),
          flash: pulse(frame, FIRST_BOX_AT + index * BOX_STEP, 10),
        })}
      />

      <LandingChip
        token={WIDE_TOKEN}
        color={NEXT_WORD_CANDIDATES[WIDE_INDEX].color}
        box={WIDE_BOXES[ENDING_START]}
        rowTop={wideRowTop}
        flight={ramp(frame, FLIGHT_START, FLIGHT_END)}
      />
      <LandingChip
        token={FULL_STOP_TOKEN}
        color={FULL_STOP_COLOR}
        box={WIDE_BOXES[ENDING_START + 1]}
        rowTop={wideRowTop}
        flight={1}
        scale={pop(frame, FULL_STOP_AT)}
      />
      <LandingChip
        token={TIRED_TOKEN}
        color={NEXT_WORD_CANDIDATES[TIRED_INDEX].color}
        box={TIRED_BOXES[ENDING_START]}
        rowTop={tiredRowTop}
        flight={1}
        opacity={tiredOpacity}
      />
      <LandingChip
        token={FULL_STOP_TOKEN}
        color={FULL_STOP_COLOR}
        box={TIRED_BOXES[ENDING_START + 1]}
        rowTop={tiredRowTop}
        flight={1}
        opacity={tiredOpacity}
      />

      <Burst
        x={POINTER.x}
        y={POINTER.y}
        at={SPIN_END}
        colors={CONFETTI_COLORS}
        count={34}
        distance={330}
        lifeFrames={38}
        ring
      />
      <Burst
        {...sentenceChipCenter(WIDE_BOXES[ENDING_START], SENTENCE_TOP)}
        at={FLIGHT_END}
        colors={CONFETTI_COLORS}
        count={16}
        distance={150}
        ring
      />

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: TAKEAWAY_TOP,
          display: 'flex',
          justifyContent: 'center',
          gap: '0.27em',
          fontSize: 68,
          fontWeight: 800,
          letterSpacing: -1,
        }}
      >
        {TAKEAWAY_WORDS.map(({ text, highlighted }, index) => {
          const appear = pop(frame, TAKEAWAY_START + index * TAKEAWAY_WORD_STEP)
          return (
            <span
              key={index}
              style={{
                display: 'inline-block',
                color: highlighted ? COLORS.glow : COLORS.ink,
                textShadow: `0 0 34px ${withAlpha(COLORS.glow, highlighted ? 0.9 : 0.45)}`,
                opacity: clamp01(appear * 2),
                transform: `translateY(${(1 - appear) * 50}px) scale(${0.7 + 0.3 * appear})`,
              }}
            >
              {text}
            </span>
          )
        })}
      </div>
      {CONFETTI_CANNONS.map((x) => (
        <Burst
          key={x}
          x={x}
          y={TAKEAWAY_TOP + 40}
          at={TAKEAWAY_START + CONFETTI_DELAY}
          colors={CONFETTI_COLORS}
          count={60}
          distance={620}
          lifeFrames={CONFETTI_LIFE_FRAMES}
        />
      ))}
    </SceneFrame>
  )
}
