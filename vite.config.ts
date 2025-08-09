import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    electron([{
      entry: 'electron/main.ts',
     
      vite: {
        build: {
          outDir: 'dist-electron',
        },
      },
      
    },{
      entry: 'electron/preload.ts'
    }]),
  
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
