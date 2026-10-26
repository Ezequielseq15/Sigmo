import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Calendar, Check, Loader2, Pencil, RefreshCw, X } from 'lucide-react'
import { API_URL, apiFetch } from '../config/api'

type Role = 'ESTUDIANTE' | 'TUTOR' | 'COORDINADOR'
type MonografiaBase = { id_monografia: number; titulo: string }
type DefenseHistory = {
  id_historial: number
  accion: string
  fecha_evento: string
  coordinador_nombre?: string
  coordinador_apellido?: string
}
type DefenseRow = {
  id_monografia: number
  titulo: string
  carnet?: string
  estudiante_nombre?: string
  estudiante_apellido?: string
  tutor_nombre?: string | null
  tutor_apellido?: string | null
  estado_protocolo?: string | null
  tutor_confirmo?: boolean
  confirmacion_vigente?: boolean
  id_defensa?: number | null
  fecha?: string | null
  hora?: string | null
  lugar?: string | null
  estado_defensa?: string | null
  estado?: string | null
  observaciones?: string | null
  defensa?: DefenseRow | null
  protocolo_aprobado?: boolean
  puede_programar?: boolean
  historial_defensas?: DefenseHistory[]
}

async function readApiJson(response: Response): Promise<Record<string, unknown>> {
  const value: unknown = await response.json().catch(() => ({}))
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

function apiMessage(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value : fallback
}

interface Props {
  role: Role
  monografias?: MonografiaBase[]
}

const emptyForm = { fecha: '', hora: '', lugar: '', observaciones: '' }

function todayLocal(): string {
  const date = new Date()
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export default function DefensaPanel({ role, monografias = [] }: Props) {
  const monografiaKey = monografias.map(item => `${item.id_monografia}:${item.titulo}`).join('|')
  const [rows, setRows] = useState<DefenseRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      if (role === 'COORDINADOR') {
        const response = await apiFetch(`${API_URL}/api/defensas/gestion`)
        const data = await readApiJson(response)
        if (!response.ok) throw new Error(apiMessage(data.message, 'No se pudieron cargar las defensas.'))
        setRows(Array.isArray(data.defensas) ? data.defensas as DefenseRow[] : [])
      } else {
        const results = await Promise.all(monografias.map(async (monografia) => {
          const response = await apiFetch(`${API_URL}/api/defensas/monografia/${monografia.id_monografia}`)
          const data = await readApiJson(response)
          if (!response.ok) throw new Error(apiMessage(data.message, 'No se pudo consultar una defensa.'))
          return {
            id_monografia: monografia.id_monografia,
            titulo: monografia.titulo,
            defensa: typeof data.defensa === 'object' && data.defensa !== null
              ? data.defensa as DefenseRow
              : null,
            tutor_confirmo: data.tutor_confirmo === true,
            protocolo_aprobado: data.protocolo_aprobado === true,
          } as DefenseRow
        }))
        setRows(results)
      }
    } catch (err) {
      setRows([])
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las defensas.')
    } finally {
      setLoading(false)
    }
  // Depend on the serialized ids/titles so inline parent arrays don't trigger refetch loops.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, monografiaKey])

  useEffect(() => { void load() }, [load])

  const eligible = useMemo(
    () => rows.filter(row => row.puede_programar === true),
    [rows]
  )

  const schedule = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true); setError(''); setNotice('')
    try {
      const editing = editingId !== null
      const response = await apiFetch(
        editing ? `${API_URL}/api/defensas/${editingId}` : `${API_URL}/api/defensas`,
        {
          method: editing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editing ? form : { ...form, id_monografia: Number(selectedId) }),
        }
      )
      const data = await readApiJson(response)
      if (!response.ok) throw new Error(apiMessage(data.message, 'No se pudo guardar la programación.'))
      setForm(emptyForm); setSelectedId(''); setEditingId(null)
      setNotice(editing ? 'Defensa actualizada.' : 'Defensa programada.')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la programación.')
    } finally { setSaving(false) }
  }

  const cancel = async (id: number) => {
    if (!window.confirm('¿Cancelar esta defensa?')) return
    setSaving(true); setError(''); setNotice('')
    try {
      const response = await apiFetch(`${API_URL}/api/defensas/${id}/cancelar`, { method: 'PATCH' })
      const data = await readApiJson(response)
      if (!response.ok) throw new Error(apiMessage(data.message, 'No se pudo cancelar la defensa.'))
      setNotice('Defensa cancelada.')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cancelar la defensa.')
    } finally { setSaving(false) }
  }

  const setTutorConfirmation = async (row: DefenseRow, confirmada: boolean) => {
    setSaving(true); setError(''); setNotice('')
    try {
      const response = await apiFetch(`${API_URL}/api/defensas/monografia/${row.id_monografia}/confirmacion`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmada }),
      })
      const data = await readApiJson(response)
      if (!response.ok) throw new Error(apiMessage(data.message, 'No se pudo registrar la confirmación.'))
      setNotice(confirmada ? 'Confirmaste que la monografía está lista para defensa.' : 'Retiraste la confirmación.')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar la confirmación.')
    } finally { setSaving(false) }
  }

  const beginEdit = (row: DefenseRow) => {
    if (!row.id_defensa) return
    setEditingId(row.id_defensa)
    setForm({
      fecha: String(row.fecha || '').slice(0, 10),
      hora: String(row.hora || '').slice(0, 5),
      lugar: row.lugar || '',
      observaciones: row.observaciones || '',
    })
  }

  return <section className="space-y-5">
    <header className="flex items-center gap-3">
      <Calendar className="text-blue-600" />
      <div className="flex-1"><h2 className="text-xl font-bold text-slate-800">Calendario de defensas</h2>
        <p className="text-sm text-slate-500">Programación y consulta de defensas de monografías.</p></div>
      <button type="button" onClick={() => void load()} disabled={loading || saving} aria-label="Actualizar defensas" className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm text-slate-700 disabled:opacity-50">
        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />Actualizar
      </button>
    </header>
    {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {notice && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</p>}
    {loading ? <div className="flex items-center gap-2 text-slate-500"><Loader2 className="animate-spin" size={18} />Cargando…</div> : <>
      {role === 'COORDINADOR' && <form onSubmit={schedule} className="grid gap-3 rounded-xl border bg-white p-5 md:grid-cols-2">
        <h3 className="font-semibold md:col-span-2">{editingId ? 'Modificar defensa' : 'Programar defensa'}</h3>
        {!editingId && <label className="text-sm">Monografía elegible
          <select required value={selectedId} onChange={event => setSelectedId(event.target.value)} className="mt-1 w-full rounded-lg border p-2">
            <option value="">Selecciona una monografía</option>
            {eligible.map(row => <option key={row.id_monografia} value={row.id_monografia}>{row.titulo}</option>)}
          </select>
        </label>}
        {editingId && <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm) }} className="text-left text-sm text-slate-600">Dejar de modificar</button>}
        <label className="text-sm">Fecha<input type="date" required min={todayLocal()} value={form.fecha} onChange={event => setForm({ ...form, fecha: event.target.value })} className="mt-1 w-full rounded-lg border p-2" /></label>
        <label className="text-sm">Hora<input type="time" required value={form.hora} onChange={event => setForm({ ...form, hora: event.target.value })} className="mt-1 w-full rounded-lg border p-2" /></label>
        <label className="text-sm">Lugar<input maxLength={200} required value={form.lugar} onChange={event => setForm({ ...form, lugar: event.target.value })} className="mt-1 w-full rounded-lg border p-2" /></label>
        <label className="text-sm">Observaciones<textarea maxLength={4000} value={form.observaciones} onChange={event => setForm({ ...form, observaciones: event.target.value })} className="mt-1 w-full rounded-lg border p-2" /></label>
        <button disabled={saving || (!editingId && !selectedId)} className="rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white disabled:opacity-50 md:col-span-2">{saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Programar'}</button>
        {eligible.length === 0 && <p className="text-sm text-amber-700 md:col-span-2">No hay monografías que cumplan ambas condiciones: protocolo aprobado y confirmación vigente del tutor asignado.</p>}
      </form>}
      <div className="space-y-3">
        {rows.length === 0 && <p className="rounded-xl border bg-white p-5 text-sm text-slate-500">No hay monografías disponibles.</p>}
        {rows.map(row => {
          const defense = role === 'COORDINADOR' ? row : row.defensa
          const title = row.titulo
          const active = defense?.estado === 'PROGRAMADA' || defense?.estado_defensa === 'PROGRAMADA'
          return <article key={row.id_monografia} className="rounded-xl border bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><h3 className="font-semibold text-slate-800">{title}</h3>
                {role === 'COORDINADOR' && <p className="text-sm text-slate-500">Estudiante: {row.estudiante_nombre} {row.estudiante_apellido} · Tutor: {row.tutor_nombre || 'Sin asignar'} {row.tutor_apellido || ''}</p>}</div>
              {role === 'TUTOR' && row.protocolo_aprobado && <button disabled={saving || (!!row.defensa && row.defensa.estado === 'PROGRAMADA')} onClick={() => void setTutorConfirmation(row, !row.tutor_confirmo)} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm disabled:opacity-50">
                {row.tutor_confirmo ? <X size={16} /> : <Check size={16} />}{row.tutor_confirmo ? 'Retirar confirmación' : 'Confirmar lista para defensa'}
              </button>}
            </div>
            {defense?.id_defensa ? <div className="mt-3 rounded-lg bg-slate-50 p-4 text-sm">
              <p><strong>Fecha:</strong> {String(defense.fecha).slice(0, 10)} · <strong>Hora:</strong> {String(defense.hora).slice(0, 5)}</p>
              <p><strong>Lugar:</strong> {defense.lugar} · <strong>Estado:</strong> {defense.estado || defense.estado_defensa}</p>
              {defense.observaciones && <p className="mt-1"><strong>Observaciones:</strong> {defense.observaciones}</p>}
              {role === 'COORDINADOR' && active && <div className="mt-3 flex gap-2">
                <button onClick={() => beginEdit(row)} className="inline-flex items-center gap-1 rounded border px-3 py-1.5"><Pencil size={15} />Modificar</button>
                <button disabled={saving} onClick={() => void cancel(defense.id_defensa!)} className="rounded border border-red-200 px-3 py-1.5 text-red-700">Cancelar</button>
              </div>}
            </div> : <p className="mt-3 text-sm text-slate-500">Sin defensa programada.</p>}
            {role === 'COORDINADOR' && (row.historial_defensas?.length || 0) > 0 && <div className="mt-3 border-t pt-3">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Historial de programación</h4>
              <ul className="mt-2 space-y-1 text-xs text-slate-600">
                {row.historial_defensas!.map(item => <li key={item.id_historial}>
                  {new Date(item.fecha_evento).toLocaleString()} · {item.accion}
                  {item.coordinador_nombre ? ` · ${item.coordinador_nombre} ${item.coordinador_apellido || ''}` : ''}
                </li>)}
              </ul>
            </div>}
            {role === 'TUTOR' && !row.protocolo_aprobado && <p className="mt-3 text-sm text-slate-500">La confirmación estará disponible cuando el protocolo esté aprobado.</p>}
            {role === 'TUTOR' && row.protocolo_aprobado && <p className="mt-2 text-xs text-slate-500">Confirmación del tutor: {row.tutor_confirmo ? 'registrada' : 'pendiente'}.</p>}
          </article>
        })}
      </div>
    </>}
  </section>
}
