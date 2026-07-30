-- ============================================================
-- Rai Barber Salon — Script de configuración de Supabase
-- Ejecutar completo en: Supabase Studio → SQL Editor → New query
-- ============================================================
-- Está dividido en pasos, en el mismo orden en que el README
-- describe la Etapa 1. Puedes correrlo todo de una vez.
-- ============================================================


-- ============================================================
-- PASO 1 — Extensiones necesarias
-- ============================================================
-- gen_random_uuid() -> ids únicos
-- btree_gist       -> para el constraint anti-doble-reserva del Paso 2
create extension if not exists pgcrypto;
create extension if not exists btree_gist;


-- ============================================================
-- PASO 2 — Tablas
-- ============================================================

create table public.barberos (
  id         uuid primary key default gen_random_uuid(),
  nombre     text not null,
  foto_url   text,
  bio        text,
  activo     boolean not null default true,
  creado_en  timestamptz not null default now()
);

create table public.servicios (
  id                 uuid primary key default gen_random_uuid(),
  nombre             text not null,
  duracion_minutos   integer not null default 45 check (duracion_minutos > 0),
  activo             boolean not null default true,
  creado_en          timestamptz not null default now()
);

-- Resuelve el precio distinto por barbero para un mismo servicio
create table public.barbero_servicios (
  id           uuid primary key default gen_random_uuid(),
  barbero_id   uuid not null references public.barberos(id) on delete cascade,
  servicio_id  uuid not null references public.servicios(id) on delete cascade,
  precio       integer not null check (precio >= 0),
  unique (barbero_id, servicio_id)
);

-- hora_inicio y hora_fin en null = día completo bloqueado
create table public.bloqueos (
  id           uuid primary key default gen_random_uuid(),
  barbero_id   uuid not null references public.barberos(id) on delete cascade,
  fecha        date not null,
  hora_inicio  time,
  hora_fin     time,
  motivo       text,
  creado_en    timestamptz not null default now(),
  check (
    (hora_inicio is null and hora_fin is null)
    or (hora_inicio is not null and hora_fin is not null and hora_inicio < hora_fin)
  )
);
create index bloqueos_barbero_fecha_idx on public.bloqueos (barbero_id, fecha);

create table public.citas (
  id                    uuid primary key default gen_random_uuid(),
  barbero_id            uuid not null references public.barberos(id),
  servicio_id           uuid not null references public.servicios(id),
  cliente_nombre        text not null,
  cliente_telefono      text not null,
  cliente_email         text not null,
  fecha                 date not null,
  hora_inicio           time not null,
  hora_fin              time not null,
  estado                text not null default 'pendiente'
                          check (estado in ('pendiente','confirmada','completada','cancelada')),
  codigo_gestion        uuid not null default gen_random_uuid() unique,
  recordatorio_enviado  boolean not null default false,
  creado_en             timestamptz not null default now(),
  check (hora_inicio < hora_fin)
);
create index citas_barbero_fecha_idx on public.citas (barbero_id, fecha);
create index citas_codigo_gestion_idx on public.citas (codigo_gestion);

-- Columnas generadas + constraint de exclusión: evita que dos citas del
-- mismo barbero se solapen en el tiempo, incluso si dos personas reservan
-- al mismo tiempo (esto es lo que el cálculo en el navegador NO puede
-- garantizar por sí solo — RF12 queda protegido también a nivel de base
-- de datos).
alter table public.citas
  add column inicio_ts timestamp generated always as (fecha + hora_inicio) stored,
  add column fin_ts    timestamp generated always as (fecha + hora_fin)    stored;

alter table public.citas
  add constraint citas_no_solape
  exclude using gist (
    barbero_id with =,
    tsrange(inicio_ts, fin_ts, '[)') with &&
  )
  where (estado in ('pendiente', 'confirmada'));

-- Vincula un usuario de Supabase Auth con un barbero y un rol
create table public.perfiles_admin (
  id          uuid primary key references auth.users(id) on delete cascade,
  barbero_id  uuid references public.barberos(id),
  rol         text not null default 'barbero' check (rol in ('admin','barbero')),
  creado_en   timestamptz not null default now()
);


-- ============================================================
-- PASO 3 — Función auxiliar: ¿el usuario actual es staff?
-- ============================================================
-- security definer + search_path fijo evita problemas de recursión de
-- RLS al consultar perfiles_admin desde dentro de sus propias políticas.
create or replace function public.es_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.perfiles_admin where id = auth.uid()
  );
$$;


-- ============================================================
-- PASO 4 — Row Level Security
-- ============================================================
alter table public.barberos          enable row level security;
alter table public.servicios         enable row level security;
alter table public.barbero_servicios enable row level security;
alter table public.bloqueos          enable row level security;
alter table public.citas             enable row level security;
alter table public.perfiles_admin    enable row level security;

-- barberos: público ve solo los activos; el staff ve y edita todo
create policy "lectura publica barberos activos" on public.barberos
  for select using (activo = true or public.es_admin());
create policy "admin inserta barberos" on public.barberos
  for insert with check (public.es_admin());
create policy "admin actualiza barberos" on public.barberos
  for update using (public.es_admin()) with check (public.es_admin());
create policy "admin elimina barberos" on public.barberos
  for delete using (public.es_admin());

-- servicios: mismo patrón
create policy "lectura publica servicios activos" on public.servicios
  for select using (activo = true or public.es_admin());
create policy "admin inserta servicios" on public.servicios
  for insert with check (public.es_admin());
create policy "admin actualiza servicios" on public.servicios
  for update using (public.es_admin()) with check (public.es_admin());
create policy "admin elimina servicios" on public.servicios
  for delete using (public.es_admin());

-- barbero_servicios (precios): el precio no es sensible, se puede leer libre
create policy "lectura publica precios" on public.barbero_servicios
  for select using (true);
create policy "admin inserta precios" on public.barbero_servicios
  for insert with check (public.es_admin());
create policy "admin actualiza precios" on public.barbero_servicios
  for update using (public.es_admin()) with check (public.es_admin());
create policy "admin elimina precios" on public.barbero_servicios
  for delete using (public.es_admin());

-- bloqueos: necesarios para calcular disponibilidad en el sitio público
create policy "lectura publica bloqueos" on public.bloqueos
  for select using (true);
create policy "admin inserta bloqueos" on public.bloqueos
  for insert with check (public.es_admin());
create policy "admin actualiza bloqueos" on public.bloqueos
  for update using (public.es_admin()) with check (public.es_admin());
create policy "admin elimina bloqueos" on public.bloqueos
  for delete using (public.es_admin());

-- citas: la tabla sensible.
-- - Cualquiera puede INSERTAR una cita nueva en estado 'pendiente' (RF06-RF10).
-- - Nadie (excepto el staff) puede hacer SELECT directo sobre la tabla:
--   así se evita que la anon key permita listar nombre/telefono/email de
--   todos los clientes, o enumerar códigos de gestión ajenos.
-- - El acceso público para "ver disponibilidad" y para "gestionar mi cita
--   con mi código" se hace a través de las funciones del Paso 5, que
--   exponen solo lo estrictamente necesario.
create policy "clientes crean citas" on public.citas
  for insert with check (estado = 'pendiente');
create policy "admin lee todas las citas" on public.citas
  for select using (public.es_admin());
create policy "admin actualiza citas" on public.citas
  for update using (public.es_admin()) with check (public.es_admin());

-- perfiles_admin: cada quien ve su propio perfil; solo un admin gestiona el resto
create policy "usuario ve su propio perfil" on public.perfiles_admin
  for select using (id = auth.uid());
create policy "admin inserta perfiles" on public.perfiles_admin
  for insert with check (public.es_admin());
create policy "admin actualiza perfiles" on public.perfiles_admin
  for update using (public.es_admin()) with check (public.es_admin());
create policy "admin elimina perfiles" on public.perfiles_admin
  for delete using (public.es_admin());


-- ============================================================
-- PASO 5 — Funciones RPC públicas (seguras) para citas
-- ============================================================

-- 5a) Horas ya ocupadas de un barbero en un rango de fechas.
--     Sustituye el `.from('citas').select('fecha,hora_inicio,hora_fin')`
--     que usa AgendarClient.tsx para calcular disponibilidad.
create or replace function public.horas_ocupadas(
  p_barbero_id uuid,
  p_desde date,
  p_hasta date
)
returns table (fecha date, hora_inicio time, hora_fin time)
language sql
security definer
set search_path = public
stable
as $$
  select fecha, hora_inicio, hora_fin
  from public.citas
  where barbero_id = p_barbero_id
    and estado in ('pendiente', 'confirmada')
    and fecha between p_desde and p_hasta;
$$;
revoke all on function public.horas_ocupadas(uuid, date, date) from public;
grant execute on function public.horas_ocupadas(uuid, date, date) to anon, authenticated;

-- 5b) Buscar una cita por su código de gestión (solo datos no sensibles).
--     Sustituye el `.from('citas').select('*, barberos(*), servicios(*))`
--     que usa app/gestionar/[codigo]/page.tsx.
create or replace function public.obtener_cita_por_codigo(p_codigo uuid)
returns table (
  id               uuid,
  estado           text,
  codigo_gestion   uuid,
  fecha            date,
  hora_inicio      time,
  hora_fin         time,
  barbero_nombre   text,
  servicio_nombre  text
)
language sql
security definer
set search_path = public
stable
as $$
  select c.id, c.estado, c.codigo_gestion, c.fecha, c.hora_inicio, c.hora_fin,
         b.nombre as barbero_nombre, s.nombre as servicio_nombre
  from public.citas c
  join public.barberos b on b.id = c.barbero_id
  join public.servicios s on s.id = c.servicio_id
  where c.codigo_gestion = p_codigo;
$$;
revoke all on function public.obtener_cita_por_codigo(uuid) from public;
grant execute on function public.obtener_cita_por_codigo(uuid) to anon, authenticated;

-- 5c) Cancelar una cita por su código, aplicando la regla de las 2 horas
--     también en el servidor (no solo en el navegador).
create or replace function public.cancelar_cita_por_codigo(p_codigo uuid)
returns table (ok boolean, mensaje text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cita public.citas%rowtype;
begin
  select * into v_cita from public.citas where codigo_gestion = p_codigo;

  if not found then
    return query select false, 'Cita no encontrada';
    return;
  end if;

  if v_cita.estado in ('cancelada', 'completada') then
    return query select false, 'La cita ya no se puede cancelar';
    return;
  end if;

  if (v_cita.fecha + v_cita.hora_inicio)::timestamptz - now() <= interval '2 hours' then
    return query select false, 'Solo se puede cancelar con más de 2 horas de anticipación';
    return;
  end if;

  update public.citas set estado = 'cancelada' where id = v_cita.id;
  return query select true, 'Cita cancelada';
end;
$$;
revoke all on function public.cancelar_cita_por_codigo(uuid) from public;
grant execute on function public.cancelar_cita_por_codigo(uuid) to anon, authenticated;


-- ============================================================
-- PASO 6 — Storage: bucket público para fotos de barberos y galería
-- ============================================================
insert into storage.buckets (id, name, public)
values ('fotos', 'fotos', true)
on conflict (id) do nothing;

create policy "lectura publica de fotos" on storage.objects
  for select using (bucket_id = 'fotos');
create policy "admin sube fotos" on storage.objects
  for insert with check (bucket_id = 'fotos' and public.es_admin());
create policy "admin actualiza fotos" on storage.objects
  for update using (bucket_id = 'fotos' and public.es_admin())
  with check (bucket_id = 'fotos' and public.es_admin());
create policy "admin elimina fotos" on storage.objects
  for delete using (bucket_id = 'fotos' and public.es_admin());

-- Sugerencia de organización dentro del bucket (no requiere SQL adicional):
--   fotos/barberos/<nombre>.jpg   -> foto_url de la tabla barberos
--   fotos/galeria/<archivo>.jpg   -> para cuando construyan la página /galeria


-- ============================================================
-- PASO 7 — Datos semilla (PLANTILLA — reemplaza con los datos reales)
-- ============================================================
insert into public.barberos (nombre, bio, foto_url, activo) values
  ('Nombre Barbero 1', 'Bio breve del barbero 1...', null, true),
  ('Nombre Barbero 2', 'Bio breve del barbero 2...', null, true);

insert into public.servicios (nombre, duracion_minutos, activo) values
  ('Corte de pelo', 45, true),
  ('Corte + Barba', 45, true),
  ('Afeitado clásico', 45, true);

-- Usa nombres en vez de UUIDs para no tener que copiar ids a mano.
-- Ajusta los precios de la tabla CASE según lo que definan.
with b as (select id, nombre from public.barberos),
     s as (select id, nombre from public.servicios)
insert into public.barbero_servicios (barbero_id, servicio_id, precio)
select b.id, s.id,
  case
    when s.nombre = 'Corte de pelo'     then 8000
    when s.nombre = 'Corte + Barba'     then 10000
    when s.nombre = 'Afeitado clásico'  then 6000
  end as precio
from b cross join s;


-- ============================================================
-- PASO 8 — Crear el primer usuario admin (manual, fuera de este script)
-- ============================================================
-- 1. Supabase Studio → Authentication → Users → Add user
--    (crea el email/contraseña con el que va a entrar a /admin/login).
-- 2. Copia el UUID que Supabase le asignó a ese usuario.
-- 3. Corre esto reemplazando el UUID (y el barbero_id si el admin es
--    también uno de los barberos; usa null si es solo el dueño):
--
--    insert into public.perfiles_admin (id, barbero_id, rol)
--    values ('PEGA-AQUI-EL-UUID-DEL-USUARIO', null, 'admin');
--
-- Repite el proceso por cada barbero que necesite su propio login.
