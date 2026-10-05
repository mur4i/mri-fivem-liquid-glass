// Single-file build for plain HTML resources without a bundler: exposes window.MriLiquidGlass.
import { build } from 'esbuild';

for (const minify of [false, true]) {
  await build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    format: 'iife',
    globalName: 'MriLiquidGlass',
    target: 'chrome103',
    minify,
    outfile: `dist/mri-liquid-glass.iife${minify ? '.min' : ''}.js`,
    logLevel: 'warning',
  });
}
