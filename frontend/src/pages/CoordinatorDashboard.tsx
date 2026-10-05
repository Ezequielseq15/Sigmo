import {

  useEffect,

  useMemo,

  useState,

} from 'react'



import {

  Home,

  FileText,

  Users,

  BarChart2,

  User,

  LogOut,

  Menu,

  Bell,

  Search,

  X,

  ChevronRight,

  Check,

  Loader2,

  RefreshCw,

} from 'lucide-react'



import {

  BarChart,

  Bar,

  XAxis,

  YAxis,

  CartesianGrid,

  Tooltip,

  ResponsiveContainer,

  PieChart,

  Pie,

  Cell,

  Legend,

} from 'recharts'



import StatusBadge from '../components/StatusBadge'

import Modal from '../components/Modal'



/* =========================================================

   CONFIGURACIÓN

\========================================================= */



const API_URL =

  import.meta.env.VITE_API_URL ||

  'http://localhost:3000'



/* =========================================================

   PROPS

\========================================================= */



interface Props {

  onLogout: () => void

}



/* =========================================================

   TIPOS

\========================================================= */



type Section =

  | 'inicio'

  | 'gestion'

  | 'asignar'

  | 'reportes'

  | 'perfil'



interface IntegranteAPI {
  id_estudiante: number
  id_usuario: number
  carnet: string
  nombre: string
  apellido: string
  correo: string
}

interface MonografiaAPI {

  id_monografia: number

  titulo: string

  descripcion: string | null

  estado: string

  fecha_registro: string



  id_estudiante: number

  carnet: string



  estudiante_id_usuario: number

  estudiante_nombre: string

  estudiante_apellido: string

  estudiante_correo: string



  id_tutor: number | null

  tutor_id_usuario: number | null

  tutor_nombre: string | null

  tutor_apellido: string | null

  tutor_correo: string | null



  carrera: string

  ciclo: string

  integrantes: IntegranteAPI[]

}



interface TutorAPI {

  id_tutor: number

  id_usuario: number

  nombre: string

  apellido: string

  correo: string

  activo: boolean

}



interface AvanceAPI {

  id_avance: number

  id_monografia: number

  id_etapa: number

  descripcion: string | null

  fecha_entrega: string

  estado: string

  comentario_tutor: string | null

  fecha_revision: string | null

}



interface Monografia {

  id: number

  estudiante: string

  carnet: string

  correoEstudiante: string

  titulo: string

  descripcion: string

  carrera: string

  tutor: string

  tutorCorreo: string

  idTutor: number | null

  estado: string

  ciclo: string

  fechaRegistro: string
  integrantes: IntegranteAPI[]

}



interface Tutor {

  id: number

  nombre: string

  correo: string

}



/* =========================================================

   NAVEGACIÓN

\========================================================= */



const navItems = [

  {

    id: 'inicio' as Section,

    label: 'Inicio',

    icon: Home,

  },

  {

    id: 'gestion' as Section,

    label: 'Gestión de Monografías',

    icon: FileText,

  },

  {

    id: 'asignar' as Section,

    label: 'Asignar Tutor / Jurado',

    icon: Users,

  },

  {

    id: 'reportes' as Section,

    label: 'Reportes',

    icon: BarChart2,

  },

  {

    id: 'perfil' as Section,

    label: 'Perfil',

    icon: User,

  },

]



/* =========================================================

   UTILIDADES

\========================================================= */



const normalizarEstado = (

  estado: string

): string => {

  const estadoNormalizado = String(estado)

    .trim()

    .toUpperCase()



  switch (estadoNormalizado) {

    case 'APROBADO':

      return 'Aprobado'



    case 'RECHAZADO':

      return 'Rechazado'



    case 'PENDIENTE':

      return 'Pendiente'



    case 'ENVIADO':

      return 'Enviado'



    case 'EN_REVISION':

    case 'EN REVISIÓN':

      return 'En revisión'



    case 'EN_PROCESO':

    case 'EN PROCESO':

      return 'En proceso'



    default:

      return estado || 'Sin estado'

  }

}



const obtenerNombreEtapa = (

  idEtapa: number

): string => {

  switch (idEtapa) {

    case 1:

      return 'Propuesta'



    case 2:

      return 'Avance 1'



    case 3:

      return 'Avance 2'



    case 4:

      return 'Avance 3'



    case 5:

      return 'Documento final'



    case 6:

      return 'Defensa'



    default:

      return `Etapa ${idEtapa}`

  }

}



const formatearFecha = (

  fecha: string | null | undefined

): string => {

  if (!fecha) {

    return 'No disponible'

  }



  const date = new Date(fecha)



  if (Number.isNaN(date.getTime())) {

    return fecha

  }



  return date.toLocaleDateString(

    'es-NI',

    {

      day: '2-digit',

      month: '2-digit',

      year: 'numeric',

    }

  )

}



/* =========================================================

   COORDINATOR DASHBOARD

\========================================================= */



export default function CoordinatorDashboard({

  onLogout,

}: Props) {

  const [section, setSection] =

    useState<Section>('inicio')



  const [sidebarOpen, setSidebarOpen] =

    useState(false)



  const [detailId, setDetailId] =

    useState<number | null>(null)



  const [filterEstado, setFilterEstado] =

    useState('')



  const [filterCarrera, setFilterCarrera] =

    useState('')



  const [search, setSearch] =

    useState('')



  const [detailModal, setDetailModal] =

    useState(false)



  const [monografiasAPI, setMonografiasAPI] =

    useState<MonografiaAPI[]>([])



  const [tutoresAPI, setTutoresAPI] =

    useState<TutorAPI[]>([])



  const [avancesDetalle, setAvancesDetalle] =

    useState<AvanceAPI[]>([])



  const [cargandoDatos, setCargandoDatos] =

    useState(true)



  const [cargandoAvances, setCargandoAvances] =

    useState(false)



  const [errorDatos, setErrorDatos] =

    useState('')



  const [usuario, setUsuario] =

    useState<{

      nombre: string

      apellido: string

      correo: string

      rol: string

    } | null>(null)



  /* =======================================================

     CARGAR USUARIO

  ======================================================= */



  useEffect(() => {

    try {

      const usuarioGuardado =

        localStorage.getItem('sigmo_user') ||

        localStorage.getItem('usuario')



      if (!usuarioGuardado) {

        return

      }



      const usuarioParseado =

        JSON.parse(usuarioGuardado)



      setUsuario({

        nombre:

          usuarioParseado.nombre || '',

        apellido:

          usuarioParseado.apellido || '',

        correo:

          usuarioParseado.correo || '',

        rol:

          usuarioParseado.rol || 'COORDINADOR',

      })

    } catch (error) {

      console.error(

        'Error al cargar usuario:',

        error

      )

    }

  }, [])



  /* =======================================================

     CARGAR DATOS DEL COORDINADOR

  ======================================================= */



  const cargarDatosCoordinador =

    async () => {

      try {

        setCargandoDatos(true)

        setErrorDatos('')



        const [

          monografiasResponse,

          tutoresResponse,

        ] = await Promise.all([

          fetch(

            `${API_URL}/api/coordinador/monografias`

          ),

          fetch(

            `${API_URL}/api/coordinador/tutores`

          ),

        ])



        if (!monografiasResponse.ok) {

          throw new Error(

            'No se pudieron obtener las monografías'

          )

        }



        if (!tutoresResponse.ok) {

          throw new Error(

            'No se pudieron obtener los tutores'

          )

        }



        const monografiasData =

          await monografiasResponse.json()



        const tutoresData =

          await tutoresResponse.json()



        if (!monografiasData.success) {

          throw new Error(

            monografiasData.message ||

              'Error al obtener monografías'

          )

        }



        if (!tutoresData.success) {

          throw new Error(

            tutoresData.message ||

              'Error al obtener tutores'

          )

        }



        setMonografiasAPI(

          monografiasData.monografias || []

        )



        setTutoresAPI(

          tutoresData.tutores || []

        )

      } catch (error) {

        console.error(

          'Error cargando datos del coordinador:',

          error

        )



        setErrorDatos(

          error instanceof Error

            ? error.message

            : 'No se pudieron cargar los datos'

        )

      } finally {

        setCargandoDatos(false)

      }

    }



  useEffect(() => {

    cargarDatosCoordinador()

  }, [])



  /* =======================================================

     CONVERTIR MONOGRAFÍAS

  ======================================================= */



  const monografias: Monografia[] =

    useMemo(() => {

      return monografiasAPI.map(m => ({

        id: m.id_monografia,



        estudiante:

          `${m.estudiante_nombre} ${m.estudiante_apellido}`,



        carnet: m.carnet,



        correoEstudiante:

          m.estudiante_correo,



        titulo: m.titulo,



        descripcion:

          m.descripcion || 'Sin descripción',



        carrera: m.carrera,



        tutor: m.tutor_nombre

          ? `${m.tutor_nombre} ${m.tutor_apellido || ''}`.trim()

          : 'Sin tutor asignado',



        tutorCorreo:

          m.tutor_correo || '',



        idTutor:

          m.id_tutor,



        estado:

          normalizarEstado(m.estado),



        ciclo: m.ciclo,



        fechaRegistro:

          m.fecha_registro,

        integrantes:

          Array.isArray(m.integrantes)
            ? m.integrantes
            : [],

      }))

    }, [monografiasAPI])



  /* =======================================================

     CONVERTIR TUTORES

  ======================================================= */



  const tutores: Tutor[] =

    useMemo(() => {

      return tutoresAPI.map(tutor => ({

        id: tutor.id_tutor,



        nombre:

          `${tutor.nombre} ${tutor.apellido}`.trim(),



        correo:

          tutor.correo,

      }))

    }, [tutoresAPI])



  /* =======================================================

     FILTRADO

  ======================================================= */



  const filtered = useMemo(() => {

    const texto =

      search.trim().toLowerCase()



    return monografias.filter(m => {

      const coincideEstado =

        !filterEstado ||

        m.estado === filterEstado



      const coincideCarrera =

        !filterCarrera ||

        m.carrera === filterCarrera



      const integrantesTexto =
        m.integrantes
          .map(integrante =>
            `${integrante.nombre} ${integrante.apellido} ${integrante.carnet} ${integrante.correo}`
          )
          .join(' ')
          .toLowerCase()

      const coincideBusqueda =

        !texto ||

        integrantesTexto.includes(texto) ||

        m.estudiante

          .toLowerCase()

          .includes(texto) ||

        m.titulo

          .toLowerCase()

          .includes(texto) ||

        m.carnet

          .toLowerCase()

          .includes(texto)



      return (

        coincideEstado &&

        coincideCarrera &&

        coincideBusqueda

      )

    })

  }, [

    monografias,

    filterEstado,

    filterCarrera,

    search,

  ])



  /* =======================================================

     MONOGRAFÍA SELECCIONADA

  ======================================================= */



  const selected =

    monografias.find(

      m => m.id === detailId

    )



  /* =======================================================

     CARGAR DETALLE DE AVANCES

  ======================================================= */



  const abrirDetalle = async (

    idMonografia: number

  ) => {

    setDetailId(idMonografia)

    setDetailModal(true)

    setAvancesDetalle([])



    try {

      setCargandoAvances(true)



      const response = await fetch(

        `${API_URL}/api/avances/monografia/${idMonografia}`

      )



      if (!response.ok) {

        throw new Error(

          'No se pudieron obtener los avances'

        )

      }



      const data =

        await response.json()



      if (!data.success) {

        throw new Error(

          data.message ||

            'No se pudieron obtener los avances'

        )

      }



      setAvancesDetalle(

        data.avances || []

      )

    } catch (error) {

      console.error(

        'Error al cargar avances:',

        error

      )

    } finally {

      setCargandoAvances(false)

    }

  }



  /* =======================================================

     ASIGNAR TUTOR

  ======================================================= */



  const asignarTutor = async (

    idMonografia: number,

    idTutor: number

  ): Promise<boolean> => {

    try {

      const response = await fetch(

        `${API_URL}/api/coordinador/monografias/${idMonografia}/tutor`,

        {

          method: 'PUT',



          headers: {

            'Content-Type':

              'application/json',

          },



          body: JSON.stringify({

            id_tutor: idTutor,

          }),

        }

      )



      const data =

        await response.json()



      if (

        !response.ok ||

        !data.success

      ) {

        throw new Error(

          data.message ||

            'No se pudo asignar el tutor'

        )

      }



      await cargarDatosCoordinador()



      return true

    } catch (error) {

      console.error(

        'Error al asignar tutor:',

        error

      )



      alert(

        error instanceof Error

          ? error.message

          : 'No se pudo asignar el tutor'

      )



      return false

    }

  }



  /* =======================================================

     NAVEGACIÓN

  ======================================================= */



  const navigate = (

    nuevaSeccion: Section

  ) => {

    setSection(nuevaSeccion)

    setSidebarOpen(false)

    setDetailId(null)

  }



  /* =======================================================

     RENDER

  ======================================================= */



  return (

    <div className="h-full flex bg-slate-50">



      {/* =================================================

          SIDEBAR

      ================================================= */}



      <aside

        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-100 flex flex-col transition-transform duration-300 lg:static lg:translate-x-0 ${

          sidebarOpen

            ? 'translate-x-0'

            : '-translate-x-full'

        }`}

      >



        <div className="p-5 border-b border-slate-100">



          <div className="flex items-center gap-3">



            <div className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center">

              <span className="text-white font-bold text-sm font-mono">

                C

              </span>

            </div>



            <div>



              <div className="font-bold text-slate-800 text-sm">

                SIGMO

              </div>



              <div className="text-xs text-violet-600 font-mono">

                Coordinador

              </div>



            </div>



          </div>



        </div>



        <div className="p-4 border-b border-slate-100">



          <div className="bg-violet-50 rounded-xl p-3">



            <div className="text-xs text-slate-500 mb-0.5">

              Coordinador

            </div>



            <div className="font-semibold text-slate-800 text-sm">

              {usuario

                ? `${usuario.nombre} ${usuario.apellido}`.trim()

                : 'Coordinador SIGMO'}

            </div>



            <div className="text-xs text-violet-600 font-mono mt-1">

              Gestión académica

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

                    ? 'bg-violet-600 text-white font-medium'

                    : 'text-slate-600 hover:bg-slate-50'

                }`}

              >

                <Icon size={16} />

                {label}

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



      {/* =================================================

          FONDO MENÚ MÓVIL

      ================================================= */}



      {sidebarOpen && (

        <div

          className="fixed inset-0 z-30 bg-black/20 lg:hidden"

          onClick={() =>

            setSidebarOpen(false)

          }

        />

      )}



      {/* =================================================

          CONTENIDO

      ================================================= */}



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



            <h1 className="font-semibold text-slate-800">

              {

                navItems.find(

                  n => n.id === section

                )?.label

              }

            </h1>



          </div>



          <div className="flex items-center gap-2">



            <button className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500">

              <Bell size={18} />



              {monografias.length > 0 && (

                <span className="absolute top-1 right-1 w-2 h-2 bg-violet-500 rounded-full" />

              )}

            </button>



            <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center text-violet-700 text-sm font-semibold">

              {usuario?.nombre?.charAt(0).toUpperCase() ||

                'C'}

            </div>



          </div>



        </header>



        {/* MAIN */}



        <main className="flex-1 overflow-y-auto p-6">



          {/* ERROR */}



          {errorDatos && (

            <div className="mb-5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 flex items-center justify-between gap-4">



              <div className="text-sm">

                {errorDatos}

              </div>



              <button

                onClick={

                  cargarDatosCoordinador

                }

                className="text-xs font-semibold text-red-700 hover:text-red-900 flex items-center gap-1"

              >

                <RefreshCw size={13} />

                Reintentar

              </button>



            </div>

          )}



          {/* LOADING */}



          {cargandoDatos ? (

            <div className="min-h-[400px] flex items-center justify-center">



              <div className="flex flex-col items-center gap-3 text-slate-500">



                <Loader2

                  size={30}

                  className="animate-spin text-violet-600"

                />



                <span className="text-sm">

                  Cargando información...

                </span>



              </div>



            </div>

          ) : (

            <>

              {section === 'inicio' && (

                <InicioCoord

                  monografias={

                    monografias

                  }

                />

              )}



              {section === 'gestion' && (

                <GestionMonografias

                  monografias={filtered}

                  all={monografias}

                  search={search}

                  setSearch={setSearch}

                  filterEstado={

                    filterEstado

                  }

                  setFilterEstado={

                    setFilterEstado

                  }

                  filterCarrera={

                    filterCarrera

                  }

                  setFilterCarrera={

                    setFilterCarrera

                  }

                  onDetail={

                    abrirDetalle

                  }

                />

              )}



              {section === 'asignar' && (

                <AsignarTutorTribunal

                  tutores={tutores}

                  monografias={

                    monografias

                  }

                  onAsignarTutor={

                    asignarTutor

                  }

                />

              )}



              {section === 'reportes' && (

                <Reportes

                  monografias={

                    monografias

                  }

                />

              )}



              {section === 'perfil' && (

                <PerfilCoord

                  usuario={usuario}

                  totalMonografias={

                    monografias.length

                  }

                />

              )}

            </>

          )}



        </main>



      </div>



      {/* =================================================

          MODAL DETALLE

      ================================================= */}



      <Modal

        open={

          detailModal &&

          !!selected

        }

        title="Detalle de monografía"

        onClose={() =>

          setDetailModal(false)

        }

      >



        {selected && (

          <div className="space-y-5">



            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">



              <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center text-violet-700 font-bold">

                {selected.estudiante

                  .charAt(0)

                  .toUpperCase()}

              </div>



              <div>



                <div className="font-semibold text-slate-800">

                  {selected.estudiante}

                </div>



                <div className="text-xs text-slate-400 font-mono">

                  {selected.carnet}

                </div>



              </div>



            </div>



            <div className="bg-violet-50 rounded-xl p-4">

              <div className="text-xs font-mono text-violet-600 mb-3">
                INTEGRANTES
              </div>

              <div className="space-y-2">
                {selected.integrantes.length > 0 ? (
                  selected.integrantes.map(integrante => (
                    <div
                      key={integrante.id_estudiante}
                      className="bg-white rounded-lg p-3 border border-violet-100"
                    >
                      <div className="text-sm font-medium text-slate-700">
                        {integrante.nombre} {integrante.apellido}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Carnet: {integrante.carnet}
                      </div>
                      <div className="text-xs text-slate-500">
                        {integrante.correo}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-slate-500">
                    No hay integrantes registrados.
                  </div>
                )}
              </div>

            </div>

            <div className="space-y-3">



              {[

                [

                  'Título',

                  selected.titulo,

                ],

                [

                  'Carrera',

                  selected.carrera,

                ],

                [

                  'Ciclo',

                  selected.ciclo,

                ],

                [

                  'Tutor',

                  selected.tutor,

                ],

                [

                  'Correo',

                  selected.correoEstudiante,

                ],

              ].map(

                ([label, value]) => (

                  <div

                    key={label}

                    className="flex gap-3"

                  >



                    <span className="text-xs text-slate-400 font-mono w-20 shrink-0">

                      {label}

                    </span>



                    <span className="text-sm text-slate-700">

                      {value}

                    </span>



                  </div>

                )

              )}



              <div className="flex gap-3 items-center">



                <span className="text-xs text-slate-400 font-mono w-20 shrink-0">

                  Estado

                </span>



                <StatusBadge

                  status={

                    selected.estado

                  }

                />



              </div>



              <div className="flex gap-3">



                <span className="text-xs text-slate-400 font-mono w-20 shrink-0">

                  Registro

                </span>



                <span className="text-sm text-slate-700">

                  {formatearFecha(

                    selected.fechaRegistro

                  )}

                </span>



              </div>



            </div>



            <div>



              <div className="text-xs font-mono text-slate-400 mb-3">

                DESCRIPCIÓN

              </div>



              <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600">

                {selected.descripcion}

              </div>



            </div>



            <div>



              <div className="text-xs font-mono text-slate-400 mb-3">

                HISTORIAL DE AVANCES

              </div>



              {cargandoAvances ? (

                <div className="py-6 flex justify-center">



                  <Loader2

                    size={22}

                    className="animate-spin text-violet-600"

                  />



                </div>

              ) : avancesDetalle.length === 0 ? (

                <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-500">

                  No hay avances registrados para esta monografía.

                </div>

              ) : (

                <div className="space-y-2">



                  {avancesDetalle.map(

                    avance => (

                      <div

                        key={

                          avance.id_avance

                        }

                        className="flex items-center justify-between gap-3 bg-slate-50 rounded-xl p-3"

                      >



                        <div>



                          <div className="text-sm font-medium text-slate-700">

                            {obtenerNombreEtapa(

                              avance.id_etapa

                            )}

                          </div>



                          <div className="text-xs text-slate-400 mt-1">

                            Entrega:{' '}

                            {formatearFecha(

                              avance.fecha_entrega

                            )}

                          </div>



                        </div>



                        <StatusBadge

                          status={normalizarEstado(

                            avance.estado

                          )}

                        />



                      </div>

                    )

                  )}



                </div>

              )}



            </div>



          </div>

        )}



      </Modal>



    </div>

  )

}



/* =========================================================

   INICIO

\========================================================= */



function InicioCoord({

  monografias,

}: {

  monografias: Monografia[]

}) {

  const total =

    monografias.length



  const aprobadas =

    monografias.filter(

      m => m.estado === 'Aprobado'

    ).length



  const rechazadas =

    monografias.filter(

      m => m.estado === 'Rechazado'

    ).length



  const pendientes =

    monografias.filter(

      m => m.estado === 'Pendiente'

    ).length



  const enProceso =

    monografias.filter(

      m =>

        m.estado === 'En proceso' ||

        m.estado === 'Enviado' ||

        m.estado === 'En revisión'

    ).length



  const estados = [

    {

      label: 'En proceso',

      value: enProceso,

      color: 'text-blue-600',

    },

    {

      label: 'Aprobadas',

      value: aprobadas,

      color: 'text-emerald-600',

    },

    {

      label: 'Pendientes',

      value: pendientes,

      color: 'text-amber-600',

    },

    {

      label: 'Rechazadas',

      value: rechazadas,

      color: 'text-red-600',

    },

  ]



  return (

    <div className="space-y-6">



      <div className="flex items-center justify-between">



        <div>



          <h2 className="font-serif text-xl text-slate-800">

            Métricas generales

          </h2>



          <p className="text-sm text-slate-500">

            Información actual de SIGMO

          </p>



        </div>



        <div className="text-xs text-slate-400 font-mono">

          {total} monografías

        </div>



      </div>



      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">



        <MetricCard

          label="Total monografías"

          value={total}

          color="text-slate-800"

        />



        <MetricCard

          label="En proceso"

          value={enProceso}

          color="text-blue-600"

        />



        <MetricCard

          label="Aprobadas"

          value={aprobadas}

          color="text-emerald-600"

        />



        <MetricCard

          label="Pendientes"

          value={pendientes}

          color="text-amber-600"

        />



        <MetricCard

          label="Rechazadas"

          value={rechazadas}

          color="text-red-600"

        />



      </div>



      <div className="bg-white rounded-2xl border border-slate-100 p-6">



        <h3 className="font-semibold text-slate-800 mb-1">

          Resumen por estado

        </h3>



        <p className="text-xs text-slate-400 font-mono mb-5">

          Distribución actual

        </p>



        <div className="space-y-4">



          {estados.map(

            ({

              label,

              value,

              color,

            }) => {



              const porcentaje =

                total > 0

                  ? (value / total) *

                    100

                  : 0



              return (

                <div key={label}>



                  <div className="flex justify-between text-xs mb-1">



                    <span className="text-slate-600">

                      {label}

                    </span>



                    <span className="text-slate-400 font-mono">

                      {value} / {total}

                    </span>



                  </div>



                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">



                    <div

                      className={`h-full rounded-full ${color.replace(

                        'text-',

                        'bg-'

                      )}`}

                      style={{

                        width: `${porcentaje}%`,

                      }}

                    />



                  </div>



                </div>

              )

            }

          )}



        </div>



      </div>



    </div>

  )

}



function MetricCard({

  label,

  value,

  color,

}: {

  label: string

  value: number

  color: string

}) {

  return (

    <div className="bg-white rounded-2xl border border-slate-100 p-5">



      <div

        className={`text-3xl font-bold font-mono ${color}`}

      >

        {value}

      </div>



      <div className="text-xs text-slate-500 mt-1 leading-tight">

        {label}

      </div>



    </div>

  )

}



/* =========================================================

   GESTIÓN DE MONOGRAFÍAS

\========================================================= */



function GestionMonografias({

  monografias,

  all,

  search,

  setSearch,

  filterEstado,

  setFilterEstado,

  filterCarrera,

  setFilterCarrera,

  onDetail,

}: {

  monografias: Monografia[]

  all: Monografia[]

  search: string

  setSearch: (value: string) => void

  filterEstado: string

  setFilterEstado: (value: string) => void

  filterCarrera: string

  setFilterCarrera: (

    value: string

  ) => void

  onDetail: (

    id: number

  ) => void

}) {

  const carreras = [

    ...new Set(

      all.map(m => m.carrera)

    ),

  ]



  const estados = [

    'En proceso',

    'Aprobado',

    'En revisión',

    'Enviado',

    'Pendiente',

    'Rechazado',

  ]



  return (

    <div className="space-y-5">



      <div>



        <h2 className="font-serif text-xl text-slate-800">

          Gestión de Monografías

        </h2>



        <p className="text-sm text-slate-500">

          {monografias.length} registros

        </p>



      </div>



      <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-wrap gap-3">



        <div className="relative flex-1 min-w-48">



          <Search

            size={14}

            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"

          />



          <input

            value={search}

            onChange={e =>

              setSearch(

                e.target.value

              )

            }

            placeholder="Buscar por estudiante, carnet o título..."

            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-500"

          />



        </div>



        <select

          value={filterEstado}

          onChange={e =>

            setFilterEstado(

              e.target.value

            )

          }

          className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-500 text-slate-600"

        >



          <option value="">

            Todos los estados

          </option>



          {estados.map(

            estado => (

              <option

                key={estado}

                value={estado}

              >

                {estado}

              </option>

            )

          )}



        </select>



        <select

          value={filterCarrera}

          onChange={e =>

            setFilterCarrera(

              e.target.value

            )

          }

          className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-500 text-slate-600"

        >



          <option value="">

            Todas las carreras

          </option>



          {carreras.map(

            carrera => (

              <option

                key={carrera}

                value={carrera}

              >

                {carrera}

              </option>

            )

          )}



        </select>



        {(filterEstado ||

          filterCarrera ||

          search) && (

          <button

            onClick={() => {

              setFilterEstado('')

              setFilterCarrera('')

              setSearch('')

            }}

            className="px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-500 hover:bg-slate-50 flex items-center gap-1"

          >

            <X size={13} />

            Limpiar

          </button>

        )}



      </div>



      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">



        {monografias.length === 0 ? (

          <div className="p-10 text-center text-sm text-slate-500">

            No hay monografías que coincidan con los filtros.

          </div>

        ) : (

          <div className="overflow-x-auto">



            <table className="w-full min-w-[850px]">



              <thead>



                <tr className="border-b border-slate-100">



                  {[

                    'Integrantes',

                    'Título',

                    'Carrera',

                    'Tutor',

                    'Estado',

                    'Ciclo',

                    'Acción',

                  ].map(header => (

                    <th

                      key={header}

                      className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide"

                    >

                      {header}

                    </th>

                  ))}



                </tr>



              </thead>



              <tbody className="divide-y divide-slate-50">



                {monografias.map(

                  monografia => (

                    <tr

                      key={

                        monografia.id

                      }

                      className="hover:bg-slate-50 transition-colors"

                    >



                      <td className="px-5 py-4">

                        <div className="space-y-2 min-w-[220px]">

                          {monografia.integrantes.length > 0 ? (
                            monografia.integrantes.map(integrante => (
                              <div key={integrante.id_estudiante} className="flex items-center gap-2">
                                <div className="w-7 h-7 bg-violet-100 rounded-full flex items-center justify-center text-violet-700 text-xs font-bold shrink-0">
                                  {integrante.nombre.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <div className="text-sm text-slate-700">
                                    {integrante.nombre} {integrante.apellido}
                                  </div>
                                  <div className="text-xs text-slate-400 font-mono">
                                    {integrante.carnet}
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-sm text-slate-500">{monografia.estudiante}</div>
                          )}

                        </div>

                      </td>

                      <td className="px-5 py-4 max-w-[220px]">



                        <div className="text-sm text-slate-600 truncate">

                          {

                            monografia.titulo

                          }

                        </div>



                      </td>



                      <td className="px-5 py-4 text-xs text-slate-500 font-mono">

                        {

                          monografia.carrera

                        }

                      </td>



                      <td className="px-5 py-4 text-xs text-slate-500">

                        {

                          monografia.tutor

                        }

                      </td>



                      <td className="px-5 py-4">

                        <StatusBadge

                          status={

                            monografia.estado

                          }

                        />

                      </td>



                      <td className="px-5 py-4 text-xs text-slate-400 font-mono">

                        {

                          monografia.ciclo

                        }

                      </td>



                      <td className="px-5 py-4">



                        <button

                          onClick={() =>

                            onDetail(

                              monografia.id

                            )

                          }

                          className="text-xs font-semibold text-violet-600 hover:text-violet-700 flex items-center gap-1"

                        >

                          Ver detalle

                          <ChevronRight

                            size={12}

                          />

                        </button>



                      </td>



                    </tr>

                  )

                )}



              </tbody>



            </table>



          </div>

        )}



      </div>



    </div>

  )

}



/* =========================================================

   ASIGNAR TUTOR / JURADO

\========================================================= */



function AsignarTutorTribunal({

  tutores,

  monografias,

  onAsignarTutor,

}: {

  tutores: Tutor[]

  monografias: Monografia[]

  onAsignarTutor: (

    idMonografia: number,

    idTutor: number

  ) => Promise<boolean>

}) {

  const [tab, setTab] =

    useState<'tutor' | 'jurado'>(

      'tutor'

    )



  const [selMono, setSelMono] =

    useState('')



  const [selTutor, setSelTutor] =

    useState('')



  const [confirmed, setConfirmed] =

    useState(false)



  const [asignando, setAsignando] =

    useState(false)



  const [error, setError] =

    useState('')



  const [miembros, setMiembros] =

    useState<string[]>([''])



  const monografiaSeleccionada =

    monografias.find(

      m =>

        String(m.id) ===

        selMono

    )



  const tutorSeleccionado =

    tutores.find(

      tutor =>

        String(tutor.id) ===

        selTutor

    )



  const handleConfirm =

    async () => {

      if (

        !selMono ||

        !selTutor

      ) {

        return

      }



      try {

        setError('')

        setAsignando(true)



        const resultado =

          await onAsignarTutor(

            Number(selMono),

            Number(selTutor)

          )



        if (resultado) {

          setConfirmed(true)

        }

      } catch (error) {

        setError(

          error instanceof Error

            ? error.message

            : 'No se pudo asignar el tutor'

        )

      } finally {

        setAsignando(false)

      }

    }



  return (

    <div className="space-y-5 max-w-2xl">



      <div>



        <h2 className="font-serif text-xl text-slate-800">

          Asignar Tutor / Jurado

        </h2>



        <p className="text-sm text-slate-500">

          Gestión de responsables académicos

        </p>



      </div>



      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">



        {(

          ['tutor', 'jurado'] as const

        ).map(tipo => (

          <button

            key={tipo}

            onClick={() => {

              setTab(tipo)

              setConfirmed(false)

              setError('')

            }}

            className={`px-5 py-2 rounded-xl text-sm font-medium transition-colors ${

              tab === tipo

                ? 'bg-white text-slate-800 shadow-sm'

                : 'text-slate-500 hover:text-slate-700'

            }`}

          >

            {tipo === 'tutor'

              ? 'Asignar / Reasignar Tutor'

              : 'Asignar Jurado'}

          </button>

        ))}



      </div>



      {/* ===============================================

          TUTOR

      =============================================== */}



      {tab === 'tutor' && (

        <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-5">



          {confirmed ? (

            <div className="text-center py-8">



              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">



                <Check

                  size={24}

                  className="text-emerald-600"

                />



              </div>



              <div className="font-semibold text-slate-800 mb-1">

                Asignación confirmada

              </div>



              <div className="text-sm text-slate-500">

                {

                  tutorSeleccionado?.nombre

                }{' '}

                fue asignado correctamente.

              </div>



              <button

                onClick={() => {

                  setConfirmed(false)

                  setSelMono('')

                  setSelTutor('')

                  setError('')

                }}

                className="mt-4 text-sm text-violet-600 hover:text-violet-700"

              >

                Nueva asignación

              </button>



            </div>

          ) : (

            <>

              {error && (

                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">

                  {error}

                </div>

              )}



              <div>



                <label className="block text-sm font-medium text-slate-700 mb-1.5">

                  Seleccionar monografía

                </label>



                <select

                  value={selMono}

                  onChange={e => {

                    setSelMono(

                      e.target.value

                    )

                    setConfirmed(false)

                  }}

                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-500"

                >



                  <option value="">

                    — Seleccione —

                  </option>



                  {monografias.map(

                    monografia => (

                      <option

                        key={

                          monografia.id

                        }

                        value={

                          monografia.id

                        }

                      >

                        {

                          monografia.estudiante

                        }{' '}

                        —{' '}

                        {monografia.titulo.slice(

                          0,

                          50

                        )}

                        {monografia.titulo

                          .length > 50

                          ? '...'

                          : ''}

                      </option>

                    )

                  )}



                </select>



              </div>



              {monografiaSeleccionada && (

                <div className="bg-slate-50 rounded-xl p-4 space-y-2">



                  <div className="text-xs text-slate-400 font-mono">

                    INFORMACIÓN ACTUAL

                  </div>



                  <div className="text-sm text-slate-700">

                    <span className="font-medium">

                      Estudiante:

                    </span>{' '}

                    {

                      monografiaSeleccionada.estudiante

                    }

                  </div>



                  <div className="text-sm text-slate-700">

                    <span className="font-medium">

                      Tutor actual:

                    </span>{' '}

                    {

                      monografiaSeleccionada.tutor

                    }

                  </div>



                </div>

              )}



              <div>



                <label className="block text-sm font-medium text-slate-700 mb-1.5">

                  Seleccionar tutor

                </label>



                <select

                  value={selTutor}

                  onChange={e =>

                    setSelTutor(

                      e.target.value

                    )

                  }

                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-500"

                >



                  <option value="">

                    — Seleccione —

                  </option>



                  {tutores.map(

                    tutor => (

                      <option

                        key={

                          tutor.id

                        }

                        value={

                          tutor.id

                        }

                      >

                        {

                          tutor.nombre

                        }{' '}

                        —{' '}

                        {tutor.correo}

                      </option>

                    )

                  )}



                </select>



                {tutores.length === 0 && (

                  <p className="text-xs text-amber-600 mt-2">

                    No hay tutores activos registrados.

                  </p>

                )}



              </div>



              <button

                onClick={

                  handleConfirm

                }

                disabled={

                  !selMono ||

                  !selTutor ||

                  asignando

                }

                className="w-full py-2.5 rounded-xl bg-violet-600 text-white font-semibold text-sm hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"

              >



                {asignando ? (

                  <>

                    <Loader2

                      size={16}

                      className="animate-spin"

                    />

                    Guardando...

                  </>

                ) : (

                  'Confirmar asignación'

                )}



              </button>



            </>

          )}



        </div>

      )}



      {/* ===============================================

          JURADO

      =============================================== */}



      {tab === 'jurado' && (

        <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-5">



          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">



            <div className="font-semibold text-amber-800 text-sm mb-1">

              Módulo de jurado

            </div>



            <p className="text-xs text-amber-700 leading-relaxed">

              La interfaz está preparada, pero la asignación de jurados todavía requiere la tabla y los endpoints correspondientes en el backend. No se realizará una asignación ficticia.

            </p>



          </div>



          <div>



            <label className="block text-sm font-medium text-slate-700 mb-1.5">

              Seleccionar monografía

            </label>



            <select

              disabled

              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-100 text-slate-400"

            >



              <option>

                — Módulo pendiente de API —

              </option>



            </select>



          </div>



          <div>



            <div className="flex items-center justify-between mb-1.5">



              <label className="text-sm font-medium text-slate-700">

                Miembros del jurado

              </label>



              <button

                disabled

                onClick={() =>

                  setMiembros(

                    miembros => [

                      ...miembros,

                      '',

                    ]

                  )

                }

                className="text-xs text-slate-400"

              >

                + Agregar

              </button>



            </div>



            <div className="space-y-2">



              {miembros.map(

                (_, index) => (

                  <select

                    key={index}

                    disabled

                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-slate-100 text-slate-400"

                  >

                    <option>

                      — API de jurados pendiente —

                    </option>

                  </select>

                )

              )}



            </div>



          </div>



        </div>

      )}



    </div>

  )

}



/* =========================================================

   REPORTES

\========================================================= */



const COLORS = [

  '#7C3AED',

  '#2563EB',

  '#059669',

  '#D97706',

  '#EF4444',

  '#64748B',

]



function Reportes({

  monografias,

}: {

  monografias: Monografia[]

}) {

  const byEstado = [

    {

      name: 'Aprobado',

      value:

        monografias.filter(

          m =>

            m.estado ===

            'Aprobado'

        ).length,

    },

    {

      name: 'En revisión',

      value:

        monografias.filter(

          m =>

            m.estado ===

            'En revisión'

        ).length,

    },

    {

      name: 'Enviado',

      value:

        monografias.filter(

          m =>

            m.estado ===

            'Enviado'

        ).length,

    },

    {

      name: 'Pendiente',

      value:

        monografias.filter(

          m =>

            m.estado ===

            'Pendiente'

        ).length,

    },

    {

      name: 'Rechazado',

      value:

        monografias.filter(

          m =>

            m.estado ===

            'Rechazado'

        ).length,

    },

  ].filter(

    item => item.value > 0

  )



  const byCarrera = Array.from(

    monografias.reduce(

      (

        mapa,

        monografia

      ) => {

        mapa.set(

          monografia.carrera,

          (mapa.get(

            monografia.carrera

          ) || 0) + 1

        )



        return mapa

      },

      new Map<string, number>()

    )

  ).map(

    ([name, total]) => ({

      name,

      total,

    })

  )



  const byTutor = Array.from(

    monografias.reduce(

      (

        mapa,

        monografia

      ) => {

        const tutor =

          monografia.tutor



        mapa.set(

          tutor,

          (mapa.get(tutor) ||

            0) + 1

        )



        return mapa

      },

      new Map<string, number>()

    )

  )

    .filter(

      ([name]) =>

        name !==

        'Sin tutor asignado'

    )

    .map(

      ([name, total]) => ({

        name,

        total,

      })

    )



  return (

    <div className="space-y-5">



      <div>



        <h2 className="font-serif text-xl text-slate-800">

          Reportes

        </h2>



        <p className="text-sm text-slate-500">

          Estadísticas generadas con los datos actuales de SIGMO.

        </p>



      </div>



      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">



        {/* ESTADOS */}



        <div className="bg-white rounded-2xl border border-slate-100 p-6">



          <h3 className="font-semibold text-slate-800 mb-1 text-sm">

            Monografías por estado

          </h3>



          <p className="text-xs text-slate-400 font-mono mb-5">

            Distribución actual

          </p>



          {byEstado.length === 0 ? (

            <div className="h-[220px] flex items-center justify-center text-sm text-slate-400">

              No hay datos suficientes.

            </div>

          ) : (

            <ResponsiveContainer

              width="100%"

              height={220}

            >

              <PieChart>



                <Pie

                  data={byEstado}

                  cx="50%"

                  cy="50%"

                  innerRadius={55}

                  outerRadius={85}

                  paddingAngle={3}

                  dataKey="value"

                >

                  {byEstado.map(

                    (_, index) => (

                      <Cell

                        key={index}

                        fill={

                          COLORS[

                            index %

                              COLORS.length

                          ]

                        }

                      />

                    )

                  )}

                </Pie>



                <Tooltip />



                <Legend

                  iconType="circle"

                  iconSize={8}

                  wrapperStyle={{

                    fontSize:

                      '11px',

                  }}

                />



              </PieChart>

            </ResponsiveContainer>

          )}



        </div>



        {/* CARRERAS */}



        <div className="bg-white rounded-2xl border border-slate-100 p-6">



          <h3 className="font-semibold text-slate-800 mb-1 text-sm">

            Monografías por carrera

          </h3>



          <p className="text-xs text-slate-400 font-mono mb-5">

            Total registrado

          </p>



          {byCarrera.length === 0 ? (

            <div className="h-[220px] flex items-center justify-center text-sm text-slate-400">

              No hay datos suficientes.

            </div>

          ) : (

            <ResponsiveContainer

              width="100%"

              height={220}

            >

              <BarChart

                data={byCarrera}

                margin={{

                  left: -20,

                }}

              >



                <CartesianGrid

                  strokeDasharray="3 3"

                />



                <XAxis

                  dataKey="name"

                  tick={{

                    fontSize: 10,

                  }}

                />



                <YAxis

                  allowDecimals={false}

                  tick={{

                    fontSize: 10,

                  }}

                />



                <Tooltip />



                <Bar

                  dataKey="total"

                  fill="#7C3AED"

                  radius={[

                    6,

                    6,

                    0,

                    0,

                  ]}

                />



              </BarChart>

            </ResponsiveContainer>

          )}



        </div>



        {/* TUTORES */}



        <div className="bg-white rounded-2xl border border-slate-100 p-6">



          <h3 className="font-semibold text-slate-800 mb-1 text-sm">

            Monografías por tutor

          </h3>



          <p className="text-xs text-slate-400 font-mono mb-5">

            Carga actual

          </p>



          {byTutor.length === 0 ? (

            <div className="h-[200px] flex items-center justify-center text-sm text-slate-400">

              No hay monografías con tutor asignado.

            </div>

          ) : (

            <ResponsiveContainer

              width="100%"

              height={200}

            >

              <BarChart

                data={byTutor}

                layout="vertical"

                margin={{

                  left: 10,

                }}

              >



                <CartesianGrid

                  strokeDasharray="3 3"

                  horizontal={false}

                />



                <XAxis

                  type="number"

                  allowDecimals={false}

                />



                <YAxis

                  dataKey="name"

                  type="category"

                  width={110}

                  tick={{

                    fontSize: 10,

                  }}

                />



                <Tooltip />



                <Bar

                  dataKey="total"

                  fill="#059669"

                  radius={[

                    0,

                    6,

                    6,

                    0,

                  ]}

                />



              </BarChart>

            </ResponsiveContainer>

          )}



        </div>



        {/* RESUMEN */}



        <div className="bg-white rounded-2xl border border-slate-100 p-6">



          <h3 className="font-semibold text-slate-800 mb-1 text-sm">

            Resumen del sistema

          </h3>



          <p className="text-xs text-slate-400 font-mono mb-5">

            Información disponible actualmente

          </p>



          <div className="space-y-3">



            <ResumenRow

              label="Monografías"

              value={

                monografias.length

              }

            />



            <ResumenRow

              label="Tutores asignados"

              value={

                monografias.filter(

                  m =>

                    m.idTutor !==

                    null

                ).length

              }

            />



            <ResumenRow

              label="Sin tutor"

              value={

                monografias.filter(

                  m =>

                    m.idTutor ===

                    null

                ).length

              }

            />



            <ResumenRow

              label="Aprobadas"

              value={

                monografias.filter(

                  m =>

                    m.estado ===

                    'Aprobado'

                ).length

              }

            />



          </div>



          <div className="mt-5 bg-slate-50 rounded-xl p-3 text-xs text-slate-500">

            Las defensas programadas todavía no se muestran aquí porque aún no existe un endpoint de defensas conectado al dashboard.

          </div>



        </div>



      </div>



    </div>

  )

}



function ResumenRow({

  label,

  value,

}: {

  label: string

  value: number

}) {

  return (

    <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">



      <span className="text-sm text-slate-600">

        {label}

      </span>



      <span className="font-mono font-semibold text-slate-800">

        {value}

      </span>



    </div>

  )

}



/* =========================================================

   PERFIL

\========================================================= */



function PerfilCoord({

  usuario,

  totalMonografias,

}: {

  usuario: {

    nombre: string

    apellido: string

    correo: string

    rol: string

  } | null

  totalMonografias: number

}) {

  const nombreCompleto =

    usuario

      ? `${usuario.nombre} ${usuario.apellido}`.trim()

      : 'Coordinador SIGMO'



  const inicial =

    usuario?.nombre

      ?.charAt(0)

      .toUpperCase() ||

    'C'



  return (

    <div className="space-y-5 max-w-xl">



      <div>



        <h2 className="font-serif text-xl text-slate-800">

          Perfil

        </h2>



        <p className="text-sm text-slate-500">

          Información de la cuenta actual.

        </p>



      </div>



      <div className="bg-white rounded-2xl border border-slate-100 p-6">



        <div className="flex items-center gap-4 mb-6">



          <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center text-violet-700 font-bold text-2xl">

            {inicial}

          </div>



          <div>



            <div className="font-semibold text-slate-800 text-lg">

              {nombreCompleto}

            </div>



            <div className="text-sm text-slate-500">

              Coordinador

            </div>



          </div>



        </div>



        <div className="space-y-3">



          <div className="flex gap-4">



            <span className="text-xs text-slate-400 font-mono w-28 shrink-0">

              Correo

            </span>



            <span className="text-sm text-slate-700">

              {usuario?.correo ||

                'No disponible'}

            </span>



          </div>



          <div className="flex gap-4">



            <span className="text-xs text-slate-400 font-mono w-28 shrink-0">

              Rol

            </span>



            <span className="text-sm text-slate-700">

              {usuario?.rol ||

                'COORDINADOR'}

            </span>



          </div>



          <div className="flex gap-4">



            <span className="text-xs text-slate-400 font-mono w-28 shrink-0">

              Monografías

            </span>



            <span className="text-sm text-slate-700">

              {totalMonografias}

            </span>



          </div>



        </div>



      </div>



    </div>

  )

}
