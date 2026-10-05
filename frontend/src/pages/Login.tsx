import { useState } from 'react'
import {
  Eye,
  EyeOff,
  BookOpen,
  ArrowLeft,
  CheckCircle,
} from 'lucide-react'

interface LoginProps {
  onSuccess: (
    role: 'estudiante' | 'tutor' | 'coordinador'
  ) => void
}

interface User {
  correo: string
  password: string
  role: 'estudiante' | 'tutor' | 'coordinador'
}

export default function Login({ onSuccess }: LoginProps) {
  // =========================================================
  // ESTADOS DEL LOGIN
  // =========================================================

  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [microsoftLoading, setMicrosoftLoading] = useState(false)

  // =========================================================
  // ESTADOS DEL REGISTRO VISUAL
  // =========================================================

  const [showRegister, setShowRegister] = useState(false)

  const [registerNombre, setRegisterNombre] = useState('')
  const [registerApellido, setRegisterApellido] = useState('')
  const [registerCorreo, setRegisterCorreo] = useState('')
  const [registerRol, setRegisterRol] = useState<
    'estudiante' | 'tutor'
  >('estudiante')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerConfirmPassword, setRegisterConfirmPassword] =
    useState('')

  const [showRegisterPassword, setShowRegisterPassword] =
    useState(false)

  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] =
    useState(false)

  const [registerMessage, setRegisterMessage] = useState('')
  const [registerError, setRegisterError] = useState('')
  const [registerLoading, setRegisterLoading] = useState(false)

  // =========================================================
  // LOGIN
  // =========================================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setError('')

    if (!correo || !password) {
      setError('Ingresa tu correo y contraseña')
      return
    }

    try {
      setLoading(true)

      const response = await fetch(
        'http://localhost:3000/api/auth/login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            correo: correo.trim().toLowerCase(),
            password,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setError(
          data.message || 'No se pudo iniciar sesión'
        )
        return
      }

      // Guardar token
      localStorage.setItem(
        'sigmo_token',
        data.token
      )

      // Guardar información del usuario
      localStorage.setItem(
        'sigmo_user',
        JSON.stringify(data.user)
      )

      // Redirigir según el rol
      switch (data.user.rol) {
        case 'ESTUDIANTE':
          onSuccess('estudiante')
          break

        case 'TUTOR':
          onSuccess('tutor')
          break

        case 'COORDINADOR':
          onSuccess('coordinador')
          break

        default:
          setError(
            'El usuario tiene un rol no válido'
          )
      }
    } catch (error) {
      console.error(
        'Error al iniciar sesión:',
        error
      )

      setError(
        'No se pudo conectar con el servidor. Verifica que el backend esté funcionando.'
      )
    } finally {
      setLoading(false)
    }
  }

  // =========================================================
  // LOGIN MICROSOFT
  // =========================================================

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

  // =========================================================
  // ABRIR REGISTRO
  // =========================================================

  const handleOpenRegister = () => {
    setError('')
    setRegisterMessage('')
    setRegisterError('')
    setShowRegister(true)
  }

  // =========================================================
  // VOLVER AL LOGIN
  // =========================================================

  const handleBackToLogin = () => {
    setShowRegister(false)

    setRegisterNombre('')
    setRegisterApellido('')
    setRegisterCorreo('')
    setRegisterRol('estudiante')
    setRegisterPassword('')
    setRegisterConfirmPassword('')
    setRegisterMessage('')
    setRegisterError('')
  }

  // =========================================================
  // REGISTRO VISUAL
  // =========================================================

  const handleRegister = async (
    e: React.FormEvent
  ) => {
    e.preventDefault()

    setRegisterMessage('')
    setRegisterError('')

    const nombre = registerNombre.trim()
    const apellido = registerApellido.trim()
    const correoRegistro =
      registerCorreo.trim().toLowerCase()

    // -----------------------------------------
    // Validaciones
    // -----------------------------------------

    if (
      !nombre ||
      !apellido ||
      !correoRegistro ||
      !registerPassword ||
      !registerConfirmPassword
    ) {
      setRegisterError(
        'Completa todos los campos'
      )
      return
    }

    if (registerPassword.length < 6) {
      setRegisterError(
        'La contraseña debe tener al menos 6 caracteres'
      )
      return
    }

    if (
      registerPassword !==
      registerConfirmPassword
    ) {
      setRegisterError(
        'Las contraseñas no coinciden'
      )
      return
    }

    // -----------------------------------------
    // Validación de correo institucional
    // -----------------------------------------

    if (
      registerRol === 'estudiante' &&
      !correoRegistro.endsWith(
        '@std.uni.edu.ni'
      )
    ) {
      setRegisterError(
        'Los estudiantes deben utilizar un correo @std.uni.edu.ni'
      )
      return
    }

    if (
      registerRol === 'tutor' &&
      !correoRegistro.endsWith(
        '@dactic.uni.edu.ni'
      )
    ) {
      setRegisterError(
        'Los tutores deben utilizar un correo @dactic.uni.edu.ni'
      )
      return
    }

    // -----------------------------------------
    // Simulación de registro
    // -----------------------------------------

    try {
      setRegisterLoading(true)

      await new Promise(resolve =>
        setTimeout(resolve, 1000)
      )

      setRegisterMessage(
        'Registro completado correctamente. Esta función es una demostración y no crea una cuenta real.'
      )

      // Limpiar campos
      setRegisterNombre('')
      setRegisterApellido('')
      setRegisterCorreo('')
      setRegisterRol('estudiante')
      setRegisterPassword('')
      setRegisterConfirmPassword('')
    } finally {
      setRegisterLoading(false)
    }
  }

  // =========================================================
  // PANTALLA
  // =========================================================

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

            Plataforma para gestionar monografías,
            avances, tutorías, documentos y procesos
            de defensa académica de manera organizada
            y eficiente.

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

          {/* =================================================
              REGISTRO
          ================================================= */}

          {showRegister ? (

            <>
              {/* ENCABEZADO REGISTRO */}

              <div className="text-center mb-8">

                <div className="lg:hidden flex justify-center mb-5">

                  <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white">

                    <BookOpen size={24} />

                  </div>

                </div>

                <h2 className="text-2xl font-bold text-slate-800">
                  Crear una cuenta
                </h2>

                <p className="text-sm text-slate-500 mt-2">
                  Regístrate en SIGMO
                </p>

              </div>

              {/* TARJETA REGISTRO */}

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-7">

                <form
                  onSubmit={handleRegister}
                  className="space-y-4"
                >

                  {/* NOMBRE */}

                  <div>

                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Nombre
                    </label>

                    <input
                      type="text"
                      value={registerNombre}
                      onChange={e =>
                        setRegisterNombre(
                          e.target.value
                        )
                      }
                      placeholder="Ej. Ezequiel"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />

                  </div>

                  {/* APELLIDO */}

                  <div>

                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Apellido
                    </label>

                    <input
                      type="text"
                      value={registerApellido}
                      onChange={e =>
                        setRegisterApellido(
                          e.target.value
                        )
                      }
                      placeholder="Ej. Sequeira"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />

                  </div>

                  {/* CORREO */}

                  <div>

                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Correo institucional
                    </label>

                    <input
                      type="email"
                      value={registerCorreo}
                      onChange={e =>
                        setRegisterCorreo(
                          e.target.value
                        )
                      }
                      placeholder={
                        registerRol === 'estudiante'
                          ? 'ejemplo@std.uni.edu.ni'
                          : 'ejemplo@dactic.uni.edu.ni'
                      }
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />

                  </div>

                  {/* ROL */}

                  <div>

                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Rol
                    </label>

                    <select
                      value={registerRol}
                      onChange={e =>
                        setRegisterRol(
                          e.target.value as
                            | 'estudiante'
                            | 'tutor'
                        )
                      }
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >

                      <option value="estudiante">
                        Estudiante
                      </option>

                      <option value="tutor">
                        Tutor
                      </option>

                    </select>

                  </div>

                  {/* CONTRASEÑA */}

                  <div>

                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Contraseña
                    </label>

                    <div className="relative">

                      <input
                        type={
                          showRegisterPassword
                            ? 'text'
                            : 'password'
                        }
                        value={registerPassword}
                        onChange={e =>
                          setRegisterPassword(
                            e.target.value
                          )
                        }
                        placeholder="Mínimo 6 caracteres"
                        className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowRegisterPassword(
                            !showRegisterPassword
                          )
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showRegisterPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>

                    </div>

                  </div>

                  {/* CONFIRMAR CONTRASEÑA */}

                  <div>

                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Confirmar contraseña
                    </label>

                    <div className="relative">

                      <input
                        type={
                          showRegisterConfirmPassword
                            ? 'text'
                            : 'password'
                        }
                        value={
                          registerConfirmPassword
                        }
                        onChange={e =>
                          setRegisterConfirmPassword(
                            e.target.value
                          )
                        }
                        placeholder="Repita su contraseña"
                        className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowRegisterConfirmPassword(
                            !showRegisterConfirmPassword
                          )
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showRegisterConfirmPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>

                    </div>

                  </div>

                  {/* ERROR */}

                  {registerError && (

                    <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl p-3">

                      {registerError}

                    </div>

                  )}

                  {/* ÉXITO */}

                  {registerMessage && (

                    <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl p-3 flex items-start gap-2">

                      <CheckCircle
                        size={18}
                        className="mt-0.5 flex-shrink-0"
                      />

                      <span>
                        {registerMessage}
                      </span>

                    </div>

                  )}

                  {/* CREAR CUENTA */}

                  <button
                    type="submit"
                    disabled={registerLoading}
                    className="w-full py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
                  >

                    {registerLoading
                      ? 'Creando cuenta...'
                      : 'Crear cuenta'}

                  </button>

                </form>

                {/* VOLVER */}

                <button
                  type="button"
                  onClick={handleBackToLogin}
                  className="w-full mt-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                >

                  <ArrowLeft size={17} />

                  Volver al inicio de sesión

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

            </>

          ) : (

            <>
              {/* =================================================
                  LOGIN
              ================================================= */}

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
                      value={correo}
                      onChange={e =>
                        setCorreo(
                          e.target.value
                        )
                      }
                      placeholder="ejemplo@std.uni.edu.ni"
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
                        type={
                          showPass
                            ? 'text'
                            : 'password'
                        }
                        value={password}
                        onChange={e =>
                          setPassword(
                            e.target.value
                          )
                        }
                        placeholder="Ingrese su contraseña"
                        required
                        className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPass(!showPass)
                        }
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

                {/* =================================================
                    REGISTRO
                ================================================= */}

                <div className="text-center mt-5">

                  <p className="text-sm text-slate-500">

                    ¿No tienes una cuenta?

                    <button
                      type="button"
                      onClick={handleOpenRegister}
                      className="ml-1 text-blue-600 font-semibold hover:text-blue-700"
                    >
                      Registrarse
                    </button>

                  </p>

                </div>

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

                  {/* Logo Microsoft */}

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

            </>

          )}

        </div>

      </div>

    </div>
  )
}