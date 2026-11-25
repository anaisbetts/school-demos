import type React from 'react'
import { AbsoluteFill, getRemotionEnvironment, useCurrentFrame } from 'remotion'
import { clamp01, pop, ramp } from '../animation'
import type { KeyTerm } from '../data/sentence'
import { COLORS, FONT_SIZES, FONTS, STAGE, TEXT_GRADIENT, withAlpha } from '../theme'
import { Backdrop } from './Backdrop'

const MARGIN_X = 80
const TITLE_TOP = 52
const WORD_STAGGER_FRAMES = 4
const SHINE_FRAMES = 26

interface SceneFrameProps {
  title: string
  // GlossedTerm elements, shown in a row at the top right.
  terms?: React.ReactNode
  children: React.ReactNode
}

interface GlossedTermProps {
  term: KeyTerm
  // Frame at which the term pops in.
  at: number
}

// The shared page for every scene: backdrop, title, key terms, content.
export const SceneFrame: React.FC<SceneFrameProps> = ({ title, terms, children }) => {
  const frame = useCurrentFrame()
  // In the live deck the backdrop sits behind the player and keeps moving
  // between scenes, so scenes only paint their own when rendered to a file.
  const paintsBackdrop = !getRemotionEnvironment().isPlayer

  return (
    <AbsoluteFill style={{ color: COLORS.ink, fontFamily: FONTS.sans }}>
      {paintsBackdrop ? <Backdrop time={frame / STAGE.fps} /> : null}
      {children}
      <SceneTitle>{title}</SceneTitle>
      <div
        style={{
          position: 'absolute',
          top: TITLE_TOP - 8,
          right: MARGIN_X,
          display: 'flex',
          gap: 24,
        }}
      >
        {terms}
      </div>
    </AbsoluteFill>
  )
}

// The scene title: words spring up one after another over a glowing underline.
export const SceneTitle: React.FC<{ children: string }> = ({ children }) => {
  const frame = useCurrentFrame()
  const words = children.split(' ')
  const underline = ramp(frame, words.length * WORD_STAGGER_FRAMES, words.length * WORD_STAGGER_FRAMES + 22)

  return (
    <div style={{ position: 'absolute', left: MARGIN_X, top: TITLE_TOP }}>
      <div
        style={{
          display: 'flex',
          gap: '0.26em',
          fontSize: FONT_SIZES.title,
          fontWeight: 800,
          letterSpacing: -1.5,
          lineHeight: 1.1,
        }}
      >
        {words.map((word, index) => {
          const appear = pop(frame, index * WORD_STAGGER_FRAMES)
          return (
            <span
              key={index}
              style={{
                display: 'inline-block',
                background: TEXT_GRADIENT,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                opacity: clamp01(appear * 2),
                transform: `translateY(${(1 - appear) * 46}px)`,
              }}
            >
              {word}
            </span>
          )
        })}
      </div>
      <div
        style={{
          marginTop: 14,
          width: 150 * underline,
          height: 8,
          borderRadius: 4,
          background: `linear-gradient(90deg, ${COLORS.glow}, ${COLORS.accent})`,
          boxShadow: `0 0 22px ${withAlpha(COLORS.glow, 0.8)}`,
        }}
      />
    </div>
  )
}

// A key English term with its German translation underneath. It pops in as a
// glowing glass card with a streak of light passing over it.
export const GlossedTerm: React.FC<GlossedTermProps> = ({ term, at }) => {
  const frame = useCurrentFrame()
  const appear = pop(frame, at)
  const shine = ramp(frame, at + 6, at + 6 + SHINE_FRAMES)

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        padding: '12px 28px 14px',
        background: `linear-gradient(160deg, ${withAlpha(COLORS.accent, 0.38)}, ${withAlpha(COLORS.panel, 0.85)})`,
        border: `3px solid ${COLORS.glow}`,
        borderRadius: 22,
        boxShadow: `0 0 34px ${withAlpha(COLORS.glow, 0.45)}, 0 14px 40px rgba(0, 0, 0, 0.35)`,
        textAlign: 'center',
        opacity: clamp01(appear * 2),
        transform: `scale(${0.6 + 0.4 * appear})`,
      }}
    >
      <div style={{ fontSize: FONT_SIZES.term, fontWeight: 800, lineHeight: 1.15 }}>
        {term.term}
      </div>
      <div
        style={{
          fontSize: FONT_SIZES.gloss,
          fontWeight: 600,
          color: COLORS.muted,
          lineHeight: 1.2,
        }}
      >
        {term.gloss}
      </div>
      <div
        style={{
          position: 'absolute',
          top: -20,
          bottom: -20,
          left: `${-40 + shine * 180}%`,
          width: '34%',
          background:
            'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.55), transparent)',
          transform: 'skewX(-22deg)',
          opacity: shine > 0 && shine < 1 ? 1 : 0,
        }}
      />
    </div>
  )
}
