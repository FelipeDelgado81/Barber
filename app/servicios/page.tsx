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
      <div>
        <section className="bg-[#171713] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <h1 className="text-5xl font-black text-white sm:text-7xl">Servicios y Precios</h1>
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-5 py-16">
          <p className="text-stone-500">Próximamente...</p>
        </section>
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
    <div>
      <section className="bg-[#171713] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <p className="mb-6 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.24em] text-amber-400">
            <span className="h-px w-10 bg-amber-400" /> Precios
          </p>
          <h1 className="max-w-3xl text-5xl font-black leading-[.93] tracking-[-0.055em] text-white sm:text-7xl">
            Servicios y precios.
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
        <div className="grid gap-10 md:grid-cols-2">
          {grouped.map(({ barbero, servicios }) => (
            <div key={barbero.id}>
              <h2 className="text-lg font-extrabold text-stone-900">{barbero.nombre}</h2>
              <div className="mt-4 overflow-hidden rounded-xl border border-stone-200 bg-white">
                {servicios.map((bs, i) => (
                  <div
                    key={bs.id}
                    className={`flex items-center justify-between px-5 py-4 ${
                      i < servicios.length - 1 ? 'border-b border-stone-100' : ''
                    }`}
                  >
                    <div>
                      <p className="font-bold text-stone-900">{bs.servicios?.nombre}</p>
                      <p className="mt-0.5 text-sm text-stone-500">{bs.servicios?.duracion_minutos} min</p>
                    </div>
                    <span className="text-xl font-black text-amber-600">
                      ${bs.precio.toLocaleString('es-CL')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
