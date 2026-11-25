export const STAGE = { width: 1920, height: 1080, fps: 30 }

export const COLORS = {
  // Base colour of the backdrop, also used for dark text on light surfaces.
  background: '#0A1836',
  // Main text, lines and outlines.
  ink: '#F3F6FF',
  muted: '#9FB2D8',
  // Raised surfaces such as cards and the chat window.
  panel: '#172C57',
  // Translucent, so the layer bands stay visible across the backdrop's glow.
  band: 'rgba(185, 208, 255, 0.12)',
  border: '#3A5290',
  accent: '#4A78FF',
  // The light that things give off: glows, pulses, highlights.
  glow: '#6FE3FF',
  violet: '#9B6CFF',
  other: '#7F8DAD',
  onColor: '#FFFFFF',
}

export const FONTS = {
  sans: "'Inter', system-ui, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",
}

export const FONT_SIZES = { title: 72, term: 44, gloss: 26, body: 38, caption: 30 }

// Fill for large headline text (used with background-clip: text).
export const TEXT_GRADIENT = 'linear-gradient(180deg, #FFFFFF 25%, #A9C8FF 100%)'

// Strong colours that all carry white text and stand out from the blue stage.
export const TOKEN_PALETTE = [
  '#EC5B33',
  '#2F93F0',
  '#16A974',
  '#A557DB',
  '#D98A0C',
  '#E0408F',
  '#0FA3B1',
  '#7A6BF2',
]

// Colours for celebration particles.
export const CONFETTI_COLORS = [COLORS.glow, COLORS.onColor, '#FFD166', '#FF6CB8', COLORS.violet]

export function tokenColor(index: number): string {
  return TOKEN_PALETTE[index % TOKEN_PALETTE.length]
}

// A CSS colour with the given opacity (0..1).
export function withAlpha(color: string, alpha: number): string {
  return `color-mix(in srgb, ${color} ${Math.round(alpha * 100)}%, transparent)`
}
