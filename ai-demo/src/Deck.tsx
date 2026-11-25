import { Player } from '@remotion/player'
import type React from 'react'
import { useEffect, useState } from 'react'
import { Backdrop } from './components/Backdrop'
import { SCENES } from './scenes'
import { STAGE } from './theme'

const KEY_ACTIONS: Record<string, DeckAction> = {
  ArrowRight: 'next',
  ' ': 'next',
  PageDown: 'next',
  ArrowLeft: 'previous',
  PageUp: 'previous',
  r: 'replay',
  R: 'replay',
  f: 'fullscreen',
  F: 'fullscreen',
}

type DeckAction = 'next' | 'previous' | 'replay' | 'fullscreen'

// How the current scene is shown when its player is created.
type ScenePhase = 'waiting' | 'playing' | 'finished'

interface DeckState {
  index: number
  phase: ScenePhase
  // Changes every time a scene should restart, which remounts the player.
  run: number
}

// The slide deck: one scene at a time, each played once and then held on its
// final frame until a key moves on.
export const Deck: React.FC = () => {
  const [state, setState] = useState<DeckState>(readInitialState)
  const scene = SCENES[state.index]

  // The hash is only written once the deck has started, so a refresh before
  // the first key press still opens on the waiting screen.
  const started = state.phase !== 'waiting'
  useEffect(() => {
    if (started) {
      window.history.replaceState(null, '', `#${scene.id}`)
    }
  }, [scene.id, started])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const action = KEY_ACTIONS[event.key]
      if (!action || event.ctrlKey || event.metaKey || event.altKey) {
        return
      }
      event.preventDefault()
      if (action === 'fullscreen') {
        toggleFullscreen()
      } else {
        setState((current) => applyAction(current, action))
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div className="deck">
      <LiveBackdrop />
      <Player
        key={`${scene.id}-${state.run}`}
        component={scene.component}
        durationInFrames={scene.durationInFrames}
        compositionWidth={STAGE.width}
        compositionHeight={STAGE.height}
        fps={STAGE.fps}
        autoPlay={state.phase === 'playing'}
        initialFrame={state.phase === 'finished' ? scene.durationInFrames - 1 : 0}
        loop={false}
        // Without this the player jumps back to frame 0 when a scene ends,
        // instead of holding on the final picture.
        moveToBeginningWhenEnded={false}
        controls={false}
        clickToPlay={false}
        doubleClickToFullscreen={false}
        spaceKeyToPlayOrPause={false}
        acknowledgeRemotionLicense
        style={{ width: '100%', height: '100%' }}
      />
      {state.phase === 'waiting' ? <div className="deck-hint">Press → to start</div> : null}
    </div>
  )
}

// The backdrop behind the player. It runs on the wall clock rather than on a
// scene's frames, so it fills the whole window, keeps drifting while a scene
// holds on its last frame, and does not jump when the scene changes.
const LiveBackdrop: React.FC = () => {
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    const startedAt = performance.now()
    let request = requestAnimationFrame(function tick(now) {
      setSeconds((now - startedAt) / 1000)
      request = requestAnimationFrame(tick)
    })
    return () => cancelAnimationFrame(request)
  }, [])

  return <Backdrop time={seconds} />
}

function applyAction(state: DeckState, action: Exclude<DeckAction, 'fullscreen'>): DeckState {
  const run = state.run + 1
  switch (action) {
    case 'next':
      if (state.phase === 'waiting') {
        return { index: state.index, phase: 'playing', run }
      }
      if (state.index === SCENES.length - 1) {
        return state
      }
      return { index: state.index + 1, phase: 'playing', run }
    case 'previous':
      // Going back lands on the previous scene's finished picture.
      if (state.index === 0) {
        return state
      }
      return { index: state.index - 1, phase: 'finished', run }
    case 'replay':
      return { index: state.index, phase: 'playing', run }
    default: {
      const unhandled: never = action
      throw new Error(`Unhandled deck action: ${String(unhandled)}`)
    }
  }
}

// A scene id in the URL hash (after a refresh) reopens that scene on its final
// frame. Without one, the deck waits on the first scene for a key press.
function readInitialState(): DeckState {
  const id = window.location.hash.slice(1)
  const index = SCENES.findIndex((scene) => scene.id === id)
  if (index === -1) {
    return { index: 0, phase: 'waiting', run: 0 }
  }
  return { index, phase: 'finished', run: 0 }
}

function toggleFullscreen(): void {
  if (document.fullscreenElement) {
    void document.exitFullscreen()
  } else {
    void document.documentElement.requestFullscreen()
  }
}
