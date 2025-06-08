import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

// Placeholder for custom shader inject plugin
defineShaderInjectPlugin(); // You need to implement this or use an existing Vite plugin

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    // defineShaderInjectPlugin(), // Uncomment and implement if needed
  ],
  server: {
    proxy: {
      '/': {
        target: 'http://localhost:30001',
        ws: true,
        changeOrigin: true,
      },
    },
    open: false,
    strictPort: true,
  },
  build: {
    outDir: 'scripts',
    sourcemap: true,
    minify: 'terser',
    rollupOptions: {
      input: 'scripts/main.ts', // Adjust entry point as needed
    },
  },
  resolve: {
    extensions: ['.ts', '.js', '.frag', '.vert'],
  },
  assetsInclude: ['**/*.frag', '**/*.vert'],
});

// You may need to implement a Vite plugin for shader injection similar to your gulp-shader-inject
function defineShaderInjectPlugin() {
  // TODO: Implement shader injection logic here
}
