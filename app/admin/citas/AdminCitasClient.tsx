'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type CitaRow = {
  id: string
  barbero_id: string
  servicio_id: string
  cliente_nombre: string
  cliente_telefono: string
  cliente_email: string
  fecha: string
  hora_inicio: string
  hora_fin: string
  estado: string
  codigo_gestion: string
  barberos: { id: string; nombre: string } | null
  servicios: { id: string; nombre: string } | null
}

export default function AdminCitasClient({
  citas: initialCitas,
  barberos,
}: {
  citas: CitaRow[]
  barberos: { id: string; nombre: string }[]
}) {
  const [citas, setCitas] = useState(initialCitas)
  const [filtroBarbero, setFiltroBarbero] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const filtradas = citas.filter((c) => {
    if (filtroBarbero && c.barbero_id !== filtroBarbero) return false
    if (filtroEstado && c.estado !== filtroEstado) return false
    return true
  })

  async function handleActualizarEstado(id: string, estado: string) {
    await supabase.from('citas').update({ estado }).eq('id', id)
    setCitas(citas.map((c) => (c.id === id ? { ...c, estado } : c)))
    router.refresh()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Citas</h1>

      <div className="flex gap-4 mb-6">
        <select
          value={filtroBarbero}
          onChange={(e) => setFiltroBarbero(e.target.value)}
          className="border rounded-lg p-2 text-sm"
        >
          <option value="">Todos los barberos</option>
          {barberos.map((b) => (
            <option key={b.id} value={b.id}>{b.nombre}</option>
          ))}
        </select>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="border rounded-lg p-2 text-sm"
        >
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="confirmada">Confirmada</option>
          <option value="completada">Completada</option>
          <option value="cancelada">Cancelada</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left">
            <tr>
              <th className="p-3 font-medium">Fecha</th>
              <th className="p-3 font-medium">Hora</th>
              <th className="p-3 font-medium">Cliente</th>
              <th className="p-3 font-medium">Barbero</th>
              <th className="p-3 font-medium">Servicio</th>
              <th className="p-3 font-medium">Estado</th>
              <th className="p-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtradas.map((cita) => (
              <tr key={cita.id} className="border-t">
                <td className="p-3">{new Date(cita.fecha + 'T12:00:00').toLocaleDateString('es-CL')}</td>
                <td className="p-3">{cita.hora_inicio} — {cita.hora_fin}</td>
                <td className="p-3">
                  <div>{cita.cliente_nombre}</div>
                  <div className="text-neutral-500 text-xs">{cita.cliente_email}</div>
                </td>
                <td className="p-3">{cita.barberos?.nombre}</td>
                <td className="p-3">{cita.servicios?.nombre}</td>
                <td className="p-3">
                  <span className={`capitalize px-2 py-1 rounded text-xs font-medium ${
                    cita.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-700' :
                    cita.estado === 'confirmada' ? 'bg-green-100 text-green-700' :
                    cita.estado === 'completada' ? 'bg-blue-100 text-blue-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {cita.estado}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex gap-2">
                    {cita.estado === 'pendiente' && (
                      <button
                        onClick={() => handleActualizarEstado(cita.id, 'confirmada')}
                        className="text-xs bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded"
                      >
                        Confirmar
                      </button>
                    )}
                    {(cita.estado === 'pendiente' || cita.estado === 'confirmada') && (
                      <>
                        <button
                          onClick={() => handleActualizarEstado(cita.id, 'completada')}
                          className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded"
                        >
                          Completar
                        </button>
                        <button
                          onClick={() => handleActualizarEstado(cita.id, 'cancelada')}
                          className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded"
                        >
                          Cancelar
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtradas.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-neutral-500">No hay citas.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
