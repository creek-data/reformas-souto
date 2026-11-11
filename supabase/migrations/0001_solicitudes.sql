-- Solicitudes de la web (calculadora, contacto y visitas).
-- Crear el proyecto de Supabase en una región de la UE (Frankfurt o París) y
-- pegar este archivo entero en SQL Editor → Run.

create extension if not exists pgcrypto;

create table if not exists public.solicitudes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- estimacion: calculadora (deja el email para ver el precio) · contacto: formulario o trabajo con visita
  tipo text not null check (tipo in ('contacto', 'estimacion')),
  estado text not null default 'nueva'
    check (estado in ('nueva', 'contactada', 'visita', 'presupuesto_enviado', 'ganada', 'perdida')),
  nombre text check (nombre is null or char_length(nombre) between 2 and 100),
  telefono text check (telefono is null or char_length(telefono) between 8 and 16),
  email text check (email is null or char_length(email) <= 160),
  codigo_postal text not null check (codigo_postal ~ '^[0-9]{5}$'),
  zona text,
  mensaje text check (char_length(mensaje) <= 2000),
  servicios text[] not null default '{}',
  lineas jsonb not null default '[]'::jsonb,
  contexto jsonb not null default '{}'::jsonb,
  estimacion_base_cents integer check (estimacion_base_cents >= 0),
  catalogo_version text,
  presupuesto_importe_cents integer check (presupuesto_importe_cents >= 0),
  notas text,
  visita_at timestamptz,
  visita_direccion text,
  visita_event_id text,
  consentimiento_version text not null,
  ip_hash text,
  user_agent text,
  -- Siempre hay forma de contactar: email (calculadora) o teléfono (contacto).
  constraint solicitudes_contacto check (email is not null or telefono is not null)
);

create index if not exists solicitudes_estado_fecha on public.solicitudes (estado, created_at desc);
create index if not exists solicitudes_visita on public.solicitudes (visita_at) where visita_at is not null;
create index if not exists solicitudes_zona on public.solicitudes (zona);

-- RLS activado y sin políticas: nadie puede leer ni escribir desde el navegador.
-- Solo el servidor de la web, con la clave service role, accede a la tabla.
alter table public.solicitudes enable row level security;

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists solicitudes_touch on public.solicitudes;
create trigger solicitudes_touch before update on public.solicitudes
  for each row execute function public.touch_updated_at();
