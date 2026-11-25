import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Deck } from './Deck'
import { loadFonts } from './fonts'
import './style.css'

void loadFonts()

createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <Deck />
  </StrictMode>,
)
