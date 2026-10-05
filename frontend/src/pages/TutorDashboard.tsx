import {
  useEffect,
  useState,
  type ChangeEvent,
  type ReactNode,
} from 'react'

import {
  Home,
  Users,
  Calendar,
  Bell,
  User,
  LogOut,
  Menu,
  Check,
  X,
  ChevronRight,
  Search,
  FileText,
  Download,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  Upload,
} from 'lucide-react'

import StatusBadge from '../components/StatusBadge'
import Modal from '../components/Modal'

interface Props {
  onLogout: () => void
}

type Section =
  | 'inicio'
  | 'monografistas'
  | 'calendario'
  | 'notificaciones'
  | 'perfil'

interface Usuario {
  id: number
  nombre: string
  apellido: string
  correo: string
  rol: string
  foto_perfil?: string | null
}

interface Perfil {
  id_usuario: number
  nombre: string
  apellido: string
  correo: string
  rol: string
  foto_perfil?: string | null
  carnet?: string | null
  carrera?: string | null
}

interface Integrante {
  id_estudiante: number
  id_usuario: number
  carnet: string
  nombre: string
  apellido: string
  correo: string
}

interface Monografia {
  id_monografia: number
  titulo: string
  descripcion?: string | null
  estado: string
  fecha_registro: string

  id_estudiante: number
  carnet?: string | null

  estudiante_nombre: string
  estudiante_apellido: string
  estudiante_correo: string

  integrantes?: Integrante[]

  id_tutor?: number | null
  tutor_nombre?: string | null
  tutor_apellido?: string | null
  tutor_correo?: string | null

  carrera: string
  ciclo: string
}

interface Documento {
  id_documento: number
  id_avance: number
  nombre_archivo: string
  nombre_original: string
  ruta_archivo?: string | null
  tipo_archivo?: string | null
  tamano_bytes?: number | string | null
  fecha_subida: string
}

interface Avance {
  id_avance: number
  id_monografia: number
  id_etapa: number
  etapa_nombre: string
  descripcion: string
  estado: string
  fecha_entrega: string
  comentario_tutor?: string | null
  fecha_revision?: string | null
  documentos: Documento[]
}

interface Notificacion {
  id_notificacion: number
  id_usuario: number
  titulo: string
  mensaje: string
  tipo: string
  leida: boolean
  fecha_creacion: string
}

const API_URL = 'http://localhost:3000'

const etapas = [
  { id: 1, nombre: 'Propuesta' },
  { id: 2, nombre: 'Avance 1' },
  { id: 3, nombre: 'Avance 2' },
  { id: 4, nombre: 'Avance 3' },
  { id: 5, nombre: 'Documento final' },
  { id: 6, nombre: 'Defensa' },
]

const navItems = [
  {
    id: 'inicio' as Section,
    label: 'Inicio',
    icon: Home,
  },
  {
    id: 'monografistas' as Section,
    label: 'Mis Monografistas',
    icon: Users,
  },
  {
    id: 'calendario' as Section,
    label: 'Calendario',
    icon: Calendar,
  },
  {
    id: 'notificaciones' as Section,
    label: 'Notificaciones',
    icon: Bell,
  },
  {
    id: 'perfil' as Section,
    label: 'Perfil',
    icon: User,
  },
]

/*
|--------------------------------------------------------------------------
| FUNCIONES AUXILIARES
|--------------------------------------------------------------------------
*/

const descargarDocumento = (idDocumento: number) => {
  window.open(
    `${API_URL}/api/documentos/download/${idDocumento}`,
    '_blank'
  )
}

const obtenerNombreEtapa = (idEtapa: number) => {
  const etapa = etapas.find(
    item => item.id === idEtapa
  )

  return etapa?.nombre || 'Avance'
}

const formatearFecha = (
  fecha?: string | null
) => {
  if (!fecha) {
    return 'Sin fecha'
  }

  const fechaFormateada = new Date(fecha)

  if (Number.isNaN(fechaFormateada.getTime())) {
    return 'Sin fecha'
  }

  return fechaFormateada.toLocaleDateString(
    'es-NI'
  )
}

const formatearFechaHora = (
  fecha?: string | null
) => {
  if (!fecha) {
    return 'Sin fecha'
  }

  const fechaFormateada = new Date(fecha)

  if (Number.isNaN(fechaFormateada.getTime())) {
    return 'Sin fecha'
  }

  return fechaFormateada.toLocaleString(
    'es-NI'
  )
}

/*
|--------------------------------------------------------------------------
| DASHBOARD PRINCIPAL
|--------------------------------------------------------------------------
*/

export default function TutorDashboard({
  onLogout,
}: Props) {
  const [section, setSection] =
    useState<Section>('inicio')

  const [sidebarOpen, setSidebarOpen] =
    useState(false)

  const [usuario, setUsuario] =
    useState<Usuario | null>(null)

  const [perfil, setPerfil] =
    useState<Perfil | null>(null)

  const [monografias, setMonografias] =
    useState<Monografia[]>([])

  const [
    monografiaSeleccionada,
    setMonografiaSeleccionada,
  ] = useState<Monografia | null>(null)

  const [avances, setAvances] =
    useState<Avance[]>([])

  const [
    avanceSeleccionado,
    setAvanceSeleccionado,
  ] = useState<Avance | null>(null)

  const [notificaciones, setNotificaciones] =
    useState<Notificacion[]>([])

  const [search, setSearch] =
    useState('')

  const [loading, setLoading] =
    useState(true)

  const [loadingAvances, setLoadingAvances] =
    useState(false)

  const [
    loadingNotificaciones,
    setLoadingNotificaciones,
  ] = useState(false)

  const [rejectModal, setRejectModal] =
    useState(false)

  const [comentario, setComentario] =
    useState('')

  const [fotoSeleccionada, setFotoSeleccionada] =
    useState<File | null>(null)

  const [subiendoFoto, setSubiendoFoto] =
    useState(false)

  const [revisando, setRevisando] =
    useState(false)

  const [mensaje, setMensaje] =
    useState<string | null>(null)

  /*
  |--------------------------------------------------------------------------
  | CARGAR USUARIO
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const usuarioGuardado =
      localStorage.getItem('sigmo_user')

    if (!usuarioGuardado) {
      setLoading(false)
      return
    }

    try {
      const usuarioParsed =
        JSON.parse(
          usuarioGuardado
        ) as Usuario

      setUsuario(usuarioParsed)
    } catch (error) {
      console.error(
        'Error al leer sigmo_user:',
        error
      )

      setLoading(false)
    }
  }, [])

  /*
  |--------------------------------------------------------------------------
  | CARGAR PERFIL
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!usuario?.id) {
      return
    }

    const cargarPerfil = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/usuarios/${usuario.id}`
        )

        const data =
          await response.json()

        if (!response.ok) {
          throw new Error(
            data.message ||
              'No se pudo obtener el perfil'
          )
        }

        if (
          data.success &&
          data.usuario
        ) {
          const perfilActualizado =
            data.usuario as Perfil

          setPerfil(
            perfilActualizado
          )

          const usuarioActualizado:
            Usuario = {
              ...usuario,
              nombre:
                perfilActualizado.nombre,
              apellido:
                perfilActualizado.apellido,
              correo:
                perfilActualizado.correo,
              rol:
                perfilActualizado.rol,
              foto_perfil:
                perfilActualizado.foto_perfil ??
                null,
            }

          localStorage.setItem(
            'sigmo_user',
            JSON.stringify(
              usuarioActualizado
            )
          )

          setUsuario(
            usuarioActualizado
          )
        }
      } catch (error) {
        console.error(
          'Error al cargar perfil:',
          error
        )
      }
    }

    cargarPerfil()
  }, [usuario?.id])

  /*
  |--------------------------------------------------------------------------
  | CARGAR MONOGRAFÍAS
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!usuario?.correo) {
      return
    }

    const cargarMonografias =
      async () => {
        try {
          setLoading(true)

          const response =
            await fetch(
              `${API_URL}/api/monografias`
            )

          const data =
            await response.json()

          if (!response.ok) {
            throw new Error(
              data.message ||
                'No se pudieron obtener las monografías'
            )
          }

          const lista:
            Monografia[] =
            data.monografias || []

          const correoTutor =
            usuario.correo
              .trim()
              .toLowerCase()

          const asignadas =
            lista.filter(
              monografia =>
                (
                  monografia.tutor_correo ||
                  ''
                )
                  .trim()
                  .toLowerCase() ===
                correoTutor
            )

          setMonografias(
            asignadas
          )
        } catch (error) {
          console.error(
            'Error al cargar monografías:',
            error
          )

          setMonografias([])
        } finally {
          setLoading(false)
        }
      }

    cargarMonografias()
  }, [usuario?.correo])

  /*
  |--------------------------------------------------------------------------
  | CARGAR NOTIFICACIONES
  |--------------------------------------------------------------------------
  */

  const cargarNotificaciones =
    async (
      idUsuario: number
    ) => {
      try {
        setLoadingNotificaciones(
          true
        )

        const response =
          await fetch(
            `${API_URL}/api/notificaciones/usuario/${idUsuario}`
          )

        const data =
          await response.json()

        if (
          response.ok &&
          data.success
        ) {
          setNotificaciones(
            data.notificaciones || []
          )
        }
      } catch (error) {
        console.error(
          'Error al cargar notificaciones:',
          error
        )
      } finally {
        setLoadingNotificaciones(
          false
        )
      }
    }

  useEffect(() => {
    if (!usuario?.id) {
      return
    }

    cargarNotificaciones(
      usuario.id
    )
  }, [usuario?.id])

  /*
  |--------------------------------------------------------------------------
  | CARGAR AVANCES
  |--------------------------------------------------------------------------
  */

  const cargarAvances =
    async (
      idMonografia: number
    ) => {
      try {
        setLoadingAvances(true)

        const response =
          await fetch(
            `${API_URL}/api/avances/monografia/${idMonografia}`
          )

        const data =
          await response.json()

        if (!response.ok) {
          throw new Error(
            data.message ||
              'No se pudieron obtener los avances'
          )
        }

        const lista =
          data.avances || []

        const avancesCompletos:
          Avance[] =
          await Promise.all(
            lista.map(
              async (
                avance: any
              ) => {
                let documentos:
                  Documento[] = []

                try {
                  const responseDocumentos =
                    await fetch(
                      `${API_URL}/api/documentos/avance/${avance.id_avance}`
                    )

                  const dataDocumentos =
                    await responseDocumentos.json()

                  if (
                    responseDocumentos.ok &&
                    dataDocumentos.success
                  ) {
                    documentos =
                      dataDocumentos.documentos ||
                      []
                  }
                } catch (error) {
                  console.error(
                    'Error al cargar documentos:',
                    error
                  )
                }

                return {
                  id_avance:
                    avance.id_avance,
                  id_monografia:
                    avance.id_monografia,
                  id_etapa:
                    avance.id_etapa,
                  etapa_nombre:
                    avance.etapa_nombre ||
                    obtenerNombreEtapa(
                      avance.id_etapa
                    ),
                  descripcion:
                    avance.descripcion ||
                    '',
                  estado:
                    avance.estado ||
                    'PENDIENTE',
                  fecha_entrega:
                    avance.fecha_entrega,
                  comentario_tutor:
                    avance.comentario_tutor ||
                    null,
                  fecha_revision:
                    avance.fecha_revision ||
                    null,
                  documentos,
                }
              }
            )
          )

        setAvances(
          avancesCompletos
        )

        return avancesCompletos
      } catch (error) {
        console.error(
          'Error al cargar avances:',
          error
        )

        setAvances([])

        return []
      } finally {
        setLoadingAvances(false)
      }
    }

  /*
  |--------------------------------------------------------------------------
  | SELECCIONAR MONOGRAFÍA
  |--------------------------------------------------------------------------
  */

  const seleccionarMonografia =
    async (
      monografia: Monografia
    ) => {
      setMonografiaSeleccionada(
        monografia
      )

      setAvanceSeleccionado(
        null
      )

      setComentario('')

      const avancesCargados =
        await cargarAvances(
          monografia.id_monografia
        )

      if (
        avancesCargados.length > 0
      ) {
        setAvanceSeleccionado(
          avancesCargados[0]
        )
      }
    }

  /*
  |--------------------------------------------------------------------------
  | APROBAR AVANCE
  |--------------------------------------------------------------------------
  */

  const aprobarAvance =
    async () => {
      if (
        !avanceSeleccionado
      ) {
        return
      }

      try {
        setRevisando(true)

        const response =
          await fetch(
            `${API_URL}/api/avances/${avanceSeleccionado.id_avance}/revisar`,
            {
              method: 'PUT',
              headers: {
                'Content-Type':
                  'application/json',
              },
              body: JSON.stringify({
                estado:
                  'APROBADO',
                comentario_tutor:
                  comentario.trim() ||
                  null,
              }),
            }
          )

        const data =
          await response.json()

        if (!response.ok) {
          throw new Error(
            data.message ||
              'No se pudo aprobar el avance'
          )
        }

        setMensaje(
          'Avance aprobado correctamente.'
        )

        setComentario('')

        const avancesActualizados =
          await cargarAvances(
            avanceSeleccionado.id_monografia
          )

        const avanceActualizado =
          avancesActualizados.find(
            avance =>
              avance.id_avance ===
              avanceSeleccionado.id_avance
          )

        setAvanceSeleccionado(
          avanceActualizado ||
            null
        )

        if (usuario?.id) {
          await cargarNotificaciones(
            usuario.id
          )
        }
      } catch (error) {
        console.error(
          'Error al aprobar avance:',
          error
        )

        alert(
          error instanceof Error
            ? error.message
            : 'No se pudo aprobar el avance'
        )
      } finally {
        setRevisando(false)
      }
    }

  /*
  |--------------------------------------------------------------------------
  | RECHAZAR AVANCE
  |--------------------------------------------------------------------------
  */

  const abrirRechazo =
    () => {
      if (
        !avanceSeleccionado
      ) {
        return
      }

      setRejectModal(true)
    }

  const confirmarRechazo =
    async () => {
      if (
        !avanceSeleccionado
      ) {
        return
      }

      const comentarioLimpio =
        comentario.trim()

      if (!comentarioLimpio) {
        alert(
          'Debes indicar el motivo del rechazo.'
        )
        return
      }

      try {
        setRevisando(true)

        const response =
          await fetch(
            `${API_URL}/api/avances/${avanceSeleccionado.id_avance}/revisar`,
            {
              method: 'PUT',
              headers: {
                'Content-Type':
                  'application/json',
              },
              body: JSON.stringify({
                estado:
                  'RECHAZADO',
                comentario_tutor:
                  comentarioLimpio,
              }),
            }
          )

        const data =
          await response.json()

        if (!response.ok) {
          throw new Error(
            data.message ||
              'No se pudo rechazar el avance'
          )
        }

        setRejectModal(false)

        setMensaje(
          'Avance rechazado correctamente.'
        )

        setComentario('')

        const avancesActualizados =
          await cargarAvances(
            avanceSeleccionado.id_monografia
          )

        const avanceActualizado =
          avancesActualizados.find(
            avance =>
              avance.id_avance ===
              avanceSeleccionado.id_avance
          )

        setAvanceSeleccionado(
          avanceActualizado ||
            null
        )

        if (usuario?.id) {
          await cargarNotificaciones(
            usuario.id
          )
        }
      } catch (error) {
        console.error(
          'Error al rechazar avance:',
          error
        )

        alert(
          error instanceof Error
            ? error.message
            : 'No se pudo rechazar el avance'
        )
      } finally {
        setRevisando(false)
      }
    }

  /*
  |--------------------------------------------------------------------------
  | FOTO DE PERFIL
  |--------------------------------------------------------------------------
  */

  const handleFotoSeleccionada =
    (
      event: ChangeEvent<HTMLInputElement>
    ) => {
      const archivo =
        event.target.files?.[0]

      if (!archivo) {
        return
      }

      const tiposPermitidos = [
        'image/jpeg',
        'image/jpg',
        'image/png',
      ]

      if (
        !tiposPermitidos.includes(
          archivo.type
        )
      ) {
        alert(
          'Solo se permiten imágenes JPG, JPEG o PNG.'
        )
        return
      }

      if (
        archivo.size >
        5 * 1024 * 1024
      ) {
        alert(
          'La imagen no puede superar los 5 MB.'
        )
        return
      }

      setFotoSeleccionada(
        archivo
      )
    }

  const subirFotoPerfil =
    async () => {
      if (
        !fotoSeleccionada ||
        !perfil
      ) {
        return
      }

      try {
        setSubiendoFoto(true)

        const formData =
          new FormData()

        formData.append(
          'foto',
          fotoSeleccionada
        )

        const response =
          await fetch(
            `${API_URL}/api/usuarios/${perfil.id_usuario}/foto`,
            {
              method: 'PUT',
              body: formData,
            }
          )

        const data =
          await response.json()

        if (!response.ok) {
          throw new Error(
            data.message ||
              'No se pudo subir la foto'
          )
        }

        if (data.success) {
          const nuevaFoto =
            data.foto_perfil

          setPerfil(
            actual => {
              if (!actual) {
                return actual
              }

              return {
                ...actual,
                foto_perfil:
                  nuevaFoto,
              }
            }
          )

          setUsuario(
            actual => {
              if (!actual) {
                return actual
              }

              const usuarioActualizado:
                Usuario = {
                ...actual,
                foto_perfil:
                  nuevaFoto,
              }

              localStorage.setItem(
                'sigmo_user',
                JSON.stringify(
                  usuarioActualizado
                )
              )

              return usuarioActualizado
            }
          )

          setFotoSeleccionada(
            null
          )

          setMensaje(
            'Foto de perfil actualizada correctamente.'
          )
        }
      } catch (error) {
        console.error(
          'Error al subir foto:',
          error
        )

        alert(
          error instanceof Error
            ? error.message
            : 'No se pudo actualizar la foto'
        )
      } finally {
        setSubiendoFoto(false)
      }
    }

  /*
  |--------------------------------------------------------------------------
  | NOTIFICACIONES
  |--------------------------------------------------------------------------
  */

  const marcarNotificacionLeida =
    async (
      idNotificacion: number
    ) => {
      try {
        const response =
          await fetch(
            `${API_URL}/api/notificaciones/${idNotificacion}/leida`,
            {
              method: 'PUT',
            }
          )

        if (!response.ok) {
          return
        }

        setNotificaciones(
          actual =>
            actual.map(
              notificacion =>
                notificacion.id_notificacion ===
                idNotificacion
                  ? {
                      ...notificacion,
                      leida: true,
                    }
                  : notificacion
            )
        )
      } catch (error) {
        console.error(
          'Error al marcar notificación:',
          error
        )
      }
    }

  const marcarTodasLeidas =
    async () => {
      if (!usuario?.id) {
        return
      }

      try {
        const response =
          await fetch(
            `${API_URL}/api/notificaciones/usuario/${usuario.id}/marcar-todas-leidas`,
            {
              method: 'PUT',
            }
          )

        if (!response.ok) {
          return
        }

        setNotificaciones(
          actual =>
            actual.map(
              notificacion => ({
                ...notificacion,
                leida: true,
              })
            )
        )
      } catch (error) {
        console.error(
          'Error al marcar todas las notificaciones:',
          error
        )
      }
    }

  /*
  |--------------------------------------------------------------------------
  | NAVEGACIÓN
  |--------------------------------------------------------------------------
  */

  const navigate =
    (nuevaSeccion: Section) => {
      setSection(
        nuevaSeccion
      )

      setSidebarOpen(false)

      if (
        nuevaSeccion !==
        'monografistas'
      ) {
        setMonografiaSeleccionada(
          null
        )

        setAvanceSeleccionado(
          null
        )
      }
    }

  const volverMonografistas =
    () => {
      setMonografiaSeleccionada(
        null
      )

      setAvanceSeleccionado(
        null
      )

      setComentario('')

      setSection(
        'monografistas'
      )
    }

  /*
  |--------------------------------------------------------------------------
  | FILTRO
  |--------------------------------------------------------------------------
  */

  const monografiasFiltradas =
    monografias.filter(
      monografia => {
        const texto =
          search
            .toLowerCase()
            .trim()

        const nombre =
          `${monografia.estudiante_nombre} ${monografia.estudiante_apellido}`
            .toLowerCase()

        return (
          nombre.includes(texto) ||
          monografia.titulo
            .toLowerCase()
            .includes(texto)
        )
      }
    )

  /*
  |--------------------------------------------------------------------------
  | ESTADÍSTICAS
  |--------------------------------------------------------------------------
  */

  const avancesPendientes =
    avances.filter(
      avance =>
        avance.estado ===
          'PENDIENTE' ||
        avance.estado ===
          'ENVIADO' ||
        avance.estado ===
          'EN_REVISION'
    ).length

  const avancesAprobados =
    avances.filter(
      avance =>
        avance.estado ===
        'APROBADO'
    ).length

  const notificacionesNoLeidas =
    notificaciones.filter(
      notificacion =>
        !notificacion.leida
    ).length

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto" />

          <p className="mt-4 text-sm text-slate-500">
            Cargando panel del tutor...
          </p>
        </div>
      </div>
    )
  }

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="h-full flex bg-slate-50">

      {/* SIDEBAR */}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-100 flex flex-col transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen
            ? 'translate-x-0'
            : '-translate-x-full'
        }`}
      >

        <div className="p-5 border-b border-slate-100">

          <div className="flex items-center gap-3">

            <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                T
              </span>
            </div>

            <div>
              <div className="font-bold text-slate-800 text-sm">
                SIGMO
              </div>

              <div className="text-xs text-emerald-600">
                Tutor
              </div>
            </div>

          </div>

        </div>

        <div className="p-4 border-b border-slate-100">

          <div className="bg-emerald-50 rounded-xl p-3">

            <div className="text-xs text-slate-500">
              Tutor
            </div>

            <div className="font-semibold text-slate-800 text-sm">
              {usuario
                ? `${usuario.nombre} ${usuario.apellido}`
                : 'Tutor'}
            </div>

            <div className="text-xs text-emerald-600 mt-1">
              {monografias.length}{' '}
              monografista
              {monografias.length !==
              1
                ? 's'
                : ''}{' '}
              asignado
              {monografias.length !==
              1
                ? 's'
                : ''}
            </div>

          </div>

        </div>

        <nav className="flex-1 p-3 space-y-1">

          {navItems.map(
            ({
              id,
              label,
              icon: Icon,
            }) => (
              <button
                key={id}
                onClick={() =>
                  navigate(id)
                }
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                  section === id
                    ? 'bg-emerald-600 text-white font-medium'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >

                <Icon size={16} />

                {label}

                {id ===
                  'notificaciones' &&
                  notificacionesNoLeidas >
                    0 && (
                    <span className="ml-auto min-w-5 h-5 px-1.5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                      {
                        notificacionesNoLeidas
                      }
                    </span>
                  )}

              </button>
            )
          )}

        </nav>

        <div className="p-3 border-t border-slate-100">

          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50"
          >
            <LogOut size={16} />

            Cerrar sesión
          </button>

        </div>

      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 lg:hidden"
          onClick={() =>
            setSidebarOpen(false)
          }
        />
      )}

      <div className="flex-1 flex flex-col overflow-hidden">

        {/* HEADER */}

        <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">

          <div className="flex items-center gap-3">

            <button
              onClick={() =>
                setSidebarOpen(true)
              }
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-500"
            >
              <Menu size={18} />
            </button>

            <span className="font-semibold text-slate-800">
              {
                navItems.find(
                  item =>
                    item.id ===
                    section
                )?.label
              }
            </span>

          </div>

          <div className="flex items-center gap-3">

            <button
              onClick={() =>
                navigate(
                  'notificaciones'
                )
              }
              className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500"
            >
              <Bell size={18} />

              {notificacionesNoLeidas >
                0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>

            <div className="w-9 h-9 rounded-full overflow-hidden bg-emerald-100 flex items-center justify-center text-emerald-700 text-sm font-semibold">

              {usuario?.foto_perfil ? (
                <img
                  src={`${API_URL}${usuario.foto_perfil}`}
                  alt="Foto de perfil"
                  className="w-full h-full object-cover"
                />
              ) : (
                usuario?.nombre?.[0] ||
                'T'
              )}

            </div>

          </div>

        </header>

        {/* CONTENIDO */}

        <main className="flex-1 overflow-y-auto p-6">

          {mensaje && (
            <div className="mb-5 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">

              <div className="flex items-center gap-2">
                <CheckCircle
                  size={17}
                />

                {mensaje}
              </div>

              <button
                onClick={() =>
                  setMensaje(null)
                }
                className="text-emerald-600"
              >
                <X size={16} />
              </button>

            </div>
          )}

          {section ===
            'inicio' && (
            <InicioTutor
              monografias={
                monografias
              }
              avances={
                avances
              }
              notificacionesNoLeidas={
                notificacionesNoLeidas
              }
              onSelectMonografia={
                async monografia => {
                  await seleccionarMonografia(
                    monografia
                  )

                  setSection(
                    'monografistas'
                  )
                }
              }
            />
          )}

          {section ===
            'monografistas' && (
            <MonografistasSection
              monografias={
                monografiasFiltradas
              }
              search={search}
              setSearch={
                setSearch
              }
              seleccionada={
                monografiaSeleccionada
              }
              avances={avances}
              avanceSeleccionado={
                avanceSeleccionado
              }
              loadingAvances={
                loadingAvances
              }
              onSelect={
                seleccionarMonografia
              }
              onBack={
                volverMonografistas
              }
              onSelectAvance={
                avance =>
                  setAvanceSeleccionado(
                    avance
                  )
              }
              onApprove={
                aprobarAvance
              }
              onReject={
                abrirRechazo
              }
              comentario={
                comentario
              }
              setComentario={
                setComentario
              }
              revisando={
                revisando
              }
              onDownloadDocumento={
                descargarDocumento
              }
            />
          )}

          {section ===
            'calendario' && (
            <CalendarioTutor />
          )}

          {section ===
            'notificaciones' && (
            <NotificacionesSection
              notificaciones={
                notificaciones
              }
              loading={
                loadingNotificaciones
              }
              onRead={
                marcarNotificacionLeida
              }
              onReadAll={
                marcarTodasLeidas
              }
            />
          )}

          {section ===
            'perfil' && (
            <PerfilSection
              perfil={perfil}
              usuario={usuario}
              fotoSeleccionada={
                fotoSeleccionada
              }
              subiendoFoto={
                subiendoFoto
              }
              onSelectFoto={
                handleFotoSeleccionada
              }
              onUploadFoto={
                subirFotoPerfil
              }
            />
          )}

        </main>

      </div>

      {/* MODAL RECHAZO */}

      <Modal
        open={rejectModal}
        title="Rechazar avance"
        onClose={() =>
          setRejectModal(false)
        }
      >

        <div className="space-y-4">

          <div className="rounded-xl bg-red-50 border border-red-100 p-4">

            <div className="flex items-start gap-3">

              <AlertCircle
                size={18}
                className="text-red-500 mt-0.5"
              />

              <div>

                <p className="text-sm font-semibold text-red-700">
                  Motivo del rechazo
                </p>

                <p className="text-xs text-red-600 mt-1">
                  Debes indicar las observaciones y correcciones que debe realizar el estudiante.
                </p>

              </div>

            </div>

          </div>

          <textarea
            value={comentario}
            onChange={event =>
              setComentario(
                event.target.value
              )
            }
            rows={5}
            placeholder="Escribe las observaciones..."
            className="w-full px-3 py-3 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
          />

          <div className="flex gap-3">

            <button
              onClick={() =>
                setRejectModal(
                  false
                )
              }
              disabled={revisando}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>

            <button
              onClick={
                confirmarRechazo
              }
              disabled={
                revisando ||
                !comentario.trim()
              }
              className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-50"
            >
              {revisando
                ? 'Procesando...'
                : 'Confirmar rechazo'}
            </button>

          </div>

        </div>

      </Modal>

    </div>
  )
}

/*
|--------------------------------------------------------------------------
| INICIO
|--------------------------------------------------------------------------
*/

function InicioTutor({
  monografias,
  avances,
  notificacionesNoLeidas,
  onSelectMonografia,
}: {
  monografias: Monografia[]
  avances: Avance[]
  notificacionesNoLeidas: number
  onSelectMonografia: (
    monografia: Monografia
  ) => void
}) {
  const pendientes =
    avances.filter(
      avance =>
        avance.estado ===
          'PENDIENTE' ||
        avance.estado ===
          'ENVIADO' ||
        avance.estado ===
          'EN_REVISION'
    ).length

  const aprobados =
    avances.filter(
      avance =>
        avance.estado ===
        'APROBADO'
    ).length

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Panel del Tutor
        </h1>

        <p className="text-sm text-slate-500 mt-1">
          Resumen de tus monografistas y avances.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        <StatCard
          label="Monografías asignadas"
          value={
            monografias.length
          }
          icon={
            <Users size={18} />
          }
          className="text-emerald-600 bg-emerald-50"
        />

        <StatCard
          label="Avances pendientes"
          value={pendientes}
          icon={
            <Clock size={18} />
          }
          className="text-amber-600 bg-amber-50"
        />

        <StatCard
          label="Avances aprobados"
          value={aprobados}
          icon={
            <CheckCircle
              size={18}
            />
          }
          className="text-blue-600 bg-blue-50"
        />

        <StatCard
          label="Notificaciones"
          value={
            notificacionesNoLeidas
          }
          icon={
            <Bell size={18} />
          }
          className="text-red-600 bg-red-50"
        />

      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6">

        <div className="flex items-center justify-between mb-5">

          <div>
            <h2 className="font-semibold text-slate-800">
              Mis monografistas
            </h2>

            <p className="text-xs text-slate-400 mt-1">
              Selecciona una monografía para revisar sus avances.
            </p>
          </div>

          <Users
            size={20}
            className="text-emerald-500"
          />

        </div>

        {monografias.length ===
        0 ? (
          <div className="text-center py-10">

            <Users
              size={42}
              className="mx-auto text-slate-300"
            />

            <p className="mt-3 text-sm text-slate-500">
              No tienes monografistas asignados.
            </p>

          </div>
        ) : (
          <div className="space-y-3">

            {monografias.map(
              monografia => (
                <button
                  key={
                    monografia.id_monografia
                  }
                  onClick={() =>
                    onSelectMonografia(
                      monografia
                    )
                  }
                  className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors text-left"
                >

                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold">
                    {monografia.titulo?.[0] || 'M'}
                  </div>

                  <div className="flex-1 min-w-0">

                    <div className="font-medium text-slate-700 truncate">
                      {monografia.titulo}
                    </div>

                    <div className="text-xs text-slate-400 truncate mt-1">
                      {(monografia.integrantes?.length || 1)} integrante{(monografia.integrantes?.length || 1) !== 1 ? 's' : ''}
                      {' · '}
                      {monografia.carrera}
                    </div>

                  </div>

                  <ChevronRight
                    size={17}
                    className="text-slate-400"
                  />

                </button>
              )
            )}

          </div>
        )}

      </div>

    </div>
  )
}

/*
|--------------------------------------------------------------------------
| STAT CARD
|--------------------------------------------------------------------------
*/

function StatCard({
  label,
  value,
  icon,
  className,
}: {
  label: string
  value: number
  icon: ReactNode
  className: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">

      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center ${className}`}
      >
        {icon}
      </div>

      <div className="text-3xl font-bold text-slate-800 mt-4">
        {value}
      </div>

      <div className="text-xs text-slate-500 mt-1">
        {label}
      </div>

    </div>
  )
}

/*
|--------------------------------------------------------------------------
| MONOGRAFISTAS
|--------------------------------------------------------------------------
*/

function MonografistasSection({
  monografias,
  search,
  setSearch,
  seleccionada,
  avances,
  avanceSeleccionado,
  loadingAvances,
  onSelect,
  onBack,
  onSelectAvance,
  onApprove,
  onReject,
  comentario,
  setComentario,
  revisando,
  onDownloadDocumento,
}: {
  monografias: Monografia[]
  search: string
  setSearch: (
    value: string
  ) => void
  seleccionada:
    Monografia | null
  avances: Avance[]
  avanceSeleccionado:
    Avance | null
  loadingAvances: boolean
  onSelect: (
    monografia: Monografia
  ) => void
  onBack: () => void
  onSelectAvance: (
    avance: Avance
  ) => void
  onApprove: () => void
  onReject: () => void
  comentario: string
  setComentario: (
    value: string
  ) => void
  revisando: boolean
  onDownloadDocumento: (
    idDocumento: number
  ) => void
}) {
  return (
    <div className="space-y-6">

      {!seleccionada ? (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                Mis Monografistas
              </h1>

              <p className="text-sm text-slate-500 mt-1">
                Monografías asignadas a tu tutoría.
              </p>
            </div>

            <div className="relative">

              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={event =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Buscar..."
                className="pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-64"
              />

            </div>

          </div>

          {monografias.length ===
          0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">

              <Users
                size={45}
                className="mx-auto text-slate-300"
              />

              <h3 className="mt-4 font-semibold text-slate-700">
                No hay monografistas asignados
              </h3>

              <p className="text-sm text-slate-500 mt-1">
                Cuando el coordinador te asigne una monografía aparecerá aquí.
              </p>

            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">

              <div className="overflow-x-auto">

                <table className="w-full">

                  <thead>
                    <tr className="border-b border-slate-100">

                      <th className="text-left px-5 py-4 text-xs font-semibold text-slate-500 uppercase">
                        Monografía
                      </th>

                      <th className="text-left px-5 py-4 text-xs font-semibold text-slate-500 uppercase">
                        Integrantes
                      </th>

                      <th className="text-left px-5 py-4 text-xs font-semibold text-slate-500 uppercase">
                        Tutor
                      </th>

                      <th className="text-left px-5 py-4 text-xs font-semibold text-slate-500 uppercase">
                        Estado
                      </th>

                      <th className="px-5 py-4" />

                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-50">

                    {monografias.map(
                      monografia => (
                        <tr
                          key={
                            monografia.id_monografia
                          }
                          className="hover:bg-slate-50"
                        >

                          <td className="px-5 py-4">
                            <div className="text-sm font-semibold text-slate-700 max-w-xs">
                              {monografia.titulo}
                            </div>
                            <div className="text-xs text-slate-400 mt-1">
                              {monografia.ciclo} · {monografia.carrera}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="space-y-1.5">
                              {(monografia.integrantes?.length
                                ? monografia.integrantes
                                : [{
                                    id_estudiante: monografia.id_estudiante,
                                    id_usuario: 0,
                                    carnet: monografia.carnet || '',
                                    nombre: monografia.estudiante_nombre,
                                    apellido: monografia.estudiante_apellido,
                                    correo: monografia.estudiante_correo,
                                  }]
                              ).map(integrante => (
                                <div key={integrante.id_estudiante} className="text-sm text-slate-700">
                                  <span className="font-medium">{integrante.nombre} {integrante.apellido}</span>
                                  <span className="text-xs text-slate-400 ml-2">{integrante.carnet || 'Sin carnet'}</span>
                                </div>
                              ))}
                            </div>
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-500">
                            <div>{monografia.tutor_nombre || 'Sin tutor'}</div>
                            <div className="text-xs text-slate-400 mt-1">{monografia.tutor_correo || ''}</div>
                          </td>

                          <td className="px-5 py-4">

                            <StatusBadge
                              status={
                                monografia.estado
                              }
                            />

                          </td>

                          <td className="px-5 py-4">

                            <button
                              onClick={() =>
                                onSelect(
                                  monografia
                                )
                              }
                              className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                            >
                              Ver

                              <ChevronRight
                                size={14}
                              />
                            </button>

                          </td>

                        </tr>
                      )
                    )}

                  </tbody>

                </table>

              </div>

            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex items-center gap-2 text-sm">

            <button
              onClick={onBack}
              className="text-emerald-600 hover:text-emerald-700"
            >
              Mis Monografistas
            </button>

            <ChevronRight
              size={14}
              className="text-slate-400"
            />

            <span className="text-slate-700 font-medium truncate">
              {seleccionada.titulo}
            </span>

          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-700 font-bold text-lg">
                    {seleccionada.titulo?.[0] || 'M'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                      Proyecto monográfico
                    </p>
                    <h2 className="text-xl font-bold text-slate-800 mt-1">
                      {seleccionada.titulo}
                    </h2>
                  </div>
                </div>

                {seleccionada.descripcion && (
                  <p className="text-sm text-slate-500 mt-4">
                    {seleccionada.descripcion}
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-400">Carrera</p>
                    <p className="text-sm font-medium text-slate-700 mt-1">{seleccionada.carrera}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-400">Ciclo</p>
                    <p className="text-sm font-medium text-slate-700 mt-1">{seleccionada.ciclo}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-400">Tutor</p>
                    <p className="text-sm font-medium text-slate-700 mt-1">{seleccionada.tutor_nombre || 'Sin tutor'}</p>
                  </div>
                </div>
              </div>

              <StatusBadge status={seleccionada.estado} />
            </div>

            <div className="mt-6 pt-5 border-t border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-slate-800">Integrantes</h3>
                  <p className="text-xs text-slate-400 mt-1">Todos los estudiantes asociados a esta monografía.</p>
                </div>
                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                  {(seleccionada.integrantes?.length || 1)} integrante{(seleccionada.integrantes?.length || 1) !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(seleccionada.integrantes?.length
                  ? seleccionada.integrantes
                  : [{
                      id_estudiante: seleccionada.id_estudiante,
                      id_usuario: 0,
                      carnet: seleccionada.carnet || '',
                      nombre: seleccionada.estudiante_nombre,
                      apellido: seleccionada.estudiante_apellido,
                      correo: seleccionada.estudiante_correo,
                    }]
                ).map(integrante => (
                  <div key={integrante.id_estudiante} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-semibold text-emerald-700">
                      {integrante.nombre?.[0]}{integrante.apellido?.[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-700 truncate">
                        {integrante.nombre} {integrante.apellido}
                      </p>
                      <p className="text-xs text-slate-400 truncate">{integrante.correo}</p>
                      <p className="text-xs text-slate-400 mt-0.5">Carnet: {integrante.carnet || 'Sin carnet'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-100 p-5">

              <h3 className="font-semibold text-slate-800 mb-4">
                Avances
              </h3>

              {loadingAvances ? (
                <p className="text-sm text-slate-500">
                  Cargando avances...
                </p>
              ) : avances.length ===
                0 ? (
                <div className="text-center py-8">

                  <FileText
                    size={35}
                    className="mx-auto text-slate-300"
                  />

                  <p className="text-sm text-slate-500 mt-2">
                    No hay avances registrados.
                  </p>

                </div>
              ) : (
                <div className="space-y-2">

                  {avances.map(
                    avance => (
                      <button
                        key={
                          avance.id_avance
                        }
                        onClick={() =>
                          onSelectAvance(
                            avance
                          )
                        }
                        className={`w-full text-left p-3 rounded-xl border transition-colors ${
                          avanceSeleccionado?.id_avance ===
                          avance.id_avance
                            ? 'border-emerald-300 bg-emerald-50'
                            : 'border-slate-100 hover:bg-slate-50'
                        }`}
                      >

                        <div className="flex items-center justify-between gap-2">

                          <span className="text-sm font-medium text-slate-700">
                            {
                              avance.etapa_nombre
                            }
                          </span>

                          <StatusBadge
                            status={
                              avance.estado
                            }
                          />

                        </div>

                        <p className="text-xs text-slate-400 mt-2">
                          Entregado:{' '}
                          {
                            formatearFecha(
                              avance.fecha_entrega
                            )
                          }
                        </p>

                      </button>
                    )
                  )}

                </div>
              )}

            </div>

            <div className="lg:col-span-2">

              {!avanceSeleccionado ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">

                  <Eye
                    size={45}
                    className="mx-auto text-slate-300"
                  />

                  <h3 className="mt-4 font-semibold text-slate-700">
                    Selecciona un avance
                  </h3>

                  <p className="text-sm text-slate-500 mt-1">
                    Selecciona un avance de la lista para revisarlo.
                  </p>

                </div>
              ) : (
                <RevisionAvance
                  avance={
                    avanceSeleccionado
                  }
                  comentario={
                    comentario
                  }
                  setComentario={
                    setComentario
                  }
                  onApprove={
                    onApprove
                  }
                  onReject={
                    onReject
                  }
                  revisando={
                    revisando
                  }
                  onDownload={
                    onDownloadDocumento
                  }
                />
              )}

            </div>

          </div>
        </>
      )}

    </div>
  )
}

/*
|--------------------------------------------------------------------------
| REVISIÓN DE AVANCE
|--------------------------------------------------------------------------
*/

function RevisionAvance({
  avance,
  comentario,
  setComentario,
  onApprove,
  onReject,
  revisando,
  onDownload,
}: {
  avance: Avance
  comentario: string
  setComentario: (
    value: string
  ) => void
  onApprove: () => void
  onReject: () => void
  revisando: boolean
  onDownload: (
    idDocumento: number
  ) => void
}) {
  return (
    <div className="space-y-5">

      <div className="bg-white rounded-2xl border border-slate-100 p-6">

        <div className="flex items-start justify-between gap-4">

          <div>

            <div className="flex items-center gap-2">

              <h2 className="text-xl font-bold text-slate-800">
                {
                  avance.etapa_nombre
                }
              </h2>

              <StatusBadge
                status={
                  avance.estado
                }
              />

            </div>

            <p className="text-xs text-slate-400 mt-2">
              Entregado:{' '}
              {
                formatearFechaHora(
                  avance.fecha_entrega
                )
              }
            </p>

          </div>

          <FileText
            size={25}
            className="text-emerald-500"
          />

        </div>

        <div className="mt-6">

          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Descripción
          </h3>

          <div className="mt-2 bg-slate-50 rounded-xl p-4 text-sm text-slate-700">
            {
              avance.descripcion ||
              'Sin descripción.'
            }
          </div>

        </div>

      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6">

        <h3 className="font-semibold text-slate-800 mb-4">
          Documentos entregados
        </h3>

        {avance.documentos.length ===
        0 ? (
          <div className="p-5 bg-slate-50 rounded-xl text-sm text-slate-500">
            Este avance no tiene documentos asociados.
          </div>
        ) : (
          <div className="space-y-2">

            {avance.documentos.map(
              documento => (
                <div
                  key={
                    documento.id_documento
                  }
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-100"
                >

                  <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">

                    <FileText
                      size={18}
                      className="text-red-500"
                    />

                  </div>

                  <div className="flex-1 min-w-0">

                    <div className="text-sm font-medium text-slate-700 truncate">
                      {
                        documento.nombre_original
                      }
                    </div>

                    <div className="text-xs text-slate-400">
                      PDF
                    </div>

                  </div>

                  <button
                    onClick={() =>
                      onDownload(
                        documento.id_documento
                      )
                    }
                    className="p-2 rounded-lg text-blue-600 hover:bg-blue-50"
                    title="Descargar documento"
                  >
                    <Download
                      size={17}
                    />
                  </button>

                </div>
              )
            )}

          </div>
        )}

      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6">

        <h3 className="font-semibold text-slate-800">
          Retroalimentación
        </h3>

        <p className="text-xs text-slate-400 mt-1">
          El comentario será enviado al estudiante.
        </p>

        <textarea
          value={comentario}
          onChange={event =>
            setComentario(
              event.target.value
            )
          }
          rows={5}
          placeholder="Escribe tus observaciones..."
          className="w-full mt-4 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
        />

        {avance.comentario_tutor && (
          <div className="mt-4 bg-amber-50 border border-amber-100 rounded-xl p-4">

            <p className="text-xs font-semibold text-amber-700">
              Comentario anterior
            </p>

            <p className="text-sm text-amber-800 mt-1">
              {
                avance.comentario_tutor
              }
            </p>

          </div>
        )}

        <div className="flex gap-3 mt-5">

          <button
            onClick={onReject}
            disabled={
              revisando ||
              avance.estado ===
                'APROBADO'
            }
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 disabled:opacity-50"
          >
            <X size={16} />
            RECHAZAR
          </button>

          <button
            onClick={onApprove}
            disabled={
              revisando ||
              avance.estado ===
                'APROBADO'
            }
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50"
          >
            <Check size={16} />

            {revisando
              ? 'Procesando...'
              : 'APROBAR'}
          </button>

        </div>

      </div>

    </div>
  )
}

/*
|--------------------------------------------------------------------------
| NOTIFICACIONES
|--------------------------------------------------------------------------
*/

function NotificacionesSection({
  notificaciones,
  loading,
  onRead,
  onReadAll,
}: {
  notificaciones: Notificacion[]
  loading: boolean
  onRead: (
    id: number
  ) => void
  onReadAll: () => void
}) {
  return (
    <div className="space-y-5">

      <div className="flex items-center justify-between">

        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Notificaciones
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            Avisos relacionados con SIGMO.
          </p>
        </div>

        <button
          onClick={onReadAll}
          className="text-sm text-emerald-600 hover:text-emerald-700"
        >
          Marcar todas como leídas
        </button>

      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">

        {loading ? (
          <div className="p-10 text-center text-sm text-slate-500">
            Cargando notificaciones...
          </div>
        ) : notificaciones.length ===
          0 ? (
          <div className="p-10 text-center">

            <Bell
              size={40}
              className="mx-auto text-slate-300"
            />

            <p className="text-sm text-slate-500 mt-3">
              No tienes notificaciones.
            </p>

          </div>
        ) : (
          <div className="divide-y divide-slate-100">

            {notificaciones.map(
              notificacion => (
                <button
                  key={
                    notificacion.id_notificacion
                  }
                  onClick={() => {
                    if (
                      !notificacion.leida
                    ) {
                      onRead(
                        notificacion.id_notificacion
                      )
                    }
                  }}
                  className={`w-full text-left p-5 flex gap-4 hover:bg-slate-50 ${
                    !notificacion.leida
                      ? 'bg-emerald-50/40'
                      : ''
                  }`}
                >

                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      notificacion.leida
                        ? 'bg-slate-100 text-slate-400'
                        : 'bg-emerald-100 text-emerald-600'
                    }`}
                  >
                    <Bell size={18} />
                  </div>

                  <div className="flex-1">

                    <div className="flex items-center justify-between gap-3">

                      <h3 className="text-sm font-semibold text-slate-700">
                        {
                          notificacion.titulo
                        }
                      </h3>

                      {!notificacion.leida && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      )}

                    </div>

                    <p className="text-sm text-slate-500 mt-1">
                      {
                        notificacion.mensaje
                      }
                    </p>

                    <p className="text-xs text-slate-400 mt-2">
                      {
                        formatearFechaHora(
                          notificacion.fecha_creacion
                        )
                      }
                    </p>

                  </div>

                </button>
              )
            )}

          </div>
        )}

      </div>

    </div>
  )
}

/*
|--------------------------------------------------------------------------
| PERFIL
|--------------------------------------------------------------------------
*/

function PerfilSection({
  perfil,
  usuario,
  fotoSeleccionada,
  subiendoFoto,
  onSelectFoto,
  onUploadFoto,
}: {
  perfil: Perfil | null
  usuario: Usuario | null
  fotoSeleccionada:
    File | null
  subiendoFoto: boolean
  onSelectFoto: (
    event: ChangeEvent<HTMLInputElement>
  ) => void
  onUploadFoto: () => void
}) {
  return (
    <div className="space-y-5 max-w-2xl">

      <div>

        <h1 className="text-2xl font-bold text-slate-800">
          Mi Perfil
        </h1>

        <p className="text-sm text-slate-500 mt-1">
          Información de tu cuenta de tutor.
        </p>

      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6">

        <div className="flex flex-col sm:flex-row items-center gap-5">

          <div className="w-24 h-24 rounded-2xl overflow-hidden bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-3xl">

            {(
              perfil?.foto_perfil ||
              usuario?.foto_perfil
            ) ? (
              <img
                src={`${API_URL}${
                  perfil?.foto_perfil ||
                  usuario?.foto_perfil
                }`}
                alt="Foto de perfil"
                className="w-full h-full object-cover"
              />
            ) : (
              perfil?.nombre?.[0] ||
              usuario?.nombre?.[0] ||
              'T'
            )}

          </div>

          <div className="flex-1">

            <h2 className="text-xl font-bold text-slate-800">
              {perfil
                ? `${perfil.nombre} ${perfil.apellido}`
                : usuario
                ? `${usuario.nombre} ${usuario.apellido}`
                : 'Tutor'}
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              {perfil?.correo ||
                usuario?.correo}
            </p>

            <div className="mt-2">
              <StatusBadge
                status="ACTIVO"
              />
            </div>

          </div>

        </div>

        <div className="mt-6 pt-6 border-t border-slate-100">

          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Cambiar foto de perfil
          </label>

          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            onChange={
              onSelectFoto
            }
            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
          />

          {fotoSeleccionada && (
            <div className="mt-3 text-xs text-slate-500">
              Archivo seleccionado:{' '}
              <strong>
                {
                  fotoSeleccionada.name
                }
              </strong>
            </div>
          )}

          <button
            onClick={
              onUploadFoto
            }
            disabled={
              !fotoSeleccionada ||
              subiendoFoto
            }
            className="mt-4 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50"
          >
            <Upload size={16} />

            {subiendoFoto
              ? 'Subiendo...'
              : 'Actualizar foto'}
          </button>

        </div>

      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6">

        <h3 className="font-semibold text-slate-800 mb-5">
          Información personal
        </h3>

        <div className="space-y-4">

          <ProfileRow
            label="Nombre"
            value={
              perfil
                ? `${perfil.nombre} ${perfil.apellido}`
                : '—'
            }
          />

          <ProfileRow
            label="Correo"
            value={
              perfil?.correo ||
              usuario?.correo ||
              '—'
            }
          />

          <ProfileRow
            label="Rol"
            value={
              perfil?.rol ||
              usuario?.rol ||
              'TUTOR'
            }
          />

          <ProfileRow
            label="Monografistas asignados"
            value="Consulta en Mis Monografistas"
          />

        </div>

      </div>

    </div>
  )
}

function ProfileRow({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-1 sm:gap-4">

      <span className="text-xs text-slate-400 sm:w-40">
        {label}
      </span>

      <span className="text-sm text-slate-700 font-medium">
        {value}
      </span>

    </div>
  )
}

/*
|--------------------------------------------------------------------------
| CALENDARIO
|--------------------------------------------------------------------------
*/

function CalendarioTutor() {
  return (
    <div className="space-y-5">

      <div>

        <h1 className="text-2xl font-bold text-slate-800">
          Calendario
        </h1>

        <p className="text-sm text-slate-500 mt-1">
          Calendario de defensas y actividades.
        </p>

      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">

        <Calendar
          size={48}
          className="mx-auto text-emerald-500"
        />

        <h3 className="mt-4 font-semibold text-slate-700">
          Calendario de defensas
        </h3>

        <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
          Esta sección queda preparada para integrar las fechas de defensa cuando el módulo de programación esté conectado.
        </p>

      </div>

    </div>
  )
}