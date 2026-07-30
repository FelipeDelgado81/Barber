import { createClient } from '@/lib/supabase/server'
import AdminServiciosClient from './AdminServiciosClient'

export default async function AdminServiciosPage() {
  const supabase = await createClient()
  const { data: servicios } = await supabase.from('servicios').select('*').order('nombre')
  const { data: barberoServicios } = await supabase
    .from('barbero_servicios')
    .select('*, servicios(*), barberos(*)')

  return (
    <AdminServiciosClient
      servicios={(servicios as unknown as Parameters<typeof AdminServiciosClient>[0]['servicios']) || []}
      barberoServicios={(barberoServicios as unknown as Parameters<typeof AdminServiciosClient>[0]['barberoServicios']) || []}
    />
  )
}
