import assert from 'node:assert/strict'

export async function request(config, route, { method = 'GET', token, json, form } = {}) {
  const headers = new Headers()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  let body
  if (form) {
    body = form
  } else if (json !== undefined) {
    headers.set('Content-Type', 'application/json')
    body = JSON.stringify(json)
  }
  return fetch(new URL(route, config.origin), {
    method,
    headers,
    body,
    redirect: 'manual',
    signal: AbortSignal.timeout(8000),
  })
}

export async function expectJson(response, expectedStatus, caseId) {
  assert.equal(response.status, expectedStatus, `${caseId}: código HTTP inesperado`)
  const contentType = response.headers.get('content-type') || ''
  assert.match(contentType, /application\/json/i, `${caseId}: se esperaba JSON`)
  return response.json()
}

export function assertNoInternalDetails(body, caseId) {
  const text = JSON.stringify(body).toLowerCase()
  for (const forbidden of ['stack', 'node_modules', 'password_hash', 'postgres://']) {
    assert.equal(text.includes(forbidden), false, `${caseId}: la respuesta expone detalles internos`)
  }
}

export function pdfForm(fields, filename) {
  const form = new FormData()
  for (const [key, value] of Object.entries(fields)) form.append(key, String(value))
  const bytes = Buffer.from('%PDF-1.4\n% SIGMO synthetic integration fixture\n1 0 obj<<>>endobj\n%%EOF\n')
  form.append('archivo', new Blob([bytes], { type: 'application/pdf' }), filename)
  return form
}
