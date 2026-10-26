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
  console.info('Conexión establecida con PostgreSQL')
})

pool.on('error', () => {
  console.error('Error inesperado en el pool de PostgreSQL (detalles omitidos)')
})

export default pool
