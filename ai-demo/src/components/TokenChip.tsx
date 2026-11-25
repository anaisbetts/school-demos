import type React from 'react'
import { interpolateColors } from 'remotion'
import { clamp01 } from '../animation'
import type { Token } from '../data/sentence'
import { COLORS, FONTS, tokenColor, withAlpha } from '../theme'
import type { ChipMetrics } from './tokenLayout'
import { chipHeight, layoutTokens, visibleText } from './tokenLayout'

const RING_WIDTH = 5

export interface ChipState {
  // 0 = bare text, 1 = text inside its coloured box.
  box?: number
  // 0 = ID hidden, 1 = ID flap fully open below the chip.
  idReveal?: number
  // 0..1 glowing outline used to point at a chip.
  ring?: number
  // 0..1 white flash over the chip.
  flash?: number
  opacity?: number
  dx?: number
  dy?: number
  rotate?: number
  scale?: number
  color?: string
}

interface TokenChipProps {
  text: string
  color: string
  width: number
  fontSize: number
  box?: number
  idNumber?: number
  idReveal?: number
  ring?: number
  flash?: number
}

interface TokenRowProps {
  tokens: Token[]
  metrics: ChipMetrics
  left: number
  top: number
  spread?: number
  chipState?: (index: number) => ChipState
}

export const TokenChip: React.FC<TokenChipProps> = ({
  text,
  color,
  width,
  fontSize,
  box = 1,
  idNumber,
  idReveal = 0,
  ring = 0,
  flash = 0,
}) => {
  const height = chipHeight(fontSize)
  const radius = Math.round(fontSize * 0.28)
  const bottomRadius = radius * (1 - clamp01(idReveal))
  const corners = `${radius}px ${radius}px ${bottomRadius}px ${bottomRadius}px`
  const idHeight = Math.round(fontSize * 0.95)
  // Every chip glows softly in its own colour; a ring adds a bright outline.
  const shadows = [
    `inset 0 ${fontSize * 0.05}px 0 rgba(255, 255, 255, 0.38)`,
    `0 ${fontSize * 0.14}px ${fontSize * 0.55}px ${withAlpha(color, 0.6)}`,
  ]
  if (ring > 0) {
    shadows.push(
      `0 0 0 ${RING_WIDTH * ring}px ${COLORS.ink}`,
      `0 0 ${fontSize * ring}px ${RING_WIDTH * ring}px ${withAlpha(COLORS.glow, 0.75)}`,
    )
  }

  return (
    <div style={{ position: 'relative', width, height }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(180deg, color-mix(in srgb, ${color} 78%, white), ${color} 62%)`,
          opacity: clamp01(box),
          borderRadius: corners,
          transform: `scale(${0.8 + 0.2 * box})`,
          boxShadow: shadows.join(', '),
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: FONTS.mono,
          fontWeight: 700,
          fontSize,
          whiteSpace: 'pre',
          color: interpolateColors(clamp01(box), [0, 1], [COLORS.ink, COLORS.onColor]),
          textShadow: `0 ${fontSize * 0.04}px ${fontSize * 0.1}px rgba(0, 0, 0, 0.3)`,
        }}
      >
        {text}
      </div>
      {flash > 0 ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: corners,
            background: COLORS.onColor,
            opacity: clamp01(flash),
            boxShadow: `0 0 ${fontSize}px ${withAlpha(COLORS.onColor, flash)}`,
          }}
        />
      ) : null}
      {idNumber !== undefined && idReveal > 0 ? (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: height,
            width,
            height: idHeight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `color-mix(in srgb, ${color} 38%, ${COLORS.background})`,
            borderRadius: `0 0 ${radius}px ${radius}px`,
            boxShadow: `0 ${fontSize * 0.14}px ${fontSize * 0.5}px ${withAlpha(color, 0.35)}`,
            fontFamily: FONTS.mono,
            fontWeight: 700,
            fontSize: Math.round(fontSize * 0.5),
            color: COLORS.ink,
            opacity: clamp01(idReveal * 3),
            transformOrigin: 'top',
            transform: `perspective(600px) rotateX(${(1 - clamp01(idReveal)) * -90}deg)`,
          }}
        >
          {idNumber}
        </div>
      ) : null}
    </div>
  )
}

// A sentence as a row of chips. Each chip can be animated on its own through
// `chipState`; IDs show for chips whose state has `idReveal` above 0.
export const TokenRow: React.FC<TokenRowProps> = ({
  tokens,
  metrics,
  left,
  top,
  spread = 1,
  chipState,
}) => {
  const layout = layoutTokens(tokens, metrics, spread)

  return (
    <div style={{ position: 'absolute', left, top, width: layout.width, height: layout.height }}>
      {tokens.map((token, index) => {
        const state = chipState?.(index) ?? {}
        const { x, width } = layout.boxes[index]
        return (
          <div
            key={index}
            style={{
              position: 'absolute',
              left: x,
              top: 0,
              opacity: state.opacity ?? 1,
              transform: `translate(${state.dx ?? 0}px, ${state.dy ?? 0}px) rotate(${state.rotate ?? 0}deg) scale(${state.scale ?? 1})`,
            }}
          >
            <TokenChip
              text={visibleText(token)}
              color={state.color ?? tokenColor(index)}
              width={width}
              fontSize={metrics.fontSize}
              box={state.box ?? 1}
              idNumber={token.id}
              idReveal={state.idReveal ?? 0}
              ring={state.ring ?? 0}
              flash={state.flash ?? 0}
            />
          </div>
        )
      })}
    </div>
  )
}
