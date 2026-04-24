import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'server/index': 'src/server/index.ts',
    'client/index': 'src/client/index.ts',
    'components/index': 'src/components/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'es2022',
  treeshake: true,
  external: ['react', 'react-dom', 'next'],
  esbuildOptions(options) {
    options.jsx = 'automatic'
  },
  outExtension: ({ format }) => ({ js: format === 'cjs' ? '.cjs' : '.js' }),
  // tsup strips "use client" / "use server" during bundling. Re-add them
  // after build for the client/components entries so Next.js treats them
  // as client modules.
  onSuccess: 'node scripts/add-use-client.mjs',
})
