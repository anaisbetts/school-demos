// Renders frames of the deck's scenes to PNG files in out/, for checking the
// layout without opening a browser.
//
//   bun run stills                 final frame of every scene
//   bun run stills tower           final frame of one scene
//   bun run stills tower 150 400   chosen frames of one scene

import { $ } from 'bun'
import { SCENES } from '../src/scenes'

const ENTRY_POINT = 'src/remotion/index.ts'
const OUTPUT_DIR = 'out'

const [sceneId, ...frameArgs] = process.argv.slice(2)
const scenes = sceneId ? SCENES.filter((scene) => scene.id === sceneId) : SCENES

if (scenes.length === 0) {
  console.error(`Unknown scene "${sceneId}". Scenes: ${SCENES.map((scene) => scene.id).join(', ')}`)
  process.exit(1)
}

for (const scene of scenes) {
  const frames = frameArgs.length > 0 ? frameArgs.map(Number) : [scene.durationInFrames - 1]
  for (const frame of frames) {
    const output = `${OUTPUT_DIR}/${scene.id}-${String(frame).padStart(4, '0')}.png`
    await $`bunx remotion still ${ENTRY_POINT} ${scene.id} ${output} --frame=${frame}`
  }
}
