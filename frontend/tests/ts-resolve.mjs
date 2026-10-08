// Lets Node run the app's TypeScript sources as they are. They import without
// file extensions ('./client.gen', './client'), which Vite allows and Node does
// not, so a relative import that fails is retried as .ts, .tsx or a folder's
// index.ts. Node strips the types itself (Node 22.18 or newer).

import { registerHooks } from 'node:module'

const candidates = ['.ts', '.tsx', '/index.ts']

registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context)
    } catch (error) {
      if (!specifier.startsWith('.')) throw error

      for (const suffix of candidates) {
        try {
          return nextResolve(specifier + suffix, context)
        } catch {
          // try the next candidate
        }
      }

      throw error
    }
  },
})
