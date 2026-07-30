import { createClient } from '@/lib/supabase/server'

/* Las URLs de fotos son administradas en Supabase y no tienen un host fijo. */
/* eslint-disable @next/next/no-img-element */

export default async function BarberosPage() {
  const supabase = await createClient()
  const { data: barberos } = await supabase
    .from('barberos')
    .select('*')
    .eq('activo', true)

  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-8">Nuestros Barberos</h1>
      {!barberos || barberos.length === 0 ? (
        <p className="text-neutral-500">Próximamente...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {barberos.map((barbero) => (
            <div key={barbero.id} className="bg-neutral-50 rounded-lg p-6 flex gap-4 items-start">
              <div className="w-24 h-24 rounded-full bg-neutral-200 shrink-0 overflow-hidden">
                {barbero.foto_url && (
                  <img
                    src={barbero.foto_url}
                    alt={barbero.nombre}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold">{barbero.nombre}</h2>
                <p className="text-neutral-600 mt-1">{barbero.bio}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
