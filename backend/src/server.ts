import pool from './config/database'
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
dotenv.config()

const app = express()

const PORT = Number(process.env.PORT) || 3000

console.log('🚀 Iniciando servidor SIGMO...')
console.log('Puerto configurado:', PORT)

// Middleware
app.use(
  cors({
    origin: 'http://localhost:5173',
  })
)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Ruta principal
app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'API de SIGMO funcionando correctamente',
  })
})

// Ruta de prueba
app.get('/api/health/database', async (_req, res) => {
  try {
    const result = await pool.query('SELECT NOW()')

    res.json({
      success: true,
      message: 'Conexión con PostgreSQL funcionando correctamente',
      databaseTime: result.rows[0].now,
    })
  } catch (error) {
    console.error('Error de conexión con PostgreSQL:', error)

    res.status(500).json({
      success: false,
      message: 'No se pudo conectar con PostgreSQL',
    })
  }
})

// Iniciar servidor
app.listen(3000, '127.0.0.1', () => {
  console.log('')
  console.log('======================================')
  console.log('        SIGMO BACKEND')
  console.log('======================================')
  console.log(`Servidor: http://localhost:${PORT}`)
  console.log('Estado:   ACTIVO')
  console.log('======================================')
})