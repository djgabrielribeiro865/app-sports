-- ============================================================
-- app-sports · Estrutura inicial do banco (Supabase / PostgreSQL)
-- Rodar no painel do Supabase: SQL Editor → New query → colar → Run
-- ============================================================

-- Perfis: você e sua esposa. Simples por enquanto; ligamos ao login depois.
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  criado_em timestamptz not null default now()
);

-- Treinos: cada linha é um treino de um dia.
create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  esporte text not null default 'corrida',
  data date not null,
  tipo text not null,
  descricao text,
  distancia_km numeric,
  emoji text,
  concluido boolean not null default false,
  concluido_em timestamptz,
  criado_em timestamptz not null default now()
);

create index if not exists workouts_data_idx on public.workouts (data);
create index if not exists workouts_profile_idx on public.workouts (profile_id);

-- ------------------------------------------------------------
-- Segurança (RLS)
-- ATENÇÃO: políticas TEMPORÁRIAS que liberam acesso pela chave anônima,
-- porque ainda não temos login. Vamos trocar por regras seguras
-- (cada um vê só o seu) quando adicionarmos perfis/login.
-- ------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.workouts enable row level security;

drop policy if exists temp_acesso_total_profiles on public.profiles;
create policy temp_acesso_total_profiles on public.profiles
  for all using (true) with check (true);

drop policy if exists temp_acesso_total_workouts on public.workouts;
create policy temp_acesso_total_workouts on public.workouts
  for all using (true) with check (true);

-- ------------------------------------------------------------
-- Dados de exemplo (para ver o app funcionando de verdade)
-- ------------------------------------------------------------
insert into public.profiles (id, nome) values
  ('11111111-1111-1111-1111-111111111111', 'Gabriel'),
  ('22222222-2222-2222-2222-222222222222', 'Esposa')
on conflict (id) do nothing;

-- Uma semana de corrida do Gabriel (13 a 19 de julho de 2026).
insert into public.workouts (profile_id, data, tipo, descricao, distancia_km, emoji) values
  ('11111111-1111-1111-1111-111111111111', '2026-07-13', 'Descanso',     'Recuperação — sem corrida',       null, '😴'),
  ('11111111-1111-1111-1111-111111111111', '2026-07-14', 'Corrida leve', 'Ritmo confortável, conversando',     5, '🏃'),
  ('11111111-1111-1111-1111-111111111111', '2026-07-15', 'Intervalado',  '6x 400m forte + 200m trote',         6, '⚡'),
  ('11111111-1111-1111-1111-111111111111', '2026-07-16', 'Descanso',     'Alongamento leve',                null, '😴'),
  ('11111111-1111-1111-1111-111111111111', '2026-07-17', 'Corrida leve', 'Ritmo confortável',                  5, '🏃'),
  ('11111111-1111-1111-1111-111111111111', '2026-07-18', 'Longão',       'Ritmo lento e constante',           12, '🔥'),
  ('11111111-1111-1111-1111-111111111111', '2026-07-19', 'Descanso',     'Recuperação total',               null, '😴');
