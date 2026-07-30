'use client'

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

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="flex items-center gap-4 rounded-xl border border-stone-200 p-4">
            <div className="h-12 w-12 animate-pulse rounded-full bg-stone-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 animate-pulse rounded bg-stone-200" />
              <div className="h-3 w-40 animate-pulse rounded bg-stone-200" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {barberos.map((b) => (
        <button
          key={b.id}
          onClick={() => onSelect(b)}
          className={`flex w-full items-center gap-4 rounded-xl border px-5 py-4 text-left transition ${
            selectedId === b.id
              ? 'border-amber-400 bg-amber-50 shadow-sm'
              : 'border-stone-200 bg-white hover:border-stone-300 hover:shadow-sm'
          }`}
        >
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-stone-200">
            {b.foto_url ? (
              <img src={b.foto_url} alt={b.nombre} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-lg font-bold text-stone-400">
                {b.nombre.charAt(0)}
              </div>
            )}
          </div>
          <div>
            <p className="font-extrabold text-stone-900">{b.nombre}</p>
            {b.bio && <p className="mt-0.5 text-sm text-stone-500">{b.bio}</p>}
          </div>
        </button>
      ))}
    </div>
  )
}
