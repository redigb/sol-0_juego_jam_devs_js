import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './', // <--- ¡AÑADIMOS ESTA LÍNEA CRÍTICA!
  plugins: [react()],
  optimizeDeps: {
    include: ['phaser'],
  },
  build: {
    commonjsOptions: {
      include: [/phaser/, /node_modules/],
    },
  },
})