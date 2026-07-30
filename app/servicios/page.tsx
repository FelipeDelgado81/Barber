import { createClient } from '@/lib/supabase/server'

type Barbero = { id: string; nombre: string; foto_url: string | null }
type ServicioConPrecio = { id: string; precio: number; servicios: { nombre: string; duracion_minutos: number } | null }
type GrupoServicios = { barbero: Barbero; servicios: ServicioConPrecio[] }

export default async function ServiciosPage() {
  const supabase = await createClient()

  const { data: barberos } = await supabase
    .from('barberos')
    .select('id, nombre, foto_url')
    .eq('activo', true)

  const ids = (barberos as unknown as Barbero[] | null)?.map((b) => b.id) || []
  if (ids.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-8">Servicios y Precios</h1>
        <p className="text-neutral-500">Próximamente...</p>
      </div>
    )
  }

  const { data: bsData } = await supabase
    .from('barbero_servicios')
    .select('*, barberos(*), servicios(*)')
    .in('barbero_id', ids)

  const grouped: GrupoServicios[] = []
  const seen = new Set<string>()

  ;(bsData as unknown as Array<ServicioConPrecio & { barbero_id: string; barberos: Barbero }> | null)?.forEach((bs) => {
    if (!seen.has(bs.barbero_id)) {
      seen.add(bs.barbero_id)
      grouped.push({ barbero: bs.barberos, servicios: [] })
    }
    grouped.find((g) => g.barbero.id === bs.barbero_id)?.servicios.push(bs)
  })

  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-8">Servicios y Precios</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {grouped.map(({ barbero, servicios }) => (
          <div key={barbero.id} className="bg-neutral-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">{barbero.nombre}</h2>
            <div className="space-y-3">
              {servicios.map((bs) => (
                <div key={bs.id} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{bs.servicios?.nombre}</p>
                    <p className="text-sm text-neutral-500">{bs.servicios?.duracion_minutos} min</p>
                  </div>
                  <span className="text-lg font-semibold text-amber-600">
                    ${bs.precio.toLocaleString('es-CL')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
