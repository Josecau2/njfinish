import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import autoprefixer from 'autoprefixer'

export default defineConfig(() => {
  return {
    base: '/',
    build: {
      outDir: 'build',
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
            'ui-vendor': ['@coreui/react', '@coreui/icons-react', '@coreui/utils'],
            'form-vendor': ['formik', 'yup', 'react-select'],
            'date-vendor': ['date-fns', 'date-fns-tz', 'react-datepicker'],
            'redux-vendor': ['@reduxjs/toolkit', 'react-redux', 'redux'],
            'icons-vendor': ['react-icons', 'lucide-react', '@fortawesome/react-fontawesome'],
            'editor-vendor': ['@ckeditor/ckeditor5-build-classic', '@ckeditor/ckeditor5-react'],
            'utils-vendor': ['axios', 'sweetalert2', 'classnames', 'prop-types']
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
        'sweetalert2'
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
      ],
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
