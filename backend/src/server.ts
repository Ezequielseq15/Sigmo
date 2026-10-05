import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import pool from './config/database'

import authRoutes from './routes/authRoutes'
import monografiaRoutes from './routes/monografiaRoutes'
import avanceRoutes from './routes/avanceRoutes'
import documentoRoutes from './routes/documentoRoutes'
import usuarioRoutes from './routes/usuarioRoutes'
import notificacionRoutes from './routes/notificacionRoutes'
import coordinadorRoutes from './routes/coordinadorRoutes'
dotenv.config()

const app = express()

const PORT = Number(process.env.PORT) || 3000

// =====================================================
// CORS
// =====================================================

app.use(
  cors({
    origin: 'http://localhost:5173',
    methods: [
      'GET',
      'POST',
      'PUT',
      'DELETE',
      'OPTIONS',
    ],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
    ],
  })
)

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(express.json())

app.use(
  express.urlencoded({
    extended: true,
  })
)

// =====================================================
// ARCHIVOS ESTÁTICOS
// =====================================================

app.use(
  '/uploads',
  express.static(
    path.join(
      process.cwd(),
      'uploads'
    )
  )
)

// =====================================================
// RUTA PRINCIPAL
// =====================================================

app.get('/', (_req, res) => {
  res.json({
    success: true,
    message:
      'API de SIGMO funcionando correctamente',
  })
})

// =====================================================
// HEALTH CHECK
// =====================================================

app.get(
  '/api/health',
  (_req, res) => {
    res.json({
      success: true,
      message:
        'Servidor SIGMO activo',
      timestamp:
        new Date().toISOString(),
    })
  }
)

// =====================================================
// HEALTH DATABASE
// =====================================================

app.get(
  '/api/health/database',
  async (_req, res) => {
    try {
      const result =
        await pool.query(
          'SELECT NOW()'
        )

      res.json({
        success: true,
        message:
          'Conexión con PostgreSQL funcionando correctamente',
        databaseTime:
          result.rows[0].now,
      })
    } catch (error) {
      console.error(
        'Error de conexión con PostgreSQL:',
        error
      )

      res.status(500).json({
        success: false,
        message:
          'No se pudo conectar con PostgreSQL',
      })
    }
  }
)

// =====================================================
// RUTAS API
// =====================================================

app.use(
  '/api/auth',
  authRoutes
)

app.use(
  '/api/monografias',
  monografiaRoutes
)

app.use(
  '/api/avances',
  avanceRoutes
)

app.use(
  '/api/documentos',
  documentoRoutes
)

app.use(
  '/api/usuarios',
  usuarioRoutes
)

app.use(
  '/api/notificaciones',
  notificacionRoutes
)
app.use('/api/coordinador', coordinadorRoutes)

// =====================================================
// INICIAR SERVIDOR
// =====================================================

app.listen(
  PORT,
  () => {
    console.log(
      '=============================='
    )

    console.log(
      'SIGMO BACKEND'
    )

    console.log(
      `Servidor: http://localhost:${PORT}`
    )

    console.log(
      'Health: http://localhost:3000/api/health'
    )

    console.log(
      'Database: http://localhost:3000/api/health/database'
    )

    console.log(
      'Usuarios: http://localhost:3000/api/usuarios'
    )

    console.log(
      'Notificaciones: http://localhost:3000/api/notificaciones'
    )

    console.log(
      '=============================='
    )
  }
)