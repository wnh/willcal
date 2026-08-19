// Two bundles: the browser app and the Node server.
//
// The client is fully self-contained (nothing is external, because the browser
// has no node_modules to load from). The server bundle keeps node-sqlite3-wasm
// external so it can find its .wasm file inside node_modules at runtime.
const esbuild = require('esbuild');
const fs = require('fs');

// Start clean so renamed outputs never leave stale files behind for the
// server's static whitelist to pick up.
fs.rmSync('dist', { recursive: true, force: true });

const client = esbuild.build({
  entryPoints: ['src/main.tsx'],
  bundle: true,
  outdir: 'dist/client',
  platform: 'browser',
  target: ['es2020'],
  format: 'iife',
  sourcemap: true,
  // React and its dependencies branch on this at bundle time.
  define: { 'process.env.NODE_ENV': '"production"' },
  loader: {
    '.css': 'css',
  },
});

const server = esbuild.build({
  entryPoints: ['src/server/index.ts'],
  bundle: true,
  outfile: 'dist/server/index.js',
  platform: 'node',
  target: ['node18'],
  format: 'cjs',
  external: ['node-sqlite3-wasm'],
});

Promise.all([client, server]).catch(() => process.exit(1));
