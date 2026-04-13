import { defineConfig } from 'tsup'

export default defineConfig([
  // CommonJS
  {
    entry: { index: 'src/index.ts' },
    format: 'cjs',
    outDir: 'dist/cjs',
    dts: true,
    clean: false,
    minify: false,
    sourcemap: false,
    target: 'es2020',
    external: ['react'],
    noExternal: ['zustand'],
    outExtension: () => ({ js: '.cjs' }),
  },

  // ESModule
  {
    entry: { index: 'src/index.ts' },
    format: 'esm',
    outDir: 'dist',
    dts: true,
    clean: true,
    minify: false,
    sourcemap: false,
    target: 'es2020',
    external: ['react'],
    noExternal: ['zustand'],
    outExtension: () => ({ js: '.mjs' }),
  },
])