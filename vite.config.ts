import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // This allows process.env.API_KEY to work in the browser for this demo.
    // In a real production app, use import.meta.env.VITE_API_KEY and .env files.
    'process.env': process.env
  }
});