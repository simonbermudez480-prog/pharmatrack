-- ============================================================
-- PHARMATRACK — Schema inicial (MVP)
-- Ejecutá todo este script en: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- ============================================================
-- 1. TABLA: pacientes
-- Cada farmacia registra manualmente a su paciente crónico cuando
-- llega a comprar. A partir de ahí PharmaTrack programa los
-- recordatorios automáticamente.
-- ============================================================
create table if not exists public.pacientes (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,

  -- Datos del paciente
  nombre          text not null,
  telefono        text,                                 -- formato internacional: +573001234567
  email           text,
  canal_pref      text not null default 'whatsapp'      -- 'whatsapp' | 'email'
                  check (canal_pref in ('whatsapp', 'email')),

  -- Datos del tratamiento
  tratamiento     text not null,                        -- ej: "Losartán 50mg"
  posologia       text not null,                        -- ej: "1 tableta cada 12 horas"
  duracion_dias   integer not null default 30,          -- cuántos días dura el tratamiento actual

  -- Estado de seguimiento
  fecha_inicio    date not null default current_date,   -- día 0 = día de la compra
  proximo_recordatorio
                  timestamptz,                         -- calculado por PharmaTrack
  ultimo_envio    timestamptz,                          -- último mensaje disparado (control)
  recordatorios_enviados
                  integer not null default 0,
  activo          boolean not null default true,        -- pausar seguimiento

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Índices para listado rápido y consultas por usuario
create index if not exists pacientes_user_id_idx           on public.pacientes (user_id);
create index if not exists pacientes_proximo_recordatorio_idx
                                                            on public.pacientes (proximo_recordatorio)
                                                            where activo = true and proximo_recordatorio is not null;

-- ============================================================
-- 2. TABLA: recordatorios (historial y estado de cada mensaje)
-- Cada vez que PharmaTrack dispara un mensaje se inserta una fila.
-- Sirve para: evitar duplicados, ver historial y entrenar al agente IA.
-- ============================================================
create table if not exists public.recordatorios (
  id              uuid primary key default gen_random_uuid(),
  paciente_id     uuid not null references public.pacientes (id) on delete cascade,
  user_id         uuid not null references auth.users (id) on delete cascade,

  canal           text not null check (canal in ('whatsapp', 'email')),
  estado          text not null default 'programado'    -- 'programado' | 'enviado' | 'fallido' | 'respondido'
                  check (estado in ('programado', 'enviado', 'fallido', 'respondido')),

  programado_para timestamptz not null,
  enviado_en      timestamptz,
  tipo            text not null default 'recordatorio'  -- 'recordatorio' | 'seguimiento_ia' | 'alerta'
                  check (tipo in ('recordatorio', 'seguimiento_ia', 'alerta')),
  contenido       text,                                  -- mensaje enviado (para histórico IA)
  respuesta       text,                                  -- respuesta del paciente si la hay

  created_at      timestamptz not null default now()
);

create index if not exists recordatorios_paciente_id_idx     on public.recordatorios (paciente_id);
create index if not exists recordatorios_user_id_idx         on public.recordatorios (user_id);
create index if not exists recordatorios_programado_para_idx on public.recordatorios (programado_para)
                                                              where estado = 'programado';

-- ============================================================
-- 3. TRIGGER: updated_at automático
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists pacientes_set_updated_at on public.pacientes;
create trigger pacientes_set_updated_at
  before update on public.pacientes
  for each row execute function public.set_updated_at();

-- ============================================================
-- 4. FUNCIÓN: calcular próximo recordatorio
-- Regla de PharmaTrack MVP:
--   el tratamiento se acaba el día (fecha_inicio + duracion_dias).
--   el recordatorio se dispara 3 días ANTES de que se acabe,
--   y si no responde, se vuelve a recordar 1 día después y 
--   el día del vencimiento. Esa lógica la ejecuta el job que
--   envía mensajes (Edge Function / cron), acá solo dejamos
--   el primer cálculo en el INSERT.
-- ============================================================
create or replace function public.calcular_proximo_recordatorio(
  p_fecha_inicio  date,
  p_duracion_dias integer
) returns timestamptz
language sql
immutable
as $$
  -- Si la duración es <4 días, recordamos 1 día después del inicio.
  -- Si no, recordamos 3 días ANTES de que se acabe el tratamiento.
  select case
    when p_duracion_dias >= 4
      then (p_fecha_inicio + (p_duracion_dias - 3))::timestamptz
    else
      (p_fecha_inicio + 1)::timestamptz
  end
$$;

-- ============================================================
-- 5. TRIGGER: calcular proximo_recordatorio al insertar
-- ============================================================
create or replace function public.set_proximo_recordatorio()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.proximo_recordatorio is null then
    new.proximo_recordatorio := public.calcular_proximo_recordatorio(
      new.fecha_inicio, new.duracion_dias
    );
  end if;
  return new;
end;
$$;

drop trigger if exists pacientes_set_proximo on public.pacientes;
create trigger pacientes_set_proximo
  before insert on public.pacientes
  for each row execute function public.set_proximo_recordatorio();

-- ============================================================
-- 6. ROW LEVEL SECURITY — 1 farmacia = 1 cuenta (auth.uid)
-- Cada farmacia SOLO puede ver y modificar SUS pacientes.
-- ============================================================
alter table public.pacientes enable row level security;
alter table public.recordatorios enable row level security;

-- Pacientes: el usuario dueño controla todo
drop policy if exists "pacientes_owner_select" on public.pacientes;
create policy "pacientes_owner_select"
  on public.pacientes for select
  using (auth.uid() = user_id);

drop policy if exists "pacientes_owner_insert" on public.pacientes;
create policy "pacientes_owner_insert"
  on public.pacientes for insert
  with check (auth.uid() = user_id);

drop policy if exists "pacientes_owner_update" on public.pacientes;
create policy "pacientes_owner_update"
  on public.pacientes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "pacientes_owner_delete" on public.pacientes;
create policy "pacientes_owner_delete"
  on public.pacientes for delete
  using (auth.uid() = user_id);

-- Recordatorios: el dueño del paciente puede leer/insertar.
-- UPDATE e INSERT automático de envíos los hace un service role
-- (Edge Function) que saltea RLS — eso está bien.
drop policy if exists "recordatorios_owner_select" on public.recordatorios;
create policy "recordatorios_owner_select"
  on public.recordatorios for select
  using (auth.uid() = user_id);

drop policy if exists "recordatorios_owner_insert" on public.recordatorios;
create policy "recordatorios_owner_insert"
  on public.recordatorios for insert
  with check (auth.uid() = user_id);

-- ============================================================
-- 7. COMENTARIOS DE DOCUMENTACIÓN
-- ============================================================
comment on table  public.pacientes     is 'Pacientes crónicos registrados manualmente por cada farmacia.
PharmaTrack programa recordatorios automáticamente en proximo_recordatorio.';
comment on table  public.recordatorios is 'Cada mensaje que PharmaTrack dispara (recordatorio, seguimiento IA, alerta).';
comment on column public.pacientes.proximo_recordatorio
  is 'Fecha calculada por el sistema para el próximo envío automático. 3 días antes de que se acabe el tratamiento (o 1 día después del inicio si dura <4 días).';

-- ============================================================
-- FIN. Verificá con: select * from public.pacientes limit 1;
-- ============================================================

-- ============================================================
-- 8. TABLA: suscripciones (control de plan de cada farmacia)
-- Cada farmacia (usuario) tiene a lo sumo una fila activa.
-- RLS por user_id. Lógica:
--   estado = 'trial'    -> período de prueba gratuito de 14 días
--   estado = 'activa'   -> PayPal confirmó la suscripción
--   estado = 'vencida'  -> el cliente canceló o PayPal reportó fallo
-- ============================================================
create table if not exists public.suscripciones (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users (id) on delete cascade,

  -- Plan activo
  plan                text not null default 'trial'     -- 'trial' | 'basic' | 'pro' | 'business'
                      check (plan in ('trial', 'basic', 'pro', 'business')),
  estado              text not null default 'trial'     -- 'trial' | 'activa' | 'vencida' | 'cancelada'
                      check (estado in ('trial', 'activa', 'vencida', 'cancelada')),

  -- Fechas
  inicio_trial        timestamptz not null default now(),
  fin_trial           timestamptz,                       -- generado en trigger (+14 días)
  inicio_suscripcion  timestamptz,                       -- fecha primer pago en PayPal
  fin_periodo         timestamptz,                       -- próxima renovación (calculada desde PayPal webhook)

  -- Datos PayPal
  paypal_subscription_id text,                           -- ID de la suscripción en PayPal (sub-xxx)
  paypal_plan_id          text,                           -- ID del plan PayPal (P-xxx)
  paypal_email            text,                           -- email del pagador en PayPal

  -- Control del webhook
  ultimo_evento_paypal    text,                           -- tipo de último evento procesado
  ultimo_evento_en        timestamptz,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists suscripciones_user_id_idx on public.suscripciones (user_id);
create unique index if not exists suscripciones_user_id_unique_idx
  on public.suscripciones (user_id)
  where estado in ('trial', 'activa');                   -- solo una activa por usuario

-- Trigger updated_at (reutiliza la función set_updated_at ya creada)
drop trigger if exists suscripciones_set_updated_at on public.suscripciones;
create trigger suscripciones_set_updated_at
  before update on public.suscripciones
  for each row execute function public.set_updated_at();

-- Trigger: al insertar trial calcular fin_trial (+14 días)
create or replace function public.set_fin_trial()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.fin_trial is null and new.estado = 'trial' then
    new.fin_trial := new.inicio_trial + interval '14 days';
  end if;
  return new;
end;
$$;

drop trigger if exists suscripciones_set_fin_trial on public.suscripciones;
create trigger suscripciones_set_fin_trial
  before insert on public.suscripciones
  for each row execute function public.set_fin_trial();

-- RLS: cada usuario solo ve y modifica SU suscripción
alter table public.suscripciones enable row level security;

drop policy if exists "suscripciones_owner_select" on public.suscripciones;
create policy "suscripciones_owner_select"
  on public.suscripciones for select
  using (auth.uid() = user_id);

drop policy if exists "suscripciones_owner_insert" on public.suscripciones;
create policy "suscripciones_owner_insert"
  on public.suscripciones for insert
  with check (auth.uid() = user_id);

drop policy if exists "suscripciones_owner_update" on public.suscripciones;
create policy "suscripciones_owner_update"
  on public.suscripciones for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

comment on table public.suscripciones is 'Controla el plan y vigencia de cada farmacia. Una fila activa por usuario.';
comment on column public.suscripciones.fin_trial is 'Fecha fin del período de prueba (14 días desde inicio_trial).';
comment on column public.suscripciones.fin_periodo is 'Próxima renovación de PayPal. Actualizada por el webhook.';

-- ============================================================
-- 9. TRIGGER: crear trial automáticamente al registrarse un usuario
-- Cuando entra un nuevo usuario en auth.users, inserta una fila
-- en suscripciones con estado 'trial' y plan 'trial' (14 días).
-- ============================================================
create or replace function public.crear_trial_automatico()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Si ya tenía una fila (trial o activa), no la pisamos.
  if not exists (
    select 1 from public.suscripciones s where s.user_id = new.id
  ) then
    insert into public.suscripciones (user_id, plan, estado, inicio_trial)
    values (new.id, 'trial', 'trial', now());
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.crear_trial_automatico();

-- ============================================================
-- FIN DEFINITIVO
-- Comprobación completa:
--   select * from public.pacientes limit 1;
--   select * from public.suscripciones limit 1;
-- ============================================================

