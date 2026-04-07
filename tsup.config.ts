import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],  // Only the main entry
  // Or if you need all files:
  // entry: {
  //   index: 'src/index.ts',
  //   'engine/session': 'src/engine/session.ts',
  //   // etc...
  // },
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  external: ['react'],
  splitting: false,
});