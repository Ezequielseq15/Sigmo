import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  if (mode === 'production') {
    const apiUrl = loadEnv(mode, process.cwd(), '').VITE_API_URL?.trim()

    if (!apiUrl) {
      throw new Error('Falta VITE_API_URL: configura la URL HTTPS del backend antes de compilar para producción.')
    }

    let parsedApiUrl: URL
    try {
      parsedApiUrl = new URL(apiUrl)
    } catch {
      throw new Error('VITE_API_URL debe ser una URL HTTPS válida del backend.')
    }

    if (parsedApiUrl.protocol !== 'https:' || parsedApiUrl.username || parsedApiUrl.password) {
      throw new Error('VITE_API_URL debe usar HTTPS y no incluir credenciales.')
    }
  }

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      strictPort: true,
    },
  }
})
