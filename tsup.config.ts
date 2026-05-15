import { defineConfig, Options } from 'tsup'

const config: Options = {
  entry: { index: 'src/index.ts' },
  dts: false,
  clean: false,
  minify: false,
  sourcemap: false,
  treeshake: true,
  outDir: 'dist',
  target: 'es2020',
  external: ['react'],
  noExternal: ['zustand'],
}

export default defineConfig([
  // CommonJS
  {
    ...config,
    format: 'cjs',
    dts: true,
    outExtension: () => ({ js: '.cjs' }),
  },
  // EcmaScript Module
  {
    ...config,
    format: 'esm',
    outExtension: () => ({ js: '.mjs' }),
  },
])