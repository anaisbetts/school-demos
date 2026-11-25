import type React from 'react'
import { useCurrentFrame } from 'remotion'
import { clamp01 } from '../animation'
import { COLORS, STAGE } from '../theme'

const STROKE_WIDTH = 8
const GLOW_WIDTH = 22
const HEAD_LENGTH = 30
const HEAD_HALF_WIDTH = 17
// The spark that keeps travelling along a finished arrow.
const SPARK_LENGTH = 0.16
const SPARK_FRAMES_PER_TRIP = 34

interface Point {
  x: number
  y: number
}

interface ArrowProps {
  from: Point
  to: Point
  // 0 = not drawn, 1 = fully drawn with its head.
  progress: number
  // Sideways bulge of the line in pixels; 0 is a straight arrow.
  bulge?: number
  color?: string
}

// A glowing arrow in stage coordinates. It draws itself from tail to head,
// and once drawn a spark keeps running along it in the arrow's direction.
export const Arrow: React.FC<ArrowProps> = ({
  from,
  to,
  progress,
  bulge = 0,
  color = COLORS.ink,
}) => {
  const frame = useCurrentFrame()
  if (progress <= 0) {
    return null
  }

  const dx = to.x - from.x
  const dy = to.y - from.y
  const length = Math.hypot(dx, dy)
  const control = {
    x: (from.x + to.x) / 2 + (-dy / length) * bulge * 2,
    y: (from.y + to.y) / 2 + (dx / length) * bulge * 2,
  }
  // The line stops at the base of the head, which sits along the end tangent.
  const tangent = Math.atan2(to.y - control.y, to.x - control.x)
  const lineEnd = {
    x: to.x - Math.cos(tangent) * HEAD_LENGTH * 0.8,
    y: to.y - Math.sin(tangent) * HEAD_LENGTH * 0.8,
  }
  const path = `M ${from.x} ${from.y} Q ${control.x} ${control.y} ${lineEnd.x} ${lineEnd.y}`
  const drawn = clamp01(progress)
  const headOpacity = clamp01((progress - 0.8) * 5)
  const sparkPosition = (frame % SPARK_FRAMES_PER_TRIP) / SPARK_FRAMES_PER_TRIP

  return (
    <svg
      width={STAGE.width}
      height={STAGE.height}
      style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }}
    >
      <path
        d={path}
        fill="none"
        stroke={COLORS.glow}
        strokeWidth={GLOW_WIDTH}
        strokeLinecap="round"
        opacity={0.22}
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - drawn}
      />
      {drawn >= 1 ? (
        <path
          d={path}
          fill="none"
          stroke={COLORS.glow}
          strokeWidth={GLOW_WIDTH}
          strokeLinecap="round"
          opacity={0.85}
          pathLength={1}
          strokeDasharray={`${SPARK_LENGTH} ${1 + SPARK_LENGTH}`}
          strokeDashoffset={SPARK_LENGTH - sparkPosition * (1 + SPARK_LENGTH)}
        />
      ) : null}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - drawn}
      />
      <polygon
        points={`0,0 ${-HEAD_LENGTH},${-HEAD_HALF_WIDTH} ${-HEAD_LENGTH},${HEAD_HALF_WIDTH}`}
        fill={color}
        opacity={headOpacity}
        transform={`translate(${to.x} ${to.y}) rotate(${(tangent * 180) / Math.PI})`}
      />
    </svg>
  )
}
