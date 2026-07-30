export default function GaleriaPage() {
  return (
    <div>
      <section className="bg-[#171713] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <p className="mb-6 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.24em] text-amber-400">
            <span className="h-px w-10 bg-amber-400" /> Galería
          </p>
          <h1 className="max-w-3xl text-5xl font-black leading-[.93] tracking-[-0.055em] text-white sm:text-7xl">
            Nuestros trabajos.
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-300 py-24 text-center">
          <p className="text-6xl">✂️</p>
          <h2 className="mt-6 text-xl font-bold text-stone-900">Galería próximamente</h2>
          <p className="mt-2 max-w-sm text-sm text-stone-500">
            Estamos seleccionando nuestras mejores fotos para mostrártelas. Vuelve pronto.
          </p>
        </div>
      </section>
    </div>
  )
}
