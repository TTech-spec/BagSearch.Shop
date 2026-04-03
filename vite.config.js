import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
    },
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
