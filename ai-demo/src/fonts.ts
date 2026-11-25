import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-600.css'
import '@fontsource/inter/latin-700.css'
import '@fontsource/inter/latin-800.css'
import '@fontsource/jetbrains-mono/latin-500.css'
import '@fontsource/jetbrains-mono/latin-700.css'

const FONT_FACES = [
  "400 40px 'Inter'",
  "600 40px 'Inter'",
  "700 40px 'Inter'",
  "800 40px 'Inter'",
  "500 40px 'JetBrains Mono'",
  "700 40px 'JetBrains Mono'",
]

// The fonts are bundled, but browsers only fetch a face when text first uses
// it. Loading them up front stops the first frames from showing fallback fonts.
export function loadFonts(): Promise<unknown> {
  return Promise.all(FONT_FACES.map((face) => document.fonts.load(face)))
}
