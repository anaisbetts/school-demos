import { Easing, interpolate, spring } from 'remotion'
import { STAGE } from './theme'

// 0 before `start`, 1 after `end`, eased in between.
export function ramp(
  frame: number,
  start: number,
  end: number,
  easing: (t: number) => number = Easing.inOut(Easing.cubic),
): number {
  return interpolate(frame, [start, end], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing,
  })
}

// A springy 0 -> 1 that starts at frame `at` and overshoots slightly.
export function pop(frame: number, at: number): number {
  if (frame <= at) {
    return 0
  }
  return spring({ frame: frame - at, fps: STAGE.fps, config: { damping: 13, stiffness: 170 } })
}

// A flash that is 1 at frame `at` and fades to 0 over `duration` frames.
export function pulse(frame: number, at: number, duration: number): number {
  if (frame < at) {
    return 0
  }
  const remaining = Math.max(0, 1 - (frame - at) / duration)
  return remaining * remaining
}

export function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t
}

export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}
