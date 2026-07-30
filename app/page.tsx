import Link from 'next/link'

const benefits = [
  { number: '01', title: 'Elige a tu barbero', text: 'Conoce su estilo y agenda directamente con quien prefieras.' },
  { number: '02', title: 'Reserva en minutos', text: 'Selecciona tu servicio y un horario disponible, sin crear una cuenta.' },
  { number: '03', title: 'Llega y disfruta', text: 'Paga presencialmente y dedícate solo a tu nuevo look.' },
]

export default function Home() {
  return (
    <div className="overflow-hidden bg-stone-50">
      <section className="relative isolate bg-[#171713] text-stone-100">
        <div className="hero-grid absolute inset-0 -z-10 opacity-35" />
        <div className="absolute -right-36 top-[-12rem] -z-10 h-[38rem] w-[38rem] rounded-full bg-amber-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 -z-10 h-48 w-full bg-gradient-to-t from-black/40 to-transparent" />

        <div className="mx-auto grid min-h-[calc(100svh-4rem)] max-w-7xl items-end gap-12 px-5 pb-14 pt-20 sm:px-8 lg:grid-cols-[1.1fr_.9fr] lg:px-12 lg:pb-20">
          <div className="max-w-3xl">
            <p className="mb-6 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.24em] text-amber-400">
              <span className="h-px w-10 bg-amber-400" /> La Unión · Desde 2015
            </p>
            <h1 className="max-w-3xl text-5xl font-black leading-[.93] tracking-[-0.055em] text-balance sm:text-7xl lg:text-8xl">
              Un corte que habla por ti.
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-stone-300 sm:text-xl">
              Técnica precisa, conversación honesta y un espacio creado para que salgas sintiéndote tú, pero mejor.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/agendar" className="rounded-full bg-amber-400 px-7 py-4 text-center text-sm font-extrabold text-stone-950 transition hover:bg-amber-300 focus:outline-2 focus:outline-offset-4 focus:outline-amber-300">
                Reservar mi hora <span aria-hidden="true">→</span>
              </Link>
              <Link href="/servicios" className="rounded-full border border-stone-600 px-7 py-4 text-center text-sm font-bold text-stone-100 transition hover:border-stone-300 hover:bg-white/5">
                Ver servicios
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md self-center lg:mt-20">
            <div className="absolute -inset-5 rounded-[2.5rem] border border-amber-400/25" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-stone-900 p-7 shadow-2xl shadow-black/40 sm:p-9">
              <p className="text-7xl leading-none text-amber-400" aria-hidden="true">✦</p>
              <p className="mt-12 text-xs font-bold uppercase tracking-[0.2em] text-stone-400">Rai Barber Salon</p>
              <p className="mt-3 text-3xl font-bold leading-tight tracking-tight">Clásico en la técnica. Actual en el resultado.</p>
              <div className="mt-8 border-t border-white/10 pt-5 text-sm leading-6 text-stone-400">
                Arturo Prat 827<br />Lunes a sábado · 09:00—19:00
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:gap-20">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">Agenda sin vueltas</p>
            <h2 className="mt-4 text-4xl font-black leading-[1.02] tracking-[-0.04em] text-stone-900 sm:text-5xl">Tu tiempo importa. El proceso también.</h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {benefits.map((benefit) => (
              <article key={benefit.number} className="border-t-2 border-stone-900 pt-4">
                <p className="text-sm font-bold text-amber-700">{benefit.number}</p>
                <h3 className="mt-6 text-lg font-extrabold text-stone-900">{benefit.title}</h3>
                <p className="mt-3 text-sm leading-6 text-stone-600">{benefit.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-stone-900 px-5 py-16 text-stone-100 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400">¿Listo para tu próximo corte?</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-black tracking-[-0.035em] sm:text-5xl">Elige tu estilo. Nosotros nos encargamos del detalle.</h2>
          </div>
          <Link href="/agendar" className="shrink-0 rounded-full bg-amber-400 px-7 py-4 text-center text-sm font-extrabold text-stone-950 transition hover:bg-amber-300">
            Agendar ahora <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </div>
  )
}
