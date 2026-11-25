import type React from 'react'
import { interpolateColors, useCurrentFrame } from 'remotion'
import { clamp01, lerp } from '../animation'
import {
  ATTENTION_BY_LAYER,
  FOCUS_TOKEN_INDEX,
  LAST_TOKEN_ATTENTION,
  LAST_TOKEN_INDEX,
  PROMPT_TOKENS,
} from '../data/sentence'
import { COLORS, FONTS, withAlpha } from '../theme'
import type { ChipState } from './TokenChip'
import { TokenRow } from './TokenChip'
import type { ChipMetrics } from './tokenLayout'
import { layoutTokens } from './tokenLayout'

export const TOWER_WIDTH = 1760
// Height of the bands alone; the input row sits below them.
export const TOWER_BANDS_HEIGHT = 676

const LAYER_COUNT = ATTENTION_BY_LAYER.length
const BAND_HEIGHT = 160
const BAND_GAP = 12
const BAND_RADIUS = 22
const LABEL_GUTTER = 150
const ROW_INSET_BOTTOM = 14
const INPUT_ROW_GAP = 16
const PASSED_ROW_OPACITY = 0.45
const LINE_COLOR = '#CFDEFF'
// The last token's lines are warm, to tell them apart from the lines of "it".
const OUTPUT_COLOR = '#FFC857'
// How far the top layer's "it" lines fade once the last token's lines appear.
const FOCUS_LINES_DIMMED = 0.35
const NEXT_SLOT_WIDTH = 62
// Each attention line carries a pulse of light that runs from the word being
// looked at back to "it": the direction the information travels.
const PULSE_LENGTH = 0.1
const PULSE_SPEED = 0.014
const METRICS: ChipMetrics = { fontSize: 36, padX: 16, wordGap: 12, pieceGap: 4 }
const ROW_LAYOUT = layoutTokens(PROMPT_TOKENS, METRICS)
const ROW_LEFT = LABEL_GUTTER + (TOWER_WIDTH - LABEL_GUTTER - ROW_LAYOUT.width) / 2
// The token "it" ends up looking at most strongly in the top layer.
const STRONGEST_TARGET_INDEX = indexOfLargest(ATTENTION_BY_LAYER[LAYER_COUNT - 1])

// Centre of that token's chip in the top layer, in the tower's own coordinates.
export const TOWER_STRONGEST_TARGET = {
  x: chipCenterX(STRONGEST_TARGET_INDEX),
  y: rowTop(LAYER_COUNT) + ROW_LAYOUT.height / 2,
}

interface TowerProps {
  // How far the tokens have climbed: 0 = input row only, 4 = top layer.
  rise: number
  // Per layer, lowest first: how much of its attention lines are drawn (0..1).
  lineProgress: number[]
  // 0..1, fades the bands in from the bottom up.
  bandsReveal?: number
  showInputRow?: boolean
  inputRowOpacity?: number
  // 0..1, outlines the strongest target in the top layer.
  emphasis?: number
  // 0..1, draws the last token's own attention lines in the top layer: the
  // place where the next word is predicted.
  outputProgress?: number
  // 0..1, shows the empty slot for the next word after the last token.
  nextSlot?: number
  // Per layer, lowest first: 0..1 highlight used to show data passing through.
  bandGlow?: number[]
}

interface AttentionLineProps {
  path: string
  // 0..1, how strongly the token looks along this line.
  weight: number
  // 0..1, how much of the line is drawn.
  drawn: number
  color: string
  glowColor: string
  opacity?: number
  pulseOffset: number
}

// The model as a stack of layers. The prompt tokens climb from the input row
// through each layer, and each layer shows what the word "it" is looking at.
// At the top, the last token gathers what it needs to predict the next word.
export const Tower: React.FC<TowerProps> = ({
  rise,
  lineProgress,
  bandsReveal = 1,
  showInputRow = true,
  inputRowOpacity = 1,
  emphasis = 0,
  outputProgress = 0,
  nextSlot = 0,
  bandGlow,
}) => {
  const frame = useCurrentFrame()

  const layers = ATTENTION_BY_LAYER.map((weights, layerIndex) => {
    const layer = layerIndex + 1
    const arrival = clamp01(rise - layerIndex)
    const departure = layer < LAYER_COUNT ? clamp01(rise - layer) : 0
    return {
      layer,
      weights,
      arrival,
      departure,
      // 1 while this layer holds the tokens that are currently being worked on.
      active: Math.max(arrival * (1 - departure), bandGlow?.[layerIndex] ?? 0),
      lines: lineProgress[layerIndex] ?? 0,
      reveal: clamp01(bandsReveal * LAYER_COUNT - layerIndex),
    }
  })

  return (
    <div style={{ position: 'relative', width: TOWER_WIDTH, height: TOWER_BANDS_HEIGHT }}>
      {layers.map(({ layer, reveal, active }) => (
        <div
          key={layer}
          style={{ opacity: reveal, transform: `translateX(${(1 - reveal) * -60}px)` }}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: bandTop(layer),
              width: LABEL_GUTTER - 20,
              height: BAND_HEIGHT,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              fontFamily: FONTS.sans,
              fontSize: 32,
              fontWeight: 700,
              color: interpolateColors(active, [0, 1], [COLORS.muted, COLORS.ink]),
              textShadow: `0 0 ${24 * active}px ${withAlpha(COLORS.glow, 0.9 * active)}`,
            }}
          >
            Layer {layer}
          </div>
          <div
            style={{
              position: 'absolute',
              left: LABEL_GUTTER,
              top: bandTop(layer),
              width: TOWER_WIDTH - LABEL_GUTTER,
              height: BAND_HEIGHT,
              borderRadius: BAND_RADIUS,
              background: `linear-gradient(180deg, rgba(185, 208, 255, ${0.13 + 0.09 * active}), rgba(185, 208, 255, ${0.05 + 0.05 * active}))`,
              boxShadow: [
                `inset 0 0 0 ${2 + 2 * active}px ${withAlpha(COLORS.glow, 0.12 + 0.55 * active)}`,
                `0 0 ${50 * active}px ${withAlpha(COLORS.glow, 0.3 * active)}`,
              ].join(', '),
            }}
          />
        </div>
      ))}

      <svg
        width={TOWER_WIDTH}
        height={TOWER_BANDS_HEIGHT}
        style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}
      >
        {layers.map(({ layer, weights, arrival, lines }) =>
          arrival >= 1 && lines > 0
            ? weights.map((weight, targetIndex) => (
                <AttentionLine
                  key={`${layer}-${targetIndex}`}
                  path={attentionArc(layer, FOCUS_TOKEN_INDEX, targetIndex)}
                  weight={weight}
                  drawn={lines}
                  color={LINE_COLOR}
                  glowColor={COLORS.glow}
                  opacity={layer === LAYER_COUNT ? lerp(1, FOCUS_LINES_DIMMED, outputProgress) : 1}
                  pulseOffset={frame * PULSE_SPEED + targetIndex * 0.13 + layer * 0.29}
                />
              ))
            : null,
        )}
        {outputProgress > 0
          ? LAST_TOKEN_ATTENTION.map((weight, targetIndex) => (
              <AttentionLine
                key={`output-${targetIndex}`}
                path={attentionArc(LAYER_COUNT, LAST_TOKEN_INDEX, targetIndex)}
                weight={weight}
                drawn={outputProgress}
                color={OUTPUT_COLOR}
                glowColor={OUTPUT_COLOR}
                pulseOffset={frame * PULSE_SPEED + targetIndex * 0.17}
              />
            ))
          : null}
      </svg>

      {showInputRow ? (
        <TokenRow
          tokens={PROMPT_TOKENS}
          metrics={METRICS}
          left={ROW_LEFT}
          top={rowTop(0)}
          chipState={() => ({ opacity: inputRowOpacity })}
        />
      ) : null}

      {layers.map(({ layer, arrival, departure, lines }) =>
        arrival > 0 ? (
          <TokenRow
            key={layer}
            tokens={PROMPT_TOKENS}
            metrics={METRICS}
            left={ROW_LEFT}
            top={lerp(rowTop(layer - 1), rowTop(layer), arrival)}
            chipState={(index): ChipState => {
              // The chips flash while they travel up into the layer.
              const flash = Math.sin(Math.PI * arrival) * 0.35
              if (index === FOCUS_TOKEN_INDEX) {
                return { ring: lines, flash }
              }
              if (layer === LAYER_COUNT && index === LAST_TOKEN_INDEX && outputProgress > 0) {
                return { ring: outputProgress, flash }
              }
              if (layer === LAYER_COUNT && index === STRONGEST_TARGET_INDEX && emphasis > 0) {
                return { ring: emphasis, scale: 1 + 0.14 * emphasis, flash }
              }
              return { opacity: lerp(1, PASSED_ROW_OPACITY, departure), flash }
            }}
          />
        ) : null,
      )}

      {nextSlot > 0 ? (
        <div
          style={{
            position: 'absolute',
            left: chipRight(LAST_TOKEN_INDEX) + METRICS.wordGap,
            top: rowTop(LAYER_COUNT),
            width: NEXT_SLOT_WIDTH,
            height: ROW_LAYOUT.height,
            boxSizing: 'border-box',
            borderRadius: 12,
            border: `3px dashed ${OUTPUT_COLOR}`,
            background: withAlpha(OUTPUT_COLOR, 0.14),
            boxShadow: `0 0 ${18 + 10 * Math.sin(frame / 7)}px ${withAlpha(OUTPUT_COLOR, 0.55)}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: FONTS.mono,
            fontSize: METRICS.fontSize,
            fontWeight: 700,
            color: OUTPUT_COLOR,
            opacity: clamp01(nextSlot),
            transform: `scale(${nextSlot})`,
          }}
        >
          ?
        </div>
      ) : null}
    </div>
  )
}

// One attention line: a soft glow, the line itself (thicker = looking harder)
// and, once fully drawn, a pulse of light travelling along it.
const AttentionLine: React.FC<AttentionLineProps> = ({
  path,
  weight,
  drawn,
  color,
  glowColor,
  opacity = 1,
  pulseOffset,
}) => {
  const width = 2 + weight * 28
  const strength = clamp01(0.22 + weight * 1.7)
  const drawing = { pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - drawn }
  return (
    <g fill="none" strokeLinecap="round" opacity={opacity}>
      <path d={path} stroke={glowColor} strokeWidth={width + 14} opacity={strength * 0.2} {...drawing} />
      <path d={path} stroke={color} strokeWidth={width} opacity={strength} {...drawing} />
      {drawn >= 1 ? (
        <path
          d={path}
          stroke={COLORS.onColor}
          strokeWidth={width + 2}
          opacity={clamp01(0.3 + weight * 1.6)}
          pathLength={1}
          strokeDasharray={`${PULSE_LENGTH} ${1 - PULSE_LENGTH}`}
          strokeDashoffset={pulseOffset}
        />
      ) : null}
    </g>
  )
}

// Layer 1 is the lowest band, so it has the largest top offset.
function bandTop(layer: number): number {
  return (LAYER_COUNT - layer) * (BAND_HEIGHT + BAND_GAP)
}

// Top edge of the chip row in a layer; layer 0 is the input row under the bands.
function rowTop(layer: number): number {
  if (layer === 0) {
    return TOWER_BANDS_HEIGHT + INPUT_ROW_GAP
  }
  return bandTop(layer) + BAND_HEIGHT - ROW_INSET_BOTTOM - ROW_LAYOUT.height
}

// A curve from the top of the looking chip over to the top of the target chip.
function attentionArc(layer: number, fromIndex: number, targetIndex: number): string {
  const y = rowTop(layer) - 4
  const fromX = chipCenterX(fromIndex)
  const toX = chipCenterX(targetIndex)
  const peak = 22 + Math.abs(fromX - toX) * 0.066
  return `M ${fromX} ${y} Q ${(fromX + toX) / 2} ${y - peak * 2} ${toX} ${y}`
}

function chipCenterX(index: number): number {
  const { x, width } = ROW_LAYOUT.boxes[index]
  return ROW_LEFT + x + width / 2
}

function chipRight(index: number): number {
  const { x, width } = ROW_LAYOUT.boxes[index]
  return ROW_LEFT + x + width
}

function indexOfLargest(values: number[]): number {
  return values.indexOf(Math.max(...values))
}
