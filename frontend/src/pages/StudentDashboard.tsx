import { useState } from 'react'
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
} from 'lucide-react'

import StatusBadge from '../components/StatusBadge'
import Modal from '../components/Modal'

interface Props {
  onLogout: () => void
}

type Section =
  | 'inicio'
  | 'monografia'
  | 'avances'
  | 'calendario'

const navItems = [
  {
    id: 'inicio' as Section,
    label: 'Inicio',
    icon: Home,
  },
  {
    id: 'monografia' as Section,
    label: 'Mi Monografía',
    icon: FileText,
  },
  {
    id: 'avances' as Section,
    label: 'Avances',
    icon: TrendingUp,
  },
  {
    id: 'calendario' as Section,
    label: 'Calendario de Defensa',
    icon: Calendar,
  },
]

/* =========================================================
   ETAPAS DE LA MONOGRAFÍA
========================================================= */

const etapas = [
  {
    name: 'Propuesta',
    status: 'Aprobado',
    date: '14 Mar 2026',
    desc: 'Aprobada por tutor asignado',
  },
  {
    name: 'Avance 1',
    status: 'Aprobado',
    date: '18 Abr 2026',
    desc: 'Marco teórico completado',
  },
  {
    name: 'Avance 2',
    status: 'En revisión',
    date: '12 Jun 2026',
    desc: 'Metodología en revisión',
  },
  {
    name: 'Avance 3',
    status: 'Pendiente',
    date: '—',
    desc: 'Pendiente de envío',
  },
  {
    name: 'Documento final',
    status: 'Pendiente',
    date: '—',
    desc: 'Pendiente de envío',
  },
  {
    name: 'Defensa',
    status: 'Pendiente',
    date: '—',
    desc: 'Pendiente de programar',
  },
]

/* =========================================================
   AVANCES INICIALES
   El documento pertenece directamente al avance
========================================================= */

const initialAvances = [
  {
    id: 1,
    tipo: 'Propuesta',
    descripcion: 'Propuesta inicial de investigación',
    fecha: '14 Mar 2026',
    estado: 'Aprobado',
    comentario: 'Excelente propuesta, bien estructurada.',
    archivo: 'Propuesta_MonografiaFinal.pdf',
    tamaño: '2.4 MB',
  },
  {
    id: 2,
    tipo: 'Avance 1',
    descripcion: 'Marco teórico y antecedentes',
    fecha: '18 Abr 2026',
    estado: 'Aprobado',
    comentario:
      'Marco teórico sólido. Continúe con la metodología.',
    archivo: 'Avance1_MarcoTeorico.pdf',
    tamaño: '5.1 MB',
  },
  {
    id: 3,
    tipo: 'Avance 2',
    descripcion: 'Metodología de investigación',
    fecha: '12 Jun 2026',
    estado: 'En revisión',
    comentario: '',
    archivo: 'Avance2_Metodologia.pdf',
    tamaño: '3.8 MB',
  },
]

/* =========================================================
   DASHBOARD DEL ESTUDIANTE
========================================================= */

export default function StudentDashboard({
  onLogout,
}: Props) {
  const [section, setSection] = useState<Section>('inicio')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  const [avances, setAvances] = useState(initialAvances)

  const [form, setForm] = useState({
    tipo: 'Avance 3',
    descripcion: '',
    archivo: '',
  })

  /* =======================================================
     SUBIR AVANCE
  ======================================================= */

  const submitAvance = () => {
    if (!form.descripcion || !form.archivo) return

    setAvances((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        tipo: form.tipo,
        descripcion: form.descripcion,
        fecha: new Date().toLocaleDateString('es-NI', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        estado: 'En revisión',
        comentario: '',
        archivo: form.archivo,
        tamaño: '3.2 MB',
      },
    ])

    setForm({
      tipo: 'Avance 3',
      descripcion: '',
      archivo: '',
    })

    setModalOpen(false)
  }

  return (
    <div className="h-full flex bg-slate-50">

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-64
          bg-white border-r border-slate-100
          flex flex-col
          transition-transform duration-300
          lg:static lg:translate-x-0
          ${
            sidebarOpen
              ? 'translate-x-0'
              : '-translate-x-full'
          }
        `}
      >

        {/* Logo */}
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">

            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-sm font-mono">
                S
              </span>
            </div>

            <div>
              <div className="font-bold text-slate-800 text-sm">
                SIGMO
              </div>

              <div className="text-xs text-blue-600 font-mono">
                Estudiante
              </div>
            </div>

          </div>
        </div>

        {/* Información del estudiante */}
        <div className="p-4 border-b border-slate-100">
          <div className="bg-blue-50 rounded-xl p-3">

            <div className="text-xs text-slate-500 mb-0.5">
              Monografista
            </div>

            <div className="font-semibold text-slate-800 text-sm">
              Ana García Pérez
            </div>

            <div className="text-xs text-blue-600 font-mono mt-1">
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
                onClick={() => {
                  setSection(id)
                  setSidebarOpen(false)
                }}
                className={`
                  w-full flex items-center gap-3
                  px-3 py-2.5 rounded-xl
                  text-sm transition-colors
                  ${
                    section === id
                      ? 'bg-blue-600 text-white font-medium'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                  }
                `}
              >
                <Icon size={16} />
                {label}
              </button>
            )
          )}

        </nav>

        {/* Opciones inferiores */}
        <div className="p-3 border-t border-slate-100 space-y-1">

          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut size={16} />
            Cerrar sesión
          </button>

        </div>

      </aside>

      {/* Fondo del menú móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* =================================================
          CONTENIDO PRINCIPAL
      ================================================= */}

      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
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
                  (n) => n.id === section
                )?.label
              }
            </h1>

          </div>

          <div className="flex items-center gap-2">

            <button className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500">
              <Bell size={18} />

              <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full" />
            </button>

            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-sm font-semibold">
              A
            </div>

          </div>

        </header>

        {/* Contenido */}
        <main className="flex-1 overflow-y-auto p-6">

          {section === 'inicio' && (
            <InicioStudent />
          )}

          {section === 'monografia' && (
            <MiMonografia />
          )}

          {section === 'avances' && (
            <Avances
              avances={avances}
              onUpload={() => setModalOpen(true)}
            />
          )}

          {section === 'calendario' && (
            <CalendarioDefensa />
          )}

        </main>

      </div>

      {/* =================================================
          MODAL PARA SUBIR AVANCE
      ================================================= */}

      <Modal
        open={modalOpen}
        title="Subir avance"
        onClose={() => setModalOpen(false)}
      >

        <div className="space-y-4">

          {/* Tipo */}
          <div>

            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Tipo de avance
            </label>

            <select
              value={form.tipo}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  tipo: e.target.value,
                }))
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
            >
              {[
                'Avance 3',
                'Documento final',
              ].map((tipo) => (
                <option key={tipo}>
                  {tipo}
                </option>
              ))}
            </select>

          </div>

          {/* Descripción */}
          <div>

            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Descripción
            </label>

            <textarea
              value={form.descripcion}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  descripcion: e.target.value,
                }))
              }
              rows={3}
              placeholder="Describa brevemente el contenido de este avance..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 resize-none"
            />

          </div>

          {/* Archivo */}
          <div>

            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Seleccionar archivo
            </label>

            <div
              className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-blue-300 transition-colors cursor-pointer"
              onClick={() =>
                setForm((f) => ({
                  ...f,
                  archivo: 'Avance3_Resultados.pdf',
                }))
              }
            >

              <Upload
                size={20}
                className="mx-auto text-slate-400 mb-2"
              />

              <p className="text-sm text-slate-500">
                Haz clic para seleccionar
              </p>

              <p className="text-xs text-slate-400 mt-1">
                PDF, DOCX hasta 50 MB
              </p>

            </div>

            {form.archivo && (
              <div className="mt-2 flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-2">

                <FileText
                  size={14}
                  className="text-blue-500"
                />

                <span className="text-sm text-blue-700 font-mono">
                  {form.archivo}
                </span>

                <span className="text-xs text-blue-400 ml-auto">
                  3.2 MB
                </span>

              </div>
            )}

          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-2">

            <button
              onClick={() => setModalOpen(false)}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>

            <button
              onClick={submitAvance}
              disabled={
                !form.descripcion ||
                !form.archivo
              }
              className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              Enviar avance
            </button>

          </div>

        </div>

      </Modal>

    </div>
  )
}

/* =========================================================
   INICIO
========================================================= */

function InicioStudent() {
  return (
    <div className="space-y-6">

      {/* Indicadores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {[
          {
            label: 'Estado actual',
            value: 'En revisión',
            icon: Clock,
            color: 'text-orange-500',
            bg: 'bg-orange-50',
          },
          {
            label: 'Etapa actual',
            value: 'Avance 2',
            icon: TrendingUp,
            color: 'text-blue-500',
            bg: 'bg-blue-50',
          },
          {
            label: 'Avances entregados',
            value: '3 / 6',
            icon: CheckCircle,
            color: 'text-emerald-500',
            bg: 'bg-emerald-50',
          },
          {
            label: 'Tareas pendientes',
            value: '2',
            icon: AlertCircle,
            color: 'text-amber-500',
            bg: 'bg-amber-50',
          },
        ].map(
          ({
            label,
            value,
            icon: Icon,
            color,
            bg,
          }) => (
            <div
              key={label}
              className="bg-white rounded-2xl border border-slate-100 p-5"
            >

              <div className="flex items-center justify-between mb-3">

                <span className="text-xs text-slate-500">
                  {label}
                </span>

                <div
                  className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center`}
                >
                  <Icon
                    size={16}
                    className={color}
                  />
                </div>

              </div>

              <div className="font-bold text-slate-800 text-lg">
                {value}
              </div>

            </div>
          )
        )}

      </div>

      {/* Información */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-6">

          <h3 className="font-semibold text-slate-800 mb-1">
            Mi monografía
          </h3>

          <p className="text-xs text-slate-400 font-mono mb-4">
            Datos generales
          </p>

          <div className="space-y-3">

            <InfoRow
              label="Título"
              value="Impacto de las tecnologías de información en la gestión empresarial de PyMEs en Lima, 2026"
            />

            <InfoRow
              label="Tutor asignado"
              value="Dr. Carlos Mendoza Ríos"
            />

            <InfoRow
              label="Carrera"
              value="Administración de Empresas"
            />

            <InfoRow
              label="Estado general"
              value={
                <StatusBadge status="En revisión" />
              }
            />

            <InfoRow
              label="Ciclo"
              value="2024-II"
            />

          </div>

        </div>

        <div className="space-y-4">

          {/* Próximo evento */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">

            <h4 className="font-semibold text-slate-800 text-sm mb-3">
              Próximo evento
            </h4>

            <div className="bg-blue-50 rounded-xl p-4">

              <div className="text-xs text-blue-500 font-mono mb-1">
                PENDIENTE DE PROGRAMAR
              </div>

              <div className="font-semibold text-slate-800 text-sm">
                Defensa de monografía
              </div>

              <div className="text-xs text-slate-500 mt-1">
                Sujeto a aprobación de documento final
              </div>

            </div>

          </div>

          {/* Última actividad */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">

            <h4 className="font-semibold text-slate-800 text-sm mb-3">
              Última actividad
            </h4>

            <div className="space-y-2.5">

              {[
                {
                  texto: 'Avance 2 enviado a revisión',
                  tiempo: 'Hace 2 días',
                },
                {
                  texto: 'Avance 1 aprobado por tutor',
                  tiempo: 'Hace 2 meses',
                },
              ].map(
                ({ texto, tiempo }) => (
                  <div
                    key={texto}
                    className="flex gap-3"
                  >

                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />

                    <div>

                      <div className="text-xs text-slate-700">
                        {texto}
                      </div>

                      <div className="text-xs text-slate-400 font-mono">
                        {tiempo}
                      </div>

                    </div>

                  </div>
                )
              )}

            </div>

          </div>

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
  value: React.ReactNode
}) {
  return (
    <div className="flex gap-4">

      <span className="text-xs text-slate-400 w-28 shrink-0 font-mono">
        {label}
      </span>

      <span className="text-sm text-slate-700">
        {value}
      </span>

    </div>
  )
}

/* =========================================================
   MI MONOGRAFÍA
========================================================= */

function MiMonografia() {

  const statusColor: Record<
    string,
    string
  > = {
    Aprobado: 'bg-emerald-500',
    'En revisión': 'bg-orange-400',
    Pendiente: 'bg-slate-300',
    Rechazado: 'bg-red-500',
    Enviado: 'bg-blue-500',
  }

  return (
    <div className="space-y-6">

      {/* Datos generales */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">

        <h2 className="font-serif text-xl text-slate-800 mb-1">
          Mi Monografía
        </h2>

        <p className="text-sm text-slate-500 mb-5">
          Línea de Tiempo de Etapas
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">

          <InfoRow
            label="Título"
            value="Impacto de las TI en PyMEs de Lima"
          />

          <InfoRow
            label="Tutor"
            value="Dr. Carlos Mendoza Ríos"
          />

          <InfoRow
            label="Carrera"
            value="Administración de Empresas"
          />

          <InfoRow
            label="Estado"
            value={
              <StatusBadge status="En revisión" />
            }
          />

        </div>

      </div>

      {/* Progreso */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">

        <h3 className="font-semibold text-slate-800 mb-6">
          Progreso de etapas
        </h3>

        <div className="relative">

          <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-slate-100" />

          <div className="space-y-6">

            {etapas.map(
              (etapa, i) => (
                <div
                  key={i}
                  className="relative flex gap-5"
                >

                  <div
                    className={`
                      relative z-10 w-10 h-10
                      rounded-full flex items-center
                      justify-center shrink-0
                      ${statusColor[etapa.status]}
                      shadow-sm
                    `}
                  >

                    {etapa.status === 'Aprobado' ? (
                      <CheckCircle
                        size={16}
                        className="text-white"
                      />
                    ) : etapa.status ===
                      'En revisión' ? (
                      <Clock
                        size={16}
                        className="text-white"
                      />
                    ) : (
                      <span className="text-white text-xs font-bold font-mono">
                        {i + 1}
                      </span>
                    )}

                  </div>

                  <div className="bg-slate-50 rounded-xl p-4 flex-1">

                    <div className="flex items-center justify-between flex-wrap gap-2">

                      <div>

                        <div className="font-semibold text-slate-800 text-sm">
                          {etapa.name}
                        </div>

                        <div className="text-xs text-slate-500 mt-0.5">
                          {etapa.desc}
                        </div>

                      </div>

                      <div className="text-right">

                        <StatusBadge
                          status={etapa.status}
                        />

                        <div className="text-xs text-slate-400 font-mono mt-1">
                          {etapa.date}
                        </div>

                      </div>

                    </div>

                  </div>

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
   AVANCES
   Aquí se muestran también los documentos
========================================================= */

function Avances({
  avances,
  onUpload,
}: {
  avances: typeof initialAvances
  onUpload: () => void
}) {

  return (
    <div className="space-y-5">

      {/* Encabezado */}
      <div className="flex items-center justify-between">

        <div>

          <h2 className="font-serif text-xl text-slate-800">
            Avances
          </h2>

          <p className="text-sm text-slate-500">
            Historial de entregas de la monografía
          </p>

        </div>

        <button
          onClick={onUpload}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          <Upload size={15} />
          Subir avance
        </button>

      </div>

      {/* Lista */}
      <div className="space-y-4">

        {avances.map((a) => (

          <div
            key={a.id}
            className="bg-white rounded-2xl border border-slate-100 p-5"
          >

            {/* Información del avance */}
            <div className="flex items-start justify-between gap-4">

              <div>

                <div className="flex items-center gap-3 flex-wrap">

                  <h3 className="font-semibold text-slate-800">
                    {a.tipo}
                  </h3>

                  <StatusBadge
                    status={a.estado}
                  />

                </div>

                <p className="text-sm text-slate-600 mt-2">
                  {a.descripcion}
                </p>

                <p className="text-xs text-slate-400 font-mono mt-2">
                  Entregado: {a.fecha}
                </p>

              </div>

            </div>

            {/* Documento asociado */}
            {a.archivo && (

              <div className="mt-4 pt-4 border-t border-slate-100">

                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Documento entregado
                </p>

                <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">

                  <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">

                    <FileText
                      size={17}
                      className="text-blue-500"
                    />

                  </div>

                  <div className="min-w-0">

                    <p className="text-sm text-slate-700 font-medium truncate">
                      {a.archivo}
                    </p>

                    <p className="text-xs text-slate-400 mt-0.5">
                      {a.tamaño}
                    </p>

                  </div>

                  <div className="ml-auto flex gap-2">

                    <button
                      className="p-2 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
                      title="Ver documento"
                    >
                      <Eye size={15} />
                    </button>

                    <button
                      className="p-2 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors"
                      title="Descargar documento"
                    >
                      <Download size={15} />
                    </button>

                  </div>

                </div>

              </div>

            )}

            {/* Comentario del tutor */}
            {a.comentario && (

              <div className="mt-4 bg-blue-50 rounded-xl p-3">

                <p className="text-xs font-semibold text-blue-600 mb-1">
                  Comentario del tutor
                </p>

                <p className="text-sm text-slate-600">
                  {a.comentario}
                </p>

              </div>

            )}

          </div>

        ))}

      </div>

    </div>
  )
}

/* =========================================================
   CALENDARIO DE DEFENSA
========================================================= */

function CalendarioDefensa() {

  const days = Array.from(
    { length: 30 },
    (_, i) => i + 1
  )

  const startDay = 2

  return (
    <div className="space-y-5">

      <h2 className="font-serif text-xl text-slate-800">
        Calendario de Defensa
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Calendario */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-6">

          <div className="flex items-center justify-between mb-5">

            <h3 className="font-semibold text-slate-800">
              Septiembre 2026
            </h3>

            <div className="flex gap-1">

              <button
                className="w-7 h-7 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 text-xs"
              >
                ‹
              </button>

              <button
                className="w-7 h-7 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 text-xs"
              >
                ›
              </button>

            </div>

          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">

            {[
              'L',
              'M',
              'X',
              'J',
              'V',
              'S',
              'D',
            ].map((d) => (

              <div
                key={d}
                className="text-center text-xs font-semibold text-slate-400 py-1"
              >
                {d}
              </div>

            ))}

          </div>

          <div className="grid grid-cols-7 gap-1">

            {Array.from({
              length: startDay - 1,
            }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {days.map((d) => (

              <button
                key={d}
                className={`
                  aspect-square rounded-xl text-xs
                  flex items-center justify-center
                  transition-colors
                  ${
                    d === 22
                      ? 'bg-blue-600 text-white font-bold shadow-md'
                      : 'hover:bg-slate-100 text-slate-600'
                  }
                `}
              >
                {d}
              </button>

            ))}

          </div>

          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100">

            <div className="flex items-center gap-1.5">

              <div className="w-3 h-3 rounded bg-blue-600" />

              <span className="text-xs text-slate-500">
                Defensa programada
              </span>

            </div>

          </div>

        </div>

        {/* Información */}
        <div className="space-y-4">

          {/* Estado */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">

            <div className="text-xs text-slate-400 font-mono mb-1">
              ESTADO
            </div>

            <StatusBadge status="Pendiente" />

            <p className="text-xs text-slate-500 mt-3">
              La defensa será programada una vez aprobado el documento final.
            </p>

          </div>

          {/* Información tentativa */}
          <div className="bg-blue-50 rounded-2xl border border-blue-100 p-5">

            <div className="text-xs text-blue-500 font-mono mb-3">
              INFORMACIÓN TENTATIVA
            </div>

            <div className="space-y-3">

              {[
                {
                  label: 'Fecha',
                  value: '22 de Septiembre, 2026',
                },
                {
                  label: 'Hora',
                  value: '10:00 AM',
                },
                {
                  label: 'Lugar',
                  value: 'Aula 305 — Edificio A',
                },
                {
                  label: 'Modalidad',
                  value: 'Presencial',
                },
              ].map(({ label, value }) => (

                <div key={label}>

                  <div className="text-xs text-blue-400 font-mono">
                    {label}
                  </div>

                  <div className="text-sm font-medium text-slate-700">
                    {value}
                  </div>

                </div>

              ))}

            </div>

          </div>

          {/* Jurado */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">

            <div className="text-xs text-slate-400 font-mono mb-3">
              JURADO ASIGNADO
            </div>

            <div className="space-y-2">

              {[
                {
                  nombre: 'Dra. María López',
                  rol: 'Presidenta',
                },
                {
                  nombre: 'Mg. Pedro Torres',
                  rol: 'Secretario',
                },
                {
                  nombre: 'Lic. Rosa Quispe',
                  rol: 'Vocal',
                },
              ].map(({ nombre, rol }) => (

                <div
                  key={nombre}
                  className="flex items-center gap-3"
                >

                  <div className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center text-xs font-bold text-slate-500">
                    {nombre[0]}
                  </div>

                  <div>

                    <div className="text-xs font-medium text-slate-700">
                      {nombre}
                    </div>

                    <div className="text-xs text-slate-400 font-mono">
                      {rol}
                    </div>

                  </div>

                </div>

              ))}

            </div>

          </div>

        </div>

      </div>

    </div>
  )
}