export type SessionRole = 'ESTUDIANTE' | 'TUTOR' | 'COORDINADOR'
export type DashboardRole = 'estudiante' | 'tutor' | 'coordinador'

export interface SessionUser {
  id: number
  nombre: string
  apellido: string
  correo: string
  rol: SessionRole
}

export const SESSION_EXPIRED_EVENT = 'sigmo:session-expired'

const TOKEN_KEY = 'sigmo_token'
const USER_KEY = 'sigmo_user'
const LEGACY_USER_KEY = 'usuario'

export function getSessionToken(): string | null {
  try {
    return typeof localStorage === 'undefined'
      ? null
      : localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function startSession(tokenValue: unknown, userValue: unknown): SessionUser {
  if (typeof tokenValue !== 'string' || !tokenValue.trim()) {
    throw new Error('El servidor no devolvió un token de sesión válido.')
  }

  if (typeof userValue !== 'object' || userValue === null || Array.isArray(userValue)) {
    throw new Error('El servidor no devolvió un usuario válido.')
  }

  const user = userValue as Record<string, unknown>
  const id = Number(user.id)
  const roles: SessionRole[] = ['ESTUDIANTE', 'TUTOR', 'COORDINADOR']
  if (!Number.isInteger(id) || id <= 0 || !roles.includes(user.rol as SessionRole)) {
    throw new Error('El servidor devolvió una identidad o un rol no válido.')
  }

  const sessionUser: SessionUser = {
    id,
    nombre: typeof user.nombre === 'string' ? user.nombre : '',
    apellido: typeof user.apellido === 'string' ? user.apellido : '',
    correo: typeof user.correo === 'string' ? user.correo : '',
    rol: user.rol as SessionRole,
  }

  try {
    localStorage.setItem(TOKEN_KEY, tokenValue)
    localStorage.setItem(USER_KEY, JSON.stringify(sessionUser))
    localStorage.removeItem(LEGACY_USER_KEY)
  } catch {
    endSession()
    throw new Error('El navegador no permitió guardar la sesión.')
  }
  return sessionUser
}

export function endSession(): void {
  try {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(LEGACY_USER_KEY)
  } catch {
    // The app still returns to login if browser storage is unavailable.
  }
}

export function expireSession(): void {
  endSession()
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
  }
}

export function dashboardRole(role: SessionRole): DashboardRole {
  switch (role) {
    case 'ESTUDIANTE': return 'estudiante'
    case 'TUTOR': return 'tutor'
    case 'COORDINADOR': return 'coordinador'
  }
}
