'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const navLinks = [
  { href: '/', label: 'Inicio' },
  { href: '/nosotros', label: 'Nosotros' },
  { href: '/barberos', label: 'Barberos' },
  { href: '/servicios', label: 'Servicios' },
  { href: '/galeria', label: 'Galería' },
]

export default function Header() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#171713]/95 text-white backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-12">
        <Link href="/" className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.12em]">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-amber-400 text-base text-stone-950">R</span>
          Rai <span className="font-medium text-stone-400">Barber</span>
        </Link>

        <button
          className="grid h-10 w-10 place-items-center rounded-full border border-white/15 md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Menú"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={open ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
          </svg>
        </button>

        <nav className={`${open ? 'flex' : 'hidden'} absolute left-0 top-16 w-full flex-col gap-1 border-b border-white/10 bg-[#171713] p-5 shadow-xl md:static md:flex md:w-auto md:flex-row md:items-center md:gap-1 md:border-0 md:bg-transparent md:p-0 md:shadow-none`}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-full px-3 py-2 text-sm font-semibold transition ${pathname === link.href ? 'text-amber-400' : 'text-stone-300 hover:text-white'}`}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link href="/agendar" className="mt-2 rounded-full bg-amber-400 px-4 py-2 text-center text-sm font-extrabold text-stone-950 md:mt-0 md:ml-2" onClick={() => setOpen(false)}>
            Reservar
          </Link>
        </nav>
      </div>
    </header>
  )
}
