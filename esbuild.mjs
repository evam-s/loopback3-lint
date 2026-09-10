import { build } from 'esbuild';

await build({
  entryPoints: ['src/extension.ts'],
  bundle: true,
  outfile: 'dist/extension.js',
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  external: ['vscode'],
  minify: true,
  sourcemap: false,
  // Load ESM builds in preference to CommonJS. This is not a style choice —
  // without it the extension crashes on activation.
  //
  // jsonc-parser's `main` is a UMD bundle whose factory receives `require`
  // as a PARAMETER and calls it as `e("./impl/format")`. esbuild inlines the
  // wrapper but cannot statically resolve a require routed through a
  // parameter, so those calls survive into dist/extension.js as runtime
  // requires against paths that do not exist there. Nothing catches this
  // except loading the built bundle: source, unit tests and the type checker
  // are all perfectly happy, and a grep for `require(` does not even find
  // the call because minification renames the parameter.
  //
  // Its `module` field points at an ESM build using static imports, which
  // esbuild resolves properly.
  mainFields: ['module', 'main'],
});
console.log('bundled dist/extension.js');
