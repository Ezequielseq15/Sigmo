import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { integrationConfig, startBackend, verifyIsolatedDatabase } from './lib/safe-target.mjs'
import { assertNoInternalDetails, expectJson, pdfForm, request } from './lib/http.mjs'

let config
let backend

before(async () => {
  config = await integrationConfig()
  await verifyIsolatedDatabase(config)
  backend = await startBackend(config, { includeDatabase: true })
})

after(async () => {
  await backend?.stop()
})

test('CP-02 a CP-11: flujo aislado de registro, propiedad, creación y persistencia', async () => {
  const suffix = config.runId
  const password = config.syntheticPassword
  const emails = {
    student: `sigmo.itest+${suffix}@std.uni.edu.ni`,
    otherStudent: `sigmo.other+${suffix}@std.uni.edu.ni`,
    tutor: `sigmo.tutor+${suffix}@dactic.uni.edu.ni`,
    unassignedTutor: `sigmo.tutor2+${suffix}@dactic.uni.edu.ni`,
  }

  const careersResponse = await request(config, '/api/auth/carreras')
  const careers = await expectJson(careersResponse, 200, 'CP-02 carreras')
  assert.ok(Array.isArray(careers.carreras) && careers.carreras.length > 0, 'CP-02: falta carrera sintética activa')
  const careerId = Number(careers.carreras[0].id_carrera)
  assert.ok(Number.isInteger(careerId) && careerId > 0, 'CP-02: carrera sin ID válido')

  async function register(role, email, extras = {}) {
    const body = {
      nombre: 'Usuario', apellido: 'Sintético', correo: email,
      password, confirmPassword: password, rol: role, ...extras,
    }
    const response = await request(config, '/api/auth/register', { method: 'POST', json: body })
    const result = await expectJson(response, 201, 'CP-03 registro')
    assert.equal(result.success, true, 'CP-03: registro no informó éxito')
    assert.ok(typeof result.token === 'string' && result.token.length > 20, 'CP-03: registro no emitió sesión')
    assert.equal(result.user?.rol, role, 'CP-03: perfil creado con rol incorrecto')
    return result
  }

  const student = await register('ESTUDIANTE', emails.student, {
    carnet: `IT-${suffix.slice(0, 24)}`, id_carrera: careerId,
  })
  const otherStudent = await register('ESTUDIANTE', emails.otherStudent, {
    carnet: `OT-${suffix.slice(0, 24)}`, id_carrera: careerId,
  })
  const tutor = await register('TUTOR', emails.tutor, {
    departamento: 'Pruebas sintéticas', especialidad: 'Integración',
  })
  const unassignedTutor = await register('TUTOR', emails.unassignedTutor)

  const duplicateEmail = await request(config, '/api/auth/register', {
    method: 'POST', json: {
      nombre: 'Usuario', apellido: 'Sintético', correo: emails.student,
      password, confirmPassword: password, rol: 'ESTUDIANTE',
      carnet: `DUP-${suffix.slice(0, 24)}`, id_carrera: careerId,
    },
  })
  const duplicateEmailBody = await expectJson(duplicateEmail, 409, 'CP-03 correo duplicado')
  assertNoInternalDetails(duplicateEmailBody, 'CP-03')

  const duplicateCarnet = await request(config, '/api/auth/register', {
    method: 'POST', json: {
      nombre: 'Usuario', apellido: 'Sintético', correo: `duplicate+${suffix}@std.uni.edu.ni`,
      password, confirmPassword: password, rol: 'ESTUDIANTE',
      carnet: `IT-${suffix.slice(0, 24)}`, id_carrera: careerId,
    },
  })
  await expectJson(duplicateCarnet, 409, 'CP-03 carnet duplicado')

  const forbiddenRole = await request(config, '/api/auth/register', {
    method: 'POST', json: { rol: 'COORDINADOR' },
  })
  await expectJson(forbiddenRole, 400, 'CP-03 rol coordinador')

  async function login(email, role) {
    const response = await request(config, '/api/auth/login', {
      method: 'POST', json: { correo: email, password },
    })
    const result = await expectJson(response, 200, 'CP-03 inicio de sesión')
    assert.equal(result.user?.rol, role, 'CP-03: rol de sesión incorrecto')
    assert.ok(typeof result.token === 'string' && result.token.length > 20, 'CP-03: falta JWT')
    return result
  }

  const studentLogin = await login(emails.student, 'ESTUDIANTE')
  const tutorLogin = await login(emails.tutor, 'TUTOR')
  const otherStudentLogin = await login(emails.otherStudent, 'ESTUDIANTE')
  const unassignedTutorLogin = await login(emails.unassignedTutor, 'TUTOR')
  const coordinatorResponse = await request(config, '/api/auth/login', {
    method: 'POST', json: {
      correo: process.env.SIGMO_ITEST_COORDINATOR_EMAIL,
      password: process.env.SIGMO_ITEST_COORDINATOR_PASSWORD,
    },
  })
  const coordinator = await expectJson(coordinatorResponse, 200, 'CP-04 sesión coordinador')
  assert.equal(coordinator.user?.rol, 'COORDINADOR', 'CP-04: fixture coordinador no válido')

  for (const [session, role] of [
    [studentLogin, 'ESTUDIANTE'], [tutorLogin, 'TUTOR'], [coordinator, 'COORDINADOR'],
  ]) {
    const response = await request(config, '/api/auth/session', { token: session.token })
    const body = await expectJson(response, 200, 'CP-10 sesión autenticada')
    assert.equal(body.user?.rol, role, 'CP-10: restauración de sesión con rol distinto')
  }

  const catalogsResponse = await request(config, '/api/monografias/catalogos/propuesta', { token: student.token })
  const catalogs = await expectJson(catalogsResponse, 200, 'CP-02 catálogos')
  assert.ok(Array.isArray(catalogs.ciclos) && catalogs.ciclos.length > 0, 'CP-02: falta ciclo sintético activo')
  const cycleId = Number(catalogs.ciclos[0].id_ciclo)

  async function createProposal(session, title) {
    const response = await request(config, '/api/protocolos', {
      method: 'POST', token: session.token,
      form: pdfForm({ titulo: title, descripcion: 'Propuesta de integración sintética', id_ciclo: cycleId }, `${suffix}-${title.replace(/[^a-z0-9]/gi, '-')}.pdf`),
    })
    const body = await expectJson(response, 201, 'CP-03 propuesta/protocolo')
    assert.ok(Number.isInteger(Number(body.id_monografia)), 'CP-03: no se devolvió ID de monografía')
    return Number(body.id_monografia)
  }

  const ownerMonographId = await createProposal(student, `SIGMO ITest Owner ${suffix}`)
  const otherMonographId = await createProposal(otherStudent, `SIGMO ITest Other ${suffix}`)

  const tutorListResponse = await request(config, '/api/coordinador/tutores', { token: coordinator.token })
  const tutorList = await expectJson(tutorListResponse, 200, 'CP-02 tutores')
  const assignedTutor = tutorList.tutores?.find(row => row.correo === emails.tutor)
  assert.ok(assignedTutor?.id_tutor, 'CP-04: no se encontró tutor sintético')

  const assignmentResponse = await request(config, `/api/monografias/${ownerMonographId}/tutor`, {
    method: 'PUT', token: coordinator.token, json: { id_tutor: assignedTutor.id_tutor },
  })
  await expectJson(assignmentResponse, 200, 'CP-04 asignación de tutor')

  async function protocolId(session, monographId) {
    const response = await request(config, `/api/protocolos/monografia/${monographId}`, { token: session.token })
    const body = await expectJson(response, 200, 'CP-02 historial de protocolo')
    const first = body.protocolos?.[0]
    assert.ok(first?.id_protocolo, 'CP-03: no se encontró protocolo persistido')
    return Number(first.id_protocolo)
  }

  const ownerProtocolId = await protocolId(student, ownerMonographId)
  const otherProtocolId = await protocolId(otherStudent, otherMonographId)

  const pendingAsStudent = await request(config, '/api/protocolos/pendientes', { token: student.token })
  await expectJson(pendingAsStudent, 403, 'CP-11 rol estudiante')
  const pendingAsTutor = await request(config, '/api/protocolos/pendientes', { token: tutor.token })
  await expectJson(pendingAsTutor, 403, 'CP-11 rol tutor')
  const pendingAsCoordinator = await request(config, '/api/protocolos/pendientes', { token: coordinator.token })
  const pendingBody = await expectJson(pendingAsCoordinator, 200, 'CP-02 pendientes coordinador')
  assert.ok(pendingBody.protocolos?.some(row => Number(row.id_protocolo) === ownerProtocolId), 'CP-02: protocolo no aparece pendiente')

  for (const [id, estado, comentario] of [
    [ownerProtocolId, 'APROBADO', 'Aprobación sintética de integración.'],
    [otherProtocolId, 'RECHAZADO', 'Rechazo sintético reproducible.'],
  ]) {
    const response = await request(config, `/api/protocolos/${id}/revisar`, {
      method: 'PUT', token: coordinator.token, json: { estado, comentario_revision: comentario },
    })
    await expectJson(response, 200, 'CP-04 revisión de protocolo')
  }

  const ownerHistoryResponse = await request(config, `/api/protocolos/monografia/${ownerMonographId}`, { token: student.token })
  const ownerHistory = await expectJson(ownerHistoryResponse, 200, 'CP-04 persistencia protocolo')
  assert.equal(ownerHistory.protocolos?.[0]?.estado, 'APROBADO', 'CP-04: aprobación no persistió')
  assert.equal(Number(ownerHistory.protocolos?.[0]?.revisado_por), Number(coordinator.user?.id), 'CP-04: revisado_por no corresponde al coordinador autenticado')
  const rejectedHistoryResponse = await request(config, `/api/protocolos/monografia/${otherMonographId}`, { token: otherStudent.token })
  const rejectedHistory = await expectJson(rejectedHistoryResponse, 200, 'CP-04 persistencia rechazo')
  assert.equal(rejectedHistory.protocolos?.[0]?.estado, 'RECHAZADO', 'CP-04: rechazo no persistió')
  assert.equal(Number(rejectedHistory.protocolos?.[0]?.revisado_por), Number(coordinator.user?.id), 'CP-04: rechazo no registró al coordinador autenticado')

  const monographsCoordinatorResponse = await request(config, '/api/monografias', { token: coordinator.token })
  const monographsCoordinator = await expectJson(monographsCoordinatorResponse, 200, 'CP-02 listado coordinador')
  assert.ok(monographsCoordinator.monografias?.some(row => Number(row.id_monografia) === ownerMonographId), 'CP-03: monografía no persistió')
  assert.equal(Number(monographsCoordinator.monografias.find(row => Number(row.id_monografia) === ownerMonographId)?.id_tutor), Number(assignedTutor.id_tutor), 'CP-04: tutor asignado no persistió')

  const ownerListResponse = await request(config, '/api/monografias', { token: student.token })
  const ownerList = await expectJson(ownerListResponse, 200, 'CP-02 listado estudiante')
  assert.ok(ownerList.monografias?.some(row => Number(row.id_monografia) === ownerMonographId), 'CP-11: estudiante no ve su monografía')
  const tutorListOwnResponse = await request(config, '/api/monografias', { token: tutorLogin.token })
  const tutorListOwn = await expectJson(tutorListOwnResponse, 200, 'CP-02 listado tutor asignado')
  assert.ok(tutorListOwn.monografias?.some(row => Number(row.id_monografia) === ownerMonographId), 'CP-11: tutor asignado no ve la monografía')
  const tutorListOtherResponse = await request(config, '/api/monografias', { token: unassignedTutorLogin.token })
  const tutorListOther = await expectJson(tutorListOtherResponse, 200, 'CP-11 listado tutor no asignado')
  assert.equal(tutorListOther.monografias?.some(row => Number(row.id_monografia) === ownerMonographId), false, 'CP-11: tutor no asignado vio recurso ajeno')

  const foreignHistory = await request(config, `/api/protocolos/monografia/${ownerMonographId}`, { token: otherStudentLogin.token })
  await expectJson(foreignHistory, 404, 'CP-11 acceso a protocolo ajeno')
  const unassignedHistory = await request(config, `/api/protocolos/monografia/${ownerMonographId}`, { token: unassignedTutorLogin.token })
  await expectJson(unassignedHistory, 404, 'CP-11 tutor no asignado')
  const ownerProtocolDownload = await request(config, `/api/protocolos/${ownerProtocolId}/descargar`, { token: student.token })
  assert.equal(ownerProtocolDownload.status, 200, 'CP-11: propietario no pudo descargar el protocolo')
  const ownerProtocolBytes = Buffer.from(await ownerProtocolDownload.arrayBuffer())
  assert.equal(ownerProtocolBytes.subarray(0, 5).toString('ascii'), '%PDF-', 'CP-11: descarga de protocolo no es PDF')
  const foreignProtocolDownload = await request(config, `/api/protocolos/${ownerProtocolId}/descargar`, { token: otherStudentLogin.token })
  await expectJson(foreignProtocolDownload, 404, 'CP-11 descarga de protocolo ajeno')

  const missingProtocol = await request(config, '/api/protocolos/2147483647/descargar', { token: student.token })
  const missingProtocolBody = await expectJson(missingProtocol, 404, 'CP-08 protocolo inexistente')
  assertNoInternalDetails(missingProtocolBody, 'CP-08')

  const advanceForm = pdfForm({
    id_monografia: ownerMonographId,
    id_etapa: config.stageId,
    descripcion: 'Avance PDF sintético para integración.',
  }, `avance-${suffix}.pdf`)
  const advanceResponse = await request(config, '/api/avances', {
    method: 'POST', token: student.token, form: advanceForm,
  })
  const advanceBody = await expectJson(advanceResponse, 201, 'CP-03 avance con PDF')
  const advanceId = Number(advanceBody.avance?.id_avance)
  const documentId = Number(advanceBody.documento?.id_documento)
  assert.ok(advanceId > 0 && documentId > 0, 'CP-03: no se persistieron avance y documento')
  assert.equal(Number(advanceBody.documento.id_avance), advanceId, 'CP-03: documento no está vinculado al avance')

  const advancesResponse = await request(config, `/api/avances/monografia/${ownerMonographId}`, { token: student.token })
  const advances = await expectJson(advancesResponse, 200, 'CP-03 persistencia avance')
  assert.ok(advances.avances?.some(row => Number(row.id_avance) === advanceId), 'CP-03: GET no devolvió el avance creado')

  const authorizedDownload = await request(config, `/api/documentos/download/${documentId}`, { token: student.token })
  assert.equal(authorizedDownload.status, 200, 'CP-11: propietario no pudo descargar el documento')
  const pdfBytes = Buffer.from(await authorizedDownload.arrayBuffer())
  assert.ok(pdfBytes.subarray(0, 5).toString('ascii') === '%PDF-', 'CP-11: descarga no es el PDF sintético')
  const foreignDownload = await request(config, `/api/documentos/download/${documentId}`, { token: otherStudentLogin.token })
  await expectJson(foreignDownload, 404, 'CP-11 descarga ajena')
  const foreignAdvanceList = await request(config, `/api/avances/monografia/${ownerMonographId}`, { token: otherStudentLogin.token })
  await expectJson(foreignAdvanceList, 404, 'CP-11 avances ajenos')

  const unauthorizedTutorReview = await request(config, `/api/avances/${advanceId}/revisar`, {
    method: 'PUT', token: unassignedTutorLogin.token,
    json: { estado: 'APROBADO', comentario_tutor: 'No debe poder revisar.' },
  })
  await expectJson(unauthorizedTutorReview, 404, 'CP-11 revisión por tutor no asignado')
  const coordinatorAdvanceCreate = await request(config, '/api/avances', {
    method: 'POST', token: coordinator.token,
    form: pdfForm({ id_monografia: ownerMonographId, id_etapa: config.stageId, descripcion: 'Debe ser rechazado por rol.' }, `role-${suffix}.pdf`),
  })
  await expectJson(coordinatorAdvanceCreate, 403, 'CP-11 rol coordinador no crea avance')

  const reviewAdvance = await request(config, `/api/avances/${advanceId}/revisar`, {
    method: 'PUT', token: tutorLogin.token,
    json: { estado: 'APROBADO', comentario_tutor: 'Revisión sintética aprobada.' },
  })
  await expectJson(reviewAdvance, 200, 'CP-04 revisión de avance')
  const persistedAdvanceResponse = await request(config, `/api/avances/monografia/${ownerMonographId}`, { token: student.token })
  const persistedAdvance = await expectJson(persistedAdvanceResponse, 200, 'CP-04 persistencia de revisión')
  assert.equal(persistedAdvance.avances?.find(row => Number(row.id_avance) === advanceId)?.estado, 'APROBADO', 'CP-04: estado del avance no persistió')

  const nonOwnerAdvance = pdfForm({
    id_monografia: ownerMonographId,
    id_etapa: config.stageId,
    descripcion: 'No debe persistir para usuario ajeno.',
  }, `foreign-${suffix}.pdf`)
  const deniedAdvance = await request(config, '/api/avances', {
    method: 'POST', token: otherStudentLogin.token, form: nonOwnerAdvance,
  })
  await expectJson(deniedAdvance, 404, 'CP-11 creación sobre monografía ajena')
})
