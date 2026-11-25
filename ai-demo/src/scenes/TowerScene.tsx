import type React from 'react'
import { useCurrentFrame } from 'remotion'
import { pop, ramp } from '../animation'
import { Burst } from '../components/Burst'
import { GlossedTerm, SceneFrame } from '../components/SceneFrame'
import { Tower, TOWER_STRONGEST_TARGET } from '../components/Tower'
import { KEY_TERMS } from '../data/sentence'
import { CONFETTI_COLORS } from '../theme'

const INPUT_ROW_IN = 20
const BANDS_IN_START = 50
const BANDS_IN_END = 110
const LAYER_TERM_AT = 105
const ATTENTION_TERM_AT = 205
// Frame at which the tokens start climbing into each layer, lowest first.
const LAYER_STARTS = [150, 320, 490, 660]
const RISE_FRAMES = 36
const LINES_DELAY = 44
const LINES_FRAMES = 60
const EMPHASIS_START = 775
// The last token, "too", draws its own lines: this is where the guess is made.
const OUTPUT_START = 812
const OUTPUT_FRAMES = 45
const NEXT_SLOT_AT = 862

const TOWER_POSITION = { left: 80, top: 200 }

// The tokens climb through four layers. In each one, lines show what the word
// "it" is looking at: everything a little at first, then mostly "dog". Last,
// "too" looks back over the sentence, because the next word is predicted there.
export const TowerScene: React.FC = () => {
  const frame = useCurrentFrame()

  const rise = LAYER_STARTS.reduce(
    (total, start) => total + ramp(frame, start, start + RISE_FRAMES),
    0,
  )
  const lineProgress = LAYER_STARTS.map((start) =>
    ramp(frame, start + LINES_DELAY, start + LINES_DELAY + LINES_FRAMES),
  )

  return (
    <SceneFrame
      title="Layers and attention"
      terms={
        <>
          <GlossedTerm term={KEY_TERMS.layer} at={LAYER_TERM_AT} />
          <GlossedTerm term={KEY_TERMS.attention} at={ATTENTION_TERM_AT} />
        </>
      }
    >
      <div style={{ position: 'absolute', ...TOWER_POSITION }}>
        <Tower
          rise={rise}
          lineProgress={lineProgress}
          bandsReveal={ramp(frame, BANDS_IN_START, BANDS_IN_END)}
          inputRowOpacity={ramp(frame, INPUT_ROW_IN, INPUT_ROW_IN + 25)}
          emphasis={pop(frame, EMPHASIS_START)}
          outputProgress={ramp(frame, OUTPUT_START, OUTPUT_START + OUTPUT_FRAMES)}
          nextSlot={pop(frame, NEXT_SLOT_AT)}
        />
      </div>
      <Burst
        x={TOWER_POSITION.left + TOWER_STRONGEST_TARGET.x}
        y={TOWER_POSITION.top + TOWER_STRONGEST_TARGET.y}
        at={EMPHASIS_START}
        colors={CONFETTI_COLORS}
        count={26}
        distance={260}
        ring
      />
    </SceneFrame>
  )
}
