import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Relative asset paths keep dist/ self-contained, so it can be deployed from
// inside the folder (`cd dist && vercel --prod`) or served from any sub-path.
export default defineConfig({
  base: './',
  plugins: [react()],
})
