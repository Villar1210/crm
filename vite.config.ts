import fs from 'fs'
import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const certsExist =
  fs.existsSync(path.resolve(__dirname, 'certs/localhost-key.pem')) &&
  fs.existsSync(path.resolve(__dirname, 'certs/localhost.pem'))

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['pdfjs-dist'],
  },
  server: {
    ...(certsExist ? {
      https: {
        key: fs.readFileSync(path.resolve(__dirname, 'certs/localhost-key.pem')),
        cert: fs.readFileSync(path.resolve(__dirname, 'certs/localhost.pem')),
      },
    } : {}),
    headers: {
      'Content-Security-Policy': "frame-ancestors 'self' https://web.whatsapp.com",
    },
  },
})
