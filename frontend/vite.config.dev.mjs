// vite.config.dev.mjs - Development optimized config
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(() => {
  return {
    base: '/',
  // Ensure the dev build uses the frontend folder as the root so index.html is resolved
  root: __dirname,
    build: {
      outDir: 'build',
      sourcemap: true, // Enable source maps for development
      minify: false, // Skip minification for faster builds
      target: 'esnext', // Modern target for development
      cssCodeSplit: false, // Single CSS file for faster dev builds
      rollupOptions: {
        output: {
          manualChunks: undefined, // No chunk splitting for development
        },
      },
    },
    esbuild: {
      target: 'esnext',
      loader: 'jsx',
      include: /src\/.*\.jsx?$/,
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@reduxjs/toolkit',
        'react-redux'
      ],
      esbuildOptions: {
        target: 'esnext'
      },
    },
    plugins: [react({
      fastRefresh: true,
      include: "**/*.{jsx,tsx}",
    })],
    resolve: {
      alias: [
        {
          find: 'src/',
          replacement: `${path.resolve(__dirname, 'src')}/`,
        },
      ],
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.scss'],
    },
  }
})
