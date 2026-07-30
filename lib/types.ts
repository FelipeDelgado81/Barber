export type BarberoServicio = {
  id: string
  barbero_id: string
  servicio_id: string
  precio: number
}

export type Barbero = {
  id: string
  nombre: string
  foto_url: string | null
  bio: string | null
  activo: boolean
  barbero_servicios?: BarberoServicio[]
}

export type Servicio = {
  id: string
  nombre: string
  duracion_minutos: number
  activo: boolean
}

export type Bloqueo = {
  id: string
  barbero_id: string
  fecha: string
  hora_inicio: string | null
  hora_fin: string | null
  motivo: string | null
}

export type Cita = {
  id: string
  barbero_id: string
  servicio_id: string
  cliente_nombre: string
  cliente_telefono: string
  cliente_email: string
  fecha: string
  hora_inicio: string
  hora_fin: string
  estado: 'pendiente' | 'confirmada' | 'completada' | 'cancelada'
  codigo_gestion: string
  recordatorio_enviado: boolean
  creado_en: string
  servicios?: Servicio
  barberos?: Barbero
}

export type PerfilAdmin = {
  id: string
  barbero_id: string
  rol: 'admin' | 'barbero'
}
