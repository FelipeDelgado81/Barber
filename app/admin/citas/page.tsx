import { createClient } from '@/lib/supabase/server'
import AdminCitasClient from './AdminCitasClient'

export default async function AdminCitasPage() {
  const supabase = await createClient()

  const { data: barberos } = await supabase.from('barberos').select('id, nombre').eq('activo', true)

  const { data: citas } = await supabase
    .from('citas')
    .select('*, barberos(*), servicios(*)')
    .order('fecha', { ascending: false })
    .order('hora_inicio', { ascending: true })

  return <AdminCitasClient
    citas={(citas as unknown as Parameters<typeof AdminCitasClient>[0]['citas']) || []}
    barberos={(barberos as unknown as Parameters<typeof AdminCitasClient>[0]['barberos']) || []}
  />
}
