'use client'

/* Las URLs de fotos son administradas en Supabase y no tienen un host fijo. */
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Barbero } from '@/lib/types'

export default function BarberoSelector({
  onSelect,
  selectedId,
}: {
  onSelect: (b: Barbero) => void
  selectedId?: string
}) {
  const [barberos, setBarberos] = useState<Barbero[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    supabase
      .from('barberos')
      .select('*')
      .eq('activo', true)
      .then(({ data }) => {
        if (data) setBarberos(data)
        setLoading(false)
      })
  }, [supabase])

  if (loading) return <p className="text-neutral-500">Cargando barberos...</p>

  return (
    <div className="space-y-3">
      {barberos.map((b) => (
        <button
          key={b.id}
          onClick={() => onSelect(b)}
          className={`w-full text-left p-4 rounded-lg border transition-colors ${
            selectedId === b.id ? 'bg-amber-50 border-amber-400' : 'bg-neutral-50 hover:bg-neutral-100'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-neutral-200 overflow-hidden shrink-0">
              {b.foto_url && <img src={b.foto_url} alt={b.nombre} className="w-full h-full object-cover" />}
            </div>
            <div>
              <p className="font-semibold">{b.nombre}</p>
              {b.bio && <p className="text-sm text-neutral-500">{b.bio}</p>}
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}
