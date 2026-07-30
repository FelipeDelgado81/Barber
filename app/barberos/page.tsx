import { createClient } from '@/lib/supabase/server'

/* eslint-disable @next/next/no-img-element */

export default async function BarberosPage() {
  const supabase = await createClient()
  const { data: barberos } = await supabase
    .from('barberos')
    .select('*')
    .eq('activo', true)

  return (
    <div>
      <section className="bg-[#171713] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <p className="mb-6 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.24em] text-amber-400">
            <span className="h-px w-10 bg-amber-400" /> El equipo
          </p>
          <h1 className="max-w-3xl text-5xl font-black leading-[.93] tracking-[-0.055em] text-white sm:text-7xl">
            Conoce a tus barberos.
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
        {!barberos || barberos.length === 0 ? (
          <p className="text-stone-500">Próximamente...</p>
        ) : (
          <div className="grid gap-8 md:grid-cols-2">
            {barberos.map((barbero) => (
              <article
                key={barbero.id}
                className="group relative overflow-hidden rounded-2xl border border-stone-200 bg-white transition hover:shadow-lg"
              >
                <div className="flex flex-col sm:flex-row">
                  <div className="relative h-48 w-full shrink-0 overflow-hidden sm:h-auto sm:w-48">
                    <div className="absolute inset-0 bg-stone-200" />
                    {barbero.foto_url ? (
                      <img
                        src={barbero.foto_url}
                        alt={barbero.nombre}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-5xl text-stone-400">
                        {barbero.nombre.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col justify-center p-6">
                    <h2 className="text-xl font-extrabold text-stone-900">{barbero.nombre}</h2>
                    <p className="mt-2 text-sm leading-6 text-stone-600">{barbero.bio}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
