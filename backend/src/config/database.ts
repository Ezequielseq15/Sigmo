import { Pool } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
})

pool.on('connect', () => {
  console.log('✅ Conexión establecida con PostgreSQL')
})

pool.on('error', (error: Error) => {
  console.error('❌ Error en el pool de PostgreSQL:', error)
})

// Prueba de conexión
pool.query('SELECT NOW()')
  .then((result) => {
    console.log('✅ PostgreSQL está funcionando')
    console.log('🕐 Hora de PostgreSQL:', result.rows[0].now)
  })
  .catch((error: Error) => {
    console.error('❌ No se pudo conectar a PostgreSQL')
    console.error('Detalles:', error.message)
  })

export default pool