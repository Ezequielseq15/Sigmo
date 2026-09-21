import { useState } from 'react'
import Login from './pages/Login'
import StudentDashboard from './pages/StudentDashboard'
import TutorDashboard from './pages/TutorDashboard'
import CoordinatorDashboard from './pages/CoordinatorDashboard'

type Page = 'login' | 'student' | 'tutor' | 'coordinator'

export default function App() {
  const [page, setPage] = useState<Page>('login')

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
    setPage('login')
  }

  return (
    <div className="h-full">

      {/* LOGIN */}
      {page === 'login' && (
        <Login onSuccess={handleLogin} />
      )}

      {/* ESTUDIANTE */}
      {page === 'student' && (
        <StudentDashboard
          onLogout={handleLogout}
        />
      )}

      {/* TUTOR */}
      {page === 'tutor' && (
        <TutorDashboard
          onLogout={handleLogout}
        />
      )}

      {/* COORDINADOR */}
      {page === 'coordinator' && (
        <CoordinatorDashboard
          onLogout={handleLogout}
        />
      )}

    </div>
  )
}
