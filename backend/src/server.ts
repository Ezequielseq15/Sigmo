import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import pool from './config/database'
import { getJwtSecret } from './config/jwtConfig'
import { authMiddleware, requireRoles } from './middleware/authMiddleware'

import protocoloRoutes from './routes/protocoloRoutes'
import authRoutes from './routes/authRoutes'
import monografiaRoutes from './routes/monografiaRoutes'
import avanceRoutes from './routes/avanceRoutes'
import documentoRoutes from './routes/documentoRoutes'
import usuarioRoutes from './routes/usuarioRoutes'
import notificacionRoutes from './routes/notificacionRoutes'
import coordinadorRoutes from './routes/coordinadorRoutes'
import propuestaCatalogoRoutes from './routes/propuestaCatalogoRoutes'
import defensaRoutes from './routes/defensaRoutes'

dotenv.config()

try {
  getJwtSecret()
} catch {
  console.error('Configuración inválida: JWT_SECRET debe tener al menos 32 bytes. Servidor no iniciado.')
  process.exit(1)
}

const app = express()
const PORT = Number(process.env.PORT) || 3000
const configuredCorsOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean)
const isProduction = process.env.NODE_ENV === 'production'
const corsOrigins = [
  ...(isProduction ? [] : ['http://localhost:5173', 'http://127.0.0.1:5173']),
  ...configuredCorsOrigins,
]

if (isProduction && configuredCorsOrigins.length === 0) {
  console.error('Configuración inválida: define CORS_ORIGINS con los orígenes autorizados del frontend.')
  process.exit(1)
}

// =====================================================
// CORS: debe configurarse antes de todas las rutas
// =====================================================

app.use(cors({
  origin: corsOrigins,
  methods: [
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'OPTIONS',
  ],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
  ],
  exposedHeaders: ['Content-Disposition'],
}))

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

// Las fotos de perfil mantienen la URL usada por la interfaz. Los documentos
// privados solo se sirven mediante endpoints autenticados y autorizados.
app.use('/uploads/perfiles', express.static(path.join(process.cwd(), 'uploads', 'perfiles')))

// =====================================================
// RUTA PRINCIPAL
// =====================================================

app.get('/', authMiddleware, (_req, res) => {
  res.json({
    success: true,
    message: 'API de SIGMO funcionando correctamente',
  })
})

// =====================================================
// HEALTH CHECK
// =====================================================

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Servidor SIGMO activo',
    timestamp: new Date().toISOString(),
  })
})

// =====================================================
// HEALTH DATABASE
// =====================================================

app.get('/api/health/database', async (_req, res) => {
  try {
    const result = await pool.query('SELECT NOW()')

    res.json({
      success: true,
      message: 'Conexión con PostgreSQL funcionando correctamente',
      databaseTime: result.rows[0].now,
    })
  } catch (error) {
    console.error('La comprobación de PostgreSQL falló.')

    res.status(500).json({
      success: false,
      message: 'No se pudo conectar con PostgreSQL',
    })
  }
})

// =====================================================
// RUTAS API
// =====================================================

app.use('/api/protocolos', authMiddleware, protocoloRoutes)

app.use('/api/defensas', authMiddleware, defensaRoutes)

app.use('/api/auth', authRoutes)

// Catálogos para el formulario de propuestas
app.use(
  '/api/monografias/catalogos',
  authMiddleware,
  propuestaCatalogoRoutes
)

app.use('/api/monografias', authMiddleware, monografiaRoutes)

app.use('/api/avances', authMiddleware, avanceRoutes)

app.use('/api/documentos', authMiddleware, documentoRoutes)

app.use('/api/usuarios', authMiddleware, usuarioRoutes)

app.use('/api/notificaciones', authMiddleware, notificacionRoutes)

app.use('/api/coordinador', authMiddleware, requireRoles('COORDINADOR'), coordinadorRoutes)

// =====================================================
// MANEJO DE ERRORES
// =====================================================

app.use((
  error: Error,
  _req: express.Request,
  res: express.Response,
  _next: express.NextFunction
) => {
  const uploadError = error as Error & { status?: number; code?: string }
  const status = uploadError.code === 'LIMIT_FILE_SIZE'
    ? 413
    : uploadError.code?.startsWith('LIMIT_')
      ? 400
      : Number(uploadError.status)
  const statusCode = Number.isInteger(status) && status >= 400 && status < 500 ? status : 500
  console.error('Error no controlado en la API:', error instanceof Error ? error.name : 'UnknownError')

  if (res.headersSent) {
    return
  }

  res.status(statusCode).json({
    success: false,
    message: statusCode === 413
      ? 'El archivo excede el tamaño permitido.'
      : statusCode < 500
        ? 'La solicitud no es válida.'
        : 'Error interno del servidor',
  })
})

// =====================================================
// INICIAR SERVIDOR
// =====================================================

app.listen(PORT, () => {
  console.log('==============================')
  console.log('SIGMO BACKEND')
  console.log(`Servidor: http://localhost:${PORT}`)
  console.log(`Health: http://localhost:${PORT}/api/health`)
  console.log(`Database: http://localhost:${PORT}/api/health/database`)
  console.log('==============================')
})
