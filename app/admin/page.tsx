import { createClient } from '@/lib/supabase/server'

export default async function AdminDashboard() {
  const supabase = await createClient()

  const hoy = new Date().toISOString().split('T')[0]

  const { count: citasHoy } = await supabase
    .from('citas')
    .select('*', { count: 'exact', head: true })
    .eq('fecha', hoy)

  const { count: pendientes } = await supabase
    .from('citas')
    .select('*', { count: 'exact', head: true })
    .eq('fecha', hoy)
    .in('estado', ['pendiente', 'confirmada'])

  const { data: proximas } = await supabase
    .from('citas')
    .select('*, barberos(*), servicios(*)')
    .eq('fecha', hoy)
    .in('estado', ['pendiente', 'confirmada'])
    .order('hora_inicio', { ascending: true })

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="text-sm text-neutral-500">Citas hoy</p>
          <p className="text-3xl font-bold">{citasHoy ?? 0}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="text-sm text-neutral-500">Pendientes/Confirmadas</p>
          <p className="text-3xl font-bold">{pendientes ?? 0}</p>
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-4">Citas de hoy</h2>
      {!proximas || proximas.length === 0 ? (
        <p className="text-neutral-500">No hay citas para hoy.</p>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left">
              <tr>
                <th className="p-3 font-medium">Hora</th>
                <th className="p-3 font-medium">Cliente</th>
                <th className="p-3 font-medium">Barbero</th>
                <th className="p-3 font-medium">Servicio</th>
                <th className="p-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {proximas.map((cita) => (
                <tr key={cita.id} className="border-t">
                  <td className="p-3">{cita.hora_inicio}</td>
                  <td className="p-3">{cita.cliente_nombre}</td>
                  <td className="p-3">{(cita as { barberos?: { nombre: string } }).barberos?.nombre}</td>
                  <td className="p-3">{(cita as { servicios?: { nombre: string } }).servicios?.nombre}</td>
                  <td className="p-3 capitalize">{cita.estado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
