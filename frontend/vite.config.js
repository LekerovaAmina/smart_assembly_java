import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // <-- 1. Импортируем

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // <-- 2. Добавляем в массив плагинов
  ],
})