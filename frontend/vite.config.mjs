import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import autoprefixer from 'autoprefixer'
import { visualizer } from 'rollup-plugin-visualizer'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  // Load environment variables based on mode
  const env = loadEnv(mode, __dirname, '')

  // Determine if we're in production mode
  const isProduction = mode === 'production'

  return {
    base: '/',
    // Make env variables available to the application
    define: {
      __APP_ENV__: JSON.stringify(env.VITE_NODE_ENV || mode),
      'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
    },
  // Ensure Vite uses the frontend folder as root (so index.html is resolved correctly)
  root: __dirname,
    build: {
      outDir: 'build', // Output to build directory
      emptyOutDir: true, // Clean output directory
      sourcemap: false, // Disable source maps for production
      minify: 'terser', // Use terser for better minification
      target: 'es2020', // Modern browsers for better optimization
      cssCodeSplit: true, // Split CSS for better caching
      chunkSizeWarningLimit: 1000, // Increase chunk size limit
      terserOptions: {
        compress: {
          drop_console: true, // Remove console.log statements
          drop_debugger: true, // Remove debugger statements
          dead_code: true, // Remove dead code
          pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn']
        },
        format: {
          comments: false, // Remove all comments
        },
      },
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunks for better caching
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'chakra-vendor': ['@chakra-ui/react', '@emotion/react', '@emotion/styled', 'framer-motion'],
            'form-vendor': ['formik', 'yup', 'react-select', 'react-select/creatable'],
            'date-vendor': ['date-fns', 'date-fns-tz', 'react-datepicker'],
            'redux-vendor': ['@reduxjs/toolkit', 'react-redux', 'redux'],
            'icons-vendor': ['lucide-react'],
            'utils-vendor': ['axios', 'classnames', 'prop-types'],
            'pdf-vendor': ['pdfjs-dist', 'react-pdf']
          },
        },
      },
    },
    css: {
      postcss: {
        plugins: [
          autoprefixer({}), // add options if needed
        ],
      },
    },
    esbuild: {
      loader: 'jsx',
      include: /src\/.*\.jsx?$/,
      exclude: [],
      target: 'es2020', // Modern target for better optimization
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@reduxjs/toolkit',
        'react-redux',
        'date-fns',
        'date-fns-tz',
        'axios',
        'react-select',
        'react-select/creatable',
        'formik',
        'yup',
        'react-datepicker'
      ],
      esbuildOptions: {
        loader: {
          '.js': 'jsx',
        },
        target: 'es2020'
      },
    },
    plugins: [
      react({
        // Enable React Fast Refresh for better dev experience
        fastRefresh: true,
        // Exclude production optimizations from dev
        include: "**/*.{jsx,tsx}",
        // Ensure proper JSX runtime based on mode
        jsxRuntime: 'automatic',
        babel: {
          plugins: mode === 'production' ? [] : []
        }
      }),
      // Bundle analyzer - runs in analyze mode only
      mode === 'analyze' && visualizer({
        filename: 'build/stats.html',
        open: true,
        gzipSize: true,
        brotliSize: true,
      })
    ].filter(Boolean),
    resolve: {
      alias: [
        {
          find: 'src/',
          replacement: `${path.resolve(__dirname, 'src')}/`,
        },
        {
          // Use a regex so only imports starting with '@/...' are aliased,
          // avoiding collisions with scoped packages like '@reduxjs/...'
          find: /^@\//,
          replacement: `${path.resolve(__dirname, 'src')}/`,
        },
      ],
      // Ensure only a single copy of React/ReactDOM, Emotion, and Framer Motion is used across dependencies
      dedupe: ['react', 'react-dom', '@emotion/react', '@emotion/styled', 'framer-motion'],
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.scss'],
    },
    server: {
      port: 3000,
      proxy: {
        // Proxy API requests to backend server
        '/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
          secure: false
        }
      },
    },
  }
})
