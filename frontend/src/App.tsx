import { lazy, Suspense, useEffect, useState } from 'react'
import Login from './pages/Login'
import { API_URL, apiFetch } from './config/api'
import {
  dashboardRole,
  endSession,
  getSessionToken,
  SESSION_EXPIRED_EVENT,
  startSession,
} from './auth/session'

const StudentDashboard = lazy(() => import('./pages/StudentDashboard'))
const TutorDashboard = lazy(() => import('./pages/TutorDashboard'))
const CoordinatorDashboard = lazy(() => import('./pages/CoordinatorDashboard'))

type Page = 'login' | 'student' | 'tutor' | 'coordinator'
type SessionState = 'checking' | 'ready' | 'unavailable'

export default function App() {
  const [page, setPage] = useState<Page>('login')
  const [sessionState, setSessionState] = useState<SessionState>('checking')
  const [sessionError, setSessionError] = useState('')
  const [validationAttempt, setValidationAttempt] = useState(0)

  useEffect(() => {
    const handleSessionExpired = () => {
      endSession()
      setPage('login')
      setSessionError('')
      setSessionState('ready')
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'sigmo_token' && event.newValue === null) {
        handleSessionExpired()
      }
    }

    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired)
    window.addEventListener('storage', handleStorage)
    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired)
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const token = getSessionToken()

    if (!token) {
      endSession()
      setPage('login')
      setSessionState('ready')
      return () => { cancelled = true }
    }

    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 12000)
    setSessionState('checking')
    setSessionError('')

    const validateSession = async () => {
      try {
        const response = await apiFetch(`${API_URL}/api/auth/session`, {
          signal: controller.signal,
        })
        const data = await response.json().catch(() => null)

        if (response.status === 401) {
          endSession()
          if (!cancelled) {
            setPage('login')
            setSessionState('ready')
          }
          return
        }

        if (!response.ok || !data?.success || !data.user) {
          throw new Error(data?.message || 'No se pudo validar la sesión.')
        }

        let user
        try {
          user = startSession(token, data.user)
        } catch {
          endSession()
          if (!cancelled) {
            setPage('login')
            setSessionState('ready')
          }
          return
        }

        if (!cancelled) {
          const role = dashboardRole(user.rol)
          setPage(role === 'estudiante' ? 'student' : role === 'tutor' ? 'tutor' : 'coordinator')
          setSessionState('ready')
        }
      } catch {
        if (!cancelled) {
          setSessionError('No se pudo validar la sesión con el backend. Reintenta o vuelve al inicio de sesión.')
          setSessionState('unavailable')
        }
      } finally {
        window.clearTimeout(timeout)
      }
    }

    void validateSession()
    return () => {
      cancelled = true
      controller.abort()
      window.clearTimeout(timeout)
    }
  }, [validationAttempt])

  const handleLogin = (
    role: 'estudiante' | 'tutor' | 'coordinador'
  ) => {
    switch (role) {
      case 'estudiante':
        setPage('student')
        break

      case 'tutor':
        setPage('tutor')
        break

      case 'coordinador':
        setPage('coordinator')
        break
    }
  }

  const handleLogout = () => {
    endSession()
    setPage('login')
    setSessionError('')
    setSessionState('ready')
  }

  if (sessionState === 'checking') {
    return (
      <div className="flex h-full min-h-screen items-center justify-center bg-slate-50 p-6">
        <p role="status" className="text-sm text-slate-600">Validando sesión con SIGMO...</p>
      </div>
    )
  }

  if (sessionState === 'unavailable') {
    return (
      <div className="flex h-full min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <p role="alert" className="text-sm text-slate-700">{sessionError}</p>
          <div className="mt-5 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => setValidationAttempt(attempt => attempt + 1)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >Reintentar</button>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >Volver al inicio de sesión</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Suspense fallback={(
      <div className="flex h-full min-h-screen items-center justify-center bg-slate-50 p-6">
        <p role="status" className="text-sm text-slate-600">Cargando panel…</p>
      </div>
    )}>
    <div className="h-full">

      {/* LOGIN */}
      {sessionState === 'ready' && page === 'login' && (
        <Login onSuccess={handleLogin} />
      )}

      {/* ESTUDIANTE */}
      {sessionState === 'ready' && page === 'student' && (
        <StudentDashboard
          onLogout={handleLogout}
        />
      )}

      {/* TUTOR */}
      {sessionState === 'ready' && page === 'tutor' && (
        <TutorDashboard
          onLogout={handleLogout}
        />
      )}

      {/* COORDINADOR */}
      {sessionState === 'ready' && page === 'coordinator' && (
        <CoordinatorDashboard
          onLogout={handleLogout}
        />
      )}

    </div>
    </Suspense>
  )
}
