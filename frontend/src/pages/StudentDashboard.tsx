import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'

import {
  Home,
  FileText,
  TrendingUp,
  Calendar,
  LogOut,
  Menu,
  Upload,
  Download,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  Bell,
  User,
  Camera,
  X,
  Check,
  PlusCircle,
} from 'lucide-react'
import { API_URL, apiFetch, downloadAuthenticatedFile } from '../config/api'
import DefensaPanel from '../components/DefensaPanel'

interface StudentDashboardProps {
  onLogout: () => void
}

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
  foto_perfil: string | null
  carnet: string | null
  carrera: string | null
  id_estudiante?: number | null
  id_carrera?: number | null
}

interface Etapa {
  id: number
  nombre: string
}

interface Documento {
  id_documento: number
  id_avance: number
  nombre_archivo: string
  nombre_original: string | null
  ruta_archivo: string | null
  tipo_archivo: string | null
  tamano_bytes: number | string | null
  fecha_subida: string
}

interface Avance {
  id: number
  tipo: string
  descripcion: string
  estado: string
  fecha: string
  documentos: Documento[]
  comentario_tutor?: string | null
  fecha_revision?: string | null
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
  descripcion: string
  estado: string
  fecha_registro: string
  carnet: string
  estudiante_nombre: string
  estudiante_apellido: string
  estudiante_correo: string
  tutor_nombre: string | null
  tutor_apellido: string | null
  tutor_correo: string | null
  carrera: string
  ciclo: string
  integrantes: Integrante[]
  estado_propuesta?: string | null
  estado_protocolo?: string | null
  comentario_propuesta?: string | null
  fecha_revision_propuesta?: string | null
}

interface CicloAcademico {
  id_ciclo: number
  nombre: string
  activo?: boolean
}

interface EstudianteDisponible {
  id_estudiante: number
  carnet: string
  nombre: string
  apellido: string
  correo: string
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

interface FormDataAvance {
  id_etapa: string
  descripcion: string
  archivo: File | null
}

type Section =
  | 'inicio'
  | 'monografia'
  | 'avances'
  | 'calendario'
  | 'perfil'

export default function StudentDashboard({
  onLogout,
}: StudentDashboardProps) {
  const [section, setSection] =
    useState<Section>('inicio')

  const [sidebarOpen, setSidebarOpen] =
    useState(false)

  const [usuario, setUsuario] =
    useState<Usuario | null>(null)

  const [perfil, setPerfil] =
    useState<Perfil | null>(null)

  const [monografia, setMonografia] =
    useState<Monografia | null>(null)

  const [avances, setAvances] =
    useState<Avance[]>([])

  const [notificaciones, setNotificaciones] =
    useState<Notificacion[]>([])

  const [notificacionesAbiertas, setNotificacionesAbiertas] =
    useState(false)

  const [showModal, setShowModal] =
    useState(false)

  const [fotoSeleccionada, setFotoSeleccionada] =
    useState<File | null>(null)

  const [subiendoFoto, setSubiendoFoto] =
    useState(false)

  const [submitting, setSubmitting] =
    useState(false)

  const [ciclosPropuesta, setCiclosPropuesta] =
    useState<CicloAcademico[]>([])

  const [estudiantesDisponibles, setEstudiantesDisponibles] =
    useState<EstudianteDisponible[]>([])

  const [cargandoCatalogos, setCargandoCatalogos] =
    useState(false)

  const [enviandoPropuesta, setEnviandoPropuesta] =
    useState(false)

  const [mensajePropuesta, setMensajePropuesta] =
    useState('')

  const [errorPropuesta, setErrorPropuesta] =
    useState('')

  const [archivoProtocoloCorregido, setArchivoProtocoloCorregido] =
    useState<File | null>(null)

  const [enviandoProtocoloCorregido, setEnviandoProtocoloCorregido] =
    useState(false)

  const [mensajeProtocoloCorregido, setMensajeProtocoloCorregido] =
    useState('')

  const [errorProtocoloCorregido, setErrorProtocoloCorregido] =
    useState('')

  const [propuestaForm, setPropuestaForm] = useState({
    titulo: '',
    descripcion: '',
    id_ciclo: '',
    integrantes: [] as number[],
    archivo: null as File | null,
  })

  const [busquedaCarnet, setBusquedaCarnet] = useState('')

  const [loadingPerfil, setLoadingPerfil] =
    useState(true)

  const [loadingMonografia, setLoadingMonografia] =
    useState(true)

  /*
  |--------------------------------------------------------------------------
  | FORMULARIO
  |--------------------------------------------------------------------------
  */

  const [formData, setFormData] =
    useState<FormDataAvance>({
      id_etapa: '',
      descripcion: '',
      archivo: null,
    })

  const [etapasCargables, setEtapasCargables] = useState<Etapa[]>([])
  const [loadingEtapas, setLoadingEtapas] = useState(true)
  const [errorEtapas, setErrorEtapas] = useState('')

  /*
  |--------------------------------------------------------------------------
  | CARGAR USUARIO
  |--------------------------------------------------------------------------
  */


  const protocoloAceptado =
    String(monografia?.estado_protocolo || '').trim().toUpperCase() === 'APROBADO'

  useEffect(() => {
    const usuarioGuardado =
      localStorage.getItem('sigmo_user')

    if (!usuarioGuardado) {
      setLoadingPerfil(false)
      setLoadingMonografia(false)
      return
    }

    try {
      const usuarioParsed =
        JSON.parse(usuarioGuardado)

      if (
        usuarioParsed &&
        usuarioParsed.id
      ) {
        setUsuario(usuarioParsed)
      } else {
        setLoadingPerfil(false)
        setLoadingMonografia(false)
      }
    } catch (error) {
      console.error(
        'Error al leer sigmo_user:',
        error
      )

      setLoadingPerfil(false)
      setLoadingMonografia(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const cargarEtapas = async () => {
      setLoadingEtapas(true)
      setErrorEtapas('')
      try {
        const response = await apiFetch(`${API_URL}/api/avances/etapas`)
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data.message || 'No se pudieron cargar las etapas.')
        const etapas = Array.isArray(data.etapas)
          ? data.etapas.map((item: { id_etapa: number; nombre: string }) => ({
              id: Number(item.id_etapa),
              nombre: String(item.nombre),
            })).filter((item: Etapa) =>
              Number.isInteger(item.id) &&
              item.id > 0 &&
              item.nombre.trim().length > 0 &&
              !['propuesta', 'defensa'].includes(item.nombre.trim().toLocaleLowerCase())
            )
          : []
        if (!cancelled) setEtapasCargables(etapas)
      } catch (error) {
        if (!cancelled) {
          setErrorEtapas(error instanceof Error ? error.message : 'No se pudieron cargar las etapas.')
          setEtapasCargables([])
        }
      } finally {
        if (!cancelled) setLoadingEtapas(false)
      }
    }
    void cargarEtapas()
    return () => { cancelled = true }
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
        setLoadingPerfil(true)

        const response =
          await apiFetch(
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
          setPerfil(data.usuario)

          const usuarioActualizado: Usuario = {
            ...usuario,
            nombre:
              data.usuario.nombre,
            apellido:
              data.usuario.apellido,
            correo:
              data.usuario.correo,
            rol:
              data.usuario.rol,
            foto_perfil:
              data.usuario.foto_perfil,
          }

          setUsuario(
            usuarioActualizado
          )

          localStorage.setItem(
            'sigmo_user',
            JSON.stringify(
              usuarioActualizado
            )
          )
        }
      } catch (error) {
        console.error(
          'Error al cargar perfil:',
          error
        )
      } finally {
        setLoadingPerfil(false)
      }
    }

    cargarPerfil()
  }, [usuario?.id])

  useEffect(() => {
    if (section !== 'monografia' || monografia || !usuario?.id) return

    const cargarCatalogos = async () => {
      try {
        setCargandoCatalogos(true)
        const response = await apiFetch(`${API_URL}/api/monografias/catalogos/propuesta`)
        const data = await response.json()
        if (!response.ok) throw new Error(data.message || 'No se pudieron cargar los datos del formulario')
        setCiclosPropuesta(Array.isArray(data.ciclos) ? data.ciclos : [])
        setEstudiantesDisponibles(
          (Array.isArray(data.estudiantes) ? data.estudiantes : []).filter(
            (estudiante: EstudianteDisponible) => estudiante.correo !== usuario.correo
          )
        )
      } catch (error) {
        setErrorPropuesta(error instanceof Error ? error.message : 'No se pudieron cargar los datos del formulario')
      } finally {
        setCargandoCatalogos(false)
      }
    }

    cargarCatalogos()
  }, [section, monografia, usuario?.id, usuario?.correo])

  const enviarPropuesta = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMensajePropuesta('')
    setErrorPropuesta('')

    if (!perfil?.id_estudiante || !perfil?.id_carrera) {
      setErrorPropuesta('Tu perfil no tiene una carrera o registro de estudiante válido. Contacta al administrador.')
      return
    }
    if (!propuestaForm.titulo.trim() || !propuestaForm.descripcion.trim() || !propuestaForm.id_ciclo || !propuestaForm.archivo) {
      setErrorPropuesta('Completa todos los campos y adjunta el protocolo en PDF.')
      return
    }
    if (propuestaForm.archivo.type !== 'application/pdf' && !propuestaForm.archivo.name.toLowerCase().endsWith('.pdf')) {
      setErrorPropuesta('El archivo del protocolo debe ser PDF.')
      return
    }
    if (propuestaForm.archivo.size > 10 * 1024 * 1024) {
      setErrorPropuesta('El PDF no puede superar los 10 MB.')
      return
    }

    const integrantes = propuestaForm.integrantes.filter((id) => id !== perfil.id_estudiante)
    if (integrantes.length > 1) {
      setErrorPropuesta('Selecciona como máximo dos integrantes adicionales.')
      return
    }

    const datos = new FormData()
    datos.append('titulo', propuestaForm.titulo.trim())
    datos.append('descripcion', propuestaForm.descripcion.trim())
    datos.append('id_estudiante', String(perfil.id_estudiante))
    datos.append('enviado_por', String(perfil.id_usuario))
    datos.append('id_carrera', String(perfil.id_carrera))
    datos.append('id_ciclo', propuestaForm.id_ciclo)
    datos.append('integrantes', JSON.stringify(integrantes))
    datos.append('archivo', propuestaForm.archivo)

    try {
      setEnviandoPropuesta(true)
      const response = await apiFetch(`${API_URL}/api/protocolos`, {
        method: 'POST',
        body: datos,
      })
      const data = await response.json()
      if (!response.ok) {
        if (response.status === 409 || data.code === 'MONOGRAFIA_DUPLICADA') {
          throw new Error(data.message || 'Ya existe una monografía con ese título. Usa un título diferente.')
        }
        throw new Error(data.message || 'No se pudo registrar la propuesta.')
      }
      setMensajePropuesta(data.message || 'La propuesta fue enviada correctamente para revisión.')
      setPropuestaForm({ titulo: '', descripcion: '', id_ciclo: '', integrantes: [], archivo: null })
      setBusquedaCarnet('')
      const selector = document.getElementById('archivo-propuesta') as HTMLInputElement | null
      if (selector) selector.value = ''
      setLoadingMonografia(true)
      const listaResponse = await apiFetch(`${API_URL}/api/monografias`)
      const listaData = await listaResponse.json()
      const lista: Monografia[] = listaData.monografias || []
      const encontrada = lista.find((item) => item.estudiante_correo === usuario?.correo || item.integrantes?.some((integrante) => integrante.correo === usuario?.correo))
      if (encontrada) {
        setMonografia({ ...encontrada, integrantes: Array.isArray(encontrada.integrantes) ? encontrada.integrantes : [] })
      }
    } catch (error) {
      setErrorPropuesta(error instanceof Error ? error.message : 'Ocurrió un error al enviar la propuesta.')
    } finally {
      setEnviandoPropuesta(false)
      setLoadingMonografia(false)
    }
  }

  const reenviarProtocolo = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMensajeProtocoloCorregido('')
    setErrorProtocoloCorregido('')

    if (!monografia?.id_monografia) {
      setErrorProtocoloCorregido('No se encontró la monografía que necesita corrección.')
      return
    }

    if (!archivoProtocoloCorregido) {
      setErrorProtocoloCorregido('Selecciona el protocolo corregido en PDF.')
      return
    }

    if (archivoProtocoloCorregido.type !== 'application/pdf' && !archivoProtocoloCorregido.name.toLowerCase().endsWith('.pdf')) {
      setErrorProtocoloCorregido('El documento debe estar en formato PDF.')
      return
    }

    if (archivoProtocoloCorregido.size > 10 * 1024 * 1024) {
      setErrorProtocoloCorregido('El PDF no puede superar los 10 MB.')
      return
    }

    const idUsuarioEnvio = perfil?.id_usuario || usuario?.id
    if (!idUsuarioEnvio) {
      setErrorProtocoloCorregido('No se pudo identificar al estudiante que envía el documento. Cierra sesión e inicia nuevamente.')
      return
    }

    const datos = new FormData()
    datos.append('archivo', archivoProtocoloCorregido)
    datos.append('enviado_por', String(idUsuarioEnvio))

    try {
      setEnviandoProtocoloCorregido(true)
      const response = await apiFetch(
        `${API_URL}/api/protocolos/monografia/${monografia.id_monografia}/representar`,
        { method: 'POST', body: datos }
      )
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.message || 'No se pudo volver a enviar el protocolo corregido.')
      }

      setMensajeProtocoloCorregido(data.message || 'El protocolo corregido fue enviado para revisión.')
      setArchivoProtocoloCorregido(null)
      const selector = document.getElementById('archivo-protocolo-corregido') as HTMLInputElement | null
      if (selector) selector.value = ''

      const listaResponse = await apiFetch(`${API_URL}/api/monografias`)
      const listaData = await listaResponse.json().catch(() => ({}))
      const lista: Monografia[] = Array.isArray(listaData.monografias) ? listaData.monografias : []
      const encontrada = lista.find((item) =>
        item.estudiante_correo === usuario?.correo ||
        item.integrantes?.some((integrante) => integrante.correo === usuario?.correo)
      )
      if (encontrada) {
        setMonografia({ ...encontrada, integrantes: Array.isArray(encontrada.integrantes) ? encontrada.integrantes : [] })
      }
    } catch (error) {
      setErrorProtocoloCorregido(error instanceof Error ? error.message : 'Ocurrió un error al enviar el protocolo corregido.')
    } finally {
      setEnviandoProtocoloCorregido(false)
    }
  }

  /*
  |--------------------------------------------------------------------------
  | CARGAR MONOGRAFÍA
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!usuario?.correo) {
      return
    }

    const cargarMonografia = async () => {
      try {
        setLoadingMonografia(true)

        const response =
          await apiFetch(
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

        const lista: Monografia[] =
          data.monografias || []

        const encontrada =
          lista.find(
            (item) =>
              item.estudiante_correo ===
                usuario.correo ||
              item.integrantes?.some(
                (integrante) =>
                  integrante.correo ===
                  usuario.correo
              )
          )

        if (!encontrada) {
          setMonografia(null)
          setAvances([])
          return
        }

        const monografiaConIntegrantes: Monografia = {
          ...encontrada,
          integrantes: Array.isArray(
            encontrada.integrantes
          )
            ? encontrada.integrantes
            : [],
        }

        setMonografia(monografiaConIntegrantes)

        await cargarAvances(
          encontrada.id_monografia
        )
      } catch (error) {
        console.error(
          'Error al cargar monografía:',
          error
        )

        setMonografia(null)
        setAvances([])
      } finally {
        setLoadingMonografia(false)
      }
    }

    cargarMonografia()
  }, [usuario?.correo])

  /*
  |--------------------------------------------------------------------------
  | CARGAR AVANCES
  |--------------------------------------------------------------------------
  */

  const cargarAvances = async (
    idMonografia: number
  ) => {
    try {
      const response =
        await apiFetch(
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

      const listaAvances =
        data.avances || []

      const avancesCompletos: Avance[] =
        await Promise.all(
          listaAvances.map(
            async (avance: any) => {
              let documentos: Documento[] =
                []

              try {
                const responseDocumentos =
                  await apiFetch(
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
                id: avance.id_avance,
                tipo:
                  avance.etapa_nombre ||
                  'Avance',
                descripcion:
                  avance.descripcion ||
                  '',
                estado:
                  avance.estado ||
                  'PENDIENTE',
                fecha:
                  avance.fecha_entrega,
                documentos,
                comentario_tutor:
                  avance.comentario_tutor ||
                  null,
                fecha_revision:
                  avance.fecha_revision ||
                  null,
              }
            }
          )
        )

      setAvances(
        avancesCompletos
      )
    } catch (error) {
      console.error(
        'Error al cargar avances:',
        error
      )

      setAvances([])
    }
  }

  /*
  |--------------------------------------------------------------------------
  | CARGAR NOTIFICACIONES
  |--------------------------------------------------------------------------
  */

  const cargarNotificaciones = async (
    idUsuario: number
  ) => {
    try {
      const response =
        await apiFetch(
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
  | SUBIR FOTO
  |--------------------------------------------------------------------------
  */

  const handleFotoSeleccionada = (
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

      event.target.value = ''
      return
    }

    if (
      archivo.size >
      5 * 1024 * 1024
    ) {
      alert(
        'La imagen no puede superar los 5 MB.'
      )

      event.target.value = ''
      return
    }

    setFotoSeleccionada(
      archivo
    )
  }

  const subirFotoPerfil = async () => {
    if (
      !fotoSeleccionada ||
      !perfil
    ) {
      return
    }

    try {
      setSubiendoFoto(true)

      const datos =
        new FormData()

      datos.append(
        'foto',
        fotoSeleccionada
      )

      const response =
        await apiFetch(
          `${API_URL}/api/usuarios/${perfil.id_usuario}/foto`,
          {
            method: 'PUT',
            body: datos,
          }
        )

      const data =
        await response.json()

      if (!response.ok) {
        throw new Error(
          data.message ||
            'No se pudo actualizar la foto'
        )
      }

      const nuevaFoto =
        data.foto_perfil

      setPerfil({
        ...perfil,
        foto_perfil:
          nuevaFoto,
      })

      const usuarioActualizado: Usuario = {
        ...usuario!,
        foto_perfil:
          nuevaFoto,
      }

      setUsuario(
        usuarioActualizado
      )

      localStorage.setItem(
        'sigmo_user',
        JSON.stringify(
          usuarioActualizado
        )
      )

      setFotoSeleccionada(null)

      alert(
        'Foto de perfil actualizada correctamente.'
      )
    } catch (error) {
      console.error(
        'Error al subir foto:',
        error
      )

      alert(
        error instanceof Error
          ? error.message
          : 'No se pudo actualizar la foto.'
      )
    } finally {
      setSubiendoFoto(false)
    }
  }

  /*
  |--------------------------------------------------------------------------
  | REGISTRAR AVANCE
  |--------------------------------------------------------------------------
  */

  const submitAvance = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    if (!monografia) {
      alert(
        'No se encontró una monografía asociada.'
      )
      return
    }

    if (!protocoloAceptado) {
      alert('No puedes registrar avances hasta que el coordinador acepte tu protocolo.')
      return
    }

    if (!formData.id_etapa) {
      alert(
        'Selecciona una etapa.'
      )
      return
    }

    if (
      !formData.descripcion.trim()
    ) {
      alert(
        'Ingresa una descripción.'
      )
      return
    }

    if (!formData.archivo) {
      alert(
        'Debes seleccionar un archivo PDF.'
      )
      return
    }

    if (!formData.archivo.name.toLowerCase().endsWith('.pdf')) {
      alert(
        'Solo se permiten archivos PDF.'
      )
      return
    }

    if (
      formData.archivo.size >
      10 * 1024 * 1024
    ) {
      alert(
        'El archivo PDF no puede superar los 10 MB.'
      )
      return
    }

    const etapaSeleccionada =
      etapasCargables.find(
        (etapa) =>
          etapa.id ===
          Number(
            formData.id_etapa
          )
      )

    if (!etapaSeleccionada) {
      alert(
        'La etapa seleccionada no es válida.'
      )
      return
    }

    try {
      setSubmitting(true)

      const datosAvance = new FormData()
      datosAvance.append('id_monografia', String(monografia.id_monografia))
      datosAvance.append('id_etapa', String(etapaSeleccionada.id))
      datosAvance.append('descripcion', formData.descripcion.trim())
      datosAvance.append('archivo', formData.archivo)

      const response = await apiFetch(`${API_URL}/api/avances`, {
        method: 'POST',
        body: datosAvance,
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'No se pudo registrar el avance y su documento.')
      }

      /*
      |--------------------------------------------------------------------------
      | LIMPIAR FORMULARIO
      |--------------------------------------------------------------------------
      */

      setFormData({
        id_etapa: '',
        descripcion: '',
        archivo: null,
      })

      setShowModal(false)

      await cargarAvances(
        monografia.id_monografia
      )

      alert(data.message || 'Avance y documento registrados correctamente.')
    } catch (error) {
      console.error(
        'Error al registrar avance:',
        error
      )

      alert(
        error instanceof Error
          ? error.message
          : 'No se pudo registrar el avance.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  /*
  |--------------------------------------------------------------------------
  | MARCAR NOTIFICACIÓN COMO LEÍDA
  |--------------------------------------------------------------------------
  */

  const marcarNotificacionLeida =
    async (
      idNotificacion: number
    ) => {
      try {
        const response =
          await apiFetch(
            `${API_URL}/api/notificaciones/${idNotificacion}/leida`,
            {
              method: 'PUT',
            }
          )

        if (!response.ok) {
          return
        }

        setNotificaciones(
          (actuales) =>
            actuales.map(
              (notificacion) =>
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

  /*
  |--------------------------------------------------------------------------
  | MARCAR TODAS COMO LEÍDAS
  |--------------------------------------------------------------------------
  */

  const marcarTodasLeidas =
    async () => {
      if (!usuario?.id) {
        return
      }

      try {
        const response =
          await apiFetch(
            `${API_URL}/api/notificaciones/usuario/${usuario.id}/marcar-todas-leidas`,
            {
              method: 'PUT',
            }
          )

        if (!response.ok) {
          return
        }

        setNotificaciones(
          (actuales) =>
            actuales.map(
              (notificacion) => ({
                ...notificacion,
                leida: true,
              })
            )
        )
      } catch (error) {
        console.error(
          'Error al marcar todas:',
          error
        )
      }
    }

  /*
  |--------------------------------------------------------------------------
  | LOGOUT
  |--------------------------------------------------------------------------
  */

  const handleLogout = () => {
    onLogout()
  }

  /*
  |--------------------------------------------------------------------------
  | UTILIDADES
  |--------------------------------------------------------------------------
  */

  const formatearFecha = (
    fecha: string
  ) => {
    if (!fecha) {
      return 'Sin fecha'
    }

    const fechaConvertida =
      new Date(fecha)

    if (
      Number.isNaN(
        fechaConvertida.getTime()
      )
    ) {
      return 'Sin fecha'
    }

    return fechaConvertida.toLocaleDateString(
      'es-NI',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }
    )
  }

  const formatearTamano = (
    bytes:
      | number
      | string
      | null
  ) => {
    if (
      bytes === null ||
      bytes === undefined
    ) {
      return ''
    }

    const numero =
      Number(bytes)

    if (
      Number.isNaN(numero)
    ) {
      return ''
    }

    if (numero < 1024) {
      return `${numero} B`
    }

    if (
      numero <
      1024 * 1024
    ) {
      return `${(
        numero / 1024
      ).toFixed(1)} KB`
    }

    return `${(
      numero /
      (1024 * 1024)
    ).toFixed(1)} MB`
  }

  const obtenerIniciales =
    () => {
      const nombre =
        perfil?.nombre ||
        usuario?.nombre ||
        ''

      const apellido =
        perfil?.apellido ||
        usuario?.apellido ||
        ''

      return (
        `${nombre.charAt(
          0
        )}${apellido.charAt(0)}`
      ).toUpperCase()
    }

  const obtenerFotoPerfil =
    () => {
      if (
        perfil?.foto_perfil
      ) {
        return `${API_URL}${perfil.foto_perfil}`
      }

      return null
    }

  const notificacionesNoLeidas =
    notificaciones.filter(
      (item) =>
        !item.leida
    ).length

  /*
  |--------------------------------------------------------------------------
  | NAVEGACIÓN
  |--------------------------------------------------------------------------
  */

  const navItems: {
    id: Section
    label: string
    icon: typeof Home
  }[] = [
    {
      id: 'inicio',
      label: 'Inicio',
      icon: Home,
    },
    {
      id: 'monografia',
      label: 'Mi Monografía',
      icon: FileText,
    },
    {
      id: 'avances',
      label: 'Avances',
      icon: TrendingUp,
    },
    {
      id: 'calendario',
      label: 'Calendario de Defensa',
      icon: Calendar,
    },
    {
      id: 'perfil',
      label: 'Mi Perfil',
      icon: User,
    },
  ]

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="sigmo-dashboard sigmo-dashboard--student min-h-screen bg-slate-50">

      {/* ========================================================= */}
      {/* SIDEBAR */}
      {/* ========================================================= */}

      <aside
        className={`
          fixed
          inset-y-0
          left-0
          z-50
          w-64
          bg-blue-700
          text-white
          transition-transform
          duration-300
          lg:translate-x-0
          ${
            sidebarOpen
              ? 'translate-x-0'
              : '-translate-x-full'
          }
        `}
      >
        <div className="flex h-full flex-col">

          <div className="flex items-center justify-between border-b border-blue-600 px-6 py-5">
            <div>
              <h1 className="text-xl font-bold">
                SIGMO
              </h1>

              <p className="text-xs text-blue-200">
                Gestión Monográfica
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setSidebarOpen(false)
              }
              className="rounded-lg p-1 hover:bg-blue-600 lg:hidden"
            >
              <X size={22} />
            </button>
          </div>

          <div className="border-b border-blue-600 px-5 py-5">
            <div className="flex items-center gap-3">

              {obtenerFotoPerfil() ? (
                <img
                  src={
                    obtenerFotoPerfil()!
                  }
                  alt="Foto de perfil"
                  className="h-11 w-11 rounded-full border-2 border-white object-cover"
                />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white font-bold text-blue-700">
                  {obtenerIniciales()}
                </div>
              )}

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {perfil?.nombre ||
                    usuario?.nombre ||
                    'Estudiante'}{' '}
                  {perfil?.apellido ||
                    usuario?.apellido ||
                    ''}
                </p>

                <p className="truncate text-xs text-blue-200">
                  Estudiante
                </p>
              </div>

            </div>
          </div>

          <nav className="flex-1 px-3 py-5">

            {navItems.map(
              (item) => {
                const Icon =
                  item.icon

                const activo =
                  section === item.id

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSection(
                        item.id
                      )
                      setSidebarOpen(
                        false
                      )
                    }}
                    className={`
                      mb-2
                      flex
                      w-full
                      items-center
                      gap-3
                      rounded-lg
                      px-4
                      py-3
                      text-sm
                      font-medium
                      transition
                      ${
                        activo
                          ? 'bg-white text-blue-700'
                          : 'text-blue-100 hover:bg-blue-600'
                      }
                    `}
                  >
                    <Icon
                      size={19}
                    />

                    {item.label}
                  </button>
                )
              }
            )}

          </nav>

          <div className="border-t border-blue-600 p-3">
            <button
              type="button"
              onClick={
                handleLogout
              }
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm text-blue-100 hover:bg-blue-600"
            >
              <LogOut
                size={19}
              />

              Cerrar sesión
            </button>
          </div>

        </div>
      </aside>

      {/* ========================================================= */}
      {/* OVERLAY MOBILE */}
      {/* ========================================================= */}

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() =>
            setSidebarOpen(false)
          }
        />
      )}

      {/* ========================================================= */}
      {/* CONTENIDO */}
      {/* ========================================================= */}

      <div className="lg:pl-64">

        {/* ======================================================= */}
        {/* HEADER */}
        {/* ======================================================= */}

        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-4 shadow-sm sm:px-6 lg:px-8">

          <div className="flex items-center gap-3">

            <button
              type="button"
              onClick={() =>
                setSidebarOpen(true)
              }
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            >
              <Menu size={22} />
            </button>

            <h2 className="text-lg font-semibold text-slate-800">
              {section ===
                'inicio' &&
                'Inicio'}

              {section ===
                'monografia' &&
                'Mi Monografía'}

              {section ===
                'avances' &&
                'Avances'}

              {section ===
                'calendario' &&
                'Calendario de Defensa'}

              {section ===
                'perfil' &&
                'Mi Perfil'}
            </h2>

          </div>

          <div className="relative flex items-center gap-3">

            {/* =================================================== */}
            {/* NOTIFICACIONES */}
            {/* =================================================== */}

            <button
              type="button"
              onClick={() =>
                setNotificacionesAbiertas(
                  !notificacionesAbiertas
                )
              }
              className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100"
            >
              <Bell
                size={21}
              />

              {notificacionesNoLeidas >
                0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {notificacionesNoLeidas >
                  9
                    ? '9+'
                    : notificacionesNoLeidas}
                </span>
              )}
            </button>

            {notificacionesAbiertas && (
              <div className="absolute right-0 top-12 z-[80] w-[350px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border bg-white shadow-xl">

                <div className="flex items-center justify-between border-b px-4 py-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">
                      Notificaciones
                    </h3>

                    <p className="text-xs text-slate-400">
                      {notificacionesNoLeidas}{' '}
                      sin leer
                    </p>
                  </div>

                  {notificacionesNoLeidas >
                    0 && (
                    <button
                      type="button"
                      onClick={
                        marcarTodasLeidas
                      }
                      className="text-xs font-medium text-blue-600 hover:text-blue-700"
                    >
                      Marcar todas
                    </button>
                  )}
                </div>

                <div className="max-h-[400px] overflow-y-auto">

                  {notificaciones.length ===
                  0 ? (
                    <div className="p-8 text-center">
                      <Bell
                        className="mx-auto text-slate-300"
                        size={36}
                      />

                      <p className="mt-3 text-sm text-slate-500">
                        No tienes
                        notificaciones.
                      </p>
                    </div>
                  ) : (
                    notificaciones.map(
                      (
                        notificacion
                      ) => (
                        <button
                          key={
                            notificacion.id_notificacion
                          }
                          type="button"
                          onClick={() =>
                            !notificacion.leida &&
                            marcarNotificacionLeida(
                              notificacion.id_notificacion
                            )
                          }
                          className={`
                            flex
                            w-full
                            gap-3
                            border-b
                            px-4
                            py-4
                            text-left
                            transition
                            hover:bg-slate-50
                            ${
                              !notificacion.leida
                                ? 'bg-blue-50/60'
                                : 'bg-white'
                            }
                          `}
                        >
                          <div
                            className={`
                              mt-0.5
                              flex
                              h-9
                              w-9
                              shrink-0
                              items-center
                              justify-center
                              rounded-full
                              ${
                                notificacion.tipo ===
                                'AVANCE'
                                  ? 'bg-blue-100 text-blue-600'
                                  : 'bg-slate-100 text-slate-600'
                              }
                            `}
                          >
                            {notificacion.tipo ===
                            'AVANCE' ? (
                              <TrendingUp
                                size={17}
                              />
                            ) : (
                              <Bell
                                size={17}
                              />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">

                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-semibold text-slate-800">
                                {
                                  notificacion.titulo
                                }
                              </p>

                              {!notificacion.leida && (
                                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                              )}
                            </div>

                            <p className="mt-1 text-xs leading-5 text-slate-600">
                              {
                                notificacion.mensaje
                              }
                            </p>

                            <p className="mt-2 text-[11px] text-slate-400">
                              {formatearFecha(
                                notificacion.fecha_creacion
                              )}
                            </p>

                          </div>
                        </button>
                      )
                    )
                  )}

                </div>
              </div>
            )}

            {/* =================================================== */}
            {/* PERFIL HEADER */}
            {/* =================================================== */}

            <button
              type="button"
              onClick={() =>
                setSection(
                  'perfil'
                )
              }
              className="flex items-center gap-2"
            >
              {obtenerFotoPerfil() ? (
                <img
                  src={
                    obtenerFotoPerfil()!
                  }
                  alt="Perfil"
                  className="h-9 w-9 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                  {obtenerIniciales()}
                </div>
              )}
            </button>

          </div>
        </header>

        {/* ======================================================= */}
        {/* MAIN */}
        {/* ======================================================= */}

        <main className="p-4 sm:p-6 lg:p-8">

          {/* ==================================================== */}
          {/* INICIO */}
          {/* ==================================================== */}

          {section ===
            'inicio' && (
            <div className="space-y-6">

              <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white shadow-lg">

                <p className="text-sm text-blue-100">
                  Bienvenido
                </p>

                <h1 className="mt-1 text-2xl font-bold">
                  {perfil?.nombre ||
                    usuario?.nombre ||
                    'Estudiante'}{' '}
                  {perfil?.apellido ||
                    usuario?.apellido ||
                    ''}
                </h1>

                <p className="mt-2 max-w-2xl text-sm text-blue-100">
                  Desde aquí puedes
                  gestionar tu proyecto
                  monográfico, registrar
                  avances y consultar las
                  observaciones de tu tutor.
                </p>

              </div>

              {loadingMonografia ? (
                <div className="rounded-xl border bg-white p-8 text-center shadow-sm">
                  <p className="text-slate-500">
                    Cargando información de
                    la monografía...
                  </p>
                </div>
              ) : monografia ? (
                <>
                  <div className="grid gap-5 md:grid-cols-3">

                    <div className="rounded-xl border bg-white p-5 shadow-sm">
                      <div className="flex items-center gap-3">

                        <div className="rounded-lg bg-blue-100 p-3 text-blue-600">
                          <FileText
                            size={22}
                          />
                        </div>

                        <div>
                          <p className="text-sm text-slate-500">
                            Monografía
                          </p>

                          <p className="font-semibold text-slate-800">
                            Registrada
                          </p>
                        </div>

                      </div>
                    </div>

                    <div className="rounded-xl border bg-white p-5 shadow-sm">
                      <div className="flex items-center gap-3">

                        <div className="rounded-lg bg-green-100 p-3 text-green-600">
                          <TrendingUp
                            size={22}
                          />
                        </div>

                        <div>
                          <p className="text-sm text-slate-500">
                            Avances
                          </p>

                          <p className="font-semibold text-slate-800">
                            {
                              avances.length
                            }
                          </p>
                        </div>

                      </div>
                    </div>

                    <div className="rounded-xl border bg-white p-5 shadow-sm">
                      <div className="flex items-center gap-3">

                        <div className="rounded-lg bg-purple-100 p-3 text-purple-600">
                          <Calendar
                            size={22}
                          />
                        </div>

                        <div>
                          <p className="text-sm text-slate-500">
                            Defensa
                          </p>

                          <p className="font-semibold text-slate-800">
                            Pendiente
                          </p>
                        </div>

                      </div>
                    </div>

                  </div>

                  <div className="rounded-xl border bg-white p-6 shadow-sm">

                    <h2 className="text-lg font-semibold text-slate-800">
                      Mi proyecto
                    </h2>

                    <p className="mt-2 text-xl font-bold text-blue-700">
                      {
                        monografia.titulo
                      }
                    </p>

                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {
                        monografia.descripcion
                      }
                    </p>

                    <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                        Integrantes de la monografía
                      </p>

                      <div className="mt-3 space-y-2">
                        {monografia.integrantes.length > 0 ? (
                          monografia.integrantes.map(
                            (integrante) => (
                              <div
                                key={integrante.id_estudiante}
                                className="flex flex-col gap-1 rounded-lg bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                              >
                                <div>
                                  <p className="font-medium text-slate-800">
                                    {integrante.nombre}{' '}
                                    {integrante.apellido}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {integrante.correo}
                                  </p>
                                </div>

                                <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                                  Carnet: {integrante.carnet}
                                </span>
                              </div>
                            )
                          )
                        ) : (
                          <div className="rounded-lg bg-white px-4 py-3 text-sm text-slate-500">
                            {monografia.estudiante_nombre}{' '}
                            {monografia.estudiante_apellido}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2">

                      <div>
                        <p className="text-xs text-slate-400">
                          Carrera
                        </p>

                        <p className="font-medium text-slate-700">
                          {
                            monografia.carrera
                          }
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-400">
                          Ciclo académico
                        </p>

                        <p className="font-medium text-slate-700">
                          {
                            monografia.ciclo
                          }
                        </p>
                      </div>

                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-xl border bg-white p-8 text-center shadow-sm">

                  <AlertCircle
                    className="mx-auto text-amber-500"
                    size={40}
                  />

                  <h3 className="mt-3 font-semibold text-slate-800">
                    No se encontró una
                    monografía
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    Actualmente no hay una
                    monografía asociada a tu
                    usuario.
                  </p>

                </div>
              )}

            </div>
          )}

          {/* ==================================================== */}
          {/* MI MONOGRAFÍA */}
          {/* ==================================================== */}

          {section ===
            'monografia' && (
            loadingMonografia ? (
              <div className="rounded-xl border bg-white p-8 text-center shadow-sm">
                Cargando información...
              </div>
            ) : !monografia ? (
              <div className="space-y-6">
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
                  <div className="flex items-start gap-3">
                    <PlusCircle className="mt-1 text-blue-700" size={28} />
                    <div>
                      <h3 className="font-semibold text-blue-950">Registrar propuesta de monografía</h3>
                      <p className="mt-1 text-sm text-blue-800">Completa los datos académicos, agrega a tu equipo y adjunta el protocolo en formato PDF. El título se validará para evitar duplicados.</p>
                    </div>
                  </div>
                </div>

                {mensajePropuesta && <div role="status" className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">{mensajePropuesta}</div>}
                {errorPropuesta && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{errorPropuesta}</div>}

                <form onSubmit={enviarPropuesta} className="space-y-5 rounded-xl border bg-white p-6 shadow-sm">
                  <div className="grid gap-5 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <label htmlFor="propuesta-titulo" className="mb-2 block text-sm font-medium text-slate-700">Título de la propuesta *</label>
                      <input id="propuesta-titulo" required maxLength={250} value={propuestaForm.titulo} onChange={(e) => setPropuestaForm((actual) => ({ ...actual, titulo: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="Escribe el título de tu monografía" />
                    </div>
                    <div className="md:col-span-2">
                      <label htmlFor="propuesta-descripcion" className="mb-2 block text-sm font-medium text-slate-700">Descripción de la propuesta *</label>
                      <textarea id="propuesta-descripcion" required rows={5} value={propuestaForm.descripcion} onChange={(e) => setPropuestaForm((actual) => ({ ...actual, descripcion: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="Describe el problema, propósito y alcance de la propuesta" />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Carrera</label>
                      <input readOnly value={perfil?.carrera || 'Carrera no registrada'} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-slate-600" />
                    </div>
                    <div>
                      <label htmlFor="propuesta-ciclo" className="mb-2 block text-sm font-medium text-slate-700">Ciclo académico *</label>
                      <select id="propuesta-ciclo" required value={propuestaForm.id_ciclo} onChange={(e) => setPropuestaForm((actual) => ({ ...actual, id_ciclo: e.target.value }))} className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500">
                        <option value="">Selecciona un ciclo</option>
                        {ciclosPropuesta.map((ciclo) => <option key={ciclo.id_ciclo} value={ciclo.id_ciclo}>{ciclo.nombre}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-1 text-sm font-semibold text-slate-800">Integrantes del equipo</h4>
                    <p className="mb-3 text-xs text-slate-500">Tu usuario se registra como responsable principal. Busca a tus compañeros por carnet. Puedes agregar hasta dos integrantes adicionales.</p>

                    {propuestaForm.integrantes.length > 0 && (
                      <div className="mb-3 space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Integrantes seleccionados</p>
                        {propuestaForm.integrantes.map((idEstudiante) => {
                          const estudiante = estudiantesDisponibles.find((item) => item.id_estudiante === idEstudiante)
                          if (!estudiante) return null
                          return (
                            <div key={estudiante.id_estudiante} className="flex items-center justify-between gap-3 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-slate-800">{estudiante.nombre} {estudiante.apellido}</p>
                                <p className="text-xs text-slate-600">Carnet: {estudiante.carnet}</p>
                              </div>
                              <button type="button" onClick={() => setPropuestaForm((actual) => ({ ...actual, integrantes: actual.integrantes.filter((id) => id !== estudiante.id_estudiante) }))} className="shrink-0 rounded-md px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50">Quitar</button>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    <label htmlFor="buscar-integrante-carnet" className="mb-2 block text-sm font-medium text-slate-700">Buscar por carnet</label>
                    <input
                      id="buscar-integrante-carnet"
                      type="text"
                      value={busquedaCarnet}
                      onChange={(event) => setBusquedaCarnet(event.target.value)}
                      disabled={cargandoCatalogos || propuestaForm.integrantes.length >= 2}
                      placeholder="Escribe el carnet del estudiante"
                      autoComplete="off"
                      className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                    />

                    {cargandoCatalogos ? (
                      <p className="mt-2 text-sm text-slate-500">Cargando ciclos y estudiantes...</p>
                    ) : propuestaForm.integrantes.length >= 2 ? (
                      <p className="mt-2 text-sm text-amber-700">Ya agregaste el máximo de dos integrantes adicionales. Quita uno para agregar otro.</p>
                    ) : busquedaCarnet.trim().length === 0 ? (
                      <p className="mt-2 text-xs text-slate-500">Escribe al menos parte del carnet para buscar estudiantes.</p>
                    ) : (
                      <div className="mt-2 max-h-56 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-2">
                        {estudiantesDisponibles
                          .filter((estudiante) => estudiante.carnet.toLowerCase().includes(busquedaCarnet.trim().toLowerCase()))
                          .slice(0, 8)
                          .map((estudiante) => {
                            const seleccionado = propuestaForm.integrantes.includes(estudiante.id_estudiante)
                            return (
                              <div key={estudiante.id_estudiante} className="flex items-center justify-between gap-3 rounded-md p-3 hover:bg-slate-50">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium text-slate-800">{estudiante.nombre} {estudiante.apellido}</p>
                                  <p className="break-all text-xs text-slate-500">Carnet: {estudiante.carnet} · {estudiante.correo}</p>
                                </div>
                                <button
                                  type="button"
                                  disabled={seleccionado}
                                  onClick={() => {
                                    setPropuestaForm((actual) => ({ ...actual, integrantes: [...actual.integrantes, estudiante.id_estudiante] }))
                                    setBusquedaCarnet('')
                                  }}
                                  className="shrink-0 rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                                >
                                  {seleccionado ? 'Agregado' : 'Agregar'}
                                </button>
                              </div>
                            )
                          })}
                        {estudiantesDisponibles.filter((estudiante) => estudiante.carnet.toLowerCase().includes(busquedaCarnet.trim().toLowerCase())).length === 0 && (
                          <p className="p-3 text-sm text-slate-500">No se encontró ningún estudiante con ese carnet.</p>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="archivo-propuesta" className="mb-2 block text-sm font-medium text-slate-700">Protocolo en PDF * (máximo 10 MB)</label>
                    <input id="archivo-propuesta" type="file" accept="application/pdf,.pdf" required onChange={(e) => setPropuestaForm((actual) => ({ ...actual, archivo: e.target.files?.[0] || null }))} className="block w-full rounded-lg border border-slate-300 p-3 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:font-medium file:text-blue-700 hover:file:bg-blue-100" />
                    {propuestaForm.archivo && <p className="mt-2 text-xs text-slate-500">Archivo seleccionado: {propuestaForm.archivo.name}</p>}
                  </div>

                  <div className="flex justify-end border-t pt-4">
                    <button type="submit" disabled={enviandoPropuesta || cargandoCatalogos} className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60">
                      <Upload size={17} /> {enviandoPropuesta ? 'Enviando propuesta...' : 'Enviar propuesta'}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="space-y-6">

                <div className="rounded-xl border bg-white p-6 shadow-sm">

                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">

                    <div>
                      <p className="text-sm text-slate-500">
                        Título de la
                        monografía
                      </p>

                      <h1 className="mt-1 text-2xl font-bold text-slate-800">
                        {
                          monografia.titulo
                        }
                      </h1>
                    </div>

                    <span className="w-fit rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700">
                      {
                        monografia.estado
                      }
                    </span>

                  </div>

                  <div className="mt-6">

                    <p className="text-sm font-medium text-slate-500">
                      Descripción
                    </p>

                    <p className="mt-2 leading-7 text-slate-700">
                      {
                        monografia.descripcion
                      }
                    </p>

                  </div>

                </div>

                {String(monografia.estado_propuesta || monografia.estado || '').trim().toUpperCase() === 'RECHAZADO' || String(monografia.estado_propuesta || monografia.estado || '').trim().toUpperCase() === 'RECHAZADA' ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="mt-0.5 shrink-0 text-red-600" size={24} />
                      <div className="min-w-0 flex-1">
                        <h2 className="font-semibold text-red-900">Protocolo rechazado: debes enviar una versión corregida</h2>
                        <p className="mt-2 text-sm leading-6 text-red-800">
                          Corrige el documento según las observaciones del coordinador y adjunta una nueva versión en PDF. La propuesta volverá a quedar pendiente de revisión.
                        </p>
                        {monografia.comentario_propuesta && (
                          <div className="mt-3 rounded-lg border border-red-200 bg-white p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-red-700">Observaciones del coordinador</p>
                            <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">{monografia.comentario_propuesta}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {mensajeProtocoloCorregido && <div role="status" className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">{mensajeProtocoloCorregido}</div>}
                    {errorProtocoloCorregido && <div role="alert" className="mt-4 rounded-lg border border-red-300 bg-white p-3 text-sm text-red-700">{errorProtocoloCorregido}</div>}

                    <form onSubmit={reenviarProtocolo} className="mt-5 space-y-4">
                      <div>
                        <label htmlFor="archivo-protocolo-corregido" className="mb-2 block text-sm font-medium text-slate-700">Nuevo protocolo corregido (PDF, máximo 10 MB)</label>
                        <input
                          id="archivo-protocolo-corregido"
                          type="file"
                          accept="application/pdf,.pdf"
                          required
                          disabled={enviandoProtocoloCorregido}
                          onChange={(event) => setArchivoProtocoloCorregido(event.target.files?.[0] || null)}
                          className="block w-full rounded-lg border border-red-200 bg-white p-3 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-red-50 file:px-4 file:py-2 file:font-medium file:text-red-700 hover:file:bg-red-100 disabled:opacity-60"
                        />
                        {archivoProtocoloCorregido && <p className="mt-2 text-xs text-slate-600">Seleccionado: {archivoProtocoloCorregido.name}</p>}
                      </div>
                      <div className="flex justify-end">
                        <button type="submit" disabled={enviandoProtocoloCorregido || !archivoProtocoloCorregido} className="inline-flex items-center gap-2 rounded-lg bg-red-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60">
                          <Upload size={17} /> {enviandoProtocoloCorregido ? 'Enviando protocolo corregido...' : 'Volver a enviar protocolo'}
                        </button>
                      </div>
                    </form>
                  </div>
                ) : null}

                <div className="rounded-xl border bg-white p-6 shadow-sm">

                  <h2 className="text-lg font-semibold text-slate-800">
                    Información académica
                  </h2>

                  <div className="mt-5 grid gap-5 sm:grid-cols-2">

                    <div className="sm:col-span-2">
                      <p className="text-xs text-slate-400">
                        Integrantes
                      </p>

                      <div className="mt-2 space-y-2">
                        {monografia.integrantes.length > 0 ? (
                          monografia.integrantes.map(
                            (integrante) => (
                              <div
                                key={integrante.id_estudiante}
                                className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3"
                              >
                                <p className="font-medium text-slate-700">
                                  {integrante.nombre}{' '}
                                  {integrante.apellido}
                                </p>
                                <div className="mt-1 flex flex-col gap-1 text-xs text-slate-500 sm:flex-row sm:gap-4">
                                  <span>
                                    Carnet: {integrante.carnet}
                                  </span>
                                  <span>
                                    {integrante.correo}
                                  </span>
                                </div>
                              </div>
                            )
                          )
                        ) : (
                          <p className="font-medium text-slate-700">
                            {monografia.estudiante_nombre}{' '}
                            {monografia.estudiante_apellido}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Carnet
                      </p>

                      <p className="mt-1 font-medium text-slate-700">
                        {
                          monografia.carnet
                        }
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Carrera
                      </p>

                      <p className="mt-1 font-medium text-slate-700">
                        {
                          monografia.carrera
                        }
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Ciclo
                      </p>

                      <p className="mt-1 font-medium text-slate-700">
                        {
                          monografia.ciclo
                        }
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Tutor
                      </p>

                      <p className="mt-1 font-medium text-slate-700">
                        {monografia.tutor_nombre
                          ? `${monografia.tutor_nombre} ${
                              monografia.tutor_apellido ||
                              ''
                            }`
                          : 'Sin tutor asignado'}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Fecha de registro
                      </p>

                      <p className="mt-1 font-medium text-slate-700">
                        {formatearFecha(
                          monografia.fecha_registro
                        )}
                      </p>
                    </div>

                  </div>

                </div>

              </div>
            )
          )}

          {/* ==================================================== */}
          {/* AVANCES */}
          {/* ==================================================== */}

          {section ===
            'avances' && (
            <div className="space-y-6">

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div>
                  <h1 className="text-2xl font-bold text-slate-800">
                    Mis avances
                  </h1>

                  <p className="mt-1 text-sm text-slate-500">
                    Registra y consulta los
                    avances de tu proyecto
                    monográfico.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      id_etapa: '',
                      descripcion: '',
                      archivo: null,
                    })

                    setShowModal(true)
                  }}
                  disabled={!monografia || !protocoloAceptado}
                  className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  <Upload
                    size={18}
                  />

                  Registrar avance
                </button>

              </div>

              {!monografia ? (
                <div className="rounded-xl border bg-white p-8 text-center shadow-sm">
                  <AlertCircle
                    className="mx-auto text-amber-500"
                    size={40}
                  />

                  <p className="mt-3 text-slate-600">
                    No tienes una
                    monografía asociada.
                  </p>
                </div>
              ) : !protocoloAceptado ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-8 text-center shadow-sm">
                  <Clock className="mx-auto text-amber-600" size={40} />
                  <h3 className="mt-3 font-semibold text-amber-900">Avances bloqueados</h3>
                  <p className="mt-2 text-sm text-amber-800">
                    La última versión de tu protocolo todavía no está aprobada. Podrás registrar avances cuando el coordinador la apruebe.
                  </p>
                  <p className="mt-2 text-sm font-medium text-amber-900">
                    Estado actual: {monografia.estado_propuesta || monografia.estado_protocolo || 'PENDIENTE DE REVISIÓN'}
                  </p>
                </div>
              ) : avances.length ===
                0 ? (
                <div className="rounded-xl border bg-white p-10 text-center shadow-sm">

                  <TrendingUp
                    className="mx-auto text-slate-300"
                    size={48}
                  />

                  <h3 className="mt-4 font-semibold text-slate-800">
                    No hay avances
                    registrados
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    Puedes registrar tu
                    primer avance utilizando
                    el botón superior.
                  </p>

                </div>
              ) : (
                <div className="space-y-4">

                  {avances.map(
                    (avance) => (
                      <div
                        key={
                          avance.id
                        }
                        className="rounded-xl border bg-white p-6 shadow-sm"
                      >

                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">

                          <div>

                            <div className="flex items-center gap-2">

                              <h3 className="text-lg font-semibold text-slate-800">
                                {
                                  avance.tipo
                                }
                              </h3>

                              {avance.estado ===
                              'APROBADO' ? (
                                <CheckCircle
                                  className="text-green-500"
                                  size={19}
                                />
                              ) : avance.estado ===
                                'RECHAZADO' ? (
                                <AlertCircle
                                  className="text-red-500"
                                  size={19}
                                />
                              ) : (
                                <Clock
                                  className="text-amber-500"
                                  size={19}
                                />
                              )}

                            </div>

                            <p className="mt-1 text-xs text-slate-400">
                              Entregado el{' '}
                              {formatearFecha(
                                avance.fecha
                              )}
                            </p>

                          </div>

                          <span
                            className={`
                              w-fit
                              rounded-full
                              px-3
                              py-1
                              text-xs
                              font-medium
                              ${
                                avance.estado ===
                                'APROBADO'
                                  ? 'bg-green-100 text-green-700'
                                  : avance.estado ===
                                    'RECHAZADO'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-amber-100 text-amber-700'
                              }
                            `}
                          >
                            {
                              avance.estado
                            }
                          </span>

                        </div>

                        <p className="mt-5 text-sm leading-6 text-slate-600">
                          {
                            avance.descripcion
                          }
                        </p>

                        {/* OBSERVACIÓN DEL TUTOR */}

                        {avance.comentario_tutor && (
                          <div
                            className={`
                              mt-5
                              rounded-lg
                              border
                              p-4
                              ${
                                avance.estado ===
                                'RECHAZADO'
                                  ? 'border-red-200 bg-red-50'
                                  : 'border-green-200 bg-green-50'
                              }
                            `}
                          >

                            <div className="flex gap-3">

                              {avance.estado ===
                              'RECHAZADO' ? (
                                <AlertCircle
                                  className="mt-0.5 shrink-0 text-red-600"
                                  size={20}
                                />
                              ) : (
                                <CheckCircle
                                  className="mt-0.5 shrink-0 text-green-600"
                                  size={20}
                                />
                              )}

                              <div>

                                <p
                                  className={`
                                    text-sm
                                    font-semibold
                                    ${
                                      avance.estado ===
                                      'RECHAZADO'
                                        ? 'text-red-800'
                                        : 'text-green-800'
                                    }
                                  `}
                                >
                                  Observación
                                  del tutor
                                </p>

                                <p
                                  className={`
                                    mt-1
                                    text-sm
                                    leading-6
                                    ${
                                      avance.estado ===
                                      'RECHAZADO'
                                        ? 'text-red-700'
                                        : 'text-green-700'
                                    }
                                  `}
                                >
                                  {
                                    avance.comentario_tutor
                                  }
                                </p>

                                {avance.fecha_revision && (
                                  <p className="mt-2 text-xs text-slate-400">
                                    Revisado el{' '}
                                    {formatearFecha(
                                      avance.fecha_revision
                                    )}
                                  </p>
                                )}

                              </div>

                            </div>

                          </div>
                        )}

                        {/* DOCUMENTOS */}

                        {avance.documentos.length >
                          0 && (
                          <div className="mt-5 space-y-2">

                            {avance.documentos.map(
                              (
                                documento
                              ) => (
                                <div
                                  key={
                                    documento.id_documento
                                  }
                                  className="flex flex-col gap-3 rounded-lg bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                                >

                                  <div className="flex min-w-0 items-center gap-3">

                                    <FileText
                                      className="shrink-0 text-red-500"
                                      size={22}
                                    />

                                    <div className="min-w-0">

                                      <p className="truncate text-sm font-medium text-slate-700">
                                        {
                                          documento.nombre_original ||
                                          documento.nombre_archivo
                                        }
                                      </p>

                                      <p className="text-xs text-slate-400">
                                        {
                                          formatearTamano(
                                            documento.tamano_bytes
                                          )
                                        }
                                      </p>

                                    </div>

                                  </div>

                                  <div className="flex gap-2">

                                    <button
                                      type="button"
                                      onClick={() => void downloadAuthenticatedFile(`${API_URL}/api/documentos/download/${documento.id_documento}`, true).catch((error) => alert(error instanceof Error ? error.message : 'No se pudo abrir el archivo.'))}
                                      className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100"
                                    >
                                      <Eye
                                        size={16}
                                      />

                                      Ver
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => void downloadAuthenticatedFile(`${API_URL}/api/documentos/download/${documento.id_documento}`).catch((error) => alert(error instanceof Error ? error.message : 'No se pudo descargar el archivo.'))}
                                      className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700"
                                    >
                                      <Download
                                        size={16}
                                      />

                                      Descargar
                                    </button>

                                  </div>

                                </div>
                              )
                            )}

                          </div>
                        )}

                      </div>
                    )
                  )}

                </div>
              )}

            </div>
          )}

          {/* ==================================================== */}
          {/* CALENDARIO */}
          {/* ==================================================== */}

          {section ===
            'calendario' && (
            <DefensaPanel
              role="ESTUDIANTE"
              monografias={monografia ? [{
                id_monografia: monografia.id_monografia,
                titulo: monografia.titulo,
              }] : []}
            />
          )}

          {/* ==================================================== */}
          {/* PERFIL */}
          {/* ==================================================== */}

          {section ===
            'perfil' && (
            loadingPerfil ? (
              <div className="flex min-h-[400px] items-center justify-center">

                <div className="rounded-xl border bg-white px-8 py-10 text-center shadow-sm">

                  <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

                  <p className="mt-4 text-sm text-slate-500">
                    Cargando información
                    del perfil...
                  </p>

                </div>

              </div>
            ) : (
              <div className="mx-auto max-w-4xl space-y-6">

                <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">

                  <div className="h-32 bg-gradient-to-r from-blue-600 to-blue-700" />

                  <div className="px-6 pb-6 sm:px-8">

                    <div className="-mt-16 flex flex-col items-center sm:flex-row sm:items-end sm:justify-between">

                      <div className="relative">

                        {obtenerFotoPerfil() ? (
                          <img
                            src={
                              obtenerFotoPerfil()!
                            }
                            alt="Foto de perfil"
                            className="h-32 w-32 rounded-full border-4 border-white object-cover shadow-md"
                          />
                        ) : (
                          <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-white bg-blue-100 text-3xl font-bold text-blue-700 shadow-md">
                            {
                              obtenerIniciales()
                            }
                          </div>
                        )}

                        <label className="absolute bottom-1 right-1 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-blue-600 text-white shadow-md hover:bg-blue-700">

                          <Camera
                            size={18}
                          />

                          <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png"
                            className="hidden"
                            onChange={
                              handleFotoSeleccionada
                            }
                          />

                        </label>

                      </div>

                      <div className="mt-4 text-center sm:text-right">

                        <h1 className="text-2xl font-bold text-slate-800">
                          {
                            perfil?.nombre ||
                            usuario?.nombre ||
                            ''
                          }{' '}
                          {
                            perfil?.apellido ||
                            usuario?.apellido ||
                            ''
                          }
                        </h1>

                        <p className="text-sm text-slate-500">
                          {
                            perfil?.correo ||
                            usuario?.correo ||
                            ''
                          }
                        </p>

                      </div>

                    </div>

                    {fotoSeleccionada && (
                      <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4">

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                          <div>
                            <p className="text-sm font-medium text-blue-800">
                              Nueva imagen
                              seleccionada
                            </p>

                            <p className="text-xs text-blue-600">
                              {
                                fotoSeleccionada.name
                              }
                            </p>
                          </div>

                          <div className="flex gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                setFotoSeleccionada(
                                  null
                                )
                              }
                              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                            >
                              Cancelar
                            </button>

                            <button
                              type="button"
                              onClick={
                                subirFotoPerfil
                              }
                              disabled={
                                subiendoFoto
                              }
                              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-slate-300"
                            >
                              {subiendoFoto
                                ? 'Subiendo...'
                                : 'Guardar foto'}
                            </button>

                          </div>

                        </div>

                      </div>
                    )}

                  </div>
                </div>

                <div className="rounded-2xl border bg-white p-6 shadow-sm sm:p-8">

                  <div className="flex items-center gap-3">

                    <div className="rounded-lg bg-blue-100 p-3 text-blue-600">
                      <User
                        size={22}
                      />
                    </div>

                    <div>

                      <h2 className="text-lg font-semibold text-slate-800">
                        Información
                        personal
                      </h2>

                      <p className="text-sm text-slate-500">
                        Datos registrados en
                        SIGMO
                      </p>

                    </div>

                  </div>

                  <div className="mt-8 grid gap-6 md:grid-cols-2">

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Nombre
                      </p>

                      <p className="mt-1 font-medium text-slate-700">
                        {
                          perfil?.nombre ||
                          usuario?.nombre ||
                          'No registrado'
                        }
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Apellido
                      </p>

                      <p className="mt-1 font-medium text-slate-700">
                        {
                          perfil?.apellido ||
                          usuario?.apellido ||
                          'No registrado'
                        }
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Correo electrónico
                      </p>

                      <p className="mt-1 break-all font-medium text-slate-700">
                        {
                          perfil?.correo ||
                          usuario?.correo ||
                          'No registrado'
                        }
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Rol
                      </p>

                      <p className="mt-1 font-medium text-slate-700">
                        {
                          perfil?.rol ||
                          usuario?.rol ||
                          'ESTUDIANTE'
                        }
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Carnet
                      </p>

                      <p className="mt-1 font-medium text-slate-700">
                        {
                          perfil?.carnet ||
                          monografia?.carnet ||
                          'No registrado'
                        }
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Carrera
                      </p>

                      <p className="mt-1 font-medium text-slate-700">
                        {
                          perfil?.carrera ||
                          monografia?.carrera ||
                          'No registrada'
                        }
                      </p>
                    </div>

                  </div>

                </div>

                <div className="rounded-2xl bg-blue-50 p-5">

                  <div className="flex gap-3">

                    <Camera
                      className="mt-0.5 shrink-0 text-blue-600"
                      size={20}
                    />

                    <div>

                      <p className="font-medium text-blue-800">
                        Foto de perfil
                      </p>

                      <p className="mt-1 text-sm text-blue-700">
                        Puedes cambiar tu
                        foto utilizando el
                        botón de cámara.
                        Se permiten JPG,
                        JPEG o PNG de
                        hasta 5 MB.
                      </p>

                    </div>

                  </div>

                </div>

              </div>
            )
          )}

        </main>
      </div>

      {/* ========================================================= */}
      {/* MODAL REGISTRAR AVANCE */}
      {/* ========================================================= */}
      {/*
        IMPORTANTE:
        Este modal está directamente dentro del return principal.
        NO está declarado como componente dentro de
        StudentDashboard.

        Esto evita que React lo desmonte cada vez que cambia
        formData.descripcion.

        Por esta razón el textarea NO debe perder el foco
        mientras escribes.
      */}

      {showModal && monografia && protocoloAceptado && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">

          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl">

            <div className="flex items-center justify-between border-b px-6 py-5">

              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  Registrar avance
                </h2>

                <p className="text-xs text-slate-500">
                  Agrega la información y
                  el documento de tu avance.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (
                    !submitting
                  ) {
                    setShowModal(
                      false
                    )
                  }
                }}
                disabled={submitting}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 disabled:cursor-not-allowed"
              >
                <X
                  size={20}
                />
              </button>

            </div>

            <form
              onSubmit={
                submitAvance
              }
              className="space-y-5 p-6"
            >

              {/* ETAPA */}

              <div>

                <label
                  htmlFor="etapa-avance"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Etapa
                </label>

                <select
                  id="etapa-avance"
                  value={
                    formData.id_etapa
                  }
                  onChange={(
                    event
                  ) => {
                    setFormData(
                      (
                        actual
                      ) => ({
                        ...actual,
                        id_etapa:
                          event.target.value,
                      })
                    )
                  }}
                  disabled={
                    submitting || loadingEtapas || etapasCargables.length === 0
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                >

                  <option value="">
                    Seleccionar etapa
                  </option>

                  {etapasCargables.map(
                    (etapa) => (
                      <option
                        key={
                          etapa.id
                        }
                        value={String(
                          etapa.id
                        )}
                      >
                        {
                          etapa.nombre
                        }
                      </option>
                    )
                  )}

                </select>

                {loadingEtapas && <p role="status" className="mt-2 text-xs text-slate-500">Cargando etapas…</p>}
                {errorEtapas && <p role="alert" className="mt-2 text-xs text-red-600">{errorEtapas}</p>}

                {formData.id_etapa && (
                  <p className="mt-2 text-xs text-blue-600">
                    Etapa seleccionada:{' '}
                    <strong>
                      {
                        etapasCargables.find(
                          (etapa) =>
                            etapa.id ===
                            Number(
                              formData.id_etapa
                            )
                        )?.nombre
                      }
                    </strong>{' '}
                    — ID:{' '}
                    <strong>
                      {
                        formData.id_etapa
                      }
                    </strong>
                  </p>
                )}

              </div>

              {/* DESCRIPCIÓN */}

              <div>

                <label
                  htmlFor="descripcion-avance"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Descripción
                </label>

                <textarea
                  id="descripcion-avance"
                  name="descripcion"
                  value={
                    formData.descripcion
                  }
                  onChange={(
                    event
                  ) => {
                    const valor =
                      event.target.value

                    setFormData(
                      (
                        actual
                      ) => ({
                        ...actual,
                        descripcion:
                          valor,
                      })
                    )
                  }}
                  rows={5}
                  maxLength={2000}
                  placeholder="Describe el avance realizado..."
                  disabled={
                    submitting
                  }
                  className="block w-full resize-y rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                />

                <div className="mt-1 flex justify-end">

                  <span className="text-xs text-slate-400">
                    {
                      formData.descripcion
                        .length
                    }{' '}
                    / 2000
                  </span>

                </div>

              </div>

              {/* ARCHIVO */}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Documento PDF
                </label>

                <label
                  htmlFor="archivo-avance"
                  className={`
                    flex
                    cursor-pointer
                    items-center
                    justify-center
                    gap-2
                    rounded-lg
                    border-2
                    border-dashed
                    px-4
                    py-5
                    text-sm
                    transition
                    ${
                      formData.archivo
                        ? 'border-blue-400 bg-blue-50 text-blue-600'
                        : 'border-slate-300 text-slate-500 hover:border-blue-400 hover:bg-blue-50'
                    }
                    ${
                      submitting
                        ? 'cursor-not-allowed opacity-60'
                        : ''
                    }
                  `}
                >

                  <Upload
                    size={19}
                  />

                  <span>
                    {formData.archivo
                      ? 'Cambiar archivo'
                      : 'Seleccionar archivo PDF'}
                  </span>

                  <input
                    id="archivo-avance"
                    type="file"
                    accept="application/pdf,.pdf"
                    className="hidden"
                    disabled={
                      submitting
                    }
                    onChange={(
                      event
                    ) => {
                      const archivo =
                        event.target
                          .files?.[0] ||
                        null

                      if (
                        !archivo
                      ) {
                        return
                      }

                      if (!archivo.name.toLowerCase().endsWith('.pdf')) {
                        alert(
                          'Solo se permiten archivos PDF.'
                        )

                        event.target.value =
                          ''

                        return
                      }

                      if (
                        archivo.size >
                        10 *
                          1024 *
                          1024
                      ) {
                        alert(
                          'El archivo no puede superar los 10 MB.'
                        )

                        event.target.value =
                          ''

                        return
                      }

                      setFormData(
                        (
                          actual
                        ) => ({
                          ...actual,
                          archivo,
                        })
                      )
                    }}
                  />

                </label>

                {formData.archivo ? (
                  <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-50 p-3">

                    <div className="flex min-w-0 items-center gap-2">

                      <FileText
                        className="shrink-0 text-red-500"
                        size={20}
                      />

                      <div className="min-w-0">

                        <p className="truncate text-sm font-medium text-slate-700">
                          {
                            formData.archivo.name
                          }
                        </p>

                        <p className="text-xs text-slate-400">
                          {
                            formatearTamano(
                              formData.archivo.size
                            )
                          }
                        </p>

                      </div>

                    </div>

                    <button
                      type="button"
                      disabled={
                        submitting
                      }
                      onClick={() => {
                        setFormData(
                          (
                            actual
                          ) => ({
                            ...actual,
                            archivo:
                              null,
                          })
                        )
                      }}
                      className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-red-500"
                    >
                      <X
                        size={17}
                      />
                    </button>

                  </div>
                ) : (
                  <p className="mt-2 text-xs text-slate-400">
                    PDF máximo de 10 MB.
                  </p>
                )}

              </div>

              {/* BOTONES */}

              <div className="flex justify-end gap-3 border-t pt-5">

                <button
                  type="button"
                  disabled={
                    submitting
                  }
                  onClick={() =>
                    setShowModal(
                      false
                    )
                  }
                  className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={
                    submitting
                  }
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >

                  {submitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Check
                        size={17}
                      />
                      Registrar avance
                    </>
                  )}

                </button>

              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  )
}
