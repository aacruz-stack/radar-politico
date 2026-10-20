import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// `npm run build:artifact` gera a versão publicada como Artifact no claude.ai:
// um único bundle (sem iframe do YouTube, que o visualizador bloqueia).
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  base: './',
  define: { __ARTIFACT__: JSON.stringify(mode === 'artifact') },
  build:
    mode === 'artifact'
      ? { outDir: 'dist-artifact', modulePreload: false, cssCodeSplit: false, assetsInlineLimit: Infinity }
      : {},
  server: { host: true, port: 5173 },
}))
