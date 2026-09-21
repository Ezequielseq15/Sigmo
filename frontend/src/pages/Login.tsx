import { useState } from 'react'
import { Eye, EyeOff, BookOpen } from 'lucide-react'

interface LoginProps {
  onSuccess: (
    role: 'estudiante' | 'tutor' | 'coordinador'
  ) => void
}

interface User {
  email: string
  password: string
  role: 'estudiante' | 'tutor' | 'coordinador'
}

export default function Login({ onSuccess }: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [microsoftLoading, setMicrosoftLoading] = useState(false)

  const USERS: User[] = [
    {
      email: 'estudiante@sigmo.edu',
      password: '123456',
      role: 'estudiante',
    },
    {
      email: 'tutor@sigmo.edu',
      password: '123456',
      role: 'tutor',
    },
    {
      email: 'coordinador@sigmo.edu',
      password: '123456',
      role: 'coordinador',
    },
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    setError('')
    setLoading(true)

    setTimeout(() => {
      const user = USERS.find(
        u =>
          u.email === email.trim().toLowerCase() &&
          u.password === password
      )

      setLoading(false)

      if (user) {
        onSuccess(user.role)
      } else {
        setError(
          'Credenciales incorrectas. Verifique su correo y contraseña.'
        )
      }
    }, 800)
  }

  const handleMicrosoftLogin = () => {
    setError('')
    setMicrosoftLoading(true)

    setTimeout(() => {
      setMicrosoftLoading(false)

      setError(
        'El inicio de sesión con Microsoft estará disponible cuando se configure Microsoft Entra ID.'
      )
    }, 1000)
  }

  return (
    <div className="min-h-full flex">

      {/* =====================================================
          PANEL IZQUIERDO
      ===================================================== */}
      <div className="hidden lg:flex lg:w-1/2 bg-blue-600 text-white relative overflow-hidden">

        {/* Formas decorativas */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-500 rounded-full opacity-40" />

          <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-blue-700 rounded-full opacity-40" />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-16 xl:px-24 w-full">

          {/* LOGO */}
          <div className="flex items-center gap-3 mb-10">

            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center">
              <BookOpen
                size={25}
                className="text-blue-600"
              />
            </div>

            <div>
              <div className="text-2xl font-bold tracking-tight">
                SIGMO
              </div>

              <div className="text-xs text-blue-100 font-mono">
                Sistema Integrado de Gestión Monográfica
              </div>
            </div>

          </div>

          {/* TÍTULO */}
          <h1 className="text-4xl xl:text-5xl font-bold leading-tight mb-6">
            Gestión de tu
            <br />

            <span className="text-blue-100">
              proyecto monográfico
            </span>
          </h1>

          {/* DESCRIPCIÓN */}
          <p className="text-blue-50 text-lg leading-relaxed max-w-lg">
            Plataforma para gestionar monografías, avances,
            tutorías, documentos y procesos de defensa
            académica de manera organizada y eficiente.
          </p>

          {/* INDICADOR */}
          <div className="mt-10 flex items-center gap-3 text-sm text-blue-100">

            <div className="w-2 h-2 rounded-full bg-white" />

            Plataforma académica SIGMO

          </div>

        </div>

      </div>

      {/* =====================================================
          PANEL DERECHO
      ===================================================== */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">

        <div className="w-full max-w-md">

          {/* ENCABEZADO */}
          <div className="text-center mb-8">

            {/* Logo para móvil */}
            <div className="lg:hidden flex justify-center mb-5">

              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white">
                <BookOpen size={24} />
              </div>

            </div>

            <h2 className="text-2xl font-bold text-slate-800">
              Bienvenido a SIGMO
            </h2>

            <p className="text-sm text-slate-500 mt-2">
              Inicie sesión para continuar
            </p>

          </div>

          {/* TARJETA */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-7">

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >

              {/* CORREO */}
              <div>

                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Correo electrónico
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="ejemplo@sigmo.edu"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />

              </div>

              {/* CONTRASEÑA */}
              <div>

                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Contraseña
                </label>

                <div className="relative">

                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Ingrese su contraseña"
                    required
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPass ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>

                </div>

              </div>

              {/* ERROR */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl p-3">
                  {error}
                </div>
              )}

              {/* INICIAR SESIÓN */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
              >
                {loading
                  ? 'Iniciando sesión...'
                  : 'Iniciar sesión'}
              </button>

            </form>

            {/* SEPARADOR */}
            <div className="flex items-center gap-3 my-6">

              <div className="flex-1 h-px bg-slate-200" />

              <span className="text-xs text-slate-400">
                O CONTINUAR CON
              </span>

              <div className="flex-1 h-px bg-slate-200" />

            </div>

            {/* MICROSOFT */}
            <button
              type="button"
              onClick={handleMicrosoftLogin}
              disabled={microsoftLoading}
              className="w-full py-3 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center gap-3 disabled:opacity-60"
            >

              {/* Logo de Microsoft */}
              <span className="grid grid-cols-2 gap-0.5 w-4 h-4">

                <span className="bg-[#f25022]" />
                <span className="bg-[#7fba00]" />
                <span className="bg-[#00a4ef]" />
                <span className="bg-[#ffb900]" />

              </span>

              {microsoftLoading
                ? 'Conectando...'
                : 'Continuar con Microsoft'}

            </button>

          </div>

          {/* PIE */}
          <div className="text-center mt-6">

            <p className="text-xs text-slate-400">
              SIGMO · Sistema Integrado de Gestión Monográfica
            </p>

            <p className="text-xs text-slate-400 mt-1">
              Plataforma académica
            </p>

          </div>

        </div>

      </div>

    </div>
  )
}