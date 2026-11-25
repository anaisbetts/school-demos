import type React from 'react'
import { STAGE } from '../theme'
import { ClosingScene } from './ClosingScene'
import { GermanWordScene } from './GermanWordScene'
import { OpeningScene } from './OpeningScene'
import { SamplerScene } from './SamplerScene'
import { TokensScene } from './TokensScene'
import { TowerScene } from './TowerScene'

// The deck, in presentation order. Both the live deck and the Remotion root
// (used for rendering stills) read this list.
export const SCENES: SceneDefinition[] = [
  { id: 'opening', component: OpeningScene, durationInFrames: seconds(20) },
  { id: 'tokens', component: TokensScene, durationInFrames: seconds(25) },
  { id: 'german-word', component: GermanWordScene, durationInFrames: seconds(10) },
  { id: 'tower', component: TowerScene, durationInFrames: seconds(30) },
  { id: 'sampler', component: SamplerScene, durationInFrames: seconds(30) },
  { id: 'closing', component: ClosingScene, durationInFrames: seconds(20) },
]

export interface SceneDefinition {
  // Used in the URL hash and as the Remotion composition id.
  id: string
  component: React.FC
  durationInFrames: number
}

function seconds(count: number): number {
  return count * STAGE.fps
}
