export default function Footer() {
  return (
    <footer className="bg-[#171713] py-12 text-stone-400">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-9 px-5 sm:px-8 md:grid-cols-3 lg:px-12">
        <div>
          <h3 className="text-sm font-black uppercase tracking-[0.13em] text-white">Rai Barber Salon</h3>
          <p className="mt-3 text-sm leading-6">Arturo Prat 827<br />La Unión, Chile</p>
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Horario</h3>
          <p>Lunes a Sábado</p>
          <p>9:00 — 19:00</p>
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Contacto</h3>
          <p className="mt-3 text-sm">Teléfono: +56 9 XXXX XXXX</p>
          <p className="mt-1 text-sm">Instagram: @raibabersalon</p>
        </div>
      </div>
      <div className="mx-auto mt-10 max-w-7xl border-t border-white/10 px-5 pt-5 text-center text-xs sm:px-8 lg:px-12">
        © {new Date().getFullYear()} Rai Barber Salon. Todos los derechos reservados.
      </div>
    </footer>
  )
}
