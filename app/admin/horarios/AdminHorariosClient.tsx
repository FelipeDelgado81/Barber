'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type BloqueoRow = {
  id: string
  barbero_id: string
  fecha: string
  hora_inicio: string | null
  hora_fin: string | null
  motivo: string | null
  barberos: { nombre: string } | null
}

export default function AdminHorariosClient({
  barberos,
  bloqueos: initialBloqueos,
}: {
  barberos: { id: string; nombre: string }[]
  bloqueos: BloqueoRow[]
}) {
  const [bloqueos, setBloqueos] = useState(initialBloqueos)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    barbero_id: '',
    fecha: '',
    hora_inicio: '',
    hora_fin: '',
    motivo: '',
    dia_completo: false,
  })
  const router = useRouter()
  const supabase = createClient()

  async function handleCrearBloqueo(e: React.FormEvent) {
    e.preventDefault()
    await supabase.from('bloqueos').insert({
      barbero_id: form.barbero_id,
      fecha: form.fecha,
      hora_inicio: form.dia_completo ? null : form.hora_inicio || null,
      hora_fin: form.dia_completo ? null : form.hora_fin || null,
      motivo: form.motivo || null,
    })
    setShowForm(false)
    setForm({ barbero_id: '', fecha: '', hora_inicio: '', hora_fin: '', motivo: '', dia_completo: false })
    router.refresh()
    const { data } = await supabase.from('bloqueos').select('*, barberos(*)').order('fecha', { ascending: false })
    if (data) setBloqueos(data as unknown as BloqueoRow[])
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Bloqueos de Horarios</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-neutral-900 hover:bg-neutral-800 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + Nuevo Bloqueo
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCrearBloqueo} className="bg-white p-6 rounded-lg shadow-sm mb-6 space-y-4 max-w-lg">
          <h2 className="text-lg font-semibold">Nuevo Bloqueo</h2>

          <select
            value={form.barbero_id}
            onChange={(e) => setForm({ ...form, barbero_id: e.target.value })}
            required
            className="w-full border rounded-lg p-2"
          >
            <option value="">Seleccionar barbero</option>
            {barberos.map((b) => (
              <option key={b.id} value={b.id}>{b.nombre}</option>
            ))}
          </select>

          <input
            type="date"
            value={form.fecha}
            onChange={(e) => setForm({ ...form, fecha: e.target.value })}
            required
            className="w-full border rounded-lg p-2"
          />

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.dia_completo}
              onChange={(e) => setForm({ ...form, dia_completo: e.target.checked })}
            />
            Día completo
          </label>

          {!form.dia_completo && (
            <div className="flex gap-2">
              <input
                type="time"
                value={form.hora_inicio}
                onChange={(e) => setForm({ ...form, hora_inicio: e.target.value })}
                className="w-full border rounded-lg p-2"
              />
              <input
                type="time"
                value={form.hora_fin}
                onChange={(e) => setForm({ ...form, hora_fin: e.target.value })}
                className="w-full border rounded-lg p-2"
              />
            </div>
          )}

          <input
            type="text"
            placeholder="Motivo (opcional)"
            value={form.motivo}
            onChange={(e) => setForm({ ...form, motivo: e.target.value })}
            className="w-full border rounded-lg p-2"
          />

          <div className="flex gap-2">
            <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-black font-semibold px-4 py-2 rounded-lg text-sm">
              Guardar
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="text-neutral-500 text-sm">Cancelar</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left">
            <tr>
              <th className="p-3 font-medium">Barbero</th>
              <th className="p-3 font-medium">Fecha</th>
              <th className="p-3 font-medium">Horario</th>
              <th className="p-3 font-medium">Motivo</th>
            </tr>
          </thead>
          <tbody>
            {bloqueos.map((b) => (
              <tr key={b.id} className="border-t">
                <td className="p-3">{b.barberos?.nombre}</td>
                <td className="p-3">{new Date(b.fecha + 'T12:00:00').toLocaleDateString('es-CL')}</td>
                <td className="p-3">
                  {b.hora_inicio && b.hora_fin
                    ? `${b.hora_inicio} — ${b.hora_fin}`
                    : 'Día completo'}
                </td>
                <td className="p-3 text-neutral-500">{b.motivo || '—'}</td>
              </tr>
            ))}
            {bloqueos.length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-neutral-500">No hay bloqueos registrados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
