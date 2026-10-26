import { expireSession, getSessionToken } from '../auth/session'

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim()

export const API_URL = (
  configuredApiUrl || 'http://localhost:3000'
).replace(/\/+$/, '')

export function apiFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  const token = getSessionToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  return fetch(input, { ...init, headers }).then(response => {
    if (response.status === 401) expireSession()
    return response
  })
}

export async function downloadAuthenticatedFile(
  url: string,
  openInNewTab = false
): Promise<void> {
  const preview = openInNewTab ? window.open('about:blank', '_blank') : null
  try {
    const response = await apiFetch(url)
    if (!response.ok) {
      throw new Error('No se pudo abrir el archivo. Verifica tu sesión y tus permisos.')
    }

    const blob = await response.blob()
    const disposition = response.headers.get('Content-Disposition') || ''
    const filenameMatch = disposition.match(/filename\*?=(?:UTF-8''|\")?([^\";]+)/i)
    const filename = filenameMatch?.[1]
      ? decodeURIComponent(filenameMatch[1].replace(/\"/g, ''))
      : 'documento'
    const objectUrl = URL.createObjectURL(blob)

    if (preview) {
      preview.location.href = objectUrl
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000)
      return
    }

    const link = document.createElement('a')
    link.href = objectUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000)
  } catch (error) {
    preview?.close()
    throw error
  }
}
