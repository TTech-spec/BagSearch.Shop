import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
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
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      devOptions: {
        enabled: true
      },
      includeAssets: ['logo.png', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'Aninri Luxe',
        short_name: 'Aninri',
        description: 'Luxury Bag Search and Shop',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
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
    chunkSizeWarningLimit: 1000, // Increase warning threshold to 1000 kB
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-axios': ['axios'],
          // Page-specific chunks
          'page-auth': ['./src/login.jsx', './src/Reg.jsx', './src/forgotPassword.jsx', './src/resetPassword.jsx'],
          'page-products': ['./src/Product.jsx', './src/productDetail.jsx', './src/SellerProduct.jsx'],
          'page-seller': ['./src/sellerProfile.jsx', './src/Sellerlisting.jsx', './src/createProduct.jsx'],
          'page-user': ['./src/userProfile.jsx'],
        }
      }
    }
  },
})
