const esbuild = require('esbuild');

// Get all dependencies from package.json to mark as external
const pkg = require('./package.json');
const allDeps = Object.keys({
  ...pkg.dependencies,
  ...pkg.devDependencies,
});

// Don't mark react-big-calendar as external because we need to bundle its CSS
const external = allDeps.filter(dep => dep !== 'react-big-calendar');

esbuild.build({
  entryPoints: ['src/main.tsx'],
  bundle: true,
  outdir: 'dist',
  external: external,
  platform: 'node',
  loader: {
    '.css': 'css',
  },
}).catch(() => process.exit(1));
