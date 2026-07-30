# Rai Barber Salon — Sitio web y sistema de agendamiento

## Contexto

Sitio web para **Rai Barber Salon**, ubicada en Arturo Pratt 827, La Unión. El proyecto es para un negocio real (no un trabajo universitario) y tiene dos objetivos:

1. Presentar la barbería (historia, barberos, servicios, galería).
2. Permitir que los clientes agenden hora eligiendo con qué barbero cortarse, sin necesidad de crear una cuenta.

Actualmente trabajan **2 barberos**, ambos generalistas (no tienen especialidades exclusivas). Los precios de los servicios **varían según el barbero**. Atienden de **lunes a sábado, 9:00 a 19:00**, con horario compartido entre ambos.

## Alcance

- Sitio público con presentación de la marca (tienen logo, identidad visual e Instagram activo).
- Agendamiento sin cuenta: el cliente elige barbero, servicio, horario, y deja sus datos de contacto (nombre, teléfono, email obligatorio).
- Pago **presencial** — sin integración de pagos online por ahora.
- Panel de administración para que los barberos gestionen horarios, servicios, precios y citas.
- Solo en español.

Fuera de alcance por ahora: reseñas de clientes, multi-idioma, recordatorios por WhatsApp (se reemplazaron por email), pagos en línea.

## Requisitos funcionales (RF)

### Sitio público
- RF01: Mostrar información general (dirección, horario, teléfono, Instagram).
- RF02: Galería de fotos de cortes realizados.
- RF03: Listado de barberos con foto, nombre y mini biografía.
- RF04: Catálogo de servicios, con precio según el barbero elegido.
- RF05: Sección "sobre nosotros" con historia/descripción del negocio.

### Agendamiento (cliente, sin cuenta)
- RF06: Selección obligatoria de un barbero específico (no existe "sin preferencia", porque el precio depende del barbero).
- RF07: Selección de servicio, con precio y duración (45 min aprox.) según el barbero elegido.
- RF08: Mostrar horarios disponibles dentro de una ventana de **7 días** desde hoy, respetando el horario de atención y los bloqueos activos.
- RF09: Formulario de contacto con nombre, teléfono y **email obligatorio** (se usa para el recordatorio).
- RF10: Confirmar la reserva, generar un código único de gestión, y enviar:
  - Email de confirmación al cliente (con link para cancelar/reprogramar).
  - Notificación a la casilla Gmail del negocio.
- RF11: Permitir cancelar/reprogramar solo si faltan **más de 2 horas** para la cita (vía el link con el código único).
- RF12: Bloquear automáticamente los horarios ya reservados.
- RF13: Enviar un recordatorio automático por email antes de la cita.

### Panel de administración (barberos/dueño)
- RF14: Login con autenticación.
- RF15: CRUD de barberos (foto, nombre, bio, activo/inactivo).
- RF16: CRUD de servicios, con precio independiente por cada combinación barbero + servicio.
- RF17: Gestión de bloqueos: desactivar horas puntuales o días completos (cubre ausencias y feriados, que cada barbero habilita manualmente — no hay bloqueo automático de feriados).
- RF18: Listado/calendario de citas, con filtros por día, barbero y estado.
- RF19: Confirmar, cancelar o marcar como completada una cita manualmente.

## Arquitectura

- **Frontend**: Next.js (App Router) — páginas públicas con SSR/SSG para buen SEO, y rutas `/admin` protegidas.
- **Backend/BaaS**: Supabase — PostgreSQL para los datos, Auth (JWT) para el login de barberos/dueño, Storage para fotos.
- **Reglas de negocio** (evitar doble reserva, calcular disponibilidad, aplicar la regla de las 2 horas): Row Level Security + funciones en PostgreSQL, o Edge Functions para lógica más compleja.
- **Notificaciones**: un servicio de email (Resend, SendGrid, o SMTP con la misma cuenta Gmail del negocio) cubre tanto la notificación al dueño como el recordatorio y la confirmación al cliente.
- **Hosting**: Vercel para el frontend, Supabase Cloud (servicio administrado) para el backend. No se usa Docker en producción — solo aparece localmente porque la CLI de Supabase lo usa internamente para levantar el entorno de desarrollo (`supabase start`).

## Modelo de datos

| Tabla | Campos principales | Relación |
|---|---|---|
| `barberos` | id, nombre, foto_url, bio, activo | — |
| `servicios` | id, nombre, duracion_minutos, activo | — |
| `barbero_servicios` | id, barbero_id (FK), servicio_id (FK), precio | Resuelve el precio distinto por barbero |
| `bloqueos` | id, barbero_id (FK), fecha, hora_inicio, hora_fin, motivo | Hora inicio/fin vacíos = día completo bloqueado |
| `citas` | id, barbero_id (FK), servicio_id (FK), cliente_nombre, cliente_telefono, cliente_email, fecha, hora_inicio, hora_fin, estado, codigo_gestion, recordatorio_enviado | — |
| `perfiles_admin` | id, barbero_id (FK), rol | Vincula el login de Supabase Auth con un barbero |

## Estructura de carpetas

```
app/
├─ page.tsx                     → Inicio (hero + CTA a agendar)
├─ nosotros/page.tsx            → Sobre nosotros
├─ barberos/page.tsx            → Listado de barberos
├─ servicios/page.tsx           → Catálogo de servicios y precios por barbero
├─ galeria/page.tsx             → Galería de fotos de cortes
├─ agendar/page.tsx             → Flujo de reserva (barbero → servicio → hora → datos → confirmación)
├─ gestionar/[codigo]/page.tsx  → Cancelar/reprogramar cita vía el token único
│
└─ admin/
   ├─ login/page.tsx            → Login de barberos/dueño
   ├─ layout.tsx                → Verifica sesión (middleware), redirige si no hay login
   ├─ page.tsx                  → Dashboard (agenda del día)
   ├─ citas/page.tsx            → Listado/calendario de citas, con filtros
   ├─ barberos/page.tsx         → CRUD de barberos
   ├─ servicios/page.tsx        → CRUD de servicios + precio por barbero
   └─ horarios/page.tsx         → Bloqueos de horas/días por barbero

middleware.ts                   → Protege /admin/* verificando la sesión de Supabase
```

## Plan de desarrollo por etapas

**Etapa 0 — Preparación**
- Crear el proyecto Next.js y el repositorio Git.
- Crear el proyecto en Supabase y definir las variables de entorno.

**Etapa 1 — Modelo de datos y backend base**
- Crear las tablas (`barberos`, `servicios`, `barbero_servicios`, `bloqueos`, `citas`, `perfiles_admin`) en Supabase.
- Configurar las políticas de Row Level Security.
- Cargar datos iniciales: los 2 barberos y el catálogo de servicios con sus precios.

**Etapa 2 — Sitio público (contenido)**
- Construir inicio, sobre nosotros, barberos, servicios y galería.
- Integrar el logo, identidad visual y fotos que entregue la barbería.

**Etapa 3 — Flujo de agendamiento**
- Selección de barbero → servicio → cálculo de horarios disponibles (respetando el horario de atención, los bloqueos y la ventana de 7 días).
- Formulario de contacto y confirmación, con generación del código de gestión.
- Envío del email de confirmación al cliente y de la notificación al Gmail del negocio.

**Etapa 4 — Gestión de citas por el cliente**
- Página `/gestionar/[codigo]` para cancelar/reprogramar, validando la regla de las 2 horas.

**Etapa 5 — Panel de administración**
- Login y protección de rutas.
- Dashboard, CRUD de barberos y servicios (con precios), gestión de bloqueos.
- Listado/calendario de citas con acciones de cancelar o marcar como completada.

**Etapa 6 — Recordatorios automáticos**
- Job programado (Edge Function + cron) que revisa las citas próximas, envía el recordatorio por email y marca `recordatorio_enviado`.

**Etapa 7 — Pulido, pruebas y despliegue**
- Revisión responsive/mobile (la mayoría de las reservas probablemente se hagan desde el celular).
- Pruebas del flujo completo, de extremo a extremo.
- Compra del dominio y configuración DNS.
- Despliegue en Vercel conectado a Supabase Cloud en producción.

**Etapa 8 — Mejoras futuras (opcional)**
- Recordatorios por WhatsApp, si el email resulta insuficiente.
- Pago en línea (seña) al momento de agendar.
- Reseñas de clientes.

## Notas y decisiones pendientes

- El dominio web todavía no está comprado.
- El recordatorio se decidió por email en vez de WhatsApp, para evitar el trámite de verificación y el costo por mensaje de la API de WhatsApp Business.
- El pago en línea queda para una fase futura si el negocio lo requiere.
