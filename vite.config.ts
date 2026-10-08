import { solidStart } from '@solidjs/start/config'
import { nitro } from 'nitro/vite'
import UnoCSS from 'unocss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [UnoCSS(), solidStart(), nitro()],
  // @solidjs/start 2.0.6 dev toolbar imports @jridgewell/resolve-uri (UMD), which pnpm's layout keeps out of Vite's automatic pre-bundling
  optimizeDeps: {
    include: ['@solidjs/start > @jridgewell/trace-mapping'],
  },
})
