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
  const [horarios, setHorarios] = useState<string[]>([])
  const [selectedHora, setSelectedHora] = useState<string>('')
  const [selectedFecha, setSelectedFecha] = useState<string>('')
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

    const slots: string[] = []
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

      for (let h = 9; h < 19; h++) {
        const hh = `${String(h).padStart(2, '0')}:00`
        const inicio = h * 60
        const fin = inicio + bs.servicios.duracion_minutos
        const esHoy = fecha === fechas[0]
        const yaPaso = esHoy && inicio <= ahora.getHours() * 60 + ahora.getMinutes()
        if (fin <= 19 * 60 && !yaPaso && !ocupado(inicio, fin)) slots.push(`${fecha}T${hh}`)
      }
    }

    setHorarios(slots)
    setLoading(false)
  }

  function handleSelectHorario(fechaHora: string) {
    const [fecha, hora] = fechaHora.split('T')
    setSelectedFecha(fecha)
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
          ) : horarios.length === 0 ? (
            <p className="text-neutral-500">
              No hay horarios disponibles en los próximos 7 días.
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {horarios.map((fh) => {
                const [fecha, hora] = fh.split('T')
                const fechaLabel = new Date(fecha + 'T12:00:00').toLocaleDateString('es-CL', {
                  weekday: 'short', day: 'numeric', month: 'short'
                })
                return (
                  <button
                    key={fh}
                    onClick={() => handleSelectHorario(fh)}
                    className="bg-neutral-50 hover:bg-neutral-100 p-3 rounded-lg border text-sm transition-colors"
                  >
                    <span className="block font-medium">{fechaLabel}</span>
                    <span className="block text-amber-600">{hora}</span>
                  </button>
                )
              })}
            </div>
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

      {step !== 'barbero' && step !== 'confirmacion' && (
        <button
          onClick={() => {
            if (step === 'servicio') setStep('barbero')
            else if (step === 'horario') setStep('servicio')
            else if (step === 'datos') setStep('horario')
          }}
          className="mt-4 text-neutral-500 hover:text-neutral-700 text-sm"
        >
          ← Volver
        </button>
      )}
    </div>
  )
}
