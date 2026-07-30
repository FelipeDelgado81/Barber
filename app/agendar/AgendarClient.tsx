'use client'

import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import BarberoSelector from '@/components/BarberoSelector'
import type { Barbero, Servicio, BarberoServicio } from '@/lib/types'

type Step = 'barbero' | 'servicio' | 'horario' | 'datos' | 'confirmacion'
type BarberoServicioConServicio = BarberoServicio & { servicios: Servicio }

const STEPS: { key: Step; label: string }[] = [
  { key: 'barbero', label: 'Barbero' },
  { key: 'servicio', label: 'Servicio' },
  { key: 'horario', label: 'Horario' },
  { key: 'datos', label: 'Datos' },
]

export default function AgendarClient() {
  const [step, setStep] = useState<Step>('barbero')
  const [selectedBarbero, setSelectedBarbero] = useState<Barbero | null>(null)
  const [servicios, setServicios] = useState<BarberoServicioConServicio[]>([])
  const [selectedServicio, setSelectedServicio] = useState<BarberoServicioConServicio | null>(null)
  const [fechasDisponibles, setFechasDisponibles] = useState<{ fecha: string; label: string; slots: string[] }[]>([])
  const [selectedFecha, setSelectedFecha] = useState<string>('')
  const [selectedHora, setSelectedHora] = useState<string>('')
  const [form, setForm] = useState({ nombre: '', telefono: '', email: '' })
  const [loading, setLoading] = useState(false)
  const [codigoGestion, setCodigoGestion] = useState('')
  const [error, setError] = useState('')

  const supabase = useMemo(() => createClient(), [])

  const stepIndex = STEPS.findIndex((s) => s.key === step)

  async function handleSelectBarbero(barbero: Barbero) {
    setSelectedBarbero(barbero)
    setStep('servicio')
    setLoading(true)
    const { data, error } = await supabase
      .from('barbero_servicios')
      .select('*, servicios(*)')
      .eq('barbero_id', barbero.id)
      .eq('servicios.activo', true)
    if (data) setServicios(data as unknown as BarberoServicioConServicio[])
    if (error) setError('No se pudieron cargar los servicios. Intenta nuevamente.')
    setLoading(false)
  }

  async function handleSelectServicio(bs: BarberoServicioConServicio) {
    setSelectedServicio(bs)
    setStep('horario')
    setLoading(true)

    const fechas: string[] = []
    const ahora = new Date()
    for (let i = 0; i < 7; i++) {
      const d = new Date(ahora)
      d.setDate(d.getDate() + i)
      if (d.getDay() !== 0) {
        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        fechas.push(`${year}-${month}-${day}`)
      }
    }

    const { data: bloqueos } = await supabase
      .from('bloqueos')
      .select('*')
      .eq('barbero_id', selectedBarbero!.id)
      .gte('fecha', fechas[0])
      .lte('fecha', fechas[fechas.length - 1])

    const { data: citas } = await supabase.rpc('horas_ocupadas', {
      p_barbero_id: selectedBarbero!.id,
      p_desde: fechas[0],
      p_hasta: fechas[fechas.length - 1],
    })

    const bloqueosMap = new Map<string, { inicio: string; fin: string }[]>()
    bloqueos?.forEach((b) => {
      if (!bloqueosMap.has(b.fecha)) bloqueosMap.set(b.fecha, [])
      bloqueosMap.get(b.fecha)!.push({ inicio: b.hora_inicio || '00:00', fin: b.hora_fin || '23:59' })
    })

    const citasMap = new Map<string, { inicio: string; fin: string }[]>()
    citas?.forEach((c: { fecha: string; hora_inicio: string; hora_fin: string }) => {
      if (!citasMap.has(c.fecha)) citasMap.set(c.fecha, [])
      citasMap.get(c.fecha)!.push({ inicio: c.hora_inicio, fin: c.hora_fin })
    })

    const fechasConSlots: { fecha: string; label: string; slots: string[] }[] = []

    for (const fecha of fechas) {
      const bloqueosDia = bloqueosMap.get(fecha) || []
      const citasDia = citasMap.get(fecha) || []
      const ocupado = (inicio: number, fin: number) =>
        bloqueosDia.some((b) => {
          const [h, m] = b.inicio.split(':').map(Number)
          const [fh, fm] = b.fin.split(':').map(Number)
          return inicio < fh * 60 + fm && fin > h * 60 + m
        }) ||
        citasDia.some((c) => {
          const [h, m] = c.inicio.split(':').map(Number)
          const [fh, fm] = c.fin.split(':').map(Number)
          return inicio < fh * 60 + fm && fin > h * 60 + m
        })

      const slots: string[] = []
      for (let h = 9; h < 19; h++) {
        const hh = `${String(h).padStart(2, '0')}:00`
        const inicio = h * 60
        const fin = inicio + bs.servicios.duracion_minutos
        const esHoy = fecha === fechas[0]
        const yaPaso = esHoy && inicio <= ahora.getHours() * 60 + ahora.getMinutes()
        if (fin <= 19 * 60 && !yaPaso && !ocupado(inicio, fin)) slots.push(hh)
      }

      if (slots.length > 0) {
        const label = new Date(fecha + 'T12:00:00').toLocaleDateString('es-CL', {
          weekday: 'short', day: 'numeric', month: 'short'
        })
        fechasConSlots.push({ fecha, label, slots })
      }
    }

    setFechasDisponibles(fechasConSlots)
    setLoading(false)
  }

  function handleSelectDate(fecha: string) {
    setSelectedFecha(fecha)
    setSelectedHora('')
  }

  function handleSelectHora(hora: string) {
    setSelectedHora(hora)
    setStep('datos')
  }

  async function handleConfirmar() {
    if (!form.nombre || !form.telefono || !form.email) {
      setError('Todos los campos son obligatorios')
      return
    }
    setLoading(true)
    setError('')

    const codigo = crypto.randomUUID()
    const horaFin = selectedServicio?.servicios
      ? (() => {
          const [h, m] = selectedHora.split(':').map(Number)
          const totalMin = h * 60 + m + selectedServicio.servicios.duracion_minutos
          return `${String(Math.floor(totalMin / 60)).padStart(2, '0')}:${String(totalMin % 60).padStart(2, '0')}`
        })()
      : selectedHora

    const { error: err } = await supabase.from('citas').insert({
      barbero_id: selectedBarbero!.id,
      servicio_id: selectedServicio!.servicio_id,
      cliente_nombre: form.nombre,
      cliente_telefono: form.telefono,
      cliente_email: form.email,
      fecha: selectedFecha,
      hora_inicio: selectedHora,
      hora_fin: horaFin,
      codigo_gestion: codigo,
      estado: 'pendiente',
    })

    if (err) {
      setError('Error al agendar. Intenta de nuevo.')
      setLoading(false)
      return
    }

    setCodigoGestion(codigo)
    setStep('confirmacion')
    setLoading(false)
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
      {step !== 'confirmacion' && (
        <div className="mb-10 flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <div
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold ${
                  i <= stepIndex
                    ? 'bg-amber-400 text-stone-950'
                    : 'bg-stone-200 text-stone-400'
                }`}
              >
                {i + 1}
              </div>
              <span
                className={`hidden text-xs font-semibold sm:block ${
                  i <= stepIndex ? 'text-stone-900' : 'text-stone-400'
                }`}
              >
                {s.label}
              </span>
              {i < STEPS.length - 1 && (
                <div className={`h-px w-6 ${i < stepIndex ? 'bg-amber-400' : 'bg-stone-200'}`} />
              )}
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {step === 'barbero' && (
        <div>
          <h2 className="text-2xl font-black text-stone-900">Elige tu barbero</h2>
          <p className="mt-1 text-sm text-stone-500">Selecciona con quién quieres agendar.</p>
          <div className="mt-6">
            <BarberoSelector
              onSelect={handleSelectBarbero}
              selectedId={selectedBarbero?.id}
            />
          </div>
        </div>
      )}

      {step === 'servicio' && (
        <div>
          <h2 className="text-2xl font-black text-stone-900">
            Elige tu servicio
          </h2>
          <p className="mt-1 text-sm text-stone-500">Con {selectedBarbero?.nombre}</p>
          <div className="mt-6 space-y-2">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 animate-pulse rounded-xl bg-stone-200" />
                ))}
              </div>
            ) : (
              servicios.map((bs) => (
                <button
                  key={bs.id}
                  onClick={() => handleSelectServicio(bs)}
                  className="flex w-full items-center justify-between rounded-xl border border-stone-200 bg-white px-5 py-4 text-left transition hover:border-amber-400 hover:shadow-sm"
                >
                  <div>
                    <p className="font-bold text-stone-900">{bs.servicios.nombre}</p>
                    <p className="mt-0.5 text-sm text-stone-500">{bs.servicios.duracion_minutos} min</p>
                  </div>
                  <span className="text-xl font-black text-amber-600">
                    ${bs.precio.toLocaleString('es-CL')}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {step === 'horario' && (
        <div>
          <h2 className="text-2xl font-black text-stone-900">Elige fecha y hora</h2>
          <p className="mt-1 text-sm text-stone-500">
            {selectedServicio?.servicios.nombre} · {selectedServicio?.servicios.duracion_minutos} min
          </p>

          {loading ? (
            <div className="mt-6 space-y-3">
              <div className="h-24 animate-pulse rounded-xl bg-stone-200" />
              <div className="h-12 animate-pulse rounded-xl bg-stone-200" />
            </div>
          ) : fechasDisponibles.length === 0 ? (
            <p className="mt-8 text-stone-500">No hay horarios disponibles en los próximos 7 días.</p>
          ) : !selectedFecha ? (
            <div className="mt-6">
              <p className="mb-4 text-sm font-semibold text-stone-500">DÍA</p>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {fechasDisponibles.map((fd) => (
                  <button
                    key={fd.fecha}
                    onClick={() => handleSelectDate(fd.fecha)}
                    className="flex shrink-0 flex-col items-center gap-1 rounded-xl border border-stone-200 bg-white px-4 py-3 transition hover:border-amber-400 hover:shadow-sm"
                  >
                    <span className="text-xs font-semibold uppercase text-stone-500">
                      {fd.label.split(' ')[0]}
                    </span>
                    <span className="text-2xl font-black text-stone-900">
                      {new Date(fd.fecha + 'T12:00:00').getDate()}
                    </span>
                    <span className="text-xs text-stone-500">
                      {new Date(fd.fecha + 'T12:00:00').toLocaleDateString('es-CL', { month: 'short' })}
                    </span>
                    <span className="mt-1 text-xs font-bold text-amber-600">
                      {fd.slots.length} {fd.slots.length === 1 ? 'horario' : 'horarios'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-6">
              <div className="mb-4 flex items-center gap-2">
                <button
                  onClick={() => setSelectedFecha('')}
                  className="grid h-8 w-8 place-items-center rounded-full border border-stone-200 text-sm text-stone-500 transition hover:border-stone-400"
                >
                  ←
                </button>
                <p className="text-sm font-semibold text-stone-900">
                  {new Date(selectedFecha + 'T12:00:00').toLocaleDateString('es-CL', {
                    weekday: 'long', day: 'numeric', month: 'long'
                  })}
                </p>
              </div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-stone-500">HORARIO</p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {fechasDisponibles
                  .find((fd) => fd.fecha === selectedFecha)
                  ?.slots.map((hora) => (
                    <button
                      key={hora}
                      onClick={() => handleSelectHora(hora)}
                      className="rounded-xl border border-stone-200 bg-white px-3 py-3 text-center text-sm font-bold text-stone-900 transition hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700"
                    >
                      {hora}
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {step === 'datos' && (
        <div>
          <h2 className="text-2xl font-black text-stone-900">Tus datos</h2>
          <p className="mt-1 text-sm text-stone-500">Completa tu información para confirmar la reserva.</p>

          <div className="mt-6 space-y-3 rounded-xl border border-stone-200 bg-stone-50 p-5">
            <div className="flex justify-between text-sm">
              <span className="text-stone-500">Barbero</span>
              <span className="font-bold text-stone-900">{selectedBarbero?.nombre}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-stone-500">Servicio</span>
              <span className="font-bold text-stone-900">{selectedServicio?.servicios.nombre}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-stone-500">Fecha</span>
              <span className="font-bold text-stone-900">
                {new Date(selectedFecha + 'T12:00:00').toLocaleDateString('es-CL', {
                  weekday: 'short', day: 'numeric', month: 'short'
                })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-stone-500">Hora</span>
              <span className="font-bold text-stone-900">{selectedHora}</span>
            </div>
            <div className="flex justify-between border-t border-stone-200 pt-3 text-sm">
              <span className="text-stone-500">Total</span>
              <span className="text-xl font-black text-amber-600">
                ${selectedServicio?.precio.toLocaleString('es-CL')}
              </span>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <input
              type="text"
              placeholder="Nombre completo"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className="w-full rounded-xl border border-stone-200 px-5 py-3 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
            />
            <input
              type="tel"
              placeholder="Teléfono"
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              className="w-full rounded-xl border border-stone-200 px-5 py-3 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
            />
            <input
              type="email"
              placeholder="Email (obligatorio)"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-xl border border-stone-200 px-5 py-3 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
            />
            <button
              onClick={handleConfirmar}
              disabled={loading}
              className="w-full rounded-full bg-amber-400 px-7 py-4 text-sm font-extrabold text-stone-950 transition hover:bg-amber-300 disabled:opacity-50"
            >
              {loading ? 'Confirmando...' : 'Confirmar Reserva'}
            </button>
          </div>
        </div>
      )}

      {step === 'confirmacion' && (
        <div className="text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-amber-100 text-4xl">
            ✓
          </div>
          <h2 className="mt-6 text-3xl font-black text-stone-900">¡Hora agendada!</h2>
          <p className="mt-2 text-stone-500">
            Tu código de gestión es:
          </p>
          <p className="mt-3 text-2xl font-black tracking-widest text-amber-600">
            {codigoGestion}
          </p>
          <p className="mt-6 text-sm text-stone-500">
            Recibirás la confirmación por email cuando se configure el servicio de notificaciones.
          </p>
          <p className="mt-1 text-sm text-stone-500">
            Puedes cancelar o reprogramar tu cita con este código.
          </p>
        </div>
      )}

      <div className="mt-8 flex gap-3">
        {step === 'horario' && selectedFecha && (
          <button
            onClick={() => setSelectedFecha('')}
            className="rounded-full border border-stone-200 px-5 py-2.5 text-sm font-bold text-stone-600 transition hover:border-stone-400"
          >
            ← Cambiar fecha
          </button>
        )}
        {step !== 'barbero' && step !== 'confirmacion' && (step !== 'horario' || !selectedFecha) && (
          <button
            onClick={() => {
              if (step === 'servicio') setStep('barbero')
              else if (step === 'horario') setStep('servicio')
              else if (step === 'datos') { setSelectedHora(''); setStep('horario') }
            }}
            className="rounded-full border border-stone-200 px-5 py-2.5 text-sm font-bold text-stone-600 transition hover:border-stone-400"
          >
            ← Volver
          </button>
        )}
      </div>
    </div>
  )
}
