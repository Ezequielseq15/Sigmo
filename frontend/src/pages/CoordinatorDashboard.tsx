import { useState } from 'react'
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
  Download,
  ChevronRight,
  Check,
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

interface Props {
  onLogout: () => void
}

type Section =
  | 'inicio'
  | 'gestion'
  | 'asignar'
  | 'reportes'
  | 'perfil'

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

const monografias = [
  {
    id: 1,
    estudiante: 'Ana García Pérez',
    titulo: 'Impacto de las TI en PyMEs de Lima',
    carrera: 'Administración',
    tutor: 'Dr. Carlos Mendoza',
    estado: 'En revisión',
    ciclo: '2026-II',
  },
  {
    id: 2,
    estudiante: 'Luis Ramírez Torres',
    titulo: 'Sostenibilidad en empresas constructoras',
    carrera: 'Ingeniería Civil',
    tutor: 'Mg. Sofía Paredes',
    estado: 'Aprobado',
    ciclo: '2026-II',
  },
  {
    id: 3,
    estudiante: 'María Chávez Lara',
    titulo: 'Marketing digital en PYMEs limeñas',
    carrera: 'Marketing',
    tutor: 'Dr. Carlos Mendoza',
    estado: 'Enviado',
    ciclo: '2026-II',
  },
  {
    id: 4,
    estudiante: 'José Sánchez Mora',
    titulo: 'Gestión del talento en minería',
    carrera: 'Administración',
    tutor: 'Lic. Pedro Salas',
    estado: 'Pendiente',
    ciclo: '2026-I',
  },
  {
    id: 5,
    estudiante: 'Carmen Flores Díaz',
    titulo: 'Implementación de ERP en medianas empresas',
    carrera: 'Sistemas',
    tutor: 'Dr. Carlos Mendoza',
    estado: 'En revisión',
    ciclo: '2026-II',
  },
  {
    id: 6,
    estudiante: 'Diego Vargas León',
    titulo: 'Fintech y la inclusión financiera en Perú',
    carrera: 'Economía',
    tutor: 'Mg. Sofía Paredes',
    estado: 'Rechazado',
    ciclo: '2026-I',
  },
]

const tutores = [
  'Dr. Carlos Mendoza Ríos',
  'Mg. Sofía Paredes Ruiz',
  'Lic. Pedro Salas Vega',
  'Dra. Elena Castro Mora',
]

export default function CoordinatorDashboard({
  onLogout,
}: Props) {
  const [section, setSection] = useState<Section>('inicio')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [detailId, setDetailId] = useState<number | null>(null)
  const [filterEstado, setFilterEstado] = useState('')
  const [filterCarrera, setFilterCarrera] = useState('')
  const [search, setSearch] = useState('')
  const [detailModal, setDetailModal] = useState(false)

  const navigate = (s: Section) => {
    setSection(s)
    setSidebarOpen(false)
    setDetailId(null)
  }

  const filtered = monografias.filter(
    m =>
      (!filterEstado || m.estado === filterEstado) &&
      (!filterCarrera || m.carrera === filterCarrera) &&
      (!search ||
        m.estudiante
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        m.titulo
          .toLowerCase()
          .includes(search.toLowerCase()))
  )

  const selected = monografias.find(
    m => m.id === detailId
  )

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

        {/* Logo */}
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

        {/* Información del coordinador */}
        <div className="p-4 border-b border-slate-100">
          <div className="bg-violet-50 rounded-xl p-3">

            <div className="text-xs text-slate-500 mb-0.5">
              Coordinador
            </div>

            <div className="font-semibold text-slate-800 text-sm">
              Dra. Patricia Villanueva
            </div>

            <div className="text-xs text-violet-600 font-mono mt-1">
              Ciclo 2026-II
            </div>

          </div>
        </div>

        {/* Navegación */}
        <nav className="flex-1 p-3 space-y-1">

          {navItems.map(
            ({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => navigate(id)}
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

        {/* Cerrar sesión */}
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

      {/* Fondo menú móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* CONTENIDO */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* HEADER */}
        <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">

          <div className="flex items-center gap-3">

            <button
              onClick={() => setSidebarOpen(true)}
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

              <span className="absolute top-1 right-1 w-2 h-2 bg-violet-500 rounded-full" />
            </button>

            <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center text-violet-700 text-sm font-semibold">
              P
            </div>

          </div>

        </header>

        {/* CONTENIDO PRINCIPAL */}
        <main className="flex-1 overflow-y-auto p-6">

          {section === 'inicio' && (
            <InicioCoord />
          )}

          {section === 'gestion' && (
            <GestionMonografias
              monografias={filtered}
              all={monografias}
              search={search}
              setSearch={setSearch}
              filterEstado={filterEstado}
              setFilterEstado={setFilterEstado}
              filterCarrera={filterCarrera}
              setFilterCarrera={setFilterCarrera}
              onDetail={id => {
                setDetailId(id)
                setDetailModal(true)
              }}
            />
          )}

          {section === 'asignar' && (
            <AsignarTutorTribunal
              tutores={tutores}
              monografias={monografias}
            />
          )}

          {section === 'reportes' && (
            <Reportes
              monografias={monografias}
            />
          )}

          {section === 'perfil' && (
            <PerfilCoord />
          )}

        </main>

      </div>

      {/* MODAL DETALLE */}
      <Modal
        open={detailModal && !!selected}
        title="Detalle de monografía"
        onClose={() => setDetailModal(false)}
      >
        {selected && (
          <div className="space-y-4">

            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">

              <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center text-violet-700 font-bold">
                {selected.estudiante[0]}
              </div>

              <div>
                <div className="font-semibold text-slate-800">
                  {selected.estudiante}
                </div>

                <div className="text-xs text-slate-400 font-mono">
                  {selected.carrera}
                </div>
              </div>

            </div>

            <div className="space-y-2.5">

              {[
                ['Título', selected.titulo],
                ['Carrera', selected.carrera],
                ['Tutor', selected.tutor],
                ['Ciclo', selected.ciclo],
              ].map(([label, value]) => (
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
              ))}

              <div className="flex gap-3 items-center">

                <span className="text-xs text-slate-400 font-mono w-20 shrink-0">
                  Estado
                </span>

                <StatusBadge
                  status={selected.estado}
                />

              </div>

            </div>

            <div className="bg-slate-50 rounded-xl p-4">

              <div className="text-xs font-mono text-slate-400 mb-3">
                HISTORIAL DE AVANCES
              </div>

              <div className="space-y-2">

                {[
                  'Propuesta',
                  'Avance 1',
                  'Avance 2',
                ].map((a, i) => (
                  <div
                    key={a}
                    className="flex items-center justify-between"
                  >
                    <span className="text-xs text-slate-600 font-mono">
                      {a}
                    </span>

                    <StatusBadge
                      status={
                        i < 2
                          ? 'Aprobado'
                          : selected.estado
                      }
                    />
                  </div>
                ))}

              </div>

            </div>

          </div>
        )}
      </Modal>

    </div>
  )
}

/* =========================================================
   INICIO
========================================================= */

function InicioCoord() {
  return (
    <div className="space-y-6">

      <div>
        <h2 className="font-serif text-xl text-slate-800">
          Métricas generales
        </h2>

        <p className="text-sm text-slate-500">
          Resumen — Ciclo 2026-II
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">

        {[
          {
            label: 'Total monografías',
            value: '248',
            color: 'text-slate-800',
          },
          {
            label: 'En proceso',
            value: '142',
            color: 'text-blue-600',
          },
          {
            label: 'Aprobadas',
            value: '67',
            color: 'text-emerald-600',
          },
          {
            label: 'Pendientes',
            value: '32',
            color: 'text-amber-600',
          },
          {
            label: 'Defensas programadas',
            value: '18',
            color: 'text-violet-600',
          },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="bg-white rounded-2xl border border-slate-100 p-5"
          >
            <div
              className={`text-3xl font-bold font-mono ${color}`}
            >
              {value}
            </div>

            <div className="text-xs text-slate-500 mt-1 leading-tight">
              {label}
            </div>
          </div>
        ))}

      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6">

        <h3 className="font-semibold text-slate-800 mb-1">
          Resumen por estado
        </h3>

        <p className="text-xs text-slate-400 font-mono mb-5">
          Distribución actual
        </p>

        <div className="space-y-3">

          {[
            {
              estado: 'En proceso',
              count: 142,
              total: 248,
              color: 'bg-blue-500',
            },
            {
              estado: 'Aprobadas',
              count: 67,
              total: 248,
              color: 'bg-emerald-500',
            },
            {
              estado: 'Pendientes',
              count: 32,
              total: 248,
              color: 'bg-amber-400',
            },
            {
              estado: 'Rechazadas',
              count: 7,
              total: 248,
              color: 'bg-red-400',
            },
          ].map(
            ({ estado, count, total, color }) => (
              <div key={estado}>

                <div className="flex justify-between text-xs mb-1">

                  <span className="text-slate-600">
                    {estado}
                  </span>

                  <span className="text-slate-400 font-mono">
                    {count} / {total}
                  </span>

                </div>

                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">

                  <div
                    className={`h-full rounded-full ${color}`}
                    style={{
                      width: `${(count / total) * 100}%`,
                    }}
                  />

                </div>

              </div>
            )
          )}

        </div>

      </div>

    </div>
  )
}

/* =========================================================
   GESTIÓN DE MONOGRAFÍAS
========================================================= */

interface Monografia {
  id: number
  estudiante: string
  titulo: string
  carrera: string
  tutor: string
  estado: string
  ciclo: string
}

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
  setSearch: (s: string) => void
  filterEstado: string
  setFilterEstado: (s: string) => void
  filterCarrera: string
  setFilterCarrera: (s: string) => void
  onDetail: (id: number) => void
}) {
  const carreras = [
    ...new Set(all.map(m => m.carrera)),
  ]

  const estados = [
    'En revisión',
    'Aprobado',
    'Enviado',
    'Pendiente',
    'Rechazado',
  ]

  return (
    <div className="space-y-5">

      <div className="flex items-center justify-between flex-wrap gap-3">

        <div>
          <h2 className="font-serif text-xl text-slate-800">
            Gestión de Monografías
          </h2>

          <p className="text-sm text-slate-500">
            {monografias.length} registros
          </p>
        </div>

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
              setSearch(e.target.value)
            }
            placeholder="Buscar por estudiante o título..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />

        </div>

        <select
          value={filterEstado}
          onChange={e =>
            setFilterEstado(e.target.value)
          }
          className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-500 text-slate-600"
        >
          <option value="">
            Todos los estados
          </option>

          {estados.map(e => (
            <option key={e}>{e}</option>
          ))}
        </select>

        <select
          value={filterCarrera}
          onChange={e =>
            setFilterCarrera(e.target.value)
          }
          className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-500 text-slate-600"
        >
          <option value="">
            Todas las carreras
          </option>

          {carreras.map(c => (
            <option key={c}>{c}</option>
          ))}
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

        <div className="overflow-x-auto">

          <table className="w-full min-w-[700px]">

            <thead>
              <tr className="border-b border-slate-100">

                {[
                  'Estudiante',
                  'Título',
                  'Carrera',
                  'Tutor',
                  'Estado',
                  'Ciclo',
                  'Acción',
                ].map(h => (
                  <th
                    key={h}
                    className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}

              </tr>
            </thead>

            <tbody className="divide-y divide-slate-50">

              {monografias.map(m => (
                <tr
                  key={m.id}
                  className="hover:bg-slate-50 transition-colors"
                >

                  <td className="px-5 py-4">

                    <div className="flex items-center gap-2">

                      <div className="w-7 h-7 bg-violet-100 rounded-full flex items-center justify-center text-violet-700 text-xs font-bold">
                        {m.estudiante[0]}
                      </div>

                      <span className="text-sm text-slate-700">
                        {m.estudiante}
                      </span>

                    </div>

                  </td>

                  <td className="px-5 py-4 max-w-[200px]">
                    <div className="text-sm text-slate-600 truncate">
                      {m.titulo}
                    </div>
                  </td>

                  <td className="px-5 py-4 text-xs text-slate-500 font-mono">
                    {m.carrera}
                  </td>

                  <td className="px-5 py-4 text-xs text-slate-500">
                    {m.tutor}
                  </td>

                  <td className="px-5 py-4">
                    <StatusBadge status={m.estado} />
                  </td>

                  <td className="px-5 py-4 text-xs text-slate-400 font-mono">
                    {m.ciclo}
                  </td>

                  <td className="px-5 py-4">

                    <button
                      onClick={() => onDetail(m.id)}
                      className="text-xs font-semibold text-violet-600 hover:text-violet-700 flex items-center gap-1"
                    >
                      Ver detalle
                      <ChevronRight size={12} />
                    </button>

                  </td>

                </tr>
              ))}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  )
}

/* =========================================================
   ASIGNAR TUTOR / JURADO
========================================================= */

function AsignarTutorTribunal({
  tutores,
  monografias,
}: {
  tutores: string[]
  monografias: {
    id: number
    estudiante: string
    titulo: string
    tutor: string
  }[]
}) {
  const [tab, setTab] = useState<
    'tutor' | 'jurado'
  >('tutor')

  const [selMono, setSelMono] = useState('')
  const [selTutor, setSelTutor] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [miembros, setMiembros] = useState([''])

  const handleConfirm = () => {
    if (selMono && selTutor) {
      setConfirmed(true)
    }
  }

  return (
    <div className="space-y-5 max-w-2xl">

      <h2 className="font-serif text-xl text-slate-800">
        Asignar Tutor / Jurado
      </h2>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">

        {(['tutor', 'jurado'] as const).map(t => (
          <button
            key={t}
            onClick={() => {
              setTab(t)
              setConfirmed(false)
            }}
            className={`px-5 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${
              tab === t
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t === 'tutor'
              ? 'Asignar / Reasignar Tutor'
              : 'Asignar Jurado'}
          </button>
        ))}

      </div>

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
                {selTutor} asignado correctamente
              </div>

              <button
                onClick={() => {
                  setConfirmed(false)
                  setSelMono('')
                  setSelTutor('')
                }}
                className="mt-4 text-sm text-violet-600 hover:text-violet-700"
              >
                Nueva asignación
              </button>

            </div>
          ) : (
            <>
              <div>

                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Seleccionar monografía
                </label>

                <select
                  value={selMono}
                  onChange={e =>
                    setSelMono(e.target.value)
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="">
                    — Seleccione —
                  </option>

                  {monografias.map(m => (
                    <option
                      key={m.id}
                      value={m.id}
                    >
                      {m.estudiante} —{' '}
                      {m.titulo.slice(0, 40)}...
                    </option>
                  ))}
                </select>

              </div>

              {selMono && (
                <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-500">
                  Tutor actual:{' '}
                  <span className="font-semibold text-slate-700">
                    {
                      monografias.find(
                        m =>
                          String(m.id) ===
                          selMono
                      )?.tutor
                    }
                  </span>
                </div>
              )}

              <div>

                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Seleccionar tutor
                </label>

                <select
                  value={selTutor}
                  onChange={e =>
                    setSelTutor(e.target.value)
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="">
                    — Seleccione —
                  </option>

                  {tutores.map(t => (
                    <option key={t}>{t}</option>
                  ))}
                </select>

              </div>

              <button
                onClick={handleConfirm}
                disabled={!selMono || !selTutor}
                className="w-full py-2.5 rounded-xl bg-violet-600 text-white font-semibold text-sm hover:bg-violet-700 disabled:opacity-50 transition-colors"
              >
                Confirmar asignación
              </button>
            </>
          )}

        </div>
      )}

      {tab === 'jurado' && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-5">

          <div>

            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Seleccionar monografía
            </label>

            <select className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-500">

              <option value="">
                — Seleccione —
              </option>

              {monografias.map(m => (
                <option key={m.id}>
                  {m.estudiante} —{' '}
                  {m.titulo.slice(0, 40)}...
                </option>
              ))}

            </select>

          </div>

          <div>

            <div className="flex items-center justify-between mb-1.5">

              <label className="text-sm font-medium text-slate-700">
                Miembros del jurado
              </label>

              <button
                onClick={() =>
                  setMiembros(m => [...m, ''])
                }
                className="text-xs text-violet-600 hover:text-violet-700"
              >
                + Agregar
              </button>

            </div>

            <div className="space-y-2">

              {miembros.map((m, i) => (
                <div
                  key={i}
                  className="flex gap-2"
                >

                  <select
                    value={m}
                    onChange={e =>
                      setMiembros(prev =>
                        prev.map((v, j) =>
                          j === i
                            ? e.target.value
                            : v
                        )
                      )
                    }
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >

                    <option value="">
                      — Seleccione miembro —
                    </option>

                    {tutores.map(t => (
                      <option key={t}>{t}</option>
                    ))}

                  </select>

                  {miembros.length > 1 && (
                    <button
                      onClick={() =>
                        setMiembros(prev =>
                          prev.filter(
                            (_, j) => j !== i
                          )
                        )
                      }
                      className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-50"
                    >
                      <X size={14} />
                    </button>
                  )}

                </div>
              ))}

            </div>

          </div>

          <button className="w-full py-2.5 rounded-xl bg-violet-600 text-white font-semibold text-sm hover:bg-violet-700 transition-colors">
            Confirmar asignación de jurado
          </button>

        </div>
      )}

    </div>
  )
}

/* =========================================================
   REPORTES
========================================================= */

const COLORS = [
  '#7C3AED',
  '#2563EB',
  '#059669',
  '#D97706',
  '#EF4444',
]

function Reportes({
  monografias,
}: {
  monografias: {
    estado: string
    carrera: string
    tutor: string
  }[]
}) {
  const byEstado = [
    {
      name: 'En revisión',
      value:
        monografias.filter(
          m => m.estado === 'En revisión'
        ).length + 60,
    },
    {
      name: 'Aprobado',
      value:
        monografias.filter(
          m => m.estado === 'Aprobado'
        ).length + 45,
    },
    {
      name: 'Pendiente',
      value:
        monografias.filter(
          m => m.estado === 'Pendiente'
        ).length + 25,
    },
    {
      name: 'Enviado',
      value:
        monografias.filter(
          m => m.estado === 'Enviado'
        ).length + 15,
    },
    {
      name: 'Rechazado',
      value:
        monografias.filter(
          m => m.estado === 'Rechazado'
        ).length + 5,
    },
  ]

  const byCarrera = [
    { name: 'Administración', total: 78 },
    { name: 'Ing. Civil', total: 52 },
    { name: 'Marketing', total: 41 },
    { name: 'Sistemas', total: 38 },
    { name: 'Economía', total: 29 },
    { name: 'Derecho', total: 10 },
  ]

  const byTutor = [
    { name: 'Dr. Mendoza', total: 42 },
    { name: 'Mg. Paredes', total: 35 },
    { name: 'Lic. Salas', total: 28 },
    { name: 'Dra. Castro', total: 22 },
  ]

  return (
    <div className="space-y-5">

      <div className="flex items-center justify-between">

        <div>
          <h2 className="font-serif text-xl text-slate-800">
            Reportes
          </h2>

          <p className="text-sm text-slate-500">
            Estadísticas generales — Ciclo 2026-II
          </p>
        </div>

        <button className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors">
          <Download size={14} />
          Descargar informe
        </button>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        <div className="bg-white rounded-2xl border border-slate-100 p-6">

          <h3 className="font-semibold text-slate-800 mb-1 text-sm">
            Monografías por estado
          </h3>

          <p className="text-xs text-slate-400 font-mono mb-5">
            Distribución total
          </p>

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
                {byEstado.map((_, i) => (
                  <Cell
                    key={i}
                    fill={
                      COLORS[
                        i % COLORS.length
                      ]
                    }
                  />
                ))}
              </Pie>

              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  fontSize: '12px',
                }}
              />

              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{
                  fontSize: '11px',
                  fontFamily:
                    'JetBrains Mono, monospace',
                }}
              />

            </PieChart>
          </ResponsiveContainer>

        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6">

          <h3 className="font-semibold text-slate-800 mb-1 text-sm">
            Monografías por carrera
          </h3>

          <p className="text-xs text-slate-400 font-mono mb-5">
            Total acumulado
          </p>

          <ResponsiveContainer
            width="100%"
            height={220}
          >
            <BarChart
              data={byCarrera}
              margin={{ left: -20 }}
            >

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#F1F5F9"
              />

              <XAxis
                dataKey="name"
                tick={{
                  fontSize: 10,
                  fontFamily: 'JetBrains Mono',
                }}
              />

              <YAxis
                tick={{
                  fontSize: 10,
                  fontFamily: 'JetBrains Mono',
                }}
              />

              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  fontSize: '12px',
                }}
              />

              <Bar
                dataKey="total"
                fill="#7C3AED"
                radius={[6, 6, 0, 0]}
              />

            </BarChart>
          </ResponsiveContainer>

        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6">

          <h3 className="font-semibold text-slate-800 mb-1 text-sm">
            Monografías por tutor
          </h3>

          <p className="text-xs text-slate-400 font-mono mb-5">
            Carga actual
          </p>

          <ResponsiveContainer
            width="100%"
            height={200}
          >
            <BarChart
              data={byTutor}
              layout="vertical"
              margin={{ left: 10 }}
            >

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#F1F5F9"
                horizontal={false}
              />

              <XAxis
                type="number"
                tick={{
                  fontSize: 10,
                  fontFamily: 'JetBrains Mono',
                }}
              />

              <YAxis
                dataKey="name"
                type="category"
                width={90}
                tick={{
                  fontSize: 10,
                  fontFamily: 'JetBrains Mono',
                }}
              />

              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  fontSize: '12px',
                }}
              />

              <Bar
                dataKey="total"
                fill="#059669"
                radius={[0, 6, 6, 0]}
              />

            </BarChart>
          </ResponsiveContainer>

        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6">

          <h3 className="font-semibold text-slate-800 mb-1 text-sm">
            Defensas programadas
          </h3>

          <p className="text-xs text-slate-400 font-mono mb-4">
            Próximas 4 semanas
          </p>

          <div className="space-y-2.5">

            {[
              {
                fecha: '22 Sep 2026',
                estudiante: 'Luis Ramírez Torres',
                carrera: 'Ing. Civil',
                hora: '10:00 AM',
              },
              {
                fecha: '24 Sep 2026',
                estudiante: 'María Chávez Lara',
                carrera: 'Marketing',
                hora: '11:00 AM',
              },
              {
                fecha: '29 Sep 2026',
                estudiante: 'Ana García Pérez',
                carrera: 'Administración',
                hora: '09:00 AM',
              },
              {
                fecha: '01 Oct 2026',
                estudiante: 'Carmen Flores Díaz',
                carrera: 'Sistemas',
                hora: '10:30 AM',
              },
            ].map(
              ({
                fecha,
                estudiante,
                carrera,
                hora,
              }) => (
                <div
                  key={estudiante}
                  className="flex items-center gap-4 p-3 rounded-xl bg-slate-50"
                >

                  <div className="text-xs text-violet-500 font-mono w-24 shrink-0">
                    {fecha}
                  </div>

                  <div className="flex-1 min-w-0">

                    <div className="text-sm text-slate-700 font-medium">
                      {estudiante}
                    </div>

                    <div className="text-xs text-slate-400 font-mono">
                      {carrera} · {hora}
                    </div>

                  </div>

                  <StatusBadge status="Programada" />

                </div>
              )
            )}

          </div>

        </div>

      </div>

    </div>
  )
}

/* =========================================================
   PERFIL
========================================================= */

function PerfilCoord() {
  return (
    <div className="space-y-5 max-w-xl">

      <h2 className="font-serif text-xl text-slate-800">
        Perfil
      </h2>

      <div className="bg-white rounded-2xl border border-slate-100 p-6">

        <div className="flex items-center gap-4 mb-6">

          <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center text-violet-700 font-bold text-2xl">
            P
          </div>

          <div>

            <div className="font-semibold text-slate-800 text-lg">
              Dra. Patricia Villanueva Ruiz
            </div>

            <div className="text-sm text-slate-500">
              Coordinadora académica
            </div>

          </div>

        </div>

        <div className="space-y-3">

          {[
            ['Correo', 'p.villanueva@sigmo.edu'],
            ['Departamento', 'Dirección Académica'],
            ['Ciclo activo', '2026-II'],
            ['Monografías a cargo', '248'],
          ].map(([label, value]) => (
            <div
              key={label}
              className="flex gap-4"
            >

              <span className="text-xs text-slate-400 font-mono w-36 shrink-0">
                {label}
              </span>

              <span className="text-sm text-slate-700">
                {value}
              </span>

            </div>
          ))}

        </div>

      </div>

    </div>
  )
}
