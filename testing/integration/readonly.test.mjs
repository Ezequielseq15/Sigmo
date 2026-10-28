import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { readOnlyConfig, startBackend } from './lib/safe-target.mjs'
import { assertNoInternalDetails, expectJson, request } from './lib/http.mjs'

let config
let backend

before(async () => {
  config = await readOnlyConfig()
  backend = await startBackend(config, { includeDatabase: false })
})

after(async () => {
  await backend?.stop()
})

test('CP-01: health devuelve estado y timestamp', async () => {
  const started = performance.now()
  const response = await request(config, '/api/health')
  const elapsed = performance.now() - started
  const body = await expectJson(response, 200, 'CP-01')
  assert.equal(body.success, true, 'CP-01: health no informó éxito')
  assert.ok(Number.isFinite(Date.parse(body.timestamp)), 'CP-01: timestamp inválido')
  assert.equal(body.status, 'ok', 'CP-01: falta status=ok')
  assert.ok(Number.isFinite(body.uptime) && body.uptime > 0, 'CP-01: falta uptime positivo')
  assert.ok(elapsed < 100, 'CP-01: latencia supera 100 ms')
})

test('CP-05: registro rechaza campos requeridos ausentes sin consultar la base', async () => {
  const response = await request(config, '/api/auth/register', {
    method: 'POST', json: { rol: 'ESTUDIANTE' },
  })
  const body = await expectJson(response, 400, 'CP-05')
  assert.match(body.message || '', /nombre.*apellido.*correo.*contraseña/i, 'CP-05: mensaje de validación no identifica campos')
})

test('CP-06: registro rechaza carrera con tipo/formato inválido antes de escribir', async () => {
  const response = await request(config, '/api/auth/register', {
    method: 'POST',
    json: {
      nombre: 'Prueba', apellido: 'Sintética', correo: 'validation+invalid@std.uni.edu.ni',
      password: 'Synthetic-pass-2026', confirmPassword: 'Synthetic-pass-2026',
      rol: 'ESTUDIANTE', carnet: 'ITEST-INVALID-TYPE', id_carrera: 'no-es-numero',
    },
  })
  const body = await expectJson(response, 400, 'CP-06')
  assert.match(body.message || '', /carrera válida/i, 'CP-06: mensaje no identifica el campo numérico')
})

test('CP-07: registro rechaza formato de correo inválido', async () => {
  const response = await request(config, '/api/auth/register', {
    method: 'POST',
    json: {
      nombre: 'Prueba', apellido: 'Sintética', correo: 'invalido-sin-arroba',
      password: 'Synthetic-pass-2026', confirmPassword: 'Synthetic-pass-2026',
      rol: 'ESTUDIANTE', carnet: 'ITEST-INVALID-EMAIL', id_carrera: 1,
    },
  })
  const body = await expectJson(response, 400, 'CP-07')
  assert.match(body.message || '', /correo/i, 'CP-07: rechazo no identifica el correo')
})

test('CP-03: el registro público rechaza el rol COORDINADOR', async () => {
  const response = await request(config, '/api/auth/register', {
    method: 'POST', json: { rol: 'COORDINADOR' },
  })
  const body = await expectJson(response, 400, 'CP-03')
  assert.match(body.message || '', /ESTUDIANTE.*TUTOR/i, 'CP-03: mensaje de roles públicos inesperado')
})

test('CP-09: ruta inexistente devuelve un 404 JSON claro', async () => {
  const response = await request(config, `/api/it-${Date.now()}-not-found`)
  const body = await expectJson(response, 404, 'CP-09')
  assertNoInternalDetails(body, 'CP-09')
  assert.equal(typeof body.message, 'string', 'CP-09: falta mensaje claro')
})

test('CP-10: rutas privadas rechazan ausencia y falsificación de token', async () => {
  const absent = await request(config, '/api/monografias')
  await expectJson(absent, 401, 'CP-10 sin token')
  const invalid = await request(config, '/api/monografias', { token: 'not-a-valid-jwt' })
  const body = await expectJson(invalid, 401, 'CP-10 token inválido')
  assertNoInternalDetails(body, 'CP-10')
})
