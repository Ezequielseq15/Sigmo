type Status = 'Pendiente' | 'Enviado' | 'En revisión' | 'Aprobado' | 'Rechazado' | string

const styles: Record<string, string> = {
  'Pendiente': 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  'Enviado': 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  'En revisión': 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
  'Aprobado': 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  'Rechazado': 'bg-red-50 text-red-700 ring-1 ring-red-200',
  'En proceso': 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  'Programada': 'bg-purple-50 text-purple-700 ring-1 ring-purple-200',
}

const dots: Record<string, string> = {
  'Pendiente': 'bg-amber-400',
  'Enviado': 'bg-blue-500',
  'En revisión': 'bg-orange-400',
  'Aprobado': 'bg-emerald-500',
  'Rechazado': 'bg-red-500',
  'En proceso': 'bg-blue-500',
  'Programada': 'bg-purple-500',
}

export default function StatusBadge({ status }: { status: Status }) {
  const cls = styles[status] ?? 'bg-slate-50 text-slate-600 ring-1 ring-slate-200'
  const dot = dots[status] ?? 'bg-slate-400'
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium font-mono ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {status}
    </span>
  )
}
