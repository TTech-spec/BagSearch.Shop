import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import viteImagemin from 'vite-plugin-imagemin'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      'workbox-core': path.resolve(__dirname, 'node_modules/vite-plugin-pwa/node_modules/workbox-core'),
      'workbox-precaching': path.resolve(__dirname, 'node_modules/vite-plugin-pwa/node_modules/workbox-precaching'),
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    viteImagemin({
      gifsicle: { optimizationLevel: 7 },
      optipng: { optimizationLevel: 7 },
      mozjpeg: { quality: 80 },
      pngquant: { quality: [0.8, 0.9] },
      svgo: {
        plugins: [
          { name: 'removeViewBox', active: false },
          { name: 'removeEmptyAttrs', active: true }
        ]
      },
      webp: {
        quality: 75
      }
    }),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      devOptions: {
        enabled: false
      },
      includeAssets: ['logo.webp', 'pwa-192x192.webp', 'pwa-512x512.webp'],
      manifest: {
        name: 'BagSearch',
        short_name: 'BagSearch',
        description: 'Buy & sell authentic luxury designer bags in Nigeria',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.webp',
            sizes: '192x192',
            type: 'image/webp'
          },
          {
            src: 'pwa-512x512.webp',
            sizes: '512x512',
            type: 'image/webp'
          },
          {
            src: 'pwa-512x512.webp',
            sizes: '512x512',
            type: 'image/webp',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 600,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.warn', 'console.info'],
      },
    },
    cssMinify: true,
    reportCompressedSize: true,
    assetsInlineLimit: 4096,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        manualChunks: (id) => {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/@supabase')) {
            return 'vendor-supabase';
          }
          if (id.includes('node_modules/framer-motion')) {
            return 'vendor-motion';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
          if (id.includes('/src/login.jsx') || id.includes('/src/Reg.jsx') || id.includes('/src/forgotPassword.jsx') || id.includes('/src/resetPassword.jsx')) {
            return 'page-auth';
          }
          if (id.includes('/src/Product.jsx') || id.includes('/src/productDetail.jsx') || id.includes('/src/SellerProduct.jsx')) {
            return 'page-products';
          }
          if (id.includes('/src/sellerProfile.jsx') || id.includes('/src/Sellerlisting.jsx') || id.includes('/src/createProduct.jsx')) {
            return 'page-seller';
          }
          if (id.includes('/src/userProfile.jsx')) {
            return 'page-user';
          }
          if (id.includes('/src/home.jsx')) {
            return 'page-home';
          }
          if (id.includes('/src/vendorDetails.jsx')) {
            return 'page-vendor';
          }
        }
      }
    },
  },
})
