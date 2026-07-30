'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type BarberoRow = {
  id: string
  nombre: string
  foto_url: string | null
  bio: string | null
  activo: boolean
}

export default function AdminBarberosClient({
  barberos: initialBarberos,
}: {
  barberos: BarberoRow[]
}) {
  const [barberos, setBarberos] = useState(initialBarberos)
  const [editando, setEditando] = useState<BarberoRow | null>(null)
  const [nuevo, setNuevo] = useState(false)
  const [form, setForm] = useState({ nombre: '', bio: '', foto_url: '', activo: true })
  const router = useRouter()
  const supabase = createClient()

  async function handleGuardar(e: React.FormEvent) {
    e.preventDefault()
    if (editando) {
      await supabase.from('barberos').update({
        nombre: form.nombre,
        bio: form.bio,
        foto_url: form.foto_url || null,
        activo: form.activo,
      }).eq('id', editando.id)
    } else {
      await supabase.from('barberos').insert({
        nombre: form.nombre,
        bio: form.bio,
        foto_url: form.foto_url || null,
        activo: form.activo,
      })
    }
    setEditando(null)
    setNuevo(false)
    router.refresh()
    const { data } = await supabase.from('barberos').select('*')
    if (data) setBarberos(data)
  }

  function handleEditar(b: BarberoRow) {
    setEditando(b)
    setNuevo(false)
    setForm({ nombre: b.nombre, bio: b.bio || '', foto_url: b.foto_url || '', activo: b.activo })
  }

  function handleNuevo() {
    setNuevo(true)
    setEditando(null)
    setForm({ nombre: '', bio: '', foto_url: '', activo: true })
  }

  function cerrar() {
    setEditando(null)
    setNuevo(false)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Barberos</h1>
        <button
          onClick={handleNuevo}
          className="bg-neutral-900 hover:bg-neutral-800 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + Nuevo Barbero
        </button>
      </div>

      {(editando || nuevo) && (
        <form onSubmit={handleGuardar} className="bg-white p-6 rounded-lg shadow-sm mb-6 space-y-4 max-w-lg">
          <h2 className="text-lg font-semibold">{editando ? 'Editar Barbero' : 'Nuevo Barbero'}</h2>
          <input
            type="text"
            placeholder="Nombre"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            required
            className="w-full border rounded-lg p-2"
          />
          <textarea
            placeholder="Biografía"
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            className="w-full border rounded-lg p-2"
            rows={3}
          />
          <input
            type="url"
            placeholder="URL de la foto"
            value={form.foto_url}
            onChange={(e) => setForm({ ...form, foto_url: e.target.value })}
            className="w-full border rounded-lg p-2"
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.activo}
              onChange={(e) => setForm({ ...form, activo: e.target.checked })}
            />
            Activo
          </label>
          <div className="flex gap-2">
            <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-black font-semibold px-4 py-2 rounded-lg text-sm">
              Guardar
            </button>
            <button type="button" onClick={cerrar} className="text-neutral-500 hover:text-neutral-700 text-sm px-4">
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left">
            <tr>
              <th className="p-3 font-medium">Nombre</th>
              <th className="p-3 font-medium">Bio</th>
              <th className="p-3 font-medium">Activo</th>
              <th className="p-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {barberos.map((b) => (
              <tr key={b.id} className="border-t">
                <td className="p-3 font-medium">{b.nombre}</td>
                <td className="p-3 text-neutral-500">{b.bio || '—'}</td>
                <td className="p-3">{b.activo ? 'Sí' : 'No'}</td>
                <td className="p-3">
                  <button onClick={() => handleEditar(b)} className="text-amber-600 hover:text-amber-800 text-xs font-medium">
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
