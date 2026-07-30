export default function NosotrosPage() {
  return (
    <div>
      <section className="bg-[#171713] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <p className="mb-6 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.24em] text-amber-400">
            <span className="h-px w-10 bg-amber-400" /> Nuestra historia
          </p>
          <h1 className="max-w-3xl text-5xl font-black leading-[.93] tracking-[-0.055em] text-white sm:text-7xl">
            Más de una década perfeccionando el oficio.
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-3xl">
          <p className="text-lg leading-8 text-stone-600">
            En Rai Barber Salon llevamos más de 10 años ofreciendo cortes de calidad en La Unión. 
            Nuestra pasión es el arte de la barbería clásica combinada con tendencias modernas, 
            creando un espacio donde cada cliente se siente como en casa.
          </p>
          <div className="mt-12 grid gap-8 sm:grid-cols-2">
            <div className="border-t-2 border-stone-900 pt-5">
              <p className="text-3xl font-black text-stone-900">10+</p>
              <p className="mt-2 text-sm font-semibold text-stone-500">Años de experiencia</p>
            </div>
            <div className="border-t-2 border-stone-900 pt-5">
              <p className="text-3xl font-black text-stone-900">2</p>
              <p className="mt-2 text-sm font-semibold text-stone-500">Barberos expertos</p>
            </div>
            <div className="border-t-2 border-stone-900 pt-5">
              <p className="text-3xl font-black text-stone-900">Lun—Sáb</p>
              <p className="mt-2 text-sm font-semibold text-stone-500">09:00 — 19:00</p>
            </div>
            <div className="border-t-2 border-stone-900 pt-5">
              <p className="text-3xl font-black text-stone-900">100%</p>
              <p className="mt-2 text-sm font-semibold text-stone-500">Atención personalizada</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-stone-100 px-5 py-16 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">Visítanos</p>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.035em] text-stone-900 sm:text-4xl">
              Arturo Prat 827, La Unión
            </h2>
            <p className="mt-4 text-stone-600">
          Ven a conocernos. El mejor corte te espera.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
