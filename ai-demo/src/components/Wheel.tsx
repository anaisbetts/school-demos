import type React from 'react'
import { Easing, useCurrentFrame } from 'remotion'
import { clamp01, lerp } from '../animation'
import type { Candidate } from '../data/sentence'
import { COLORS, FONTS } from '../theme'

export const WHEEL_WIDTH = 760
export const WHEEL_HEIGHT = 560
// Where the pointer touches the wheel, relative to the wheel's top-left corner.
export const WHEEL_POINTER_TIP = { x: 400, y: 42 }

// Centre line and lowest point of the finished wheel, in the same coordinates.
export const WHEEL_RIM = { centerX: 400, bottom: 566 }

const CENTER = { x: 400, y: 280 }
const RADIUS = 185
const RING_THICKNESS = 150
const OUTER_RADIUS = RADIUS + RING_THICKNESS / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const SLICE_GAP = 5
const BAR_LEFT = 170
const BAR_TOP = 70
const BAR_STEP = 84
const BAR_THICKNESS = 46
const PATH_SEGMENTS = 48
const LABEL_FONT_SIZE = 34
const PUNCTUATION_FONT_SIZE = 150
// The dark rim around the wheel and the row of light bulbs on it.
const RIM_RADIUS = OUTER_RADIUS + 14
const RIM_WIDTH = 24
const BULB_COUNT = 28
const BULB_COLOR = '#FFE9A3'
// The pointer is knocked back by a peg every this many degrees of rotation.
const PEG_SPACING_DEGREES = 14
const POINTER_KICK_DEGREES = 24
const POINTER_HEIGHT = 62
const ease = Easing.inOut(Easing.cubic)

interface WheelProps {
  slices: Candidate[]
  // 0 = straight percentage bars, 1 = bent into a wheel.
  bend: number
  // How many bars have grown in, counted from the top (fractions animate).
  barsReveal?: number
  // Clockwise rotation of the finished wheel in degrees.
  rotation?: number
  // 0..1 progress of the current spin; drives the pointer ticks and the lights.
  spin?: number
  pointerOpacity?: number
  // Fades every slice except this one, and flashes it while `amount` rises.
  highlight?: { index: number; amount: number }
  opacity?: number
}

// The sampler's choices. Each choice is one strip whose length is its
// percentage, so the same strips can be a bar chart or bend into a wheel of
// fortune, complete with rim lights and a ticking pointer.
export const Wheel: React.FC<WheelProps> = ({
  slices,
  bend,
  barsReveal = slices.length,
  rotation = 0,
  spin = 0,
  pointerOpacity = 0,
  highlight,
  opacity = 1,
}) => {
  const frame = useCurrentFrame()

  let angle = 0
  const strips = slices.map((slice, index) => {
    const startAngle = angle
    const span = (slice.percent / 100) * 2 * Math.PI
    angle += span
    const grow = ease(clamp01(barsReveal - index))
    // Later strips start bending a little later, so the bars peel into place.
    const bendAmount = ease(clamp01(bend * 1.5 - index * 0.1))
    const length = Math.max(0, (slice.percent / 100) * CIRCUMFERENCE * grow - SLICE_GAP * bendAmount)
    const path = stripPath(startAngle, length, bendAmount, BAR_TOP + index * BAR_STEP)
    return { slice, index, startAngle, span, grow, bendAmount, length, path, rowY: BAR_TOP + index * BAR_STEP }
  })

  const wheelFinish = clamp01(bend * 5 - 4)
  const spinning = spin > 0 && spin < 1
  const winning = highlight !== undefined && highlight.amount > 0 && highlight.amount < 1
  const winFlash = highlight ? Math.sin(Math.PI * highlight.amount) : 0
  // Between pegs the pointer swings back; the swing dies down as the spin ends.
  const sincePeg = (((rotation % PEG_SPACING_DEGREES) + PEG_SPACING_DEGREES) % PEG_SPACING_DEGREES) / PEG_SPACING_DEGREES
  const pointerKick = spinning
    ? -POINTER_KICK_DEGREES * (1 - sincePeg) ** 2 * Math.min(1, Math.sin(Math.PI * spin) * 3)
    : 0

  return (
    <svg
      width={WHEEL_WIDTH}
      height={WHEEL_HEIGHT}
      style={{ overflow: 'visible', opacity, fontFamily: FONTS.sans, fontWeight: 800 }}
    >
      <defs>
        <radialGradient id="wheel-halo">
          <stop offset="62%" stopColor={COLORS.glow} stopOpacity={0.42} />
          <stop offset="100%" stopColor={COLORS.glow} stopOpacity={0} />
        </radialGradient>
        <linearGradient id="wheel-sheen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.34} />
          <stop offset="50%" stopColor="#FFFFFF" stopOpacity={0} />
          <stop offset="100%" stopColor="#000000" stopOpacity={0.26} />
        </linearGradient>
        <radialGradient id="wheel-hub" cx="38%" cy="32%">
          <stop offset="0%" stopColor="#3C63B8" />
          <stop offset="100%" stopColor={COLORS.background} />
        </radialGradient>
      </defs>

      <g opacity={wheelFinish}>
        <circle cx={CENTER.x} cy={CENTER.y} r={OUTER_RADIUS + 130} fill="url(#wheel-halo)" />
        <circle
          cx={CENTER.x}
          cy={CENTER.y}
          r={RIM_RADIUS}
          fill="none"
          stroke="#0B1A40"
          strokeWidth={RIM_WIDTH}
        />
        <circle
          cx={CENTER.x}
          cy={CENTER.y}
          r={RIM_RADIUS + RIM_WIDTH / 2}
          fill="none"
          stroke={COLORS.glow}
          strokeWidth={3}
          opacity={0.7}
        />
      </g>

      <g transform={`rotate(${rotation} ${CENTER.x} ${CENTER.y})`}>
        {strips.map(({ slice, index, startAngle, span, bendAmount, path }) => {
          const isWinner = highlight?.index === index
          const dim = highlight && !isWinner ? 1 - 0.5 * highlight.amount : 1
          const strokeWidth = lerp(BAR_THICKNESS, RING_THICKNESS, bendAmount)
          return (
            <g key={slice.label} opacity={dim} fill="none">
              <path d={path} stroke={slice.color} strokeWidth={strokeWidth} />
              {isWinner && winFlash > 0 ? (
                <path
                  d={path}
                  stroke={COLORS.onColor}
                  strokeWidth={strokeWidth}
                  opacity={winFlash * 0.6}
                />
              ) : null}
              <text
                {...wheelLabelPlacement(slice.label, startAngle, span)}
                textAnchor="middle"
                dominantBaseline="central"
                fill={COLORS.onColor}
                stroke="rgba(0, 0, 0, 0.28)"
                strokeWidth={4}
                paintOrder="stroke"
                opacity={clamp01(bendAmount * 4 - 3)}
              >
                {slice.label}
              </text>
            </g>
          )
        })}
      </g>

      {strips.map(({ slice, grow, bendAmount, length, rowY }) => {
        const barTextOpacity = clamp01(grow * 3) * clamp01(1 - bendAmount * 4)
        return (
          <g key={slice.label} opacity={barTextOpacity} fontSize={LABEL_FONT_SIZE}>
            <text
              x={BAR_LEFT - 20}
              y={rowY}
              textAnchor="end"
              dominantBaseline="central"
              fill={COLORS.ink}
            >
              {slice.label}
            </text>
            <text x={BAR_LEFT + length + 18} y={rowY} dominantBaseline="central" fill={COLORS.muted}>
              {Math.round(slice.percent * grow)}%
            </text>
          </g>
        )
      })}

      <g opacity={wheelFinish}>
        {/* Fixed lighting over the spinning slices, so the wheel looks solid. */}
        <circle
          cx={CENTER.x}
          cy={CENTER.y}
          r={RADIUS}
          fill="none"
          stroke="url(#wheel-sheen)"
          strokeWidth={RING_THICKNESS}
        />
        {Array.from({ length: BULB_COUNT }, (_, index) => {
          const bulbAngle = (index / BULB_COUNT) * 2 * Math.PI
          const lit = bulbIsLit(index, frame, spinning, winning)
          return (
            <g
              key={index}
              transform={`translate(${CENTER.x + RIM_RADIUS * Math.sin(bulbAngle)} ${CENTER.y - RIM_RADIUS * Math.cos(bulbAngle)})`}
            >
              {lit ? <circle r={15} fill={BULB_COLOR} opacity={0.3} /> : null}
              <circle r={6.5} fill={lit ? BULB_COLOR : 'rgba(255, 255, 255, 0.22)'} />
            </g>
          )
        })}
        <circle
          cx={CENTER.x}
          cy={CENTER.y}
          r={RADIUS - RING_THICKNESS / 2 - 8}
          fill="url(#wheel-hub)"
          stroke={COLORS.ink}
          strokeWidth={6}
        />
        <circle cx={CENTER.x} cy={CENTER.y} r={22} fill={COLORS.ink} />
      </g>

      <g
        opacity={pointerOpacity}
        transform={`rotate(${pointerKick} ${WHEEL_POINTER_TIP.x} ${WHEEL_POINTER_TIP.y - POINTER_HEIGHT})`}
      >
        <polygon
          points={`${WHEEL_POINTER_TIP.x},${WHEEL_POINTER_TIP.y} ${WHEEL_POINTER_TIP.x - 30},${WHEEL_POINTER_TIP.y - POINTER_HEIGHT} ${WHEEL_POINTER_TIP.x + 30},${WHEEL_POINTER_TIP.y - POINTER_HEIGHT}`}
          fill={COLORS.ink}
          stroke={COLORS.background}
          strokeWidth={5}
          strokeLinejoin="round"
        />
        <circle
          cx={WHEEL_POINTER_TIP.x}
          cy={WHEEL_POINTER_TIP.y - POINTER_HEIGHT + 14}
          r={7}
          fill={COLORS.accent}
        />
      </g>
    </svg>
  )
}

// The rotation (in degrees) that stops the wheel with the pointer inside the
// given slice. `position` is how far through the slice the pointer lands (0..1).
export function rotationToLandOn(
  slices: Candidate[],
  index: number,
  position: number,
  fullTurns: number,
): number {
  const before = slices.slice(0, index).reduce((sum, slice) => sum + slice.percent, 0)
  const landingAngle = ((before + slices[index].percent * position) / 100) * 360
  return fullTurns * 360 - landingAngle
}

// A strip of fixed length that starts as a straight bar (bend 0) and curls
// around the wheel's centre (bend 1). Angles run clockwise from the top.
function stripPath(startAngle: number, length: number, bendAmount: number, rowY: number): string {
  let x = lerp(BAR_LEFT, CENTER.x + RADIUS * Math.sin(startAngle), bendAmount)
  let y = lerp(rowY, CENTER.y - RADIUS * Math.cos(startAngle), bendAmount)
  const startHeading = startAngle * bendAmount
  const curvature = bendAmount / RADIUS
  const step = length / PATH_SEGMENTS

  const points = [`M ${x} ${y}`]
  for (let segment = 0; segment < PATH_SEGMENTS; segment++) {
    const heading = startHeading + curvature * step * (segment + 0.5)
    x += Math.cos(heading) * step
    y += Math.sin(heading) * step
    points.push(`L ${x} ${y}`)
  }
  return points.join(' ')
}

// Labels follow the rim where the slice is wide enough, and point outwards
// like spokes where it is not.
function wheelLabelPlacement(label: string, startAngle: number, span: number) {
  const isPunctuation = label.length === 1
  const fontSize = isPunctuation ? PUNCTUATION_FONT_SIZE : LABEL_FONT_SIZE
  const middle = startAngle + span / 2
  const degrees = (middle * 180) / Math.PI
  const fitsAlongRim = isPunctuation || span * RADIUS > label.length * fontSize * 0.62 + 24
  const x = CENTER.x + RADIUS * Math.sin(middle)
  const y = CENTER.y - RADIUS * Math.cos(middle)
  // Full stops and commas sit low in their line box; lift them to the middle.
  const lift = isPunctuation ? -fontSize * 0.3 : 0
  return {
    fontSize,
    transform: `translate(${x} ${y}) rotate(${fitsAlongRim ? degrees : degrees - 90}) translate(0 ${lift})`,
  }
}

// The rim lights chase each other during a spin, all blink together when the
// wheel has just stopped on a winner, and otherwise alternate slowly.
function bulbIsLit(index: number, frame: number, spinning: boolean, winning: boolean): boolean {
  if (winning) {
    return Math.floor(frame / 3) % 2 === 0
  }
  if (spinning) {
    return (index + Math.floor(frame / 2)) % 4 === 0
  }
  return (index + Math.floor(frame / 18)) % 2 === 0
}
