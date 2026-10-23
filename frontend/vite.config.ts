import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools({
      // Vite already forwards browser warnings and errors to the terminal. With
      // the devtools pipe on as well, the terminal is echoed back to the browser
      // and every browser warning goes around in an endless loop.
      consolePiping: { enabled: false },
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
})

export default config
