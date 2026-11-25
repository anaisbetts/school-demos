import type React from 'react'
import { useEffect, useState } from 'react'
import { Composition, continueRender, delayRender } from 'remotion'
import { loadFonts } from '../fonts'
import { SCENES } from '../scenes'
import { STAGE } from '../theme'

// Registers every deck scene as a Remotion composition, so that single frames
// can be rendered to images with `bun run stills`.
export const RemotionRoot: React.FC = () => {
  const [fontsHandle] = useState(() => delayRender('Loading fonts'))

  useEffect(() => {
    void loadFonts().then(() => continueRender(fontsHandle))
  }, [fontsHandle])

  return (
    <>
      {SCENES.map((scene) => (
        <Composition
          key={scene.id}
          id={scene.id}
          component={scene.component}
          durationInFrames={scene.durationInFrames}
          width={STAGE.width}
          height={STAGE.height}
          fps={STAGE.fps}
        />
      ))}
    </>
  )
}
