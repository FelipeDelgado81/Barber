import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const adminLinks = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/citas', label: 'Citas' },
  { href: '/admin/barberos', label: 'Barberos' },
  { href: '/admin/servicios', label: 'Servicios' },
  { href: '/admin/horarios', label: 'Horarios' },
]

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  const { data: perfil } = await supabase
    .from('perfiles_admin')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (!perfil) {
    await supabase.auth.signOut()
    redirect('/admin/login')
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-neutral-900 text-white h-14 flex items-center px-4 justify-between">
        <Link href="/admin" className="font-bold">Rai Barber — Admin</Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-neutral-400">{user.email}</span>
          <form action="/auth/logout" method="post">
            <button className="text-sm text-neutral-400 hover:text-white">Cerrar sesión</button>
          </form>
        </div>
      </header>
      <div className="flex">
        <nav className="w-52 bg-white border-r min-h-[calc(100vh-3.5rem)] p-4 space-y-2">
          {adminLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block px-3 py-2 rounded hover:bg-neutral-100 text-sm font-medium"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
