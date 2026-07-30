'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type ServicioRow = { id: string; nombre: string; duracion_minutos: number; activo: boolean }
type BsRow = {
  id: string
  barbero_id: string
  servicio_id: string
  precio: number
  barberos: { nombre: string } | null
  servicios: { nombre: string } | null
}

export default function AdminServiciosClient({
  servicios: initialServicios,
  barberoServicios: initialBs,
}: {
  servicios: ServicioRow[]
  barberoServicios: BsRow[]
}) {
  const [servicios, setServicios] = useState(initialServicios)
  const [bsList, setBsList] = useState(initialBs)
  const [editServicio, setEditServicio] = useState<ServicioRow | null>(null)
  const [nuevoServicio, setNuevoServicio] = useState(false)
  const [editPrecio, setEditPrecio] = useState<BsRow | null>(null)
  const [form, setForm] = useState({ nombre: '', duracion_minutos: 45, activo: true })
  const [precioForm, setPrecioForm] = useState({ barbero_id: '', servicio_id: '', precio: 0 })
  const router = useRouter()
  const supabase = createClient()

  async function handleGuardarServicio(e: React.FormEvent) {
    e.preventDefault()
    if (editServicio) {
      await supabase.from('servicios').update(form).eq('id', editServicio.id)
    } else {
      await supabase.from('servicios').insert(form)
    }
    setEditServicio(null)
    setNuevoServicio(false)
    router.refresh()
    const { data } = await supabase.from('servicios').select('*')
    if (data) setServicios(data)
  }

  async function handleGuardarPrecio(e: React.FormEvent) {
    e.preventDefault()
    if (editPrecio) {
      await supabase.from('barbero_servicios').update({ precio: precioForm.precio }).eq('id', editPrecio.id)
    } else {
      await supabase.from('barbero_servicios').insert(precioForm)
    }
    setEditPrecio(null)
    router.refresh()
    const { data } = await supabase.from('barbero_servicios').select('*, servicios(*), barberos(*)')
    if (data) setBsList(data as unknown as BsRow[])
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Servicios</h1>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Servicios disponibles</h2>
        <button
          onClick={() => { setNuevoServicio(true); setEditServicio(null) }}
          className="bg-neutral-900 hover:bg-neutral-800 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + Nuevo Servicio
        </button>
      </div>

      {(editServicio || nuevoServicio) && (
        <form onSubmit={handleGuardarServicio} className="bg-white p-6 rounded-lg shadow-sm mb-6 space-y-4 max-w-lg">
          <h3 className="font-semibold">{editServicio ? 'Editar Servicio' : 'Nuevo Servicio'}</h3>
          <input
            type="text"
            placeholder="Nombre del servicio"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            required
            className="w-full border rounded-lg p-2"
          />
          <input
            type="number"
            placeholder="Duración (minutos)"
            value={form.duracion_minutos}
            onChange={(e) => setForm({ ...form, duracion_minutos: Number(e.target.value) })}
            required
            className="w-full border rounded-lg p-2"
          />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} />
            Activo
          </label>
          <div className="flex gap-2">
            <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-black font-semibold px-4 py-2 rounded-lg text-sm">
              Guardar
            </button>
            <button type="button" onClick={() => { setEditServicio(null); setNuevoServicio(false) }} className="text-neutral-500 text-sm">
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left">
            <tr>
              <th className="p-3 font-medium">Nombre</th>
              <th className="p-3 font-medium">Duración</th>
              <th className="p-3 font-medium">Activo</th>
              <th className="p-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {servicios.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="p-3 font-medium">{s.nombre}</td>
                <td className="p-3">{s.duracion_minutos} min</td>
                <td className="p-3">{s.activo ? 'Sí' : 'No'}</td>
                <td className="p-3">
                  <button
                    onClick={() => { setEditServicio(s); setNuevoServicio(false); setForm({ nombre: s.nombre, duracion_minutos: s.duracion_minutos, activo: s.activo }) }}
                    className="text-amber-600 hover:text-amber-800 text-xs font-medium"
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="text-lg font-semibold mb-4">Precios por Barbero</h2>

      {editPrecio !== null && (
        <form onSubmit={handleGuardarPrecio} className="bg-white p-6 rounded-lg shadow-sm mb-6 space-y-4 max-w-lg">
          <h3 className="font-semibold">Editar Precio</h3>
          <input
            type="number"
            placeholder="Precio ($)"
            value={precioForm.precio}
            onChange={(e) => setPrecioForm({ ...precioForm, precio: Number(e.target.value) })}
            required
            className="w-full border rounded-lg p-2"
          />
          <div className="flex gap-2">
            <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-black font-semibold px-4 py-2 rounded-lg text-sm">
              Guardar
            </button>
            <button type="button" onClick={() => setEditPrecio(null)} className="text-neutral-500 text-sm">Cancelar</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left">
            <tr>
              <th className="p-3 font-medium">Barbero</th>
              <th className="p-3 font-medium">Servicio</th>
              <th className="p-3 font-medium">Precio</th>
              <th className="p-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {bsList.map((bs) => (
              <tr key={bs.id} className="border-t">
                <td className="p-3">{bs.barberos?.nombre}</td>
                <td className="p-3">{bs.servicios?.nombre}</td>
                <td className="p-3 font-semibold">${bs.precio.toLocaleString('es-CL')}</td>
                <td className="p-3">
                  <button
                    onClick={() => { setEditPrecio(bs); setPrecioForm({ barbero_id: bs.barbero_id, servicio_id: bs.servicio_id, precio: bs.precio }) }}
                    className="text-amber-600 hover:text-amber-800 text-xs font-medium"
                  >
                    Editar
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
