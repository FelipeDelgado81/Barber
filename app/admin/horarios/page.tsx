import { createClient } from '@/lib/supabase/server'
import AdminHorariosClient from './AdminHorariosClient'

export default async function AdminHorariosPage() {
  const supabase = await createClient()
  const { data: barberos } = await supabase.from('barberos').select('id, nombre').eq('activo', true)
  const { data: bloqueos } = await supabase
    .from('bloqueos')
    .select('*, barberos(*)')
    .order('fecha', { ascending: false })

  return (
    <AdminHorariosClient
      barberos={(barberos as unknown as Parameters<typeof AdminHorariosClient>[0]['barberos']) || []}
      bloqueos={(bloqueos as unknown as Parameters<typeof AdminHorariosClient>[0]['bloqueos']) || []}
    />
  )
}
