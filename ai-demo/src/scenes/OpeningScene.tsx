import type React from 'react'
import { Easing, useCurrentFrame } from 'remotion'
import { clamp01, lerp, pop, pulse, ramp } from '../animation'
import { Arrow } from '../components/Arrow'
import { Burst } from '../components/Burst'
import { SceneFrame } from '../components/SceneFrame'
import { PROMPT_TEXT } from '../data/sentence'
import { COLORS, CONFETTI_COLORS, FONT_SIZES, withAlpha } from '../theme'

const ANSWER_TEXT = 'tired.'

const TYPE_START = 45
const TYPE_END = 205
const SEND_AT = 220
const THINKING_AT = 250
const ANSWER_AT = 310
const SPLIT_START = 400
const SPLIT_END = 470
const BOX_AT = SPLIT_START + 35

const CHAT = { left: 360, top: 190, width: 1200, height: 780 }
const INPUT_BAR = { left: 400, top: 840, width: 1120, height: 92 }
const PROMPT_BUBBLE = { width: 680, height: 170 }
const ANSWER_BUBBLE = { width: 300, height: 130 }
const MODEL_BOX = { left: 980, top: 430, size: 300 }
// Where each bubble sits inside the chat window, and where it ends up in the row.
const PROMPT_IN_CHAT = { left: 840, top: 300 }
const PROMPT_IN_ROW = { left: 130, top: 495 }
const ANSWER_IN_CHAT = { left: 400, top: 510 }
const ANSWER_IN_ROW = { left: 1450, top: 515 }
const ROW_CENTER_Y = 580
const MODEL_BOX_CENTER = {
  x: MODEL_BOX.left + MODEL_BOX.size / 2,
  y: MODEL_BOX.top + MODEL_BOX.size / 2,
}
const GLASS = `linear-gradient(165deg, ${withAlpha(COLORS.accent, 0.3)}, ${withAlpha(COLORS.panel, 0.92)} 45%)`

interface BubbleProps {
  left: number
  top: number
  width: number
  height: number
  scale: number
  // 0..1 white flash, used when the bubble first appears.
  flash: number
  caption: string
  captionOpacity: number
  variant: 'prompt' | 'answer'
  children: React.ReactNode
}

// A chat window where the sentence is typed and answered. The window then
// falls away, leaving prompt -> closed box -> answer: the question of the talk.
export const OpeningScene: React.FC = () => {
  const frame = useCurrentFrame()

  const typedLength = Math.round(ramp(frame, TYPE_START, TYPE_END, Easing.linear) * PROMPT_TEXT.length)
  const sent = frame >= SEND_AT
  const cursorVisible = !sent && Math.floor(frame / 15) % 2 === 0
  const split = ramp(frame, SPLIT_START, SPLIT_END)
  const chatAppear = pop(frame, 10)
  const chatOpacity = clamp01(chatAppear * 2) * (1 - ramp(frame, SPLIT_START, SPLIT_START + 30))
  const chatScale = 0.9 + 0.1 * chatAppear + 0.06 * ramp(frame, SPLIT_START, SPLIT_START + 30)
  const thinking = frame >= THINKING_AT && frame < ANSWER_AT
  const boxAppear = pop(frame, BOX_AT)
  const captionOpacity = ramp(frame, SPLIT_END, SPLIT_END + 20)
  // The closed box breathes: its glow and its question mark slowly pulse.
  const breath = Math.sin(frame / 14)

  return (
    <SceneFrame title="What happens inside?">
      <div
        style={{
          position: 'absolute',
          ...CHAT,
          opacity: chatOpacity,
          transform: `scale(${chatScale})`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: GLASS,
            border: `3px solid ${withAlpha(COLORS.glow, 0.45)}`,
            borderRadius: 36,
            boxShadow: `0 50px 120px rgba(0, 0, 0, 0.5), 0 0 60px ${withAlpha(COLORS.accent, 0.35)}`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: INPUT_BAR.left - CHAT.left,
            top: INPUT_BAR.top - CHAT.top,
            width: INPUT_BAR.width,
            height: INPUT_BAR.height,
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'center',
            padding: '0 36px',
            background: withAlpha(COLORS.background, 0.75),
            border: `3px solid ${sent ? COLORS.border : COLORS.glow}`,
            borderRadius: 46,
            boxShadow: sent ? undefined : `0 0 26px ${withAlpha(COLORS.glow, 0.4)}`,
            fontSize: FONT_SIZES.body,
            fontWeight: 600,
            whiteSpace: 'pre',
          }}
        >
          {sent ? '' : PROMPT_TEXT.slice(0, typedLength)}
          <span style={{ opacity: cursorVisible ? 1 : 0, color: COLORS.glow }}>|</span>
        </div>
      </div>

      {thinking ? (
        <div
          style={{
            position: 'absolute',
            ...ANSWER_IN_CHAT,
            display: 'flex',
            gap: 14,
            padding: '34px 36px',
            background: withAlpha(COLORS.background, 0.75),
            border: `3px solid ${COLORS.border}`,
            borderRadius: 32,
          }}
        >
          {[0, 1, 2].map((dot) => {
            const bounce = Math.sin((frame - dot * 5) / 4)
            return (
              <div
                key={dot}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  background: COLORS.glow,
                  boxShadow: `0 0 16px ${COLORS.glow}`,
                  opacity: 0.55 + 0.45 * bounce,
                  transform: `translateY(${bounce * 9}px)`,
                }}
              />
            )
          })}
        </div>
      ) : null}

      <Bubble
        left={lerp(PROMPT_IN_CHAT.left, PROMPT_IN_ROW.left, split)}
        top={lerp(PROMPT_IN_CHAT.top, PROMPT_IN_ROW.top, split)}
        {...PROMPT_BUBBLE}
        scale={pop(frame, SEND_AT)}
        flash={pulse(frame, SEND_AT, 14)}
        caption="prompt"
        captionOpacity={captionOpacity}
        variant="prompt"
      >
        {PROMPT_TEXT}
      </Bubble>
      <Bubble
        left={lerp(ANSWER_IN_CHAT.left, ANSWER_IN_ROW.left, split)}
        top={lerp(ANSWER_IN_CHAT.top, ANSWER_IN_ROW.top, split)}
        {...ANSWER_BUBBLE}
        scale={pop(frame, ANSWER_AT)}
        flash={pulse(frame, ANSWER_AT, 14)}
        caption="answer"
        captionOpacity={captionOpacity}
        variant="answer"
      >
        {ANSWER_TEXT}
      </Bubble>
      <Burst
        x={ANSWER_IN_CHAT.left + ANSWER_BUBBLE.width / 2}
        y={ANSWER_IN_CHAT.top + ANSWER_BUBBLE.height / 2}
        at={ANSWER_AT}
        colors={CONFETTI_COLORS}
        count={18}
        distance={210}
      />

      {/* The closed box: a dark cube inside a slowly turning ring of light. */}
      <div
        style={{
          position: 'absolute',
          left: MODEL_BOX.left,
          top: MODEL_BOX.top,
          width: MODEL_BOX.size,
          height: MODEL_BOX.size,
          boxSizing: 'border-box',
          padding: 8,
          borderRadius: 50,
          background: `conic-gradient(from ${frame * 3}deg, ${COLORS.glow}, ${COLORS.accent}, ${COLORS.violet}, #FF6CB8, ${COLORS.glow})`,
          boxShadow: `0 0 ${70 + 25 * breath}px ${withAlpha(COLORS.glow, 0.6)}, 0 40px 90px rgba(0, 0, 0, 0.5)`,
          opacity: clamp01(boxAppear * 2),
          transform: `scale(${0.4 + 0.6 * boxAppear})`,
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 42,
            background: `radial-gradient(circle at 30% 22%, #244A9A, ${COLORS.background} 72%)`,
            color: COLORS.onColor,
            fontSize: 210,
            fontWeight: 800,
            textShadow: `0 0 ${46 + 18 * breath}px ${COLORS.glow}`,
          }}
        >
          <span style={{ transform: `translateY(${breath * 7}px) scale(${1 + 0.03 * breath})` }}>
            ?
          </span>
        </div>
      </div>
      <Burst
        x={MODEL_BOX_CENTER.x}
        y={MODEL_BOX_CENTER.y}
        at={BOX_AT}
        colors={CONFETTI_COLORS}
        count={26}
        distance={330}
        ring
      />

      <Arrow
        from={{ x: PROMPT_IN_ROW.left + PROMPT_BUBBLE.width + 24, y: ROW_CENTER_Y }}
        to={{ x: MODEL_BOX.left - 24, y: ROW_CENTER_Y }}
        progress={ramp(frame, SPLIT_END - 10, SPLIT_END + 15)}
      />
      <Arrow
        from={{ x: MODEL_BOX.left + MODEL_BOX.size + 28, y: ROW_CENTER_Y }}
        to={{ x: ANSWER_IN_ROW.left - 20, y: ROW_CENTER_Y }}
        progress={ramp(frame, SPLIT_END + 10, SPLIT_END + 35)}
      />
    </SceneFrame>
  )
}

const Bubble: React.FC<BubbleProps> = ({
  left,
  top,
  width,
  height,
  scale,
  flash,
  caption,
  captionOpacity,
  variant,
  children,
}) => {
  if (scale <= 0) {
    return null
  }
  const isPrompt = variant === 'prompt'

  return (
    <div style={{ position: 'absolute', left, top, width, height }}>
      <div
        style={{
          position: 'absolute',
          left: 8,
          top: -52,
          fontSize: FONT_SIZES.caption,
          fontWeight: 700,
          color: COLORS.muted,
          opacity: captionOpacity,
        }}
      >
        {caption}
      </div>
      <div
        style={{
          boxSizing: 'border-box',
          width,
          height,
          display: 'flex',
          alignItems: 'center',
          padding: '0 36px',
          background: isPrompt
            ? `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.violet})`
            : GLASS,
          border: isPrompt ? 'none' : `4px solid ${COLORS.glow}`,
          borderRadius: 32,
          boxShadow: `0 0 ${46 + 60 * flash}px ${withAlpha(isPrompt ? COLORS.accent : COLORS.glow, 0.55 + 0.45 * flash)}, 0 24px 60px rgba(0, 0, 0, 0.4)`,
          color: COLORS.onColor,
          fontSize: isPrompt ? FONT_SIZES.body : 56,
          fontWeight: isPrompt ? 600 : 800,
          lineHeight: 1.35,
          justifyContent: isPrompt ? 'flex-start' : 'center',
          opacity: clamp01(scale * 2),
          transform: `scale(${0.7 + 0.3 * scale})`,
        }}
      >
        {children}
      </div>
    </div>
  )
}
