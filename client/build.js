const esbuild = require('esbuild');

const apiUrl = process.env.API_URL || '/api';

esbuild.build({
  entryPoints: ['src/main.jsx'],
  bundle: true,
  minify: true,
  sourcemap: false,
  outfile: 'dist/bundle.js',
  loader: { '.js': 'jsx', '.jsx': 'jsx' },
  define: { 'process.env.API_URL': JSON.stringify(apiUrl) },
}).catch(() => process.exit(1));
