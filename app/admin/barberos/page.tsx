import { createClient } from '@/lib/supabase/server'
import AdminBarberosClient from './AdminBarberosClient'

export default async function AdminBarberosPage() {
  const supabase = await createClient()
  const { data: barberos } = await supabase.from('barberos').select('*').order('nombre')

  return <AdminBarberosClient barberos={(barberos as unknown as Parameters<typeof AdminBarberosClient>[0]['barberos']) || []} />
}
