import AgendarClient from './AgendarClient'

export const dynamic = 'force-dynamic'

export default function AgendarPage() {
  return (
    <div>
      <section className="bg-[#171713] px-5 py-16 sm:px-8 lg:px-12 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <p className="mb-6 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.24em] text-amber-400">
            <span className="h-px w-10 bg-amber-400" /> Reserva online
          </p>
          <h1 className="max-w-3xl text-5xl font-black leading-[.93] tracking-[-0.055em] text-white sm:text-7xl">
            Agenda tu hora.
          </h1>
        </div>
      </section>
      <AgendarClient />
    </div>
  )
}
