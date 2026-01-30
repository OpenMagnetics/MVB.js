import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  root: '.',
  base: './',
  build: {
    outDir: 'dist',
    lib: {
      entry: 'src/index.js',
      name: 'OpenMagneticsVirtualBuilder',
      fileName: (format) => `index.${format}.js`
    },
    rollupOptions: {
      external: ['replicad', 'replicad-opencascadejs', 'opencascade.js'],
      output: {
        globals: {
          replicad: 'replicad',
          'replicad-opencascadejs': 'opencascadeWasm',
          'opencascade.js': 'opencascade'
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true,
    fs: {
      // Allow serving files from node_modules and parent directories for test data
      allow: ['..', '../..', '../../..', '../../../..']
    }
  },
  plugins: [{
    name: 'serve-test-data',
    configureServer(server) {
      // Serve testData from MVB/tests/testData/
      const testDataPath = path.resolve(__dirname, '../../../tests/testData');
      server.middlewares.use('/testData', (req, res, next) => {
        const filePath = path.join(testDataPath, req.url);
        fs.readFile(filePath, (err, data) => {
          if (err) {
            res.statusCode = 404;
            res.end('Not found: ' + req.url);
            return;
          }
          res.setHeader('Content-Type', 'application/json');
          res.end(data);
        });
      });
    }
  }],
  assetsInclude: ['**/*.wasm'],
  optimizeDeps: {
    exclude: ['replicad-opencascadejs']
  }
});
