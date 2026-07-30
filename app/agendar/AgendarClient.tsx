'use client'

import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import BarberoSelector from '@/components/BarberoSelector'
import type { Barbero, Servicio, BarberoServicio } from '@/lib/types'

type Step = 'barbero' | 'servicio' | 'horario' | 'datos' | 'confirmacion'
type BarberoServicioConServicio = BarberoServicio & { servicios: Servicio }

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
    <div className="max-w-xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-8">Agendar Hora</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {step === 'barbero' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Elige tu barbero</h2>
          <BarberoSelector
            onSelect={handleSelectBarbero}
            selectedId={selectedBarbero?.id}
          />
        </div>
      )}

      {step === 'servicio' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Elige servicio con {selectedBarbero?.nombre}
          </h2>
          {loading ? (
            <p className="text-neutral-500">Cargando servicios...</p>
          ) : (
            <div className="space-y-3">
              {servicios.map((bs) => (
                <button
                  key={bs.id}
                  onClick={() => handleSelectServicio(bs)}
                  className="w-full text-left bg-neutral-50 hover:bg-neutral-100 p-4 rounded-lg border transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{bs.servicios.nombre}</p>
                      <p className="text-sm text-neutral-500">
                        {bs.servicios.duracion_minutos} min
                      </p>
                    </div>
                    <span className="text-lg font-semibold text-amber-600">
                      ${bs.precio.toLocaleString('es-CL')}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {step === 'horario' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Selecciona fecha y hora
          </h2>
          {loading ? (
            <p className="text-neutral-500">Calculando disponibilidad...</p>
          ) : fechasDisponibles.length === 0 ? (
            <p className="text-neutral-500">
              No hay horarios disponibles en los próximos 7 días.
            </p>
          ) : !selectedFecha ? (
            <>
              <p className="text-sm text-neutral-500 mb-4">Elige un día disponible:</p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {fechasDisponibles.map((fd) => (
                  <button
                    key={fd.fecha}
                    onClick={() => handleSelectDate(fd.fecha)}
                    className="flex flex-col items-center gap-1 p-3 min-w-[90px] rounded-xl border bg-neutral-50 hover:bg-neutral-100 hover:border-amber-400 transition-colors"
                  >
                    <span className="text-xs uppercase text-neutral-500 font-medium">
                      {fd.label.split(' ')[0]}
                    </span>
                    <span className="text-lg font-bold">
                      {new Date(fd.fecha + 'T12:00:00').getDate()}
                    </span>
                    <span className="text-xs text-neutral-500">
                      {new Date(fd.fecha + 'T12:00:00').toLocaleDateString('es-CL', { month: 'short' })}
                    </span>
                    <span className="text-xs text-amber-600 font-medium mt-1">
                      {fd.slots.length} horarios
                    </span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={() => setSelectedFecha('')}
                  className="text-neutral-500 hover:text-neutral-700"
                >
                  ←
                </button>
                <p className="text-sm text-neutral-500">
                  Horarios disponibles para{' '}
                  <strong>
                    {new Date(selectedFecha + 'T12:00:00').toLocaleDateString('es-CL', {
                      weekday: 'long', day: 'numeric', month: 'long'
                    })}
                  </strong>
                </p>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                {fechasDisponibles
                  .find((fd) => fd.fecha === selectedFecha)
                  ?.slots.map((hora) => (
                    <button
                      key={hora}
                      onClick={() => handleSelectHora(hora)}
                      className="bg-neutral-50 hover:bg-amber-50 hover:border-amber-400 p-3 rounded-lg border text-center transition-colors"
                    >
                      <span className="text-sm font-medium">{hora}</span>
                    </button>
                  ))}
              </div>
            </>
          )}
        </div>
      )}

      {step === 'datos' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Tus datos</h2>
          <div className="bg-neutral-50 p-4 rounded-lg mb-6 space-y-1 text-sm">
            <p><strong>Barbero:</strong> {selectedBarbero?.nombre}</p>
            <p><strong>Servicio:</strong> {selectedServicio?.servicios.nombre}</p>
            <p><strong>Fecha:</strong> {new Date(selectedFecha + 'T12:00:00').toLocaleDateString('es-CL')}</p>
            <p><strong>Hora:</strong> {selectedHora}</p>
            <p><strong>Precio:</strong> ${selectedServicio?.precio.toLocaleString('es-CL')}</p>
          </div>

          <div className="space-y-4">
            <input
              type="text"
              placeholder="Nombre completo"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className="w-full border rounded-lg p-3"
            />
            <input
              type="tel"
              placeholder="Teléfono"
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              className="w-full border rounded-lg p-3"
            />
            <input
              type="email"
              placeholder="Email (obligatorio)"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border rounded-lg p-3"
            />
            <button
              onClick={handleConfirmar}
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Confirmando...' : 'Confirmar Reserva'}
            </button>
          </div>
        </div>
      )}

      {step === 'confirmacion' && (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">✓</div>
          <h2 className="text-2xl font-bold mb-2">¡Hora Agendada!</h2>
          <p className="text-neutral-600 mb-4">
            Tu código de gestión es:
          </p>
          <p className="text-3xl font-mono font-bold text-amber-600 mb-6">
            {codigoGestion}
          </p>
          <p className="text-neutral-600 mb-2">
            Recibirás la confirmación por email cuando se configure el servicio de notificaciones.
          </p>
          <p className="text-neutral-500 text-sm">
            Puedes cancelar o reprogramar tu cita con este código.
          </p>
        </div>
      )}

      {step === 'horario' && selectedFecha && (
        <button
          onClick={() => setSelectedFecha('')}
          className="mt-4 text-neutral-500 hover:text-neutral-700 text-sm"
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
          className="mt-4 text-neutral-500 hover:text-neutral-700 text-sm"
        >
          ← Volver
        </button>
      )}
    </div>
  )
}
