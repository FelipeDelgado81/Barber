'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Cita } from '@/lib/types'

export default function GestionarPage() {
  const { codigo } = useParams<{ codigo: string }>()
  const [cita, setCita] = useState<Cita | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('citas')
      .select('*, barberos(*), servicios(*)')
      .eq('codigo_gestion', codigo)
      .single()
      .then(({ data, error }) => {
        if (error || !data) setError('Cita no encontrada')
        else setCita(data as unknown as Cita)
        setLoading(false)
      })
  }, [codigo])

  const handleCancelar = useCallback(async () => {
    if (!cita) return
    if (!confirm('¿Estás seguro de cancelar esta cita?')) return
    const supabase = createClient()
    const { error } = await supabase.from('citas').update({ estado: 'cancelada' }).eq('id', cita.id)
    if (error) {
      setError('No fue posible cancelar la cita. Intenta nuevamente.')
      return
    }
    setCita({ ...cita, estado: 'cancelada' })
  }, [cita])

  if (loading) return <div className="max-w-xl mx-auto px-4 py-16"><p className="text-neutral-500">Cargando...</p></div>
  if (error || !cita) return <div className="max-w-xl mx-auto px-4 py-16"><p className="text-red-600">{error || 'Cita no encontrada'}</p></div>

  const ahora = new Date()
  const citaDate = new Date(`${cita.fecha}T${cita.hora_inicio}`)
  const diffMs = citaDate.getTime() - ahora.getTime()
  const diffHoras = diffMs / (1000 * 60 * 60)
  const puedeCancelar = diffHoras > 2
  const estadoColor: Record<string, string> = {
    pendiente: 'text-yellow-600',
    confirmada: 'text-green-600',
    cancelada: 'text-red-600',
    completada: 'text-blue-600',
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-6">Gestión de Cita</h1>

      <div className="bg-neutral-50 p-6 rounded-lg space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-neutral-600">Estado</span>
          <span className={`font-semibold capitalize ${estadoColor[cita.estado]}`}>
            {cita.estado}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-600">Código</span>
          <span className="font-mono font-bold">{cita.codigo_gestion}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-600">Barbero</span>
          <span>{cita.barberos?.nombre || '—'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-600">Servicio</span>
          <span>{cita.servicios?.nombre || '—'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-600">Fecha</span>
          <span>{new Date(cita.fecha + 'T12:00:00').toLocaleDateString('es-CL')}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-600">Hora</span>
          <span>{cita.hora_inicio} — {cita.hora_fin}</span>
        </div>
      </div>

      {cita.estado !== 'cancelada' && cita.estado !== 'completada' && (
        <div className="mt-6">
          {puedeCancelar ? (
            <button
              onClick={handleCancelar}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Cancelar Cita
            </button>
          ) : (
            <p className="text-center text-neutral-500 text-sm">
              No puedes cancelar esta cita porque faltan menos de 2 horas.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
