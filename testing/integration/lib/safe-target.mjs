import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { spawn } from 'node:child_process'

const API_PORT = 3400
const DB_PORT = 55432
const DB_NAME = 'sigmo_itest'
const DB_USER = 'sigmo_test'
function requiredEnv(name) {
  const value = process.env[name]
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Configuración de prueba incompleta: falta ${name}.`)
  }
  return value
}

function assertLoopbackDb(env) {
  if (env.SIGMO_ITEST_DB_HOST !== '127.0.0.1') {
    throw new Error('La base de integración debe usar DB_HOST 127.0.0.1.')
  }
  if (env.SIGMO_ITEST_DB_PORT !== String(DB_PORT)) {
    throw new Error(`La base de integración debe usar el puerto local ${DB_PORT}.`)
  }
  if (env.SIGMO_ITEST_DB_NAME !== DB_NAME || env.SIGMO_ITEST_DB_USER !== DB_USER) {
    throw new Error('La identidad de la base no coincide con el perfil aislado requerido.')
  }
  if (!env.SIGMO_ITEST_DB_PASSWORD || env.SIGMO_ITEST_DB_PASSWORD.length < 20) {
    throw new Error('Falta la credencial descartable de la base aislada.')
  }
  if (!env.SIGMO_ITEST_DB_MARKER || Buffer.byteLength(env.SIGMO_ITEST_DB_MARKER, 'utf8') < 32) {
    throw new Error('Falta el marcador secreto de la instancia desechable.')
  }
  if (!/^[0-9a-f]{32}$/i.test(env.SIGMO_ITEST_RUN_ID || '')) {
    throw new Error('SIGMO_ITEST_RUN_ID debe ser un UUID sin guiones (32 dígitos hexadecimales).')
  }
  if (env.SIGMO_ITEST_CONFIRM_WRITES !== 'I_ACCEPT_DISPOSABLE_DB') {
    throw new Error('Las pruebas con escritura requieren confirmar la base desechable.')
  }
}

async function validateBackendCopy() {
  const supplied = requiredEnv('SIGMO_ITEST_BACKEND_COPY')
  const root = await fs.realpath(supplied)
  const tempRoot = await fs.realpath(os.tmpdir())
  const relative = path.relative(tempRoot, root)
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('La copia del backend debe ser una carpeta hija de la carpeta temporal del sistema.')
  }
  if (!path.basename(path.dirname(root)).toLowerCase().startsWith('sigmo-it-')) {
    throw new Error('La copia debe estar dentro de una carpeta temporal nueva sigmo-it-* por corrida.')
  }
  if (!path.basename(root).toLowerCase().includes('backend')) {
    throw new Error('La ruta indicada no parece ser la copia temporal del backend.')
  }

  const entries = await fs.readdir(root)
  if (entries.some(entry => entry.toLowerCase().startsWith('.env'))) {
    throw new Error('La copia temporal contiene un archivo .env; se cancela por seguridad.')
  }
  const uploadPath = path.join(root, 'uploads')
  try {
    const uploadInfo = await fs.lstat(uploadPath)
    if (uploadInfo.isSymbolicLink() || !uploadInfo.isDirectory()) {
      throw new Error('El directorio uploads temporal no es seguro.')
    }
    if ((await fs.readdir(uploadPath)).length !== 0) {
      throw new Error('El directorio uploads temporal debe estar vacío al iniciar la corrida.')
    }
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error
  }
  for (const relativeFile of [
    'package.json',
    'src/server.ts',
    'node_modules/ts-node/register/transpile-only.js',
    'node_modules/pg/package.json',
  ]) {
    try {
      await fs.access(path.join(root, relativeFile))
    } catch {
      throw new Error(`La copia temporal del backend está incompleta (${relativeFile}).`)
    }
  }
  return root
}

export async function readOnlyConfig() {
  if (process.env.SIGMO_ITEST_NETWORK_ISOLATED !== 'YES') {
    throw new Error('Confirma que este equipo está aislado para ejecutar el backend temporal.')
  }
  const backendRoot = await validateBackendCopy()
  return {
    backendRoot,
    origin: `http://127.0.0.1:${API_PORT}`,
    port: API_PORT,
    database: null,
  }
}

export async function integrationConfig() {
  if (process.env.SIGMO_ITEST_NETWORK_ISOLATED !== 'YES') {
    throw new Error('Confirma que este equipo está aislado para ejecutar el backend temporal.')
  }
  assertLoopbackDb(process.env)
  const backendRoot = await validateBackendCopy()
  const syntheticPassword = requiredEnv('SIGMO_ITEST_SYNTHETIC_PASSWORD')
  if (Buffer.byteLength(syntheticPassword, 'utf8') < 12 || Buffer.byteLength(syntheticPassword, 'utf8') > 72) {
    throw new Error('La contraseña sintética debe tener entre 12 y 72 bytes.')
  }
  const stageId = Number(requiredEnv('SIGMO_ITEST_STAGE_ID'))
  if (!Number.isInteger(stageId) || stageId <= 0) {
    throw new Error('SIGMO_ITEST_STAGE_ID debe ser un entero positivo de la DB aislada.')
  }
  const coordinatorEmail = requiredEnv('SIGMO_ITEST_COORDINATOR_EMAIL')
  const coordinatorPassword = requiredEnv('SIGMO_ITEST_COORDINATOR_PASSWORD')
  const expectedCoordinatorEmail = `sigmo.coord+${process.env.SIGMO_ITEST_RUN_ID.toLowerCase()}@dactic.uni.edu.ni`
  if (coordinatorEmail.toLowerCase() !== expectedCoordinatorEmail || coordinatorPassword !== syntheticPassword) {
    throw new Error('El coordinador debe ser el fixture sintético exclusivo de esta corrida.')
  }
  return {
    backendRoot,
    origin: `http://127.0.0.1:${API_PORT}`,
    port: API_PORT,
    stageId,
    runId: process.env.SIGMO_ITEST_RUN_ID.toLowerCase(),
    syntheticPassword,
    coordinatorEmail,
    coordinatorPassword,
    database: {
      host: process.env.SIGMO_ITEST_DB_HOST,
      port: DB_PORT,
      database: DB_NAME,
      user: DB_USER,
      password: process.env.SIGMO_ITEST_DB_PASSWORD,
      marker: process.env.SIGMO_ITEST_DB_MARKER,
      runId: process.env.SIGMO_ITEST_RUN_ID.toLowerCase(),
    },
  }
}

function restrictedChildEnv(config, includeDatabase) {
  const env = {}
  for (const key of ['PATH', 'SystemRoot', 'WINDIR', 'TEMP', 'TMP']) {
    if (process.env[key]) env[key] = process.env[key]
  }
  Object.assign(env, {
    PORT: String(config.port),
    NODE_ENV: 'test',
    TS_NODE_TRANSPILE_ONLY: 'true',
    JWT_SECRET: crypto.randomBytes(48).toString('base64url'),
  })
  if (includeDatabase) {
    Object.assign(env, {
      DB_HOST: config.database.host,
      DB_PORT: String(config.database.port),
      DB_NAME: config.database.database,
      DB_USER: config.database.user,
      DB_PASSWORD: config.database.password,
    })
  }
  return env
}

export async function verifyIsolatedDatabase(config) {
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
    application_name: 'sigmo-integration-guard',
  })
  try {
    const identity = await pool.query(`
      SELECT current_database() AS database,
             current_user AS username,
             inet_server_addr()::text AS address,
             inet_server_port() AS port
    `)
    const actual = identity.rows[0]
    if (
      actual?.database !== DB_NAME || actual?.username !== DB_USER ||
      actual?.address !== '127.0.0.1' || Number(actual?.port) !== DB_PORT
    ) {
      throw new Error('La identidad de PostgreSQL no coincide con el perfil local de pruebas.')
    }
    const markerHash = crypto.createHash('sha256').update(config.database.marker, 'utf8').digest('hex')
    const markerResult = await pool.query(
      `SELECT marker_sha256
       FROM sigmo_itest_control.run_manifest
       WHERE run_id = $1`,
      [config.database.runId]
    )
    const stored = markerResult.rows[0]?.marker_sha256
    const expectedBytes = Buffer.from(markerHash, 'hex')
    const storedBytes = typeof stored === 'string' && /^[0-9a-f]{64}$/i.test(stored.trim())
      ? Buffer.from(stored.trim(), 'hex')
      : Buffer.alloc(0)
    if (storedBytes.length !== expectedBytes.length || !crypto.timingSafeEqual(storedBytes, expectedBytes)) {
      throw new Error('La instancia no tiene el marcador de aislamiento de esta corrida.')
    }
  } catch {
    throw new Error('No se pudo comprobar el marcador de la base aislada; no se iniciará el backend.')
  } finally {
    await pool.end().catch(() => {})
  }
}

export async function startBackend(config, { includeDatabase = false } = {}) {
  const child = spawn(
    process.execPath,
    ['-r', 'ts-node/register/transpile-only', 'src/server.ts'],
    {
      cwd: config.backendRoot,
      env: restrictedChildEnv(config, includeDatabase),
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    }
  )

  let listeningBannerSeen = false
  let startupText = ''
  let settled = false
  const started = new Promise((resolve, reject) => {
    const onOutput = chunk => {
      startupText = (startupText + chunk.toString()).slice(-256)
      if (startupText.includes('SIGMO BACKEND')) {
        listeningBannerSeen = true
        if (!settled) {
          settled = true
          resolve()
        }
      }
    }
    child.stdout.on('data', onOutput)
    child.stderr.on('data', () => {})
    child.once('error', () => {
      if (!settled) {
        settled = true
        reject(new Error('No se pudo iniciar el backend desde la copia temporal.'))
      }
    })
    child.once('exit', () => {
      if (!settled) {
        settled = true
        reject(new Error('El backend temporal terminó antes de escuchar en el puerto de prueba.'))
      }
    })
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true
        reject(new Error('El backend temporal no confirmó que quedó escuchando.'))
      }
    }, 15000)
    timer.unref()
  })

  try {
    await started
    if (!listeningBannerSeen) throw new Error('No se confirmó el proceso temporal.')
    const response = await fetch(`${config.origin}/api/health`, { signal: AbortSignal.timeout(1500) })
    if (!response.ok) throw new Error('El endpoint de health del backend temporal no respondió correctamente.')
    return {
      stop: async () => {
        if (child.exitCode === null) child.kill('SIGTERM')
        await new Promise(resolve => {
          if (child.exitCode !== null) return resolve()
          const timer = setTimeout(() => {
            if (child.exitCode === null) child.kill('SIGKILL')
            resolve()
          }, 3000)
          child.once('exit', () => { clearTimeout(timer); resolve() })
        })
      },
    }
  } catch (error) {
    if (child.exitCode === null) child.kill('SIGTERM')
    throw error
  }
}
