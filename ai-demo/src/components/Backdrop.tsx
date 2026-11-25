import type React from 'react'
import { random } from 'remotion'
import { COLORS } from '../theme'

const PARTICLE_COUNT = 46

// Large soft lights that drift slowly. Positions and sizes are percentages of
// the backdrop; drift is a percentage of the light's own size.
const LIGHTS = [
  { left: -12, top: -30, size: 72, color: 'rgba(64, 118, 240, 0.62)', driftX: 7, driftY: 9, speed: 0.021, phase: 0 },
  { left: 52, top: 42, size: 78, color: 'rgba(24, 170, 210, 0.32)', driftX: -9, driftY: -7, speed: 0.016, phase: 2 },
  { left: 34, top: -46, size: 56, color: 'rgba(140, 90, 255, 0.34)', driftX: 11, driftY: 6, speed: 0.013, phase: 4 },
  { left: -26, top: 52, size: 60, color: 'rgba(255, 90, 170, 0.15)', driftX: 8, driftY: -8, speed: 0.018, phase: 1 },
]

const PARTICLES = Array.from({ length: PARTICLE_COUNT }, (_, index) => ({
  left: random(`particle-left-${index}`) * 100,
  start: random(`particle-start-${index}`) * 110,
  // Percent of the backdrop's height per second.
  speed: 0.5 + random(`particle-speed-${index}`) * 1.8,
  size: 2 + random(`particle-size-${index}`) * 4,
  brightness: 0.18 + random(`particle-brightness-${index}`) * 0.5,
  twinkle: 0.6 + random(`particle-twinkle-${index}`) * 1.6,
  color: random(`particle-color-${index}`) > 0.6 ? COLORS.glow : COLORS.onColor,
}))

const GRAIN = `url("data:image/svg+xml,${encodeURIComponent(grainSvg())}")`
const FILL: React.CSSProperties = { position: 'absolute', inset: 0 }

interface BackdropProps {
  // Seconds of animation. The backdrop is a pure function of this value.
  time: number
}

// The living background behind every scene: a deep blue gradient with slowly
// drifting lights, rising dust, a dot grid, film grain and a vignette.
export const Backdrop: React.FC<BackdropProps> = ({ time }) => {
  return (
    <div
      style={{
        ...FILL,
        overflow: 'hidden',
        containerType: 'size',
        background: `linear-gradient(160deg, #0F2658, ${COLORS.background} 70%)`,
      }}
    >
      {LIGHTS.map((light, index) => {
        const angle = time * light.speed * 2 * Math.PI + light.phase
        return (
          <div
            key={index}
            style={{
              position: 'absolute',
              left: `${light.left}%`,
              top: `${light.top}%`,
              width: `${light.size}%`,
              aspectRatio: '1',
              borderRadius: '50%',
              background: `radial-gradient(closest-side, ${light.color}, transparent)`,
              transform: `translate(${Math.sin(angle) * light.driftX}%, ${Math.cos(angle) * light.driftY}%)`,
              willChange: 'transform',
            }}
          />
        )
      })}

      <div
        style={{
          ...FILL,
          background:
            'radial-gradient(circle, rgba(170, 200, 255, 0.13) 1.6px, transparent 2.2px) 0 0 / 48px 48px',
        }}
      />

      {PARTICLES.map((particle, index) => (
        <div
          key={index}
          style={{
            position: 'absolute',
            left: `${particle.left}%`,
            top: 0,
            width: particle.size,
            height: particle.size,
            borderRadius: '50%',
            background: particle.color,
            boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
            // Moved with a transform (in units of the backdrop's height) so
            // the browser only re-composites instead of repainting each frame.
            transform: `translateY(${105 - ((particle.start + time * particle.speed) % 110)}cqh)`,
            willChange: 'transform, opacity',
            opacity:
              particle.brightness * (0.55 + 0.45 * Math.sin(time * particle.twinkle + index)),
          }}
        />
      ))}

      <div style={{ ...FILL, background: GRAIN }} />
      <div
        style={{
          ...FILL,
          background: 'radial-gradient(ellipse at center, transparent 55%, rgba(3, 8, 24, 0.55))',
        }}
      />
    </div>
  )
}

// A small tile of white noise that repeats across the backdrop.
function grainSvg(): string {
  return [
    "<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'>",
    "<filter id='grain'>",
    "<feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/>",
    "<feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.16 0'/>",
    '</filter>',
    "<rect width='100%' height='100%' filter='url(#grain)'/>",
    '</svg>',
  ].join('')
}
