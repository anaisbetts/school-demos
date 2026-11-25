import type React from 'react'
import { Easing, random, useCurrentFrame } from 'remotion'
import { COLORS } from '../theme'

const DEFAULT_LIFE_FRAMES = 30
const GRAVITY = 90
const easeOut = Easing.out(Easing.cubic)

interface BurstProps {
  // Centre of the burst in stage coordinates.
  x: number
  y: number
  // Frame at which it goes off.
  at: number
  colors: string[]
  count?: number
  // How far the fastest particles travel, in pixels.
  distance?: number
  // Adds an expanding shockwave ring.
  ring?: boolean
  lifeFrames?: number
}

// A short spray of particles that marks a beat: a token snapping into place,
// the wheel stopping, a chip landing.
export const Burst: React.FC<BurstProps> = ({
  x,
  y,
  at,
  colors,
  count = 14,
  distance = 120,
  ring = false,
  lifeFrames = DEFAULT_LIFE_FRAMES,
}) => {
  const frame = useCurrentFrame()
  const progress = (frame - at) / lifeFrames
  if (progress < 0 || progress > 1) {
    return null
  }
  const travel = easeOut(progress)
  const fade = 1 - progress * progress
  const seed = `${x}-${y}-${at}`

  return (
    <div style={{ position: 'absolute', left: x, top: y, pointerEvents: 'none' }}>
      {ring ? (
        <div
          style={{
            position: 'absolute',
            width: distance * 2 * travel,
            height: distance * 2 * travel,
            left: -distance * travel,
            top: -distance * travel,
            boxSizing: 'border-box',
            borderRadius: '50%',
            border: `${8 * (1 - progress)}px solid ${COLORS.glow}`,
            opacity: fade * 0.8,
          }}
        />
      ) : null}
      {Array.from({ length: count }, (_, index) => {
        const angle = random(`${seed}-angle-${index}`) * 2 * Math.PI
        const reach = distance * (0.35 + 0.65 * random(`${seed}-reach-${index}`)) * travel
        const size = (6 + random(`${seed}-size-${index}`) * 10) * (1 - progress * 0.6)
        const color = colors[index % colors.length]
        const isSquare = index % 3 === 0
        return (
          <div
            key={index}
            style={{
              position: 'absolute',
              left: Math.cos(angle) * reach - size / 2,
              top: Math.sin(angle) * reach + GRAVITY * progress * progress - size / 2,
              width: size,
              height: size,
              borderRadius: isSquare ? 3 : '50%',
              background: color,
              boxShadow: `0 0 ${size}px ${color}`,
              opacity: fade,
              transform: `rotate(${progress * 360 * (index % 2 === 0 ? 1 : -1)}deg)`,
            }}
          />
        )
      })}
    </div>
  )
}
