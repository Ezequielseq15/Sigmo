import { useState } from 'react'
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
  Filter,
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

type SubSection = null | 'detalle'

const navItems = [
  { id: 'inicio' as Section, label: 'Inicio', icon: Home },
  { id: 'monografistas' as Section, label: 'Mis Monografistas', icon: Users },
  { id: 'calendario' as Section, label: 'Calendario', icon: Calendar },
  { id: 'notificaciones' as Section, label: 'Notificaciones', icon: Bell },
  { id: 'perfil' as Section, label: 'Perfil', icon: User },
]

const monografistas = [
  {
    id: 1,
    nombre: 'Ana García Pérez',
    titulo: 'Impacto de las TI en PyMEs de Lima',
    estado: 'En revisión',
    ultimoAvance: 'Avance 2',
    fecha: '12 Jun 2026',
    carrera: 'Administración',
  },
  {
    id: 2,
    nombre: 'Luis Ramírez Torres',
    titulo: 'Análisis de sostenibilidad en empresas constructoras',
    estado: 'Aprobado',
    ultimoAvance: 'Documento final',
    fecha: '03 Jun 2026',
    carrera: 'Ingeniería Civil',
  },
  {
    id: 3,
    nombre: 'María Chávez Lara',
    titulo: 'Marketing digital en PYMEs limeñas',
    estado: 'Enviado',
    ultimoAvance: 'Avance 1',
    fecha: '22 May 2026',
    carrera: 'Marketing',
  },
  {
    id: 4,
    nombre: 'José Sánchez Mora',
    titulo: 'Gestión del talento humano en empresas mineras',
    estado: 'Pendiente',
    ultimoAvance: 'Propuesta',
    fecha: '16 May 2026',
    carrera: 'Administración',
  },
  {
    id: 5,
    nombre: 'Carmen Flores Díaz',
    titulo: 'Implementación de ERP en medianas empresas',
    estado: 'En revisión',
    ultimoAvance: 'Avance 3',
    fecha: '09 Jun 2026',
    carrera: 'Sistemas',
  },
]

export default function TutorDashboard({ onLogout }: Props) {
  const [section, setSection] = useState<Section>('inicio')
  const [subSection, setSubSection] = useState<SubSection>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [rejectModal, setRejectModal] = useState(false)
  const [rejectMotivo, setRejectMotivo] = useState('')
  const [actionResult, setActionResult] = useState<string | null>(null)

  const selected = monografistas.find(m => m.id === selectedId)

  const handleApprove = () => {
    setActionResult('aprobado')
    setRejectMotivo('')
  }

  const handleReject = () => {
    if (!rejectMotivo) return

    setActionResult('rechazado')
    setRejectModal(false)
    setRejectMotivo('')
  }

  const navigate = (s: Section) => {
    setSection(s)
    setSubSection(null)
    setSidebarOpen(false)
  }

  return (
    <div className="h-full flex bg-slate-50">

      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-100 flex flex-col transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >

        {/* LOGO */}
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">

            <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-sm font-mono">
                T
              </span>
            </div>

            <div>
              <div className="font-bold text-slate-800 text-sm">
                SIGMO
              </div>

              <div className="text-xs text-emerald-600 font-mono">
                Tutor
              </div>
            </div>

          </div>
        </div>

        {/* INFORMACIÓN DEL TUTOR */}
        <div className="p-4 border-b border-slate-100">
          <div className="bg-emerald-50 rounded-xl p-3">

            <div className="text-xs text-slate-500 mb-0.5">
              Tutor
            </div>

            <div className="font-semibold text-slate-800 text-sm">
              Dr. Carlos Mendoza Ríos
            </div>

            <div className="text-xs text-emerald-600 font-mono mt-1">
              5 monografistas asignados
            </div>

          </div>
        </div>

        {/* NAVEGACIÓN */}
        <nav className="flex-1 p-3 space-y-1">

          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => navigate(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                section === id
                  ? 'bg-emerald-600 text-white font-medium'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}

        </nav>

        {/* CERRAR SESIÓN */}
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

      {/* OVERLAY MOBILE */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

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

            <div className="flex items-center gap-2 text-sm text-slate-500">

              {subSection === 'detalle' && (
                <>
                  <button
                    onClick={() => setSubSection(null)}
                    className="hover:text-slate-800 transition-colors"
                  >
                    Mis Monografistas
                  </button>

                  <ChevronRight size={14} />

                  <span className="text-slate-800 font-medium">
                    {selected?.nombre}
                  </span>
                </>
              )}

              {!subSection && (
                <span className="font-semibold text-slate-800">
                  {navItems.find(n => n.id === section)?.label}
                </span>
              )}

            </div>

          </div>

          <div className="flex items-center gap-2">

            <button className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500">
              <Bell size={18} />

              <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full" />
            </button>

            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 text-sm font-semibold">
              C
            </div>

          </div>

        </header>

        {/* CONTENIDO */}
        <main className="flex-1 overflow-y-auto p-6">

          {section === 'inicio' && (
            <InicioTutor />
          )}

          {section === 'monografistas' && !subSection && (
            <MonografistasLista
              search={search}
              setSearch={setSearch}
              monografistas={monografistas}
              onSelect={(id) => {
                setSelectedId(id)
                setSubSection('detalle')
                setActionResult(null)
              }}
            />
          )}

          {section === 'monografistas' &&
            subSection === 'detalle' &&
            selected && (
              <DetalleAvance
                monografista={selected}
                actionResult={actionResult}
                onApprove={handleApprove}
                onReject={() => setRejectModal(true)}
              />
            )}

          {section === 'calendario' && (
            <CalendarioTutor />
          )}

          {section === 'notificaciones' && (
            <NotificacionesTutor />
          )}

          {section === 'perfil' && (
            <PerfilTutor />
          )}

        </main>

      </div>

      {/* MODAL DE RECHAZO */}
      <Modal
        open={rejectModal}
        title="Motivo del rechazo"
        onClose={() => setRejectModal(false)}
      >

        <div className="space-y-4">

          <p className="text-sm text-slate-600">
            Indique el motivo por el cual rechaza este avance.
            Este mensaje será visible para el monografista.
          </p>

          <textarea
            value={rejectMotivo}
            onChange={e => setRejectMotivo(e.target.value)}
            rows={4}
            placeholder="Describa detalladamente las observaciones y correcciones requeridas..."
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none bg-slate-50"
          />

          <div className="flex gap-3">

            <button
              onClick={() => setRejectModal(false)}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>

            <button
              onClick={handleReject}
              disabled={!rejectMotivo}
              className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-50"
            >
              Confirmar rechazo
            </button>

          </div>

        </div>

      </Modal>

    </div>
  )
}


/* =========================================================
   INICIO DEL TUTOR
========================================================= */

function InicioTutor() {
  return (
    <div className="space-y-6">

      <div>
        <h2 className="font-serif text-xl text-slate-800">
          Estado de Monografías Asignadas
        </h2>

        <p className="text-sm text-slate-500 mt-0.5">
          Resumen general — Ciclo 2026-II
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {[
          {
            label: 'Monografías asignadas',
            value: '5',
            color: 'bg-emerald-50 text-emerald-700',
            dot: 'bg-emerald-500',
          },
          {
            label: 'Avances pendientes',
            value: '2',
            color: 'bg-amber-50 text-amber-700',
            dot: 'bg-amber-400',
          },
          {
            label: 'Avances en revisión',
            value: '2',
            color: 'bg-orange-50 text-orange-700',
            dot: 'bg-orange-400',
          },
          {
            label: 'Monografías aprobadas',
            value: '1',
            color: 'bg-blue-50 text-blue-700',
            dot: 'bg-blue-500',
          },
        ].map(({ label, value, color, dot }) => (

          <div
            key={label}
            className="bg-white rounded-2xl border border-slate-100 p-5"
          >

            <div
              className={`inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-full ${color} mb-3`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${dot}`}
              />

              Activo
            </div>

            <div className="text-3xl font-bold text-slate-800 font-mono">
              {value}
            </div>

            <div className="text-xs text-slate-500 mt-1">
              {label}
            </div>

          </div>

        ))}

      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6">

        <h3 className="font-semibold text-slate-800 mb-4">
          Avances recientes pendientes de revisión
        </h3>

        <div className="space-y-3">

          {[
            {
              nombre: 'Ana García Pérez',
              avance: 'Avance 2 — Metodología',
              fecha: '12 Jun 2026',
            },
            {
              nombre: 'Carmen Flores Díaz',
              avance: 'Avance 3 — Resultados',
              fecha: '09 Jun 2026',
            },
          ].map(({ nombre, avance, fecha }) => (

            <div
              key={nombre}
              className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors"
            >

              <div className="w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold text-sm">
                {nombre[0]}
              </div>

              <div className="flex-1 min-w-0">

                <div className="text-sm font-medium text-slate-700">
                  {nombre}
                </div>

                <div className="text-xs text-slate-400 font-mono">
                  {avance}
                </div>

              </div>

              <div className="text-xs text-slate-400 font-mono">
                {fecha}
              </div>

              <StatusBadge status="En revisión" />

            </div>

          ))}

        </div>

      </div>

    </div>
  )
}


/* =========================================================
   LISTA DE MONOGRAFISTAS
========================================================= */

interface Monografista {
  id: number
  nombre: string
  titulo: string
  estado: string
  ultimoAvance: string
  fecha: string
  carrera: string
}

function MonografistasLista({
  search,
  setSearch,
  monografistas,
  onSelect,
}: {
  search: string
  setSearch: (s: string) => void
  monografistas: Monografista[]
  onSelect: (id: number) => void
}) {

  const filtered = monografistas.filter(
    m =>
      m.nombre.toLowerCase().includes(search.toLowerCase()) ||
      m.titulo.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5">

      <div className="flex items-center justify-between flex-wrap gap-3">

        <div>

          <h2 className="font-serif text-xl text-slate-800">
            Mis Monografistas
          </h2>

          <p className="text-sm text-slate-500">
            {monografistas.length} estudiantes asignados
          </p>

        </div>

        <div className="flex gap-2">

          <div className="relative">

            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 w-48"
            />

          </div>

          <button className="flex items-center gap-1.5 border border-slate-200 px-3 py-2 rounded-xl text-sm text-slate-500 hover:bg-slate-50">
            <Filter size={14} />
            Filtrar
          </button>

        </div>

      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">

        <table className="w-full">

          <thead>

            <tr className="border-b border-slate-100">

              {[
                'Estudiante',
                'Título',
                'Estado',
                'Último avance',
                'Fecha',
                '',
              ].map(h => (

                <th
                  key={h}
                  className={`text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide ${
                    h === 'Título'
                      ? 'hidden lg:table-cell'
                      : ''
                  }`}
                >
                  {h}
                </th>

              ))}

            </tr>

          </thead>

          <tbody className="divide-y divide-slate-50">

            {filtered.map(m => (

              <tr
                key={m.id}
                className="hover:bg-slate-50 transition-colors"
              >

                <td className="px-5 py-4">

                  <div className="flex items-center gap-3">

                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold text-xs">
                      {m.nombre[0]}
                    </div>

                    <div>

                      <div className="text-sm font-medium text-slate-700">
                        {m.nombre}
                      </div>

                      <div className="text-xs text-slate-400 font-mono">
                        {m.carrera}
                      </div>

                    </div>

                  </div>

                </td>

                <td className="px-5 py-4 hidden lg:table-cell">

                  <div className="text-sm text-slate-600 max-w-xs truncate">
                    {m.titulo}
                  </div>

                </td>

                <td className="px-5 py-4">
                  <StatusBadge status={m.estado} />
                </td>

                <td className="px-5 py-4 text-xs text-slate-500 font-mono">
                  {m.ultimoAvance}
                </td>

                <td className="px-5 py-4 text-xs text-slate-400 font-mono">
                  {m.fecha}
                </td>

                <td className="px-5 py-4">

                  <button
                    onClick={() => onSelect(m.id)}
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                  >
                    Ver
                    <ChevronRight size={12} />
                  </button>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  )
}


/* =========================================================
   DETALLE DEL AVANCE
========================================================= */

function DetalleAvance({
  monografista,
  actionResult,
  onApprove,
  onReject,
}: {
  monografista: {
    nombre: string
    titulo: string
    estado: string
    ultimoAvance: string
    fecha: string
    carrera: string
  }
  actionResult: string | null
  onApprove: () => void
  onReject: () => void
}) {

  return (
    <div className="space-y-5 max-w-3xl">

      <div className="bg-white rounded-2xl border border-slate-100 p-6">

        <div className="flex items-start gap-4 mb-5">

          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-700 font-bold text-lg">
            {monografista.nombre[0]}
          </div>

          <div>

            <h3 className="font-semibold text-slate-800">
              {monografista.nombre}
            </h3>

            <div className="text-xs text-slate-400 font-mono">
              {monografista.carrera}
            </div>

            <div className="mt-1">
              <StatusBadge status={monografista.estado} />
            </div>

          </div>

        </div>

        <div className="space-y-2.5">

          <InfoRow
            label="Título"
            value={monografista.titulo}
          />

          <InfoRow
            label="Último avance"
            value={monografista.ultimoAvance}
          />

          <InfoRow
            label="Fecha de entrega"
            value={monografista.fecha}
          />

        </div>

      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6">

        <h4 className="font-semibold text-slate-800 mb-1">
          Revisión de entrega
        </h4>

        <p className="text-xs text-slate-400 font-mono mb-5">
          {monografista.ultimoAvance} — {monografista.fecha}
        </p>

        <div className="bg-slate-50 rounded-xl p-4 mb-5 flex items-center gap-3">

          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <span className="text-blue-600 text-xs font-mono font-bold">
              PDF
            </span>
          </div>

          <div>

            <div className="text-sm font-medium text-slate-700 font-mono">
              Avance_{monografista.ultimoAvance.replace(' ', '')}.pdf
            </div>

            <div className="text-xs text-slate-400">
              4.2 MB · Subido el {monografista.fecha}
            </div>

          </div>

          <button className="ml-auto text-xs font-semibold text-blue-600 hover:text-blue-700">
            Visualizar
          </button>

        </div>

        <div className="mb-5">

          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Retroalimentación
          </label>

          <textarea
            rows={4}
            placeholder="Escriba sus comentarios y observaciones para el monografista..."
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none bg-slate-50"
          />

        </div>

        {actionResult ? (

          <div
            className={`rounded-xl p-4 flex items-center gap-3 ${
              actionResult === 'aprobado'
                ? 'bg-emerald-50 border border-emerald-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >

            {actionResult === 'aprobado' ? (
              <Check size={18} className="text-emerald-600" />
            ) : (
              <X size={18} className="text-red-500" />
            )}

            <div>

              <div
                className={`font-semibold text-sm ${
                  actionResult === 'aprobado'
                    ? 'text-emerald-700'
                    : 'text-red-700'
                }`}
              >
                Avance {actionResult}
              </div>

              <div className="text-xs text-slate-500">
                Estado actualizado correctamente
              </div>

            </div>

          </div>

        ) : (

          <div className="flex gap-3">

            <button
              onClick={onReject}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors"
            >
              <X size={15} />
              RECHAZAR
            </button>

            <button
              onClick={onApprove}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors"
            >
              <Check size={15} />
              APROBAR
            </button>

          </div>

        )}

      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6">

        <h4 className="font-semibold text-slate-800 mb-4">
          Historial de avances
        </h4>

        <div className="space-y-3">

          {[
            {
              avance: 'Propuesta',
              fecha: '14 Mar 2026',
              estado: 'Aprobado',
            },
            {
              avance: 'Avance 1',
              fecha: '18 Abr 2026',
              estado: 'Aprobado',
            },
            {
              avance: 'Avance 2',
              fecha: '12 Jun 2026',
              estado: 'En revisión',
            },
          ].map(item => (

            <div
              key={item.avance}
              className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl"
            >

              <div className="text-sm font-mono text-slate-600 w-28">
                {item.avance}
              </div>

              <div className="text-xs text-slate-400 font-mono flex-1">
                {item.fecha}
              </div>

              <StatusBadge status={item.estado} />

            </div>

          ))}

        </div>

      </div>

    </div>
  )
}


/* =========================================================
   INFO ROW
========================================================= */

function InfoRow({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="flex gap-4">

      <span className="text-xs text-slate-400 w-32 shrink-0 font-mono">
        {label}
      </span>

      <span className="text-sm text-slate-700">
        {value}
      </span>

    </div>
  )
}


/* =========================================================
   CALENDARIO
========================================================= */

function CalendarioTutor() {
  return (
    <div className="space-y-5">

      <h2 className="font-serif text-xl text-slate-800">
        Calendario
      </h2>

      <div className="bg-white rounded-2xl border border-slate-100 p-6">

        <h3 className="font-semibold text-slate-800 mb-5">
          Defensas programadas — Septiembre 2026
        </h3>

        <div className="space-y-3">

          {[
            {
              fecha: '22 Sep',
              nombre: 'Luis Ramírez Torres',
              hora: '10:00 AM',
              lugar: 'Aula 301',
            },
            {
              fecha: '29 Sep',
              nombre: 'Ana García Pérez',
              hora: '09:00 AM',
              lugar: 'Aula 305',
            },
          ].map(({ fecha, nombre, hora, lugar }) => (

            <div
              key={nombre}
              className="flex gap-4 p-4 rounded-xl border border-slate-100 hover:bg-slate-50"
            >

              <div className="text-center w-14">

                <div className="text-xs text-slate-400 font-mono">
                  SEP
                </div>

                <div className="text-2xl font-bold text-emerald-600 font-mono leading-none">
                  {fecha.split(' ')[0]}
                </div>

              </div>

              <div>

                <div className="font-medium text-slate-700 text-sm">
                  {nombre}
                </div>

                <div className="text-xs text-slate-400 font-mono mt-0.5">
                  {hora} · {lugar}
                </div>

              </div>

              <StatusBadge status="Programada" />

            </div>

          ))}

        </div>

      </div>

    </div>
  )
}


/* =========================================================
   NOTIFICACIONES
========================================================= */

function NotificacionesTutor() {
  return (
    <div className="space-y-5">

      <h2 className="font-serif text-xl text-slate-800">
        Notificaciones
      </h2>

      <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-50">

        {[
          {
            titulo: 'Nuevo avance recibido',
            desc: 'Carmen Flores Díaz ha enviado el Avance 3',
            tiempo: 'Hace 2 horas',
            leido: false,
          },
          {
            titulo: 'Recordatorio de revisión',
            desc: 'Ana García Pérez lleva 5 días en revisión',
            tiempo: 'Hace 1 día',
            leido: false,
          },
          {
            titulo: 'Defensa programada',
            desc: 'Luis Ramírez Torres tiene defensa el 22 de agosto',
            tiempo: 'Hace 3 días',
            leido: true,
          },
        ].map(({ titulo, desc, tiempo, leido }) => (

          <div
            key={titulo}
            className={`flex gap-4 p-5 ${
              !leido ? 'bg-emerald-50/40' : ''
            }`}
          >

            <div
              className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                !leido
                  ? 'bg-emerald-500'
                  : 'bg-slate-200'
              }`}
            />

            <div>

              <div className="font-medium text-slate-700 text-sm">
                {titulo}
              </div>

              <div className="text-xs text-slate-500 mt-0.5">
                {desc}
              </div>

              <div className="text-xs text-slate-400 font-mono mt-1">
                {tiempo}
              </div>

            </div>

          </div>

        ))}

      </div>

    </div>
  )
}


/* =========================================================
   PERFIL
========================================================= */

function PerfilTutor() {
  return (
    <div className="space-y-5 max-w-xl">

      <h2 className="font-serif text-xl text-slate-800">
        Perfil
      </h2>

      <div className="bg-white rounded-2xl border border-slate-100 p-6">

        <div className="flex items-center gap-4 mb-6">

          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-700 font-bold text-2xl">
            C
          </div>

          <div>

            <div className="font-semibold text-slate-800 text-lg">
              Dr. Carlos Mendoza Ríos
            </div>

            <div className="text-sm text-slate-500">
              Tutor académico
            </div>

            <StatusBadge status="Aprobado" />

          </div>

        </div>

        <div className="space-y-3">

          {[
            ['Correo', 'c.mendoza@sigmo.edu'],
            ['Departamento', 'Administración y Negocios'],
            ['Especialidad', 'Gestión Empresarial y TI'],
            ['Monografistas asignados', '5'],
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