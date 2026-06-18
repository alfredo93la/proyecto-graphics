import { defineConfig } from 'vite';

export default defineConfig({
  preview: {
    allowedHosts: ['proyecto-graphics-production.up.railway.app'],
  },
  build: {
    chunkSizeWarningLimit: 1500,
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) return 'three';
        },
      },
    },
  },
});
