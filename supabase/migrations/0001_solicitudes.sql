-- Solicitudes de la web (formulario y calculadora).
-- Región del proyecto Supabase: una región concreta de la UE (Frankfurt o París).

create extension if not exists pgcrypto;

create table if not exists public.solicitudes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  tipo text not null check (tipo in ('contacto', 'calculadora')),
  estado text not null default 'nueva'
    check (estado in ('nueva', 'contactada', 'visita', 'presupuesto_enviado', 'ganada', 'perdida')),
  nombre text not null check (char_length(nombre) between 2 and 100),
  telefono text not null check (char_length(telefono) between 8 and 16),
  email text,
  codigo_postal text not null check (codigo_postal ~ '^[0-9]{5}$'),
  mensaje text check (char_length(mensaje) <= 2000),
  servicios text[] not null default '{}',
  lineas jsonb not null default '[]'::jsonb,
  contexto jsonb not null default '{}'::jsonb,
  estimacion_base_cents integer check (estimacion_base_cents >= 0),
  catalogo_version text,
  presupuesto_importe_cents integer check (presupuesto_importe_cents >= 0),
  notas text,
  visita_at timestamptz,
  consentimiento_version text not null,
  ip_hash text,
  user_agent text
);

create index if not exists solicitudes_estado_fecha on public.solicitudes (estado, created_at desc);
create index if not exists solicitudes_cp on public.solicitudes (codigo_postal);

-- RLS activado y sin políticas para anon: solo el servidor (service role) escribe.
-- El panel privado añadirá políticas para usuarios autenticados con rol de empresa.
alter table public.solicitudes enable row level security;

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists solicitudes_touch on public.solicitudes;
create trigger solicitudes_touch before update on public.solicitudes
  for each row execute function public.touch_updated_at();
