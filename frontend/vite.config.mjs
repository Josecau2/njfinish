import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import autoprefixer from 'autoprefixer'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  // Load environment variables based on mode
  const env = loadEnv(mode, __dirname, '')

  return {
    base: '/',
    // Make env variables available to the application
    define: {
      __APP_ENV__: JSON.stringify(env.VITE_NODE_ENV || mode),
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
            'ui-vendor': ['@coreui/react', '@coreui/icons-react', '@coreui/utils'],
            'form-vendor': ['formik', 'yup', 'react-select', 'react-select/creatable'],
            'date-vendor': ['date-fns', 'date-fns-tz', 'react-datepicker'],
            'redux-vendor': ['@reduxjs/toolkit', 'react-redux', 'redux'],
            'icons-vendor': ['react-icons', 'lucide-react', '@fortawesome/react-fontawesome'],
            'utils-vendor': ['axios', 'sweetalert2', 'classnames', 'prop-types'],
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
        '@coreui/react',
        '@reduxjs/toolkit',
        'react-redux',
        'date-fns',
        'date-fns-tz',
        'axios',
        'sweetalert2',
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
    plugins: [react({
      // Enable React Fast Refresh for better dev experience
      fastRefresh: true,
      // Exclude production optimizations from dev
      include: "**/*.{jsx,tsx}",
    })],
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
      // Ensure only a single copy of React/ReactDOM is used across dependencies
      dedupe: ['react', 'react-dom'],
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
