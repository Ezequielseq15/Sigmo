import crypto from 'node:crypto'
import path from 'node:path'
import { createRequire } from 'node:module'
import { integrationConfig } from './lib/safe-target.mjs'

if (!process.argv.includes('--confirm-isolated-db')) {
  throw new Error('Armar el marcador requiere el argumento explícito --confirm-isolated-db.')
}

const config = await integrationConfig()
const requireFromBackend = createRequire(path.join(config.backendRoot, 'package.json'))
const { Pool } = requireFromBackend('pg')
const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  database: config.database.database,
  user: config.database.user,
  password: config.database.password,
  connectionTimeoutMillis: 2000,
  query_timeout: 2000,
  statement_timeout: 2000,
  ssl: false,
  max: 1,
  application_name: 'sigmo-integration-marker-setup',
})

try {
  const identity = await pool.query(`
    SELECT current_database() AS database,
           current_user AS username,
           inet_server_addr()::text AS address,
           inet_server_port() AS port
  `)
  const row = identity.rows[0]
  if (
    row?.database !== 'sigmo_itest' || row?.username !== 'sigmo_test' ||
    row?.address !== '127.0.0.1' || Number(row?.port) !== 55432
  ) {
    throw new Error('La identidad PostgreSQL no coincide con el perfil desechable esperado.')
  }
  const hash = crypto.createHash('sha256').update(config.database.marker, 'utf8').digest('hex')
  const result = await pool.query(
    `INSERT INTO sigmo_itest_control.run_manifest (run_id, marker_sha256)
     VALUES ($1, $2)
     ON CONFLICT (run_id) DO NOTHING
     RETURNING run_id`,
    [config.database.runId, hash]
  )
  if (result.rowCount !== 1) {
    throw new Error('El identificador de corrida ya existe; no se modificó su marcador.')
  }
} catch {
  throw new Error('No se pudo armar la instancia aislada. No se imprimieron detalles de conexión.')
} finally {
  await pool.end().catch(() => {})
}

process.stdout.write('Marcador sintético instalado en la instancia local de pruebas.\n')
